import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllDormitoriesAdmin, setDormitoryStatus, deleteDormitory } from "../../services/dormitoryService";
import { getAllUsersAdmin } from "../../services/userService";
import { getAllBookingsAdmin } from "../../services/bookingService";
import { getAllReviewsAdmin } from "../../services/reviewService";

export default function AdminDashboard() {
  const [dorms, setDorms] = useState([]);
  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [dormList, userList, bookingList, reviewList] = await Promise.all([
        getAllDormitoriesAdmin(),
        getAllUsersAdmin(),
        getAllBookingsAdmin(),
        getAllReviewsAdmin()
      ]);
      setDorms(dormList);
      setUsers(userList);
      setBookings(bookingList);
      setReviews(reviewList);
    } catch (err) {
      console.error("Error loading admin data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const handleStatusChange = async (dormId, status) => {
    try {
      await setDormitoryStatus(dormId, status);
      loadAllData();
    } catch (err) {
      console.error("Error updating status:", err);
      alert("ไม่สามารถอัปเดตสถานะได้");
    }
  };

  const handleDeleteDorm = async (dormId) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบหอพักนี้ออกจากระบบ?")) {
      try {
        await deleteDormitory(dormId);
        loadAllData();
      } catch (err) {
        console.error("Error deleting dorm:", err);
        alert("ไม่สามารถลบหอพักได้");
      }
    }
  };

  const normalUsers = users.filter((u) => u.role === "user");
  const owners = users.filter((u) => u.role === "owner");
  const pendingDorms = dorms.filter((d) => d.status === "pending");

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>ภาพรวมระบบ (Admin Dashboard)</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ตรวจสอบสถิติ อนุมัติหอพัก และจัดการข้อมูลทั้งหมดในระบบ</p>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e3f2fd", color: "#1976d2" }}>
            <i className="fa-solid fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : normalUsers.length}</h3>
            <p>ผู้เช่า (Users)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#f3e5f5", color: "#7b1fa2" }}>
            <i className="fa-solid fa-user-tie"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : owners.length}</h3>
            <p>เจ้าของหอ (Owners)</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-hotel"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : dorms.length}</h3>
            <p>หอพักทั้งหมด</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff8e1", color: "#f57f17" }}>
            <i className="fa-solid fa-clock-rotate-left"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : pendingDorms.length}</h3>
            <p>หอพักรอตรวจสอบ</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#e8f5e9", color: "#2e7d32" }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : bookings.length}</h3>
            <p>การจองทั้งหมด</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff3e0", color: "#e65100" }}>
            <i className="fa-solid fa-star"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : reviews.length}</h3>
            <p>รีวิวทั้งหมด</p>
          </div>
        </div>
      </div>

      {/* Pending Dormitories Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>
            <i className="fa-solid fa-triangle-exclamation" style={{ color: "#f57f17", marginRight: "8px" }}></i>
            หอพักที่รอการตรวจสอบและอนุมัติ ({pendingDorms.length})
          </h3>
          <Link to="/admin/dormitories" style={{ color: "#7da27c", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            ดูหอพักทั้งหมด <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        <div className="content-card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ชื่อหอพัก</th>
                  <th>เจ้าของหอพัก</th>
                  <th>อำเภอ / ที่อยู่</th>
                  <th>ช่วงราคา</th>
                  <th>สถานะ</th>
                  <th>การดำเนินการ (อนุมัติ / ปฏิเสธ)</th>
                </tr>
              </thead>
              <tbody>
                {pendingDorms.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      ไม่มีหอพักที่รอการตรวจสอบในขณะนี้ ทุกรายการได้รับการอนุมัติเรียบร้อย
                    </td>
                  </tr>
                ) : (
                  pendingDorms.map((dorm) => (
                    <tr key={dorm.id}>
                      <td>
                        <strong>{dorm.name}</strong>
                      </td>
                      <td>{dorm.ownerName || dorm.ownerId || "-"}</td>
                      <td>{dorm.district || dorm.address}</td>
                      <td>{Number(dorm.priceMin || 0).toLocaleString()} - {Number(dorm.priceMax || 0).toLocaleString()} บาท</td>
                      <td>
                        <span className="status-badge pending">รอตรวจสอบ</span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => handleStatusChange(dorm.id, "approved")}
                            style={{
                              background: "#2e7d32",
                              color: "#fff",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <i className="fa-solid fa-check"></i> อนุมัติ
                          </button>
                          <button
                            onClick={() => handleStatusChange(dorm.id, "rejected")}
                            style={{
                              background: "#c62828",
                              color: "#fff",
                              border: "none",
                              padding: "6px 14px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "13px",
                              fontWeight: 600,
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i> ปฏิเสธ
                          </button>
                          <Link to={`/dorms/${dorm.id}`}>
                            <button className="btn-icon" title="ดูข้อมูล">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          </Link>
                          <button
                            className="btn-icon delete"
                            onClick={() => handleDeleteDorm(dorm.id)}
                            title="ลบ"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
