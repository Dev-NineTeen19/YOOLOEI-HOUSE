import { supabase } from "../supabase/config";

// 1. ดึงผู้ใช้งานทั้งหมดในระบบ (Admin) จาก Supabase
export async function getAllUsersAdmin() {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    return data.map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.full_name || `${u.first_name || ""} ${u.last_name || ""}`.trim() || u.username || u.email,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      username: u.username,
      role: u.role || "user",
      avatarUrl: u.avatar_url || "/images/default-avatar.jpg",
      createdAt: u.created_at
    }));
  } catch (error) {
    console.error("Error fetching users for admin from Supabase:", error);
    return [];
  }
}

// 2. เปลี่ยน Role ของผู้ใช้ (Admin) ใน Supabase
export async function updateUserRole(uid, newRole) {
  try {
    const { data, error } = await supabase
      .from("users")
      .update({ role: newRole, updated_at: new Date().toISOString() })
      .eq("id", uid)
      .select();

    if (error) console.error("updateUserRole Supabase error:", error);
    return data?.[0] || { id: uid, role: newRole };
  } catch (error) {
    console.error("Error updating user role in Supabase:", error);
    throw error;
  }
}

// 3. ระงับ / ลบ บัญชีผู้ใช้ (Admin) ใน Supabase
export async function deleteUserDoc(uid) {
  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", uid);

    if (error) console.error("deleteUserDoc Supabase error:", error);
    return true;
  } catch (error) {
    console.error("Error deleting user in Supabase:", error);
    throw error;
  }
}
