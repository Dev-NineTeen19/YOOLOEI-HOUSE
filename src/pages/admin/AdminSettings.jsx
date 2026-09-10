import { useState, useEffect } from "react";
import { useSiteSettings } from "../../context/SiteSettingsContext";
import { api } from "../../services/apiClient";

export default function AdminSettings() {
  const { settings, updateSettings, loading: settingsLoading } = useSiteSettings();

  const [siteName, setSiteName] = useState("");
  const [siteNameEn, setSiteNameEn] = useState("");
  const [siteLogo, setSiteLogo] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [autoApproveDorms, setAutoApproveDorms] = useState("manual");

  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [saving, setSaving] = useState(false);
  const [alertStatus, setAlertStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    if (settings) {
      setSiteName(settings.siteName || "อยู่เลย เฮาส์");
      setSiteNameEn(settings.siteNameEn || "YOOLOEI HOUSE");
      setSiteLogo(settings.siteLogo || "/images/logo.png");
      setAdminEmail(settings.adminEmail || "admin@yooloei.com");
      setContactPhone(settings.contactPhone || "042-123-456");
      setAutoApproveDorms(settings.autoApproveDorms || "manual");
    }
  }, [settings]);

  // Handle Logo Upload File
  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setUploadingLogo(true);
    setAlertStatus({ type: "", text: "" });

    try {
      const data = await api.upload(file);
      if (data.url) {
        setSiteLogo(data.url);
        setAlertStatus({ type: "success", text: "อัปโหลดรูปโลโก้ใหม่สำเร็จแล้ว" });
      }
    } catch (err) {
      console.error("Logo upload error:", err);
      setAlertStatus({ type: "error", text: "อัปโหลดรูปโลโก้ไม่สำเร็จ: " + (err.message || "") });
    } finally {
      setUploadingLogo(false);
    }
  };

  // Handle Save All Settings
  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setAlertStatus({ type: "", text: "" });

    try {
      await updateSettings({
        siteName,
        siteNameEn,
        siteLogo,
        adminEmail,
        contactPhone,
        autoApproveDorms
      });
      setAlertStatus({ type: "success", text: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว!" });
    } catch (err) {
      console.error("Save settings error:", err);
      setAlertStatus({ type: "error", text: "เกิดข้อผิดพลาดในการบันทึกการตั้งค่า: " + (err.message || "") });
    } finally {
      setSaving(false);
    }
  };

  if (settingsLoading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#666" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ fontSize: "24px", marginBottom: "10px" }}></i>
        <p>กำลังโหลดข้อมูลการตั้งค่าระบบ...</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1000px" }}>
      {/* Header */}
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "26px", color: "#1e293b", fontWeight: 700, display: "flex", alignItems: "center", gap: "10px" }}>
          <i className="fa-solid fa-sliders" style={{ color: "#7da27c" }}></i> ตั้งค่าระบบ
        </h1>
        <p style={{ color: "#64748b", fontSize: "14px", marginTop: "4px" }}>
          จัดการชื่อเว็บไซต์ รูปโลโก้ ข้อมูลติดต่อ และนโยบายระบบ (แอดมินสามารถเปลี่ยนได้ตลอดเวลา)
        </p>
      </div>

      {/* Real-time Live Preview Card */}
      <div
        style={{
          background: "#ffffff",
          borderRadius: "14px",
          padding: "24px",
          marginBottom: "28px",
          boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
          border: "2px dashed #7da27c"
        }}
      >
        <div style={{ fontSize: "13px", fontWeight: "700", color: "#64748b", textTransform: "uppercase", marginBottom: "14px" }}>
          <i className="fa-solid fa-eye" style={{ marginRight: "6px" }}></i> ตัวอย่างการแสดงผลจริง (Live Preview)
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "16px 24px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
            border: "1px solid #e2e8f0",
            gap: "14px"
          }}
        >
          <img
            src={siteLogo || "/images/logo.png"}
            alt="Live Logo Preview"
            style={{ width: "50px", height: "50px", objectFit: "contain", borderRadius: "8px" }}
            onError={(e) => { e.target.src = "/images/logo.png"; }}
          />
          <div>
            <h3 style={{ fontSize: "20px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
              {siteName || "อยู่เลย เฮาส์"}
            </h3>
            <span style={{ fontSize: "12px", color: "#64748b", fontWeight: "600", letterSpacing: "0.5px" }}>
              {siteNameEn || "YOOLOEI HOUSE"}
            </span>
          </div>
        </div>
      </div>

      {/* Alert Status Notification */}
      {alertStatus.text && (
        <div
          style={{
            padding: "14px 20px",
            borderRadius: "10px",
            marginBottom: "24px",
            fontSize: "14px",
            fontWeight: "500",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            backgroundColor: alertStatus.type === "success" ? "#d1fae5" : "#fee2e2",
            color: alertStatus.type === "success" ? "#065f46" : "#991b1b",
            border: `1px solid ${alertStatus.type === "success" ? "#a7f3d0" : "#fca5a5"}`
          }}
        >
          <i className={alertStatus.type === "success" ? "fa-solid fa-circle-check" : "fa-solid fa-triangle-exclamation"}></i>
          {alertStatus.text}
        </div>
      )}

      {/* Main Settings Form */}
      <form onSubmit={handleSubmit}>
        {/* Section 1: ชื่อและโลโก้เว็บไซต์ */}
        <div style={{ background: "#ffffff", borderRadius: "14px", padding: "28px", marginBottom: "24px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-pen-nib" style={{ color: "#7da27c" }}></i> 1. ชื่อและโลโก้เว็บไซต์ (Branding & Logo)
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px", marginBottom: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                ชื่อเว็บไซต์ (ภาษาไทย)
              </label>
              <input
                type="text"
                value={siteName}
                onChange={(e) => setSiteName(e.target.value)}
                placeholder="เช่น อยู่เลย เฮาส์"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                ชื่อเว็บไซต์ (ภาษาอังกฤษ / สโลแกน)
              </label>
              <input
                type="text"
                value={siteNameEn}
                onChange={(e) => setSiteNameEn(e.target.value)}
                placeholder="เช่น YOOLOEI HOUSE"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>
          </div>

          {/* Logo Customization */}
          <div>
            <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "8px" }}>
              โลโก้เว็บไซต์ (Website Logo Image)
            </label>

            <div style={{ display: "flex", gap: "20px", alignItems: "center", flexWrap: "wrap" }}>
              <div
                style={{
                  width: "70px",
                  height: "70px",
                  borderRadius: "12px",
                  border: "2px solid #e2e8f0",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f8fafc",
                  overflow: "hidden"
                }}
              >
                <img
                  src={siteLogo || "/images/logo.png"}
                  alt="Logo"
                  style={{ width: "100%", height: "100%", objectFit: "contain", padding: "4px" }}
                  onError={(e) => { e.target.src = "/images/logo.png"; }}
                />
              </div>

              <div style={{ flex: 1, minWidth: "240px" }}>
                <div style={{ display: "flex", gap: "10px", marginBottom: "8px", alignItems: "center" }}>
                  <label
                    style={{
                      backgroundColor: "#7da27c",
                      color: "#fff",
                      padding: "8px 16px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      fontWeight: "600",
                      cursor: uploadingLogo ? "wait" : "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "6px"
                    }}
                  >
                    <i className="fa-solid fa-cloud-arrow-up"></i>
                    {uploadingLogo ? "กำลังอัปโหลด..." : "อัปโหลดรูปโลโก้ใหม่"}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={uploadingLogo}
                      style={{ display: "none" }}
                    />
                  </label>

                  <button
                    type="button"
                    onClick={() => setSiteLogo("/images/logo.png")}
                    style={{
                      background: "none",
                      border: "1px solid #cbd5e1",
                      color: "#64748b",
                      padding: "8px 14px",
                      borderRadius: "6px",
                      fontSize: "13px",
                      cursor: "pointer"
                    }}
                  >
                    <i className="fa-solid fa-rotate-left"></i> ใช้โลโก้เดิม
                  </button>
                </div>

                <input
                  type="text"
                  value={siteLogo}
                  onChange={(e) => setSiteLogo(e.target.value)}
                  placeholder="หรือวางลิงก์รูปภาพ URL (e.g. /images/logo.png)"
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "13px" }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: ข้อมูลติดต่อ & การอนุมัติหอพัก */}
        <div style={{ background: "#ffffff", borderRadius: "14px", padding: "28px", marginBottom: "28px", boxShadow: "0 4px 15px rgba(0,0,0,0.04)" }}>
          <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <i className="fa-solid fa-gears" style={{ color: "#7da27c" }}></i> 2. การติดต่อและเงื่อนไขระบบ
          </h3>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                อีเมลติดต่อส่วนกลาง (แอดมิน)
              </label>
              <input
                type="email"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                placeholder="admin@yooloei.com"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                เบอร์โทรศัพท์ติดต่อส่วนกลาง
              </label>
              <input
                type="tel"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="042-123-456"
                required
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px" }}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ display: "block", fontSize: "14px", fontWeight: "600", color: "#334155", marginBottom: "6px" }}>
                เงื่อนไขการอนุมัติหอพักใหม่ที่ถูกเพิ่มโดยเจ้าของหอ
              </label>
              <select
                value={autoApproveDorms}
                onChange={(e) => setAutoApproveDorms(e.target.value)}
                style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "14px", backgroundColor: "#fff" }}
              >
                <option value="manual">ตรวจสอบโดยแอดมินก่อนทุกครั้ง (แนะนำ - เพิ่มความปลอดภัยและความถูกต้อง)</option>
                <option value="auto">อนุมัติทันทีอัตโนมัติ (Auto Approve)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Submit Action Button */}
        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <button
            type="submit"
            disabled={saving}
            style={{
              backgroundColor: "#7da27c",
              color: "#ffffff",
              border: "none",
              padding: "14px 36px",
              borderRadius: "30px",
              fontSize: "16px",
              fontWeight: "700",
              cursor: saving ? "wait" : "pointer",
              boxShadow: "0 6px 20px rgba(125, 162, 124, 0.35)",
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              opacity: saving ? 0.7 : 1,
              transition: "all 0.2s"
            }}
          >
            {saving ? (
              <>
                <i className="fa-solid fa-spinner fa-spin"></i> กำลังบันทึกการตั้งค่า...
              </>
            ) : (
              <>
                <i className="fa-solid fa-floppy-disk"></i> บันทึกการตั้งค่าทั้งหมด
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
