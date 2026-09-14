import { supabase } from "../supabase/config";

const FALLBACK_REVIEWS = [
  {
    id: "rev-1",
    dormitoryId: "sample-1",
    rating: 5,
    comment: "ห้องสะอาด บรรยากาศดี",
    subtext: "ใกล้มหาวิทยาลัย เดินทางสะดวก",
    userName: "นายซีเอล",
    userPhoto: "/images/default-avatar.jpg",
    createdAt: "เมื่อวาน"
  },
  {
    id: "rev-2",
    dormitoryId: "sample-2",
    rating: 5,
    comment: "เจ้าของดูแลดีมาก",
    subtext: "มีสิ่งอำนวยความสะดวกครบถ้วน",
    userName: "นายดื้อ",
    userPhoto: "/images/default-avatar.jpg",
    createdAt: "2 วันที่แล้ว"
  }
];

function mapReviewFields(r) {
  if (!r) return null;
  return {
    id: r.id,
    userId: r.user_id || r.userId,
    userName: r.user_name || r.userName,
    userPhoto: r.user_photo || r.userPhoto || "/images/default-avatar.jpg",
    dormitoryId: r.dormitory_id || r.dormitoryId,
    dormitoryName: r.dormitory_name || r.dormitoryName || "หอพัก",
    rating: Number(r.rating || 5),
    comment: r.comment || "",
    ownerReply: r.owner_reply || r.ownerReply || "",
    ownerReplyName: r.owner_reply_name || r.ownerReplyName || "",
    ownerReplyPhoto: r.owner_reply_photo || r.ownerReplyPhoto || "",
    ownerReplyRole: r.owner_reply_role || r.ownerReplyRole || "",
    ownerReplyAt: r.owner_reply_at || r.ownerReplyAt || "",
    createdAt: r.created_at || r.createdAt,
    updatedAt: r.updated_at || r.updatedAt
  };
}

// 1. ดึงรีวิวของหอพักจาก Supabase
export async function getReviewsByDormitory(dormitoryId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("dormitory_id", dormitoryId)
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) return [];
    return data.map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching reviews from Supabase:", error);
    return [];
  }
}

// 2. ดึงรีวิวของผู้เช่าจาก Supabase
export async function getReviewsByUser(userId) {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching user reviews from Supabase:", error);
    return [];
  }
}

// 3. เขียนรีวิวใหม่ใน Supabase
export async function createReview({ userId, userName, userPhoto, dormitoryId, rating, comment }) {
  const newId = `review_${Date.now()}`;
  const payload = {
    id: newId,
    user_id: userId || "",
    user_name: userName || "ผู้ใช้งาน",
    user_photo: userPhoto || "/images/default-avatar.jpg",
    dormitory_id: dormitoryId,
    rating: Number(rating) || 5,
    comment,
    created_at: new Date().toISOString()
  };

  const { data: created, error } = await supabase
    .from("reviews")
    .insert([payload])
    .select();

  if (error) console.error("createReview Supabase error:", error);
  return created?.[0]?.id || newId;
}

// 4. เจ้าของหอพักตอบกลับรีวิวใน Supabase
export async function replyToReview(reviewId, ownerReply) {
  const { data: updated, error } = await supabase
    .from("reviews")
    .update({
      owner_reply: ownerReply,
      owner_reply_at: new Date().toISOString()
    })
    .eq("id", reviewId)
    .select();

  if (error) console.error("replyToReview Supabase error:", error);
  return mapReviewFields(updated?.[0] || { id: reviewId, ownerReply });
}

// 5. ผู้เช่าแก้ไขรีวิวของตนเองใน Supabase
export async function updateReview(reviewId, comment, rating) {
  const { data: updated, error } = await supabase
    .from("reviews")
    .update({
      comment,
      rating: Number(rating) || 5,
      updated_at: new Date().toISOString()
    })
    .eq("id", reviewId)
    .select();

  if (error) console.error("updateReview Supabase error:", error);
  return mapReviewFields(updated?.[0] || { id: reviewId, comment, rating });
}

// 6. ลบรีวิวใน Supabase
export async function deleteReview(reviewId) {
  const { error } = await supabase
    .from("reviews")
    .delete()
    .eq("id", reviewId);

  if (error) console.error("deleteReview Supabase error:", error);
  return true;
}

// 7. ดึงรีวิวทั้งหมด (Admin) จาก Supabase
export async function getAllReviewsAdmin() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return FALLBACK_REVIEWS.map(mapReviewFields);
    return data.map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching all reviews from Supabase:", error);
    return FALLBACK_REVIEWS.map(mapReviewFields);
  }
}

// 8. ดึงรีวิวล่าสุด (Public - หน้าแรก) จาก Supabase
export async function getLatestReviews() {
  try {
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(4);

    if (error || !data || data.length === 0) {
      return FALLBACK_REVIEWS.map(mapReviewFields);
    }
    return data.map(mapReviewFields);
  } catch (error) {
    console.error("Error fetching latest reviews from Supabase:", error);
    return FALLBACK_REVIEWS.map(mapReviewFields);
  }
}
