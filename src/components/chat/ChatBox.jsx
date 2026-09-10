import { useState, useEffect, useRef } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getConversations, getMessageThread, sendMessage } from "../../services/chatService";

export default function ChatBox({ defaultRole = "user" }) {
  const { currentUser, userRole } = useAuth();
  const [searchParams] = useSearchParams();

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [mobileShowThread, setMobileShowThread] = useState(false);

  const messagesContainerRef = useRef(null);
  const activePartnerRef = useRef(activePartner);
  activePartnerRef.current = activePartner;

  // ดึงพารามิเตอร์ถ้ากด 'แชทกับเจ้าของหอ' มาจากหน้ารายละเอียดหอพัก
  const targetOwnerId = searchParams.get("ownerId");
  const targetDormId = searchParams.get("dormId");
  const targetDormName = searchParams.get("dormName");
  const targetOwnerName = searchParams.get("ownerName");

  const initialTargetProcessed = useRef(false);

  // Helper ฟังก์ชันทำความสะอาดชื่อผู้ใช้ ไม่ให้แสดงผลเป็น Email
  const cleanName = (name, fallback = "ผู้ใช้งาน") => {
    if (!name) return fallback;
    if (name.includes("@")) {
      return name.split("@")[0];
    }
    return name;
  };

  // Helper สร้าง Avatar แสดงผลสำหรับทุกบทบาท (ใช้โปรไฟล์เริ่มต้นตามภาพที่ระบุ)
  const renderAvatar = (url, name, role, size = 36) => {
    const displayName = cleanName(name);
    const imgSrc = url || "/images/default-avatar.jpg";

    return (
      <img
        src={imgSrc}
        alt={displayName}
        style={{
          width: `${size}px`,
          height: `${size}px`,
          borderRadius: "50%",
          objectFit: "cover",
          border: "2px solid #e5e9e3",
          flexShrink: 0
        }}
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = "/images/default-avatar.jpg";
        }}
      />
    );
  };

  // ฟังก์ชันเลื่อนแชทลงด้านล่างเฉพาะในกล่องข้อความ (ไม่เลื่อนหน้าจอทั้งหน้าเว็บ)
  const scrollToBottom = (behavior = "smooth") => {
    const el = messagesContainerRef.current;
    if (!el) return;
    if (behavior === "auto") {
      el.scrollTop = el.scrollHeight;
    } else {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
    }
  };

  // โหลดรายการการสนทนาทั้งหมด
  const loadConversations = async (isInitial = false) => {
    try {
      const list = await getConversations();
      // ทำความสะอาดชื่อในรายการสนทนา
      const cleanedList = (list || []).map((c) => ({
        ...c,
        otherUserName: cleanName(c.otherUserName, "ผู้ใช้งาน")
      }));
      setConversations(cleanedList);

      // จัดการ targetOwnerId เฉพาะเมื่อโหลดครั้งแรกหรือยังไม่ได้เลือก
      if (isInitial && targetOwnerId && !initialTargetProcessed.current) {
        initialTargetProcessed.current = true;
        const found = cleanedList.find((c) => c.otherUserId === targetOwnerId);
        if (found) {
          setActivePartner(found);
          setMobileShowThread(true);
        } else {
          // ถ้ายังไม่เคยคุยกัน ให้สร้าง Partner ชั่วคราวเตรียมส่งข้อความแรก
          setActivePartner({
            otherUserId: targetOwnerId,
            otherUserName: cleanName(targetOwnerName, "เจ้าของหอพัก"),
            otherUserRole: "owner",
            otherUserAvatar: "",
            dormitoryId: targetDormId,
            dormitoryName: targetDormName ? decodeURIComponent(targetDormName) : "",
            unreadCount: 0
          });
          setMobileShowThread(true);
        }
      } else if (isInitial && cleanedList.length > 0 && !activePartnerRef.current) {
        // ถ้าเปิดมาเฉยๆ แล้วมีประวัติแชท ให้เลือกอันแรก
        setActivePartner(cleanedList[0]);
      }
    } catch (err) {
      console.error("Failed to load conversations:", err);
    } finally {
      if (isInitial) setLoadingConvs(false);
    }
  };

  // โหลดข้อความใน Thread เมื่อเลือก partner
  const loadMessages = async (partnerId, isBackground = false) => {
    if (!partnerId) return;
    if (!isBackground) setLoadingMessages(true);
    try {
      const res = await getMessageThread(partnerId);
      const thread = res.messages || (Array.isArray(res) ? res : []);

      let hasNewMessage = false;

      // ตรวจสอบการเปลี่ยนแปลงก่อนอัปเดต State เพื่อป้องกันการกระตุกและการเลื่อนหน้าจอโดยไม่จำเป็น
      setMessages((prev) => {
        if (prev.length === thread.length) {
          const prevLast = prev[prev.length - 1];
          const newLast = thread[thread.length - 1];
          if (prevLast?.id === newLast?.id && prevLast?.is_read === newLast?.is_read) {
            return prev; // ข้อมูลเดิม ไม่ต้อง re-render หรือ re-scroll
          }
        }
        if (thread.length > prev.length) {
          hasNewMessage = true;
        }
        return thread;
      });

      // อัปเดตข้อมูลคู่สนทนา (Avatar, Clean Name, Role)
      if (res.otherUser && activePartnerRef.current?.otherUserId === partnerId) {
        setActivePartner((prev) => {
          if (!prev) return prev;
          return {
            ...prev,
            otherUserName: cleanName(res.otherUser.userName, prev.otherUserName),
            otherUserAvatar: res.otherUser.avatarUrl || prev.otherUserAvatar || "",
            otherUserRole: res.otherUser.role || prev.otherUserRole || "user"
          };
        });
      }

      // เลื่อนลงล่างเฉพาะเมื่อเปลี่ยนคนคุยครั้งแรก หรือมีข้อความใหม่และผู้ใช้อยู่ล่างสุดอยู่แล้ว
      if (!isBackground) {
        setTimeout(() => scrollToBottom("auto"), 50);
      } else if (hasNewMessage) {
        const el = messagesContainerRef.current;
        if (el) {
          const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
          if (isNearBottom) {
            scrollToBottom("smooth");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load thread messages:", err);
    } finally {
      if (!isBackground) setLoadingMessages(false);
    }
  };

  // เริ่มต้นโหลด
  useEffect(() => {
    if (currentUser) {
      loadConversations(true);
    }
  }, [currentUser, targetOwnerId]);

  // เมื่อ activePartner เปลี่ยน ให้โหลดข้อความ
  useEffect(() => {
    if (activePartner?.otherUserId) {
      loadMessages(activePartner.otherUserId, false);
    } else {
      setMessages([]);
    }
  }, [activePartner?.otherUserId]);

  // Polling ข้อความแบบเรียลไทม์ทุก 1.5 วินาที
  useEffect(() => {
    if (!currentUser) return;

    const interval = setInterval(() => {
      const currentPartner = activePartnerRef.current;
      if (currentPartner?.otherUserId) {
        loadMessages(currentPartner.otherUserId, true);
      }
      loadConversations(false);
    }, 1500);

    return () => clearInterval(interval);
  }, [currentUser]);

  // ส่งข้อความ
  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activePartner || sending) return;

    const textToSend = inputText.trim();
    const receiverId = activePartner.otherUserId || "0f9be26f-766e-4914-991a-ee51506ae407";
    const receiverName = cleanName(activePartner.otherUserName, "เจ้าของหอพัก");

    const myDisplayName = cleanName(currentUser.displayName || currentUser.fullName, "คุณ");
    const myAvatar = currentUser.photoURL || currentUser.avatarUrl || "";

    setInputText("");
    setSending(true);

    // Optimistic Update: แสดงข้อความทันทีบนหน้าจอพร้อมรูปโปรไฟล์
    const tempMsg = {
      id: "temp-" + Date.now(),
      sender_id: currentUser.id || currentUser.uid,
      sender_name: myDisplayName,
      sender_avatar: myAvatar,
      sender_role: userRole || "user",
      receiver_id: receiverId,
      receiver_name: receiverName,
      dormitory_id: activePartner.dormitoryId || null,
      dormitory_name: activePartner.dormitoryName || null,
      message: textToSend,
      created_at: new Date().toISOString(),
      is_read: 0
    };
    setMessages((prev) => [...prev, tempMsg]);
    setTimeout(() => scrollToBottom("smooth"), 50);

    try {
      const newMsg = await sendMessage({
        receiverId,
        receiverName,
        dormitoryId: activePartner.dormitoryId || null,
        dormitoryName: activePartner.dormitoryName || null,
        message: textToSend
      });

      if (newMsg) {
        setMessages((prev) => prev.map((m) => (m.id === tempMsg.id ? { ...newMsg, sender_avatar: myAvatar, sender_name: myDisplayName } : m)));
      }
      loadConversations(false);
      if (activePartner.otherUserId) {
        loadMessages(activePartner.otherUserId, true);
      }
    } catch (err) {
      console.error("Send message failed:", err);
      alert("ไม่สามารถส่งข้อความได้ กรุณาลองใหม่อีกครั้ง");
      setMessages((prev) => prev.filter((m) => m.id !== tempMsg.id));
      setInputText(textToSend);
    } finally {
      setSending(false);
    }
  };

  const handleQuickReply = (text) => {
    setInputText(text);
  };

  const filteredConversations = conversations.filter((c) =>
    (c.otherUserName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.dormitoryName || "").toLowerCase().includes(searchTerm.toLowerCase())
  );

  const currentUserId = currentUser?.id || currentUser?.uid;
  const myDisplayName = cleanName(currentUser?.displayName || currentUser?.fullName, "คุณ");
  const myAvatar = currentUser?.photoURL || currentUser?.avatarUrl || "";

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: window.innerWidth <= 768 ? "1fr" : "330px minmax(0, 1fr)",
      minHeight: "560px",
      height: "calc(100vh - 220px)",
      background: "#fff",
      borderRadius: "12px",
      border: "1px solid #e5e9e3",
      boxShadow: "0 4px 14px rgba(0,0,0,0.06)",
      overflow: "hidden",
      maxWidth: "100%",
      boxSizing: "border-box"
    }}>
      {/* LEFT PANE: CONVERSATION LIST */}
      <div style={{
        borderRight: "1px solid #e5e9e3",
        display: (window.innerWidth <= 768 && mobileShowThread) ? "none" : "flex",
        flexDirection: "column",
        background: "#fcfdfc"
      }}>
        {/* Search header */}
        <div style={{ padding: "16px", borderBottom: "1px solid #e5e9e3" }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            background: "#f0f3ef",
            borderRadius: "20px",
            padding: "8px 14px",
            gap: "8px"
          }}>
            <i className="fa-solid fa-magnifying-glass" style={{ color: "#888", fontSize: "13px" }}></i>
            <input
              type="text"
              placeholder="ค้นหาชื่อคนคุย หรือชื่อหอพัก..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                border: "none",
                background: "transparent",
                outline: "none",
                width: "100%",
                fontSize: "13px",
                fontFamily: "inherit"
              }}
            />
            {searchTerm && (
              <i
                className="fa-solid fa-xmark"
                onClick={() => setSearchTerm("")}
                style={{ color: "#999", cursor: "pointer", fontSize: "13px" }}
              ></i>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto" }}>
          {loadingConvs ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> กำลังโหลดข้อความ...
            </div>
          ) : filteredConversations.length === 0 ? (
            <div style={{ padding: "40px 20px", textAlign: "center", color: "#888" }}>
              <i className="fa-regular fa-comments" style={{ fontSize: "36px", color: "#ccc", marginBottom: "12px" }}></i>
              <p style={{ fontSize: "14px", margin: "4px 0", fontWeight: 500 }}>ยังไม่มีประวัติแชท</p>
              <p style={{ fontSize: "12px", color: "#aaa" }}>
                {defaultRole === "owner"
                  ? "เมื่อมีผู้เช่าทักสอบถาม ข้อความจะขึ้นตรงนี้ครับ"
                  : "กดปุ่ม 'ทักแชทสอบถาม' ที่หน้าหอพัก เพื่อเริ่มคุยกับเจ้าของหอได้เลย"}
              </p>
            </div>
          ) : (
            filteredConversations.map((c) => {
              const isSelected = activePartner?.otherUserId === c.otherUserId;
              const role = c.otherUserRole || "user";
              const roleText = role === "owner" ? "เจ้าของหอ" : role === "admin" ? "แอดมิน" : "ผู้เช่า";
              const roleBg = role === "owner" ? "#e0f2fe" : role === "admin" ? "#f3e8ff" : "#f0fdf4";
              const roleColor = role === "owner" ? "#0369a1" : role === "admin" ? "#7e22ce" : "#15803d";

              return (
                <div
                  key={c.otherUserId}
                  onClick={() => {
                    setActivePartner(c);
                    setMobileShowThread(true);
                  }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    padding: "14px 16px",
                    borderBottom: "1px solid #f0f3ef",
                    cursor: "pointer",
                    background: isSelected ? "#eef6ee" : "transparent",
                    borderLeft: isSelected ? "4px solid #7da27c" : "4px solid transparent",
                    transition: "background 0.15s"
                  }}
                >
                  {/* รูปโปรไฟล์แสดงทุกบทบาท */}
                  {renderAvatar(c.otherUserAvatar, c.otherUserName, role, 44)}

                  {/* Info */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "3px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        <strong style={{ fontSize: "14px", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.otherUserName || "ผู้ใช้งาน"}
                        </strong>
                        <span style={{
                          fontSize: "10px",
                          padding: "1px 6px",
                          borderRadius: "8px",
                          background: roleBg,
                          color: roleColor,
                          fontWeight: 600,
                          flexShrink: 0
                        }}>
                          {roleText}
                        </span>
                      </div>
                      {c.lastMessageTime && (
                        <span style={{ fontSize: "11px", color: "#999", flexShrink: 0, marginLeft: "6px" }}>
                          {new Date(c.lastMessageTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      )}
                    </div>

                    {c.dormitoryName && (
                      <div style={{
                        fontSize: "11px",
                        color: "#5f8e5e",
                        marginBottom: "3px",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px"
                      }}>
                        <i className="fa-solid fa-building" style={{ fontSize: "10px" }}></i>
                        <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {c.dormitoryName}
                        </span>
                      </div>
                    )}

                    <div style={{
                      fontSize: "12px",
                      color: c.unreadCount > 0 ? "#333" : "#777",
                      fontWeight: c.unreadCount > 0 ? 600 : 400,
                      whiteSpace: "nowrap",
                      overflow: "hidden",
                      textOverflow: "ellipsis"
                    }}>
                      {c.lastMessage || "เริ่มการสนทนา"}
                    </div>
                  </div>

                  {c.unreadCount > 0 && (
                    <span style={{
                      background: "#7da27c",
                      color: "#fff",
                      borderRadius: "10px",
                      padding: "2px 7px",
                      fontSize: "11px",
                      fontWeight: 700
                    }}>
                      {c.unreadCount}
                    </span>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* RIGHT PANE: ACTIVE CHAT THREAD */}
      <div style={{
        display: (window.innerWidth <= 768 && !mobileShowThread) ? "none" : "flex",
        flexDirection: "column",
        height: "100%",
        minHeight: 0,
        minWidth: 0,
        maxWidth: "100%",
        overflow: "hidden",
        boxSizing: "border-box",
        background: "#fff"
      }}>
        {activePartner ? (
          <>
            {/* Header */}
            <div style={{
              padding: "14px 20px",
              borderBottom: "1px solid #e5e9e3",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              maxWidth: "100%",
              boxSizing: "border-box"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
                {/* Mobile Back Button */}
                <button
                  type="button"
                  onClick={() => setMobileShowThread(false)}
                  style={{
                    display: window.innerWidth <= 768 ? "flex" : "none",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "none",
                    border: "none",
                    fontSize: "18px",
                    color: "#666",
                    cursor: "pointer",
                    padding: "4px"
                  }}
                  title="กลับไปหน้ารายการแชท"
                >
                  <i className="fa-solid fa-arrow-left"></i>
                </button>

                {/* รูปโปรไฟล์ของคู่สนทนาใน Header */}
                {renderAvatar(activePartner.otherUserAvatar, activePartner.otherUserName, activePartner.otherUserRole || "user", 42)}

                <div style={{ minWidth: 0 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <h4 style={{ margin: 0, fontSize: "15px", color: "#333", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {cleanName(activePartner.otherUserName, "ผู้ใช้งาน")}
                    </h4>
                    <span style={{
                      fontSize: "11px",
                      padding: "1px 7px",
                      borderRadius: "10px",
                      background: activePartner.otherUserRole === "owner" ? "#e0f2fe" : activePartner.otherUserRole === "admin" ? "#f3e8ff" : "#f0fdf4",
                      color: activePartner.otherUserRole === "owner" ? "#0369a1" : activePartner.otherUserRole === "admin" ? "#7e22ce" : "#15803d",
                      fontWeight: 600
                    }}>
                      {activePartner.otherUserRole === "owner" ? "เจ้าของหอพัก" : activePartner.otherUserRole === "admin" ? "ผู้ดูแลระบบ" : "ผู้เช่า"}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "12px", color: "#2e7d32", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#22c55e", display: "inline-block" }}></span>
                      ออนไลน์
                    </span>
                    {activePartner.dormitoryName && (
                      <span style={{
                        fontSize: "11px",
                        background: "#eef6ee",
                        color: "#2e7d32",
                        padding: "1px 8px",
                        borderRadius: "10px",
                        whiteSpace: "nowrap"
                      }}>
                        หอพัก: {activePartner.dormitoryName}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {activePartner.dormitoryId && (
                <Link
                  to={`/dorms/${activePartner.dormitoryId}`}
                  style={{
                    textDecoration: "none",
                    color: "#7da27c",
                    fontSize: "13px",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    padding: "6px 12px",
                    borderRadius: "6px",
                    border: "1px solid #7da27c",
                    flexShrink: 0
                  }}
                >
                  <i className="fa-solid fa-building"></i>
                  <span>ดูหน้าหอพัก</span>
                </Link>
              )}
            </div>

            {/* Quick Greeting Chips */}
            {messages.length === 0 && (
              <div style={{
                padding: "10px 16px",
                background: "#f8faf7",
                borderBottom: "1px solid #eef2ed",
                display: "flex",
                gap: "8px",
                overflowX: "auto"
              }}>
                {[
                  "สวัสดีครับ สนใจห้องพักครับ",
                  "ตอนนี้ยังมีห้องว่างอยู่ไหมครับ",
                  "สะดวกนัดเข้าไปดูห้องช่วงไหนได้บ้างครับ",
                  "มีค่ามัดจำและสัญญาเช่ากี่เดือนครับ"
                ].map((chip, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleQuickReply(chip)}
                    style={{
                      whiteSpace: "nowrap",
                      padding: "5px 12px",
                      background: "#fff",
                      border: "1px solid #cfe2ce",
                      borderRadius: "16px",
                      fontSize: "12px",
                      color: "#2e7d32",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    💬 {chip}
                  </button>
                ))}
              </div>
            )}

            {/* Messages stream (มี ref สำหรับเลื่อนเฉพาะกล่องนี้ ไม่เลื่อนหน้าจอ) */}
            <div
              ref={messagesContainerRef}
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: "auto",
                overflowX: "hidden",
                padding: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "14px",
                background: "#f9fbf8",
                width: "100%",
                maxWidth: "100%",
                boxSizing: "border-box"
              }}
            >
              {loadingMessages ? (
                <div style={{ textAlign: "center", padding: "40px", color: "#7da27c" }}>
                  <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "8px" }}></i> กำลังโหลดข้อความ...
                </div>
              ) : messages.length === 0 ? (
                <div style={{ textAlign: "center", padding: "60px 20px", color: "#888" }}>
                  <i className="fa-solid fa-comments" style={{ fontSize: "40px", color: "#bbf7d0", marginBottom: "14px" }}></i>
                  <h4 style={{ color: "#444", marginBottom: "6px" }}>เริ่มคุยกับคุณ {cleanName(activePartner.otherUserName, "คู่สนทนา")}</h4>
                  <p style={{ fontSize: "13px", color: "#777" }}>
                    พิมพ์ข้อความ หรือกดเลือกคำถามด้านบนเพื่อสอบถามได้เลยครับ
                  </p>
                </div>
              ) : (
                messages.map((msg) => {
                  const isMine = msg.sender_id === currentUserId;
                  const timeFormatted = msg.created_at
                    ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                    : "";

                  const senderName = isMine
                    ? myDisplayName
                    : cleanName(msg.sender_name || activePartner.otherUserName, "คู่สนทนา");
                  const senderAvatar = isMine
                    ? myAvatar
                    : (msg.sender_avatar || activePartner.otherUserAvatar || "");
                  const senderRole = isMine
                    ? (userRole || "user")
                    : (msg.sender_role || activePartner.otherUserRole || "user");

                  const roleText = senderRole === "owner" ? "เจ้าของหอพัก" : senderRole === "admin" ? "แอดมิน" : "ผู้เช่า";
                  const roleBg = senderRole === "owner" ? "#e0f2fe" : senderRole === "admin" ? "#f3e8ff" : "#f0fdf4";
                  const roleColor = senderRole === "owner" ? "#0369a1" : senderRole === "admin" ? "#7e22ce" : "#15803d";

                  return (
                    <div
                      key={msg.id}
                      style={{
                        display: "flex",
                        flexDirection: isMine ? "row-reverse" : "row",
                        alignItems: "flex-end",
                        gap: "10px",
                        maxWidth: "78%",
                        minWidth: 0,
                        alignSelf: isMine ? "flex-end" : "flex-start",
                        boxSizing: "border-box"
                      }}
                    >
                      {/* รูปโปรไฟล์แสดงทุกบทบาทข้างข้อความ */}
                      <div style={{ marginBottom: "18px", flexShrink: 0 }}>
                        {renderAvatar(senderAvatar, senderName, senderRole, 34)}
                      </div>

                      {/* กล่องข้อความและข้อมูลผู้ส่ง */}
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: isMine ? "flex-end" : "flex-start",
                        minWidth: 0,
                        maxWidth: "100%",
                        boxSizing: "border-box"
                      }}>
                        {/* ชื่อและบทบาทผู้ส่ง (ไม่ใช้อีเมล) */}
                        <div style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "6px",
                          marginBottom: "4px",
                          paddingLeft: isMine ? 0 : "4px",
                          paddingRight: isMine ? "4px" : 0
                        }}>
                          <span style={{
                            fontSize: "12px",
                            fontWeight: 600,
                            color: isMine ? "#2e7d32" : "#333"
                          }}>
                            {isMine ? `${senderName} (คุณ)` : senderName}
                          </span>
                          {!isMine && (
                            <span style={{
                              fontSize: "10px",
                              padding: "1px 6px",
                              borderRadius: "8px",
                              background: roleBg,
                              color: roleColor,
                              fontWeight: 600
                            }}>
                              {roleText}
                            </span>
                          )}
                        </div>

                        {/* บับเบิ้ลข้อความ */}
                        <div style={{
                          padding: "10px 15px",
                          borderRadius: isMine ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                          background: isMine ? "#7da27c" : "#ffffff",
                          color: isMine ? "#ffffff" : "#333333",
                          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
                          border: isMine ? "none" : "1px solid #e2e8e0",
                          fontSize: "14px",
                          lineHeight: "1.5",
                          wordBreak: "break-word",
                          overflowWrap: "anywhere",
                          whiteSpace: "pre-wrap",
                          maxWidth: "100%",
                          boxSizing: "border-box"
                        }}>
                          {msg.message}
                        </div>

                        {/* เวลา และสถานะการอ่าน */}
                        <div style={{
                          fontSize: "11px",
                          color: "#999",
                          marginTop: "3px",
                          padding: "0 4px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}>
                          <span>{timeFormatted}</span>
                          {isMine && (
                            <i
                              className={msg.is_read ? "fa-solid fa-check-double" : "fa-solid fa-check"}
                              style={{ color: msg.is_read ? "#22c55e" : "#aaa", fontSize: "10px" }}
                              title={msg.is_read ? "อ่านแล้ว" : "ส่งแล้ว"}
                            ></i>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} style={{
              padding: "14px 18px",
              borderTop: "1px solid #e5e9e3",
              background: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              width: "100%",
              maxWidth: "100%",
              boxSizing: "border-box"
            }}>
              <input
                type="text"
                placeholder="พิมพ์ข้อความที่นี่... (กด Enter เพื่อส่ง)"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                disabled={sending}
                style={{
                  flex: 1,
                  minWidth: 0,
                  width: "100%",
                  padding: "11px 16px",
                  border: "1.5px solid #d4ded3",
                  borderRadius: "24px",
                  fontSize: "14px",
                  fontFamily: "inherit",
                  outline: "none",
                  boxSizing: "border-box",
                  transition: "border-color 0.2s"
                }}
              />

              <button
                type="submit"
                disabled={sending || !inputText.trim()}
                style={{
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: (!inputText.trim() || sending) ? "#ccc" : "#7da27c",
                  color: "#fff",
                  border: "none",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: (!inputText.trim() || sending) ? "not-allowed" : "pointer",
                  fontSize: "16px",
                  flexShrink: 0,
                  transition: "background 0.2s"
                }}
                title="ส่งข้อความ"
              >
                {sending ? (
                  <i className="fa-solid fa-spinner fa-spin"></i>
                ) : (
                  <i className="fa-solid fa-paper-plane"></i>
                )}
              </button>
            </form>
          </>
        ) : (
          <div style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            color: "#888",
            padding: "40px"
          }}>
            <div style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "#eef6ee",
              color: "#7da27c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              marginBottom: "18px"
            }}>
              <i className="fa-solid fa-comments"></i>
            </div>
            <h3 style={{ color: "#444", marginBottom: "8px" }}>กล่องข้อความ</h3>
            <p style={{ fontSize: "14px", textAlign: "center", maxWidth: "400px", lineHeight: "1.6" }}>
              เลือกรายชื่อทางซ้ายมือ หรือกดปุ่ม <strong>ทักแชทสอบถาม</strong> จากหน้าหอพักเพื่อเริ่มคุยได้เลยครับ
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
