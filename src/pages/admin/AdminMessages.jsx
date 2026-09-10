import ChatBox from "../../components/chat/ChatBox";

export default function AdminMessages() {
  return (
    <div>
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>แชทข้อความ (ผู้ดูแลระบบ)</h1>
        <p style={{ color: "#777", fontSize: "14px" }}>พูดคุยสื่อสารกับผู้เช่าและเจ้าของหอพักในระบบ</p>
      </div>

      <ChatBox defaultRole="admin" />
    </div>
  );
}
