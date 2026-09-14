import { supabase } from "../supabase/config";
import { getCurrentUserFromStorage } from "./apiClient";

// 1. ดึงรายการการแจ้งเตือนและจำนวนที่ยังไม่อ่านจาก Supabase
export async function getNotifications() {
  try {
    const user = getCurrentUserFromStorage();
    const userId = user?.id;
    if (!userId) return { notifications: [], unreadCount: 0 };

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error || !data) return { notifications: [], unreadCount: 0 };

    const unreadCount = data.filter((n) => !n.is_read && !n.isRead).length;

    return {
      notifications: data.map((n) => ({
        id: n.id,
        title: n.title,
        message: n.message,
        isRead: Boolean(n.is_read || n.isRead),
        type: n.type || "info",
        link: n.link || "",
        createdAt: n.created_at || n.createdAt
      })),
      unreadCount
    };
  } catch (error) {
    console.error("Error fetching notifications from Supabase:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

// 2. ทำเครื่องหมายอ่านแล้วทั้งหมดใน Supabase
export async function markAllNotificationsAsRead() {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id) return true;

    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_id", user.id);

    return true;
  } catch (error) {
    console.error("Error marking all notifications as read in Supabase:", error);
    return true;
  }
}

// 3. ทำเครื่องหมายอ่านแล้วเฉพาะรายการใน Supabase
export async function markNotificationAsRead(notificationId) {
  try {
    await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("id", notificationId);

    return true;
  } catch (error) {
    console.error("Error marking notification as read in Supabase:", error);
    return true;
  }
}

// 4. ลบรายการแจ้งเตือนใน Supabase
export async function deleteNotification(notificationId) {
  try {
    await supabase
      .from("notifications")
      .delete()
      .eq("id", notificationId);

    return true;
  } catch (error) {
    console.error("Error deleting notification in Supabase:", error);
    return true;
  }
}
