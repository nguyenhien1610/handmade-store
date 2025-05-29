import React, { lazy, Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import Loader from '../components/common/Loader/Loader';
import AdminLayout from '../layouts/AdminLayout';

// Lazy loading để tối ưu hiệu suất
const Login = lazy(() => import('../pages/admin/login/Login'));
const Dashboard = lazy(() => import('../pages/admin/dashboard/Dashboard'));
const ProductForm = lazy(() => import('../pages/admin/products/ProductListPage'));
const OrdersPage = lazy(() => import('../pages/admin/orders/OrdersPage'));
const OrderDetail = lazy(() => import('../pages/admin/orders/OrderDetail'));
const CustomerList = lazy(() => import('../pages/admin/customers/CustomerList'));
const Chatbox = lazy(() => import('../pages/admin/chatbox/Chatbox'));
const SocialMedia = lazy(() => import('../pages/admin/social/SocialMedia'));
const Report = lazy(() => import('../pages/admin/reports/Report'));
const Settings = lazy(() => import('../pages/admin/settings/Settings'));

const AdminRoutes = () => {
  console.log('AdminRoutes rendered');
  
  return (
    <Suspense fallback={<Loader />}>
      <Routes>
        <Route path="login" element={<Login />} />
        
        {/* Redirect /admin to /admin/login if not authenticated */}
        <Route path="" element={<Navigate to="/admin/login" replace />} />
        
        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <AdminLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          
          <Route path="products" element={<ProductForm />} />
        
          
          <Route path="orders">
            <Route index element={<OrdersPage />} />
            <Route path="new" element={<OrderDetail/>} />
            <Route path="edit/:id" element={<OrderDetail />} />
          </Route>

          <Route path="customers" element={<CustomerList />} />
          <Route path="chatbox" element={<Chatbox />} />
          <Route path="social" element={<SocialMedia />} />
          <Route path="reports" element={<Report />} />
          <Route path="settings" element={<Settings />} />
          
          {/* Thêm các route khác ở đây */}
        </Route>
      </Routes>
    </Suspense>
  );
};

export default AdminRoutes;