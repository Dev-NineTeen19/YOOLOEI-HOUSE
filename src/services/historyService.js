import { supabase } from "../supabase/config";
import { getCurrentUserFromStorage } from "./apiClient";

// 1. บันทึกประวัติการดูหอพักใน Supabase
export async function recordDormView(dormitoryId) {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id || !dormitoryId) return;

    await supabase.from("view_history").upsert([
      {
        id: `vh_${user.id}_${dormitoryId}`,
        user_id: user.id,
        dormitory_id: dormitoryId,
        viewed_at: new Date().toISOString()
      }
    ]);
  } catch (error) {
    console.error("Error recording view history in Supabase:", error);
  }
}

// 2. ดึงประวัติการดูหอพักทั้งหมดของผู้ใช้จาก Supabase
export async function getViewHistory() {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from("view_history")
      .select("*, dormitories(*)")
      .eq("user_id", user.id)
      .order("viewed_at", { ascending: false });

    if (error || !data) return [];
    return data.map((item) => ({
      id: item.dormitories?.id || item.dormitory_id,
      dormitoryId: item.dormitories?.id || item.dormitory_id,
      name: item.dormitories?.name || "หอพัก",
      district: item.dormitories?.district || "เมืองเลย",
      priceMin: Number(item.dormitories?.price_min || 3500),
      images: Array.isArray(item.dormitories?.images) ? item.dormitories.images : ["/images/dorm-1.jpg"],
      viewedAt: item.viewed_at
    }));
  } catch (error) {
    console.error("Error fetching view history from Supabase:", error);
    return [];
  }
}

// 3. ลบประวัติหอพักเฉพาะรายการใน Supabase
export async function removeViewHistory(dormitoryId) {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id) return true;

    await supabase
      .from("view_history")
      .delete()
      .eq("user_id", user.id)
      .eq("dormitory_id", dormitoryId);

    return true;
  } catch (error) {
    console.error("Error removing view history item in Supabase:", error);
    throw error;
  }
}

// 4. ล้างประวัติการดูหอพักทั้งหมดใน Supabase
export async function clearAllViewHistory() {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id) return true;

    await supabase
      .from("view_history")
      .delete()
      .eq("user_id", user.id);

    return true;
  } catch (error) {
    console.error("Error clearing all view history in Supabase:", error);
    throw error;
  }
}
