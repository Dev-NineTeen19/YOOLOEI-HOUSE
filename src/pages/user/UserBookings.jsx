import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getBookingsByUser, cancelBooking } from "../../services/bookingService";

export default function UserBookings() {
  const { currentUser } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      const data = await getBookingsByUser(userId);
      setBookings(data);
    } catch (err) {
      console.error("Error loading bookings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, [currentUser]);

  const handleCancel = async (bookingId) => {
    if (window.confirm("ต้องการยกเลิกคำขอจองห้องพักนี้ใช่ไหมครับ?")) {
      try {
        await cancelBooking(bookingId);
        loadBookings();
      } catch (err) {
        console.error("Error cancelling booking:", err);
        alert("ไม่สามารถยกเลิกการจองได้");
      }
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>ห้องพักที่จองไว้</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ติดตามและดูสถานะการจองหอพักของคุณ</p>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดข้อมูล...
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-regular fa-calendar-xmark" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
              <h3 style={{ color: "#555" }}>ยังไม่มีรายการจองห้องพัก</h3>
              <p style={{ color: "#888", marginTop: "8px", marginBottom: "20px" }}>
                ยังไม่มีประวัติการจอง ลองเลือกดูหอพักที่ถูกใจแล้วกดจองห้องได้เลยครับ
              </p>
              <Link to="/dorms" style={{ textDecoration: "none" }}>
                <button className="btn-primary-action">
                  <i className="fa-solid fa-magnifying-glass"></i> ค้นหาหอพัก
                </button>
              </Link>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ชื่อหอพัก</th>
                    <th>ห้องที่จอง</th>
                    <th>วันที่ต้องการเข้าพัก</th>
                    <th>หมายเหตุ / ข้อความ</th>
                    <th>สถานะ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((booking) => (
                    <tr key={booking.id}>
                      <td>
                        <strong>{booking.dormitoryName || "หอพัก"}</strong>
                      </td>
                      <td>{booking.roomNumber || "ห้องมาตรฐาน"}</td>
                      <td>{booking.bookingDate || "-"}</td>
                      <td>
                        <span style={{ color: "#666", fontSize: "13px" }}>
                          {booking.note || "-"}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${booking.status}`}>
                          {booking.status === "approved" ? "ยืนยันแล้ว" :
                           booking.status === "rejected" ? "ห้องไม่ว่าง" :
                           booking.status === "cancelled" ? "ยกเลิกแล้ว" :
                           booking.status === "completed" ? "เข้าพักแล้ว" : "รอเจ้าของหอยืนยัน"}
                        </span>
                      </td>
                      <td>
                        <div className="btn-action-group">
                          <Link to={`/dorms/${booking.dormitoryId}`}>
                            <button className="btn-icon" title="ดูข้อมูลหอพัก">
                              <i className="fa-solid fa-eye"></i>
                            </button>
                          </Link>
                          {booking.status === "pending" && (
                            <button
                              className="btn-icon delete"
                              onClick={() => handleCancel(booking.id)}
                              title="ยกเลิกการจอง"
                            >
                              <i className="fa-solid fa-ban"></i>
                            </button>
                          )}
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
