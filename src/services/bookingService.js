import { supabase } from "../supabase/config";

function mapBookingFields(b) {
  if (!b) return null;
  return {
    id: b.id,
    userId: b.user_id || b.userId,
    userEmail: b.user_email || b.userEmail,
    userName: b.user_name || b.userName,
    userPhone: b.user_phone || b.userPhone,
    ownerId: b.owner_id || b.ownerId,
    dormitoryId: b.dormitory_id || b.dormitoryId,
    dormitoryName: b.dormitory_name || b.dormitoryName || "หอพัก",
    roomId: b.room_id || b.roomId,
    roomNumber: b.room_number || b.roomNumber || "ห้องมาตรฐาน",
    bookingDate: b.booking_date || b.bookingDate,
    note: b.note || "",
    status: b.status || "pending",
    createdAt: b.created_at || b.createdAt,
    updatedAt: b.updated_at || b.updatedAt
  };
}

// 1. สร้างคำขอจองห้องพักใน Supabase
export async function createBooking(data) {
  const newId = `booking_${Date.now()}`;
  const payload = {
    id: newId,
    user_id: data.userId || "",
    user_name: data.userName,
    user_phone: data.userPhone,
    dormitory_id: data.dormitoryId,
    dormitory_name: data.dormitoryName,
    owner_id: data.ownerId,
    room_id: data.roomId || null,
    room_number: data.roomNumber || "ห้องมาตรฐาน",
    booking_date: data.bookingDate,
    note: data.note || "",
    status: "pending",
    created_at: new Date().toISOString()
  };

  const { data: created, error } = await supabase
    .from("bookings")
    .insert([payload])
    .select();

  if (error) console.error("createBooking Supabase error:", error);
  return created?.[0]?.id || newId;
}

// 2. ดึงประวัติการจองของผู้เช่าจาก Supabase
export async function getBookingsByUser(userId) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapBookingFields);
  } catch (error) {
    console.error("Error fetching user bookings from Supabase:", error);
    return [];
  }
}

// 3. ดึงคำขอจองของเจ้าของหอพักจาก Supabase
export async function getBookingsByOwner(ownerId) {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapBookingFields);
  } catch (error) {
    console.error("Error fetching owner bookings from Supabase:", error);
    return [];
  }
}

// 4. ดึงการจองทั้งหมด (Admin) จาก Supabase
export async function getAllBookingsAdmin() {
  try {
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];
    return data.map(mapBookingFields);
  } catch (error) {
    console.error("Error fetching all bookings for admin from Supabase:", error);
    return [];
  }
}

// 5. เจ้าของหอพักอนุมัติ / ปฏิเสธการจองใน Supabase
export async function updateBookingStatus(bookingId, status) {
  const { data: updated, error } = await supabase
    .from("bookings")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .select();

  if (error) console.error("updateBookingStatus Supabase error:", error);
  return mapBookingFields(updated?.[0] || { id: bookingId, status });
}

// 6. ผู้เช่ายกเลิกการจองใน Supabase
export async function cancelBooking(bookingId) {
  return updateBookingStatus(bookingId, "cancelled");
}
