import ChatBox from "../../components/chat/ChatBox";

export default function UserMessages() {
  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>แชทข้อความ</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>พูดคุยสอบถามข้อมูลห้องพักกับเจ้าของหอได้โดยตรง</p>
      </div>

      <ChatBox defaultRole="user" />
    </div>
  );
}
