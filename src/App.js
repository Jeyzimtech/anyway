import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ManageProducts from './pages/ManageProducts';
import Inventory from './pages/Inventory';
import AddProduct from './pages/AddProduct';
import Orders from './pages/Orders';
import Returns from './pages/Returns';
import Profile from './pages/Profile';
import Sales from './pages/Sales';
import Settings from './pages/Settings';
import Users from './pages/Users';
import Discounts from './pages/Discounts';
import Coupons from './pages/Coupons';
import SalesAnalysis from './pages/SalesAnalysis';
import ProtectedRoute, { AdminRoute } from './components/ProtectedRoute';
import MainLayout from './components/MainLayout';
import './styles/Auth.css';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<AdminRoute><MainLayout><Dashboard /></MainLayout></AdminRoute>} />
      <Route path="/dashboard" element={<AdminRoute><MainLayout><Dashboard /></MainLayout></AdminRoute>} />
      <Route path="/manage-products" element={<AdminRoute><MainLayout><ManageProducts /></MainLayout></AdminRoute>} />
      <Route path="/inventory" element={<AdminRoute><MainLayout><Inventory /></MainLayout></AdminRoute>} />
      <Route path="/add-product" element={<AdminRoute><MainLayout><AddProduct /></MainLayout></AdminRoute>} />
      <Route path="/orders" element={<ProtectedRoute><MainLayout><Orders /></MainLayout></ProtectedRoute>} />
      <Route path="/returns" element={<ProtectedRoute><MainLayout><Returns /></MainLayout></ProtectedRoute>} />
      <Route path="/profile" element={<ProtectedRoute><MainLayout><Profile /></MainLayout></ProtectedRoute>} />
      <Route path="/sales" element={<ProtectedRoute><MainLayout><Sales /></MainLayout></ProtectedRoute>} />
      <Route path="/settings" element={<AdminRoute><MainLayout><Settings /></MainLayout></AdminRoute>} />
      <Route path="/users" element={<AdminRoute><MainLayout><Users /></MainLayout></AdminRoute>} />
      <Route path="/discounts" element={<AdminRoute><MainLayout><Discounts /></MainLayout></AdminRoute>} />
      <Route path="/coupons" element={<AdminRoute><MainLayout><Coupons /></MainLayout></AdminRoute>} />
      <Route path="/sales-analysis" element={<AdminRoute><MainLayout><SalesAnalysis /></MainLayout></AdminRoute>} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

export default App;
