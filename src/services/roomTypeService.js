import { supabase } from "../supabase/config";

const DEFAULT_ROOM_TYPES = [
  { id: "rt-1", name: "รายเดือน", category: "รูปแบบการเช่า", description: "เช่าระยะยาวรายเดือน" },
  { id: "rt-2", name: "รายวัน", category: "รูปแบบการเช่า", description: "เช่าระยะสั้นรายวัน" },
  { id: "rt-3", name: "ห้องแอร์", category: "ประเภทห้อง", description: "ห้องพักติดเครื่องปรับอากาศ" },
  { id: "rt-4", name: "ห้องพัดลม", category: "ประเภทห้อง", description: "ห้องพักแบบพัดลม" },
  { id: "rt-5", name: "ห้องสตูดิโอ", category: "ประเภทห้อง", description: "ห้องสตูดิโอพร้อมเฟอร์นิเจอร์" },
  { id: "rt-6", name: "ห้องชุด", category: "ประเภทห้อง", description: "ห้องชุดแบ่งสัดส่วนกว้างขวาง" }
];

// 1. ดึงรายการประเภทห้องทั้งหมดจาก Supabase
export async function getRoomTypes() {
  try {
    const { data, error } = await supabase
      .from("room_types")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_ROOM_TYPES;
    }
    return data;
  } catch (error) {
    console.warn("Using default room types fallback:", error);
    return DEFAULT_ROOM_TYPES;
  }
}

// 2. แอดมินเพิ่มประเภทห้องใหม่ใน Supabase
export async function addRoomType(name, category = "ทั่วไป", description = "") {
  try {
    const newId = `rt_${Date.now()}`;
    const payload = { id: newId, name, category, description, created_at: new Date().toISOString() };
    const { data, error } = await supabase
      .from("room_types")
      .insert([payload])
      .select();

    if (error) console.error("addRoomType Supabase error:", error);
    return { success: true, roomType: data?.[0] || payload };
  } catch (error) {
    console.error("Error adding room type in Supabase:", error);
    throw error;
  }
}

// 3. แอดมินแก้ไขประเภทห้องใน Supabase
export async function updateRoomType(id, name, category = "ทั่วไป", description = "") {
  try {
    const { data, error } = await supabase
      .from("room_types")
      .update({ name, category, description, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) console.error("updateRoomType Supabase error:", error);
    return { success: true, roomType: data?.[0] || { id, name, category, description } };
  } catch (error) {
    console.error("Error updating room type in Supabase:", error);
    throw error;
  }
}

// 4. แอดมินลบประเภทห้องใน Supabase
export async function deleteRoomType(id) {
  try {
    const { error } = await supabase
      .from("room_types")
      .delete()
      .eq("id", id);

    if (error) console.error("deleteRoomType Supabase error:", error);
    return { success: true };
  } catch (error) {
    console.error("Error deleting room type in Supabase:", error);
    throw error;
  }
}
