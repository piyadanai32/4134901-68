"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function CameraReport() {
  const searchParams = useSearchParams();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const fetchData = async () => {
      const cameraId = searchParams.get('cameraId');
      const start = searchParams.get('start');
      const stop = searchParams.get('stop');

      if (!cameraId || !start || !stop) {
        setError('Missing required parameters');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:5678/webhook/vehicle_count/all?type=camera&id=${cameraId}&start=${start}&stop=${stop}`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const text = await response.text();
        if (!text) {
          throw new Error('Empty response received');
        }
        const result = JSON.parse(text);
        if (!result || !Array.isArray(result) || !result[0]?.data || !result[0].data[0]) {
          throw new Error('No data available for this camera');
        }
        setData(result[0].data[0]);
      } catch (err) {
        setError('Failed to fetch camera data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [searchParams]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">กำลังโหลดข้อมูล...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">ไม่พบข้อมูล</div>
      </div>
    );
  }

  const chartData = {
    labels: ['รถยนต์', 'จักรยานยนต์', 'รถบัส'],
    datasets: [
      {
        label: 'เข้า',
        data: ['car', 'motorcycle', 'bus'].map(type => 
          data.details.find((d: any) => d.vehicle_type_name === type && d.direction_type_name === 'in')?.count || 0
        ),
        backgroundColor: "rgba(59, 130, 246, 0.85)", // blue-500
        borderRadius: 50,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      },
      {
        label: 'ออก',
        data: ['car', 'motorcycle', 'bus'].map(type => 
          data.details.find((d: any) => d.vehicle_type_name === type && d.direction_type_name === 'out')?.count || 0
        ),
        backgroundColor: "rgba(236, 72, 153, 0.85)", // pink-500
        borderRadius: 50,
        borderSkipped: false,
        barPercentage: 0.7,
        categoryPercentage: 0.7,
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          font: { size: 18, family: "Prompt, sans-serif" },
          color: "#22223b",
          boxWidth: 28,
          boxHeight: 18,
          padding: 20,
        },
      },
      title: {
        display: true,
        text: "สถิติจำนวนยานพาหนะเข้าออกแต่ละประเภท",
        font: { size: 24, family: "Prompt, sans-serif", weight: "bold" as "bold" },
        color: "#22223b",
        padding: { top: 10, bottom: 10 },
      },
      tooltip: {
        backgroundColor: "#fff",
        titleColor: "#22223b",
        bodyColor: "#22223b",
        borderColor: "#a5b4fc",
        borderWidth: 1,
        titleFont: { family: "Prompt, sans-serif", size: 16 },
        bodyFont: { family: "Prompt, sans-serif", size: 15 },
        padding: 12,
        cornerRadius: 8,
      },
    },
    layout: {
      padding: { left: 10, right: 10, top: 10, bottom: 10 },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: { size: 16, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        title: {
          display: true,
          text: "จำนวน (คัน)",
          font: { size: 18, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        grid: {
          color: "rgba(59, 130, 246, 0.08)",
          borderDash: [4, 4],
        },
      },
      x: {
        ticks: {
          font: { size: 16, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        title: {
          display: true,
          text: "ประเภทยานพาหนะ",
          font: { size: 18, family: "Prompt, sans-serif" },
          color: "#22223b",
        },
        grid: {
          display: false,
        },
      },
    },
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold text-gray-800">
              รายงานข้อมูลกล้อง {data.camera_id}
            </h1>
            <button
              onClick={() => window.history.back()}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            >
              ย้อนกลับ
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">วันที่เริ่มต้น</p>
              <p className="text-lg font-semibold">{data.start.split(' ')[0]}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-600">วันที่สิ้นสุด</p>
              <p className="text-lg font-semibold">{data.stop.split(' ')[0]}</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* รถยนต์ */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4">รถยนต์</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">เข้า</p>
                  <p className="text-2xl font-bold">
                    {data.details.find(
                      (d: any) => d.vehicle_type_name === 'car' && d.direction_type_name === 'in'
                    )?.count || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">ออก</p>
                  <p className="text-2xl font-bold">
                    {data.details.find(
                      (d: any) => d.vehicle_type_name === 'car' && d.direction_type_name === 'out'
                    )?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* จักรยานยนต์ */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4">จักรยานยนต์</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">เข้า</p>
                  <p className="text-2xl font-bold">
                    {data.details.find(
                      (d: any) => d.vehicle_type_name === 'motorcycle' && d.direction_type_name === 'in'
                    )?.count || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">ออก</p>
                  <p className="text-2xl font-bold">
                    {data.details.find(
                      (d: any) => d.vehicle_type_name === 'motorcycle' && d.direction_type_name === 'out'
                    )?.count || 0}
                  </p>
                </div>
              </div>
            </div>

            {/* รถบัส */}
            <div className="bg-white border rounded-lg p-4">
              <h3 className="text-xl font-semibold mb-4">รถบัส</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">เข้า</p>
                  <p className="text-2xl font-bold">
                    {data.details.find(
                      (d: any) => d.vehicle_type_name === 'bus' && d.direction_type_name === 'in'
                    )?.count || 0}
                  </p>
                </div>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-red-600">ออก</p>
                  <p className="text-2xl font-bold">
                    {data.details.find(
                      (d: any) => d.vehicle_type_name === 'bus' && d.direction_type_name === 'out'
                    )?.count || 0}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Vehicle Statistics Chart */}
          <div className="bg-white/80 rounded-3xl shadow-2xl p-12 mt-14 border border-blue-100 max-w-5xl mx-auto w-full"
            style={{
              minHeight: 600,
              backdropFilter: "blur(8px)",
              boxShadow: "0 16px 56px 0 rgba(31, 38, 135, 0.22)",
            }}
          >
            <div style={{ height: 480 }}>
              <Bar data={chartData} options={chartOptions} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}