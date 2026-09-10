import { useState, useEffect } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getNotifications } from "../../services/notificationService";

export default function Sidebar({ isOpen, onClose }) {
  const { userData, userRole, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    async function loadUnreadCount() {
      try {
        const data = await getNotifications();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to load unread count in sidebar:", err);
      }
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000); // refresh every 10 seconds
    return () => clearInterval(interval);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getRoleLabel = () => {
    if (userRole === "admin") return "ผู้ดูแลระบบ";
    if (userRole === "owner") return "เจ้าของหอพัก";
    return "ผู้เช่าหอพัก";
  };

  // เมนูของ User (ผู้เช่าหอพัก)
  const userMenuItems = [
    { to: "/user/notifications", label: "การแจ้งเตือน", icon: "fa-solid fa-bell", badge: unreadCount },
    { to: "/user/profile", label: "ข้อมูลส่วนตัว", icon: "fa-solid fa-user" },
    { to: "/user/messages", label: "แชทข้อความ", icon: "fa-solid fa-comments" },
    { to: "/user/history", label: "ประวัติการดูหอพัก", icon: "fa-solid fa-clock-rotate-left" },
    { to: "/user/bookings", label: "ห้องพักที่จองไว้", icon: "fa-solid fa-calendar-check" },
    { to: "/user/favorites", label: "หอพักที่บันทึกไว้", icon: "fa-solid fa-heart" }
  ];

  // เมนูของ Owner (เจ้าของหอพัก)
  const ownerMenuItems = [
    { to: "/owner/notifications", label: "การแจ้งเตือน", icon: "fa-solid fa-bell", badge: unreadCount },
    { to: "/owner/profile", label: "ข้อมูลส่วนตัว", icon: "fa-solid fa-user-gear" },
    { to: "/owner/messages", label: "แชทข้อความ", icon: "fa-solid fa-comments" },
    { to: "/owner/dashboard", label: "ภาพรวมหอพัก", icon: "fa-solid fa-chart-line" },
    { to: "/owner/history", label: "ประวัติการดูหอพัก", icon: "fa-solid fa-clock-rotate-left" },
    { to: "/owner/dormitories", label: "หอพักของฉัน", icon: "fa-solid fa-building" },
    { to: "/owner/dormitories/create", label: "ลงประกาศหอพักใหม่", icon: "fa-solid fa-plus-circle" },
    { to: "/owner/rooms", label: "จัดการห้องพัก", icon: "fa-solid fa-bed" },
    { to: "/owner/bookings", label: "รายการจองห้อง", icon: "fa-solid fa-calendar-days" },
    { to: "/owner/reviews", label: "รีวิวจากผู้เช่า", icon: "fa-solid fa-star-half-stroke" }
  ];

  // เมนูของ Admin (ผู้ดูแลระบบ)
  const adminMenuItems = [
    { to: "/admin/notifications", label: "การแจ้งเตือน", icon: "fa-solid fa-bell", badge: unreadCount },
    { to: "/admin/profile", label: "ข้อมูลส่วนตัว", icon: "fa-solid fa-user-shield" },
    { to: "/admin/messages", label: "แชทข้อความ", icon: "fa-solid fa-comments" },
    { to: "/admin/history", label: "ประวัติการดูหอพัก", icon: "fa-solid fa-clock-rotate-left" },
    { to: "/admin/dashboard", label: "สถิติภาพรวม", icon: "fa-solid fa-chart-column" },
    { to: "/admin/dormitories", label: "ตรวจสอบหอพัก", icon: "fa-solid fa-hotel" },
    { to: "/admin/locations", label: "จัดการพื้นที่ / ประเภทห้อง", icon: "fa-solid fa-map-location-dot" },
    { to: "/admin/users", label: "จัดการผู้ใช้งาน", icon: "fa-solid fa-users" },
    { to: "/admin/owners", label: "จัดการเจ้าของหอ", icon: "fa-solid fa-user-tie" },
    { to: "/admin/bookings", label: "การจองทั้งหมด", icon: "fa-solid fa-clipboard-list" },
    { to: "/admin/reviews", label: "รีวิวจากผู้เช่า", icon: "fa-solid fa-comments" },
    { to: "/admin/reports", label: "รายงานปัญหา", icon: "fa-solid fa-flag" },
    { to: "/admin/logs", label: "บันทึกกิจกรรม", icon: "fa-solid fa-clock-rotate-left" },
    { to: "/admin/settings", label: "ตั้งค่าระบบ", icon: "fa-solid fa-sliders" }
  ];

  let menuItems = userMenuItems;
  if (userRole === "owner") menuItems = ownerMenuItems;
  if (userRole === "admin") menuItems = adminMenuItems;

  return (
    <>
      {isOpen && <div className="sidebar-backdrop" onClick={onClose}></div>}
      <aside className={`dashboard-sidebar ${isOpen ? "open" : ""}`}>
        {/* User Info Header */}
        <div className="sidebar-header">
          <img
            src={userData?.photoURL || userData?.avatarUrl || "/images/default-avatar.jpg"}
            alt="User Avatar"
            className="sidebar-user-avatar"
            onError={(e) => {
              e.target.src = "/images/default-avatar.jpg";
            }}
          />
          <div className="sidebar-user-info">
            <h4>{userData?.displayName || "ผู้ใช้งาน"}</h4>
            <span>{getRoleLabel()}</span>
          </div>
        </div>

        {/* Sidebar Nav Links */}
        <nav className="sidebar-menu">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/owner/dormitories" || item.to === "/admin/dormitories" || item.to.endsWith("/dashboard")}
              className={({ isActive }) => `sidebar-item ${isActive ? "active" : ""} flex items-center justify-between`}
              onClick={() => {
                if (window.innerWidth <= 900 && onClose) onClose();
              }}
            >
              <div className="flex items-center gap-3">
                <i className={item.icon}></i>
                <span>{item.label}</span>
              </div>
              {Boolean(item.badge) && item.badge > 0 && (
                <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <i className="fa-solid fa-right-from-bracket"></i>
            <span>ออกจากระบบ</span>
          </button>
        </div>
      </aside>
    </>
  );
}
