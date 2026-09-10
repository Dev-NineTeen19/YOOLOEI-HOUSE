export default function AdminReports() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>รายงานปัญหาและข้อร้องเรียน</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ตรวจสอบรายงานเกี่ยวกับหอพักหรือผู้ใช้งานที่ไม่ปฏิบัติตามกฎ</p>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ textAlign: "center", padding: "60px 20px" }}>
          <i className="fa-solid fa-shield-halved" style={{ fontSize: "48px", color: "#7da27c", marginBottom: "16px" }}></i>
          <h3 style={{ color: "#333" }}>ไม่มีรายงานปัญหาที่รอดำเนินการ</h3>
          <p style={{ color: "#777", marginTop: "8px" }}>ระบบจะแจ้งเตือนเมื่อมีผู้ใช้แจ้งรายงานหอพักหรือพฤติกรรมที่ไม่เหมาะสม</p>
        </div>
      </div>
    </div>
  );
}
