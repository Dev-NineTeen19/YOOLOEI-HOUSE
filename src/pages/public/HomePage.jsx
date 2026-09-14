import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchableSelect from "../../components/common/SearchableSelect";
import { getApprovedDormitories } from "../../services/dormitoryService";
import { getLocations } from "../../services/locationService";
import { getLatestReviews } from "../../services/reviewService";
import { getImageUrl } from "../../utils/imageUtils";

const FALLBACK_DORMS = [
  {
    id: "sample-1",
    name: "หอพัก อเธน่า",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    isNew: true
  },
  {
    id: "sample-2",
    name: "หอพัก ภูผาอินทร์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    isNew: true
  },
  {
    id: "sample-3",
    name: "บ้านพักสบาย เชียงคาน",
    district: "เชียงคาน",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    isNew: true
  },
  {
    id: "sample-4",
    name: "หอพัก อานนท์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    isNew: true
  },
  {
    id: "sample-5",
    name: "หอพัก สุขอนันต์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    isNew: true
  },
  {
    id: "sample-6",
    name: "หอพัก เมืองเลยปาร์ค",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    isNew: true
  }
];

const DEFAULT_LOCATIONS = [
  "กำเนิดเพชร",
  "เชียงคาน",
  "ราชภัฏเลย",
  "โรงพยาบาลเลย",
  "โรงเรียนเลยพิท",
  "เมืองเลย",
  "นาอาน",
  "กุดป่อง"
];

const PRICE_OPTIONS = [
  "ต่ำกว่า 2,000 บาท",
  "2,000 - 3,000 บาท",
  "3,000 - 5,000 บาท",
  "มากกว่า 5,000 บาท"
];

const ROOM_TYPE_OPTIONS = [
  "ห้องพัดลม",
  "ห้องแอร์",
  "ห้องสตูดิโอ"
];

const FALLBACK_REVIEWS = [
  {
    id: "rev-1",
    dormitoryId: "sample-1",
    rating: 5,
    comment: "ห้องสะอาด บรรยากาศดี",
    subtext: "ใกล้มหาวิทยาลัย เดินทางสะดวก",
    userName: "นายซีเอล",
    userPhoto: "/images/default-avatar.jpg",
    timeAgo: "เมื่อวาน"
  },
  {
    id: "rev-2",
    dormitoryId: "sample-2",
    rating: 5,
    comment: "เจ้าของดูแลดีมาก",
    subtext: "มีสิ่งอำนวยความสะดวก",
    userName: "นายดื้อ",
    userPhoto: "/images/default-avatar.jpg",
    timeAgo: "2 วันที่แล้ว"
  },
  {
    id: "rev-3",
    dormitoryId: "sample-1",
    rating: 5,
    comment: "ห้องสะอาด บรรยากาศดี",
    subtext: "บรรยากาศ น่านอนมาก",
    userName: "นางสาว หมางอน",
    userPhoto: "/images/default-avatar.jpg",
    timeAgo: "3 วันที่แล้ว"
  },
  {
    id: "rev-4",
    dormitoryId: "sample-3",
    rating: 5,
    comment: "ประหยัด สบายกระเป๋า",
    subtext: "ปลอดภัย ไม่ไกลจากที่ทำงาน",
    userName: "นายเมสซี่",
    userPhoto: "/images/default-avatar.jpg",
    timeAgo: "4 วันที่แล้ว"
  }
];

