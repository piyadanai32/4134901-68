"use client";

import { useState, useEffect } from 'react';
import { VehicleCountResponse, CameraData, VehicleDetail } from './lib/vehicleCount';


export default function VehicleDashboard() {
  const today = new Date().toISOString().slice(0, 10);
  const [startDate, setStartDate] = useState<string>(today);
  const [endDate, setEndDate] = useState<string>(today);
  const [data, setData] = useState<CameraData[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const fetchGateData = async (gateId: number) => {
    try {
      const response = await fetch(
        `http://localhost:5678/webhook/vehicle_count/all?type=gate&id=${gateId}&start=${startDate}&stop=${endDate}`
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch data for gate ${gateId}`);
      }
      const text = await response.text();
      if (!text) {
        return [];
      }
      const result: VehicleCountResponse[] = JSON.parse(text);
      return result[0]?.data || [];
    } catch (error) {
      console.error(`Error fetching gate ${gateId}:`, error);
      return [];
    }
  };

  const fetchData = async () => {
    if (!startDate || !endDate) {
      setError('กรุณาเลือกวันที่');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const gates = [1, 2, 3, 4];
      const allData = await Promise.all(gates.map(fetchGateData));
      const combinedData = allData.flat();
      setData(combinedData);
    } catch (err) {
      setError('เกิดข้อผิดพลาดในการดึงข้อมูล');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);



  const getCameraVehicleCount = (cameraId: number, vehicleType: string, direction: string): number => {
    const camera = data.find(c => c.camera_id === cameraId);
    if (!camera) return 0;

    const detail = camera.details.find(d =>
      d.vehicle_type_name === vehicleType && d.direction_type_name === direction
    );
    return detail?.count || 0;
  };

  // const summary = calculateSummary();

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-6">
            Dashboard การนับจำนวนยานพาหนะ
          </h1>

          {/* Date Input */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่เริ่มต้น
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                วันที่สิ้นสุด
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              className="bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'กำลังโหลด...' : 'ค้นหา'}
            </button>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded-md">
              {error}
            </div>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-blue-600 text-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">รถยนต์เข้า</h3>
            <p className="text-3xl font-bold">
              {data.reduce((sum, camera) => 
                sum + (camera.details.find(d => d.vehicle_type_name === 'car' && d.direction_type_name === 'in')?.count || 0), 0)}
            </p>
          </div>
          <div className="bg-green-600 text-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">รถยนต์ออก</h3>
            <p className="text-3xl font-bold">
              {data.reduce((sum, camera) => 
                sum + (camera.details.find(d => d.vehicle_type_name === 'car' && d.direction_type_name === 'out')?.count || 0), 0)}
            </p>
          </div>
          <div className="bg-purple-600 text-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">รถจักรยานยนต์</h3>
            <p className="text-3xl font-bold">
              {data.reduce((sum, camera) => 
                sum + (camera.details.find(d => d.vehicle_type_name === 'motorcycle' && d.direction_type_name === 'in')?.count || 0) +
                      (camera.details.find(d => d.vehicle_type_name === 'motorcycle' && d.direction_type_name === 'out')?.count || 0), 0)}
            </p>
          </div>
          <div className="bg-orange-600 text-white rounded-lg p-6 shadow-md">
            <h3 className="text-lg font-semibold mb-2">รถบัส</h3>
            <p className="text-3xl font-bold">
              {data.reduce((sum, camera) => 
                sum + (camera.details.find(d => d.vehicle_type_name === 'bus' && d.direction_type_name === 'in')?.count || 0) +
                      (camera.details.find(d => d.vehicle_type_name === 'bus' && d.direction_type_name === 'out')?.count || 0), 0)}
            </p>
          </div>
        </div>

        {/* Camera Grid Layout */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">แสดงผลยานพาหนะเข้า - ออก ของแต่ละประตู</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2, 3, 4].map(gateId => {
              // กรองข้อมูลกล้องที่อยู่ในประตูนี้
              const gateCameras = data.filter(camera => camera.gate_id === gateId);

              return (
                <div key={gateId} className="border border-gray-200 rounded-lg p-4">
                  <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                    <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
                    ประตู {gateId}
                  </h3>

                  {gateCameras.length > 0 ? (
                    <div className="space-y-3">
                      {gateCameras.map(camera => (
                        <div key={camera.camera_id} className="bg-gray-50 rounded-md p-3">
                          <h4 
                            onClick={() => window.location.href = `/report?cameraId=${camera.camera_id}&start=${startDate}&stop=${endDate}`}
                            className="font-medium text-gray-700 mb-2 cursor-pointer hover:text-blue-600"
                          >
                            กล้อง {camera.camera_id}
                          </h4>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            {/* รถยนต์ */}
                            <div className="bg-blue-100 p-2 rounded">
                              <div className="font-medium text-blue-800">รถยนต์</div>
                              <div className="text-blue-600">
                                เข้า: {getCameraVehicleCount(camera.camera_id, 'car', 'in')} |
                                ออก: {getCameraVehicleCount(camera.camera_id, 'car', 'out')}
                              </div>
                            </div>

                            {/* จักรยานยนต์ */}
                            <div className="bg-green-100 p-2 rounded">
                              <div className="font-medium text-green-800">จักรยานยนต์</div>
                              <div className="text-green-600">
                                เข้า: {getCameraVehicleCount(camera.camera_id, 'motorcycle', 'in')} |
                                ออก: {getCameraVehicleCount(camera.camera_id, 'motorcycle', 'out')}
                              </div>
                            </div>

                            {/* รถบัส */}
                            <div className="bg-purple-100 p-2 rounded col-span-2">
                              <div className="font-medium text-purple-800">รถบัส</div>
                              <div className="text-purple-600">
                                เข้า: {getCameraVehicleCount(camera.camera_id, 'bus', 'in')} |
                                ออก: {getCameraVehicleCount(camera.camera_id, 'bus', 'out')}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      ไม่มีข้อมูลกล้องในประตูนี้
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Data Table */}
        <div className="bg-white rounded-lg shadow-md p-6 mt-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">ตารางข้อมูลยานพาหนะเข้า - ออกทั้งหมด</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    กล้อง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ประเภทยานพาหนะ
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ทิศทาง
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    จำนวน
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((camera) =>
                  camera.details
                    .filter(detail => detail.count > 0) // Show only non-zero counts
                    .map((detail, index) => (
                      <tr key={`${camera.camera_id}-${detail.vehicle_type_id}-${detail.direction_type_id}`}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          Camera {camera.camera_id}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.vehicle_type_name === 'car' ? 'รถยนต์' :
                            detail.vehicle_type_name === 'motorcycle' ? 'จักรยานยนต์' :
                              detail.vehicle_type_name === 'bus' ? 'รถบัส' : detail.vehicle_type_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {detail.direction_type_name === 'in' ? 'เข้า' : 'ออก'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                          {detail.count}
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
            {data.length === 0 && (
              <div className="text-center py-8 text-gray-500">
                ไม่มีข้อมูล
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}