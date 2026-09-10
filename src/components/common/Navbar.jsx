import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { getNotifications } from "../../services/notificationService";

export default function Navbar() {
  const { currentUser, userData, userRole, logout } = useAuth();
  const { settings } = useSiteSettings();
  const navigate = useNavigate();
  const location = useLocation();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!currentUser) return;

    async function loadUnreadCount() {
      try {
        const data = await getNotifications();
        setUnreadCount(data.unreadCount || 0);
      } catch (err) {
        console.error("Failed to fetch unread notifications in navbar:", err);
      }
    }

    loadUnreadCount();
    const interval = setInterval(loadUnreadCount, 10000);
    return () => clearInterval(interval);
  }, [currentUser, location.pathname]);

  // Handle click outside dropdown to close
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      setDropdownOpen(false);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  const getDashboardPath = () => {
    if (userRole === "admin") return "/admin/dashboard";
    if (userRole === "owner") return "/owner/dashboard";
    return "/user/bookings";
  };

  const getProfilePath = () => {
    if (userRole === "admin") return "/admin/profile";
    if (userRole === "owner") return "/owner/profile";
    return "/user/profile";
  };

  const getNotificationPath = () => {
    if (userRole === "admin") return "/admin/notifications";
    if (userRole === "owner") return "/owner/notifications";
    return "/user/notifications";
  };

  const getRoleLabel = () => {
    if (userRole === "admin") return "ผู้ดูแลระบบ";
    if (userRole === "owner") return "เจ้าของหอพัก";
    return "สมาชิก";
  };

  const avatarSrc = userData?.avatarUrl || userData?.photoURL || userData?.avatar_url || "/images/default-avatar.jpg";
  const displayName = userData?.displayName || userData?.first_name || userData?.username || "ผู้ใช้งาน";

  return (
    <header>
      <div className="navbar">
        {/* Logo */}
        <Link to="/" className="logo" style={{ textDecoration: "none" }}>
          <img
            src={settings.siteLogo || "/images/logo.png"}
            alt="Logo"
            onError={(e) => { e.target.src = "/images/logo.png"; }}
          />
          <div className="logo-text">
            <h2>{settings.siteName || "อยู่เลย เฮาส์"}</h2>
            <span>{settings.siteNameEn || "YOOLOEI HOUSE"}</span>
          </div>
        </Link>

        {/* Menu */}
        <nav className="nav-menu">
          <Link to="/" style={{ color: location.pathname === "/" ? "var(--primary-color, #7da27c)" : undefined }}>
            หน้าแรก
          </Link>
          <Link to="/dorms" style={{ color: location.pathname === "/dorms" && !location.search.includes("latest") ? "var(--primary-color, #7da27c)" : undefined }}>
            ค้นหาหอพัก
          </Link>
          <Link to="/dorms?sort=latest" style={{ color: location.pathname === "/dorms" && location.search.includes("latest") ? "var(--primary-color, #7da27c)" : undefined }}>
            หอพักล่าสุด
          </Link>
          <Link to="/about" style={{ color: location.pathname === "/about" ? "var(--primary-color, #7da27c)" : undefined }}>
            เกี่ยวกับเรา
          </Link>
          {userRole !== "admin" && (
            <Link to="/contact" style={{ color: location.pathname === "/contact" ? "var(--primary-color, #7da27c)" : undefined }}>
              ติดต่อ
            </Link>
          )}
        </nav>

        {/* User / Auth Menu */}
        <div className="nav-btn" style={{ alignItems: "center" }}>
          {currentUser ? (
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {/* Notification Bell */}
              <button
                onClick={() => navigate(getNotificationPath())}
                style={{
                  position: "relative",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "6px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#333333",
                  borderRadius: "50%",
                  transition: "background 0.2s"
                }}
                className="navbar-bell-btn"
                title="การแจ้งเตือน"
              >
                <i className="fa-solid fa-bell" style={{ fontSize: "20px", color: "#374151" }}></i>
                {unreadCount > 0 && (
                  <span
                    style={{
                      position: "absolute",
                      top: "-2px",
                      right: "-2px",
                      backgroundColor: "#ef4444",
                      color: "#ffffff",
                      fontSize: "11px",
                      fontWeight: "700",
                      borderRadius: "9999px",
                      minWidth: "18px",
                      height: "18px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      padding: "0 4px",
                      lineHeight: "1",
                      border: "2px solid #ffffff"
                    }}
                  >
                    {unreadCount > 99 ? "99+" : unreadCount}
                  </span>
                )}
              </button>

              {/* User Profile Trigger & Dropdown */}
              <div ref={dropdownRef} style={{ position: "relative" }}>
                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    cursor: "pointer",
                    userSelect: "none",
                    padding: "4px 8px",
                    borderRadius: "24px",
                    transition: "all 0.2s ease"
                  }}
                  className="navbar-profile-trigger"
                >
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    style={{
                      width: "42px",
                      height: "42px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      backgroundColor: "#dce8d6",
                      border: "1px solid #cbd5e1"
                    }}
                    onError={(e) => {
                      e.target.src = "/images/default-avatar.jpg";
                    }}
                  />
                  <div style={{ display: "flex", flexDirection: "column", justifyContent: "center", textAlign: "left" }}>
                    <span style={{ fontWeight: "700", fontSize: "15px", color: "#1e293b", lineHeight: "1.2" }}>
                      {displayName}
                    </span>
                    <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: "400", marginTop: "2px" }}>
                      {getRoleLabel()}
                    </span>
                  </div>
                  <i
                    className="fa-solid fa-chevron-down"
                    style={{
                      fontSize: "13px",
                      color: "#94a3b8",
                      marginLeft: "4px",
                      transition: "transform 0.2s ease",
                      transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)"
                    }}
                  ></i>
                </div>

                {/* Dropdown Menu */}
                {dropdownOpen && (
                  <div
                    style={{
                      position: "absolute",
                      top: "calc(100% + 10px)",
                      right: "0",
                      minWidth: "220px",
                      backgroundColor: "#ffffff",
                      borderRadius: "12px",
                      boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)",
                      border: "1px solid #e2e8f0",
                      zIndex: 1000,
                      padding: "8px 0",
                      overflow: "hidden"
                    }}
                  >
                    <div style={{ padding: "8px 16px 10px 16px", borderBottom: "1px solid #f1f5f9", marginBottom: "4px" }}>
                      <div style={{ fontWeight: "600", fontSize: "14px", color: "#0f172a" }}>
                        {displayName}
                      </div>
                      <div style={{ fontSize: "12px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {userData?.email || getRoleLabel()}
                      </div>
                    </div>

                    <Link
                      to={getProfilePath()}
                      onClick={() => setDropdownOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      <i className="fa-solid fa-user" style={{ width: "20px", color: "#64748b" }}></i>
                      <span>โปรไฟล์ส่วนตัว</span>
                    </Link>

                    <Link
                      to={getDashboardPath()}
                      onClick={() => setDropdownOpen(false)}
                      className="navbar-dropdown-item"
                    >
                      <i
                        className={
                          userRole === "admin"
                            ? "fa-solid fa-chart-pie"
                            : userRole === "owner"
                            ? "fa-solid fa-building"
                            : "fa-solid fa-calendar-check"
                        }
                        style={{ width: "20px", color: "#64748b" }}
                      ></i>
                      <span>
                        {userRole === "admin"
                          ? "แดชบอร์ดแอดมิน"
                          : userRole === "owner"
                          ? "จัดการหอพัก"
                          : "ประวัติการจองห้องพัก"}
                      </span>
                    </Link>

                    <Link
                      to={getNotificationPath()}
                      onClick={() => setDropdownOpen(false)}
                      className="navbar-dropdown-item"
                      style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <i className="fa-solid fa-bell" style={{ width: "20px", color: "#64748b" }}></i>
                        <span>การแจ้งเตือน</span>
                      </div>
                      {unreadCount > 0 && (
                        <span style={{ backgroundColor: "#ef4444", color: "#fff", fontSize: "11px", fontWeight: "bold", padding: "1px 7px", borderRadius: "10px" }}>
                          {unreadCount}
                        </span>
                      )}
                    </Link>

                    <div style={{ height: "1px", backgroundColor: "#f1f5f9", margin: "6px 0" }}></div>

                    <button
                      onClick={handleLogout}
                      className="navbar-dropdown-item danger"
                      style={{
                        width: "100%",
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        textAlign: "left"
                      }}
                    >
                      <i className="fa-solid fa-arrow-right-from-bracket" style={{ width: "20px", color: "#ef4444" }}></i>
                      <span>ออกจากระบบ</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <>
              <Link to="/login" style={{ textDecoration: "none" }}>
                <button className="btn-login">เข้าสู่ระบบ</button>
              </Link>
              <Link to="/register" style={{ textDecoration: "none" }}>
                <button className="btn-register">สมัครสมาชิก</button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
