import { useEffect, useState } from 'react';

interface EmployeeRecord {
    FirstName: string;
    LastName: string;
    DueDate: string;
    WorkStatus: string;
    Attendance: string;
}



export default function Dashboard() {
    const [data, setData] = useState<EmployeeRecord[]>([]);
    const [uploadButonLoading, setUploadButonLoading] = useState<boolean>(false);
    const [deleteButonLoading, setDeleteButonLoading] = useState<boolean>(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await fetch('http://localhost:5000/api/timesheet/getAll', { method: "GET" });
            const result = await response.json();
            setData(result);
        } catch (error) {
            console.error('Error fetching data:', error);
        }
    };

    const handleUploadCSVFromDrive = async () => {
        setUploadButonLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/timesheet/upload', { method: "POST" });
            const result = await response.json();
            console.log("Upload Response:", result);
            setData([]);
            fetchData();
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setUploadButonLoading(false);
        }
    };

    const handleDeleteAll = async () => {
        setDeleteButonLoading(true);
        try {
            const response = await fetch('http://localhost:5000/api/timesheet/deleteAll', { method: "DELETE" });
            if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
            const result = await response.json();
            console.log("Delete Response:", result);
            fetchData();
        } catch (error) {
            console.error('Error deleting data:', error);
        } finally {
            setDeleteButonLoading(false);
        }
    };

    // กรองข้อมูล
    const wfoEmployees = data.filter((record) => record.WorkStatus === 'WFO');
    const wfhEmployees = data.filter((record) => record.WorkStatus === 'WFH');
    const absentEmployees = data.filter((record) => record.Attendance === 'Absent');

    return (
        <div className="flex flex-col justify-center items-center px-4 sm:px-8">
            <div className="w-full max-w-6xl bg-white p-6 my-10 shadow-md rounded-md">
                <div className="text-center">
                    <h1 className="text-3xl sm:text-4xl font-bold text-blue-500">Dashboard Employee Timesheet</h1>
                    <p className="text-gray-700 text-sm sm:text-base mt-2">ดึงข้อมูล timesheet จาก Google Drive</p>
                </div>

                {/* ปุ่มควบคุม */}
                <div className="flex flex-wrap justify-center items-center gap-4 mt-4">
                    <button
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
                        onClick={handleUploadCSVFromDrive}
                    >
                        {uploadButonLoading ? 'กำลังดึงข้อมูล...' : 'ดึงข้อมูล'}
                    </button>
                    <button
                        className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded w-full sm:w-auto"
                        onClick={handleDeleteAll}
                    >
                        {deleteButonLoading ? 'กำลังลบข้อมูล...' : 'ลบข้อมูล'}
                    </button>
                </div>

                {/* ตาราง */}
                {[
                    { title: "พนักงาน Work From Office", data: wfoEmployees },
                    { title: "พนักงาน Work From Home", data: wfhEmployees },
                    { title: "พนักงานที่ลา", data: absentEmployees }
                ].map(({ title, data }, index) => (
                    <div key={index} className="mt-6">
                        <h2 className="text-lg font-bold text-gray-700">{title}</h2>
                        <div className="overflow-x-auto">
                            <table className="w-full border border-gray-300 shadow-md rounded-lg overflow-hidden">
                                <thead>
                                    <tr className="bg-blue-500 text-white text-sm sm:text-base">
                                        <th className="border border-gray-300 p-3">ชื่อพนักงาน</th>
                                        <th className="border border-gray-300 p-3">วันที่</th>
                                        {title !== "พนักงานที่ลา" && <th className="border border-gray-300 p-3">ลักษณะการเข้างาน</th>}
                                    </tr>
                                </thead>
                                <tbody>
                                    {data.map((employee, i) => (
                                        <tr key={i} className="text-sm sm:text-base">
                                            <td className="border border-gray-300 p-3 text-center">{`${employee.FirstName} ${employee.LastName}`}</td>
                                            <td className="border border-gray-300 p-3 text-center">{employee.DueDate}</td>
                                            {title !== "พนักงานที่ลา" && <td className="border border-gray-300 p-3 text-center">{employee.Attendance}</td>}
                                        </tr>
                                    ))}
                                    {data.length === 0 && (
                                        <tr>
                                            <td colSpan={title === "พนักงานที่ลา" ? 2 : 3} className="text-center p-3 text-gray-500">
                                                ไม่มีข้อมูล
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

