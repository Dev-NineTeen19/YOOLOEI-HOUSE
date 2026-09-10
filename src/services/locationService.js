import { api } from "./apiClient";

// 1. ดึงรายการพื้นที่/โซนทั้งหมด
export async function getLocations() {
  try {
    const res = await api.get("/locations");
    return Array.isArray(res) ? res : [];
  } catch (error) {
    console.error("Error fetching locations:", error);
    return [];
  }
}

// 2. แอดมินเพิ่มพื้นที่ใหม่
export async function addLocation(name, description = "") {
  try {
    const res = await api.post("/admin/locations", { name, description });
    return res;
  } catch (error) {
    console.error("Error adding location:", error);
    throw error;
  }
}

// 3. แอดมินแก้ไขพื้นที่
export async function updateLocation(id, name, description = "") {
  try {
    const res = await api.put(`/admin/locations/${id}`, { name, description });
    return res;
  } catch (error) {
    console.error("Error updating location:", error);
    throw error;
  }
}

// 4. แอดมินลบพื้นที่
export async function deleteLocation(id) {
  try {
    const res = await api.delete(`/admin/locations/${id}`);
    return res;
  } catch (error) {
    console.error("Error deleting location:", error);
    throw error;
  }
}
