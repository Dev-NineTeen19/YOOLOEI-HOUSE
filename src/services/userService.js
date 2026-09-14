import { api } from "./apiClient";

// 1. ดึงผู้ใช้งานทั้งหมดในระบบ (Admin)
export async function getAllUsersAdmin() {
  try {
    const res = await api.get("/admin/users");
    return (res.users || []).map((u) => ({
      id: u.id,
      email: u.email,
      displayName: u.full_name,
      firstName: u.first_name,
      lastName: u.last_name,
      phone: u.phone,
      username: u.username,
      role: u.role,
      avatarUrl: u.avatar_url,
      createdAt: u.created_at
    }));
  } catch (error) {
    console.error("Error fetching users for admin:", error);
    return [];
  }
}

// 2. เปลี่ยน Role ของผู้ใช้ (Admin)
export async function updateUserRole(uid, newRole) {
  try {
    const res = await api.put(`/admin/users/${uid}/role`, { role: newRole });
    return res.user || { id: uid, role: newRole };
  } catch (error) {
    console.error("Error updating user role:", error);
    throw error;
  }
}

// 3. ระงับ / ลบ บัญชีผู้ใช้ (Admin)
export async function deleteUserDoc(uid) {
  try {
    const res = await api.delete(`/admin/users/${uid}`);
    return res;
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}
