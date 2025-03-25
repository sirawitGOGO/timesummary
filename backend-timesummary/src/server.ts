import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import fs from "fs";
import path from "path";
import timesheetRoutes from "./routes/timesheetRoute";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ตรวจสอบว่า GOOGLE_SERVICE_ACCOUNT_KEY ถูกตั้งค่าไว้หรือไม่
if (!process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set in environment variables.");
}

// กำหนด path สำหรับไฟล์ key.json ในเครื่องเซิร์ฟเวอร์ของ Render
const keyFilePath = path.join("/tmp", "key.json");

// แปลง Base64 กลับมาเป็น JSON และเขียนเป็นไฟล์
fs.writeFileSync(keyFilePath, Buffer.from(process.env.GOOGLE_SERVICE_ACCOUNT_KEY, "base64"));

// ตั้งค่า GOOGLE_APPLICATION_CREDENTIALS ให้ชี้ไปที่ไฟล์ที่สร้างขึ้น
process.env.GOOGLE_APPLICATION_CREDENTIALS = keyFilePath;

console.log(`Google Service Account Key written to: ${keyFilePath}`);

// ใช้ค่า GOOGLE_DRIVE_FOLDER_ID และ DATABASE_URL
const googleDriveFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
const databaseUrl = process.env.DATABASE_URL;

if (!googleDriveFolderId) {
    throw new Error("GOOGLE_DRIVE_FOLDER_ID is missing.");
}

if (!databaseUrl) {
    throw new Error("DATABASE_URL is missing.");
}

// ใช้ routes
app.use("/api/timesheet", timesheetRoutes);

const PORT = parseInt(process.env.PORT || "5000", 10);
app.listen(PORT, "0.0.0.0", () => console.log(`Server running on port ${PORT}`));
