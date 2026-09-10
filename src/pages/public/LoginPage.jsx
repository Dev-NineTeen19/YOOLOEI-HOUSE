import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { resendVerificationEmail } from "../../services/authService";
import "../../styles/login.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [emailNotConfirmed, setEmailNotConfirmed] = useState(false);
  const [resendStatus, setResendStatus] = useState("");
  const [loading, setLoading] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectAfterLogin = (role) => {
    const from = location.state?.from?.pathname;
    if (from) {
      navigate(from, { replace: true });
      return;
    }
    if (role === "admin") navigate("/admin/dashboard", { replace: true });
    else if (role === "owner") navigate("/owner/dashboard", { replace: true });
    else navigate("/user/dashboard", { replace: true });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setEmailNotConfirmed(false);
    setResendStatus("");
    setLoading(true);

    try {
      const { userData } = await login(email, password);
      redirectAfterLogin(userData?.role || "user");
    } catch (err) {
      console.error("Login error:", err);
      if (err.message?.includes("Email not confirmed")) {
        setEmailNotConfirmed(true);
        setError("บัญชีนี้ยังไม่ได้ยืนยันอีเมล (Email not confirmed)");
      } else if (
        err.code === "auth/invalid-credential" ||
        err.message?.includes("Invalid login credentials") ||
        err.code === "auth/user-not-found" ||
        err.code === "auth/wrong-password"
      ) {
        setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      } else if (err.code === "auth/too-many-requests") {
        setError("คุณพยายามเข้าสู่ระบบบ่อยเกินไป กรุณารอสักครู่");
      } else {
        setError("เข้าสู่ระบบไม่สำเร็จ: " + (err.message || "เกิดข้อผิดพลาด"));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendConfirmation = async () => {
    if (!email) {
      alert("กรุณากรอกอีเมลในช่องด้านล่างก่อน");
      return;
    }
    setResendStatus("กำลังส่ง...");
    try {
      await resendVerificationEmail(email);
      setResendStatus("ส่งลิงก์ยืนยันไปที่อีเมลของคุณเรียบร้อยแล้ว กรุณาเปิดอีเมลแล้วกดยืนยัน");
    } catch (err) {
      console.error("Resend confirmation error:", err);
      setResendStatus("ไม่สามารถส่งได้: " + (err.message || ""));
    }
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const { userData } = await loginWithGoogle("user");
      redirectAfterLogin(userData?.role || "user");
    } catch (err) {
      console.error("Google login error:", err);
      setError("ไม่สามารถเข้าสู่ระบบด้วย Google ได้");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      {/* Header */}
      <div className="login-header">
        <div className="leaf-icon">
          <i className="fa-solid fa-leaf"></i>
        </div>
        <h1>เข้าสู่ระบบ</h1>
        <p>ยินดีต้อนรับสู่ระบบค้นหาและจัดการหอพักเมืองเลย</p>
        <div className="header-line"></div>
      </div>

      {/* Login Container */}
      <div className="login-container">
        {/* =================================================
                    LOGIN CARD
        ================================================== */}
        <div className="login-card">
          <h2>เข้าสู่ระบบผู้ใช้งาน</h2>
          <p className="card-description">กรอกอีเมลและรหัสผ่านเพื่อเข้าใช้งาน</p>

          {error && (
            <div style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              lineHeight: "1.5",
              border: "1px solid #ffcdd2"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, marginBottom: emailNotConfirmed ? "6px" : 0 }}>
                <i className="fa-solid fa-triangle-exclamation"></i>
                <span>{error}</span>
              </div>

              {emailNotConfirmed && (
                <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px dashed #ef9a9a", fontSize: "13px" }}>
                  <p style={{ margin: "0 0 8px 0" }}>
                    <strong>วิธีแก้ไข:</strong>
                  </p>
                  <ol style={{ margin: "0 0 10px 18px", padding: 0 }}>
                    <li style={{ marginBottom: "4px" }}>
                      <strong>เข้าสู่ระบบทันที:</strong> ไปที่ <code>Supabase Dashboard</code> &gt; <code>Authentication</code> &gt; <code>Providers</code> &gt; <code>Email</code> &gt; <strong>ปิดสวิตช์ &quot;Confirm email&quot;</strong> แล้วกด Save
                    </li>
                    <li>
                      <strong>หรือกดยืนยันผ่านอีเมล:</strong> ตรวจสอบอีเมลที่คุณใช้สมัคร (รวมถึงโฟลเดอร์ Junk/Spam) หรือกดปุ่มส่งใหม่อีกครั้งด้านล่าง
                    </li>
                  </ol>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", marginTop: "8px" }}>
                    <button
                      type="button"
                      onClick={handleResendConfirmation}
                      style={{
                        padding: "5px 12px",
                        background: "#c62828",
                        color: "#fff",
                        border: "none",
                        borderRadius: "4px",
                        fontSize: "12px",
                        cursor: "pointer",
                        fontWeight: 600
                      }}
                    >
                      <i className="fa-solid fa-paper-plane" style={{ marginRight: "6px" }}></i>
                      ส่งอีเมลยืนยันใหม่อีกครั้ง
                    </button>
                    {resendStatus && (
                      <span style={{ color: "#2e7d32", fontSize: "12px", fontWeight: 500 }}>
                        {resendStatus}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Email */}
            <div className="form-group">
              <label>อีเมล หรือ ชื่อผู้ใช้</label>
              <div className="input-box">
                <i className="fa-regular fa-envelope"></i>
                <input
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>รหัสผ่าน</label>
              <div className="input-box">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="กรอกรหัสผ่าน"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label="Toggle password visibility"
                >
                  <i className={`fa-solid ${showPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* Options */}
            <div className="login-options">
              <label className="remember">
                <input type="checkbox" />
                <span>จำรหัสผ่านไว้ในเครื่องนี้</span>
              </label>
              <a href="#forgot" onClick={(e) => { e.preventDefault(); alert("กรุณาติดต่อเจ้าหน้าที่ดูแลระบบ หรือรีเซ็ตรหัสผ่านผ่านอีเมล"); }}>
                ลืมรหัสผ่าน?
              </a>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>หรือเข้าสู่ระบบด้วย</span>
          </div>

          {/* Social Login */}
          <div className="social-login">
            <button
              type="button"
              className="google-button"
              onClick={handleGoogleLogin}
              disabled={loading}
            >
              <i className="fa-brands fa-google"></i>
              Google
            </button>
            <button
              type="button"
              className="facebook-button"
              onClick={() => alert("ระบบเข้าสู่ระบบด้วย Facebook อยู่ระหว่างการเชื่อมต่อ")}
            >
              <i className="fa-brands fa-facebook"></i>
              Facebook
            </button>
          </div>

          {/* Register Link */}
          <div className="register">
            ยังไม่มีบัญชี? <Link to="/register">สมัครสมาชิก</Link>
          </div>
        </div>

        {/* =================================================
                    FEATURE CARD
        ================================================== */}
        <div className="feature-card">
          <div className="feature-overlay"></div>
          <div className="feature-content">
            <h2>ค้นหาและจองหอพักได้ง่ายขึ้น</h2>
            <p>สะดวก รวดเร็ว และติดต่อเจ้าของหอพักได้โดยตรง</p>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-heart"></i>
              </div>
              <div>
                <h3>บันทึกหอพักที่ถูกใจ</h3>
                <p>เก็บหอพักที่ชอบไว้เปรียบเทียบราคา</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-comment-dots"></i>
              </div>
              <div>
                <h3>คุยกับเจ้าของหอพัก</h3>
                <p>ทักแชทสอบถามห้องว่างได้ทันที</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-calendar-check"></i>
              </div>
              <div>
                <h3>จองห้องพักออนไลน์</h3>
                <p>ส่งคำขอจองห้องพักได้สะดวก</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-star"></i>
              </div>
              <div>
                <h3>รีวิวและให้คะแนน</h3>
                <p>แบ่งปันประสบการณ์การพักอาศัยจริง</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
