import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { uploadUserAvatar } from "../../services/storageService";

export default function AdminProfile() {
  const { currentUser, userData, updateProfile } = useAuth();

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    displayName: "",
    phone: "",
    username: "",
    photoURL: ""
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    if (userData) {
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        displayName: userData.displayName || "",
        phone: userData.phone || "",
        username: userData.username || "",
        photoURL: userData.avatarUrl || userData.photoURL || ""
      });
      setAvatarPreview(userData.avatarUrl || userData.photoURL || "");
    }
  }, [userData]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      let finalAvatarUrl = formData.photoURL;

      if (avatarFile && currentUser) {
        try {
          const userId = currentUser.id || currentUser.uid;
          finalAvatarUrl = await uploadUserAvatar(userId, avatarFile);
        } catch (uploadErr) {
          console.warn("Storage upload failed, fallback:", uploadErr);
        }
      }

      const updatedDisplayName = (formData.firstName + " " + formData.lastName).trim() || formData.displayName || formData.username || "ผู้ดูแลระบบ";

      await updateProfile({
        ...formData,
        fullName: updatedDisplayName,
        displayName: updatedDisplayName,
        avatarUrl: finalAvatarUrl,
        photoURL: finalAvatarUrl
      });

      setAvatarPreview(finalAvatarUrl);
      setMessage({ type: "success", text: "บันทึกข้อมูลส่วนตัวของผู้ดูแลระบบเรียบร้อยแล้ว!" });
    } catch (err) {
      console.error("Admin profile update error:", err);
      setMessage({ type: "error", text: "ไม่สามารถบันทึกข้อมูลได้: " + (err.message || "") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>
          ข้อมูลส่วนตัวผู้ดูแลระบบ
        </h1>
        <p style={{ color: "#777", fontSize: "14px" }}>
          จัดการข้อมูลและแสดงสถานะตัวตนผู้ดูแลระบบสูงสุดของแพลตฟอร์ม อยู่เลย เฮาส์
        </p>
      </div>

      {message.text && (
        <div style={{
          padding: "12px 18px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          background: message.type === "success" ? "#eef8ee" : "#ffebee",
          color: message.type === "success" ? "#2e7d32" : "#c62828",
          border: "1px solid " + (message.type === "success" ? "#c8e6c9" : "#ffcdd2")
        }}>
          <i className={"fa-solid " + (message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation")}></i>
          <span>{message.text}</span>
        </div>
      )}

      {/* Admin Identity Card */}
      <div style={{
        background: "linear-gradient(135deg, #1e3c25 0%, #2e5b38 100%)",
        color: "#fff",
        borderRadius: "12px",
        padding: "24px",
        marginBottom: "24px",
        boxShadow: "0 6px 18px rgba(30, 60, 37, 0.25)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <img
            src={avatarPreview || "/images/default-avatar.jpg"}
            alt="Admin Avatar"
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              objectFit: "cover",
              border: "3px solid #86efac",
              boxShadow: "0 2px 8px rgba(0,0,0,0.3)"
            }}
            onError={(e) => {
              e.target.src = "/images/default-avatar.jpg";
            }}
          />
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 700, margin: 0, color: "#fff" }}>
                {formData.displayName || currentUser?.fullName || "ผู้ดูแลระบบ"}
              </h2>
              <span style={{
                background: "#22c55e",
                color: "#fff",
                fontSize: "12px",
                fontWeight: 700,
                padding: "3px 10px",
                borderRadius: "20px",
                display: "inline-flex",
                alignItems: "center",
                gap: "5px"
              }}>
                <i className="fa-solid fa-shield-halved"></i>
                ผู้ดูแลระบบสูงสุด (Super Admin)
              </span>
            </div>
            <p style={{ margin: "6px 0 0", fontSize: "14px", color: "#bbf7d0", display: "flex", alignItems: "center", gap: "6px" }}>
              <i className="fa-solid fa-envelope"></i>
              {currentUser?.email || "admin@yooloei.com"}
            </p>
            <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#e2e8f0" }}>
              <i className="fa-solid fa-circle-check" style={{ color: "#4ade80", marginRight: "6px" }}></i>
              ยืนยันตัวตนเจ้าหน้าที่ผู้ดูแลระบบแล้ว
            </p>
          </div>
        </div>

        <div style={{
          background: "rgba(255, 255, 255, 0.12)",
          padding: "12px 18px",
          borderRadius: "8px",
          fontSize: "13px",
          lineHeight: "1.6"
        }}>
          <div><strong>ระดับสิทธิ์:</strong> จัดการระบบเต็มรูปแบบ (Full Access)</div>
          <div><strong>ระบบ:</strong> อยู่เลย เฮาส์ (YooLoei House)</div>
        </div>
      </div>

      <div className="content-card">
        <div className="content-card-body">
          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px" }}>
              <img
                src={avatarPreview || "/images/default-avatar.jpg"}
                alt="Avatar"
                style={{
                  width: "90px",
                  height: "90px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "3px solid #7da27c"
                }}
                onError={(e) => {
                  e.target.src = "/images/default-avatar.jpg";
                }}
              />
              <div>
                <label style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#fff",
                  color: "#7da27c",
                  border: "1.5px solid #8fb08e",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "14px",
                  fontWeight: 600
                }}>
                  <i className="fa-solid fa-camera"></i>
                  เปลี่ยนรูปโปรไฟล์
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    style={{ display: "none" }}
                  />
                </label>
                <p style={{ color: "#888", fontSize: "12px", marginTop: "6px" }}>
                  รองรับไฟล์ JPG, PNG หรือ WEBP
                </p>
              </div>
            </div>

            <div className="form-grid">
              <div className="form-field">
                <label>ชื่อจริง</label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="กรอกชื่อ"
                />
              </div>

              <div className="form-field">
                <label>นามสกุล</label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="กรอกนามสกุล"
                />
              </div>

              <div className="form-field">
                <label>ชื่อที่ใช้แสดง (Display Name)</label>
                <input
                  type="text"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="เช่น ผู้ดูแลระบบ สมเกียรติ"
                />
              </div>

              <div className="form-field">
                <label>อีเมล (ระบบ)</label>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  style={{ background: "#f5f5f5", color: "#888" }}
                />
              </div>

              <div className="form-field">
                <label>เบอร์โทรศัพท์ติดต่อ</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="กรอกเบอร์โทรศัพท์ เช่น 081-xxx-xxxx"
                />
              </div>

              <div className="form-field">
                <label>ชื่อผู้ใช้งาน (Username)</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="เช่น admin_yooloei"
                />
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary-action"
                style={{ padding: "12px 28px" }}
              >
                <i className="fa-solid fa-floppy-disk"></i>
                {saving ? "กำลังบันทึกข้อมูล..." : "บันทึกข้อมูลส่วนตัว"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
