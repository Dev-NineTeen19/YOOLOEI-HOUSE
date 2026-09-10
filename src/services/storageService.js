import { api } from "./apiClient";

// 1. อัปโหลดรูปภาพ Avatar ผู้ใช้
export async function uploadUserAvatar(userId, file) {
  try {
    const res = await api.upload(file);
    return res.url;
  } catch (error) {
    console.error("Error uploading avatar to SQLite server:", error);
    throw error;
  }
}

// 2. อัปโหลดรูปภาพหอพัก
export async function uploadDormitoryImage(dormitoryId, file) {
  try {
    const res = await api.upload(file);
    return res.url;
  } catch (error) {
    console.error("Error uploading dorm image to SQLite server:", error);
    throw error;
  }
}

// 3. อัปโหลดรูปภาพห้องพัก
export async function uploadRoomImage(roomId, file) {
  try {
    const res = await api.upload(file);
    return res.url;
  } catch (error) {
    console.error("Error uploading room image to SQLite server:", error);
    throw error;
  }
}
