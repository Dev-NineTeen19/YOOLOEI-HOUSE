import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getAllReviewsAdmin, deleteReview, replyToReview } from "../../services/reviewService";

export default function AdminReviews() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reply State
  const [replyingId, setReplyingId] = useState(null);
  const [replyText, setReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);

  const loadReviews = async () => {
    setLoading(true);
    try {
      const data = await getAllReviewsAdmin();
      setReviews(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("คุณต้องการลบรีวิวนี้ใช่หรือไม่?")) {
      try {
        await deleteReview(id);
        loadReviews();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleStartReply = (r) => {
    setReplyingId(r.id);
    setReplyText(r.ownerReply || "");
  };

  const handleCancelReply = () => {
    setReplyingId(null);
    setReplyText("");
  };

  const handleSendReply = async (reviewId) => {
    if (!replyText.trim()) return;
    setSubmittingReply(true);
    try {
      await replyToReview(reviewId, replyText.trim());
      setReviews((prev) =>
        prev.map((r) => (r.id === reviewId ? { ...r, ownerReply: replyText.trim(), ownerReplyAt: new Date().toISOString() } : r))
      );
      setReplyingId(null);
      setReplyText("");
    } catch (err) {
      console.error(err);
      const msg = err?.error || err?.message || "ไม่สามารถบันทึกการตอบกลับได้";
      alert(msg);
    } finally {
      setSubmittingReply(false);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>รีวิวจากผู้เช่า</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>ตรวจสอบความคิดเห็น และสามารถตอบกลับผู้เช่าหรือกดดูหน้ารายละเอียดหอพักได้ทันที</p>
      </div>

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดรีวิว...
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
              ยังไม่มีรีวิวในระบบ
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>ผู้รีวิว</th>
                    <th>หอพัก</th>
                    <th>คะแนน</th>
                    <th>ความคิดเห็น</th>
                    <th>การตอบกลับ</th>
                    <th>จัดการ</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((r) => {
                    const avatarSrc = r.userPhoto || "/images/default-avatar.jpg";

                    return (
                      <tr key={r.id}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <img
                              src={avatarSrc}
                              alt={r.userName || "ผู้รีวิว"}
                              style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover", border: "1.5px solid #e0e0e0", backgroundColor: "#f5f5f5" }}
                              onError={(e) => {
                                e.target.src = "/images/default-avatar.jpg";
                              }}
                            />
                            <div>
                              <strong style={{ color: "#333", display: "block" }}>{r.userName || "ผู้ใช้"}</strong>
                              <span style={{ fontSize: "11px", color: "#888" }}>ผู้เช่า</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          <Link
                            to={`/dorms/${r.dormitoryId}`}
                            style={{ color: "#7da27c", fontWeight: 600, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            title="คลิกเพื่อเปิดดูหน้าหอพักนี้"
                          >
                            <span>{r.dormitoryName || "ดูหอพัก"}</span>
                            <i className="fa-solid fa-arrow-up-right-from-square" style={{ fontSize: "11px" }}></i>
                          </Link>
                        </td>
                        <td style={{ color: "#f39c12", whiteSpace: "nowrap" }}>{"⭐".repeat(r.rating || 5)}</td>
                        <td style={{ maxWidth: "240px", wordBreak: "break-word" }}>{r.comment}</td>
                        <td style={{ minWidth: "220px" }}>
                          {replyingId === r.id ? (
                            <div style={{ background: "#f8faf7", padding: "10px", borderRadius: "6px", border: "1px solid #7da27c" }}>
                              <textarea
                                rows={2}
                                value={replyText}
                                onChange={(e) => setReplyText(e.target.value)}
                                placeholder="พิมพ์ข้อความตอบกลับ..."
                                style={{ width: "100%", padding: "6px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px", fontFamily: "inherit" }}
                              ></textarea>
                              <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>
                                <button
                                  type="button"
                                  onClick={() => handleSendReply(r.id)}
                                  disabled={submittingReply}
                                  style={{ background: "#7da27c", color: "#fff", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: 600 }}
                                >
                                  {submittingReply ? "กำลังบันทึก..." : "บันทึก"}
                                </button>
                                <button
                                  type="button"
                                  onClick={handleCancelReply}
                                  style={{ background: "#eee", color: "#333", border: "none", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer" }}
                                >
                                  ยกเลิก
                                </button>
                              </div>
                            </div>
                          ) : r.ownerReply ? (
                            <div style={{ background: "#eef6ee", padding: "10px 14px", borderRadius: "8px", fontSize: "13px" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", flexWrap: "wrap", gap: "6px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <img
                                    src={r.ownerReplyPhoto || "/images/default-avatar.jpg"}
                                    alt={r.ownerReplyName || "ผู้ตอบกลับ"}
                                    style={{ width: "26px", height: "26px", borderRadius: "50%", objectFit: "cover", border: "1px solid #7da27c" }}
                                    onError={(e) => { e.target.src = "/images/default-avatar.jpg"; }}
                                  />
                                  <div>
                                    <strong style={{ color: "#2e7d32", fontSize: "12px", display: "block" }}>
                                      {r.ownerReplyName || (r.ownerReplyRole === "admin" ? "ผู้ดูแลระบบ" : "เจ้าของหอพัก")}
                                    </strong>
                                  </div>
                                </div>
                                {(() => {
                                  const isEditable = !r.ownerReplyAt || (Date.now() - new Date(r.ownerReplyAt).getTime() < 60000);
                                  return isEditable ? (
                                    <button
                                      type="button"
                                      onClick={() => handleStartReply(r)}
                                      style={{ background: "none", border: "none", color: "#7da27c", fontSize: "12px", cursor: "pointer", padding: 0, fontWeight: 600 }}
                                      title="แก้ไขข้อความตอบกลับ"
                                    >
                                      <i className="fa-solid fa-pen-to-square"></i> แก้ไข (ภายใน 1 นาที)
                                    </button>
                                  ) : (
                                    <span style={{ fontSize: "11px", color: "#94a3b8" }} title="ครบกำหนด 1 นาทีแล้ว ไม่สามารถแก้ไขคำได้">
                                      <i className="fa-solid fa-lock"></i> หมดเวลาแก้ไข
                                    </span>
                                  );
                                })()}
                              </div>
                              <p style={{ color: "#444", marginTop: "2px", margin: 0, lineHeight: 1.5 }}>{r.ownerReply}</p>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleStartReply(r)}
                              style={{ background: "#eef6ee", color: "#2e7d32", border: "1px solid #7da27c", padding: "4px 10px", borderRadius: "4px", fontSize: "12px", cursor: "pointer", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <i className="fa-solid fa-reply"></i> ตอบกลับ
                            </button>
                          )}
                        </td>
                        <td>
                          <div className="btn-action-group">
                            <button
                              type="button"
                              className="btn-icon"
                              onClick={() => handleStartReply(r)}
                              title="ตอบกลับรีวิว"
                              style={{ color: "#2e7d32" }}
                            >
                              <i className="fa-solid fa-reply"></i>
                            </button>
                            <Link
                              to={`/dorms/${r.dormitoryId}`}
                              className="btn-icon"
                              title="ดูหน้าหอพักนี้"
                            >
                              <i className="fa-solid fa-eye"></i>
                            </Link>
                            <button
                              type="button"
                              className="btn-icon delete"
                              onClick={() => handleDelete(r.id)}
                              title="ลบรีวิว"
                            >
                              <i className="fa-solid fa-trash-can"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
