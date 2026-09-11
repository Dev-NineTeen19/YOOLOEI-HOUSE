import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import SearchableSelect from "../../components/common/SearchableSelect";
import DormCard from "../../components/dorm/DormCard";
import { getDormitoryById, incrementDormView, getApprovedDormitories } from "../../services/dormitoryService";
import { recordDormView } from "../../services/historyService";
import { getRoomsByDormitory } from "../../services/roomService";
import { getReviewsByDormitory, createReview, replyToReview } from "../../services/reviewService";
import { createBooking, getBookingsByUser } from "../../services/bookingService";
import { isFavorite, addFavorite, removeFavorite } from "../../services/favoriteService";
import { getLocations } from "../../services/locationService";

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

const DEFAULT_OTHER_DORMS = [
  { id: "sample-1", name: "หอพัก อเธน่า", district: "เมืองเลย", address: "อ.เมือง จ.เลย", bedroomCount: 1, priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"] },
  { id: "sample-2", name: "หอพัก ภูผาอินทร์", district: "เมืองเลย", address: "อ.เมือง จ.เลย", bedroomCount: 1, priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"] },
  { id: "sample-3", name: "บ้านพักสบาย เชียงคาน", district: "เชียงคาน", address: "อ.เชียงคาน จ.เลย", bedroomCount: 1, priceMin: 4000, priceMax: 4000, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "เครื่องทำน้ำอุ่น"] },
  { id: "sample-4", name: "หอพัก อานนท์", district: "เมืองเลย", address: "อ.เมือง จ.เลย", bedroomCount: 1, priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"] },
];

export default function DormDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, userData, userRole } = useAuth();

  const [dorm, setDorm] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [otherDorms, setOtherDorms] = useState([]);
  const [favorited, setFavorited] = useState(false);
  const [userBooking, setUserBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  // Search Bar Form State
  const [searchName, setSearchName] = useState("");
  const [district, setDistrict] = useState("");
  const [priceRange, setPriceRange] = useState("");
  const [roomType, setRoomType] = useState("");
  const [activeCategory, setActiveCategory] = useState("ทั้งหมด");
  const [locationOptions, setLocationOptions] = useState(DEFAULT_LOCATIONS);
  const [dormNameOptions, setDormNameOptions] = useState([]);

  // Booking Modal State
  const [bookingModalOpen, setBookingModalOpen] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingNote, setBookingNote] = useState("");
  const [bookingSubmitting, setBookingSubmitting] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Review Form State
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);

  // Reply Review State for Admin & Owner
  const [replyingReviewId, setReplyingReviewId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [replySubmitting, setReplySubmitting] = useState(false);

  useEffect(() => {
    async function loadData(isInitial = true) {
      if (isInitial) setLoading(true);
      try {
        const dormData = await getDormitoryById(id);
        if (dormData) {
          setDorm(dormData);
          if (isInitial) {
            incrementDormView(id);
            if (currentUser) {
              recordDormView(id);
            }
          }

          const [roomList, reviewList] = await Promise.all([
            getRoomsByDormitory(id),
            getReviewsByDormitory(id)
          ]);
          setRooms(roomList);
          setReviews(reviewList);

          if (currentUser) {
            const userId = currentUser.id || currentUser.uid;
            const fav = await isFavorite(userId, id);
            setFavorited(fav);

            try {
              const userBookings = await getBookingsByUser(userId);
              const match = userBookings.find((b) => (b.dormitoryId === id || b.dormitory_id === id) && b.status !== "cancelled");
              setUserBooking(match || null);
            } catch (err) {
              console.error("Error loading user booking status:", err);
            }
          }
        } else {
          // Fallback sample data if document not found
          setDorm({
            id,
            name: "สุขุมวิท พลัส เรสซิเดนซ์ (Sukhumvit Plus Residence)",
            tagline: "ตอบโจทย์ชีวิตเมือง สะดวก ปลอดภัย เสมือนอยู่บ้าน",
            district: "เมืองเลย",
            address: "234 ม.11 ต.เมือง อ.เมือง จ.เลย 42000",
            description: "หอพักทันสมัยสไตล์โมเดิร์น เดินทางสะดวก ใกล้สถานีรถไฟฟ้าและมหาวิทยาลัย พร้อมระบบรักษาความปลอดภัย 24 ชั่วโมง และสิ่งอำนวยความสะดวกครบครัน",
            priceMin: 3500,
            priceMax: 4000,
            phone: "042-123-456",
            lineId: "@sukhumvitplus",
            amenities: ["แอร์", "WiFi", "ที่จอดรถ", "กล้องวงจรปิด", "คีย์การ์ด", "เครื่องทำน้ำอุ่น", "ระเบียง"],
            roomTypes: ["ห้องแอร์", "ห้องสตูดิโอ"],
            images: [
              "/images/dorm-1.jpg",
              "/images/dorm-2.jpg",
              "/images/dorm-hero.jpg",
              "/images/banner.jpg"
            ],
            rating: 4.8,
            reviewCount: 12
          });
        }

        if (isInitial) {
          // Fetch location options & all dorm names for search select & recommended grid
          const locs = await getLocations();
          if (locs && locs.length > 0) {
            setLocationOptions(locs.map((l) => l.name));
          }

          const allDorms = await getApprovedDormitories({});
          if (allDorms && allDorms.length > 0) {
            setDormNameOptions(Array.from(new Set(allDorms.map((d) => d.name).filter(Boolean))));
            const filteredOther = allDorms.filter((d) => d.id !== id);
            setOtherDorms(filteredOther.length >= 4 ? filteredOther : [...filteredOther, ...DEFAULT_OTHER_DORMS]);
          } else {
            setDormNameOptions(["สุขุมวิท พลัส เรสซิเดนซ์", "หอพัก อเธน่า", "หอพัก ภูผาอินทร์", "บ้านพักสบาย เชียงคาน", "หอพัก อานนท์"]);
            setOtherDorms(DEFAULT_OTHER_DORMS);
          }
        }
      } catch (err) {
        console.error("Error loading dorm detail:", err);
        if (isInitial) setOtherDorms(DEFAULT_OTHER_DORMS);
      } finally {
        if (isInitial) setLoading(false);
      }
    }

    loadData(true);

    // Real-time polling every 3 seconds for instant status updates when owner changes room status
    const pollInterval = setInterval(() => {
      loadData(false);
    }, 3000);

    return () => clearInterval(pollInterval);
  }, [id, currentUser]);

  const handleToggleFavorite = async () => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    try {
      const userId = currentUser.id || currentUser.uid;
      if (favorited) {
        await removeFavorite(userId, id);
        setFavorited(false);
      } else {
        const isFav = await addFavorite(userId, id);
        setFavorited(isFav);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (searchName.trim()) params.append("name", searchName.trim());
    if (district) params.append("district", district);
    if (priceRange) params.append("priceRange", priceRange);
    if (roomType) params.append("roomType", roomType);

    navigate(`/dorms?${params.toString()}`);
  };

  const handleCategoryClick = (catName) => {
    setActiveCategory(catName);
    if (catName === "ทั้งหมด") {
      navigate("/dorms");
    } else {
      navigate(`/dorms?category=${encodeURIComponent(catName)}`);
    }
  };

  const handleOpenBookingModal = (room = null) => {
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (userRole === "admin") {
      alert("ผู้ดูแลระบบสามารถเข้าดูข้อมูลหอพักและห้องพักได้เท่านั้น ไม่สามารถทำการจองห้องพักได้");
      return;
    }
    const targetRoom = room || rooms.find(r => r.status === 'available' || !r.status) || rooms[0] || null;
    setSelectedRoom(targetRoom);
    setBookingModalOpen(true);
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate("/login");
      return;
    }
    if (userRole === "admin") {
      alert("ผู้ดูแลระบบสามารถเข้าดูข้อมูลหอพักและห้องพักได้เท่านั้น ไม่สามารถทำการจองห้องพักได้");
      return;
    }

    setBookingSubmitting(true);
    try {
      await createBooking({
        userId: currentUser.uid,
        userEmail: currentUser.email,
        userName: userData?.displayName || currentUser.email,
        userPhone: userData?.phone || "",
        ownerId: dorm.ownerId || "system",
        dormitoryId: id,
        dormitoryName: dorm.name,
        roomId: selectedRoom?.id || "general",
        roomNumber: selectedRoom?.roomNumber || "ห้องมาตรฐาน",
        bookingDate,
        note: bookingNote
      });

      setBookingSuccess(true);
      setTimeout(() => {
        setBookingModalOpen(false);
        setBookingSuccess(false);
        navigate("/user/bookings");
      }, 1500);
    } catch (err) {
      console.error("Booking error:", err);
      alert("เกิดข้อผิดพลาดในการจองห้องพัก กรุณาลองใหม่อีกครั้ง");
    } finally {
      setBookingSubmitting(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      navigate("/login");
      return;
    }

    setReviewSubmitting(true);
    try {
      const roleLabel = userRole === "admin" ? " (ผู้ดูแลระบบ)" : userRole === "owner" ? " (เจ้าของหอพัก)" : "";
      const baseName = userData?.displayName || userData?.fullName || currentUser.displayName || currentUser.email?.split("@")[0] || "ผู้ใช้งาน";
      const finalUserName = baseName.includes("(") ? baseName : `${baseName}${roleLabel}`;

      await createReview({
        userId: currentUser.id || currentUser.uid,
        userName: finalUserName,
        userPhoto: userData?.avatarUrl || userData?.photoURL || currentUser.photoURL || "/images/default-avatar.jpg",
        dormitoryId: id,
        rating,
        comment
      });

      const updatedReviews = await getReviewsByDormitory(id);
      setReviews(updatedReviews);
      setComment("");
      alert("ส่งรีวิวเรียบร้อยแล้ว ขอบคุณสำหรับความคิดเห็นครับ!");
    } catch (err) {
      console.error("Review error:", err);
      alert("ไม่สามารถส่งรีวิวได้");
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleReplySubmit = async (reviewId) => {
    if (!replyText.trim()) return;
    setReplySubmitting(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      const updatedReviews = await getReviewsByDormitory(id);
      setReviews(updatedReviews);
      setReplyingReviewId(null);
      setReplyText("");
    } catch (err) {
      console.error("Error replying to review:", err);
      const msg = err?.error || err?.message || "ไม่สามารถบันทึกการตอบกลับได้";
      alert(msg);
    } finally {
      setReplySubmitting(false);
    }
  };

  const handleContactOwner = () => {
    if (!currentUser) {
      navigate("/login");
    } else {
      navigate(`/user/messages?ownerId=${dorm.ownerId || "0f9be26f-766e-4914-991a-ee51506ae407"}&dormId=${dorm.id}&ownerName=${encodeURIComponent(dorm.ownerName || "เจ้าของหอพัก")}&dormName=${encodeURIComponent(dorm.name)}`);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#5b8e66", fontSize: "18px", background: "#f8faf8", minHeight: "100vh" }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดรายละเอียดหอพัก...
      </div>
    );
  }

  if (!dorm) {
    return (
      <div style={{ textAlign: "center", padding: "100px 20px", background: "#f8faf8", minHeight: "100vh" }}>
        <h2>ไม่พบข้อมูลหอพักที่ค้นหา</h2>
        <Link to="/dorms" style={{ color: "#5b8e66" }}>กลับสู่หน้ารายการหอพัก</Link>
      </div>
    );
  }

  const dormImages = (dorm.images && dorm.images.length > 0)
    ? dorm.images
    : ["/images/dorm-1.jpg", "/images/dorm-2.jpg", "/images/dorm-hero.jpg", "/images/banner.jpg"];

  const displayThumbnails = [...dormImages];
  while (displayThumbnails.length < 4) {
    displayThumbnails.push(dormImages[displayThumbnails.length % dormImages.length]);
  }

  const categories = [
    { name: "ทั้งหมด", icon: "fa-solid fa-table-cells-large" },
    { name: "ใกล้มหาวิทยาลัย", icon: "fa-solid fa-graduation-cap" },
    { name: "ใกล้โรงพยาบาล", icon: "fa-solid fa-hospital" },
    { name: "ใกล้ห้าง", icon: "fa-solid fa-shop" },
    { name: "ใกล้ขนส่ง", icon: "fa-solid fa-bus" },
    { name: "ธรรมชาติ", icon: "fa-solid fa-tree" },
  ];

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: '"Noto Sans Thai", sans-serif' }}>
      
      <div style={{ position: "relative", zIndex: 10, maxWidth: "1120px", margin: "40px auto 0", padding: "0 30px 60px" }}>
        
        {/* Breadcrumb Navigation */}
        <div style={{ fontSize: "14px", color: "#666", marginBottom: "16px", display: "flex", gap: "6px", alignItems: "center" }}>
          <Link to="/" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>หน้าแรก</Link>
          <span>/</span>
          <Link to="/dorms" style={{ color: "#333", textDecoration: "none", fontWeight: 500 }}>ค้นหาหอพัก</Link>
          <span>/</span>
          <span style={{ color: "#777" }}>รายละเอียด</span>
        </div>

        {/* Main Dormitory Details Container Card */}
        <div style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "28px",
          boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
          border: "1px solid #e8eee8",
          marginBottom: "32px"
        }}>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "32px",
            alignItems: "start"
          }}>
            {/* Left Column: Image Gallery & Favorite Action */}
            <div>
              {/* Main Featured Photo */}
              <div
                onClick={() => setLightboxOpen(true)}
                style={{
                  position: "relative",
                  width: "100%",
                  height: "280px",
                  borderRadius: "16px",
                  overflow: "hidden",
                  marginBottom: "16px",
                  cursor: "pointer",
                  background: "#e2e8f0"
                }}
              >
                <img
                  src={dormImages[activeImageIndex] || dormImages[0]}
                  alt={dorm.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    transition: "transform 0.3s"
                  }}
                  onError={(e) => { e.target.src = "/images/banner.jpg"; }}
                />
              </div>

              {/* 4 Thumbnail Strip with Arrow Overlay Buttons */}
              <div style={{ position: "relative", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "10px", marginBottom: "20px" }}>
                {displayThumbnails.slice(0, 4).map((img, idx) => (
                  <div
                    key={idx}
                    onClick={() => setActiveImageIndex(idx % dormImages.length)}
                    style={{
                      position: "relative",
                      height: "75px",
                      borderRadius: "10px",
                      overflow: "hidden",
                      cursor: "pointer",
                      border: (activeImageIndex % dormImages.length) === (idx % dormImages.length) ? "3px solid #5b8e66" : "2px solid transparent",
                      opacity: (activeImageIndex % dormImages.length) === (idx % dormImages.length) ? 1 : 0.8,
                      transition: "all 0.2s"
                    }}
                  >
                    <img
                      src={img}
                      alt={`thumb-${idx}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      onError={(e) => { e.target.src = "/images/banner.jpg"; }}
                    />
                    
                    {/* Left arrow on 1st thumbnail */}
                    {idx === 0 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev - 1 + dormImages.length) % dormImages.length);
                        }}
                        style={{
                          position: "absolute",
                          left: "4px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0, 0, 0, 0.4)",
                          color: "#fff",
                          border: "none",
                          width: "22px",
                          height: "22px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <i className="fa-solid fa-chevron-left"></i>
                      </button>
                    )}

                    {/* Right arrow on 4th thumbnail */}
                    {idx === 3 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setActiveImageIndex((prev) => (prev + 1) % dormImages.length);
                        }}
                        style={{
                          position: "absolute",
                          right: "4px",
                          top: "50%",
                          transform: "translateY(-50%)",
                          background: "rgba(0, 0, 0, 0.4)",
                          color: "#fff",
                          border: "none",
                          width: "22px",
                          height: "22px",
                          borderRadius: "4px",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "12px",
                          cursor: "pointer"
                        }}
                      >
                        <i className="fa-solid fa-chevron-right"></i>
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Favorite Action Button */}
              <button
                type="button"
                className="btn-fav-no-hover"
                onClick={handleToggleFavorite}
                style={{
                  background: "none",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: favorited ? "#2e7d32" : "#2d4a32",
                  fontSize: "16px",
                  fontWeight: 700,
                  cursor: "pointer",
                  padding: "4px 0"
                }}
              >
                <i className={favorited ? "fa-solid fa-heart" : "fa-regular fa-heart"} style={{ color: "#3d6a45", fontSize: "20px" }}></i>
                <span>{favorited ? "บันทึกไปยังรายการโปรดแล้ว" : "บันทึกไปยังรายการโปรด"}</span>
              </button>
            </div>

            {/* Right Column: Title, Subtitle, Price, Description & Action Buttons */}
            <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%" }}>
              <div>
                {/* User Booking Status Badge */}
                {userBooking && (
                  <div style={{ marginBottom: "12px" }}>
                    {userBooking.status === "approved" ? (
                      <span style={{
                        background: "#dcfce7",
                        color: "#15803d",
                        border: "1px solid #86efac",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <i className="fa-solid fa-circle-check"></i> คุณได้รับการอนุมัติการจองหอพักนี้แล้ว (จองแล้ว)
                      </span>
                    ) : userBooking.status === "pending" ? (
                      <span style={{
                        background: "#fef3c7",
                        color: "#b45309",
                        border: "1px solid #fde68a",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "14px",
                        fontWeight: 700,
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px"
                      }}>
                        <i className="fa-solid fa-clock"></i> คำขอจองหอพักของคุณกำลังรออนุมัติ
                      </span>
                    ) : null}
                  </div>
                )}

                {/* Dorm Name */}
                <h1 style={{
                  fontSize: "24px",
                  fontWeight: 700,
                  color: "#1a1a1a",
                  lineHeight: "1.3",
                  marginBottom: "6px"
                }}>
                  {dorm.name}
                </h1>

                {/* Subtitle / Tagline */}
                <p style={{
                  fontSize: "16px",
                  fontWeight: 600,
                  color: "#2d3748",
                  marginBottom: "16px"
                }}>
                  {dorm.tagline || "ตอบโจทย์ชีวิตเมือง สะดวก ปลอดภัย เสมือนอยู่บ้าน"}
                </p>

                {/* Price */}
                <div style={{
                  fontSize: "26px",
                  fontWeight: 700,
                  color: "#f59e0b",
                  marginBottom: "16px"
                }}>
                  {Number(dorm.priceMin || dorm.price || 3500).toLocaleString()} บาท/เดือน
                </div>

                {/* Description */}
                <p style={{
                  fontSize: "14px",
                  color: "#4a5568",
                  lineHeight: "1.7",
                  marginBottom: "24px",
                  whiteSpace: "pre-line"
                }}>
                  {dorm.description || "หอพักทันสมัยสไตล์โมเดิร์น เดินทางสะดวก ใกล้สถานีรถไฟฟ้าและมหาวิทยาลัย พร้อมระบบรักษาความปลอดภัย 24 ชั่วโมง และสิ่งอำนวยความสะดวกครบครัน"}
                </p>
              </div>

              {/* Action Buttons Row */}
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginTop: "auto", paddingTop: "16px" }}>
                {/* Book Button */}
                {userRole !== "admin" && (
                  userBooking?.status === "approved" ? (
                    <button
                      type="button"
                      disabled
                      style={{
                        background: "#dcfce7",
                        color: "#166534",
                        border: "1px solid #86efac",
                        padding: "10px 24px",
                        borderRadius: "6px",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: "default",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <i className="fa-solid fa-circle-check"></i>
                      จองแล้ว (อนุมัติแล้ว)
                    </button>
                  ) : userBooking?.status === "pending" ? (
                    <button
                      type="button"
                      disabled
                      style={{
                        background: "#fef3c7",
                        color: "#92400e",
                        border: "1px solid #fde68a",
                        padding: "10px 24px",
                        borderRadius: "6px",
                        fontSize: "15px",
                        fontWeight: 700,
                        cursor: "default",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px"
                      }}
                    >
                      <i className="fa-solid fa-clock"></i>
                      รออนุมัติการจอง
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleOpenBookingModal()}
                      style={{
                        background: "#5b8e66",
                        color: "#fff",
                        border: "none",
                        padding: "10px 24px",
                        borderRadius: "6px",
                        fontSize: "15px",
                        fontWeight: 600,
                        cursor: "pointer",
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 2px 6px rgba(91,142,102,0.3)",
                        transition: "background 0.2s"
                      }}
                    >
                      <i className="fa-regular fa-file-lines" style={{ fontSize: "16px" }}></i>
                      จองห้องพัก
                    </button>
                  )
                )}

                {/* Contact Button */}
                {userRole !== "owner" && (
                  <button
                    type="button"
                    onClick={handleContactOwner}
                    style={{
                      background: "#f0f7f0",
                      color: "#5b8e66",
                      border: "1.5px solid #a3cca8",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      fontSize: "15px",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      transition: "all 0.2s"
                    }}
                  >
                    <i className="fa-solid fa-phone" style={{ fontSize: "15px" }}></i>
                    ติดต่อหอพัก
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Lower Content Sections: Details, Amenities, Rooms, Reviews */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "24px", marginBottom: "32px" }}>
          
          {/* Facilities & Address Card */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "18px", color: "#2d3748", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", fontWeight: 700 }}>
              <i className="fa-solid fa-list-check" style={{ color: "#5b8e66", marginRight: "8px" }}></i>
              สิ่งอำนวยความสะดวก
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "12px", marginBottom: "20px" }}>
              {(dorm.amenities || ["แอร์", "WiFi", "ที่จอดรถ", "กล้องวงจรปิด", "เครื่องทำน้ำอุ่น", "คีย์การ์ด"]).map((item, idx) => (
                <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", color: "#4a5568", fontSize: "14px" }}>
                  <i className="fa-solid fa-circle-check" style={{ color: "#5b8e66" }}></i>
                  <span>{item}</span>
                </div>
              ))}
            </div>

            <h3 style={{ fontSize: "18px", color: "#2d3748", marginBottom: "12px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", fontWeight: 700 }}>
              <i className="fa-solid fa-location-dot" style={{ color: "#5b8e66", marginRight: "8px" }}></i>
              ทำเลที่ตั้ง
            </h3>
            <p style={{ color: "#4a5568", fontSize: "14px", lineHeight: "1.6" }}>
              {dorm.address || `อำเภอ${dorm.district || "เมืองเลย"} จังหวัดเลย`}
            </p>
          </div>

          {/* Contact Owner Info Card */}
          <div style={{ background: "#fff", padding: "24px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            <h3 style={{ fontSize: "18px", color: "#2d3748", marginBottom: "16px", borderBottom: "2px solid #edf2f7", paddingBottom: "10px", fontWeight: 700 }}>
              <i className="fa-solid fa-id-card" style={{ color: "#5b8e66", marginRight: "8px" }}></i>
              ช่องทางติดต่อเจ้าของหอพัก
            </h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8faf8", padding: "12px 16px", borderRadius: "10px" }}>
                <i className="fa-solid fa-phone" style={{ color: "#5b8e66", fontSize: "18px" }}></i>
                <div>
                  <div style={{ fontSize: "12px", color: "#718096" }}>เบอร์โทรศัพท์</div>
                  <strong style={{ fontSize: "15px", color: "#2d3748" }}>{dorm.phone || "042-123-456"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", background: "#f8faf8", padding: "12px 16px", borderRadius: "10px" }}>
                <i className="fa-brands fa-line" style={{ color: "#06c755", fontSize: "20px" }}></i>
                <div>
                  <div style={{ fontSize: "12px", color: "#718096" }}>LINE ID</div>
                  <strong style={{ fontSize: "15px", color: "#2d3748" }}>{dorm.lineId || "@yooloeihouse"}</strong>
                </div>
              </div>

              {userRole !== "owner" && (
                <button
                  type="button"
                  onClick={handleContactOwner}
                  style={{
                    width: "100%",
                    marginTop: "8px",
                    padding: "12px",
                    background: "#5b8e66",
                    color: "#fff",
                    border: "none",
                    borderRadius: "8px",
                    fontWeight: 600,
                    fontSize: "15px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <i className="fa-solid fa-comments"></i>
                  แชทสอบถามกับผู้ดูแลหอพัก
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rooms List Section */}
        {rooms.length > 0 && (
          <div style={{ background: "#fff", padding: "28px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: "32px" }}>
            <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#2d3748", marginBottom: "18px" }}>
              <i className="fa-solid fa-door-open" style={{ color: "#5b8e66", marginRight: "10px" }}></i>
              รายการห้องพักที่มีว่าง
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {rooms.map((room) => (
                <div key={room.id} style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "16px 20px",
                  background: "#f8faf8",
                  borderRadius: "12px",
                  border: "1px solid #e2e8f0",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <div>
                    <strong style={{ fontSize: "16px", color: "#2d3748" }}>ห้อง {room.roomNumber}</strong>
                    <span style={{ marginLeft: "12px", color: "#718096", fontSize: "14px" }}>({room.roomType})</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ color: "#f59e0b", fontWeight: 700, fontSize: "16px" }}>{Number(room.price).toLocaleString()} บาท/เดือน</span>
                    {(() => {
                      const isReserved = room.status === "reserved" || room.status === "booked" || (userBooking?.roomId === room.id && userBooking?.status === "approved");
                      const isAvailable = room.status === "available" && !isReserved;

                      return (
                        <>
                          <span style={{
                            padding: "4px 12px",
                            borderRadius: "20px",
                            fontSize: "12px",
                            fontWeight: 700,
                            background: isAvailable ? "#dcfce7" : isReserved ? "#fef3c7" : "#fee2e2",
                            color: isAvailable ? "#166534" : isReserved ? "#92400e" : "#991b1b"
                          }}>
                            {isAvailable ? "ห้องว่าง" : isReserved ? "จองแล้ว" : "ไม่ว่าง"}
                          </span>
                          {isAvailable && userRole !== "admin" && (!userBooking || userBooking.status !== "approved") ? (
                            <button
                              onClick={() => handleOpenBookingModal(room)}
                              style={{
                                background: "#5b8e66",
                                color: "#fff",
                                border: "none",
                                padding: "8px 16px",
                                borderRadius: "6px",
                                fontWeight: 600,
                                cursor: "pointer"
                              }}
                            >
                              จองห้องนี้
                            </button>
                          ) : isReserved ? (
                            <span style={{ color: "#92400e", fontSize: "13px", fontWeight: 700, display: "inline-flex", alignItems: "center", gap: "4px" }}>
                              <i className="fa-solid fa-lock"></i> จองแล้ว
                            </span>
                          ) : null}
                        </>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reviews & Ratings Section */}
        <div style={{ background: "#fff", padding: "28px", borderRadius: "16px", boxShadow: "0 2px 10px rgba(0,0,0,0.04)", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "20px", fontWeight: 700, color: "#2d3748", marginBottom: "20px" }}>
            <i className="fa-solid fa-star" style={{ color: "#f59e0b", marginRight: "10px" }}></i>
            รีวิวจากผู้เข้าพัก ({reviews.length})
          </h3>

          {/* Write Review Form - Available for all roles (ทุกบทบาทสามารถเขียนรีวิวกี่ครั้งก็ได้) */}
          <form onSubmit={handleReviewSubmit} style={{ background: "#f8faf8", padding: "20px", borderRadius: "12px", marginBottom: "28px", border: "1px solid #e2e8f0" }}>
              <h4 style={{ fontSize: "16px", marginBottom: "12px", fontWeight: 600, color: "#2d3748" }}>เขียนรีวิวความประทับใจ</h4>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600, color: "#4a5568" }}>ให้คะแนนหอพัก</label>
                <select value={rating} onChange={(e) => setRating(Number(e.target.value))} style={{ padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e0", outline: "none" }}>
                  <option value={5}>⭐⭐⭐⭐⭐ 5 ดาว (ยอดเยี่ยม)</option>
                  <option value={4}>⭐⭐⭐⭐ 4 ดาว (ดีมาก)</option>
                  <option value={3}>⭐⭐⭐ 3 ดาว (ปานกลาง)</option>
                  <option value={2}>⭐⭐ 2 ดาว (พอใช้)</option>
                  <option value={1}>⭐ 1 ดาว (ต้องปรับปรุง)</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600, color: "#4a5568" }}>ความคิดเห็น</label>
                <textarea
                  rows={3}
                  style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e0", fontFamily: "inherit", outline: "none" }}
                  placeholder="บอกเล่าความรู้สึก หรือบรรยากาศการพักอาศัยที่นี่..."
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  required
                ></textarea>
              </div>

              <button
                type="submit"
                disabled={reviewSubmitting}
                style={{
                  background: "#5b8e66",
                  color: "#fff",
                  border: "none",
                  padding: "8px 24px",
                  borderRadius: "6px",
                  fontWeight: 600,
                  cursor: "pointer"
                }}
              >
                {reviewSubmitting ? "กำลังส่งรีวิว..." : "ส่งรีวิว"}
              </button>
            </form>

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <p style={{ color: "#718096", fontSize: "15px" }}>ยังไม่มีรีวิวสำหรับหอพักนี้ มาเป็นคนแรกที่รีวิวกันครับ!</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {reviews.map((rev) => {
                const avatarSrc = rev.userPhoto || "/images/default-avatar.jpg";
                return (
                  <div key={rev.id} style={{ borderBottom: "1px solid #edf2f7", paddingBottom: "18px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <img
                          src={avatarSrc}
                          alt={rev.userName || "ผู้รีวิว"}
                          style={{
                            width: "42px",
                            height: "42px",
                            borderRadius: "50%",
                            objectFit: "cover",
                            border: "2px solid #e2e8f0"
                          }}
                          onError={(e) => { e.target.src = "/images/default-avatar.jpg"; }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: "#2d3748", fontSize: "15px" }}>
                            {rev.userName || "ผู้ใช้งาน"}
                          </div>
                          <div style={{ fontSize: "12px", color: "#a0aec0", display: "flex", alignItems: "center", gap: "6px" }}>
                            <span style={{ color: "#f59e0b", fontSize: "13px" }}>
                              {"⭐".repeat(rev.rating || 5)}
                            </span>
                            {rev.createdAt && <span>• {new Date(rev.createdAt).toLocaleDateString("th-TH")}</span>}
                          </div>
                        </div>
                      </div>

                      {/* If review belongs to current logged in tenant */}
                      {currentUser && (currentUser.id === rev.userId || currentUser.uid === rev.userId) && (
                        (() => {
                          const baseTime = rev.createdAt || rev.updatedAt;
                          const isEditable = !baseTime || (Date.now() - new Date(baseTime).getTime() < 60000);
                          return isEditable ? (
                            <Link
                              to="/user/reviews"
                              style={{ background: "#f0fdf4", color: "#166534", border: "1px solid #86efac", padding: "4px 10px", borderRadius: "6px", fontSize: "12px", textDecoration: "none", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                              title="ไปที่หน้ารีวิวของฉันเพื่อแก้ไขคำ"
                            >
                              <i className="fa-solid fa-pen-to-square"></i> แก้ไขรีวิว (ภายใน 1 นาที)
                            </Link>
                          ) : (
                            <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }} title="ครบกำหนด 1 นาทีแล้ว ไม่สามารถแก้ไขคำได้">
                              <i className="fa-solid fa-lock"></i> หมดเวลาแก้ไข
                            </span>
                          );
                        })()
                      )}
                    </div>
                    <p style={{ color: "#4a5568", fontSize: "14px", marginLeft: "54px", lineHeight: 1.6 }}>{rev.comment}</p>
                    
                    {rev.ownerReply && (
                      <div style={{ background: "#f0f7f0", padding: "14px 18px", borderRadius: "10px", marginTop: "12px", marginLeft: "54px", fontSize: "14px", borderLeft: "4px solid #5b8e66" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={rev.ownerReplyPhoto || "/images/default-avatar.jpg"}
                              alt={rev.ownerReplyName || "ผู้ตอบกลับ"}
                              style={{ width: "32px", height: "32px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #a3cca8" }}
                              onError={(e) => { e.target.src = "/images/default-avatar.jpg"; }}
                            />
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <strong style={{ color: "#2e7d32", fontSize: "14px" }}>
                                {rev.ownerReplyName || (rev.ownerReplyRole === "admin" ? "ผู้ดูแลระบบ" : "เจ้าของหอพัก")}
                              </strong>
                              <span style={{
                                background: rev.ownerReplyRole === "admin" ? "#dbeafe" : "#dcfce7",
                                color: rev.ownerReplyRole === "admin" ? "#1e40af" : "#166534",
                                padding: "2px 8px",
                                borderRadius: "12px",
                                fontSize: "11px",
                                fontWeight: 700
                              }}>
                                {rev.ownerReplyRole === "admin" ? "ผู้ดูแลระบบ" : "เจ้าของหอพัก"}
                              </span>
                            </div>
                          </div>

                          {(userRole === "admin" || userRole === "owner") && replyingReviewId !== rev.id && (
                            (() => {
                              const isEditable = !rev.ownerReplyAt || (Date.now() - new Date(rev.ownerReplyAt).getTime() < 60000);
                              return isEditable ? (
                                <button
                                  type="button"
                                  onClick={() => { setReplyingReviewId(rev.id); setReplyText(rev.ownerReply); }}
                                  style={{ background: "none", border: "none", color: "#5b8e66", fontSize: "12px", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                                >
                                  <i className="fa-solid fa-pen-to-square"></i> แก้ไขคำตอบ (ภายใน 1 นาที)
                                </button>
                              ) : (
                                <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }} title="ครบกำหนด 1 นาทีแล้ว ไม่สามารถแก้ไขคำได้">
                                  <i className="fa-solid fa-lock"></i> หมดเวลาแก้ไข
                                </span>
                              );
                            })()
                          )}
                        </div>
                        <p style={{ color: "#2d3748", marginTop: "4px", lineHeight: "1.6" }}>{rev.ownerReply}</p>
                      </div>
                    )}

                    {(userRole === "admin" || userRole === "owner") && !rev.ownerReply && replyingReviewId !== rev.id && (
                      <div style={{ marginLeft: "54px", marginTop: "10px" }}>
                        <button
                          type="button"
                          onClick={() => { setReplyingReviewId(rev.id); setReplyText(""); }}
                          style={{ background: "#eef6ee", color: "#2e7d32", border: "1px solid #5b8e66", padding: "6px 14px", borderRadius: "6px", fontSize: "13px", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <i className="fa-solid fa-reply"></i> ตอบกลับรีวิวนี้
                        </button>
                      </div>
                    )}

                    {(userRole === "admin" || userRole === "owner") && replyingReviewId === rev.id && (
                      <div style={{ marginLeft: "54px", marginTop: "12px", background: "#f8faf7", padding: "14px", borderRadius: "8px", border: "1.5px solid #5b8e66" }}>
                        <label style={{ display: "block", fontSize: "13px", fontWeight: 600, color: "#2d3748", marginBottom: "6px" }}>
                          {userRole === "admin" ? "ตอบกลับในฐานะผู้ดูแลระบบ" : "ตอบกลับในฐานะเจ้าของหอพัก"}
                        </label>
                        <textarea
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          placeholder="พิมพ์ข้อความตอบกลับ..."
                          style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #cbd5e0", fontFamily: "inherit", fontSize: "14px" }}
                        ></textarea>
                        <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                          <button
                            type="button"
                            onClick={() => handleReplySubmit(rev.id)}
                            disabled={replySubmitting}
                            style={{ background: "#5b8e66", color: "#fff", border: "none", padding: "6px 16px", borderRadius: "4px", fontWeight: 600, fontSize: "13px", cursor: "pointer" }}
                          >
                            {replySubmitting ? "กำลังส่ง..." : "บันทึกคำตอบ"}
                          </button>
                          <button
                            type="button"
                            onClick={() => { setReplyingReviewId(null); setReplyText(""); }}
                            style={{ background: "#fff", color: "#4a5568", border: "1px solid #cbd5e0", padding: "6px 14px", borderRadius: "4px", fontSize: "13px", cursor: "pointer" }}
                          >
                            ยกเลิก
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* =====================================================
            RECOMMENDED DORMS GRID SECTION (Matching media_1788883447037.png)
        ===================================================== */}
        <div style={{ marginTop: "40px" }}>
          <h3 style={{ fontSize: "22px", fontWeight: 700, color: "#2d3748", marginBottom: "20px" }}>
            <i className="fa-solid fa-thumbs-up" style={{ color: "#6f9d6a", marginRight: "10px" }}></i>
            หอพักแนะนำอื่นๆ
          </h3>
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: "16px"
          }}>
            {(otherDorms.length > 0 ? otherDorms : DEFAULT_OTHER_DORMS).slice(0, 4).map((item) => (
              <DormCard key={item.id} dorm={item} />
            ))}
          </div>
        </div>

      </div>

      {/* Lightbox Modal (Full Screen View) */}
      {lightboxOpen && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.92)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px"
          }}
        >
          <button
            onClick={() => setLightboxOpen(false)}
            style={{
              position: "absolute",
              top: "20px",
              right: "24px",
              background: "none",
              border: "none",
              color: "#fff",
              fontSize: "36px",
              cursor: "pointer",
              zIndex: 10
            }}
          >
            &times;
          </button>

          <img
            src={dormImages[activeImageIndex]}
            alt="Full size view"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "90vw",
              maxHeight: "85vh",
              objectFit: "contain",
              borderRadius: "8px"
            }}
            onError={(e) => { e.target.src = "/images/banner.jpg"; }}
          />

          {dormImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev - 1 + dormImages.length) % dormImages.length);
                }}
                style={{
                  position: "absolute",
                  left: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  border: "none",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                &#10094;
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev + 1) % dormImages.length);
                }}
                style={{
                  position: "absolute",
                  right: "24px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "rgba(255, 255, 255, 0.2)",
                  color: "#fff",
                  border: "none",
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  fontSize: "24px",
                  cursor: "pointer"
                }}
              >
                &#10095;
              </button>
            </>
          )}
        </div>
      )}

      {/* Booking Modal */}
      {bookingModalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{
            background: "#fff",
            width: "100%",
            maxWidth: "500px",
            borderRadius: "16px",
            padding: "28px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px" }}>
              <h3 style={{ fontSize: "20px", color: "#2d3748", fontWeight: 700 }}>จองห้องพัก: {dorm.name}</h3>
              <button
                onClick={() => setBookingModalOpen(false)}
                style={{ background: "none", border: "none", fontSize: "20px", cursor: "pointer", color: "#a0aec0" }}
              >
                ✕
              </button>
            </div>

            {bookingSuccess ? (
              <div style={{ textAlign: "center", padding: "30px 0", color: "#2e7d32" }}>
                <i className="fa-solid fa-circle-check" style={{ fontSize: "48px", marginBottom: "12px" }}></i>
                <h3>ส่งคำขอจองห้องพักเรียบร้อยแล้ว!</h3>
                <p style={{ color: "#718096", marginTop: "6px" }}>เจ้าของหอจะตรวจสอบและตอบรับการจองของคุณในเร็วๆ นี้ครับ</p>
              </div>
            ) : (
              <form onSubmit={handleBookingSubmit}>
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#4a5568", marginBottom: "6px" }}>
                    ห้องพักที่ต้องการจอง
                  </label>
                  {rooms && rooms.length > 0 ? (
                    <select
                      value={selectedRoom?.id || rooms[0]?.id || ""}
                      onChange={(e) => {
                        const found = rooms.find((r) => String(r.id) === e.target.value);
                        setSelectedRoom(found || null);
                      }}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e0", outline: "none", fontSize: "14px" }}
                    >
                      {rooms.map((rm) => {
                        const isReserved = rm.status === "reserved" || rm.status === "booked";
                        return (
                          <option key={rm.id} value={rm.id} disabled={isReserved}>
                            ห้อง {rm.roomNumber} ({rm.roomType}) - {Number(rm.price).toLocaleString()} บาท/เดือน {isReserved ? "(จองแล้ว)" : "(ว่าง)"}
                          </option>
                        );
                      })}
                    </select>
                  ) : (
                    <input
                      type="text"
                      readOnly
                      value={selectedRoom ? `ห้อง ${selectedRoom.roomNumber} (${selectedRoom.roomType}) - ${selectedRoom.price} บาท/เดือน` : "ห้องมาตรฐาน"}
                      style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #e2e8f0", background: "#f8faf8" }}
                    />
                  )}
                </div>

                <div style={{ marginBottom: "16px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#4a5568", marginBottom: "6px" }}>
                    วันที่ต้องการเข้าพัก <span style={{ color: "#e53e3e" }}>*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingDate}
                    onChange={(e) => setBookingDate(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e0" }}
                  />
                </div>

                <div style={{ marginBottom: "20px" }}>
                  <label style={{ display: "block", fontSize: "14px", fontWeight: 600, color: "#4a5568", marginBottom: "6px" }}>
                    ข้อความถึงเจ้าของหอ (ถ้ามี)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="เช่น สัญญาเช่า 6 เดือน / มีรถยนต์ 1 คัน หรือสอบถามเพิ่มเติม"
                    value={bookingNote}
                    onChange={(e) => setBookingNote(e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px", border: "1px solid #cbd5e0", fontFamily: "inherit" }}
                  ></textarea>
                </div>

                <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                  <button
                    type="button"
                    onClick={() => setBookingModalOpen(false)}
                    style={{ padding: "10px 18px", border: "1px solid #cbd5e0", background: "#fff", color: "#4a5568", borderRadius: "8px", cursor: "pointer" }}
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    disabled={bookingSubmitting}
                    style={{ padding: "10px 22px", border: "none", background: "#5b8e66", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: 600 }}
                  >
                    {bookingSubmitting ? "กำลังส่งคำขอ..." : "ยืนยันการจอง"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
