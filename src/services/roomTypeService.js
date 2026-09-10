import { api } from "./apiClient";

const DEFAULT_ROOM_TYPES = [
  { id: "rt-1", name: "รายเดือน", category: "รูปแบบการเช่า", description: "เช่าระยะยาวรายเดือน" },
  { id: "rt-2", name: "รายวัน", category: "รูปแบบการเช่า", description: "เช่าระยะสั้นรายวัน" },
  { id: "rt-3", name: "ห้องแอร์", category: "ประเภทห้อง", description: "ห้องพักติดเครื่องปรับอากาศ" },
  { id: "rt-4", name: "ห้องพัดลม", category: "ประเภทห้อง", description: "ห้องพักแบบพัดลม" },
  { id: "rt-5", name: "ห้องสตูดิโอ", category: "ประเภทห้อง", description: "ห้องสตูดิโอพร้อมเฟอร์นิเจอร์" },
  { id: "rt-6", name: "ห้องชุด", category: "ประเภทห้อง", description: "ห้องชุดแบ่งสัดส่วนกว้างขวาง" }
];

function getStoredRoomTypes() {
  try {
    const raw = localStorage.getItem("yooloei_room_types");
    return raw ? JSON.parse(raw) : DEFAULT_ROOM_TYPES;
  } catch {
    return DEFAULT_ROOM_TYPES;
  }
}

function setStoredRoomTypes(items) {
  try {
    localStorage.setItem("yooloei_room_types", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save room types to localStorage:", e);
  }
}

// 1. ดึงรายการประเภทห้องทั้งหมด
export async function getRoomTypes() {
  try {
    const res = await api.get("/room-types");
    if (Array.isArray(res) && res.length > 0) {
      setStoredRoomTypes(res);
      return res;
    }
    return getStoredRoomTypes();
  } catch (error) {
    console.warn("Using local room types fallback:", error);
    return getStoredRoomTypes();
  }
}

// 2. แอดมินเพิ่มประเภทห้องใหม่
export async function addRoomType(name, category = "ทั่วไป", description = "") {
  try {
    const res = await api.post("/admin/room-types", { name, category, description });
    return res;
  } catch (error) {
    console.warn("API add room type failed, updating localStorage:", error);
    const local = getStoredRoomTypes();
    const newItem = {
      id: `rt-${Date.now()}`,
      name,
      category,
      description
    };
    const updated = [newItem, ...local];
    setStoredRoomTypes(updated);
    return { success: true, roomType: newItem };
  }
}

// 3. แอดมินแก้ไขประเภทห้อง
export async function updateRoomType(id, name, category = "ทั่วไป", description = "") {
  try {
    const res = await api.put(`/admin/room-types/${id}`, { name, category, description });
    return res;
  } catch (error) {
    console.warn("API update room type failed, updating localStorage:", error);
    const local = getStoredRoomTypes();
    const updated = local.map((item) =>
      item.id === id ? { ...item, name, category, description } : item
    );
    setStoredRoomTypes(updated);
    return { success: true };
  }
}

// 4. แอดมินลบประเภทห้อง
export async function deleteRoomType(id) {
  try {
    const res = await api.delete(`/admin/room-types/${id}`);
    return res;
  } catch (error) {
    console.warn("API delete room type failed, updating localStorage:", error);
    const local = getStoredRoomTypes();
    const updated = local.filter((item) => item.id !== id);
    setStoredRoomTypes(updated);
    return { success: true };
  }
}
