import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { uploadUserAvatar } from "../../services/storageService";

export default function UserProfile() {
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
      let finalAvatarUrl = formData.photoURL || formData.avatarUrl;

      // ถ้ามีการเลือกรูป Avatar ใหม่ ให้อัปโหลดไปยัง Storage
      if (avatarFile && currentUser) {
        try {
          const userId = currentUser.id || currentUser.uid;
          finalAvatarUrl = await uploadUserAvatar(userId, avatarFile);
        } catch (uploadErr) {
          console.warn("Storage upload failed, fallback to local URL:", uploadErr);
        }
      }

      const updatedDisplayName = `${formData.firstName} ${formData.lastName}`.trim() || formData.displayName || formData.username;

      await updateProfile({
        ...formData,
        fullName: updatedDisplayName,
        displayName: updatedDisplayName,
        avatarUrl: finalAvatarUrl,
        photoURL: finalAvatarUrl
      });

      setAvatarPreview(finalAvatarUrl);
      setMessage({ type: "success", text: "บันทึกข้อมูลเรียบร้อยแล้วครับ!" });
    } catch (err) {
      console.error("Profile update error:", err);
      setMessage({ type: "error", text: "ไม่สามารถบันทึกข้อมูลได้: " + (err.message || "") });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>ข้อมูลส่วนตัว</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ดูและแก้ไขข้อมูลส่วนตัวของคุณ</p>
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
          border: `1px solid ${message.type === "success" ? "#c8e6c9" : "#ffcdd2"}`
        }}>
          <i className={`fa-solid ${message.type === "success" ? "fa-circle-check" : "fa-triangle-exclamation"}`}></i>
          <span>{message.text}</span>
        </div>
      )}

      <div className="content-card">
        <div className="content-card-body">
          <form onSubmit={handleSubmit}>
            {/* Avatar Section */}
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
                <p style={{ color: "#888", fontSize: "12px", marginTop: "6px" }}>รองรับไฟล์ JPG, PNG หรือ GIF</p>
              </div>
            </div>

            {/* Profile Fields */}
            <div className="form-grid">
              <div className="form-field">
                <label>ชื่อ</label>
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
                <label>อีเมล</label>
                <input
                  type="email"
                  value={currentUser?.email || ""}
                  disabled
                  style={{ background: "#f5f5f5", color: "#888" }}
                />
              </div>

              <div className="form-field">
                <label>เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="กรอกเบอร์โทรศัพท์"
                />
              </div>

              <div className="form-field">
                <label>ชื่อผู้ใช้งาน</label>
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  placeholder="กรอกชื่อผู้ใช้งาน"
                />
              </div>

              <div className="form-field">
                <label>สถานะบัญชี</label>
                <input
                  type="text"
                  value={userData?.role === "owner" ? "เจ้าของหอพัก" : userData?.role === "admin" ? "ผู้ดูแลระบบ" : "ผู้เช่าทั่วไป"}
                  disabled
                  style={{ background: "#f5f5f5", color: "#888" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "24px" }}>
              <button
                type="submit"
                className="btn-primary-action"
                disabled={saving}
              >
                <i className="fa-solid fa-floppy-disk"></i>
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
