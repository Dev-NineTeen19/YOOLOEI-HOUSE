import ChatBox from "../../components/chat/ChatBox";

export default function OwnerMessages() {
  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>แชทข้อความ</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>พูดคุยและตอบคำถามผู้เช่าที่สนใจหอพักของคุณ</p>
      </div>

      <ChatBox defaultRole="owner" />
    </div>
  );
}
