import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/register.css";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "user",
    termsAccepted: false
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccessMessage("");

    if (formData.password.length < 6) {
      setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("รหัสผ่านและยืนยันรหัสผ่านไม่ตรงกัน");
      return;
    }

    if (!formData.termsAccepted) {
      setError("กรุณายอมรับเงื่อนไขการใช้งานก่อนสมัครสมาชิก");
      return;
    }

    setLoading(true);

    try {
      const result = await register({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phone: formData.phone,
        username: formData.username,
        role: formData.role
      });

      // สมัครสมาชิกสำเร็จ นำทางเข้าสู่หน้า Dashboard ตาม Role ได้ทันที 100%
      if (formData.role === "owner") {
        navigate("/owner/dashboard");
      } else {
        navigate("/user/dashboard");
      }
    } catch (err) {
      console.error("Registration error:", err);
      if (err.code === "auth/email-already-in-use" || err.message?.includes("already registered")) {
        setError("อีเมลนี้ถูกใช้งานไปแล้ว กรุณาใช้อีเมลอื่นหรือเข้าสู่ระบบ");
      } else if (err.code === "auth/invalid-email") {
        setError("รูปแบบอีเมลไม่ถูกต้อง");
      } else if (err.code === "auth/weak-password" || err.message?.includes("Password should be")) {
        setError("รหัสผ่านต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      } else {
        setError("เกิดข้อผิดพลาดในการสมัครสมาชิก: " + (err.message || ""));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Page Header */}
      <div className="register-header">
        <div className="leaf-icon">
          <i className="fa-solid fa-leaf"></i>
        </div>
        <h1>สมัครสมาชิก</h1>
        <p>สร้างบัญชีใหม่เพื่อเริ่มต้นค้นหาหรือลงประกาศหอพัก</p>
        <div className="header-line"></div>
      </div>

      {/* Register Container */}
      <div className="register-container">
        {/* =================================================
                    LEFT FEATURE CARD
        ================================================== */}
        <div className="register-feature">
          <div className="feature-overlay"></div>
          <div className="feature-content">
            <div className="feature-logo">
              <img src="/images/logo.png" alt="Logo" onError={(e) => { e.target.style.display = "none"; }} />
              <div>
                <h2>อยู่เลย เฮาส์</h2>
                <span>YOOLOEI HOUSE</span>
              </div>
            </div>

            <h3>หาหอพักถูกใจ ในเมืองเลย</h3>
            <p className="feature-description">
              รวมหอพักรอบเมืองเลย เปรียบเทียบราคา ดูสิ่งอำนวยความสะดวก จองง่ายครบจบในที่เดียว
            </p>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-heart"></i>
              </div>
              <div>
                <h4>บันทึกหอพักที่สนใจ</h4>
                <p>เก็บหอพักที่ชอบไว้ดูย้อนหลัง</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-comment-dots"></i>
              </div>
              <div>
                <h4>คุยกับเจ้าของหอพัก</h4>
                <p>ทักแชทสอบถามห้องว่างได้ทันที</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-calendar-check"></i>
              </div>
              <div>
                <h4>จองห้องพักออนไลน์</h4>
                <p>ส่งคำขอจองห้องพักได้สะดวก</p>
              </div>
            </div>

            <div className="feature-item">
              <div className="feature-icon">
                <i className="fa-regular fa-star"></i>
              </div>
              <div>
                <h4>รีวิวและให้คะแนน</h4>
                <p>แบ่งปันประสบการณ์การพักอาศัยจริง</p>
              </div>
            </div>
          </div>
        </div>

        {/* =================================================
                    REGISTER CARD
        ================================================== */}
        <div className="register-card">
          <h2>สมัครสมาชิก</h2>
          <p className="card-description">กรอกข้อมูลเพื่อสร้างบัญชีผู้ใช้งานใหม่</p>

          {error && (
            <div style={{
              background: "#ffebee",
              color: "#c62828",
              padding: "10px 14px",
              borderRadius: "6px",
              marginBottom: "16px",
              fontSize: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
              <span>{error}</span>
            </div>
          )}

          {successMessage && (
            <div style={{
              background: "#e8f5e9",
              color: "#2e7d32",
              border: "1px solid #a5d6a7",
              padding: "12px 16px",
              borderRadius: "8px",
              marginBottom: "16px",
              fontSize: "14px",
              lineHeight: "1.6"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontWeight: 600, marginBottom: "4px" }}>
                <i className="fa-solid fa-circle-check"></i>
                <span>ลงทะเบียนสำเร็จ!</span>
              </div>
              <p style={{ margin: 0, color: "#1b5e20" }}>{successMessage}</p>
              <div style={{ marginTop: "10px" }}>
                <Link to="/login" style={{
                  display: "inline-block",
                  padding: "6px 14px",
                  background: "#4caf50",
                  color: "#fff",
                  borderRadius: "4px",
                  textDecoration: "none",
                  fontWeight: 600,
                  fontSize: "13px"
                }}>
                  ไปที่หน้าเข้าสู่ระบบ &rarr;
                </Link>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Row 1: First Name & Last Name */}
            <div className="form-row">
              <div className="form-group">
                <label>ชื่อ <span>*</span></label>
                <div className="input-box">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="กรอกชื่อ"
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>นามสกุล <span>*</span></label>
                <div className="input-box">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="กรอกนามสกุล"
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="form-group">
              <label>อีเมล <span>*</span></label>
              <div className="input-box">
                <i className="fa-regular fa-envelope"></i>
                <input
                  type="email"
                  name="email"
                  placeholder="กรอกอีเมล"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            {/* Row 2: Phone & Username */}
            <div className="form-row">
              <div className="form-group">
                <label>เบอร์โทรศัพท์ <span>*</span></label>
                <div className="input-box">
                  <i className="fa-solid fa-phone"></i>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="กรอกเบอร์โทรศัพท์"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>ชื่อผู้ใช้งาน <span>*</span></label>
                <div className="input-box">
                  <i className="fa-solid fa-user"></i>
                  <input
                    type="text"
                    name="username"
                    placeholder="ตั้งชื่อผู้ใช้งาน"
                    value={formData.username}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div className="form-group">
              <label>รหัสผ่าน <span>*</span></label>
              <div className="input-box">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={showPassword ? "text" : "password"}
                  name="password"
                  placeholder="ตั้งรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                  value={formData.password}
                  onChange={handleChange}
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

            {/* Confirm Password */}
            <div className="form-group">
              <label>ยืนยันรหัสผ่าน <span>*</span></label>
              <div className="input-box">
                <i className="fa-solid fa-lock"></i>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirmPassword"
                  placeholder="ยืนยันรหัสผ่าน"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <button
                  type="button"
                  className="show-password"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label="Toggle confirm password visibility"
                >
                  <i className={`fa-solid ${showConfirmPassword ? "fa-eye-slash" : "fa-eye"}`}></i>
                </button>
              </div>
            </div>

            {/* User Type (Role) */}
            <div className="form-group">
              <label>สมัครเพื่อใช้งานในฐานะ</label>
              <div className="role-selection">
                {/* User */}
                <label className="role-card">
                  <input
                    type="radio"
                    name="role"
                    value="user"
                    checked={formData.role === "user"}
                    onChange={handleChange}
                  />
                  <div className="role-content">
                    <i className="fa-solid fa-user"></i>
                    <strong>ผู้เช่าหอพัก</strong>
                    <small>ค้นหาและจองห้องพัก</small>
                  </div>
                </label>

                {/* Owner */}
                <label className="role-card">
                  <input
                    type="radio"
                    name="role"
                    value="owner"
                    checked={formData.role === "owner"}
                    onChange={handleChange}
                  />
                  <div className="role-content">
                    <i className="fa-solid fa-building"></i>
                    <strong>เจ้าของหอพัก</strong>
                    <small>ลงประกาศหอพัก</small>
                  </div>
                </label>
              </div>
            </div>

            {/* Terms */}
            <label className="terms">
              <input
                type="checkbox"
                name="termsAccepted"
                checked={formData.termsAccepted}
                onChange={handleChange}
                required
              />
              <span>ฉันยอมรับข้อตกลงและเงื่อนไขการใช้งาน</span>
            </label>

            {/* Submit Button */}
            <button
              type="submit"
              className="register-button"
              disabled={loading}
              style={{ opacity: loading ? 0.7 : 1 }}
            >
              <i className="fa-solid fa-right-to-bracket"></i>
              {loading ? "กำลังสมัครสมาชิก..." : "สมัครสมาชิก"}
            </button>
          </form>

          {/* Divider */}
          <div className="divider">
            <span>หรือสมัครด้วย</span>
          </div>

          {/* Social */}
          <div className="social-register">
            <button
              type="button"
              className="google-button"
              onClick={() => alert("กรุณาใช้ฟอร์มสมัครสมาชิกด้านบนเพื่อระบุประเภทบทบาท (ผู้เช่า/เจ้าของหอพัก)")}
            >
              <i className="fa-brands fa-google"></i>
              Google
            </button>
            <button
              type="button"
              className="facebook-button"
              onClick={() => alert("ระบบสมัครสมาชิกด้วย Facebook อยู่ระหว่างการเชื่อมต่อ")}
            >
              <i className="fa-brands fa-facebook"></i>
              Facebook
            </button>
          </div>

          {/* Login Link */}
          <div className="login-link">
            มีบัญชีอยู่แล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
