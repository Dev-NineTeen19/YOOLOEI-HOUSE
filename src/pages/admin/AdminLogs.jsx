import { useState, useEffect } from "react";
import { api } from "../../services/apiClient";

export default function AdminLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState("all");

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/logs");
      setLogs(res.logs || []);
    } catch (err) {
      console.error("Error loading logs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const formatTime = (isoString) => {
    if (!isoString) return "";
    const date = new Date(isoString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const filteredLogs = logs.filter((log) => {
    if (filterType === "new_user") return log.type === "new_user";
    return true;
  });

  const newUserCount = logs.filter((l) => l.type === "new_user").length;

  return (
    <div>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>บันทึกกิจกรรมในระบบ (Activity Logs)</h1>
          <p style={{ color: "#777", fontSize: "14px" }}>ติดตามการสมัครสมาชิกของผู้ใช้งานใหม่ และกิจกรรมสำคัญในระบบเพื่อความปลอดภัย</p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            type="button"
            onClick={() => setFilterType("all")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: filterType === "all" ? "1.5px solid #7da27c" : "1px solid #ccc",
              background: filterType === "all" ? "#eef6ee" : "#fff",
              color: filterType === "all" ? "#2e7d32" : "#555",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer"
            }}
          >
            กิจกรรมทั้งหมด ({logs.length})
          </button>
          <button
            type="button"
            onClick={() => setFilterType("new_user")}
            style={{
              padding: "8px 16px",
              borderRadius: "6px",
              border: filterType === "new_user" ? "1.5px solid #2563eb" : "1px solid #ccc",
              background: filterType === "new_user" ? "#eff6ff" : "#fff",
              color: filterType === "new_user" ? "#1d4ed8" : "#555",
              fontWeight: 600,
              fontSize: "14px",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <i className="fa-solid fa-user-plus"></i> สมาชิกใหม่ ({newUserCount})
          </button>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดบันทึกกิจกรรม...
            </div>
          ) : filteredLogs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              ยังไม่มีประวัติกิจกรรมในหมวดหมู่นี้
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ประเภทกิจกรรม</th>
                    <th>รายละเอียด</th>
                    <th>ดำเนินการโดย</th>
                    <th>เวลาที่เกิดขึ้น</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLogs.map((log) => {
                    const isNewUser = log.type === "new_user";

                    return (
                      <tr key={log.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {isNewUser ? (
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#eff6ff", color: "#2563eb", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                                <i className="fa-solid fa-user-plus"></i>
                              </div>
                            ) : (
                              <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#f3f4f6", color: "#4b5563", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px" }}>
                                <i className="fa-solid fa-clock-rotate-left"></i>
                              </div>
                            )}
                            <div>
                              <strong style={{ fontSize: "14px", color: "#333" }}>{log.action}</strong>
                              {isNewUser && (
                                <span style={{ marginLeft: "8px", fontSize: "11px", background: "#dbeafe", color: "#1e40af", padding: "2px 8px", borderRadius: "10px", fontWeight: 600 }}>
                                  ผู้ใช้งานใหม่
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          <span style={{ color: "#555", fontSize: "13px" }}>{log.details || "-"}</span>
                        </td>
                        <td>
                          <strong style={{ color: "#444", fontSize: "13px" }}>{log.performed_by || "system"}</strong>
                        </td>
                        <td style={{ color: "#777", fontSize: "13px", whiteSpace: "nowrap" }}>
                          {formatTime(log.created_at)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
