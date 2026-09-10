import { useState, useEffect } from "react";
import { getAllBookingsAdmin, updateBookingStatus } from "../../services/bookingService";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadBookings = async () => {
    setLoading(true);
    try {
      const data = await getAllBookingsAdmin();
      setBookings(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBookings();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await updateBookingStatus(id, status);
      loadBookings();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>การจองห้องพักทั้งหมดในระบบ</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ตรวจสอบประวัติและสถานะการจองของผู้ใช้งานทุกหอพัก</p>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูลการจอง...
            </div>
          ) : bookings.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              ยังไม่มีข้อมูลการจองในระบบ
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ผู้จอง</th>
                    <th>เบอร์โทรศัพท์</th>
                    <th>หอพัก</th>
                    <th>ห้องพัก</th>
                    <th>วันที่ต้องการเข้าพัก</th>
                    <th>สถานะ</th>
                    <th>ปรับสถานะ</th>
                  </tr>
                </thead>
                <tbody>
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td><strong>{b.userName || b.userEmail}</strong></td>
                      <td>{b.userPhone || "-"}</td>
                      <td>{b.dormitoryName}</td>
                      <td>{b.roomNumber}</td>
                      <td>{b.bookingDate}</td>
                      <td>
                        <span className={`status-badge ${b.status}`}>
                          {b.status === "approved" ? "อนุมัติแล้ว" :
                           b.status === "rejected" ? "ปฏิเสธ" :
                           b.status === "cancelled" ? "ยกเลิกแล้ว" :
                           b.status === "completed" ? "เสร็จสิ้น" : "รออนุมัติ"}
                        </span>
                      </td>
                      <td>
                        <select
                          value={b.status}
                          onChange={(e) => handleStatusChange(b.id, e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px" }}
                        >
                          <option value="pending">รออนุมัติ</option>
                          <option value="approved">อนุมัติแล้ว</option>
                          <option value="rejected">ปฏิเสธ</option>
                          <option value="cancelled">ยกเลิกแล้ว</option>
                          <option value="completed">เสร็จสิ้น</option>
                        </select>
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
