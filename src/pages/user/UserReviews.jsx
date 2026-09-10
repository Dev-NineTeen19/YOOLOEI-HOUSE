import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getReviewsByUser, deleteReview, updateReview } from "../../services/reviewService";

export default function UserReviews() {
  const { currentUser } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit Review Modal
  const [editingReview, setEditingReview] = useState(null);
  const [editRating, setEditRating] = useState(5);
  const [editComment, setEditComment] = useState("");
  const [saving, setSaving] = useState(false);

  const loadReviews = async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const userId = currentUser.id || currentUser.uid;
      const data = await getReviewsByUser(userId);
      setReviews(data);
    } catch (err) {
      console.error("Error loading user reviews:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [currentUser]);

  const handleDelete = async (reviewId) => {
    if (window.confirm("คุณแน่ใจหรือไม่ว่าต้องการลบรีวิวนี้?")) {
      try {
        await deleteReview(reviewId);
        setReviews((prev) => prev.filter((r) => r.id !== reviewId));
      } catch (err) {
        console.error("Error deleting review:", err);
        alert("ไม่สามารถลบรีวิวได้");
      }
    }
  };

  const handleOpenEdit = (review) => {
    const baseTime = review.createdAt || review.updatedAt;
    if (baseTime && (Date.now() - new Date(baseTime).getTime() > 60000)) {
      alert("หมดเวลาสำหรับการแก้ไขรีวิวแล้ว (สามารถแก้ไขได้ภายใน 1 นาทีหลังเขียนรีวิวเท่านั้น)");
      return;
    }
    setEditingReview(review);
    setEditRating(review.rating || 5);
    setEditComment(review.comment || "");
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingReview) return;

    const baseTime = editingReview.createdAt || editingReview.updatedAt;
    if (baseTime && (Date.now() - new Date(baseTime).getTime() > 60000)) {
      alert("หมดเวลาสำหรับการแก้ไขรีวิวแล้ว (สามารถแก้ไขได้ภายใน 1 นาทีหลังเขียนรีวิวเท่านั้น)");
      setEditingReview(null);
      return;
    }

    setSaving(true);
    try {
      await updateReview(editingReview.id, editComment, editRating);
      setEditingReview(null);
      loadReviews();
    } catch (err) {
      console.error("Error updating review:", err);
      const msg = err?.error || err?.message || "ไม่สามารถแก้ไขรีวิวได้";
      alert(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>รีวิวของฉัน</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ดูและจัดการรีวิวหอพักที่คุณเคยเขียนไว้ (สามารถแก้ไขได้ภายใน 1 นาทีหลังสร้าง)</p>
      </div>

      <div className="content-card">
        <div className="content-card-body">
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px" }}></i> กำลังโหลดรีวิว...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-regular fa-comment-dots" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
              <h3 style={{ color: "#555" }}>คุณยังไม่ได้เขียนรีวิวหอพักใดๆ</h3>
              <p style={{ color: "#888", marginTop: "8px", marginBottom: "20px" }}>
                ร่วมแบ่งปันประสบการณ์การพักอาศัยของคุณในหน้ารายละเอียดของหอพักได้
              </p>
              <Link to="/dorms" style={{ textDecoration: "none" }}>
                <button className="btn-primary-action">
                  <i className="fa-solid fa-magnifying-glass"></i> ค้นหาหอพักเพื่อรีวิว
                </button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {reviews.map((rev) => (
                <div key={rev.id} style={{
                  border: "1px solid #e5e9e3",
                  borderRadius: "8px",
                  padding: "18px 22px",
                  background: "#fcfdfb"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "10px", flexWrap: "wrap", gap: "8px" }}>
                    <div>
                      <span style={{ color: "#f39c12", fontSize: "16px" }}>{"⭐".repeat(rev.rating || 5)}</span>
                      <span style={{ marginLeft: "8px", color: "#888", fontSize: "13px" }}>
                        ({rev.rating} / 5 คะแนน)
                      </span>
                    </div>
                    <div className="btn-action-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      {(() => {
                        const baseTime = rev.createdAt || rev.updatedAt;
                        const isEditable = !baseTime || (Date.now() - new Date(baseTime).getTime() < 60000);
                        return isEditable ? (
                          <button
                            className="btn-icon"
                            onClick={() => handleOpenEdit(rev)}
                            title="แก้ไขรีวิว (ภายใน 1 นาที)"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                        ) : (
                          <span style={{ fontSize: "12px", color: "#94a3b8", fontWeight: 500 }} title="ครบกำหนด 1 นาทีแล้ว ไม่สามารถแก้ไขคำได้">
                            <i className="fa-solid fa-lock"></i> หมดเวลาแก้ไข
                          </span>
                        );
                      })()}
                      <button
                        className="btn-icon delete"
                        onClick={() => handleDelete(rev.id)}
                        title="ลบรีวิว"
                      >
                        <i className="fa-solid fa-trash-can"></i>
                      </button>
                    </div>
                  </div>

                  <p style={{ color: "#444", fontSize: "15px", lineHeight: "1.6" }}>
                    {rev.comment}
                  </p>

                  {rev.ownerReply && (
                    <div style={{
                      background: "#eef6ee",
                      padding: "10px 14px",
                      borderRadius: "6px",
                      marginTop: "12px",
                      fontSize: "13px"
                    }}>
                      <strong style={{ color: "#7da27c" }}>การตอบกลับจากเจ้าของหอพัก:</strong>
                      <p style={{ color: "#555", marginTop: "2px" }}>{rev.ownerReply}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Review Modal */}
      {editingReview && (
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
            borderRadius: "12px",
            padding: "24px",
            boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
          }}>
            <h3 style={{ fontSize: "18px", marginBottom: "16px" }}>แก้ไขรีวิว</h3>
            <form onSubmit={handleSaveEdit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>คะแนน</label>
                <select
                  value={editRating}
                  onChange={(e) => setEditRating(Number(e.target.value))}
                  style={{ width: "100%", padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value={5}>⭐⭐⭐⭐⭐ (5 ดาว)</option>
                  <option value={4}>⭐⭐⭐⭐ (4 ดาว)</option>
                  <option value={3}>⭐⭐⭐ (3 ดาว)</option>
                  <option value={2}>⭐⭐ (2 ดาว)</option>
                  <option value={1}>⭐ (1 ดาว)</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>ความคิดเห็น</label>
                <textarea
                  rows={4}
                  value={editComment}
                  onChange={(e) => setEditComment(e.target.value)}
                  required
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #ccc", fontFamily: "inherit" }}
                ></textarea>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setEditingReview(null)}
                  style={{ padding: "8px 16px", border: "1px solid #ccc", background: "#fff", borderRadius: "6px", cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary-action"
                  style={{ padding: "8px 18px" }}
                >
                  {saving ? "กำลังบันทึก..." : "บันทึก"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
