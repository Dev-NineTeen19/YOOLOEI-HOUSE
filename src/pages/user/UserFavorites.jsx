import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getUserFavorites, removeFavorite, clearAllFavorites } from "../../services/favoriteService";

export default function UserFavorites() {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'card'

  const loadFavorites = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      const favDorms = await getUserFavorites(userId);
      setFavorites(favDorms);
    } catch (err) {
      console.error("Error loading favorites:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFavorites();
  }, [currentUser]);

  const handleRemove = async (dormId) => {
    try {
      const userId = currentUser.id || currentUser.uid;
      await removeFavorite(userId, dormId);
      setFavorites((prev) => prev.filter((d) => d.id !== dormId && d.dormitoryId !== dormId));
    } catch (err) {
      console.error("Remove favorite error:", err);
      alert("ไม่สามารถลบรายการได้: " + (err.message || ""));
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("คุณต้องการล้างรายการหอพักที่บันทึกไว้ทั้งหมดใช่หรือไม่?")) return;
    setClearing(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      await clearAllFavorites(userId);
      setFavorites([]);
    } catch (err) {
      alert("ไม่สามารถล้างรายการได้: " + (err.message || ""));
    } finally {
      setClearing(false);
    }
  };

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
      {/* Header Bar matching ViewHistoryPage */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700, margin: "0 0 4px 0" }}>หอพักที่บันทึกไว้</h1>
          <p style={{ color: "#777", fontSize: "14px", margin: 0 }}>รายการหอพักที่คุณถูกใจและบันทึกไว้ดูย้อนหลัง</p>
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

          {/* Clear All Button */}
          {favorites.length > 0 && (
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
              <i className="fa-solid fa-trash-can"></i> {clearing ? "กำลังล้าง..." : "ล้างรายการทั้งหมด"}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
          <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดข้อมูลหอพักที่บันทึกไว้...
        </div>
      ) : favorites.length === 0 ? (
        <div className="content-card" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa-regular fa-heart" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
          <h3 style={{ color: "#555" }}>ยังไม่มีหอพักที่บันทึกไว้</h3>
          <p style={{ color: "#888", marginTop: "8px", marginBottom: "20px" }}>
            กดรูปหัวใจที่หอพัก เพื่อบันทึกเก็บไว้ดูย้อนหลังได้เลยครับ
          </p>
          <Link to="/dorms" className="btn-primary-action" style={{ textDecoration: "none" }}>
            <i className="fa-solid fa-magnifying-glass"></i> ค้นหาหอพักเลย
          </Link>
        </div>
      ) : viewMode === "table" ? (
        /* TABLE VIEW matching ViewHistoryPage */
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
                    <th>เวลาที่บันทึก</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {favorites.map((dorm) => {
                    const heroImg = Array.isArray(dorm.images) && dorm.images.length > 0
                      ? dorm.images[0]
                      : "/images/dorm-hero.jpg";

                    const targetId = dorm.id || dorm.dormitoryId;
                    const priceText = dorm.priceMin && dorm.priceMax && dorm.priceMin !== dorm.priceMax
                      ? `${Number(dorm.priceMin).toLocaleString()} - ${Number(dorm.priceMax).toLocaleString()} บาท`
                      : `${Number(dorm.priceMin || 0).toLocaleString()} บาท`;

                    return (
                      <tr key={targetId}>
                        <td style={{ width: "80px" }}>
                          <img
                            src={heroImg}
                            alt={dorm.name}
                            style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px" }}
                            onError={(e) => { e.target.src = "/images/dorm-hero.jpg"; }}
                          />
                        </td>
                        <td>
                          <strong>{dorm.name}</strong>
                        </td>
                        <td>{dorm.district ? `อำเภอ${dorm.district}` : "เมืองเลย"}</td>
                        <td>{priceText}</td>
                        <td>{formatDateTime(dorm.favoritedAt)}</td>
                        <td>
                          <div className="btn-action-group">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => navigate(`/dorms/${targetId}`)}
                              title="ดูรายละเอียด"
                            >
                              <i className="fa-solid fa-eye"></i>
                            </button>
                            <button
                              type="button"
                              className="btn-icon delete"
                              onClick={() => handleRemove(targetId)}
                              title="ยกเลิกการบันทึก"
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
        /* CARD VIEW with proper buttons matching screenshot */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
          {favorites.map((dorm) => {
            const targetId = dorm.id || dorm.dormitoryId;
            const heroImg = Array.isArray(dorm.images) && dorm.images.length > 0
              ? dorm.images[0]
              : "/images/dorm-hero.jpg";

            const priceText = dorm.priceMin && dorm.priceMax && dorm.priceMin !== dorm.priceMax
              ? `${Number(dorm.priceMin).toLocaleString()} - ${Number(dorm.priceMax).toLocaleString()}`
              : `${Number(dorm.priceMin || 3500).toLocaleString()}`;

            return (
              <div
                key={targetId}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  transition: "transform 0.2s, box-shadow 0.2s"
                }}
                className="fav-card-item"
              >
                <div>
                  {/* Top Image + Red Heart Badge */}
                  <div style={{ position: "relative", width: "100%", height: "170px", backgroundColor: "#f1f5f9" }}>
                    <img
                      src={heroImg}
                      alt={dorm.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "/images/banner.jpg"; }}
                    />
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        backgroundColor: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
                      }}
                      title="บันทึกแล้ว"
                    >
                      <i className="fa-solid fa-heart" style={{ color: "#ef4444", fontSize: "18px" }}></i>
                    </div>
                  </div>

                  {/* Body Info */}
                  <div style={{ padding: "16px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 8px 0", lineHeight: "1.3" }}>
                      {dorm.name}
                    </h3>

                    {/* Location */}
                    <div style={{ fontSize: "13px", color: "#64748b", display: "flex", alignItems: "center", gap: "6px", marginBottom: "10px" }}>
                      <i className="fa-solid fa-location-dot" style={{ color: "#5b8e66", fontSize: "14px" }}></i>
                      <span>{dorm.district ? `อำเภอ${dorm.district}` : (dorm.address || "อำเภอเมืองเลย")}</span>
                    </div>

                    {/* Room Details */}
                    <div style={{ fontSize: "13px", color: "#475569", display: "flex", gap: "14px", marginBottom: "10px" }}>
                      <span><i className="fa-solid fa-bed" style={{ color: "#688d67", marginRight: "6px" }}></i>1 ห้องนอน</span>
                      <span><i className="fa-solid fa-bath" style={{ color: "#688d67", marginRight: "6px" }}></i>1 ห้องน้ำ</span>
                    </div>

                    {/* Features */}
                    <div style={{ fontSize: "13px", color: "#475569", display: "flex", gap: "14px", marginBottom: "14px" }}>
                      <span><i className="fa-solid fa-snowflake" style={{ color: "#688d67", marginRight: "6px" }}></i>แอร์</span>
                      <span><i className="fa-solid fa-wifi" style={{ color: "#688d67", marginRight: "6px" }}></i>WiFi</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Row (Price + Actions) matching screenshot */}
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
                      onClick={() => handleRemove(targetId)}
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
                        gap: "6px",
                        transition: "all 0.2s"
                      }}
                      title="ยกเลิกการบันทึก"
                    >
                      <i className="fa-solid fa-trash-can" style={{ fontSize: "13px" }}></i>
                      <span>นำออก</span>
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
                          textAlign: "center",
                          transition: "all 0.2s"
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
