import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDormitoriesByOwner } from "../../services/dormitoryService";
import { getBookingsByOwner, updateBookingStatus } from "../../services/bookingService";
import { getRoomsByOwner } from "../../services/roomService";

export default function OwnerDashboard() {
  const { currentUser, userData } = useAuth();
  const [dorms, setDorms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const [dormList, bookingList, roomList] = await Promise.all([
        getDormitoriesByOwner(currentUser.uid),
        getBookingsByOwner(currentUser.uid),
        getRoomsByOwner(currentUser.uid)
      ]);
      setDorms(dormList);
      setBookings(bookingList);
      setRooms(roomList);
    } catch (err) {
      console.error("Error loading owner dashboard:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentUser]);

  const handleUpdateStatus = async (bookingId, newStatus) => {
    try {
      await updateBookingStatus(bookingId, newStatus);
      loadData();
    } catch (err) {
      console.error("Error updating booking status:", err);
      alert("ไม่สามารถเปลี่ยนสถานะได้");
    }
  };

  const pendingBookings = bookings.filter((b) => b.status === "pending");

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>
            แดชบอร์ดเจ้าของหอพัก, {userData?.displayName || "คุณเจ้าของหอ"}
          </h1>
          <p style={{ color: "#777", fontSize: "14px" }}>จัดการหอพัก ห้องพัก และคำขอจองของผู้เช่า</p>
        </div>
        <Link to="/owner/dormitories/create" style={{ textDecoration: "none" }}>
          <button className="btn-primary-action">
            <i className="fa-solid fa-plus"></i> เพิ่มหอพักใหม่
          </button>
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-building"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : dorms.length}</h3>
            <p>หอพักของฉัน</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="fa-solid fa-bed"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : rooms.length}</h3>
            <p>ห้องพักทั้งหมด</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#fff8e1", color: "#f57f17" }}>
            <i className="fa-solid fa-clock"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : pendingBookings.length}</h3>
            <p>การจองรออนุมัติ</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: "#eef8ee", color: "#2e7d32" }}>
            <i className="fa-solid fa-calendar-check"></i>
          </div>
          <div className="stat-info">
            <h3>{loading ? "-" : bookings.length}</h3>
            <p>การจองทั้งหมด</p>
          </div>
        </div>
      </div>

      {/* Pending Bookings Table */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>คำขอจองห้องพักที่รอการอนุมัติ ({pendingBookings.length})</h3>
          <Link to="/owner/bookings" style={{ color: "#7da27c", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            ดูการจองทั้งหมด <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        <div className="content-card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ผู้ขอจอง</th>
                  <th>เบอร์โทรศัพท์</th>
                  <th>หอพัก</th>
                  <th>ห้องพัก</th>
                  <th>วันที่ต้องการเข้าพัก</th>
                  <th>การดำเนินการ</th>
                </tr>
              </thead>
              <tbody>
                {pendingBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      ไม่มีคำขอจองที่รอการอนุมัติในขณะนี้
                    </td>
                  </tr>
                ) : (
                  pendingBookings.slice(0, 5).map((booking) => (
                    <tr key={booking.id}>
                      <td><strong>{booking.userName || booking.userEmail}</strong></td>
                      <td>{booking.userPhone || "-"}</td>
                      <td>{booking.dormitoryName}</td>
                      <td>{booking.roomNumber}</td>
                      <td>{booking.bookingDate}</td>
                      <td>
                        <div className="btn-action-group">
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "approved")}
                            style={{
                              background: "#2e7d32",
                              color: "#fff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600
                            }}
                          >
                            <i className="fa-solid fa-check"></i> อนุมัติ
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(booking.id, "rejected")}
                            style={{
                              background: "#c62828",
                              color: "#fff",
                              border: "none",
                              padding: "6px 12px",
                              borderRadius: "4px",
                              cursor: "pointer",
                              fontSize: "12px",
                              fontWeight: 600
                            }}
                          >
                            <i className="fa-solid fa-xmark"></i> ปฏิเสธ
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

      {/* My Dormitories Quick Summary */}
      <div className="content-card">
        <div className="content-card-header">
          <h3>หอพักของฉัน</h3>
          <Link to="/owner/dormitories" style={{ color: "#7da27c", textDecoration: "none", fontSize: "14px", fontWeight: 600 }}>
            จัดการหอพักทั้งหมด <i className="fa-solid fa-arrow-right"></i>
          </Link>
        </div>
        <div className="content-card-body" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>ชื่อหอพัก</th>
                  <th>อำเภอ</th>
                  <th>ช่วงราคา</th>
                  <th>สถานะตรวจสอบ</th>
                  <th>ยอดเข้าชม</th>
                  <th>จัดการ</th>
                </tr>
              </thead>
              <tbody>
                {dorms.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ textAlign: "center", padding: "30px", color: "#888" }}>
                      คุณยังไม่ได้ลงประกาศหอพัก <Link to="/owner/dormitories/create" style={{ color: "#7da27c" }}>เพิ่มหอพักแรกของคุณ</Link>
                    </td>
                  </tr>
                ) : (
                  dorms.map((dorm) => (
                    <tr key={dorm.id}>
                      <td><strong>{dorm.name}</strong></td>
                      <td>{dorm.district || "เมืองเลย"}</td>
                      <td>{dorm.priceMin} - {dorm.priceMax} บาท</td>
                      <td>
                        <span className={`status-badge ${dorm.status}`}>
                          {dorm.status === "approved" ? "อนุมัติแล้ว" :
                           dorm.status === "rejected" ? "ไม่อนุมัติ" : "รอตรวจสอบ"}
                        </span>
                      </td>
                      <td>{dorm.viewCount || 0} ครั้ง</td>
                      <td>
                        <div className="btn-action-group">
                          <Link to={`/owner/dormitories/${dorm.id}/edit`}>
                            <button className="btn-icon" title="แก้ไข">
                              <i className="fa-solid fa-pen-to-square"></i>
                            </button>
                          </Link>
                          <Link to={`/dorms/${dorm.id}`}>
                            <button className="btn-icon" title="ดูหน้าเว็บ">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          </Link>
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
