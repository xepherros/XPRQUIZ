
import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';  // โหลดก่อน
import './style.css';  // โหลดทีหลัง
import MainRouter from './MainRouter'; // เปลี่ยนจาก './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MainRouter />
  </React.StrictMode>
);
