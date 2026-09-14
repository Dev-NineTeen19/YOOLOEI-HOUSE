import { supabase } from "../supabase/config";

// 1. เพิ่มหรือสลับในรายการโปรด (Toggle Favorite in Supabase)
export async function toggleFavorite(userId, dormitoryId) {
  if (!userId || !dormitoryId) return false;
  try {
    const { data: existing } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", userId)
      .eq("dormitory_id", dormitoryId);

    if (existing && existing.length > 0) {
      await supabase
        .from("favorites")
        .delete()
        .eq("user_id", userId)
        .eq("dormitory_id", dormitoryId);
      return false;
    } else {
      await supabase.from("favorites").insert([
        {
          id: `fav_${Date.now()}`,
          user_id: userId,
          dormitory_id: dormitoryId,
          created_at: new Date().toISOString()
        }
      ]);
      return true;
    }
  } catch (err) {
    console.error("toggleFavorite Supabase error:", err);
    return false;
  }
}

export async function addFavorite(userId, dormitoryId) {
  return toggleFavorite(userId, dormitoryId);
}

export async function removeFavorite(userId, dormitoryId) {
  return toggleFavorite(userId, dormitoryId);
}

// 3. ตรวจสอบว่าถูกบันทึกเป็น Favorite หรือยังใน Supabase
export async function isFavorite(userId, dormitoryId) {
  if (!userId || !dormitoryId) return false;
  try {
    const { data } = await supabase
      .from("favorites")
      .select("id")
      .eq("user_id", userId)
      .eq("dormitory_id", dormitoryId);

    return data && data.length > 0;
  } catch {
    return false;
  }
}

// 4. ดึงรายการโปรดทั้งหมดของผู้ใช้ พร้อมข้อมูลหอพักจาก Supabase
export async function getUserFavorites(userId) {
  if (!userId) return [];
  try {
    const { data: favs, error } = await supabase
      .from("favorites")
      .select("*, dormitories(*)")
      .eq("user_id", userId);

    if (error || !favs) return [];

    return favs.map((f) => {
      const dorm = f.dormitories || {};
      return {
        id: dorm.id || f.dormitory_id,
        dormitoryId: dorm.id || f.dormitory_id,
        name: dorm.name || "หอพัก",
        district: dorm.district || "เมืองเลย",
        priceMin: Number(dorm.price_min || dorm.priceMin || 3500),
        priceMax: Number(dorm.price_max || dorm.priceMax || 3500),
        images: Array.isArray(dorm.images) ? dorm.images : ["/images/dorm-1.jpg"],
        rating: Number(dorm.rating || 5),
        status: dorm.status || "approved",
        favoritedAt: f.created_at
      };
    });
  } catch (error) {
    console.error("Error fetching user favorites from Supabase:", error);
    return [];
  }
}

// 5. ล้างรายการโปรดทั้งหมดของผู้ใช้ใน Supabase
export async function clearAllFavorites(userId) {
  if (!userId) return true;
  try {
    await supabase.from("favorites").delete().eq("user_id", userId);
    return true;
  } catch (error) {
    console.error("Error clearing all favorites from Supabase:", error);
    throw error;
  }
}
