import { api } from "./apiClient";

// 1. สร้างคำขอจองห้องพัก (User ทำได้ตลอดเวลา)
export async function createBooking(data) {
  const res = await api.post("/bookings", {
    dormitoryId: data.dormitoryId,
    dormitoryName: data.dormitoryName,
    ownerId: data.ownerId,
    roomId: data.roomId || null,
    roomNumber: data.roomNumber || "ห้องมาตรฐาน",
    bookingDate: data.bookingDate,
    note: data.note || "",
    userName: data.userName,
    userPhone: data.userPhone
  });
  return res.booking?.id;
}

// 2. ดึงประวัติการจองของผู้เช่า
export async function getBookingsByUser(userId) {
  try {
    const res = await api.get("/bookings", { userId });
    return (res.bookings || []).map(mapBookingFields);
  } catch (error) {
    console.error("Error fetching user bookings:", error);
    return [];
  }
}

// 3. ดึงคำขอจองของเจ้าของหอพัก
export async function getBookingsByOwner(ownerId) {
  try {
    const res = await api.get("/bookings", { ownerId });
    return (res.bookings || []).map(mapBookingFields);
  } catch (error) {
    console.error("Error fetching owner bookings:", error);
    return [];
  }
}

// 4. ดึงการจองทั้งหมด (Admin)
export async function getAllBookingsAdmin() {
  try {
    const res = await api.get("/bookings");
    return (res.bookings || []).map(mapBookingFields);
  } catch (error) {
    console.error("Error fetching all bookings:", error);
    return [];
  }
}

// 5. เจ้าของหอพักอนุมัติ / ปฏิเสธการจอง (ทำได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!)
export async function updateBookingStatus(bookingId, status) {
  const res = await api.put(`/bookings/${bookingId}/status`, { status });
  return res.booking;
}

// 6. ผู้เช่ายกเลิกการจอง
export async function cancelBooking(bookingId) {
  const res = await api.put(`/bookings/${bookingId}/status`, { status: "cancelled" });
  return res.booking;
}

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
    dormitoryName: b.dormitory_name || b.dormitoryName,
    roomId: b.room_id || b.roomId,
    roomNumber: b.room_number || b.roomNumber,
    bookingDate: b.booking_date || b.bookingDate,
    note: b.note,
    status: b.status,
    createdAt: b.created_at || b.createdAt,
    updatedAt: b.updated_at || b.updatedAt
  };
}
