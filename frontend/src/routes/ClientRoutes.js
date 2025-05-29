// src/routes/ClientRoutes.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClientLayout from '../layouts/ClientLayout';
import Home from '../pages/client/home/Home';
import Products from '../pages/client/products/Products';
import Register from '../pages/client/register/Register';
import Login from '../pages/client/login/Login';
import Profile from '../pages/client/profile/Profile';
import ProtectedRoute from './ProtectedRoute';
import Cart from '../pages/client/cart/Cart';
// Import các trang khác nếu cần

const ClientRoutes = () => {
  return (
    <ClientLayout>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/san-pham" element={<Products />} />
        <Route path="/dang-ky" element={<Register />} />
        <Route path="/dang-nhap" element={<Login />} />
        <Route 
          path="/tai-khoan" 
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/gio-hang" 
          element={
            <ProtectedRoute>
              <Cart />
            </ProtectedRoute>
          } 
        />
        {/* Thêm các route khác nếu cần */}
      </Routes>
    </ClientLayout>
  );
};

export default ClientRoutes;