import { api } from "./apiClient";

// 1. ส่งข้อความแชท
export async function sendMessage({ receiverId, receiverName, dormitoryId, dormitoryName, message }) {
  const res = await api.post("/messages", {
    receiverId,
    receiverName,
    dormitoryId,
    dormitoryName,
    message
  });
  return res.chatMessage;
}

// 2. ดึงรายการคู่สนทนาทั้งหมด
export async function getConversations() {
  try {
    const res = await api.get("/messages");
    return res.conversations || [];
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return [];
  }
}

// 3. ดึงประวัติการคุยกับผู้ใช้อีกคน
export async function getMessageThread(otherUserId) {
  try {
    const res = await api.get(`/messages/thread/${otherUserId}`);
    return {
      messages: res.messages || [],
      otherUser: res.otherUser || null
    };
  } catch (error) {
    console.error("Error fetching chat thread:", error);
    return { messages: [], otherUser: null };
  }
}
