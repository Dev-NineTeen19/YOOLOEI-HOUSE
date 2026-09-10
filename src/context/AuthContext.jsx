import { createContext, useContext, useState, useEffect } from "react";
import {
  loginUser,
  registerUser,
  loginWithGoogle,
  logoutUser,
  resetPassword,
  getUserProfile,
  updateUserProfile
} from "../services/authService";
import { getToken, getCurrentUserFromStorage, setCurrentUserToStorage } from "../services/apiClient";

const AuthContext = createContext(null);

function normalizeUser(u) {
  if (!u) return null;
  const id = u.id || u.uid;
  const avatar = u.avatarUrl || u.photoURL || u.avatar_url || "";
  let displayName = u.displayName || u.full_name || u.fullName || "";
  if (!displayName || displayName.includes("@")) {
    const fullName = `${u.first_name || u.firstName || ""} ${u.last_name || u.lastName || ""}`.trim();
    displayName = fullName || u.username || (u.email ? u.email.split("@")[0] : "ผู้ใช้งาน");
  }
  return {
    ...u,
    id,
    uid: id,
    avatarUrl: avatar,
    photoURL: avatar,
    displayName
  };
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  // โหลดและตรวจสอบ Session ปัจจุบันจาก Local Token
  useEffect(() => {
    async function initAuth() {
      try {
        const token = getToken();
        if (token) {
          const cachedUser = getCurrentUserFromStorage();
          if (cachedUser) {
            const normalized = normalizeUser(cachedUser);
            setCurrentUser(normalized);
            setUserData(normalized);
          }
          // ดึงข้อมูลล่าสุดจาก SQLite Server
          const profile = await getUserProfile();
          if (profile) {
            const normalized = normalizeUser(profile);
            setCurrentUser(normalized);
            setUserData(normalized);
            setCurrentUserToStorage(normalized);
          }
        }
      } catch (err) {
        console.error("Auth init error:", err);
      } finally {
        setLoading(false);
      }
    }

    initAuth();
  }, []);

  const handleLogin = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.user) {
      const normalized = normalizeUser(res.user);
      setCurrentUser(normalized);
      setUserData(normalized);
      setCurrentUserToStorage(normalized);
    }
    return res;
  };

  const handleRegister = async (data) => {
    const res = await registerUser(data);
    if (res.user) {
      const normalized = normalizeUser(res.user);
      setCurrentUser(normalized);
      setUserData(normalized);
      setCurrentUserToStorage(normalized);
    }
    return res;
  };

  const handleLogout = async () => {
    await logoutUser();
    setCurrentUser(null);
    setUserData(null);
  };

  const userRole = userData?.role || (currentUser ? "user" : "guest");

  const value = {
    currentUser,
    userData,
    userRole,
    loading,
    login: handleLogin,
    register: handleRegister,
    loginWithGoogle,
    logout: handleLogout,
    resetPassword,
    updateProfile: async (data) => {
      if (!currentUser) return;
      const updated = await updateUserProfile(currentUser.id, data);
      if (updated) {
        const normalized = normalizeUser({ ...currentUser, ...updated });
        setCurrentUser(normalized);
        setUserData(normalized);
        setCurrentUserToStorage(normalized);
      }
    }
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
