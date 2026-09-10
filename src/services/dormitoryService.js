import { api } from "./apiClient";

// 1. ดึงหอพักที่ได้รับการอนุมัติ (สำหรับ Guest / User ทั่วไป)
export async function getApprovedDormitories(filters = {}) {
  try {
    const res = await api.get("/dormitories", filters);
    return res.dormitories || [];
  } catch (error) {
    console.warn("getApprovedDormitories fallback:", error);
    return [];
  }
}

// 2. ดึงหอพักตาม ID พร้อมห้องพักและรีวิว
export async function getDormitoryById(id) {
  try {
    const res = await api.get(`/dormitories/${id}`);
    return res.dormitory || null;
  } catch (error) {
    console.error("Error fetching dormitory by id:", error);
    return null;
  }
}

// 3. ดึงหอพักของเจ้าของหอ (Owner)
export async function getDormitoriesByOwner(ownerId) {
  try {
    const res = await api.get(`/dormitories/owner/${ownerId}`);
    return res.dormitories || [];
  } catch (error) {
    console.error("Error fetching owner dormitories:", error);
    return [];
  }
}

// 4. ดึงหอพักทั้งหมดในระบบ (สำหรับ Admin)
export async function getAllDormitoriesAdmin() {
  try {
    const res = await api.get("/dormitories", { all: "true" });
    return res.dormitories || [];
  } catch (error) {
    console.error("Error fetching all dormitories for admin:", error);
    return [];
  }
}

// 5. เจ้าของเพิ่มหอพักใหม่ (สถานะเริ่มต้นเป็น pending ต้องรอแอดมินยืนยัน)
export async function createDormitory(data, ownerId) {
  const payload = {
    ...data,
    ownerId
  };
  const res = await api.post("/dormitories", payload);
  return res.id || res.dormitory?.id;
}

// 6. เจ้าของแก้ไขข้อมูลหอพักตนเอง (ทำได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!)
export async function updateDormitory(id, data) {
  const res = await api.put(`/dormitories/${id}`, data);
  return res.dormitory;
}

// 7. Admin อนุมัติ / ปฏิเสธ หอพัก
export async function setDormitoryStatus(id, status) {
  const res = await api.patch(`/dormitories/${id}/status`, { status });
  return res.dormitory;
}

// 8. ลบหอพัก
export async function deleteDormitory(id) {
  return await api.delete(`/dormitories/${id}`);
}

// 9. เพิ่มยอดวิว
export async function incrementDormView(id) {
  try {
    await api.post(`/dormitories/${id}/view`, {});
  } catch {
    // Optional
  }
}
