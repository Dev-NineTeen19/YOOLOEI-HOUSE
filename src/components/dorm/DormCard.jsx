import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { addFavorite, removeFavorite, isFavorite } from "../../services/favoriteService";

export default function DormCard({ dorm }) {
  const { currentUser, userRole } = useAuth();
  const navigate = useNavigate();
  const [favorited, setFavorited] = useState(false);
  const [favLoading, setFavLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;
    const userId = currentUser?.id || currentUser?.uid;
    if (userId && dorm?.id) {
      isFavorite(userId, dorm.id).then((fav) => {
        if (isMounted) setFavorited(fav);
      });
    }
    return () => { isMounted = false; };
  }, [currentUser, dorm?.id]);

  const handleToggleFav = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      navigate("/login");
      return;
    }

    setFavLoading(true);
    try {
      const isFav = await addFavorite(currentUser.id || currentUser.uid, dorm.id);
      setFavorited(isFav);
    } catch (err) {
      console.error("Favorite toggle error:", err);
    } finally {
      setFavLoading(false);
    }
  };

  const displayImage = (dorm.images && dorm.images.length > 0)
    ? dorm.images[0]
    : "/images/dorm-1.jpg";

  const priceText = dorm.priceMin && dorm.priceMax && dorm.priceMin !== dorm.priceMax
    ? `${Number(dorm.priceMin).toLocaleString()} - ${Number(dorm.priceMax).toLocaleString()} บาท/เดือน`
    : `${Number(dorm.priceMin || dorm.price || 3500).toLocaleString()} บาท/เดือน`;

  return (
    <article className="dorm-card">
      <div className="dorm-image" style={{ position: "relative" }}>
        <img
          src={displayImage}
          alt={dorm.name}
          onError={(e) => { e.target.src = "/images/banner.jpg"; }}
        />

        {/* Favorite Icon Button */}
        {userRole === "user" && (
          <button
            className="btn-fav-no-hover"
            onClick={handleToggleFav}
            disabled={favLoading}
            style={{
              position: "absolute",
              top: "12px",
              right: "12px",
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.9)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: favorited ? "#e53935" : "#888",
              boxShadow: "0 2px 6px rgba(0,0,0,0.15)"
            }}
            title={favorited ? "ยกเลิกการบันทึก" : "บันทึกหอพักนี้"}
          >
            <i className={favorited ? "fa-solid fa-heart" : "fa-regular fa-heart"}></i>
          </button>
        )}
      </div>

      <div className="dorm-info">
        <h3>{dorm.name}</h3>

        <div className="location">
          <i className="fa-solid fa-location-dot"></i>
          {dorm.district ? `อำเภอ${dorm.district}` : (dorm.address || "อำเภอเมืองเลย")}
        </div>

        <div className="details">
          <span>
            <i className="fa-solid fa-bed"></i>
            {dorm.bedroomCount || "1"} ห้องนอน
          </span>
          <span>
            <i className="fa-solid fa-bath"></i>
            {dorm.bathroomCount || "1"} ห้องน้ำ
          </span>
        </div>

        <div className="features">
          {dorm.amenities && dorm.amenities.length > 0 ? (
            dorm.amenities.slice(0, 3).map((amenity, index) => (
              <span key={index}>
                <i className={
                  amenity.includes("แอร์") ? "fa-solid fa-snowflake" :
                  amenity.includes("WiFi") ? "fa-solid fa-wifi" :
                  amenity.includes("จอดรถ") ? "fa-solid fa-square-parking" :
                  "fa-solid fa-check"
                }></i>
                {amenity}
              </span>
            ))
          ) : (
            <>
              <span><i className="fa-solid fa-snowflake"></i> แอร์</span>
              <span><i className="fa-solid fa-wifi"></i> WiFi</span>
            </>
          )}
        </div>

        <div className="card-bottom">
          <strong className="card-price">{priceText}</strong>
          <Link to={`/dorms/${dorm.id}`} className="card-bottom-link" style={{ textDecoration: "none", width: "100%", display: "block" }}>
            <button type="button" className="card-bottom-btn" style={{ width: "100%" }}>ดูรายละเอียด</button>
          </Link>
        </div>
      </div>
    </article>
  );
}
