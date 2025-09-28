"use client";

import { useState, useEffect, useMemo } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { CameraData, VehicleCountResponse } from "./lib/vehicleCount";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function VehicleDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [data, setData] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [dailyCurrentPage, setDailyCurrentPage] = useState<number>(0);
  const [dailyChartRawData, setDailyChartRawData] = useState<CameraData[]>([]);

  // แปลงข้อมูลสำหรับตาราง
  const allRows = useMemo(() => {
    return data.flatMap((camera) =>
      camera.details.map((detail) => ({
        camera_id: camera.camera_id,
        gate_id: camera.gate_id,
        vehicle_type_id: detail.vehicle_type_id,
        vehicle_type_name: detail.vehicle_type_name,
        direction_type_id: detail.direction_type_id,
        direction_type_name: detail.direction_type_name,
        count: detail.count,
      }))
    );
  }, [data]);

  // Pagination settings
  const rowsPerPage = 10;
  const totalPages = Math.ceil(allRows.length / rowsPerPage);

  // ข้อมูลสำหรับหน้าปัจจุบัน
  const paginatedRows = useMemo(() => {
    return allRows.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );
  }, [allRows, currentPage]);

  // สร้าง chartData จากข้อมูลจริง
  const chartData = useMemo(() => {
    // คำนวณจำนวนยานพาหนะแต่ละประเภทสำหรับทิศทางเข้า
    const carIn = data.reduce((sum, camera) => {
      const carInCount = camera.details
        .filter(
          (d) => d.vehicle_type_name === "car" && d.direction_type_name === "in"
        )
        .reduce((s, d) => s + d.count, 0);
      return sum + carInCount;
    }, 0);

    const carOut = data.reduce((sum, camera) => {
      const carOutCount = camera.details
        .filter(
          (d) =>
            d.vehicle_type_name === "car" && d.direction_type_name === "out"
        )
        .reduce((s, d) => s + d.count, 0);
      return sum + carOutCount;
    }, 0);

    const motorcycleIn = data.reduce((sum, camera) => {
      const mcInCount = camera.details
        .filter(
          (d) =>
            d.vehicle_type_name === "motorcycle" &&
            d.direction_type_name === "in"
        )
        .reduce((s, d) => s + d.count, 0);
      return sum + mcInCount;
    }, 0);

    const motorcycleOut = data.reduce((sum, camera) => {
      const mcOutCount = camera.details
        .filter(
          (d) =>
            d.vehicle_type_name === "motorcycle" &&
            d.direction_type_name === "out"
        )
        .reduce((s, d) => s + d.count, 0);
      return sum + mcOutCount;
    }, 0);

    const busIn = data.reduce((sum, camera) => {
      const busInCount = camera.details
        .filter(
          (d) => d.vehicle_type_name === "bus" && d.direction_type_name === "in"
        )
        .reduce((s, d) => s + d.count, 0);
      return sum + busInCount;
    }, 0);

    const busOut = data.reduce((sum, camera) => {
      const busOutCount = camera.details
        .filter(
          (d) =>
            d.vehicle_type_name === "bus" && d.direction_type_name === "out"
        )
        .reduce((s, d) => s + d.count, 0);
      return sum + busOutCount;
    }, 0);

    return {
      labels: ["รถยนต์", "จักรยานยนต์", "รถบัส"],
      datasets: [
        {
          label: "เข้า",
          data: [carIn, motorcycleIn, busIn],
          backgroundColor: "#3b82f6",
          borderRadius: 10, // ทำให้ bar โค้งมนเต็มความสูง
          barPercentage: 1, // ให้เต็มช่อง category
          categoryPercentage: 0.6, // ช่องว่างระหว่าง category
        },
        {
          label: "ออก",
          data: [carOut, motorcycleOut, busOut],
          backgroundColor: "#ec4899",
          borderRadius: 10,
          barPercentage: 1,
          categoryPercentage: 0.6,
        },
      ],
    };
  }, [data]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, // เพิ่มบรรทัดนี้
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { size: 16, family: "Prompt, sans-serif" },
          color: "#22223b",
          boxWidth: 20,
          boxHeight: 14,
        },
      },
      title: {
        display: true,
        font: {
          size: 20,
          family: "Prompt, sans-serif",
          weight: "bold" as "bold",
        },
        color: "#22223b",
        padding: { top: 10, bottom: 10 },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#22223b",
        bodyColor: "#22223b",
        borderColor: "#a5b4fc",
        borderWidth: 1,
        titleFont: { family: "Prompt, sans-serif", size: 14 },
        bodyFont: { family: "Prompt, sans-serif", size: 14 },
        padding: 10,
        cornerRadius: 6,
        mode: "index" as const,
        intersect: false,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 14, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        title: {
          display: true,
          text: "จำนวน (คัน)",
          font: { size: 16, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        grid: {
          color: "rgba(0,0,0,0.05)",
        },
      },
      x: {
        ticks: {
          font: { size: 14, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        title: {
          display: true,
          text: "ประเภทยานพาหนะ",
          font: { size: 16, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        grid: { display: false },
      },
    },
  };

  // ดึงข้อมูลรายวันด้วย fetchDailyData
  useEffect(() => {
    const fetchDailyChartData = async () => {
      // สร้างรายการวันทั้งหมดในช่วงที่เลือก
      const generateDateRange = (start: string, end: string) => {
        const dates = [];
        const currentDate = new Date(start);
        const endDateObj = new Date(end);
        while (currentDate <= endDateObj) {
          dates.push(currentDate.toISOString().slice(0, 10));
          currentDate.setDate(currentDate.getDate() + 1);
        }
        return dates;
      };
      const dateRange = generateDateRange(startDate, endDate);
      if (dateRange.length === 0) {
        setDailyChartRawData([]);
        return;
      }
      const currentDay =
        dateRange[
          Math.min(Math.max(0, dailyCurrentPage), dateRange.length - 1)
        ];
      const gates = [1, 2, 3, 4];
      try {
        const allData = await Promise.all(
          gates.map((gateId) => fetchDailyData(gateId, currentDay))
        );
        const combinedData = allData.flat();
        setDailyChartRawData(combinedData);
      } catch (err) {
        setError("เกิดข้อผิดพลาดในการดึงข้อมูลรายวัน");
        setDailyChartRawData([]);
      }
    };
    if (startDate && endDate) {
      fetchDailyChartData();
    }
  }, [dailyCurrentPage, startDate, endDate]);

  // สร้าง dailyChartData จาก dailyChartRawData
  const dailyChartData = useMemo(() => {
    // สร้างรายการวันทั้งหมดในช่วงที่เลือก
    const generateDateRange = (start: string, end: string) => {
      const dates = [];
      const currentDate = new Date(start);
      const endDateObj = new Date(end);
      while (currentDate <= endDateObj) {
        dates.push(currentDate.toISOString().slice(0, 10));
        currentDate.setDate(currentDate.getDate() + 1);
      }
      return dates;
    };
    const dateRange = generateDateRange(startDate, endDate);
    if (dateRange.length === 0) {
      return {
        labels: [],
        datasets: [],
        totalPages: 0,
        totalDays: 0,
        currentDay: "",
        currentDayIndex: 0,
      };
    }
    const allDays = dateRange.sort();
    const validCurrentPage = Math.min(
      Math.max(0, dailyCurrentPage),
      allDays.length - 1
    );
    const currentDay = allDays[validCurrentPage] || allDays[0];

    // รวมข้อมูลจาก dailyChartRawData เฉพาะวันนั้น
    let car = 0,
      motorcycle = 0,
      bus = 0;
    dailyChartRawData.forEach((camera) => {
      camera.details.forEach((detail) => {
        if (detail.vehicle_type_name === "car") car += detail.count;
        if (detail.vehicle_type_name === "motorcycle")
          motorcycle += detail.count;
        if (detail.vehicle_type_name === "bus") bus += detail.count;
      });
    });

    return {
      labels: [currentDay],
      datasets: [
        {
          label: "รถยนต์",
          data: [car],
          backgroundColor: "rgba(54, 162, 235, 0.8)",
          borderRadius: 8,
        },
        {
          label: "จักรยานยนต์",
          data: [motorcycle],
          backgroundColor: "rgba(75, 192, 192, 0.8)",
          borderRadius: 8,
        },
        {
          label: "รถบัส",
          data: [bus],
          backgroundColor: "rgba(255, 159, 64, 0.8)",
          borderRadius: 8,
        },
      ],
      totalPages: allDays.length,
      totalDays: allDays.length,
      currentDay: currentDay,
      currentDayIndex: validCurrentPage + 1,
    };
  }, [dailyChartRawData, dailyCurrentPage, startDate, endDate]);

  // ฟังก์ชันดึงข้อมูลจากแต่ละประตู
  const fetchGateData = async (gateId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5678/webhook/vehicle_count/all?type=gate&id=${gateId}&start=${startDate}&stop=${endDate}`
      );
      if (!response.ok) {
        setError(`เชื่อมต่อข้อมูลประตู ${gateId} ไม่สำเร็จ`);
        return [];
      }
      const text = await response.text();
      if (!text) {
        return [];
      }
      const result: VehicleCountResponse[] = JSON.parse(text);
      return result[0]?.data || [];
    } catch (error) {
      setError(`เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ (${gateId})`);
      return [];
    }
  };

  // ฟังก์ชันดึงข้อมูลรายวัน
  const fetchDailyData = async (gateId: number, currentDay: string) => {
    try {
      const response = await fetch(
        `http://localhost:5678/webhook/vehicle_count/all?type=gate&id=${gateId}&start=${currentDay}&stop=${currentDay}`
      );
      if (!response.ok) {
        setError(`เชื่อมต่อข้อมูลรายวันประตู ${gateId} ไม่สำเร็จ`);
        return [];
      }
      const text = await response.text();
      if (!text) {
        return [];
      }
      const result: VehicleCountResponse[] = JSON.parse(text);
      return result[0]?.data || [];
    } catch (error) {
      setError(`เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์ (รายวัน ${gateId})`);
      return [];
    }
  };

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError("กรุณาเลือกวันที่");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const gates = [1, 2, 3, 4];
      const allData = await Promise.all(gates.map(fetchGateData));
      const combinedData = allData.flat();

      setData(combinedData); // ใช้ข้อมูลที่มี date แล้ว
    } catch (error) {
      console.error("Error fetching data:", error);
      setError("เกิดข้อผิดพลาดในการดึงข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getCameraVehicleCount = (
    cameraId: number,
    vehicleType: string,
    direction: string
  ): number => {
    const camera = data.find((c) => c.camera_id === cameraId);
    if (!camera) return 0;

    const detail = camera.details.find(
      (d) =>
        d.vehicle_type_name === vehicleType &&
        d.direction_type_name === direction
    );
    return detail?.count || 0;
  };

  // รวมยอดแต่ละประเภท
  const totalCar = data.reduce(
    (sum, camera) =>
      sum +
      (camera.details.find(
        (d) => d.vehicle_type_name === "car" && d.direction_type_name === "in"
      )?.count || 0) +
      (camera.details.find(
        (d) => d.vehicle_type_name === "car" && d.direction_type_name === "out"
      )?.count || 0),
    0
  );

  const totalMotorcycle = data.reduce(
    (sum, camera) =>
      sum +
      (camera.details.find(
        (d) =>
          d.vehicle_type_name === "motorcycle" && d.direction_type_name === "in"
      )?.count || 0) +
      (camera.details.find(
        (d) =>
          d.vehicle_type_name === "motorcycle" &&
          d.direction_type_name === "out"
      )?.count || 0),
    0
  );

  const totalBus = data.reduce(
    (sum, camera) =>
      sum +
      (camera.details.find(
        (d) => d.vehicle_type_name === "bus" && d.direction_type_name === "in"
      )?.count || 0) +
      (camera.details.find(
        (d) => d.vehicle_type_name === "bus" && d.direction_type_name === "out"
      )?.count || 0),
    0
  );

  return (
    <div>
      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto w-full">
        {/* Header */}
        <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl p-8 mb-8 border border-blue-200 flex flex-col items-center justify-center gap-8 relative overflow-hidden">
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-10 -left-10 w-60 h-60 bg-gradient-to-br from-blue-300/30 via-purple-300/20 to-pink-300/20 rounded-full blur-2xl"></div>
            <div className="absolute -bottom-10 -right-10 w-60 h-60 bg-gradient-to-br from-pink-300/30 via-purple-300/20 to-blue-300/20 rounded-full blur-2xl"></div>
          </div>
          <div className="z-10 flex-1 min-w-[300px] w-full flex flex-col items-center">
            <h1 className="text-5xl font-extrabold text-gray-900 mb-6 drop-shadow-lg text-center">
              Dashboard{" "}
              <span className="font-extrabold text-gray-700">
                การนับจำนวนยานพาหนะ
              </span>
            </h1>
            <div className="flex flex-wrap gap-6 items-end justify-center w-full">
              <div className="relative flex flex-col items-center">
                <label className="block text-sm font-semibold text-blue-700 mb-2 tracking-wide text-center">
                  วันที่เริ่มต้น
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="border-2 border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-sm transition-all duration-200 bg-white/70 hover:border-blue-400 focus:border-pink-400 text-gray-700 font-medium text-center"
                />
              </div>
              <div className="relative flex flex-col items-center">
                <label className="block text-sm font-semibold text-blue-700 mb-2 tracking-wide text-center">
                  วันที่สิ้นสุด
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="border-2 border-blue-200 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-pink-400 shadow-sm transition-all duration-200 bg-white/70 hover:border-blue-400 focus:border-pink-400 text-gray-700 font-medium text-center"
                />
              </div>
              <button
                onClick={fetchData}
                disabled={loading}
                className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white px-10 py-2 rounded-lg font-bold shadow-lg hover:scale-105 hover:shadow-2xl hover:brightness-110 focus:ring-4 focus:ring-pink-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-lg tracking-wide"
              >
                {loading ? "กำลังโหลด..." : "ค้นหา"}
              </button>
            </div>
            {error && (
              <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-lg shadow text-center font-bold">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="flex flex-wrap justify-center gap-12 mb-14">
        <div className="bg-gradient-to-br from-blue-400 to-blue-600 text-white rounded-3xl p-12 shadow-2xl min-w-[390px] flex flex-col items-center scale-100">
          <h3 className="text-2xl font-semibold mb-4 tracking-wide text-center">
            รถยนต์
          </h3>
          <p className="text-6xl font-extrabold drop-shadow-lg text-center">
            {totalCar}
          </p>
        </div>
        <div className="bg-gradient-to-br from-purple-400 to-pink-500 text-white rounded-3xl p-12 shadow-2xl min-w-[390px] flex flex-col items-center scale-100">
          <h3 className="text-2xl font-semibold mb-4 tracking-wide text-center">
            รถจักรยานยนต์
          </h3>
          <p className="text-6xl font-extrabold drop-shadow-lg text-center">
            {totalMotorcycle}
          </p>
        </div>
        <div className="bg-gradient-to-br from-orange-400 to-yellow-500 text-white rounded-3xl p-12 shadow-2xl min-w-[390px] flex flex-col items-center scale-100">
          <h3 className="text-2xl font-semibold mb-4 tracking-wide text-center">
            รถบัส
          </h3>
          <p className="text-6xl font-extrabold drop-shadow-lg text-center">
            {totalBus}
          </p>
        </div>
      </div>

      {/* Camera Grid */}
      <div className="bg-white/60 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-purple-200">
        <h2 className="text-3xl font-extrabold text-purple-700 mb-12 tracking-wide">
          แสดงผลยานพาหนะเข้า - ออก ของแต่ละประตู
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {[1, 2, 3, 4].map((gateId) => {
            const gateCameras = data.filter(
              (camera) => camera.gate_id === gateId
            );

            return (
              <div
                key={gateId}
                className="border border-blue-200 rounded-2xl p-6 bg-gradient-to-br from-white/80 to-blue-50 shadow-lg hover:shadow-2xl transition-all duration-200"
              >
                <h3 className="text-xl font-bold text-blue-700 mb-4 flex items-center">
                  <span className="w-3 h-3 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full mr-2"></span>
                  ประตู {gateId}
                </h3>

                {gateCameras.length > 0 ? (
                  <div className="space-y-3">
                    {gateCameras.map((camera) => (
                      <div
                        key={camera.camera_id}
                        className="bg-gray-50 rounded-md p-3"
                      >
                        <h4
                          onClick={() =>
                            (window.location.href = `/report?cameraId=${camera.camera_id}&start=${startDate}&stop=${endDate}`)
                          }
                          className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-blue-600"
                        >
                          กล้อง {camera.camera_id}
                        </h4>

                        <div className="grid grid-cols-2 gap-3 text-sm">
                          {/* รถยนต์ */}
                          <div className="bg-blue-100/80 p-3 rounded-lg shadow-sm">
                            <div className="font-medium text-blue-800">
                              รถยนต์
                            </div>
                            <div className="text-blue-600 font-bold">
                              เข้า:{" "}
                              {getCameraVehicleCount(
                                camera.camera_id,
                                "car",
                                "in"
                              )}{" "}
                              | ออก:{" "}
                              {getCameraVehicleCount(
                                camera.camera_id,
                                "car",
                                "out"
                              )}
                            </div>
                          </div>

                          {/* จักรยานยนต์ */}
                          <div className="bg-green-100/80 p-3 rounded-lg shadow-sm">
                            <div className="font-medium text-green-800">
                              จักรยานยนต์
                            </div>
                            <div className="text-green-600 font-bold">
                              เข้า:{" "}
                              {getCameraVehicleCount(
                                camera.camera_id,
                                "motorcycle",
                                "in"
                              )}{" "}
                              | ออก:{" "}
                              {getCameraVehicleCount(
                                camera.camera_id,
                                "motorcycle",
                                "out"
                              )}
                            </div>
                          </div>

                          {/* รถบัส */}
                          <div className="bg-gradient-to-r from-purple-100/80 to-pink-100/80 p-3 rounded-lg shadow-sm col-span-2">
                            <div className="font-medium text-purple-800">
                              รถบัส
                            </div>
                            <div className="text-purple-600 font-bold">
                              เข้า:{" "}
                              {getCameraVehicleCount(
                                camera.camera_id,
                                "bus",
                                "in"
                              )}{" "}
                              | ออก:{" "}
                              {getCameraVehicleCount(
                                camera.camera_id,
                                "bus",
                                "out"
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4 text-gray-400 italic">
                    ไม่มีข้อมูลกล้องในประตูนี้
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Data Table */}
      <div className="bg-white/70 rounded-2xl shadow-2xl p-8 mt-10 border border-pink-200">
        <h2 className="text-3xl font-extrabold text-pink-700 mb-8 tracking-wide">
          ตารางข้อมูลยานพาหนะเข้า - ออกทั้งหมด
        </h2>
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto rounded-xl overflow-hidden shadow-lg">
            <thead className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-bold text-blue-700 uppercase tracking-wider">
                  กล้อง
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-purple-700 uppercase tracking-wider">
                  ประเภทยานพาหนะ
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-pink-700 uppercase tracking-wider">
                  ทิศทาง
                </th>
                <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  จำนวน
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedRows.map((row, idx) => (
                <tr
                  key={`${row.camera_id}-${row.vehicle_type_id}-${row.direction_type_id}-${idx}`}
                  className="hover:bg-blue-50/50 transition-all"
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-blue-700">
                    Camera {row.camera_id}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-purple-700 font-semibold">
                    {row.vehicle_type_name === "car"
                      ? "รถยนต์"
                      : row.vehicle_type_name === "motorcycle"
                      ? "จักรยานยนต์"
                      : row.vehicle_type_name === "bus"
                      ? "รถบัส"
                      : row.vehicle_type_name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-pink-700 font-semibold">
                    {row.direction_type_name === "in" ? "เข้า" : "ออก"}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-extrabold text-gray-900">
                    {row.count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {allRows.length === 0 && (
            <div className="text-center py-8 text-gray-400 italic">
              ไม่มีข้อมูล
            </div>
          )}
        </div>
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-4 mt-6">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 rounded bg-orange-400 text-white font-bold shadow hover:bg-orange-500 disabled:opacity-50"
            >
              {"<"} ก่อนหน้า
            </button>
            <span className="font-semibold text-lg">
              หน้า {currentPage} / {totalPages}
            </span>
            <button
              onClick={() =>
                setCurrentPage(Math.min(totalPages, currentPage + 1))
              }
              disabled={currentPage === totalPages}
              className="px-4 py-2 rounded bg-orange-400 text-white font-bold shadow hover:bg-orange-500 disabled:opacity-50"
            >
              หน้าถัดไป {">"}
            </button>
          </div>
        )}
        {/* Summary Chart */}
        {/* Wrapper ให้กราฟ 2 อันอยู่ข้างกัน */}
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8 mt-14 mb-20">
          {/* กราฟแรก */}
          <div
            className="bg-white/80 rounded-3xl shadow-2xl p-8 border border-blue-100"
            style={{
              minHeight: 600,
              height: "100%", // เพิ่มบรรทัดนี้
              backdropFilter: "blur(8px)",
              boxShadow: "0 16px 56px 0 rgba(31, 38, 135, 0.22)",
            }}
          >
            <div className="h-full flex flex-col">
              {" "}
              {/* เพิ่ม wrapper div */}
              <h2 className="text-2xl font-bold text-blue-700 mb-6 text-center">
                สถิติจำนวนยานพาหนะเข้าออก
              </h2>
              <div className="flex-1" style={{ minHeight: 500 }}>
                {" "}
                {/* ปรับ container ของกราฟ */}
                <Bar data={chartData} options={chartOptions} />
              </div>
            </div>
          </div>

          {/* กราฟรายวัน */}
          {dailyChartData.totalPages > 0 && (
            <div
              className="bg-white/80 rounded-3xl shadow-2xl p-8 border border-green-100"
              style={{
                minHeight: 600,
                backdropFilter: "blur(8px)",
                boxShadow: "0 16px 56px 0 rgba(31, 38, 135, 0.22)",
              }}
            >
              <h2 className="text-2xl font-bold text-green-700 mb-6 text-center">
                สถิติจำนวนยานพาหนะแต่ละวัน
              </h2>

              <div style={{ height: 500 }}>
                <Bar
                  data={dailyChartData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                        labels: {
                          font: { size: 18, family: "Prompt, sans-serif" },
                          color: "#22223b",
                          usePointStyle: true,
                          pointStyle: "rect",
                          boxWidth: 20,
                          boxHeight: 14,
                        },
                      },
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          stepSize: 20,
                          font: { size: 14, family: "Prompt, sans-serif" },
                          color: "#22223b",
                        },
                        title: {
                          display: true,
                          text: "จำนวน (คัน)",
                          font: { size: 16, family: "Prompt, sans-serif" },
                          color: "#22223b",
                        },
                        grid: {
                          color: "rgba(0,0,0,0.05)",
                        },
                      },
                      x: {
                        ticks: {
                          font: { size: 14, family: "Prompt, sans-serif" },
                          color: "#22223b",
                        },
                        title: {
                          display: true,
                          text: "วันที่",
                          font: { size: 16, family: "Prompt, sans-serif" },
                          color: "#22223b",
                        },
                        grid: {
                          display: false,
                        },
                      },
                    },
                  }}
                />
              </div>

              {/* ปุ่มควบคุมสำหรับกราฟรายวัน - แสดงตลอดเวลา */}
              <div className="flex justify-center items-center gap-4 mt-8">
                <button
                  onClick={() => {
                    const newPage = Math.max(0, dailyCurrentPage - 1);
                    setDailyCurrentPage(newPage);
                  }}
                  disabled={dailyCurrentPage === 0}
                  className="px-6 py-3 rounded-xl bg-orange-200 hover:bg-orange-300 text-orange-800 font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
                >
                  <span className="text-lg">←</span>
                  <span>วันก่อนหน้า</span>
                </button>
                <button
                  onClick={() => {
                    const newPage = Math.min(
                      dailyChartData.totalPages - 1,
                      dailyCurrentPage + 1
                    );
                    setDailyCurrentPage(newPage);
                  }}
                  disabled={dailyCurrentPage >= dailyChartData.totalPages - 1}
                  className="px-6 py-3 rounded-xl bg-orange-400 hover:bg-orange-500 text-white font-medium shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 min-w-[120px] justify-center"
                >
                  <span>วันถัดไป</span>
                  <span className="text-lg">→</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
