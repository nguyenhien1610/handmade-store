// frontend/src/layouts/AdminLayout.js
import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../contexts/AuthContext';
import Header from '../components/admin/Header';
import Sidebar from '../components/admin/Sidebar';
import './AdminLayout.css';

const AdminLayout = () => {
  const [sidebarActive, setSidebarActive] = useState(false);
  const { adminLogout } = useContext(AuthContext);
  const navigate = useNavigate();
  
  console.log('AdminLayout rendered');

  const toggleSidebar = () => {
    setSidebarActive(!sidebarActive);
  };

  const closeSidebar = () => {
    setSidebarActive(false);
  };

  const handleLogout = async () => {
    await adminLogout();
    navigate('/admin/login');
  };

  return (
    <div className="admin-layout">
      <Header 
        onMenuToggle={toggleSidebar} 
        onLogout={handleLogout}
        userName="Admin"
      />
      <div className="main-container">
        <Sidebar active={sidebarActive} onClose={closeSidebar} />
        <main className="content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;