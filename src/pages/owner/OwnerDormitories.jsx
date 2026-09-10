import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDormitoriesByOwner, deleteDormitory } from "../../services/dormitoryService";

export default function OwnerDormitories() {
  const { currentUser } = useAuth();
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadDorms = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const ownerId = currentUser.id || currentUser.uid;
      const data = await getDormitoriesByOwner(ownerId);
      setDorms(data);
    } catch (err) {
      console.error("Error loading owner dorms:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDorms();
  }, [currentUser]);

  const handleDelete = async (dormId) => {
    if (window.confirm("ต้องการลบหอพักนี้ใช่ไหมครับ? หากลบแล้วจะไม่สามารถกู้คืนได้")) {
      try {
        await deleteDormitory(dormId);
        setDorms((prev) => prev.filter((d) => d.id !== dormId));
      } catch (err) {
        console.error("Delete dorm error:", err);
        alert("ไม่สามารถลบหอพักได้");
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>หอพักของฉัน</h1>
          <p style={{ color: "#777", fontSize: "14px" }}>รายการหอพักทั้งหมดที่คุณลงประกาศไว้</p>
        </div>
        <Link to="/owner/dormitories/create" className="btn-primary-action" style={{ textDecoration: "none" }}>
          <i className="fa-solid fa-plus"></i> ลงประกาศหอพัก
        </Link>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดข้อมูล...
            </div>
          ) : dorms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-building" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
              <h3 style={{ color: "#555" }}>ยังไม่มีหอพักที่ลงประกาศ</h3>
              <p style={{ color: "#888", marginTop: "8px", marginBottom: "20px" }}>
                เริ่มลงประกาศหอพัก เพื่อให้ผู้เช่าค้นหาและติดต่อสอบถามได้เลยครับ
              </p>
              <Link to="/owner/dormitories/create" className="btn-primary-action" style={{ textDecoration: "none" }}>
                <i className="fa-solid fa-plus"></i> ลงประกาศหอพัก
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>รูปปก</th>
                    <th>ชื่อหอพัก</th>
                    <th>อำเภอ</th>
                    <th>ราคา</th>
                    <th>สถานะ</th>
                    <th>คนดู</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {dorms.map((dorm) => (
                    <tr key={dorm.id}>
                      <td style={{ width: "80px" }}>
                        <img
                          src={(dorm.images && dorm.images[0]) || "/images/dorm-1.jpg"}
                          alt={dorm.name}
                          style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px" }}
                          onError={(e) => { e.target.src = "/images/banner.jpg"; }}
                        />
                      </td>
                      <td>
                        <strong>{dorm.name}</strong>
                      </td>
                      <td>{dorm.district || "เมืองเลย"}</td>
                      <td>{Number(dorm.priceMin || 0).toLocaleString()} - {Number(dorm.priceMax || 0).toLocaleString()} บาท</td>
                      <td>
                        <span className={`status-badge ${dorm.status}`}>
                          {dorm.status === "approved" ? "อนุมัติแล้ว" :
                           dorm.status === "rejected" ? "ไม่อนุมัติ" : "รอตรวจสอบ"}
                        </span>
                      </td>
                      <td>{dorm.viewCount || 0} ครั้ง</td>
                      <td>
                        <div className="btn-action-group">
                          <Link to={`/owner/dormitories/${dorm.id}/edit`} className="btn-icon" title="แก้ไขข้อมูล">
                            <i className="fa-solid fa-pen-to-square"></i>
                          </Link>
                          <Link to={`/dorms/${dorm.id}`} className="btn-icon" title="ดูหน้าหอพัก">
                            <i className="fa-solid fa-eye"></i>
                          </Link>
                          <button
                            type="button"
                            className="btn-icon delete"
                            onClick={() => handleDelete(dorm.id)}
                            title="ลบหอพักนี้"
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
