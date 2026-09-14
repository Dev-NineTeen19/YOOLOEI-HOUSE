import { api, setToken, setCurrentUserToStorage, getCurrentUserFromStorage } from "./apiClient";

// 1. สมัครสมาชิกพร้อมบันทึกลงฐานข้อมูล SQLite
export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  phone = "",
  username = "",
  role = "user"
}) {
  const res = await api.post("/auth/register", {
    email,
    password,
    firstName,
    lastName,
    phone,
    username,
    role
  });

  if (res.token) {
    setToken(res.token);
  }
  if (res.user) {
    setCurrentUserToStorage(res.user);
  }

  return {
    user: res.user,
    userData: res.user,
    session: res.token ? { access_token: res.token } : null
  };
}

// 2. เข้าสู่ระบบ
export async function loginUser(email, password) {
  const res = await api.post("/auth/login", { email, password });

  if (res.token) {
    setToken(res.token);
  }
  if (res.user) {
    setCurrentUserToStorage(res.user);
  }

  return {
    user: res.user,
    userData: res.user,
    token: res.token
  };
}

// 3. เข้าสู่ระบบด้วย Google (ระบบจำลองสำหรับเครื่อง Local)
export async function loginWithGoogle(defaultRole = "user") {
  const mockEmail = `user_${Date.now()}@gmail.com`;
  return registerUser({
    email: mockEmail,
    password: "GoogleAuthUser123!",
    firstName: "ผู้ใช้",
    lastName: "Google",
    username: `google_user_${Date.now().toString().slice(-4)}`,
    role: defaultRole
  });
}

// 4. ออกจากระบบ
export async function logoutUser() {
  setToken(null);
  setCurrentUserToStorage(null);
}

// 5. ลืมรหัสผ่าน
export async function resetPassword(email) {
  alert(`ระบบส่งคำแนะนำการตั้งรหัสผ่านใหม่ไปยัง ${email} แล้ว (หากอยู่ในระบบจริง)`);
}

// 5.1 ส่งอีเมลยืนยันตัวตนอีกครั้ง
export async function resendVerificationEmail(email) {
  return true;
}

// 6. ดึงข้อมูล Profile ปัจจุบันจาก SQLite
export async function getUserProfile(uid) {
  try {
    const res = await api.get("/auth/me");
    return res.user || getCurrentUserFromStorage();
  } catch (err) {
    console.warn("Could not fetch current profile:", err);
    return getCurrentUserFromStorage();
  }
}

// 7. อัปเดตข้อมูล Profile ผู้ใช้งาน (ทำได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!)
export async function updateUserProfile(uid, data) {
  const res = await api.put("/auth/profile", data);
  if (res.user) {
    setCurrentUserToStorage(res.user);
  }
  return res.user;
}
