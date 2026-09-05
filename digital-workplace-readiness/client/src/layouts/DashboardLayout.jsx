import React, { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

const DashboardLayout = ({ title, children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="app-shell">
      <Sidebar open={sidebarOpen} onNavigate={() => setSidebarOpen(false)} />
      <div className="main-area">
        <Navbar title={title} onMenuClick={() => setSidebarOpen((s) => !s)} />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default DashboardLayout;
