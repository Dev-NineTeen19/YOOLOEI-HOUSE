import { api } from "./apiClient";

// 1. ดึงรีวิวของหอพัก
export async function getReviewsByDormitory(dormitoryId) {
  try {
    const res = await api.get(`/reviews/dormitory/${dormitoryId}`);
    return (res.reviews || []).map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return [];
  }
}

// 2. ดึงรีวิวของผู้เช่า
export async function getReviewsByUser(userId) {
  try {
    const res = await api.get("/reviews");
    return (res.reviews || []).filter((r) => r.user_id === userId).map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching user reviews:", error);
    return [];
  }
}

// 3. เขียนรีวิวใหม่ (User ทำได้ตลอดเวลา)
export async function createReview({ userId, userName, userPhoto, dormitoryId, rating, comment }) {
  const res = await api.post("/reviews", {
    dormitoryId,
    rating: Number(rating) || 5,
    comment,
    userName,
    userPhoto
  });
  return res.review?.id;
}

// 4. เจ้าของหอพักตอบกลับรีวิว (ทำได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!)
export async function replyToReview(reviewId, ownerReply) {
  const res = await api.put(`/reviews/${reviewId}/reply`, { reply: ownerReply });
  return res.review;
}

// 5. ผู้เช่าแก้ไขรีวิวของตนเอง (ทำได้ภายใน 1 นาทีเท่านั้น)
export async function updateReview(reviewId, comment, rating) {
  const res = await api.put(`/reviews/${reviewId}`, { comment, rating });
  return res.review;
}

// 6. ลบรีวิว
export async function deleteReview(reviewId) {
  return await api.delete(`/reviews/${reviewId}`);
}

// 7. ดึงรีวิวทั้งหมด (Admin)
export async function getAllReviewsAdmin() {
  try {
    const res = await api.get("/reviews");
    return (res.reviews || []).map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching all reviews:", error);
    return [];
  }
}

// 8. ดึงรีวิวล่าสุด (Public - หน้าแรก)
export async function getLatestReviews() {
  try {
    const res = await api.get("/reviews/latest");
    return (res.reviews || []).map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching latest reviews:", error);
    return [];
  }
}

function mapReviewFields(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id || r.userId,
    userName: r.user_name || r.userName,
    userPhoto: r.user_photo || r.userPhoto,
    dormitoryId: r.dormitory_id || r.dormitoryId,
    dormitoryName: r.dormitory_name || r.dormitoryName || "หอพัก",
    rating: r.rating,
    comment: r.comment,
    ownerReply: r.owner_reply || r.ownerReply,
    ownerReplyName: r.owner_reply_name || r.ownerReplyName,
    ownerReplyPhoto: r.owner_reply_photo || r.ownerReplyPhoto,
    ownerReplyRole: r.owner_reply_role || r.ownerReplyRole,
    ownerReplyAt: r.owner_reply_at || r.ownerReplyAt,
    createdAt: r.created_at || r.createdAt,
    updatedAt: r.updated_at || r.updatedAt
  };
}
