import { api } from "./apiClient";

// 1. เพิ่มหรือสลับในรายการโปรด (Toggle)
export async function toggleFavorite(dormitoryId) {
  const res = await api.post("/favorites/toggle", { dormitoryId });
  return res.favorited;
}

export async function addFavorite(userId, dormitoryId) {
  return toggleFavorite(dormitoryId);
}

export async function removeFavorite(userId, dormitoryId) {
  return toggleFavorite(dormitoryId);
}

// 3. ตรวจสอบว่าถูกบันทึกเป็น Favorite หรือยัง
export async function isFavorite(userId, dormitoryId) {
  if (!userId) return false;
  try {
    const list = await getUserFavorites(userId);
    return list.some((item) => item.id === dormitoryId || item.dormitoryId === dormitoryId);
  } catch {
    return false;
  }
}

// 4. ดึงรายการโปรดทั้งหมดของผู้ใช้ พร้อมข้อมูลหอพัก
export async function getUserFavorites(userId) {
  try {
    const res = await api.get(`/favorites/user/${userId}`);
    return (res.favorites || []).map((f) => ({
      id: f.dormitoryId || f.id,
      dormitoryId: f.dormitoryId || f.id,
      name: f.name,
      district: f.district,
      priceMin: f.priceMin,
      priceMax: f.priceMax,
      images: f.images || [],
      rating: Number(f.rating || 0),
      status: f.status,
      favoritedAt: f.created_at
    }));
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    return [];
  }
}

// 5. ล้างรายการโปรดทั้งหมด
export async function clearAllFavorites(userId) {
  try {
    const list = await getUserFavorites(userId);
    for (const item of list) {
      await removeFavorite(userId, item.id || item.dormitoryId);
    }
    return true;
  } catch (error) {
    console.error("Error clearing all favorites:", error);
    throw error;
  }
}
