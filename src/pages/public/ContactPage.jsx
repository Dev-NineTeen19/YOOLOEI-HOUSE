import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../services/apiClient";

export default function ContactPage() {
  const { currentUser, userData } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (userData || currentUser) {
      setName(userData?.fullName || `${userData?.first_name || ""} ${userData?.last_name || ""}`.trim() || userData?.username || "");
      setEmail(userData?.email || currentUser?.email || "");
      setPhone(userData?.phone || "");
    }
  }, [userData, currentUser]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    setStatus({ type: "", text: "" });

    try {
      const data = await api.post("/contact", { name, email, phone, message });
      setStatus({
        type: "success",
        text: data.message || "ส่งข้อความถึงผู้ดูแลระบบเรียบร้อยแล้ว"
      });
      setMessage("");
    } catch (err) {
      console.error("Submit contact error:", err);
      setStatus({
        type: "error",
        text: err.data?.error || err.message || "เกิดข้อผิดพลาดในการส่งข้อความ กรุณาลองใหม่อีกครั้ง"
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "960px", margin: "50px auto", padding: "0 30px" }}>
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ fontSize: "32px", color: "#333", fontWeight: 700 }}>ติดต่อเรา</h1>
        <p style={{ color: "#777", fontSize: "16px", marginTop: "8px" }}>
          มีข้อสงสัยหรือต้องการสอบถามข้อมูลเพิ่มเติม สามารถติดต่อทีมงานผู้ดูแลระบบได้ตลอดเวลา
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px" }}>
        <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "var(--primary-color, #7da27c)", fontSize: "20px", marginBottom: "16px" }}>ข้อมูลการติดต่อ</h3>
          <p style={{ margin: "12px 0", display: "flex", alignItems: "center", gap: "10px", color: "#555" }}>
            <i className="fa-solid fa-phone" style={{ color: "var(--primary-color, #7da27c)" }}></i> 042-123-456
          </p>
          <p style={{ margin: "12px 0", display: "flex", alignItems: "center", gap: "10px", color: "#555" }}>
            <i className="fa-solid fa-envelope" style={{ color: "var(--primary-color, #7da27c)" }}></i> yooloeihouse@gmail.com
          </p>
          <p style={{ margin: "12px 0", display: "flex", alignItems: "center", gap: "10px", color: "#555" }}>
            <i className="fa-solid fa-location-dot" style={{ color: "var(--primary-color, #7da27c)" }}></i> 234 ม.11 ต.เมือง อ.เมือง จ.เลย 42000
          </p>
        </div>

        <div style={{ background: "#fff", padding: "30px", borderRadius: "12px", boxShadow: "0 4px 15px rgba(0,0,0,0.06)" }}>
          <h3 style={{ color: "#333", fontSize: "20px", marginBottom: "16px" }}>ส่งข้อความถึงผู้ดูแลระบบ</h3>

          {status.text && (
            <div
              style={{
                padding: "12px 16px",
                borderRadius: "8px",
                marginBottom: "16px",
                fontSize: "14px",
                backgroundColor: status.type === "success" ? "#d1fae5" : "#fee2e2",
                color: status.type === "success" ? "#065f46" : "#991b1b",
                border: `1px solid ${status.type === "success" ? "#a7f3d0" : "#fca5a5"}`
              }}
            >
              {status.text}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                ชื่อ-นามสกุล / ชื่อผู้ติดต่อ
              </label>
              <input
                type="text"
                placeholder="ชื่อของคุณ"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                อีเมลติดต่อ
              </label>
              <input
                type="email"
                placeholder="อีเมล"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "12px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                เบอร์โทรศัพท์ (ถ้ามี)
              </label>
              <input
                type="tel"
                placeholder="08X-XXX-XXXX"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc" }}
              />
            </div>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", marginBottom: "4px", color: "#374151" }}>
                ข้อความที่ต้องการติดต่อ
              </label>
              <textarea
                rows={4}
                placeholder="พิมพ์ข้อความที่ต้องการแจ้งหรือสอบถามแอดมิน..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{
                  width: "100%",
                  padding: "10px",
                  borderRadius: "6px",
                  border: "1px solid #ccc",
                  fontFamily: "inherit",
                  resize: "none",
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap"
                }}
              ></textarea>
            </div>
            <button
              type="submit"
              disabled={loading}
              style={{
                width: "100%",
                backgroundColor: "var(--primary-color, #7da27c)",
                color: "#ffffff",
                border: "none",
                padding: "12px",
                borderRadius: "6px",
                fontSize: "16px",
                fontWeight: "700",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? "กำลังส่งข้อความ..." : "ส่งข้อความถึงแอดมิน"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
