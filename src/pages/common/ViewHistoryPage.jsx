import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getViewHistory, removeViewHistory, clearAllViewHistory } from "../../services/historyService";

export default function ViewHistoryPage() {
  const navigate = useNavigate();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

  useEffect(() => {
    fetchHistory();
  }, []);

  async function fetchHistory() {
    setLoading(true);
    try {
      const items = await getViewHistory();
      setHistoryItems(items);
    } catch (err) {
      console.error("Failed to load view history:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemoveItem(dormitoryId) {
    try {
      await removeViewHistory(dormitoryId);
      setHistoryItems((prev) => prev.filter((item) => item.dormitory?.id !== dormitoryId));
    } catch (err) {
      alert("ไม่สามารถลบรายการได้: " + (err.message || ""));
    }
  }

  async function handleClearAll() {
    if (!window.confirm("คุณต้องการล้างประวัติการดูหอพักทั้งหมดใช่หรือไม่?")) return;
    setClearing(true);
    try {
      await clearAllViewHistory();
      setHistoryItems([]);
    } catch (err) {
      alert("ไม่สามารถล้างประวัติได้: " + (err.message || ""));
    } finally {
      setClearing(false);
    }
  }

  function formatDateTime(isoString) {
    if (!isoString) return "ไม่ระบุ";
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return "ไม่ระบุ";
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700, margin: "0 0 4px 0" }}>ประวัติการดูหอพัก</h1>
          <p style={{ color: "#777", fontSize: "14px", margin: 0 }}>รายการหอพักที่คุณเคยเปิดเข้าชมล่าสุด</p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          {/* View Mode Switcher */}
          <div style={{ display: "flex", background: "#e2e8f0", borderRadius: "8px", padding: "3px" }}>
            <button
              type="button"
              onClick={() => setViewMode("table")}
              style={{
                background: viewMode === "table" ? "#ffffff" : "transparent",
                color: viewMode === "table" ? "#1e293b" : "#64748b",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: viewMode === "table" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
              title="มุมมองตาราง"
            >
              <i className="fa-solid fa-list"></i> ตาราง
            </button>
            <button
              type="button"
              onClick={() => setViewMode("card")}
              style={{
                background: viewMode === "card" ? "#ffffff" : "transparent",
                color: viewMode === "card" ? "#1e293b" : "#64748b",
                border: "none",
                borderRadius: "6px",
                padding: "6px 12px",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                boxShadow: viewMode === "card" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
              title="มุมมองการ์ด"
            >
              <i className="fa-solid fa-border-all"></i> การ์ด
            </button>
          </div>

          {historyItems.length > 0 && (
            <button
              type="button"
              onClick={handleClearAll}
              disabled={clearing}
              style={{
                background: "#fee2e2",
                color: "#dc2626",
                border: "1px solid #fca5a5",
                padding: "8px 16px",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "8px",
                transition: "all 0.2s"
              }}
            >
              <i className="fa-solid fa-trash-can"></i> {clearing ? "กำลังล้าง..." : "ล้างประวัติทั้งหมด"}
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดประวัติการดูหอพัก...
        </div>
      ) : historyItems.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa-solid fa-clock-rotate-left" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
          <h3 style={{ color: "#555" }}>ยังไม่มีประวัติการดูหอพัก</h3>
          <p style={{ color: "#888", marginTop: "8px", marginBottom: "20px" }}>
            เมื่อคุณเปิดดูรายละเอียดหอพัก รายการจะถูกบันทึกไว้ที่นี่โดยอัตโนมัติเพื่อให้คุณกลับมาค้นหาได้อย่างสะดวก
          </p>
          <Link to="/dorms" className="btn-primary-action" style={{ textDecoration: "none" }}>
            <i className="fa-solid fa-magnifying-glass"></i> ค้นหาหอพักเลย
          </Link>
        </div>
      ) : viewMode === "table" ? (
        <div className="content-card">
          <div className="content-card-body" style={{ padding: 0 }}>
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>รูปปก</th>
                    <th>ชื่อหอพัก</th>
                    <th>อำเภอ</th>
                    <th>ราคา</th>
                    <th>เวลาที่เข้าชม</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {historyItems.map(({ historyId, viewedAt, dormitory }) => {
                    if (!dormitory) return null;
                    const heroImg = Array.isArray(dormitory.images) && dormitory.images.length > 0
                      ? dormitory.images[0]
                      : "/images/dorm-hero.jpg";

                    const priceText = dormitory.priceMin && dormitory.priceMax && dormitory.priceMin !== dormitory.priceMax
                      ? `${Number(dormitory.priceMin).toLocaleString()} - ${Number(dormitory.priceMax).toLocaleString()} บาท`
                      : `${Number(dormitory.priceMin || 0).toLocaleString()} บาท`;

                    return (
                      <tr key={historyId || dormitory.id}>
                        <td style={{ width: "80px" }}>
                          <img
                            src={heroImg}
                            alt={dormitory.name}
                            style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px" }}
                            onError={(e) => { e.target.src = "/images/dorm-hero.jpg"; }}
                          />
                        </td>
                        <td>
                          <strong>{dormitory.name}</strong>
                        </td>
                        <td>{dormitory.district ? `อำเภอ${dormitory.district}` : "เมืองเลย"}</td>
                        <td>{priceText}</td>
                        <td>{formatDateTime(viewedAt)}</td>
                        <td>
                          <div className="btn-action-group">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => navigate(`/dorms/${dormitory.id}`)}
                              title="ดูรายละเอียด"
                            >
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button
                              type="button"
                              className="btn-icon delete"
                              onClick={() => handleRemoveItem(dormitory.id)}
                              title="ลบประวัติ"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        /* CARD VIEW */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {historyItems.map(({ historyId, viewedAt, dormitory }) => {
            if (!dormitory) return null;
            const targetId = dormitory.id;
            const heroImg = Array.isArray(dormitory.images) && dormitory.images.length > 0
              ? dormitory.images[0]
              : "/images/dorm-hero.jpg";

            const priceText = dormitory.priceMin && dormitory.priceMax && dormitory.priceMin !== dormitory.priceMax
              ? `${Number(dormitory.priceMin).toLocaleString()} - ${Number(dormitory.priceMax).toLocaleString()}`
              : `${Number(dormitory.priceMin || 3500).toLocaleString()}`;

            return (
              <div
                key={historyId || targetId}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between"
                }}
                className="fav-card-item"
              >
                <div>
                  <div style={{ position: "relative", width: "100%", height: "170px", backgroundColor: "#f1f5f9" }}>
                    <img
                      src={heroImg}
                      alt={dormitory.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "/images/banner.jpg"; }}
                    />
                  </div>

                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0", lineHeight: "1.3" }}>
                      {dormitory.name}
                    </h3>
                    <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                      <i className="fa-solid fa-location-dot" style={{ color: "#5b8e66", fontSize: "14px" }}></i>
                      <span>{dormitory.district ? `อำเภอ${dormitory.district}` : (dormitory.address || "อำเภอเมืองเลย")}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                      เข้าชมเมื่อ: {formatDateTime(viewedAt)}
                    </div>
                  </div>
                </div>

                <div style={{ padding: "12px 16px 16px 16px", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                  <div>
                    <span style={{ fontSize: "14px", fontWeight: "700", color: "#d97706" }}>
                      {priceText}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b", display: "block" }}>
                      บาท/เดือน
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(dormitory.id)}
                      style={{
                        backgroundColor: "#ffffff",
                        color: "#ef4444",
                        border: "1px solid #fca5a5",
                        borderRadius: "8px",
                        padding: "7px 12px",
                        fontSize: "13px",
                        fontWeight: "600",
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      title="ลบประวัติ"
                    >
                      <i className="fa-solid fa-trash-can" style={{ fontSize: "13px" }}></i>
                      <span>ลบ</span>
                    </button>

                    <Link to={`/dorms/${targetId}`} style={{ textDecoration: "none", flex: 1 }}>
                      <button
                        type="button"
                        style={{
                          width: "100%",
                          backgroundColor: "#688d67",
                          color: "#ffffff",
                          border: "none",
                          borderRadius: "8px",
                          padding: "8px 0",
                          fontSize: "13px",
                          fontWeight: "600",
                          cursor: "pointer",
                          textAlign: "center"
                        }}
                      >
                        ดูรายละเอียด
                      </button>
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
