import { api } from "./apiClient";

// 1. บันทึกประวัติการดูหอพัก
export async function recordDormView(dormitoryId) {
  try {
    if (!dormitoryId) return;
    const res = await api.post("/history/view", { dormitoryId });
    return res;
  } catch (error) {
    console.error("Error recording view history:", error);
  }
}

// 2. ดึงประวัติการดูหอพักทั้งหมดของผู้ใช้
export async function getViewHistory() {
  try {
    const res = await api.get("/history/view");
    return res.history || [];
  } catch (error) {
    console.error("Error fetching view history:", error);
    return [];
  }
}

// 3. ลบประวัติหอพักเฉพาะรายการ
export async function removeViewHistory(dormitoryId) {
  try {
    const res = await api.delete(`/history/view/${dormitoryId}`);
    return res;
  } catch (error) {
    console.error("Error removing view history item:", error);
    throw error;
  }
}

// 4. ล้างประวัติการดูหอพักทั้งหมด
export async function clearAllViewHistory() {
  try {
    const res = await api.delete("/history/view");
    return res;
  } catch (error) {
    console.error("Error clearing all view history:", error);
    throw error;
  }
}
