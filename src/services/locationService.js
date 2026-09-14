import { api } from "./apiClient";

const DEFAULT_LOCATIONS = [
  { id: "loc-1", name: "กำเนิดเพชร", description: "ใกล้ มรภ.เลย" },
  { id: "loc-2", name: "เชียงคาน", description: "แหล่งท่องเที่ยว" },
  { id: "loc-3", name: "ราชภัฏเลย", description: "โซนสถานศึกษา" },
  { id: "loc-4", name: "โรงพยาบาลเลย", description: "ศูนย์การแพทย์" },
  { id: "loc-5", name: "โรงเรียนเลยพิท", description: "สถานศึกษา" },
  { id: "loc-6", name: "เมืองเลย", description: "ศูนย์กลางเมือง" },
  { id: "loc-7", name: "นาอาน", description: "ชุมชนที่อยู่อาศัย" },
  { id: "loc-8", name: "กุดป่อง", description: "ใกล้มหาวิทยาลัย" }
];

function getStoredLocations() {
  try {
    const raw = localStorage.getItem("yooloei_locations");
    return raw ? JSON.parse(raw) : DEFAULT_LOCATIONS;
  } catch {
    return DEFAULT_LOCATIONS;
  }
}

function setStoredLocations(items) {
  try {
    localStorage.setItem("yooloei_locations", JSON.stringify(items));
  } catch (e) {
    console.error("Failed to save locations:", e);
  }
}

// 1. ดึงรายการพื้นที่/โซนทั้งหมด
export async function getLocations() {
  try {
    const res = await api.get("/locations");
    if (Array.isArray(res) && res.length > 0) return res;
    return getStoredLocations();
  } catch (error) {
    console.warn("getLocations local browser fallback:", error);
    return getStoredLocations();
  }
}

// 2. แอดมินเพิ่มพื้นที่ใหม่
export async function addLocation(name, description = "") {
  try {
    const res = await api.post("/admin/locations", { name, description });
    return res;
  } catch (error) {
    console.warn("addLocation local browser fallback:", error);
    const local = getStoredLocations();
    const newItem = { id: `loc-${Date.now()}`, name, description };
    const updated = [newItem, ...local];
    setStoredLocations(updated);
    return newItem;
  }
}

// 3. แอดมินแก้ไขพื้นที่
export async function updateLocation(id, name, description = "") {
  try {
    const res = await api.put(`/admin/locations/${id}`, { name, description });
    return res;
  } catch (error) {
    console.warn("updateLocation local browser fallback:", error);
    const local = getStoredLocations();
    const updated = local.map((l) => (l.id === id ? { ...l, name, description } : l));
    setStoredLocations(updated);
    return { id, name, description };
  }
}

// 4. แอดมินลบพื้นที่
export async function deleteLocation(id) {
  try {
    const res = await api.delete(`/admin/locations/${id}`);
    return res;
  } catch (error) {
    console.warn("deleteLocation local browser fallback:", error);
    const local = getStoredLocations();
    const updated = local.filter((l) => l.id !== id);
    setStoredLocations(updated);
    return true;
  }
}
