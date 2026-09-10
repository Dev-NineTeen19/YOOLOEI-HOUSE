import { useState, useEffect } from "react";
import { getAllUsersAdmin, updateUserRole, deleteUserDoc } from "../../services/userService";

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadOwners = async () => {
    setLoading(true);
    try {
      const data = await getAllUsersAdmin();
      setOwners(data.filter((u) => u.role === "owner"));
    } catch (err) {
      console.error("Error loading owners:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOwners();
  }, []);

  const handleRoleChange = async (uid, newRole) => {
    try {
      await updateUserRole(uid, newRole);
      alert("เปลี่ยนบทบาทสำเร็จเรียบร้อยแล้ว");
      await loadOwners();
    } catch (err) {
      console.error(err);
      alert(err.data?.error || err.message || "ไม่สามารถเปลี่ยนสิทธิ์ได้");
    }
  };

  const handleDelete = async (uid) => {
    if (window.confirm("คุณต้องการลบข้อมูลเจ้าของหอพักนี้ใช่หรือไม่?\n\nคำเตือน: หอพักและข้อมูลที่เกี่ยวข้องทั้งหมดจะถูกลบออกจากระบบอย่างถาวร")) {
      try {
        await deleteUserDoc(uid);
        alert("ลบข้อมูลเจ้าของหอพักเรียบร้อยแล้ว");
        await loadOwners();
      } catch (err) {
        console.error(err);
        alert(err.data?.error || err.message || "ไม่สามารถลบข้อมูลได้");
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>จัดการเจ้าของหอพัก (Owners)</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>รายชื่อเจ้าของหอพักทั้งหมดที่ลงทะเบียนในระบบ</p>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </div>
          ) : owners.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              ยังไม่มีข้อมูลเจ้าของหอพักในระบบ
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ชื่อเจ้าของหอพัก</th>
                    <th>อีเมล</th>
                    <th>เบอร์โทรศัพท์</th>
                    <th>สิทธิ์ในระบบ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((o) => (
                    <tr key={o.id}>
                      <td><strong>{o.displayName || `${o.firstName || ""} ${o.lastName || ""}`.trim() || "-"}</strong></td>
                      <td>{o.email}</td>
                      <td>{o.phone || "-"}</td>
                      <td>
                        <select
                          value={o.role || "owner"}
                          onChange={(e) => handleRoleChange(o.id, e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc" }}
                        >
                          <option value="owner">เจ้าของหอ (owner)</option>
                          <option value="user">ผู้เช่า (user)</option>
                          <option value="admin">แอดมิน (admin)</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDelete(o.id)}
                          title="ลบข้อมูล"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
