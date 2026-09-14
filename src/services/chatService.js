import { supabase } from "../supabase/config";
import { getCurrentUserFromStorage } from "./apiClient";

// 1. ส่งข้อความแชทผ่าน Supabase
export async function sendMessage({ receiverId, receiverName, dormitoryId, dormitoryName, message }) {
  const user = getCurrentUserFromStorage();
  const senderId = user?.id || "guest";
  const newId = `msg_${Date.now()}`;

  const payload = {
    id: newId,
    sender_id: senderId,
    sender_name: user?.displayName || user?.full_name || "ผู้ใช้งาน",
    receiver_id: receiverId,
    receiver_name: receiverName,
    dormitory_id: dormitoryId,
    dormitory_name: dormitoryName,
    message,
    created_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from("messages")
    .insert([payload])
    .select();

  if (error) console.error("sendMessage Supabase error:", error);
  return data?.[0] || payload;
}

// 2. ดึงรายการคู่สนทนาทั้งหมดจาก Supabase
export async function getConversations() {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id) return [];

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
      .order("created_at", { ascending: false });

    if (error || !data) return [];

    const map = new Map();
    data.forEach((msg) => {
      const isSender = msg.sender_id === user.id;
      const otherId = isSender ? msg.receiver_id : msg.sender_id;
      const otherName = isSender ? msg.receiver_name : msg.sender_name;

      if (!map.has(otherId)) {
        map.set(otherId, {
          otherUserId: otherId,
          otherUserName: otherName || "ผู้สนทนา",
          dormitoryName: msg.dormitory_name || "หอพัก",
          lastMessage: msg.message,
          lastMessageAt: msg.created_at
        });
      }
    });

    return Array.from(map.values());
  } catch (error) {
    console.error("Error fetching conversations from Supabase:", error);
    return [];
  }
}

// 3. ดึงประวัติการคุยกับผู้ใช้อีกคนจาก Supabase
export async function getMessageThread(otherUserId) {
  try {
    const user = getCurrentUserFromStorage();
    if (!user?.id || !otherUserId) return { messages: [], otherUser: null };

    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
      .order("created_at", { ascending: true });

    if (error || !data) return { messages: [], otherUser: null };

    return {
      messages: data.map((m) => ({
        id: m.id,
        senderId: m.sender_id,
        receiverId: m.receiver_id,
        message: m.message,
        createdAt: m.created_at
      })),
      otherUser: { id: otherUserId }
    };
  } catch (error) {
    console.error("Error fetching chat thread from Supabase:", error);
    return { messages: [], otherUser: null };
  }
}
