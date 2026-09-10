import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDormitoryById, updateDormitory } from "../../services/dormitoryService";
import { uploadDormitoryImage } from "../../services/storageService";
import { getLocations } from "../../services/locationService";
import { getRoomTypes } from "../../services/roomTypeService";
import SearchableSelect from "../../components/common/SearchableSelect";

export default function EditDormitory() {
  const { id } = useParams();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    district: "เมืองเลย",
    address: "",
    description: "",
    priceMin: "",
    priceMax: "",
    phone: "",
    lineId: ""
  });

  const [locationOptions, setLocationOptions] = useState([
    "กำเนิดเพชร", "เชียงคาน", "ราชภัฏเลย", "โรงพยาบาลเลย", "โรงเรียนเลยพิท", "เมืองเลย", "นาอาน", "กุดป่อง"
  ]);

  const [roomTypeOptions, setRoomTypeOptions] = useState([
    "รายเดือน", "รายวัน", "ห้องพัดลม", "ห้องแอร์", "ห้องสตูดิโอ", "ห้องชุด"
  ]);

  useEffect(() => {
    async function loadAuxData() {
      try {
        const locs = await getLocations();
        if (locs && locs.length > 0) setLocationOptions(locs.map((l) => l.name));
      } catch (e) {
        console.error(e);
      }
      try {
        const rtypes = await getRoomTypes();
        if (rtypes && rtypes.length > 0) {
          setRoomTypeOptions(rtypes.map((rt) => rt.name));
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadAuxData();
  }, []);

  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState([]);
  const [existingImages, setExistingImages] = useState([]);
  const [newImageFiles, setNewImageFiles] = useState([]);
  const [newImagePreviews, setNewImagePreviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const amenityOptions = [
    "แอร์", "WiFi", "ที่จอดรถ", "กล้องวงจรปิด", "ระบบคีย์การ์ด",
    "เครื่องทำน้ำอุ่น", "ตู้เย็น", "ทีวี", "เครื่องซักผ้าหยอดเหรียญ",
    "ระเบียง", "เฟอร์นิเจอร์ครบ", "ระบบรักษาความปลอดภัย 24 ชม."
  ];

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const dorm = await getDormitoryById(id);
        if (dorm) {
          const currentUserId = currentUser?.id || currentUser?.uid;
          // ตรวจสอบว่าเป็นเจ้าของหอพักนี้จริง
          if (dorm.ownerId && currentUserId && dorm.ownerId !== currentUserId) {
            alert("คุณไม่มีสิทธิ์แก้ไขข้อมูลหอพักนี้ครับ");
            navigate("/owner/dormitories");
            return;
          }
          setFormData({
            name: dorm.name || "",
            district: dorm.district || "เมืองเลย",
            address: dorm.address || "",
            description: dorm.description || "",
            priceMin: dorm.priceMin || "",
            priceMax: dorm.priceMax || "",
            phone: dorm.phone || "",
            lineId: dorm.lineId || ""
          });
          setSelectedAmenities(dorm.amenities || []);
          setSelectedRoomTypes(dorm.roomTypes || []);
          setExistingImages(dorm.images || []);
        }
      } catch (err) {
        console.error("Error loading dorm for edit:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, currentUser, navigate]);

  const handleAmenityToggle = (item) => {
    setSelectedAmenities((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item]
    );
  };

  const handleRoomTypeToggle = (type) => {
    setSelectedRoomTypes((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  };

  const handleRemoveExistingImage = (idxToRemove) => {
    setExistingImages((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleNewFilesSelect = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setNewImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setNewImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveNewFile = (idxToRemove) => {
    setNewImageFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setNewImagePreviews((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");

    try {
      // 1. อัปโหลดรูปภาพใหม่ (ถ้ามี)
      const uploadedUrls = [];
      for (const file of newImageFiles) {
        try {
          const url = await uploadDormitoryImage(id, file);
          uploadedUrls.push(url);
        } catch (uploadErr) {
          console.warn("Image upload failed:", uploadErr);
        }
      }

      // 2. รวมรูปภาพเดิมและรูปภาพใหม่เข้าด้วยกัน
      let finalImages = [...existingImages, ...uploadedUrls];
      if (finalImages.length === 0) {
        finalImages = ["/images/dorm-1.jpg"];
      }

      // 3. ส่งข้อมูลอัปเดตไปยัง Backend
      await updateDormitory(id, {
        name: formData.name,
        district: formData.district,
        address: formData.address,
        description: formData.description,
        priceMin: Number(formData.priceMin) || 0,
        priceMax: Number(formData.priceMax) || Number(formData.priceMin) || 0,
        phone: formData.phone,
        lineId: formData.lineId,
        amenities: selectedAmenities,
        roomTypes: selectedRoomTypes,
        images: finalImages
      });

      alert("บันทึกข้อมูลหอพักเรียบร้อยแล้วครับ!");
      navigate("/owner/dormitories");
    } catch (err) {
      console.error("Error updating dorm:", err);
      setError("ไม่สามารถบันทึกข้อมูลได้: " + (err.message || ""));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
        <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดข้อมูล...
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>แก้ไขข้อมูลหอพัก</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>อัปเดตข้อมูล ราคา สิ่งอำนวยความสะดวก และรูปถ่าย</p>
      </div>

      {error && (
        <div style={{ background: "#ffebee", color: "#c62828", padding: "12px", borderRadius: "6px", marginBottom: "16px" }}>
          {error}
        </div>
      )}

      <div className="content-card">
        <div className="content-card-body">
          <form onSubmit={handleSubmit}>
            <div className="form-grid">
              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>ชื่อหอพัก <span>*</span></label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>พื้นที่ / โซน / ตำบล <span>*</span></label>
                <SearchableSelect
                  value={formData.district}
                  onChange={(val) => setFormData({ ...formData, district: val })}
                  options={locationOptions}
                  placeholder="เลือกหรือพิมพ์ชื่อพื้นที่/โซน (เช่น กำเนิดเพชร, เชียงคาน, ราชภัฏเลย...)"
                  icon="fa-location-dot"
                />
              </div>

              <div className="form-field">
                <label>เบอร์โทรศัพท์ติดต่อ <span>*</span></label>
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Line ID</label>
                <input
                  type="text"
                  value={formData.lineId}
                  onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>ราคาเริ่มต้น (บาท/เดือน) <span>*</span></label>
                <input
                  type="number"
                  required
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>ราคาสูงสุด (บาท/เดือน) (ถ้ามี)</label>
                <input
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                />
              </div>

              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>ที่อยู่หอพัก <span>*</span></label>
                <textarea
                  rows={2}
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                ></textarea>
              </div>

              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>รายละเอียดและจุดเด่น</label>
                <textarea
                  rows={4}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </div>

            {/* Room Types */}
            <div style={{ margin: "24px 0" }}>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
                ประเภทห้อง
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                {roomTypeOptions.map((type) => (
                  <label key={type} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 14px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: selectedRoomTypes.includes(type) ? "#7da27c" : "#ccc",
                    background: selectedRoomTypes.includes(type) ? "#eef6ee" : "#fff",
                    color: selectedRoomTypes.includes(type) ? "#2e7d32" : "#555",
                    cursor: "pointer"
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedRoomTypes.includes(type)}
                      onChange={() => handleRoomTypeToggle(type)}
                    />
                    {type}
                  </label>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div style={{ margin: "24px 0" }}>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, marginBottom: "12px" }}>
                สิ่งอำนวยความสะดวก
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                {amenityOptions.map((item) => (
                  <label key={item} style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={selectedAmenities.includes(item)}
                      onChange={() => handleAmenityToggle(item)}
                    />
                    {item}
                  </label>
                ))}
              </div>
            </div>

            {/* Image Gallery Management */}
            <div style={{ margin: "28px 0", borderTop: "1px solid #e5e9e3", paddingTop: "24px" }}>
              <label style={{ display: "block", fontSize: "16px", fontWeight: 700, marginBottom: "8px", color: "#333" }}>
                <i className="fa-solid fa-images" style={{ color: "#7da27c", marginRight: "8px" }}></i>
                รูปถ่ายหอพัก
              </label>
              <p style={{ color: "#777", fontSize: "13px", marginBottom: "16px" }}>
                สามารถลบรูปเดิม หรือเพิ่มรูปใหม่ได้ครับ (รูปแรกสุดจะเป็นรูปปก)
              </p>

              {/* Current Images */}
              {existingImages.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#555", marginBottom: "10px" }}>
                    รูปภาพปัจจุบัน ({existingImages.length} รูป)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                    {existingImages.map((imgUrl, idx) => (
                      <div key={idx} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "1px solid #ddd", height: "100px", background: "#f5f5f5" }}>
                        <img
                          src={imgUrl}
                          alt={`dorm-img-${idx}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                          onError={(e) => { e.target.src = "/images/banner.jpg"; }}
                        />
                        {idx === 0 && (
                          <span style={{
                            position: "absolute",
                            bottom: "4px",
                            left: "4px",
                            background: "rgba(125, 162, 124, 0.9)",
                            color: "#fff",
                            fontSize: "10px",
                            padding: "2px 6px",
                            borderRadius: "4px",
                            fontWeight: 600
                          }}>
                            รูปปก
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveExistingImage(idx)}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            background: "rgba(220, 38, 38, 0.85)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                          title="ลบรูปนี้"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* New Selected Images Preview */}
              {newImagePreviews.length > 0 && (
                <div style={{ marginBottom: "20px" }}>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#2e7d32", marginBottom: "10px" }}>
                    รูปใหม่ที่เตรียมอัปโหลด ({newImagePreviews.length} รูป)
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "12px" }}>
                    {newImagePreviews.map((previewUrl, idx) => (
                      <div key={idx} style={{ position: "relative", borderRadius: "8px", overflow: "hidden", border: "2px dashed #7da27c", height: "100px" }}>
                        <img
                          src={previewUrl}
                          alt={`new-preview-${idx}`}
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveNewFile(idx)}
                          style={{
                            position: "absolute",
                            top: "4px",
                            right: "4px",
                            background: "rgba(220, 38, 38, 0.85)",
                            color: "#fff",
                            border: "none",
                            borderRadius: "50%",
                            width: "24px",
                            height: "24px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            cursor: "pointer",
                            fontSize: "12px"
                          }}
                          title="ยกเลิกรูปนี้"
                        >
                          <i className="fa-solid fa-xmark"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* File Input */}
              <div style={{
                border: "2px dashed #bbf7d0",
                borderRadius: "8px",
                padding: "20px",
                textAlign: "center",
                background: "#f0fdf4",
                cursor: "pointer"
              }}>
                <label style={{ cursor: "pointer", display: "block" }}>
                  <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "32px", color: "#7da27c", marginBottom: "8px" }}></i>
                  <div style={{ fontWeight: 600, color: "#333", fontSize: "14px" }}>
                    กดเพื่อเลือกรูปภาพเพิ่ม
                  </div>
                  <div style={{ color: "#777", fontSize: "12px", marginTop: "4px" }}>
                    รองรับไฟล์ JPG, PNG, WEBP (เลือกได้หลายรูป)
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleNewFilesSelect}
                    style={{ display: "none" }}
                  />
                </label>
              </div>
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button
                type="submit"
                disabled={saving}
                className="btn-primary-action"
                style={{ padding: "11px 26px", fontSize: "15px" }}
              >
                <i className={`fa-solid ${saving ? "fa-spinner fa-spin" : "fa-floppy-disk"}`}></i>
                {saving ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/owner/dormitories")}
                className="btn-secondary-action"
                style={{ padding: "11px 20px" }}
              >
                ยกเลิก
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
