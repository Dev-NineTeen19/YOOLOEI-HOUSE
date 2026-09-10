import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  getNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  deleteNotification
} from "../../services/notificationService";

export default function NotificationCenter({ title = "การแจ้งเตือน", subtitle = "อัปเดตและรายการแจ้งเตือนล่าสุดของคุณ" }) {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    setLoading(true);
    try {
      const data = await getNotifications();
      setNotifications(data.notifications);
      setUnreadCount(data.unreadCount);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllNotificationsAsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: 1 })));
      setUnreadCount(0);
    } catch (err) {
      alert("ไม่สามารถอัปเดตสถานะได้: " + err.message);
    }
  }

  async function handleNotificationClick(n) {
    // 1. ทำเครื่องหมายอ่านแล้วเสมอ
    if (n.is_read === 0) {
      try {
        await markNotificationAsRead(n.id);
        setNotifications((prev) =>
          prev.map((item) => (item.id === n.id ? { ...item, is_read: 1 } : item))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      } catch (err) {
        console.error("Error marking read:", err);
      }
    }

    // 2. ถ้ามีลิงก์ปลายทาง ให้เด้งไปหน้านั้นทันที
    if (n.link) {
      navigate(n.link);
    } else {
      // 3. ถ้าไม่มีลิงก์ ให้สลับย่อ-ขยายรายละเอียดข้อความ
      setExpandedId((prev) => (prev === n.id ? null : n.id));
    }
  }

  async function handleDelete(e, id) {
    e.stopPropagation();
    try {
      await deleteNotification(id);
      setNotifications((prev) => {
        const target = prev.find((item) => item.id === id);
        if (target && target.is_read === 0) {
          setUnreadCount((count) => Math.max(0, count - 1));
        }
        return prev.filter((item) => item.id !== id);
      });
    } catch (err) {
      alert("ไม่สามารถลบรายการได้: " + err.message);
    }
  }

  function getIcon(type) {
    switch (type) {
      case "chat":
        return (
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#e3f2fd", color: "#1976d2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
            <i className="fa-solid fa-comments"></i>
          </div>
        );
      case "review":
        return (
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#fff8e1", color: "#ffa000", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
            <i className="fa-solid fa-star"></i>
          </div>
        );
      case "booking":
        return (
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#e8f5e9", color: "#388e3c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
        );
      case "dormitory":
        return (
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#f3e5f5", color: "#7b1fa2", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
            <i className="fa-solid fa-building"></i>
          </div>
        );
      default:
        return (
          <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#e8f5e9", color: "#7da27c", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "18px", flexShrink: 0 }}>
            <i className="fa-solid fa-bell"></i>
          </div>
        );
    }
  }

  function getActionBtnText(type, link) {
    if (type === "review" || link?.includes("/dorms") || link?.includes("/dormitories")) {
      return "ดูรายละเอียดหอพัก";
    }
    if (type === "chat" || link?.includes("/messages")) {
      return "เปิดกล่องข้อความ";
    }
    if (type === "booking" || link?.includes("/bookings")) {
      return "ดูรายละเอียดการจอง";
    }
    return "ไปยังหน้าที่เกี่ยวข้อง";
  }

  function formatTime(isoString) {
    if (!isoString) return "";
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return "เมื่อสักครู่";
    if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
    if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;

    return date.toLocaleString("th-TH", {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px", margin: 0 }}>
            <span>{title}</span>
            {unreadCount > 0 && (
              <span style={{ fontSize: "12px", background: "#ef4444", color: "#fff", padding: "2px 10px", borderRadius: "12px", fontWeight: 600 }}>
                {unreadCount} ใหม่
              </span>
            )}
          </h1>
          <p style={{ color: "#777", fontSize: "14px", marginTop: "4px", margin: 0 }}>{subtitle}</p>
        </div>

        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllAsRead}
            style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              border: "1px solid #c8e6c9",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: 600,
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <i className="fa-solid fa-check-double"></i> อ่านแล้วทั้งหมด
          </button>
        )}
      </div>

      {/* Main Content Card */}
      <div className="content-card">
        <div className="content-card-body" style={{ padding: "20px" }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดการแจ้งเตือน...
            </div>
          ) : notifications.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-regular fa-bell-slash" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
              <h3 style={{ color: "#555" }}>ไม่มีการแจ้งเตือนในขณะนี้</h3>
              <p style={{ color: "#888", marginTop: "8px" }}>
                เมื่อมีข้อความใหม่ รีวิว หรือการอัปเดตสถานะการจอง ระบบจะแจ้งเตือนให้คุณทราบที่นี่
              </p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {notifications.map((n) => {
                const isExpanded = expandedId === n.id;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleNotificationClick(n)}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "16px",
                      padding: "16px",
                      borderRadius: "8px",
                      border: n.is_read === 0 ? "1px solid #c8e6c9" : "1px solid #eee",
                      background: n.is_read === 0 ? "#f1f8e9" : "#fff",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {getIcon(n.type)}

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <h4 style={{ margin: 0, fontSize: "15px", color: "#333", fontWeight: n.is_read === 0 ? 700 : 600 }}>
                          {n.title}
                        </h4>
                        <span style={{ fontSize: "12px", color: "#888", whiteSpace: "nowrap" }}>
                          {formatTime(n.created_at)}
                        </span>
                      </div>

                      <p style={{
                        margin: 0,
                        fontSize: "13px",
                        color: "#555",
                        lineHeight: 1.6,
                        overflow: isExpanded ? "visible" : "hidden",
                        display: isExpanded ? "block" : "-webkit-box",
                        WebkitLineClamp: isExpanded ? "unset" : 2,
                        WebkitBoxOrient: "vertical"
                      }}>
                        {n.message}
                      </p>

                      {/* Action Button: กดเพื่อเปลี่ยนหน้าและอ่านแล้วทันที */}
                      {n.link && (
                        <div style={{ marginTop: "12px" }}>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleNotificationClick(n);
                            }}
                            style={{
                              background: "#7da27c",
                              color: "#fff",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "6px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
                              transition: "background 0.2s"
                            }}
                            onMouseOver={(e) => (e.currentTarget.style.background = "#6b916a")}
                            onMouseOut={(e) => (e.currentTarget.style.background = "#7da27c")}
                          >
                            <i className="fa-solid fa-arrow-right-to-bracket"></i> {getActionBtnText(n.type, n.link)}
                          </button>
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", alignSelf: "center" }}>
                      {n.is_read === 0 && (
                        <span style={{ width: "8px", height: "8px", background: "#7da27c", borderRadius: "50%" }} title="ยังไม่ได้อ่าน"></span>
                      )}
                      <button
                        type="button"
                        className="btn-icon delete"
                        onClick={(e) => handleDelete(e, n.id)}
                        title="ลบการแจ้งเตือน"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
