import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// Import CSS - Bỏ các import không cần thiết, chỉ giữ 2 import chính
import './assets/css/global.css';  // File global.css sẽ import các file CSS khác
import '@fortawesome/fontawesome-free/css/all.min.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);