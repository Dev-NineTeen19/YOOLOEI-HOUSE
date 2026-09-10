import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function ProtectedRoute({ allowedRoles = [] }) {
  const { currentUser, userRole, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "60vh",
        fontSize: "18px",
        color: "#7da27c"
      }}>
        <i className="fa-solid fa-spinner fa-spin" style={{ marginRight: "10px", fontSize: "24px" }}></i>
        กำลังโหลดข้อมูล...
      </div>
    );
  }

  // 1. ถ้ายังไม่ได้ Login ให้ไปหน้า Login
  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 2. ถ้าอนุญาตทุก Role ที่ล็อกอินแล้ว หรือ Role ของผู้ใช้ตรงกับที่อนุญาต
  if (allowedRoles.length === 0 || allowedRoles.includes(userRole)) {
    return <Outlet />;
  }

  // 3. ถ้า Role ไม่ตรงกับสิทธิ์ที่ต้องการ ป้องกันการเข้าถึงและส่งไปยัง Dashboard ของตนเอง
  if (userRole === "admin") {
    return <Navigate to="/admin/dashboard" replace />;
  } else if (userRole === "owner") {
    return <Navigate to="/owner/dashboard" replace />;
  } else {
    return <Navigate to="/user/dashboard" replace />;
  }
}
