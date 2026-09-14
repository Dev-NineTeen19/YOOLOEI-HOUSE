import { api } from "./apiClient";

// 1. ดึงรายการการแจ้งเตือนและจำนวนที่ยังไม่อ่าน
export async function getNotifications() {
  try {
    const res = await api.get("/notifications");
    return {
      notifications: res.notifications || [],
      unreadCount: res.unreadCount || 0
    };
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return { notifications: [], unreadCount: 0 };
  }
}

// 2. ทำเครื่องหมายอ่านแล้วทั้งหมด
export async function markAllNotificationsAsRead() {
  try {
    const res = await api.put("/notifications/read-all", {});
    return res;
  } catch (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }
}

// 3. ทำเครื่องหมายอ่านแล้วเฉพาะรายการ
export async function markNotificationAsRead(notificationId) {
  try {
    const res = await api.put(`/notifications/${notificationId}/read`, {});
    return res;
  } catch (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }
}

// 4. ลบรายการแจ้งเตือน
export async function deleteNotification(notificationId) {
  try {
    const res = await api.delete(`/notifications/${notificationId}`);
    return res;
  } catch (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }
}
