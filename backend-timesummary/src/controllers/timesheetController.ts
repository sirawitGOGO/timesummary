import { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import xlsx from "xlsx";
import { Request, Response } from "express";
import dotenv from "dotenv";
import multer from "multer"; // เพิ่ม multer
import fs from "fs";

dotenv.config();
const prisma = new PrismaClient();

// กำหนดการตั้งค่า storage สำหรับ multer
const storage = multer.memoryStorage(); // เก็บไฟล์ในหน่วยความจำ
const upload = multer({ storage: storage });

const auth = new google.auth.GoogleAuth({
    credentials: JSON.parse(fs.readFileSync(process.env.GOOGLE_APPLICATION_CREDENTIALS!, "utf-8")),
    scopes: ["https://www.googleapis.com/auth/drive"],
});

const drive = google.drive({ version: "v3", auth });

// ฟังก์ชันประมวลผลไฟล์จาก Google Drive
const processFilesFromGoogleDrive = async () => {
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (!folderId) {
        throw new Error("folderId จำเป็นต้องมี");
    }

    // ดึงไฟล์ทั้งหมดในโฟลเดอร์
    const response = await drive.files.list({
        q: `'${folderId}' in parents`,
        fields: "files(id, name)",
    });

    const files = response.data.files;
    if (!files || files.length === 0) {
        throw new Error("ไม่พบไฟล์ในโฟลเดอร์นี้");
    }

    let allRecords: {
        FirstName: string;
        LastName: string;
        DueDate: string;
        WorkStatus: string;
        Attendance: string;
    }[] = [];

    // ประมวลผลไฟล์จาก Google Drive
    for (const file of files) {
        try {
            const fileId = file.id;
            const fileName = file.name;

            if (!fileId) {
                throw new Error(`Invalid fileId for file: ${fileName}`);
            }

            // ดึงข้อมูลไฟล์แบบสตรีมจาก Google Drive
            const fileData = await drive.files.get({ fileId, alt: "media" }, { responseType: "stream" });

            const chunks: any[] = [];
            await new Promise<void>((resolve, reject) => {
                fileData.data.on('data', chunk => chunks.push(chunk));
                fileData.data.on('end', () => {
                    try {
                        const buffer = Buffer.concat(chunks);
                        const workbook = xlsx.read(buffer, { type: "buffer" });
                        const sheet = workbook.Sheets[workbook.SheetNames[0]];
                        const jsonData = xlsx.utils.sheet_to_json<{ [key: string]: any }>(sheet);

                        const records = jsonData.map((row) => {
                            const dueDate = row["DueDate"] instanceof Date
                                ? row["DueDate"].toLocaleDateString() // ถ้าเป็นวันที่แล้ว
                                : new Date((row["DueDate"] - (25567 + 2)) * 86400 * 1000).toLocaleDateString(); // ถ้าเป็นตัวเลข Excel Serial Date
                            return {
                                FirstName: row["FirstName"],
                                LastName: row["LastName"],
                                DueDate: dueDate,
                                WorkStatus: row["WorkStatus"],
                                Attendance: row["Attendance"],
                            };
                        });

                        allRecords.push(...records);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                });

                fileData.data.on('error', (err: Error) => {
                    console.error(`Error reading file ${fileName}:`, err);
                    reject(err);
                });
            });
        } catch (error) {
            console.error(`Error processing file ${file.id}:`, error);
        }
    }

    return allRecords;
};

// API สำหรับรับไฟล์และประมวลผล
export const uploadFileAndProcess = [
    upload.single('file'), // กำหนดให้รับไฟล์ที่มีชื่อว่า 'file'
    async (req: Request, res: Response) => {
        try {
            let allRecords: any[] = [];

            // ประมวลผลไฟล์จาก Google Drive
            const driveRecords = await processFilesFromGoogleDrive();
            allRecords = allRecords.concat(driveRecords);

            // ตรวจสอบว่าไฟล์ถูกอัปโหลดมาหรือไม่
            if (req.file) {
                const buffer = req.file.buffer; // รับข้อมูลไฟล์จาก memoryStorage

                const workbook = xlsx.read(buffer, { type: "buffer" });
                const sheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = xlsx.utils.sheet_to_json<{ [key: string]: any }>(sheet);

                // แปลงข้อมูลและรวมกับ records ทั้งหมด
                const uploadedFileRecords = jsonData.map((row) => {
                    const dueDate = row["DueDate"] instanceof Date
                        ? row["DueDate"].toLocaleDateString() // ถ้าเป็นวันที่แล้ว
                        : new Date((row["DueDate"] - (25567 + 2)) * 86400 * 1000).toLocaleDateString(); // ถ้าเป็นตัวเลข Excel Serial Date
                    return {
                        FirstName: row["FirstName"],
                        LastName: row["LastName"],
                        DueDate: dueDate,
                        WorkStatus: row["WorkStatus"],
                        Attendance: row["Attendance"],
                    };
                });

                allRecords = allRecords.concat(uploadedFileRecords);
            }

            // บันทึกข้อมูลลง PostgreSQL ถ้ามีข้อมูล
            if (allRecords.length > 0) {
                await prisma.timeSummary.createMany({ data: allRecords });
            }

            res.status(200).json({ message: "อัปโหลดข้อมูลสำเร็จ", totalRecords: allRecords.length });
        } catch (error) {
            console.error("Error processing uploaded file:", error);
            res.status(500).json({ error: "Internal Server Error" });
        }
    },
];

export const getAllTimeSummaries = async (req: Request, res: Response) => {
    try {
        const summaries = await prisma.timeSummary.findMany({
            orderBy: { DueDate: "desc" },
        });
        res.json(summaries);
    } catch (error) {
        console.error("Error fetching data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};

export const deleteAllTimeSummaries = async (req: Request, res: Response) => {
    try {
        await prisma.timeSummary.deleteMany();
        res.status(200).json({ message: "ลบข้อมูลทั้งหมดสำเร็จ" });
    } catch (error) {
        console.error("Error deleting data:", error);
        res.status(500).json({ error: "Internal Server Error" });
    }
};