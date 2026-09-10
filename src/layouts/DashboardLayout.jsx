import { useState } from "react";
import { Outlet } from "react-router-dom";
import Navbar from "../components/common/Navbar";
import Sidebar from "../components/dashboard/Sidebar";
import "../styles/dashboard.css";

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Navbar />
      <div className="dashboard-layout">
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <div className="dashboard-main">
          {/* Topbar with mobile toggle */}
          <div className="dashboard-topbar">
            <button
              className="dashboard-mobile-toggle"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              aria-label="Toggle Menu"
            >
              <i className="fa-solid fa-bars"></i>
            </button>
            <div className="dashboard-topbar-title">
              <span style={{ fontSize: "14px", color: "#7da27c", fontWeight: 600 }}>
                <i className="fa-solid fa-house-user" style={{ marginRight: "6px" }}></i>
                ระบบจัดการหอพัก อยู่เลย เฮาส์
              </span>
            </div>
          </div>

          {/* Main Outlet */}
          <main className="dashboard-content">
            <Outlet />
          </main>
        </div>
      </div>
    </>
  );
}
