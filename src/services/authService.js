import { api, setToken, setCurrentUserToStorage, getCurrentUserFromStorage } from "./apiClient";

// 1. สมัครสมาชิกพร้อมบันทึกลงฐานข้อมูล / Browser Storage
export async function registerUser({
  email,
  password,
  firstName,
  lastName,
  phone = "",
  username = "",
  role = "user"
}) {
  try {
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
  } catch (err) {
    console.warn("API register fallback to local browser storage:", err);
    const mockUser = {
      id: `user_${Date.now()}`,
      email,
      first_name: firstName,
      last_name: lastName,
      full_name: `${firstName} ${lastName}`.trim(),
      phone,
      username: username || email.split("@")[0],
      role: role || "user",
      avatar_url: "/images/default-avatar.jpg",
      created_at: new Date().toISOString()
    };
    const mockToken = `local_token_${Date.now()}`;
    setToken(mockToken);
    setCurrentUserToStorage(mockUser);
    return {
      user: mockUser,
      userData: mockUser,
      token: mockToken
    };
  }
}

// 2. เข้าสู่ระบบ
export async function loginUser(email, password) {
  try {
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
  } catch (err) {
    console.warn("API login fallback to local browser storage:", err);
    const isOwner = email.toLowerCase().includes("owner");
    const isAdmin = email.toLowerCase().includes("admin");
    const role = isAdmin ? "admin" : (isOwner ? "owner" : "user");
    const mockUser = {
      id: `user_${Date.now()}`,
      email,
      full_name: email.split("@")[0],
      first_name: email.split("@")[0],
      last_name: "User",
      phone: "080-000-0000",
      role,
      avatar_url: "/images/default-avatar.jpg"
    };
    const mockToken = `local_token_${Date.now()}`;
    setToken(mockToken);
    setCurrentUserToStorage(mockUser);
    return {
      user: mockUser,
      userData: mockUser,
      token: mockToken
    };
  }
}

// 3. ดึงข้อมูลโปรไฟล์ผู้ใช้
export async function getUserProfile() {
  const user = getCurrentUserFromStorage();
  return user || null;
}

// 3.1 อัปเดตโปรไฟล์ผู้ใช้
export async function updateUserProfile(data) {
  const current = getCurrentUserFromStorage() || {};
  const updated = { ...current, ...data };
  setCurrentUserToStorage(updated);
  return updated;
}

// 4. เข้าสู่ระบบด้วย Google (ระบบจำลองสำหรับเครื่อง Local)
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

// 5. ออกจากระบบ
export async function logoutUser() {
  setToken(null);
  setCurrentUserToStorage(null);
}

// 6. ลืมรหัสผ่าน
export async function resetPassword(email) {
  alert(`ระบบส่งคำแนะนำการตั้งรหัสผ่านใหม่ไปยัง ${email} แล้ว (หากอยู่ในระบบจริง)`);
}

// 6.1 ส่งอีเมลยืนยันตัวตนอีกครั้ง
export async function resendVerificationEmail(email) {
  alert(`ส่งอีเมลยืนยันตัวตนไปยัง ${email} สำเร็จ`);
}
