import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllDormitoriesAdmin, setDormitoryStatus, deleteDormitory } from "../../services/dormitoryService";

export default function AdminDormitories() {
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");

  const loadDorms = async () => {
    setLoading(true);
    try {
      const data = await getAllDormitoriesAdmin();
      setDorms(data);
    } catch (err) {
      console.error("Error loading dorms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDorms();
  }, []);

  const handleStatus = async (dormId, status) => {
    try {
      await setDormitoryStatus(dormId, status);
      loadDorms();
    } catch (err) {
      console.error(err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const handleDelete = async (dormId) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหอพักนี้?")) {
      try {
        await deleteDormitory(dormId);
        loadDorms();
      } catch (err) {
        console.error(err);
        alert("ไม่สามารถลบหอพักได้");
      }
    }
  };

  const filteredDorms = filterStatus === "all"
    ? dorms
    : dorms.filter((d) => d.status === filterStatus);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>จัดการหอพักทั้งหมด</h1>
          <p style={{ color: "#777", fontSize: "14px" }}>ตรวจสอบ อนุมัติ ปฏิเสธ หรือลบหอพักในระบบ</p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          {["all", "pending", "approved", "rejected"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={filterStatus === st ? "btn-primary-action" : "btn-secondary-action"}
              style={{ padding: "6px 14px", fontSize: "13px" }}
            >
              {st === "all" ? "ทั้งหมด" : st === "pending" ? "รอตรวจสอบ" : st === "approved" ? "อนุมัติแล้ว" : "ไม่อนุมัติ"}
            </button>
          ))}
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
            </div>
          ) : filteredDorms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              ไม่พบข้อมูลหอพักตามเงื่อนไข
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ชื่อหอพัก</th>
                    <th>เจ้าของ</th>
                    <th>อำเภอ</th>
                    <th>ช่วงราคา</th>
                    <th>สถานะ</th>
                    <th>การดำเนินการ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDorms.map((dorm) => (
                    <tr key={dorm.id}>
                      <td><strong>{dorm.name}</strong></td>
                      <td>{dorm.ownerName || dorm.ownerId}</td>
                      <td>{dorm.district || "เมืองเลย"}</td>
                      <td>{Number(dorm.priceMin || 0).toLocaleString()} - {Number(dorm.priceMax || 0).toLocaleString()} บาท</td>
                      <td>
                        <span className={`status-badge ${dorm.status}`}>
                          {dorm.status === "approved" ? "อนุมัติแล้ว" :
                           dorm.status === "rejected" ? "ไม่อนุมัติ" : "รอตรวจสอบ"}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          {dorm.status !== "approved" && (
                            <button
                              onClick={() => handleStatus(dorm.id, "approved")}
                              style={{ background: "#2e7d32", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              title="อนุมัติ"
                            >
                              <i className="fa-solid fa-check"></i>
                            </button>
                          )}
                          {dorm.status !== "rejected" && (
                            <button
                              onClick={() => handleStatus(dorm.id, "rejected")}
                              style={{ background: "#f57f17", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", cursor: "pointer", fontSize: "12px" }}
                              title="ปฏิเสธ"
                            >
                              <i className="fa-solid fa-ban"></i>
                            </button>
                          )}
                          <Link to={`/dorms/${dorm.id}`}>
                            <button className="btn-icon" title="ดูหน้าเว็บ">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          </Link>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDelete(dorm.id)}
                            title="ลบหอพัก"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
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
