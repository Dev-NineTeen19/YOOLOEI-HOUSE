import { api } from "./apiClient";

// 1. ดึงห้องพักตามหอพัก
export async function getRoomsByDormitory(dormitoryId) {
  try {
    const res = await api.get(`/rooms/dormitory/${dormitoryId}`);
    return (res.rooms || []).map(mapRoomFields);
  } catch (error) {
    console.error("Error fetching rooms by dormitory:", error);
    return [];
  }
}

// 2. ดึงห้องพักของ Owner
export async function getRoomsByOwner(ownerId) {
  try {
    // ดึงห้องพักผ่านหอพักของเจ้าของ
    const dormsRes = await api.get(`/dormitories/owner/${ownerId}`);
    const dorms = dormsRes.dormitories || [];
    let allRooms = [];
    for (const d of dorms) {
      const roomsRes = await api.get(`/rooms/dormitory/${d.id}`);
      allRooms = allRooms.concat(roomsRes.rooms || []);
    }
    return allRooms.map(mapRoomFields);
  } catch (error) {
    console.error("Error fetching rooms by owner:", error);
    return [];
  }
}

// 3. เพิ่มห้องพัก (เจ้าของเพิ่มได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!)
export async function createRoom(data) {
  const res = await api.post("/rooms", {
    dormitoryId: data.dormitoryId,
    roomNumber: data.roomNumber,
    roomType: data.roomType,
    price: Number(data.price) || 0,
    status: data.status || "available"
  });
  return res.room?.id;
}

// 4. แก้ไขห้องพัก (เจ้าของแก้ไขได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!)
export async function updateRoom(roomId, data) {
  const res = await api.put(`/rooms/${roomId}`, {
    roomNumber: data.roomNumber,
    roomType: data.roomType,
    price: data.price !== undefined ? Number(data.price) : undefined,
    status: data.status
  });
  return res.room;
}

// 5. ปรับสถานะห้องพัก (available / reserved / occupied)
export async function updateRoomStatus(roomId, status) {
  return updateRoom(roomId, { status });
}

// 6. ลบห้องพัก
export async function deleteRoom(roomId) {
  return await api.delete(`/rooms/${roomId}`);
}

function mapRoomFields(r) {
  if (!r) return null;
  return {
    id: r.id,
    dormitoryId: r.dormitory_id || r.dormitoryId,
    ownerId: r.owner_id || r.ownerId,
    roomNumber: r.room_number || r.roomNumber,
    roomType: r.room_type || r.roomType,
    price: r.price,
    status: r.status,
    createdAt: r.created_at || r.createdAt
  };
}
