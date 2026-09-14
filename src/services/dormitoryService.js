import { api } from "./apiClient";

const FALLBACK_DORMS = [
  {
    id: "sample-1",
    name: "หอพัก อเธน่า",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"],
    status: "approved"
  },
  {
    id: "sample-2",
    name: "หอพัก ภูผาอินทร์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"],
    status: "approved"
  },
  {
    id: "sample-3",
    name: "บ้านพักสบาย เชียงคาน",
    district: "เชียงคาน",
    address: "ใกล้ถนนคนเดินเชียงคาน",
    priceMin: 4000,
    priceMax: 4000,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องแอร์", "ฟรี WiFi", "เครื่องทำน้ำอุ่น"],
    status: "approved"
  },
  {
    id: "sample-4",
    name: "หอพัก อานนท์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"],
    status: "approved"
  }
];

// 1. ดึงหอพักที่ได้รับการอนุมัติ (สำหรับ Guest / User ทั่วไป)
export async function getApprovedDormitories(filters = {}) {
  try {
    const res = await api.get("/dormitories", filters);
    if (res && res.dormitories && res.dormitories.length > 0) {
      return res.dormitories;
    }
    return FALLBACK_DORMS;
  } catch (error) {
    console.warn("getApprovedDormitories fallback:", error);
    return FALLBACK_DORMS;
  }
}

// 2. ดึงหอพักตาม ID พร้อมห้องพักและรีวิว
export async function getDormitoryById(id) {
  try {
    const res = await api.get(`/dormitories/${id}`);
    if (res && res.dormitory) return res.dormitory;
    return FALLBACK_DORMS.find((d) => d.id === id) || FALLBACK_DORMS[0];
  } catch (error) {
    console.error("Error fetching dormitory by id:", error);
    return FALLBACK_DORMS.find((d) => d.id === id) || FALLBACK_DORMS[0];
  }
}

// 3. ดึงหอพักของเจ้าของหอ (Owner)
export async function getDormitoriesByOwner(ownerId) {
  try {
    const res = await api.get(`/dormitories/owner/${ownerId}`);
    if (res && res.dormitories && res.dormitories.length > 0) {
      return res.dormitories;
    }
    return FALLBACK_DORMS;
  } catch (error) {
    console.error("Error fetching owner dormitories:", error);
    return FALLBACK_DORMS;
  }
}

// 4. ดึงหอพักทั้งหมดในระบบ (สำหรับ Admin)
export async function getAllDormitoriesAdmin() {
  try {
    const res = await api.get("/dormitories", { all: "true" });
    if (res && res.dormitories && res.dormitories.length > 0) {
      return res.dormitories;
    }
    return FALLBACK_DORMS;
  } catch (error) {
    console.error("Error fetching all dormitories for admin:", error);
    return FALLBACK_DORMS;
  }
}

// 5. เจ้าของเพิ่มหอพักใหม่
export async function createDormitory(data, ownerId) {
  try {
    const payload = { ...data, ownerId };
    const res = await api.post("/dormitories", payload);
    return res.id || res.dormitory?.id || `dorm_${Date.now()}`;
  } catch (err) {
    console.warn("createDormitory local fallback:", err);
    return `dorm_${Date.now()}`;
  }
}

// 6. เจ้าของแก้ไขข้อมูลหอพักตนเอง
export async function updateDormitory(id, data) {
  try {
    const res = await api.put(`/dormitories/${id}`, data);
    return res.dormitory;
  } catch (err) {
    console.warn("updateDormitory local fallback:", err);
    return { id, ...data };
  }
}

// 7. Admin อนุมัติ / ปฏิเสธ หอพัก
export async function setDormitoryStatus(id, status) {
  try {
    const res = await api.patch(`/dormitories/${id}/status`, { status });
    return res.dormitory;
  } catch (err) {
    console.warn("setDormitoryStatus local fallback:", err);
    return { id, status };
  }
}

// 8. ลบหอพัก
export async function deleteDormitory(id) {
  try {
    return await api.delete(`/dormitories/${id}`);
  } catch (err) {
    console.warn("deleteDormitory local fallback:", err);
    return true;
  }
}

// 9. เพิ่มยอดวิว
export async function incrementDormView(id) {
  try {
    await api.post(`/dormitories/${id}/view`, {});
  } catch {
    // Optional
  }
}
