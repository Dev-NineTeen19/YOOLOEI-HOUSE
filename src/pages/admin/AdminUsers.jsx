import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getAllUsersAdmin, updateUserRole, deleteUserDoc } from "../../services/userService";

export default function AdminUsers() {
  const { currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersAdmin();
      setUsers(data);
    } catch (err) {
      console.error("Error loading users:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleRoleChange = async (uid, newRole, userName) => {
    const roleText = newRole === "owner" ? "เจ้าของหอ (owner)" : newRole === "admin" ? "แอดมิน (admin)" : "ผู้เช่า (user)";
    if (!window.confirm(`คุณต้องการเปลี่ยนบทบาทของ "${userName || 'ผู้ใช้งาน'}" เป็น "${roleText}" ใช่หรือไม่?`)) {
      return;
    }

    setActionLoadingId(uid);
    try {
      await updateUserRole(uid, newRole);
      alert("เปลี่ยนบทบาทเรียบร้อยแล้ว");
      await loadUsers();
    } catch (err) {
      console.error(err);
      alert(err.data?.error || err.message || "ไม่สามารถเปลี่ยนสิทธิ์ได้");
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDelete = async (uid, userName) => {
    const currentId = currentUser?.id || currentUser?.uid;
    if (uid === currentId) {
      alert("ไม่สามารถลบบัญชีผู้ดูแลระบบที่กำลังใช้งานอยู่ได้");
      return;
    }

    if (window.confirm(`คุณต้องการลบข้อมูลผู้ใช้งาน "${userName || 'นี้'}" ใช่หรือไม่?\n\nคำเตือน: ข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบออกจากระบบอย่างถาวร`)) {
      setActionLoadingId(uid);
      try {
        await deleteUserDoc(uid);
        alert("ลบผู้ใช้งานเรียบร้อยแล้ว");
        await loadUsers();
      } catch (err) {
        console.error(err);
        alert(err.data?.error || err.message || "ไม่สามารถลบผู้ใช้งานได้");
      } finally {
        setActionLoadingId(null);
      }
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesRole = roleFilter === "all" ? true : u.role === roleFilter;
    const name = (u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "").toLowerCase();
    const email = (u.email || "").toLowerCase();
    const phone = (u.phone || "").toLowerCase();
    const query = searchTerm.toLowerCase();
    const matchesSearch = !query || name.includes(query) || email.includes(query) || phone.includes(query);
    return matchesRole && matchesSearch;
  });

  const currentId = currentUser?.id || currentUser?.uid;

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>จัดการผู้ใช้งาน (Users)</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>จัดการรายชื่อสมาชิก, เปลี่ยนแปลงบทบาท และลบบัญชีผู้ใช้งานในระบบ</p>
      </div>

      {/* Tabs and Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
          {[
            { key: "all", label: "ทั้งหมด", count: users.length },
            { key: "user", label: "ผู้เช่า (User)", count: users.filter((u) => u.role === "user").length },
            { key: "owner", label: "เจ้าของหอ (Owner)", count: users.filter((u) => u.role === "owner").length },
            { key: "admin", label: "แอดมิน (Admin)", count: users.filter((u) => u.role === "admin").length },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setRoleFilter(tab.key)}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: roleFilter === tab.key ? "#7da27c" : "#d8dfd7",
                background: roleFilter === tab.key ? "#7da27c" : "#fff",
                color: roleFilter === tab.key ? "#fff" : "#555",
                fontWeight: roleFilter === tab.key ? 600 : 400,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>

        <div style={{
          display: "flex",
          alignItems: "center",
          background: "#fff",
          border: "1px solid #d8dfd7",
          borderRadius: "20px",
          padding: "6px 14px",
          gap: "8px",
          minWidth: "240px"
        }}>
          <i className="fa-solid fa-magnifying-glass" style={{ color: "#888", fontSize: "12px" }}></i>
          <input
            type="text"
            placeholder="ค้นหาชื่อ, อีเมล, เบอร์โทร..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{
              border: "none",
              outline: "none",
              width: "100%",
              fontSize: "13px",
              fontFamily: "inherit"
            }}
          />
          {searchTerm && (
            <i
              className="fa-solid fa-xmark"
              onClick={() => setSearchTerm("")}
              style={{ color: "#999", cursor: "pointer", fontSize: "12px" }}
            ></i>
          )}
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              <i className="fa-solid fa-users" style={{ fontSize: "36px", color: "#ccc", marginBottom: "12px" }}></i>
              <p>ไม่พบข้อมูลผู้ใช้งานที่ตรงกับเงื่อนไข</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ชื่อ-นามสกุล</th>
                    <th>อีเมล</th>
                    <th>เบอร์โทรศัพท์</th>
                    <th>วันที่สมัคร</th>
                    <th>เปลี่ยนบทบาท</th>
                    <th style={{ textAlign: "center" }}>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = u.id === currentId;
                    const isBusy = actionLoadingId === u.id;
                    const displayName = u.displayName || `${u.firstName || ""} ${u.lastName || ""}`.trim() || u.username || "-";

                    return (
                      <tr key={u.id} style={{ opacity: isBusy ? 0.6 : 1 }}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            {u.avatarUrl ? (
                              <img
                                src={u.avatarUrl}
                                alt={displayName}
                                style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover" }}
                                onError={(e) => { e.target.style.display = "none"; }}
                              />
                            ) : (
                              <div style={{
                                width: "32px",
                                height: "32px",
                                borderRadius: "50%",
                                background: u.role === "admin" ? "#8b5cf6" : u.role === "owner" ? "#0ea5e9" : "#7da27c",
                                color: "#fff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                fontSize: "13px",
                                fontWeight: 600
                              }}>
                                {displayName.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <strong>{displayName}</strong>
                              {isSelf && (
                                <span style={{
                                  marginLeft: "6px",
                                  fontSize: "11px",
                                  background: "#f3f4f6",
                                  color: "#4b5563",
                                  padding: "2px 6px",
                                  borderRadius: "4px"
                                }}>
                                  (บัญชีของคุณ)
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>{u.email}</td>
                        <td>{u.phone || "-"}</td>
                        <td style={{ fontSize: "13px", color: "#666" }}>
                          {u.createdAt ? new Date(u.createdAt).toLocaleDateString("th-TH") : "-"}
                        </td>
                        <td>
                          <select
                            value={u.role || "user"}
                            onChange={(e) => handleRoleChange(u.id, e.target.value, displayName)}
                            disabled={isBusy || isSelf}
                            style={{
                              padding: "6px 10px",
                              borderRadius: "6px",
                              border: "1px solid #ccc",
                              fontSize: "13px",
                              fontWeight: 500,
                              background: u.role === "admin" ? "#faf5ff" : u.role === "owner" ? "#f0f9ff" : "#f0fdf4",
                              color: u.role === "admin" ? "#7e22ce" : u.role === "owner" ? "#0369a1" : "#15803d",
                              cursor: isSelf ? "not-allowed" : "pointer"
                            }}
                            title={isSelf ? "ไม่สามารถเปลี่ยนบทบาทของตัวเองได้" : "เลือกบทบาทใหม่"}
                          >
                            <option value="user">ผู้เช่า (user)</option>
                            <option value="owner">เจ้าของหอ (owner)</option>
                            <option value="admin">แอดมิน (admin)</option>
                          </select>
                        </td>
                        <td style={{ textAlign: "center" }}>
                          <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                            {!isSelf && (
                              <Link
                                to={`/admin/messages?ownerId=${u.id}&ownerName=${encodeURIComponent(displayName)}`}
                                className="btn-icon"
                                style={{
                                  background: "#e0f2fe",
                                  color: "#0369a1",
                                  border: "none",
                                  borderRadius: "4px",
                                  padding: "6px 10px",
                                  cursor: "pointer",
                                  textDecoration: "none",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  justifyContent: "center"
                                }}
                                title="ทักแชทหาผู้ใช้งานนี้"
                              >
                                <i className="fa-solid fa-comments"></i>
                              </Link>
                            )}
                            <button
                              className="btn-icon delete"
                              onClick={() => handleDelete(u.id, displayName)}
                              disabled={isBusy || isSelf}
                              title={isSelf ? "ไม่สามารถลบบัญชีของตนเองได้" : "ลบข้อมูลผู้ใช้งาน"}
                              style={{
                                opacity: isSelf ? 0.3 : 1,
                                cursor: isSelf ? "not-allowed" : "pointer"
                              }}
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
          )}
        </div>
      </div>
    </div>
  );
}