export default function HomePage() {
  const navigate = useNavigate();
  const { currentUser, userRole } = useAuth();
  const [dorms, setDorms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [locationOptions, setLocationOptions] = useState(DEFAULT_LOCATIONS);
  const [reviewsList, setReviewsList] = useState([]);

  const [searchName, setSearchName] = useState("");
  const [district, setDistrict] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [roomType, setRoomType] = useState("");

  useEffect(() => {
    getApprovedDormitories()
      .then((data) => {
        if (data && data.length > 0) setDorms(data);
        else setDorms(FALLBACK_DORMS);
      })
      .catch(() => setDorms(FALLBACK_DORMS))
      .finally(() => setLoading(false));

    async function loadLocations() {
      try {
        const locs = await getLocations();
        if (locs && locs.length > 0) {
          setLocationOptions(locs.map((l) => l.name));
        }
      } catch (err) {
        console.error("Failed to load locations in HomePage:", err);
      }
    }

    async function loadReviews() {
      try {
        const revs = await getLatestReviews();
        if (revs && revs.length > 0) {
          setReviewsList(revs.slice(0, 4));
        } else {
          setReviewsList(FALLBACK_REVIEWS);
        }
      } catch (err) {
        setReviewsList(FALLBACK_REVIEWS);
      }
    }

    loadLocations();
    loadReviews();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (searchName.trim()) query.set("name", searchName.trim());
    if (district && !district.startsWith("เลือก")) query.set("district", district.trim());
    if (priceRange && !priceRange.startsWith("เลือก")) query.set("priceRange", priceRange.trim());
    if (roomType && !roomType.startsWith("เลือก")) query.set("roomType", roomType.trim());
    navigate(`/dorms?${query.toString()}`);
  };

  const dormNameOptions = Array.from(new Set(dorms.map((d) => d.name).filter(Boolean)));
  const displayRecommendedDorms = dorms.length >= 6 ? dorms.slice(0, 6) : [...dorms, ...FALLBACK_DORMS].slice(0, 6);
  const displayLatestDorms = dorms.length >= 6 ? [...dorms].reverse().slice(0, 6) : [...FALLBACK_DORMS].slice(0, 6);

  return (
    <div>
      {/* ===============================
              HERO BANNER SECTION
      ================================ */}
      <section
        className="home-hero-container"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "500px",
          background: "url('/images/banner.jpg') center right / cover no-repeat",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBottom: "60px"
        }}
      >
        {/* Light Green Overlay on Left */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(90deg, rgba(235, 245, 233, 0.95) 0%, rgba(235, 245, 233, 0.82) 48%, rgba(255, 255, 255, 0.1) 100%)",
            zIndex: 1
          }}
        ></div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            padding: "60px 30px 50px 30px"
          }}
        >
          <div style={{ maxWidth: "600px" }}>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "800",
                color: "#1e293b",
                lineHeight: "1.15",
                margin: "0 0 6px 0"
              }}
            >
              ค้นหาหอพักที่ใช่ ...
            </h1>
            <h1
              style={{
                fontSize: "48px",
                fontWeight: "800",
                color: "#5b8e66",
                lineHeight: "1.15",
                margin: "0 0 16px 0"
              }}
            >
              ในจังหวัดเลย
            </h1>

            <p style={{ fontSize: "18px", color: "#475569", lineHeight: "1.6", margin: "0 0 32px 0" }}>
              ค้นหา เปรียบเทียบ และเลือกหอพักได้ง่าย<br />
              ครบทุกข้อมูลในเว็บไซต์เดียว
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/dorms" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "#688d67",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 26px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(104, 141, 103, 0.3)"
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  ค้นหาหอพัก
                </button>
              </Link>

              {userRole === "owner" ? (
                <Link to="/owner/dormitories" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fa-solid fa-building"></i>
                    ดูหอพักของฉัน
                  </button>
                </Link>
              ) : userRole === "admin" ? (
                <Link to="/admin/dashboard" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fa-solid fa-gauge-high"></i>
                    ระบบจัดการ (แอดมิน)
                  </button>
                </Link>
              ) : (
                <Link to="/register" style={{ textDecoration: "none" }}>
                  <button
                    style={{
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      padding: "12px 24px",
                      fontSize: "15px",
                      fontWeight: "600",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px"
                    }}
                  >
                    <i className="fa-regular fa-building"></i>
                    ลงประกาศหอพัก
                  </button>
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Floating Overlapping Search Box */}
        <div
          style={{
            position: "absolute",
            bottom: "-48px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 40px)",
            maxWidth: "1120px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9",
            zIndex: 10
          }}
        >
          <form
            onSubmit={handleSearch}
            style={{
              display: "grid",
              gridTemplateColumns: "1.4fr 1fr 1fr 1fr auto",
              gap: "14px",
              alignItems: "end"
            }}
          >
            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13.5px", color: "#1e293b" }}>
                ชื่อหอพัก
              </label>
              <SearchableSelect
                value={searchName}
                onChange={(val) => setSearchName(val)}
                options={dormNameOptions}
                placeholder="ค้นหาชื่อหอพัก"
                icon="fa-magnifying-glass"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13.5px", color: "#1e293b" }}>
                พื้นที่
              </label>
              <SearchableSelect
                value={district}
                onChange={(val) => setDistrict(val)}
                options={locationOptions}
                placeholder="เลือกพื้นที่"
                icon="fa-chevron-down"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13.5px", color: "#1e293b" }}>
                ช่วงราคา
              </label>
              <SearchableSelect
                value={priceRange}
                onChange={(val) => setPriceRange(val)}
                options={PRICE_OPTIONS}
                placeholder="เลือกช่วงราคา"
                icon="fa-chevron-down"
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: "6px", fontWeight: "600", fontSize: "13.5px", color: "#1e293b" }}>
                ประเภทห้อง
              </label>
              <SearchableSelect
                value={roomType}
                onChange={(val) => setRoomType(val)}
                options={ROOM_TYPE_OPTIONS}
                placeholder="เลือกประเภท"
                icon="fa-chevron-down"
              />
            </div>

            <button
              type="submit"
              style={{
                backgroundColor: "#6f9d6a",
                color: "#ffffff",
                border: "none",
                borderRadius: "8px",
                height: "44px",
                padding: "0 28px",
                fontWeight: "600",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "background 0.2s"
              }}
            >
              ค้นหา
            </button>
          </form>
        </div>
      </section>

      {/* =====================================================
              CATEGORY FILTER BAR SECTION
      ===================================================== */}
      <section style={{ padding: "85px 0 10px 0", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
            {[
              { label: "ทั้งหมด", icon: "fa-table-cells-large" },
              { label: "ใกล้มหาวิทยาลัย", icon: "fa-graduation-cap" },
              { label: "ใกล้โรงพยาบาล", icon: "fa-hospital" },
              { label: "ใกล้ห้าง", icon: "fa-shop" },
              { label: "ใกล้ขนส่ง", icon: "fa-bus" },
              { label: "ธรรมชาติ", icon: "fa-tree" }
            ].map((cat) => (
              <button
                key={cat.label}
                type="button"
                className="category-filter-btn"
                onClick={() => navigate(cat.label === "ทั้งหมด" ? "/dorms" : `/dorms?amenity=${encodeURIComponent(cat.label)}`)}
              >
                <i className={`fa-solid ${cat.icon}`}></i>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
              SECTION 1: หอพักแนะนำ (Recommended Dormitories)
      ===================================================== */}
      <section style={{ padding: "30px 0 40px 0", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
              หอพักแนะนำ
            </h2>
            <Link
              to="/dorms"
              className="btn-view-all"
            >
              ดูทั้งหมด
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "16px" }}>
            {displayRecommendedDorms.map((dorm, idx) => (
              <div
                key={dorm.id || idx}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  minHeight: "310px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                className="dorm-card-recommended"
              >
                <div>
                  <div style={{ position: "relative", width: "100%", height: "120px", overflow: "hidden", background: "#f1f5f9" }}>
                    <img
                      src={getImageUrl(dorm.images && dorm.images[0] ? dorm.images[0] : "images/dorm-1.jpg")}
                      alt={dorm.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = getImageUrl("images/banner.jpg"); }}
                    />
                  </div>
                  <div style={{ padding: "12px 14px 6px 14px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {dorm.name || "หอพัก อเธน่า"}
                    </h4>
                    <div style={{ color: "#f59e0b", fontSize: "12px", marginBottom: "6px", display: "flex", gap: "2px" }}>
                      {Array.from({ length: dorm.rating || 5 }).map((_, i) => (
                        <i key={i} className="fa-solid fa-star"></i>
                      ))}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#f59e0b", marginBottom: "6px" }}>
                      {Number(dorm.priceMin || 3500).toLocaleString()} บาท/เดือน
                    </div>
                    {/* Location Pin Icon + Address */}
                    <div style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                      <i className="fa-solid fa-location-dot" style={{ color: "#5b8e66", fontSize: "12px", flexShrink: 0 }}></i>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {dorm.address || (dorm.district ? `อำเภอ${dorm.district}` : "1.2 km จากราชภัฏเลย")}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0 14px 14px 14px", marginTop: "auto" }}>
                  <Link
                    to={`/dorms/${dorm.id || "sample-1"}`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      backgroundColor: "#6f9d6a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 0",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
              SECTION 2: หอพักล่าสุด (Latest Dormitories)
      ===================================================== */}
      <section style={{ padding: "10px 0 50px 0", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
            <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
              หอพักล่าสุด
            </h2>
            <Link
              to="/dorms?sort=newest"
              className="btn-view-all"
            >
              ดูทั้งหมด
            </Link>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: "16px" }}>
            {displayLatestDorms.map((dorm, idx) => (
              <div
                key={dorm.id || idx}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  overflow: "hidden",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  height: "100%",
                  minHeight: "310px",
                  transition: "transform 0.2s ease, box-shadow 0.2s ease"
                }}
                className="dorm-card-recommended"
              >
                <div>
                  <div style={{ position: "relative", width: "100%", height: "120px", overflow: "hidden", background: "#f1f5f9" }}>
                    <img
                      src={getImageUrl(dorm.images && dorm.images[0] ? dorm.images[0] : "images/dorm-1.jpg")}
                      alt={dorm.name}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = getImageUrl("images/banner.jpg"); }}
                    />
                    <span
                      style={{
                        position: "absolute",
                        top: "8px",
                        left: "8px",
                        backgroundColor: "#5b8e66",
                        color: "#ffffff",
                        fontSize: "11px",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "4px"
                      }}
                    >
                      ใหม่
                    </span>
                  </div>
                  <div style={{ padding: "12px 14px 6px 14px" }}>
                    <h4 style={{ fontSize: "14px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {dorm.name || "หอพัก อเธน่า"}
                    </h4>
                    <div style={{ color: "#f59e0b", fontSize: "12px", marginBottom: "6px", display: "flex", gap: "2px" }}>
                      {Array.from({ length: dorm.rating || 5 }).map((_, i) => (
                        <i key={i} className="fa-solid fa-star"></i>
                      ))}
                    </div>
                    <div style={{ fontSize: "14px", fontWeight: "700", color: "#f59e0b", marginBottom: "6px" }}>
                      {Number(dorm.priceMin || 3500).toLocaleString()} บาท/เดือน
                    </div>
                    {/* Location Pin Icon + Address */}
                    <div style={{ fontSize: "11.5px", color: "#64748b", display: "flex", alignItems: "center", gap: "4px", marginBottom: "8px" }}>
                      <i className="fa-solid fa-location-dot" style={{ color: "#5b8e66", fontSize: "12px", flexShrink: 0 }}></i>
                      <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                        {dorm.address || (dorm.district ? `อำเภอ${dorm.district}` : "1.2 km จากราชภัฏเลย")}
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ padding: "0 14px 14px 14px", marginTop: "auto" }}>
                  <Link
                    to={`/dorms/${dorm.id || "sample-1"}`}
                    style={{
                      display: "block",
                      width: "100%",
                      textAlign: "center",
                      backgroundColor: "#6f9d6a",
                      color: "#ffffff",
                      border: "none",
                      borderRadius: "8px",
                      padding: "8px 0",
                      fontSize: "12.5px",
                      fontWeight: "600",
                      textDecoration: "none",
                      transition: "all 0.2s"
                    }}
                  >
                    ดูรายละเอียด
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
              SECTION 3: รีวิวล่าสุดจากผู้เข้าพัก (Tenant Reviews)
      ===================================================== */}
      <section className="home-section latest-reviews-section" style={{ padding: "40px 0 30px 0", backgroundColor: "#ffffff" }}>
        <div className="section-container" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1e293b", marginBottom: "24px", textAlign: "left" }}>
            รีวิวล่าสุดจากผู้เข้าพัก
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "20px" }}>
            {(reviewsList && reviewsList.length > 0 ? reviewsList : FALLBACK_REVIEWS).map((rev, idx) => {
              const targetDormId = rev.dormitoryId || rev.dormitory_id || rev.dormId || (dorms[idx % dorms.length]?.id) || "sample-1";
              return (
                <div
                  key={rev.id || idx}
                  onClick={() => navigate(`/dorms/${targetDormId}`)}
                  style={{
                    backgroundColor: "#ffffff",
                    borderRadius: "14px",
                    padding: "22px",
                    boxShadow: "0 4px 14px rgba(0,0,0,0.04)",
                    border: "1px solid #e2e8f0",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                    transition: "all 0.2s ease",
                    cursor: "pointer"
                  }}
                  className="review-card-item"
                  title="กดเพื่อดูรายละเอียดหอพักนี้"
                >
                  <div>
                    {/* Stars */}
                    <div style={{ color: "#f59e0b", fontSize: "16px", marginBottom: "10px", display: "flex", gap: "2px" }}>
                      {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                        <i key={i} className="fa-solid fa-star"></i>
                      ))}
                    </div>

                    {/* Comment */}
                    <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1e293b", margin: "0 0 4px 0", lineHeight: "1.3" }}>
                      "{rev.comment}"
                    </h4>
                    <p style={{ fontSize: "13px", color: "#64748b", margin: "0 0 16px 0", lineHeight: "1.4" }}>
                      {rev.subtext || rev.dormitoryName || "ใกล้มหาวิทยาลัย เดินทางสะดวก"}
                    </p>
                  </div>

                  <div>
                    {/* Link Indicator */}
                    <div style={{ fontSize: "12px", color: "#7da27c", fontWeight: "600", marginBottom: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <i className="fa-solid fa-house-chimney" style={{ fontSize: "11px" }}></i>
                      <span>{rev.dormitoryName || "ดูหอพักนี้"}</span>
                      <i className="fa-solid fa-angle-right" style={{ marginLeft: "auto", fontSize: "12px" }}></i>
                    </div>

                    {/* User Info */}
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", paddingTop: "12px", borderTop: "1px solid #f1f5f9" }}>
                      <img
                        src={rev.userPhoto || "/images/default-avatar.jpg"}
                        alt="Avatar"
                        style={{ width: "40px", height: "40px", borderRadius: "50%", objectFit: "cover", backgroundColor: "#e2e8f0" }}
                        onError={(e) => { e.target.src = "/images/default-avatar.jpg"; }}
                      />
                      <div>
                        <div style={{ fontWeight: "600", fontSize: "14px", color: "#1e293b" }}>
                          {rev.userName}
                        </div>
                        <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                          {rev.timeAgo || "เมื่อเร็วๆ นี้"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* =====================================================
              SECTION 4: ทำไมต้องเลือก อยู่เลยเฮาส์ (Why Choose Us)
      ===================================================== */}
      <section className="home-section why-choose-section" style={{ padding: "40px 0", backgroundColor: "#fafdfa" }}>
        <div className="section-container" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: "30px" }}>
            ทำไมต้องเลือก <span style={{ color: "#7da27c" }}>อยู่เลยเฮาส์</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              {
                icon: "fa-magnifying-glass",
                title: "ค้นหาได้ง่าย",
                desc: "ค้นหาหอพักได้รวดเร็ว ครบทุกอำเภอในจังหวัดเลย"
              },
              {
                icon: "fa-map-location-dot",
                title: "ดูตำแหน่งบนแผนที่",
                desc: "ดูตำแหน่งหอพักบน Google Map ได้ทันที"
              },
              {
                icon: "fa-star",
                title: "รีวิวจากผู้ใช้งานจริง",
                desc: "รีวิวและคะแนนจากผู้เข้าพักจริงช่วยในการตัดสินใจ"
              },
              {
                icon: "fa-comments",
                title: "ติดต่อเจ้าของง่าย",
                desc: "ติดต่อเจ้าของหอพักได้โดยตรงผ่านระบบแชท"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#edf4ec",
                  borderRadius: "14px",
                  padding: "20px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  border: "1px solid #dce8d6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: "#c8dfc6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <i className={`fa-solid ${item.icon}`} style={{ fontSize: "20px", color: "#3d643b" }}></i>
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#2e4a2c", margin: "0 0 4px 0" }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#526550", margin: 0, lineHeight: "1.4" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
              SECTION 5: วิธีใช้งานเว็บไซต์ (How to Use)
      ===================================================== */}
      <section className="home-section how-to-use-section" style={{ padding: "40px 0 60px 0", backgroundColor: "#ffffff" }}>
        <div className="section-container" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: "30px" }}>
            วิธีใช้งานเว็บไซต์
          </h2>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              padding: "36px 24px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: "24px"
              }}
            >
              {/* Step 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 220px", minWidth: "220px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#5b835a",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  1
                </div>
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "32px", color: "#334155", flexShrink: 0 }}></i>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#5b835a", margin: "0 0 4px 0" }}>
                    ค้นหาหอพัก
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                    ค้นหาหอพักที่ต้องการ จากตัวกรองที่มีให้
                  </p>
                </div>
              </div>

              {/* Arrow 1 */}
              <div style={{ color: "#7da27c", fontSize: "24px", display: "flex", alignItems: "center" }} className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 220px", minWidth: "220px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#5b835a",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  2
                </div>
                <i className="fa-solid fa-scale-balanced" style={{ fontSize: "32px", color: "#334155", flexShrink: 0 }}></i>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#5b835a", margin: "0 0 4px 0" }}>
                    เปรียบเทียบ
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                    เปรียบเทียบราคา สิ่งอำนวยความสะดวก และรีวิว เพื่อประกอบการตัดสินใจ
                  </p>
                </div>
              </div>

              {/* Arrow 2 */}
              <div style={{ color: "#7da27c", fontSize: "24px", display: "flex", alignItems: "center" }} className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 220px", minWidth: "220px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#5b835a",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  3
                </div>
                <i className="fa-solid fa-calendar-days" style={{ fontSize: "32px", color: "#334155", flexShrink: 0 }}></i>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#5b835a", margin: "0 0 4px 0" }}>
                    จองห้อง
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                    ติดต่อเจ้าของหอพัก และจองห้องได้ง่าย
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
