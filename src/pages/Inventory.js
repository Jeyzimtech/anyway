import React from 'react';
import MainLayout from '../components/MainLayout';

export default function Inventory() {
  const inventoryItems = [
    { id: 1, name: 'Engine Oil 5W-30', stock: 45, status: 'In Stock', category: 'Engine Oil' },
    { id: 2, name: 'Brake Pads Premium', stock: 12, status: 'Low Stock', category: 'Motor Spare Parts' },
    { id: 3, name: 'Air Filter', stock: 3, status: 'Critical', category: 'Motor Spare Parts' },
    { id: 4, name: 'Transmission Fluid', stock: 28, status: 'In Stock', category: 'Transmission Oil' },
    { id: 5, name: 'Lithium Grease', stock: 8, status: 'Low Stock', category: 'Grease' },
    { id: 6, name: 'Service Kit Complete', stock: 15, status: 'In Stock', category: 'Service Kits' },
    { id: 7, name: 'Hydraulic Oil AW-32', stock: 6, status: 'Low Stock', category: 'Hydraulic Oil' },
  ];

  return (
    <MainLayout>
      <div className="p-3 sm:p-4 md:p-6">
        <h1 className="text-2xl sm:text-3xl mb-2">Inventory Management</h1>
        <p className="text-xs sm:text-sm mb-4">Manage your product stock levels</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div className="border rounded p-4">
          <div className="flex justify-between">
            <span className="text-sm">Total Products</span>
            <span>📦</span>
          </div>
          <div className="text-2xl font-bold">96</div>
          <p className="text-xs">Across all categories</p>
        </div>

        <div className="border rounded p-4">
          <div className="flex justify-between">
            <span className="text-sm">Low Stock Items</span>
            <span>📉</span>
          </div>
          <div className="text-2xl font-bold">12</div>
          <p className="text-xs">Needs restocking</p>
        </div>

        <div className="border rounded p-4">
          <div className="flex justify-between">
            <span className="text-sm">Critical Items</span>
            <span>⚠️</span>
          </div>
          <div className="text-2xl font-bold">3</div>
          <p className="text-xs">Immediate attention</p>
        </div>
      </div>

        <div className="border rounded p-4">
          <h2 className="text-xl mb-2">Inventory Items</h2>
          <div className="space-y-3">
            {inventoryItems.map((item) => (
              <div key={item.id} className="flex items-center justify-between p-4 rounded border">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded bg-gray-100">📦</div>
                  <div>
                    <h3 className="font-medium">{item.name}</h3>
                    <p className="text-sm">{item.category}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">{item.stock} units</p>
                  <span className="text-xs">{item.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </MainLayout>
  );
}