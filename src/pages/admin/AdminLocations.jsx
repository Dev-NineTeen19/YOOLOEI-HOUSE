import { useState, useEffect } from "react";
import { getLocations, addLocation, updateLocation, deleteLocation } from "../../services/locationService";
import { getRoomTypes, addRoomType, updateRoomType, deleteRoomType } from "../../services/roomTypeService";
import "../../styles/dashboard.css";

export default function AdminLocations() {
  const [activeTab, setActiveTab] = useState("locations"); // "locations" | "roomTypes"

  // Location state
  const [locations, setLocations] = useState([]);
  const [locLoading, setLocLoading] = useState(true);
  const [locSearchQuery, setLocSearchQuery] = useState("");
  const [showLocModal, setShowLocModal] = useState(false);
  const [editingLocId, setEditingLocId] = useState(null);
  const [locName, setLocName] = useState("");
  const [locDescription, setLocDescription] = useState("");
  const [locErrorMsg, setLocErrorMsg] = useState("");
  const [locSuccessMsg, setLocSuccessMsg] = useState("");
  const [locSaving, setLocSaving] = useState(false);

  // Room Type state
  const [roomTypes, setRoomTypes] = useState([]);
  const [rtLoading, setRtLoading] = useState(true);
  const [rtSearchQuery, setRtSearchQuery] = useState("");
  const [showRtModal, setShowRtModal] = useState(false);
  const [editingRtId, setEditingRtId] = useState(null);
  const [rtName, setRtName] = useState("");
  const [rtCategory, setRtCategory] = useState("รูปแบบการเช่า");
  const [rtDescription, setRtDescription] = useState("");
  const [rtErrorMsg, setRtErrorMsg] = useState("");
  const [rtSuccessMsg, setRtSuccessMsg] = useState("");
  const [rtSaving, setRtSaving] = useState(false);

  // Fetch functions
  const fetchLocationsList = async () => {
    setLocLoading(true);
    try {
      const data = await getLocations();
      setLocations(data);
    } catch (err) {
      console.error("Failed to load locations:", err);
    } finally {
      setLocLoading(false);
    }
  };

  const fetchRoomTypesList = async () => {
    setRtLoading(true);
    try {
      const data = await getRoomTypes();
      setRoomTypes(data);
    } catch (err) {
      console.error("Failed to load room types:", err);
    } finally {
      setRtLoading(false);
    }
  };

  useEffect(() => {
    fetchLocationsList();
    fetchRoomTypesList();
  }, []);

  // Location Handlers
  const handleOpenAddLocModal = () => {
    setEditingLocId(null);
    setLocName("");
    setLocDescription("");
    setLocErrorMsg("");
    setLocSuccessMsg("");
    setShowLocModal(true);
  };

  const handleOpenEditLocModal = (loc) => {
    setEditingLocId(loc.id);
    setLocName(loc.name || "");
    setLocDescription(loc.description || "");
    setLocErrorMsg("");
    setLocSuccessMsg("");
    setShowLocModal(true);
  };

  const handleSaveLoc = async (e) => {
    e.preventDefault();
    if (!locName.trim()) {
      setLocErrorMsg("กรุณาระบุชื่อพื้นที่/โซน");
      return;
    }

    setLocSaving(true);
    setLocErrorMsg("");
    setLocSuccessMsg("");

    try {
      if (editingLocId) {
        await updateLocation(editingLocId, locName.trim(), locDescription.trim());
        setLocSuccessMsg("แก้ไขข้อมูลพื้นที่เรียบร้อยแล้ว");
      } else {
        await addLocation(locName.trim(), locDescription.trim());
        setLocSuccessMsg("เพิ่มพื้นที่ใหม่เรียบร้อยแล้ว");
      }

      await fetchLocationsList();
      setTimeout(() => {
        setShowLocModal(false);
        setLocSuccessMsg("");
      }, 1200);
    } catch (err) {
      setLocErrorMsg(err.error || err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLocSaving(false);
    }
  };

  const handleDeleteLoc = async (id, name) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบพื้นที่ "${name}"?`)) return;

    try {
      await deleteLocation(id);
      await fetchLocationsList();
    } catch (err) {
      alert("ไม่สามารถลบพื้นที่ได้: " + (err.error || err.message));
    }
  };

  // Room Type Handlers
  const handleOpenAddRtModal = () => {
    setEditingRtId(null);
    setRtName("");
    setRtCategory("รูปแบบการเช่า");
    setRtDescription("");
    setRtErrorMsg("");
    setRtSuccessMsg("");
    setShowRtModal(true);
  };

  const handleOpenEditRtModal = (rt) => {
    setEditingRtId(rt.id);
    setRtName(rt.name || "");
    setRtCategory(rt.category || "รูปแบบการเช่า");
    setRtDescription(rt.description || "");
    setRtErrorMsg("");
    setRtSuccessMsg("");
    setShowRtModal(true);
  };

  const handleSaveRt = async (e) => {
    e.preventDefault();
    if (!rtName.trim()) {
      setRtErrorMsg("กรุณาระบุชื่อประเภทห้อง/การเช่า");
      return;
    }

    setRtSaving(true);
    setRtErrorMsg("");
    setRtSuccessMsg("");

    try {
      if (editingRtId) {
        await updateRoomType(editingRtId, rtName.trim(), rtCategory, rtDescription.trim());
        setRtSuccessMsg("แก้ไขประเภทห้อง/การเช่าเรียบร้อยแล้ว");
      } else {
        await addRoomType(rtName.trim(), rtCategory, rtDescription.trim());
        setRtSuccessMsg("เพิ่มประเภทห้อง/การเช่าใหม่เรียบร้อยแล้ว");
      }

      await fetchRoomTypesList();
      setTimeout(() => {
        setShowRtModal(false);
        setRtSuccessMsg("");
      }, 1200);
    } catch (err) {
      setRtErrorMsg(err.error || err.message || "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setRtSaving(false);
    }
  };

  const handleDeleteRt = async (id, name) => {
    if (!window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบประเภทห้อง "${name}"?`)) return;

    try {
      await deleteRoomType(id);
      await fetchRoomTypesList();
    } catch (err) {
      alert("ไม่สามารถลบประเภทห้องได้: " + (err.error || err.message));
    }
  };

  // Filtered lists
  const filteredLocations = locations.filter((loc) =>
    (loc.name || "").toLowerCase().includes(locSearchQuery.toLowerCase()) ||
    (loc.description || "").toLowerCase().includes(locSearchQuery.toLowerCase())
  );

  const filteredRoomTypes = roomTypes.filter((rt) =>
    (rt.name || "").toLowerCase().includes(rtSearchQuery.toLowerCase()) ||
    (rt.category || "").toLowerCase().includes(rtSearchQuery.toLowerCase()) ||
    (rt.description || "").toLowerCase().includes(rtSearchQuery.toLowerCase())
  );

  return (
    <div className="dashboard-page" style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "700", color: "#1e293b", margin: 0, display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-map-location-dot" style={{ color: "#7da27c" }}></i>
          จัดการพื้นที่ & ประเภทห้องพัก
        </h2>
        <p style={{ color: "#64748b", margin: "4px 0 0 0", fontSize: "14px" }}>
          เพิ่ม แก้ไข และจัดการพื้นที่/โซน และประเภทห้องพัก (เช่น รายวัน, รายเดือน, ห้องแอร์, ห้องพัดลม) ในระบบ
        </p>
      </div>

      {/* Navigation Tabs */}
      <div style={{ display: "flex", gap: "12px", borderBottom: "2px solid #e2e8f0", marginBottom: "24px" }}>
        <button
          onClick={() => setActiveTab("locations")}
          style={{
            padding: "12px 20px",
            fontSize: "15px",
            fontWeight: "700",
            backgroundColor: "transparent",
            color: activeTab === "locations" ? "#5b8e66" : "#64748b",
            border: "none",
            borderBottom: activeTab === "locations" ? "3px solid #5b8e66" : "3px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <i className="fa-solid fa-location-dot"></i>
          จัดการพื้นที่ / โซนหอพัก ({locations.length})
        </button>

        <button
          onClick={() => setActiveTab("roomTypes")}
          style={{
            padding: "12px 20px",
            fontSize: "15px",
            fontWeight: "700",
            backgroundColor: "transparent",
            color: activeTab === "roomTypes" ? "#5b8e66" : "#64748b",
            border: "none",
            borderBottom: activeTab === "roomTypes" ? "3px solid #5b8e66" : "3px solid transparent",
            marginBottom: "-2px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "all 0.2s"
          }}
        >
          <i className="fa-solid fa-door-open"></i>
          จัดการประเภทห้อง / การเช่า ({roomTypes.length})
        </button>
      </div>

      {/* =====================================================
                       TAB 1: LOCATIONS MANAGEMENT
      ===================================================== */}
      {activeTab === "locations" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", maxWidth: "400px", width: "100%" }}>
              <input
                type="text"
                placeholder="ค้นหาชื่อพื้นที่/โซน..."
                value={locSearchQuery}
                onChange={(e) => setLocSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8"
                }}
              ></i>
            </div>

            <button
              onClick={handleOpenAddLocModal}
              style={{
                backgroundColor: "#7da27c",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(125, 162, 124, 0.3)"
              }}
            >
              <i className="fa-solid fa-plus"></i>
              เพิ่มพื้นที่ใหม่
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {locLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                กำลังโหลดข้อมูลพื้นที่...
              </div>
            ) : filteredLocations.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                {locSearchQuery ? "ไม่พบข้อมูลพื้นที่ที่ตรงกับการค้นหา" : "ยังไม่มีข้อมูลพื้นที่ในระบบ"}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>#</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>ชื่อพื้นที่ / โซน</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>รายละเอียด</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569", textAlign: "right" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLocations.map((loc, idx) => (
                    <tr key={loc.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <i className="fa-solid fa-location-dot" style={{ color: "#7da27c", fontSize: "13px" }}></i>
                          {loc.name}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>
                        {loc.description || "-"}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenEditLocModal(loc)}
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#3b82f6",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            cursor: "pointer",
                            marginRight: "8px"
                          }}
                          title="แก้ไข"
                        >
                          <i className="fa-solid fa-pen"></i> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteLoc(loc.id, loc.name)}
                          style={{
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                          title="ลบ"
                        >
                          <i className="fa-solid fa-trash-can"></i> ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* =====================================================
                     TAB 2: ROOM TYPES MANAGEMENT
      ===================================================== */}
      {activeTab === "roomTypes" && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
            <div style={{ position: "relative", maxWidth: "400px", width: "100%" }}>
              <input
                type="text"
                placeholder="ค้นหาประเภทห้อง/การเช่า (เช่น รายวัน, รายเดือน)..."
                value={rtSearchQuery}
                onChange={(e) => setRtSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 16px 10px 40px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "14px",
                  outline: "none"
                }}
              />
              <i
                className="fa-solid fa-magnifying-glass"
                style={{
                  position: "absolute",
                  left: "14px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8"
                }}
              ></i>
            </div>

            <button
              onClick={handleOpenAddRtModal}
              style={{
                backgroundColor: "#7da27c",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                padding: "10px 20px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                boxShadow: "0 2px 4px rgba(125, 162, 124, 0.3)"
              }}
            >
              <i className="fa-solid fa-plus"></i>
              เพิ่มประเภทห้องใหม่
            </button>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", overflow: "hidden", boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}>
            {rtLoading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                กำลังโหลดข้อมูลประเภทห้อง...
              </div>
            ) : filteredRoomTypes.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#64748b" }}>
                {rtSearchQuery ? "ไม่พบข้อมูลประเภทห้องที่ตรงกับการค้นหา" : "ยังไม่มีข้อมูลประเภทห้องในระบบ"}
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>#</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>ชื่อประเภทห้อง / รูปแบบเช่า</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>หมวดหมู่</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569" }}>คำอธิบาย</th>
                    <th style={{ padding: "14px 20px", fontSize: "13px", fontWeight: "600", color: "#475569", textAlign: "right" }}>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRoomTypes.map((rt, idx) => (
                    <tr key={rt.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>{idx + 1}</td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <i className="fa-solid fa-door-closed" style={{ color: "#7da27c", fontSize: "13px" }}></i>
                          {rt.name}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "13px" }}>
                        <span
                          style={{
                            backgroundColor: rt.category === "รูปแบบการเช่า" ? "#e0f2fe" : "#f1f5f9",
                            color: rt.category === "รูปแบบการเช่า" ? "#0284c7" : "#475569",
                            padding: "4px 10px",
                            borderRadius: "12px",
                            fontWeight: "600"
                          }}
                        >
                          {rt.category || "ทั่วไป"}
                        </span>
                      </td>
                      <td style={{ padding: "14px 20px", fontSize: "14px", color: "#64748b" }}>
                        {rt.description || "-"}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "right" }}>
                        <button
                          onClick={() => handleOpenEditRtModal(rt)}
                          style={{
                            backgroundColor: "#f1f5f9",
                            color: "#3b82f6",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            cursor: "pointer",
                            marginRight: "8px"
                          }}
                          title="แก้ไข"
                        >
                          <i className="fa-solid fa-pen"></i> แก้ไข
                        </button>
                        <button
                          onClick={() => handleDeleteRt(rt.id, rt.name)}
                          style={{
                            backgroundColor: "#fef2f2",
                            color: "#ef4444",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 12px",
                            fontSize: "13px",
                            cursor: "pointer"
                          }}
                          title="ลบ"
                        >
                          <i className="fa-solid fa-trash-can"></i> ลบ
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* Modal Add/Edit Location */}
      {showLocModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                {editingLocId ? "แก้ไขพื้นที่ / โซน" : "เพิ่มพื้นที่ / โซนใหม่"}
              </h3>
              <button
                onClick={() => setShowLocModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#94a3b8", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {locErrorMsg && (
              <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "14px", marginBottom: "14px" }}>
                {locErrorMsg}
              </div>
            )}

            {locSuccessMsg && (
              <div style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "6px", fontSize: "14px", marginBottom: "14px" }}>
                {locSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveLoc}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  ชื่อพื้นที่ / โซน <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น กำเนิดเพชร, เชียงคาน, ราชภัฏเลย..."
                  value={locName}
                  onChange={(e) => setLocName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  รายละเอียดเพิ่มเติม
                </label>
                <textarea
                  placeholder="รายละเอียดเพิ่มเติมเกี่ยวกับพื้นที่นี้ (ถ้ามี)"
                  value={locDescription}
                  onChange={(e) => setLocDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowLocModal(false)}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 18px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={locSaving}
                  style={{
                    backgroundColor: "#7da27c",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: locSaving ? "not-allowed" : "pointer",
                    opacity: locSaving ? 0.7 : 1
                  }}
                >
                  {locSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add/Edit Room Type */}
      {showRtModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1100,
            padding: "16px"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              width: "100%",
              maxWidth: "480px",
              padding: "24px",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", margin: 0 }}>
                {editingRtId ? "แก้ไขประเภทห้อง / รูปแบบการเช่า" : "เพิ่มประเภทห้อง / รูปแบบการเช่าใหม่"}
              </h3>
              <button
                onClick={() => setShowRtModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", color: "#94a3b8", cursor: "pointer" }}
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {rtErrorMsg && (
              <div style={{ backgroundColor: "#fef2f2", color: "#dc2626", padding: "10px 14px", borderRadius: "6px", fontSize: "14px", marginBottom: "14px" }}>
                {rtErrorMsg}
              </div>
            )}

            {rtSuccessMsg && (
              <div style={{ backgroundColor: "#f0fdf4", color: "#16a34a", padding: "10px 14px", borderRadius: "6px", fontSize: "14px", marginBottom: "14px" }}>
                {rtSuccessMsg}
              </div>
            )}

            <form onSubmit={handleSaveRt}>
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  ชื่อประเภทห้อง / รูปแบบการเช่า <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="เช่น รายวัน, รายเดือน, ห้องแอร์, ห้องพัดลม..."
                  value={rtName}
                  onChange={(e) => setRtName(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none"
                  }}
                  autoFocus
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  หมวดหมู่
                </label>
                <select
                  value={rtCategory}
                  onChange={(e) => setRtCategory(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    backgroundColor: "#ffffff"
                  }}
                >
                  <option value="รูปแบบการเช่า">รูปแบบการเช่า (เช่น รายวัน, รายเดือน)</option>
                  <option value="ประเภทห้อง">ประเภทห้อง (เช่น ห้องแอร์, ห้องพัดลม)</option>
                  <option value="ประเภทสิ่งอำนวยความสะดวก">ประเภทสิ่งอำนวยความสะดวก</option>
                  <option value="ทั่วไป">ทั่วไป</option>
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                  คำอธิบายเพิ่มเติม
                </label>
                <textarea
                  placeholder="คำอธิบายเพิ่มเติมเกี่ยวกับประเภทห้องนี้ (ถ้ามี)"
                  value={rtDescription}
                  onChange={(e) => setRtDescription(e.target.value)}
                  rows={3}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical"
                  }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowRtModal(false)}
                  style={{
                    backgroundColor: "#f1f5f9",
                    color: "#475569",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 18px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: "pointer"
                  }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={rtSaving}
                  style={{
                    backgroundColor: "#7da27c",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "6px",
                    padding: "10px 20px",
                    fontSize: "14px",
                    fontWeight: "600",
                    cursor: rtSaving ? "not-allowed" : "pointer",
                    opacity: rtSaving ? 0.7 : 1
                  }}
                >
                  {rtSaving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
