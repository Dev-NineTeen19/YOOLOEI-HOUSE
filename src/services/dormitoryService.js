import { api } from "./apiClient";

const FALLBACK_DORMS = [
  { id: "sample-1", name: "หอพัก อเธน่า", district: "เมืองเลย", address: "1.2 km จากราชภัฏเลย", priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-2", name: "หอพัก ภูผาอินทร์", district: "เมืองเลย", address: "1.2 km จากราชภัฏเลย", priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-2.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-3", name: "บ้านพักสบาย เชียงคาน", district: "เชียงคาน", address: "ใกล้ถนนคนเดินเชียงคาน", priceMin: 4000, priceMax: 4000, rating: 5, images: ["/images/dorm-3.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "เครื่องทำน้ำอุ่น"], status: "approved" },
  { id: "sample-4", name: "หอพัก อานนท์", district: "เมืองเลย", address: "1.2 km จากราชภัฏเลย", priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-4.jpg"], amenities: ["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-5", name: "หอพัก สุขอนันต์", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 2800, priceMax: 2800, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-6", name: "หอพัก เมืองเลยปาร์ค", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 3200, priceMax: 3200, rating: 5, images: ["/images/dorm-2.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "กล้องวงจรปิด"], status: "approved" },
  { id: "sample-7", name: "หอพัก เจริญเมือง", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 3000, priceMax: 3000, rating: 5, images: ["/images/dorm-3.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-8", name: "หอพัก ศรีสองรัก", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 2500, priceMax: 2500, rating: 5, images: ["/images/dorm-4.jpg"], amenities: ["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-9", name: "หอพัก กุดป่องวิว", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 3500, priceMax: 3500, rating: 5, images: ["/images/dorm-1.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ระเบียง"], status: "approved" },
  { id: "sample-10", name: "หอพัก นาอานการ์เด้น", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 3800, priceMax: 3800, rating: 5, images: ["/images/dorm-2.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" },
  { id: "sample-11", name: "หอพัก กำเนิดเพชรเรสซิเดนซ์", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 4200, priceMax: 4200, rating: 5, images: ["/images/dorm-3.jpg"], amenities: ["ห้องแอร์", "ฟรี WiFi", "ระบบคีย์การ์ด"], status: "approved" },
  { id: "sample-12", name: "หอพัก เลยพิทเฮาส์", district: "เมืองเลย", address: "อ.เมืองเลย จ.เลย", priceMin: 3200, priceMax: 3200, rating: 5, images: ["/images/dorm-4.jpg"], amenities: ["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"], status: "approved" }
];

function getStoredDormitories() {
  try {
    const raw = localStorage.getItem("yooloei_dormitories");
    return raw ? JSON.parse(raw) : FALLBACK_DORMS;
  } catch {
    return FALLBACK_DORMS;
  }
}

function setStoredDormitories(dorms) {
  try {
    localStorage.setItem("yooloei_dormitories", JSON.stringify(dorms));
  } catch (e) {
    console.error("Failed to save dormitories to localStorage:", e);
  }
}

// 1. ดึงหอพักที่ได้รับการอนุมัติ (สำหรับ Guest / User ทั่วไป)
export async function getApprovedDormitories(filters = {}) {
  try {
    const res = await api.get("/dormitories", filters);
    if (res && res.dormitories && res.dormitories.length > 0) {
      return res.dormitories;
    }
    return getStoredDormitories();
  } catch (error) {
    console.warn("getApprovedDormitories local browser fallback:", error);
    let list = getStoredDormitories();
    if (filters.name) {
      list = list.filter((d) => d.name.toLowerCase().includes(filters.name.toLowerCase()));
    }
    if (filters.district) {
      list = list.filter((d) => d.district === filters.district);
    }
    return list;
  }
}

// 2. ดึงหอพักตาม ID พร้อมห้องพักและรีวิว
export async function getDormitoryById(id) {
  try {
    const res = await api.get(`/dormitories/${id}`);
    if (res && res.dormitory) return res.dormitory;
    const dorms = getStoredDormitories();
    return dorms.find((d) => String(d.id) === String(id)) || dorms[0];
  } catch (error) {
    console.warn("getDormitoryById local browser fallback:", error);
    const dorms = getStoredDormitories();
    return dorms.find((d) => String(d.id) === String(id)) || dorms[0];
  }
}

// 3. ดึงหอพักของเจ้าของหอ (Owner)
export async function getDormitoriesByOwner(ownerId) {
  try {
    const res = await api.get(`/dormitories/owner/${ownerId}`);
    if (res && res.dormitories && res.dormitories.length > 0) {
      return res.dormitories;
    }
    return getStoredDormitories();
  } catch (error) {
    console.warn("getDormitoriesByOwner local browser fallback:", error);
    return getStoredDormitories();
  }
}

// 4. ดึงหอพักทั้งหมดในระบบ (สำหรับ Admin)
export async function getAllDormitoriesAdmin() {
  try {
    const res = await api.get("/dormitories", { all: "true" });
    if (res && res.dormitories && res.dormitories.length > 0) {
      return res.dormitories;
    }
    return getStoredDormitories();
  } catch (error) {
    console.warn("getAllDormitoriesAdmin local browser fallback:", error);
    return getStoredDormitories();
  }
}

// 5. เจ้าของเพิ่มหอพักใหม่
export async function createDormitory(data, ownerId) {
  try {
    const payload = { ...data, ownerId };
    const res = await api.post("/dormitories", payload);
    return res.id || res.dormitory?.id || `dorm_${Date.now()}`;
  } catch (err) {
    console.warn("createDormitory local browser fallback:", err);
    const dorms = getStoredDormitories();
    const newDorm = {
      id: `dorm_${Date.now()}`,
      ownerId,
      name: data.name || "หอพักใหม่",
      district: data.district || "เมืองเลย",
      address: data.address || "",
      priceMin: Number(data.priceMin || 3500),
      priceMax: Number(data.priceMax || 3500),
      rating: 5,
      images: data.images || ["/images/dorm-1.jpg"],
      amenities: data.amenities || ["ห้องแอร์", "ฟรี WiFi"],
      status: "approved"
    };
    const updated = [newDorm, ...dorms];
    setStoredDormitories(updated);
    return newDorm.id;
  }
}

// 6. เจ้าของแก้ไขข้อมูลหอพักตนเอง
export async function updateDormitory(id, data) {
  try {
    const res = await api.put(`/dormitories/${id}`, data);
    return res.dormitory;
  } catch (err) {
    console.warn("updateDormitory local browser fallback:", err);
    const dorms = getStoredDormitories();
    const updated = dorms.map((d) => (String(d.id) === String(id) ? { ...d, ...data } : d));
    setStoredDormitories(updated);
    return { id, ...data };
  }
}

// 7. Admin อนุมัติ / ปฏิเสธ หอพัก
export async function setDormitoryStatus(id, status) {
  try {
    const res = await api.patch(`/dormitories/${id}/status`, { status });
    return res.dormitory;
  } catch (err) {
    console.warn("setDormitoryStatus local browser fallback:", err);
    const dorms = getStoredDormitories();
    const updated = dorms.map((d) => (String(d.id) === String(id) ? { ...d, status } : d));
    setStoredDormitories(updated);
    return { id, status };
  }
}

// 8. ลบหอพัก
export async function deleteDormitory(id) {
  try {
    return await api.delete(`/dormitories/${id}`);
  } catch (err) {
    console.warn("deleteDormitory local browser fallback:", err);
    const dorms = getStoredDormitories();
    const updated = dorms.filter((d) => String(d.id) !== String(id));
    setStoredDormitories(updated);
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
