// frontend/src/routes/index.js
import React from 'react';
import { Routes, Route } from 'react-router-dom';
import AdminRoutes from './AdminRoutes';
import ClientRoutes from './ClientRoutes';

const AppRoutes = () => {
  return (
    <Routes>
      {/* ADMIN ROUTES - Đặt trước để ưu tiên */}
      <Route path="/admin/*" element={<AdminRoutes />} />
      
      {/* CLIENT ROUTES */}
      <Route path="/*" element={<ClientRoutes />} />
    </Routes>
  );
};

export default AppRoutes;