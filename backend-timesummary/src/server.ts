import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import timesheetRoutes from "./routes/timesheetRoute";

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/timesheet", timesheetRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
