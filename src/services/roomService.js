import { supabase } from "../supabase/config";

function mapRoomFields(r) {
  if (!r) return null;
  return {
    id: r.id,
    dormitoryId: r.dormitory_id || r.dormitoryId,
    ownerId: r.owner_id || r.ownerId,
    roomNumber: r.room_number || r.roomNumber,
    roomType: r.room_type || r.roomType,
    price: Number(r.price || 0),
    status: r.status || "available",
    createdAt: r.created_at || r.createdAt
  };
}

// 1. ดึงห้องพักตามหอพักจาก Supabase
export async function getRoomsByDormitory(dormitoryId) {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("dormitory_id", dormitoryId);

    if (error || !data) return [];
    return data.map(mapRoomFields);
  } catch (error) {
    console.error("Error fetching rooms by dormitory from Supabase:", error);
    return [];
  }
}

// 2. ดึงห้องพักของ Owner จาก Supabase
export async function getRoomsByOwner(ownerId) {
  try {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("owner_id", ownerId);

    if (error || !data) return [];
    return data.map(mapRoomFields);
  } catch (error) {
    console.error("Error fetching rooms by owner from Supabase:", error);
    return [];
  }
}

// 3. เพิ่มห้องพักใหม่ใน Supabase
export async function createRoom(data) {
  const newId = `room_${Date.now()}`;
  const payload = {
    id: newId,
    dormitory_id: data.dormitoryId,
    owner_id: data.ownerId || "",
    room_number: data.roomNumber,
    room_type: data.roomType,
    price: Number(data.price) || 0,
    status: data.status || "available",
    created_at: new Date().toISOString()
  };

  const { data: created, error } = await supabase
    .from("rooms")
    .insert([payload])
    .select();

  if (error) console.error("createRoom Supabase error:", error);
  return created?.[0]?.id || newId;
}

// 4. แก้ไขห้องพักใน Supabase
export async function updateRoom(roomId, data) {
  const updatePayload = {
    room_number: data.roomNumber,
    room_type: data.roomType,
    price: data.price !== undefined ? Number(data.price) : undefined,
    status: data.status,
    updated_at: new Date().toISOString()
  };

  Object.keys(updatePayload).forEach((k) => {
    if (updatePayload[k] === undefined) delete updatePayload[k];
  });

  const { data: updated, error } = await supabase
    .from("rooms")
    .update(updatePayload)
    .eq("id", roomId)
    .select();

  if (error) console.error("updateRoom Supabase error:", error);
  return mapRoomFields(updated?.[0] || { id: roomId, ...data });
}

// 5. ปรับสถานะห้องพัก (available / reserved / occupied)
export async function updateRoomStatus(roomId, status) {
  return updateRoom(roomId, { status });
}

// 6. ลบห้องพักใน Supabase
export async function deleteRoom(roomId) {
  const { error } = await supabase
    .from("rooms")
    .delete()
    .eq("id", roomId);

  if (error) console.error("deleteRoom Supabase error:", error);
  return true;
}
