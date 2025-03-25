import express from "express";
import { uploadFileAndProcess, getAllTimeSummaries, deleteAllTimeSummaries } from "../controllers/timesheetController";

const router = express.Router();

router.post("/upload", uploadFileAndProcess);
router.get("/getAll", getAllTimeSummaries); // ดึงข้อมูลทั้งหมด
router.delete("/deleteAll", deleteAllTimeSummaries);

export default router;
