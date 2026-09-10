import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { getDormitoriesByOwner } from "../../services/dormitoryService";
import { getRoomsByDormitory, createRoom, updateRoomStatus, deleteRoom } from "../../services/roomService";

export default function OwnerRooms() {
  const { currentUser } = useAuth();
  const [dorms, setDorms] = useState([]);
  const [selectedDormId, setSelectedDormId] = useState("");
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Room Modal
  const [modalOpen, setModalOpen] = useState(false);
  const [newRoom, setNewRoom] = useState({
    roomNumber: "",
    roomType: "ห้องแอร์",
    price: "",
    status: "available"
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function loadDorms() {
      if (!currentUser) return;
      try {
        const ownerId = currentUser.id || currentUser.uid;
        const dormList = await getDormitoriesByOwner(ownerId);
        setDorms(dormList);
        if (dormList.length > 0) {
          setSelectedDormId(dormList[0].id);
        }
      } catch (err) {
        console.error("Error loading dorms for rooms:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDorms();
  }, [currentUser]);

  const loadRooms = async (dormId) => {
    if (!dormId) return;
    try {
      const roomList = await getRoomsByDormitory(dormId);
      setRooms(roomList);
    } catch (err) {
      console.error("Error loading rooms:", err);
    }
  };

  useEffect(() => {
    if (selectedDormId) {
      loadRooms(selectedDormId);
    }
  }, [selectedDormId]);

  const handleAddRoom = async (e) => {
    e.preventDefault();
    if (!selectedDormId) {
      alert("กรุณาเลือกหอพักก่อนเพิ่มห้อง");
      return;
    }

    setSubmitting(true);
    try {
      const ownerId = currentUser.id || currentUser.uid;
      await createRoom({
        dormitoryId: selectedDormId,
        ownerId: ownerId,
        roomNumber: newRoom.roomNumber,
        roomType: newRoom.roomType,
        price: Number(newRoom.price) || 0,
        status: newRoom.status
      });

      setModalOpen(false);
      setNewRoom({ roomNumber: "", roomType: "ห้องแอร์", price: "", status: "available" });
      loadRooms(selectedDormId);
    } catch (err) {
      console.error("Error adding room:", err);
      alert("ไม่สามารถเพิ่มห้องพักได้");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeStatus = async (roomId, newStatus) => {
    try {
      setRooms((prevRooms) =>
        prevRooms.map((r) => (r.id === roomId ? { ...r, status: newStatus } : r))
      );
      await updateRoomStatus(roomId, newStatus);
      await loadRooms(selectedDormId);
    } catch (err) {
      console.error("Error updating room status:", err);
      alert("ไม่สามารถอัปเดตสถานะห้องพักได้");
      loadRooms(selectedDormId);
    }
  };

  const handleDeleteRoom = async (roomId) => {
    if (window.confirm("คุณต้องการลบห้องนี้ใช่หรือไม่?")) {
      try {
        await deleteRoom(roomId);
        loadRooms(selectedDormId);
      } catch (err) {
        console.error("Error deleting room:", err);
      }
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", color: "#333", fontWeight: 700 }}>จัดการห้องพัก</h1>
          <p style={{ color: "#777", fontSize: "14px" }}>กำหนดหมายเลขห้อง ราคา และสถานะความว่างของห้อง</p>
        </div>

        {dorms.length > 0 && (
          <button className="btn-primary-action" onClick={() => setModalOpen(true)}>
            <i className="fa-solid fa-plus"></i> เพิ่มห้องพัก
          </button>
        )}
      </div>

      {/* Select Dormitory dropdown */}
      {dorms.length > 0 && (
        <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <label style={{ fontWeight: 600, color: "#444" }}>เลือกหอพัก:</label>
          <select
            value={selectedDormId}
            onChange={(e) => setSelectedDormId(e.target.value)}
            style={{ padding: "8px 14px", borderRadius: "6px", border: "1px solid #7da27c", fontSize: "15px" }}
          >
            {dorms.map((dorm) => (
              <option key={dorm.id} value={dorm.id}>{dorm.name} ({dorm.district})</option>
            ))}
          </select>
        </div>
      )}

      <div className="content-card">
        <div className="content-card-body" style={{ padding: 0 }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "60px 0", color: "#7da27c" }}>
              <i className="fa-solid fa-spinner fa-spin"></i> กำลังโหลดห้องพัก...
            </div>
          ) : dorms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-hotel" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
              <h3 style={{ color: "#555" }}>คุณยังไม่มีหอพักสำหรับจัดการห้อง</h3>
              <p style={{ color: "#888", marginTop: "8px" }}>กรุณาลงประกาศหอพักก่อนเพิ่มห้องพัก</p>
            </div>
          ) : rooms.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <i className="fa-solid fa-bed" style={{ fontSize: "48px", color: "#ccc", marginBottom: "16px" }}></i>
              <h3 style={{ color: "#555" }}>ยังไม่มีห้องพักในหอพักนี้</h3>
              <p style={{ color: "#888", marginTop: "8px", marginBottom: "16px" }}>คลิกปุ่มเพิ่มห้องพักเพื่อเริ่มต้นใส่หมายเลขห้อง</p>
              <button className="btn-primary-action" onClick={() => setModalOpen(true)}>
                <i className="fa-solid fa-plus"></i> เพิ่มห้องพักแรก
              </button>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>หมายเลขห้อง</th>
                    <th>ประเภทห้อง</th>
                    <th>ราคา (บาท/เดือน)</th>
                    <th>สถานะปัจจุบัน</th>
                    <th>เปลี่ยนสถานะ</th>
                    <th>ลบ</th>
                  </tr>
                </thead>
                <tbody>
                  {rooms.map((room) => (
                    <tr key={room.id}>
                      <td><strong>ห้อง {room.roomNumber}</strong></td>
                      <td>{room.roomType}</td>
                      <td>{Number(room.price).toLocaleString()} บาท</td>
                      <td>
                        <span className={`status-badge ${room.status}`}>
                          {room.status === "available" ? "ห้องว่าง" :
                           room.status === "reserved" ? "จองแล้ว" : "ไม่ว่าง / มีผู้เช่า"}
                        </span>
                      </td>
                      <td>
                        <select
                          value={room.status}
                          onChange={(e) => handleChangeStatus(room.id, e.target.value)}
                          style={{ padding: "4px 8px", borderRadius: "4px", border: "1px solid #ccc", fontSize: "13px" }}
                        >
                          <option value="available">ห้องว่าง</option>
                          <option value="reserved">จองแล้ว</option>
                          <option value="occupied">มีผู้เช่าแล้ว</option>
                        </select>
                      </td>
                      <td>
                        <button
                          className="btn-icon delete"
                          onClick={() => handleDeleteRoom(room.id)}
                          title="ลบห้อง"
                        >
                          <i className="fa-solid fa-trash-can"></i>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Add Room Modal */}
      {modalOpen && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0,0,0,0.5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 10000,
          padding: "20px"
        }}>
          <div style={{ background: "#fff", width: "100%", maxWidth: "450px", borderRadius: "10px", padding: "24px" }}>
            <h3 style={{ fontSize: "18px", marginBottom: "18px" }}>เพิ่มห้องพักใหม่</h3>
            <form onSubmit={handleAddRoom}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>หมายเลขห้อง <span>*</span></label>
                <input
                  type="text"
                  required
                  placeholder="เช่น 101, A203"
                  value={newRoom.roomNumber}
                  onChange={(e) => setNewRoom({ ...newRoom, roomNumber: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>ประเภทห้อง</label>
                <select
                  value={newRoom.roomType}
                  onChange={(e) => setNewRoom({ ...newRoom, roomType: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="ห้องพัดลม">ห้องพัดลม</option>
                  <option value="ห้องแอร์">ห้องแอร์</option>
                  <option value="ห้องสตูดิโอ">ห้องสตูดิโอ</option>
                  <option value="ห้องชุด">ห้องชุด</option>
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>ราคา (บาท/เดือน) <span>*</span></label>
                <input
                  type="number"
                  required
                  placeholder="เช่น 3500"
                  value={newRoom.price}
                  onChange={(e) => setNewRoom({ ...newRoom, price: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ display: "block", marginBottom: "6px", fontSize: "14px", fontWeight: 600 }}>สถานะห้อง</label>
                <select
                  value={newRoom.status}
                  onChange={(e) => setNewRoom({ ...newRoom, status: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #ccc" }}
                >
                  <option value="available">ห้องว่าง (Available)</option>
                  <option value="reserved">จองแล้ว (Reserved)</option>
                  <option value="occupied">มีผู้เช่าแล้ว (Occupied)</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  style={{ padding: "8px 16px", border: "1px solid #ccc", background: "#fff", borderRadius: "6px", cursor: "pointer" }}
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary-action"
                  style={{ padding: "8px 20px" }}
                >
                  {submitting ? "กำลังบันทึก..." : "เพิ่มห้อง"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
