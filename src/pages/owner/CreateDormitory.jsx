import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { createDormitory } from "../../services/dormitoryService";
import { uploadDormitoryImage } from "../../services/storageService";
import { getLocations } from "../../services/locationService";
import { getRoomTypes } from "../../services/roomTypeService";
import SearchableSelect from "../../components/common/SearchableSelect";

export default function CreateDormitory() {
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    district: "เมืองเลย",
    address: "",
    description: "",
    priceMin: "",
    priceMax: "",
    phone: userData?.phone || "",
    lineId: ""
  });

  const [locationOptions, setLocationOptions] = useState([
    "กำเนิดเพชร", "เชียงคาน", "ราชภัฏเลย", "โรงพยาบาลเลย", "โรงเรียนเลยพิท", "เมืองเลย", "นาอาน", "กุดป่อง"
  ]);

  const [roomTypeOptions, setRoomTypeOptions] = useState([
    "รายเดือน", "รายวัน", "ห้องพัดลม", "ห้องแอร์", "ห้องสตูดิโอ", "ห้องชุด"
  ]);

  useEffect(() => {
    async function loadData() {
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
    loadData();
  }, []);

  const [selectedAmenities, setSelectedAmenities] = useState(["แอร์", "WiFi"]);
  const [selectedRoomTypes, setSelectedRoomTypes] = useState(["ห้องแอร์"]);
  const [imageFiles, setImageFiles] = useState([]);
  const [imagePreviews, setImagePreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const amenityOptions = [
    "แอร์", "WiFi", "ที่จอดรถ", "กล้องวงจรปิด", "ระบบคีย์การ์ด",
    "เครื่องทำน้ำอุ่น", "ตู้เย็น", "ทีวี", "เครื่องซักผ้าหยอดเหรียญ",
    "ระเบียง", "เฟอร์นิเจอร์ครบ", "ระบบรักษาความปลอดภัย 24 ชม."
  ];

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

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    setImageFiles((prev) => [...prev, ...files]);
    const previews = files.map((file) => URL.createObjectURL(file));
    setImagePreviews((prev) => [...prev, ...previews]);
  };

  const handleRemoveImage = (idxToRemove) => {
    setImageFiles((prev) => prev.filter((_, idx) => idx !== idxToRemove));
    setImagePreviews((prev) => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) return;

    setError("");
    setLoading(true);

    try {
      // 1. สร้าง Dormitory ID ชั่วคราวหรือบันทึกข้อมูลก่อน
      const imageUrls = [];
      const tempDormId = `dorm_${Date.now()}`;

      // 2. อัปโหลดรูปภาพ (ถ้ามี)
      for (const file of imageFiles) {
        try {
          const url = await uploadDormitoryImage(tempDormId, file);
          imageUrls.push(url);
        } catch (uploadErr) {
          console.warn("Storage upload failed, using fallback:", uploadErr);
        }
      }

      if (imageUrls.length === 0) {
        imageUrls.push("/images/dorm-1.jpg");
      }

      // 3. บันทึกลง Firestore
      await createDormitory({
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
        images: imageUrls,
        ownerName: userData?.displayName || currentUser.email
      }, currentUser.id || currentUser.uid);

      alert("ลงประกาศหอพักเรียบร้อยแล้วครับ! แอดมินจะตรวจสอบและอนุมัติให้โดยเร็วครับ");
      navigate("/owner/dormitories");
    } catch (err) {
      console.error("Create dormitory error:", err);
      setError("ไม่สามารถลงประกาศได้ กรุณาลองใหม่อีกครั้ง: " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px" }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>ลงประกาศหอพัก</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>
          กรอกข้อมูลหอพักให้ครบถ้วน เพื่อให้ผู้เช่าค้นหาและติดต่อสอบถามได้ง่ายขึ้น
        </p>
      </div>

      {error && (
        <div style={{
          background: "#ffebee",
          color: "#c62828",
          padding: "12px 18px",
          borderRadius: "8px",
          marginBottom: "20px"
        }}>
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
                  placeholder="เช่น หอพัก อานนท์, เคหะแมนชั่น"
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
                  placeholder="เช่น 042-123-456"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>Line ID</label>
                <input
                  type="text"
                  placeholder="เช่น @yooloeihouse"
                  value={formData.lineId}
                  onChange={(e) => setFormData({ ...formData, lineId: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>ราคาเริ่มต้น (บาท/เดือน) <span>*</span></label>
                <input
                  type="number"
                  required
                  placeholder="เช่น 2500"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                />
              </div>

              <div className="form-field">
                <label>ราคาสูงสุด (บาท/เดือน) (ถ้ามี)</label>
                <input
                  type="number"
                  placeholder="เช่น 4500"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                />
              </div>

              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>ที่อยู่หอพัก <span>*</span></label>
                <textarea
                  rows={2}
                  required
                  placeholder="เช่น 234 ม.11 ต.เมือง อ.เมือง จ.เลย ใกล้มหาวิทยาลัยราชภัฏเลย"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                ></textarea>
              </div>

              <div className="form-field" style={{ gridColumn: "1 / -1" }}>
                <label>รายละเอียดและจุดเด่น</label>
                <textarea
                  rows={4}
                  placeholder="บอกเล่าจุดเด่น เช่น ใกล้มหาวิทยาลัย ปลอดภัย มีของกินใกล้ๆ บรรยากาศเงียบสงบ"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                ></textarea>
              </div>
            </div>

            {/* Room Types Checkboxes */}
            <div style={{ margin: "24px 0" }}>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "#333" }}>
                ประเภทห้องที่มีให้บริการ
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
                {roomTypeOptions.map((type) => (
                  <label key={type} style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    border: "1px solid",
                    borderColor: selectedRoomTypes.includes(type) ? "#7da27c" : "#ccc",
                    background: selectedRoomTypes.includes(type) ? "#eef6ee" : "#fff",
                    color: selectedRoomTypes.includes(type) ? "#2e7d32" : "#555",
                    cursor: "pointer",
                    fontSize: "14px"
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

            {/* Amenities Checkboxes */}
            <div style={{ margin: "24px 0" }}>
              <label style={{ display: "block", fontSize: "15px", fontWeight: 700, marginBottom: "12px", color: "#333" }}>
                สิ่งอำนวยความสะดวก
              </label>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                {amenityOptions.map((item) => (
                  <label key={item} style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    fontSize: "14px",
                    color: "#444",
                    cursor: "pointer"
                  }}>
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

            {/* Image Upload & Live Preview Gallery */}
            <div style={{ margin: "28px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <label style={{ fontSize: "15px", fontWeight: 700, color: "#333" }}>
                  รูปภาพหอพัก <span style={{ fontSize: "13px", fontWeight: 400, color: "#777" }}>(สามารถเลือกได้หลายรูป)</span>
                </label>
                {imageFiles.length > 0 && (
                  <span style={{ fontSize: "13px", fontWeight: 600, color: "#2e7d32", background: "#eef6ee", padding: "4px 10px", borderRadius: "12px" }}>
                    เลือกแล้ว {imageFiles.length} รูป
                  </span>
                )}
              </div>

              {/* Upload Input Area */}
              <label style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "24px 16px",
                border: "2px dashed #8fb08e",
                borderRadius: "10px",
                background: "#f8faf7",
                cursor: "pointer",
                transition: "all 0.2s"
              }}>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: "none" }}
                />
                <i className="fa-solid fa-cloud-arrow-up" style={{ fontSize: "32px", color: "#7da27c", marginBottom: "8px" }}></i>
                <span style={{ fontWeight: 600, color: "#333", fontSize: "15px" }}>
                  คลิกเพื่อเลือกรูปภาพ หรือเพิ่มรูปภาพหอพัก
                </span>
                <span style={{ fontSize: "12px", color: "#777", marginTop: "4px" }}>
                  รองรับไฟล์ JPG, PNG, WEBP (เลือกได้พร้อมกันหลายไฟล์)
                </span>
              </label>

              {/* Live Preview Grid */}
              {imagePreviews.length > 0 && (
                <div style={{ marginTop: "16px" }}>
                  <p style={{ fontSize: "13px", color: "#666", marginBottom: "10px" }}>
                    <i className="fa-solid fa-circle-info" style={{ color: "#7da27c", marginRight: "6px" }}></i>
                    รูปแรกสุด (มีป้ายสีเขียว) จะเป็น <strong>รูปภาพหน้าปก</strong> ที่แสดงบนการ์ดค้นหาหอพัก
                  </p>
                  <div style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))",
                    gap: "12px"
                  }}>
                    {imagePreviews.map((previewUrl, idx) => (
                      <div
                        key={idx}
                        style={{
                          position: "relative",
                          height: "115px",
                          borderRadius: "8px",
                          overflow: "hidden",
                          border: idx === 0 ? "2.5px solid #7da27c" : "1px solid #e0e0e0",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.08)",
                          background: "#000"
                        }}
                      >
                        <img
                          src={previewUrl}
                          alt={`preview-${idx}`}
                          style={{
                            width: "100%",
                            height: "100%",
                            objectFit: "cover"
                          }}
                        />

                        {/* Cover Badge on Index 0 */}
                        {idx === 0 && (
                          <div style={{
                            position: "absolute",
                            bottom: "6px",
                            left: "6px",
                            background: "rgba(46, 125, 50, 0.92)",
                            color: "#fff",
                            fontSize: "10px",
                            fontWeight: 700,
                            padding: "2px 7px",
                            borderRadius: "4px",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                          }}>
                            <i className="fa-solid fa-star" style={{ fontSize: "9px" }}></i>
                            รูปหน้าปก
                          </div>
                        )}

                        {/* Remove Image Button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveImage(idx)}
                          style={{
                            position: "absolute",
                            top: "6px",
                            right: "6px",
                            background: "rgba(211, 47, 47, 0.9)",
                            color: "#fff",
                            border: "none",
                            width: "24px",
                            height: "24px",
                            borderRadius: "50%",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "12px",
                            boxShadow: "0 2px 4px rgba(0,0,0,0.3)"
                          }}
                          title="ลบรูปนี้"
                        >
                          &times;
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: "12px", marginTop: "32px" }}>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary-action"
                style={{ padding: "12px 28px" }}
              >
                <i className="fa-solid fa-cloud-arrow-up"></i>
                {loading ? "กำลังบันทึกข้อมูล..." : "ลงประกาศหอพัก"}
              </button>
              <button
                type="button"
                onClick={() => navigate("/owner/dormitories")}
                className="btn-secondary-action"
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
