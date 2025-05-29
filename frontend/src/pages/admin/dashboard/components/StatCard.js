// src/pages/admin/dashboard/components/StatCard.js
import React from 'react';
import './StatCard.css';

const StatCard = ({ icon, iconClass, number, label }) => {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${iconClass}`}>
        <i className={`fas fa-${icon}`}></i>
      </div>
      <div className="stat-number">{number}</div>
      <div className="stat-label">{label}</div>
    </div>
  );
};

export default StatCard;