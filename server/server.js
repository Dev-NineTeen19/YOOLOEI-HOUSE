import express from "express";
import cors from "cors";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import multer from "multer";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { fileURLToPath } from "node:url";
import { db, initDatabase } from "./db.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || "yooloei_secret_key_2026";
const PORT = process.env.PORT || 5000;

// เริ่มต้นฐานข้อมูล SQLite (สร้างตารางและ Seed ข้อมูลตัวอย่าง)
initDatabase();

// อัปเกรดชื่อในข้อความเดิมที่บันทึกเป็นอีเมล ให้ใช้ชื่อจริงจาก users table
try {
  db.exec(`
    UPDATE messages
    SET sender_name = (SELECT COALESCE(full_name, username) FROM users WHERE users.id = messages.sender_id)
    WHERE sender_name LIKE '%@%' AND EXISTS (SELECT 1 FROM users WHERE users.id = messages.sender_id);

    UPDATE messages
    SET receiver_name = (SELECT COALESCE(full_name, username) FROM users WHERE users.id = messages.receiver_id)
    WHERE receiver_name LIKE '%@%' AND EXISTS (SELECT 1 FROM users WHERE users.id = messages.receiver_id);
  `);
} catch (e) {
  console.error("Message name migration error:", e.message);
}

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// เสิร์ฟโฟลเดอร์ uploads สำหรับเข้าถึงรูปภาพหอพักและโปรไฟล์
const uploadsDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadsDir));

// ตั้งค่า Multer สำหรับอัปโหลดไฟล์
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, "img-" + uniqueSuffix + ext);
  }
});
const upload = multer({ storage });

// Helper: ถอดรหัส Token สำหรับตรวจสอบสิทธิ์
function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ error: "กรุณาเข้าสู่ระบบก่อนทำรายการ" });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: "Session หมดอายุหรือไม่ถูกต้อง" });
    }
    req.user = user;
    next();
  });
}

// Optional Auth (ถ้ามี token จะดึง user มา ถ้าไม่มีก็ไม่ error)
function optionalAuth(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
}

// Helper แปลง JSON String ใน Dormitory กลับเป็น Array สำหรับส่งให้ Frontend
function formatDormitory(row) {
  if (!row) return null;
  return {
    ...row,
    amenities: safeParseJson(row.amenities),
    roomTypes: safeParseJson(row.room_types),
    images: safeParseJson(row.images),
    priceMin: row.price_min,
    priceMax: row.price_max,
    ownerId: row.owner_id,
    ownerName: row.owner_name,
    lineId: row.line_id,
    rating: Number(row.rating || 0),
    reviewCount: Number(row.review_count || 0),
    viewCount: Number(row.view_count || 0),
    favoriteCount: Number(row.favorite_count || 0),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function safeParseJson(str) {
  try {
    return typeof str === "string" ? JSON.parse(str) : (str || []);
  } catch {
    return [];
  }
}

// Helper: สร้างการแจ้งเตือน
function createNotification(userId, title, message, type = "system", link = "") {
  try {
    if (!userId) return;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO notifications (id, user_id, title, message, type, link, is_read, created_at)
      VALUES (?, ?, ?, ?, ?, ?, 0, ?)
    `).run(id, userId, title, message, type, link, now);
  } catch (err) {
    console.error("Create notification error:", err);
  }
}

function logSystemActivity(action, performedBy = "system", details = "", type = "system") {
  try {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO system_logs (id, action, details, performed_by, type, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(id, action, details, performedBy, type, now);
  } catch (err) {
    console.error("Error logging system activity:", err);
  }
}

// ==========================================
// 1. AUTHENTICATION & PROFILE APIS
// ==========================================

// สมัครสมาชิกใหม่ (ใช้งานได้ทันที 100% ไม่ต้องรอยืนยันอีเมล)
app.post("/api/auth/register", (req, res) => {
  try {
    const { email, password, firstName, lastName, phone, username, role = "user" } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    // ตรวจสอบว่ามีอีเมลนี้อยู่แล้วหรือไม่
    const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
    if (existing) {
      return res.status(400).json({ error: "อีเมลนี้ถูกใช้งานไปแล้วในระบบ" });
    }

    const userId = crypto.randomUUID();
    const passwordHash = bcrypt.hashSync(password, 10);
    const fullName = `${firstName || ""} ${lastName || ""}`.trim() || username || email.split("@")[0];
    const now = new Date().toISOString();
    const finalAvatar = "/images/default-avatar.jpg";

    const insert = db.prepare(`
      INSERT INTO users (id, email, password_hash, full_name, first_name, last_name, phone, username, role, avatar_url, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    insert.run(
      userId,
      email,
      passwordHash,
      fullName,
      firstName || "",
      lastName || "",
      phone || "",
      username || email.split("@")[0],
      role === "owner" ? "owner" : "user",
      finalAvatar,
      now,
      now
    );

    const user = {
      id: userId,
      email,
      fullName,
      firstName: firstName || "",
      lastName: lastName || "",
      phone: phone || "",
      username: username || email.split("@")[0],
      role: role === "owner" ? "owner" : "user"
    };

    const token = jwt.sign({ id: userId, email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    // 1. บันทึกกิจกรรมในระบบ (System Log) เมื่อมีผู้ใช้งานใหม่สมัครสมาชิก
    const roleTh = user.role === "admin" ? "ผู้ดูแลระบบ" : user.role === "owner" ? "เจ้าของหอพัก" : "ผู้เช่าหอพัก";
    const displayName = user.fullName || user.username || user.email;
    logSystemActivity(
      `ผู้ใช้งานใหม่ลงทะเบียน: ${displayName}`,
      displayName,
      `สมัครสมาชิกสำเร็จในบทบาท: ${roleTh} (อีเมล: ${user.email})`,
      "new_user"
    );

    // 2. ส่งการแจ้งเตือนไปยังผู้ดูแลระบบ (Admin) ทุกคนเสมอ
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    adminUsers.forEach((admin) => {
      createNotification(
        admin.id,
        `แจ้งเตือนสมาชิกใหม่!`,
        `มีผู้ใช้งานใหม่ '${displayName}' สมัครเข้าใช้งานระบบในบทบาท ${roleTh}`,
        "system",
        "/admin/logs"
      );
    });

    res.status(201).json({
      message: "สมัครสมาชิกสำเร็จ",
      token,
      user
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการสมัครสมาชิก: " + err.message });
  }
});

// เข้าสู่ระบบ
app.post("/api/auth/login", (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "กรุณากรอกอีเมลและรหัสผ่าน" });
    }

    const userRow = db.prepare("SELECT * FROM users WHERE email = ?").get(email);
    if (!userRow) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const match = bcrypt.compareSync(password, userRow.password_hash);
    if (!match) {
      return res.status(401).json({ error: "อีเมลหรือรหัสผ่านไม่ถูกต้อง" });
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      phone: userRow.phone,
      username: userRow.username,
      avatarUrl: userRow.avatar_url,
      role: userRow.role,
      displayName: userRow.full_name || userRow.username
    };

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: "7d" });

    res.json({
      message: "เข้าสู่ระบบสำเร็จ",
      user,
      token
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการเข้าสู่ระบบ: " + err.message });
  }
});

// ดึงข้อมูลผู้ใช้ปัจจุบัน (Current User / Me)
app.get("/api/auth/me", authenticateToken, (req, res) => {
  try {
    const userRow = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);
    if (!userRow) {
      return res.status(404).json({ error: "ไม่พบข้อมูลผู้ใช้" });
    }

    const user = {
      id: userRow.id,
      email: userRow.email,
      fullName: userRow.full_name,
      firstName: userRow.first_name,
      lastName: userRow.last_name,
      phone: userRow.phone,
      username: userRow.username,
      avatarUrl: userRow.avatar_url,
      role: userRow.role,
      displayName: userRow.full_name || userRow.username
    };

    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ผู้ใช้และเจ้าของหอพักอัปเดตข้อมูล Profile ของตนเองได้ตลอดเวลาโดยไม่ต้องรอแอดมิน!
app.put("/api/auth/profile", authenticateToken, (req, res) => {
  try {
    const { fullName, firstName, lastName, phone, avatarUrl, photoURL } = req.body;
    const now = new Date().toISOString();

    const nameToUpdate = fullName || `${firstName || ""} ${lastName || ""}`.trim();
    const finalAvatar = avatarUrl || photoURL;

    db.prepare(`
      UPDATE users
      SET full_name = COALESCE(?, full_name),
          first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          avatar_url = COALESCE(?, avatar_url),
          updated_at = ?
      WHERE id = ?
    `).run(nameToUpdate || null, firstName || null, lastName || null, phone || null, finalAvatar || null, now, req.user.id);

    const updatedUser = db.prepare("SELECT * FROM users WHERE id = ?").get(req.user.id);

    res.json({
      message: "อัปเดตข้อมูลส่วนตัวสำเร็จ",
      user: {
        id: updatedUser.id,
        uid: updatedUser.id,
        email: updatedUser.email,
        fullName: updatedUser.full_name,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        phone: updatedUser.phone,
        username: updatedUser.username,
        avatarUrl: updatedUser.avatar_url,
        photoURL: updatedUser.avatar_url,
        role: updatedUser.role,
        displayName: updatedUser.full_name || updatedUser.username
      }
    });
  } catch (err) {
    console.error("Update profile error:", err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตโปรไฟล์ได้: " + err.message });
  }
});

// อัปโหลดไฟล์รูปภาพ (สำหรับรูปโปรไฟล์, รูปหอพัก, รูปห้องพัก)
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "กรุณาเลือกไฟล์ที่ต้องการอัปโหลด" });
    }
    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: "อัปโหลดไฟล์สำเร็จ",
      url: fileUrl,
      filename: req.file.filename
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปโหลดไฟล์: " + err.message });
  }
});

// ==========================================
// 2. DORMITORIES APIS
// ==========================================

// ค้นหาและดึงหอพัก (Public / Filters)
app.get("/api/dormitories", optionalAuth, (req, res) => {
  try {
    const { district, name, priceRange, roomType, amenity, status, all } = req.query;

    let sql = "SELECT * FROM dormitories WHERE 1=1";
    const params = [];

    // หากไม่ใช่แอดมิน หรือไม่ได้ระบุ all=true จะดึงเฉพาะหอพักที่อนุมัติแล้ว (approved)
    if (!all || req.user?.role !== "admin") {
      sql += " AND status = 'approved'";
    } else if (status) {
      sql += " AND status = ?";
      params.push(status);
    }

    if (district && !district.startsWith("เลือก") && district !== "ทั้งหมด") {
      const cleanDistrict = district.replace(/ตำบล|\(.*\)/g, "").trim();
      sql += " AND (district LIKE ? OR address LIKE ? OR name LIKE ?)";
      params.push(`%${cleanDistrict}%`, `%${cleanDistrict}%`, `%${cleanDistrict}%`);
    }

    if (name) {
      sql += " AND (name LIKE ? OR description LIKE ?)";
      params.push(`%${name}%`, `%${name}%`);
    }

    sql += " ORDER BY created_at DESC";

    let dorms = db.prepare(sql).all(...params).map(formatDormitory);

    // กรองเพิ่มเติมระดับหน่วยความจำสำหรับ PriceRange, RoomType, Amenity
    if (priceRange && priceRange !== "เลือกราคา") {
      if (priceRange === "ต่ำกว่า 2,000 บาท") {
        dorms = dorms.filter((d) => (d.priceMin || 0) < 2000);
      } else if (priceRange === "2,000 - 3,000 บาท") {
        dorms = dorms.filter((d) => (d.priceMin || 0) >= 2000 && (d.priceMin || 0) <= 3000);
      } else if (priceRange === "3,000 - 5,000 บาท") {
        dorms = dorms.filter((d) => (d.priceMin || 0) >= 3000 && (d.priceMin || 0) <= 5000);
      } else if (priceRange === "มากกว่า 5,000 บาท") {
        dorms = dorms.filter((d) => (d.priceMin || 0) > 5000);
      }
    }

    if (roomType && roomType !== "เลือกประเภท") {
      dorms = dorms.filter((d) => d.roomTypes?.includes(roomType));
    }

    if (amenity) {
      dorms = dorms.filter((d) => d.amenities?.includes(amenity));
    }

    res.json({ dormitories: dorms });
  } catch (err) {
    console.error("Get dormitories error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ดึงรายละเอียดหอพักเดี่ยว + ห้องพัก + รีวิว
app.get("/api/dormitories/:id", (req, res) => {
  try {
    const dorm = db.prepare("SELECT * FROM dormitories WHERE id = ?").get(req.params.id);
    if (!dorm) {
      return res.status(404).json({ error: "ไม่พบข้อมูลหอพักนี้" });
    }

    const rooms = db.prepare("SELECT * FROM rooms WHERE dormitory_id = ?").all(dorm.id);
    const reviews = db.prepare("SELECT * FROM reviews WHERE dormitory_id = ? ORDER BY created_at DESC").all(dorm.id);

    res.json({
      dormitory: formatDormitory(dorm),
      rooms,
      reviews
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงหอพักของเจ้าของหอพัก (Owner)
app.get("/api/dormitories/owner/:ownerId", authenticateToken, (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const dorms = db.prepare("SELECT * FROM dormitories WHERE owner_id = ? ORDER BY created_at DESC").all(ownerId);
    res.json({ dormitories: dorms.map(formatDormitory) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพักลงประกาศหอพักใหม่ (สถานะเริ่มต้นเป็น 'pending' รอแอดมินอนุมัติ)
app.post("/api/dormitories", authenticateToken, (req, res) => {
  try {
    const ownerId = req.user.id;
    const {
      name, district, address, description, phone, lineId,
      priceMin, priceMax, amenities = [], roomTypes = [], images = [], ownerName
    } = req.body;

    if (!name || !district || !address) {
      return res.status(400).json({ error: "กรุณากรอกชื่อหอพัก อำเภอ และที่อยู่ให้ครบถ้วน" });
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO dormitories (
        id, owner_id, owner_name, name, district, address, description, phone, line_id,
        price_min, price_max, amenities, room_types, images, rating, review_count, view_count,
        favorite_count, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      ownerId,
      ownerName || req.user.fullName || "",
      name,
      district,
      address,
      description || "",
      phone || "",
      lineId || "",
      Number(priceMin) || 0,
      Number(priceMax) || Number(priceMin) || 0,
      JSON.stringify(amenities),
      JSON.stringify(roomTypes),
      JSON.stringify(images),
      0, 0, 0, 0,
      "pending", // การลงประกาศใหม่ต้องรอแอดมินอนุมัติ
      now,
      now
    );

    const created = db.prepare("SELECT * FROM dormitories WHERE id = ?").get(id);

    // แจ้งเตือนผู้ดูแลระบบ (Admin) ทุกคน เมื่อมีประกาศหอพักใหม่รอการอนุมัติ
    try {
      const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      for (const admin of adminUsers) {
        createNotification(
          admin.id,
          "มีหอพักใหม่รอการตรวจสอบและอนุมัติ",
          `หอพัก "${name}" โดยคุณ ${ownerName || req.user.fullName || 'เจ้าของหอ'} รอการตรวจสอบจากคุณ`,
          "dormitory",
          "/admin/dormitories"
        );
      }
    } catch (e) {
      console.error("Admin notification error:", e);
    }

    res.status(201).json({
      message: "ลงประกาศหอพักสำเร็จ รอการอนุมัติจากผู้ดูแลระบบ",
      dormitory: formatDormitory(created),
      id
    });
  } catch (err) {
    console.error("Create dorm error:", err);
    res.status(500).json({ error: "ไม่สามารถสร้างหอพักได้: " + err.message });
  }
});

// เจ้าของหอพักอัปเดตข้อมูลหอพักตนเองได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!
app.put("/api/dormitories/:id", authenticateToken, (req, res) => {
  try {
    const dormId = req.params.id;
    const dorm = db.prepare("SELECT * FROM dormitories WHERE id = ?").get(dormId);

    if (!dorm) {
      return res.status(404).json({ error: "ไม่พบหอพักที่ต้องการแก้ไข" });
    }

    // ตรวจสอบว่าเป็นเจ้าของ หรือเป็นแอดมิน
    if (dorm.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขหอพักนี้" });
    }

    const {
      name, district, address, description, phone, lineId,
      priceMin, priceMax, amenities, roomTypes, images
    } = req.body;

    const now = new Date().toISOString();

    const updatedAmenities = Array.isArray(amenities) ? JSON.stringify(amenities) : dorm.amenities;
    const updatedRoomTypes = Array.isArray(roomTypes) ? JSON.stringify(roomTypes) : dorm.room_types;
    const updatedImages = Array.isArray(images) ? JSON.stringify(images) : dorm.images;

    db.prepare(`
      UPDATE dormitories
      SET name = COALESCE(?, name),
          district = COALESCE(?, district),
          address = COALESCE(?, address),
          description = COALESCE(?, description),
          phone = COALESCE(?, phone),
          line_id = COALESCE(?, line_id),
          price_min = COALESCE(?, price_min),
          price_max = COALESCE(?, price_max),
          amenities = ?,
          room_types = ?,
          images = ?,
          updated_at = ?
      WHERE id = ?
    `).run(
      name || null,
      district || null,
      address || null,
      description !== undefined ? description : null,
      phone !== undefined ? phone : null,
      lineId !== undefined ? lineId : null,
      priceMin !== undefined ? Number(priceMin) : null,
      priceMax !== undefined ? Number(priceMax) : null,
      updatedAmenities,
      updatedRoomTypes,
      updatedImages,
      now,
      dormId
    );

    const updated = db.prepare("SELECT * FROM dormitories WHERE id = ?").get(dormId);
    res.json({
      message: "อัปเดตข้อมูลหอพักสำเร็จ",
      dormitory: formatDormitory(updated)
    });
  } catch (err) {
    console.error("Update dorm error:", err);
    res.status(500).json({ error: "ไม่สามารถอัปเดตหอพักได้: " + err.message });
  }
});

// Admin อนุมัติ / ปฏิเสธ หอพัก
app.patch("/api/dormitories/:id/status", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนสถานะอนุมัติได้" });
    }

    const { status } = req.body; // 'approved' | 'rejected' | 'pending'
    if (!["approved", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "สถานะไม่ถูกต้อง" });
    }

    const now = new Date().toISOString();
    db.prepare("UPDATE dormitories SET status = ?, updated_at = ? WHERE id = ?").run(status, now, req.params.id);

    const updated = db.prepare("SELECT * FROM dormitories WHERE id = ?").get(req.params.id);

    // แจ้งเตือนไปยังเจ้าของหอพักเมื่อได้รับการอนุมัติหรือปฏิเสธ
    if (updated && updated.owner_id) {
      const isApproved = status === "approved";
      const title = isApproved ? "หอพักของคุณได้รับการอนุมัติเรียบร้อยแล้ว" : status === "rejected" ? "หอพักของคุณไม่อนุมัติ" : "อัปเดตสถานะหอพัก";
      const msg = isApproved ? `หอพัก "${updated.name}" ได้รับการอนุมัติจากผู้ดูแลระบบเรียบร้อยแล้ว` : `หอพัก "${updated.name}" ไม่ผ่านการอนุมัติจากผู้ดูแลระบบ`;
      createNotification(updated.owner_id, title, msg, "dormitory", "/owner/dormitories");
    }

    res.json({
      message: `เปลี่ยนสถานะหอพักเป็น ${status} สำเร็จ`,
      dormitory: formatDormitory(updated)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบหอพัก
app.delete("/api/dormitories/:id", authenticateToken, (req, res) => {
  try {
    const dorm = db.prepare("SELECT * FROM dormitories WHERE id = ?").get(req.params.id);
    if (!dorm) return res.status(404).json({ error: "ไม่พบหอพัก" });

    if (dorm.owner_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์ลบหอพักนี้" });
    }

    db.prepare("DELETE FROM dormitories WHERE id = ?").run(req.params.id);
    res.json({ message: "ลบหอพักสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เพิ่มยอดเข้าชมหอพัก (View Count)
app.post("/api/dormitories/:id/view", (req, res) => {
  try {
    db.prepare("UPDATE dormitories SET view_count = view_count + 1 WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  } catch {
    res.json({ success: false });
  }
});

// ==========================================
// 3. ROOMS APIS
// ==========================================

// ดึงรายการห้องพักตามหอพัก
app.get("/api/rooms/dormitory/:dormId", (req, res) => {
  try {
    const rooms = db.prepare("SELECT * FROM rooms WHERE dormitory_id = ? ORDER BY room_number ASC").all(req.params.dormId);
    res.json({ rooms });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของเพิ่มห้องพักใหม่ (ทำได้ตลอดเวลาโดยไม่ต้องรอแอดมิน!)
app.post("/api/rooms", authenticateToken, (req, res) => {
  try {
    const { dormitoryId, roomNumber, roomType, price, status = "available" } = req.body;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO rooms (id, dormitory_id, owner_id, room_number, room_type, price, status, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, dormitoryId, req.user.id, roomNumber, roomType, Number(price) || 0, status, now);

    const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(id);
    res.status(201).json({ message: "เพิ่มห้องพักสำเร็จ", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของอัปเดตห้องพัก
app.put("/api/rooms/:id", authenticateToken, (req, res) => {
  try {
    const { roomNumber, roomType, price, status } = req.body;

    db.prepare(`
      UPDATE rooms
      SET room_number = COALESCE(?, room_number),
          room_type = COALESCE(?, room_type),
          price = COALESCE(?, price),
          status = COALESCE(?, status)
      WHERE id = ?
    `).run(roomNumber || null, roomType || null, price !== undefined ? Number(price) : null, status || null, req.params.id);

    const room = db.prepare("SELECT * FROM rooms WHERE id = ?").get(req.params.id);

    if (room && status) {
      let bookingStatus = "cancelled";
      if (status === "reserved") bookingStatus = "approved";
      else if (status === "occupied") bookingStatus = "completed";
      else if (status === "available") bookingStatus = "cancelled";

      db.prepare("UPDATE bookings SET status = ? WHERE room_id = ?").run(bookingStatus, room.id);
      if (room.dormitory_id && room.room_number) {
        db.prepare("UPDATE bookings SET status = ? WHERE dormitory_id = ? AND room_number = ?").run(bookingStatus, room.dormitory_id, room.room_number);
      }
    }

    res.json({ message: "อัปเดตห้องพักสำเร็จ", room });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของลบห้องพัก
app.delete("/api/rooms/:id", authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM rooms WHERE id = ?").run(req.params.id);
    res.json({ message: "ลบห้องพักสำเร็จ" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 4. BOOKINGS APIS
// ==========================================

// ดึงรายการจอง (กรองตามผู้เช่า หรือตามเจ้าของหอ)
app.get("/api/bookings", authenticateToken, (req, res) => {
  try {
    const { userId, ownerId } = req.query;
    let sql = "SELECT * FROM bookings WHERE 1=1";
    const params = [];

    if (req.user.role === "admin") {
      // แอดมินดูได้ทั้งหมด
    } else if (req.user.role === "owner" || ownerId) {
      sql += " AND owner_id = ?";
      params.push(ownerId || req.user.id);
    } else {
      sql += " AND user_id = ?";
      params.push(userId || req.user.id);
    }

    sql += " ORDER BY created_at DESC";
    const bookings = db.prepare(sql).all(...params);
    res.json({ bookings });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ผู้เช่าสร้างคำขอจอง
app.post("/api/bookings", authenticateToken, (req, res) => {
  try {
    if (req.user.role === "admin") {
      return res.status(403).json({ error: "ผู้ดูแลระบบสามารถเข้าดูข้อมูลหอพักและห้องพักได้เท่านั้น ไม่สามารถทำการจองห้องพักได้" });
    }

    const {
      dormitoryId, dormitoryName, ownerId, roomId, roomNumber,
      bookingDate, note, userName, userPhone
    } = req.body;

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO bookings (
        id, user_id, user_email, user_name, user_phone, owner_id,
        dormitory_id, dormitory_name, room_id, room_number, booking_date, note, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?)
    `).run(
      id,
      req.user.id,
      req.user.email,
      userName || req.user.fullName || "",
      userPhone || "",
      ownerId,
      dormitoryId,
      dormitoryName,
      roomId || null,
      roomNumber || null,
      bookingDate || now.split("T")[0],
      note || "",
      now,
      now
    );

    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(id);

    // แจ้งเตือนไปยังเจ้าของหอพัก
    if (ownerId && ownerId !== req.user.id) {
      createNotification(
        ownerId,
        `การจองห้องพักใหม่ (${dormitoryName})`,
        `คุณ ${userName || req.user.fullName || 'ผู้เช่า'} ได้ส่งคำขอจองห้องพัก`,
        "booking",
        "/owner/bookings"
      );
    }

    res.status(201).json({ message: "ส่งคำขอจองห้องพักสำเร็จ", booking });
  } catch (err) {
    console.error("Create booking error:", err);
    res.status(500).json({ error: err.message });
  }
});

// อัปเดตสถานะการจอง (อนุมัติ, ปฏิเสธ, ยกเลิก, มีผู้เช่า, ห้องว่าง)
app.put("/api/bookings/:id/status", authenticateToken, (req, res) => {
  try {
    const { status } = req.body; // 'approved' | 'reserved' | 'occupied' | 'completed' | 'available' | 'rejected' | 'cancelled'
    const now = new Date().toISOString();

    // Map status aliases to canonical booking status
    let canonicalBookingStatus = status;
    if (status === "reserved") canonicalBookingStatus = "approved";
    if (status === "occupied") canonicalBookingStatus = "completed";
    if (status === "available") canonicalBookingStatus = "cancelled";

    db.prepare("UPDATE bookings SET status = ?, updated_at = ? WHERE id = ?").run(canonicalBookingStatus, now, req.params.id);
    const booking = db.prepare("SELECT * FROM bookings WHERE id = ?").get(req.params.id);

    if (booking) {
      // Determine target room status
      let targetRoomStatus = "available";
      if (status === "approved" || status === "reserved") {
        targetRoomStatus = "reserved";
      } else if (status === "completed" || status === "occupied") {
        targetRoomStatus = "occupied";
      } else {
        targetRoomStatus = "available";
      }

      if (booking.room_id && booking.room_id !== "general") {
        db.prepare("UPDATE rooms SET status = ? WHERE id = ?").run(targetRoomStatus, booking.room_id);
      }
      if (booking.dormitory_id && booking.room_number && booking.room_number !== "ห้องมาตรฐาน") {
        db.prepare("UPDATE rooms SET status = ? WHERE dormitory_id = ? AND room_number = ?").run(targetRoomStatus, booking.dormitory_id, booking.room_number);
      }

      const statusText = targetRoomStatus === "reserved" ? "ได้รับการอนุมัติแล้ว (จองแล้ว)" : targetRoomStatus === "occupied" ? "มีผู้เช่าแล้ว" : "เป็นห้องว่างแล้ว";
      // แจ้งผู้เช่า
      if (booking.user_id && booking.user_id !== req.user.id) {
        createNotification(
          booking.user_id,
          `อัปเดตสถานะการจองห้องพัก (${booking.dormitory_name})`,
          `คำขอจองห้องพักของคุณ${statusText}`,
          "booking",
          "/user/bookings"
        );
      }
      // หากผู้เช่ายกเลิก ให้แจ้งเจ้าของหอ
      if (booking.owner_id && booking.owner_id !== req.user.id) {
        createNotification(
          booking.owner_id,
          `อัปเดตสถานะการจองห้องพัก (${booking.dormitory_name})`,
          `คำขอจองห้องพัก${statusText}`,
          "booking",
          "/owner/bookings"
        );
      }
    }

    res.json({ message: `อัปเดตสถานะการจองสำเร็จ`, booking });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 5. REVIEWS APIS
// ==========================================
// 5. REVIEWS APIS
// ==========================================

// ดึงรีวิวทั้งหมดในระบบ (joined กับ users และ dormitories เพื่อดึงรูปโปรไฟล์ ชื่อผู้ใช้ และชื่อหอพัก)
app.get("/api/reviews", optionalAuth, (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*,
             COALESCE(r.user_photo, u.avatar_url) AS user_photo,
             COALESCE(r.user_name, u.full_name, 'ผู้ใช้งาน') AS user_name,
             d.name AS dormitory_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      LEFT JOIN dormitories d ON r.dormitory_id = d.id
      ORDER BY r.created_at DESC
    `).all();
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงรีวิวตามหอพัก
app.get("/api/reviews/dormitory/:dormId", (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*,
             COALESCE(r.user_photo, u.avatar_url) AS user_photo,
             COALESCE(r.user_name, u.full_name, 'ผู้ใช้งาน') AS user_name
      FROM reviews r
      LEFT JOIN users u ON r.user_id = u.id
      WHERE r.dormitory_id = ?
      ORDER BY r.created_at DESC
    `).all(req.params.dormId);
    res.json({ reviews });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ผู้เช่าสร้างรีวิว
app.post("/api/reviews", authenticateToken, (req, res) => {
  try {
    const { dormitoryId, rating, comment, userName, userPhoto } = req.body;
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    const userRow = db.prepare("SELECT avatar_url, full_name FROM users WHERE id = ?").get(req.user.id);
    const photoToSave = userPhoto || userRow?.avatar_url || null;
    const nameToSave = userName || userRow?.full_name || req.user.fullName || "ผู้ใช้งาน";

    db.prepare(`
      INSERT INTO reviews (id, user_id, user_name, user_photo, dormitory_id, rating, comment, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      req.user.id,
      nameToSave,
      photoToSave,
      dormitoryId,
      Number(rating) || 5,
      comment,
      now,
      now
    );

    // คำนวณ rating เฉลี่ยใหม่ของหอพัก
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE dormitory_id = ?
    `).get(dormitoryId);

    db.prepare(`
      UPDATE dormitories
      SET rating = ?, review_count = ?
      WHERE id = ?
    `).run(Number(stats.avg_rating || 0).toFixed(1), stats.count, dormitoryId);
    const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(id);

    // แจ้งเตือนไปยังเจ้าของหอพักและแอดมินเมื่อมีคนมาเขียนรีวิวใหม่
    const dorm = db.prepare("SELECT name, owner_id FROM dormitories WHERE id = ?").get(dormitoryId);
    if (dorm) {
      if (dorm.owner_id && dorm.owner_id !== req.user.id) {
        createNotification(
          dorm.owner_id,
          `มีผู้เช่าแสดงความคิดเห็น/รีวิวใหม่`,
          `ผู้เช่า ${nameToSave} ได้แสดงความคิดเห็นสำหรับหอพัก ${dorm.name}: "${comment.length > 40 ? comment.substring(0, 40) + '...' : comment}"`,
          "review",
          `/dorms/${dormitoryId}`
        );
      }

      const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
      adminUsers.forEach((admin) => {
        if (admin.id !== req.user.id) {
          createNotification(
            admin.id,
            `มีผู้เช่าแสดงความคิดเห็น/รีวิวใหม่`,
            `ผู้เช่า ${nameToSave} ได้แสดงความคิดเห็นสำหรับหอพัก ${dorm.name}: "${comment.length > 40 ? comment.substring(0, 40) + '...' : comment}"`,
            "review",
            `/dorms/${dormitoryId}`
          );
        }
      });
    }

    res.status(201).json({ message: "ส่งรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// เจ้าของหอพัก/แอดมินตอบกลับรีวิว (ปรับปรุงให้โชว์รูปโปรไฟล์/ชื่อผู้ใช้ และแก้ไขได้ภายใน 1 นาทีเท่านั้น)
app.put("/api/reviews/:id/reply", authenticateToken, (req, res) => {
  try {
    const { reply } = req.body;
    const now = new Date().toISOString();

    const existingReview = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
    if (!existingReview) {
      return res.status(404).json({ error: "ไม่พบข้อมูลรีวิว" });
    }

    // ข้อกำหนด: หากมีข้อความตอบกลับเดิมอยู่แล้ว และปล่อยไว้เกิน 1 นาที (60 วินาที) จะไม่สามารถแก้ไขได้
    if (existingReview.owner_reply && existingReview.owner_reply_at) {
      const elapsedMs = Date.now() - new Date(existingReview.owner_reply_at).getTime();
      if (elapsedMs > 60 * 1000) {
        return res.status(400).json({ error: "หมดเวลาสำหรับการแก้ไขข้อความตอบกลับแล้ว (แก้ไขได้ภายใน 1 นาทีหลังส่งข้อความเท่านั้น)" });
      }
    }

    // ดึงรูปโปรไฟล์และชื่อของผู้ตอบกลับ (เจ้าของหอ หรือ แอดมิน)
    const userRow = db.prepare("SELECT full_name, username, avatar_url, role FROM users WHERE id = ?").get(req.user.id);
    const replierName = userRow?.full_name || userRow?.username || (req.user.role === "admin" ? "ผู้ดูแลระบบ" : "เจ้าของหอพัก");
    const replierPhoto = userRow?.avatar_url || "/images/default-avatar.jpg";
    const replierRole = req.user.role || userRow?.role || "owner";

    db.prepare(`
      UPDATE reviews
      SET owner_reply = ?,
          owner_reply_name = ?,
          owner_reply_photo = ?,
          owner_reply_role = ?,
          owner_reply_at = ?,
          updated_at = ?
      WHERE id = ?
    `).run(reply, replierName, replierPhoto, replierRole, now, now, req.params.id);

    const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);

    if (review) {
      const dorm = db.prepare("SELECT name FROM dormitories WHERE id = ?").get(review.dormitory_id);
      if (review.user_id && review.user_id !== req.user.id) {
        const replierTitle = replierRole === "admin" ? "ผู้ดูแลระบบ" : "เจ้าของหอพัก";
        createNotification(
          review.user_id,
          `${replierTitle}ตอบกลับรีวิวของคุณ`,
          `การตอบกลับสำหรับหอพัก ${dorm?.name || ''}: "${reply.length > 40 ? reply.substring(0, 40) + '...' : reply}"`,
          "review",
          `/dorms/${review.dormitory_id}`
        );
      }
    }

    res.json({ message: "บันทึกการตอบกลับรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ผู้เช่าแก้ไขรีวิวของตนเอง (แก้ไขได้ภายใน 1 นาทีหลังสร้างเท่านั้น)
app.put("/api/reviews/:id", authenticateToken, (req, res) => {
  try {
    const { comment, rating } = req.body;
    const now = new Date().toISOString();

    const existingReview = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
    if (!existingReview) {
      return res.status(404).json({ error: "ไม่พบข้อมูลรีวิว" });
    }

    if (existingReview.user_id !== req.user.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "คุณไม่มีสิทธิ์แก้ไขรีวิวนี้" });
    }

    // กฎ 1 นาที (60 วินาที): ตรวจสอบเวลาจาก created_at หรือ updated_at
    const baseTime = existingReview.created_at || existingReview.updated_at;
    if (baseTime) {
      const elapsedMs = Date.now() - new Date(baseTime).getTime();
      if (elapsedMs > 60 * 1000) {
        return res.status(400).json({ error: "หมดเวลาสำหรับการแก้ไขรีวิวแล้ว (แก้ไขได้ภายใน 1 นาทีหลังส่งรีวิวเท่านั้น)" });
      }
    }

    db.prepare(`
      UPDATE reviews
      SET comment = COALESCE(?, comment),
          rating = COALESCE(?, rating),
          updated_at = ?
      WHERE id = ?
    `).run(comment || null, rating ? Number(rating) : null, now, req.params.id);

    // อัปเดตคะแนนเฉลี่ยหอพัก
    const stats = db.prepare(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as count
      FROM reviews WHERE dormitory_id = ?
    `).get(existingReview.dormitory_id);

    db.prepare(`
      UPDATE dormitories
      SET rating = ?, review_count = ?
      WHERE id = ?
    `).run(Number(stats.avg_rating || 0).toFixed(1), stats.count, existingReview.dormitory_id);

    const review = db.prepare("SELECT * FROM reviews WHERE id = ?").get(req.params.id);
    res.json({ message: "แก้ไขรีวิวสำเร็จ", review });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. CONTACT & ADMIN MESSAGING APIS
// ==========================================

// ผู้เช่า/เจ้าของหอส่งข้อความติดต่อผู้ดูแลระบบ (Admin)
app.post("/api/contact", optionalAuth, (req, res) => {
  try {
    const { name, email, phone, message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({ error: "กรุณากรอกข้อความที่ต้องการติดต่อ" });
    }

    const senderName = name || req.user?.fullName || req.user?.username || "ผู้สอบถาม";
    const senderEmail = email || req.user?.email || "-";
    const senderPhone = phone || "-";
    const senderRoleTh = req.user?.role === "admin" ? "ผู้ดูแลระบบ" : req.user?.role === "owner" ? "เจ้าของหอพัก" : req.user?.role === "user" ? "ผู้เช่า" : "บุคคลทั่วไป";

    // 1. บันทึกกิจกรรมระบบ
    logSystemActivity(
      `มีข้อความติดต่อใหม่ถึงผู้ดูแลระบบ (${senderRoleTh})`,
      senderName,
      `ข้อความจาก: ${senderName} | อีเมล: ${senderEmail} | เบอร์: ${senderPhone}\nรายละเอียด: "${message}"`,
      "contact"
    );

    // 2. ส่งการแจ้งเตือนไปยังผู้ดูแลระบบ (Admin) ทุกคนในระบบ
    const adminUsers = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
    adminUsers.forEach((admin) => {
      createNotification(
        admin.id,
        `📬 มีข้อความติดต่อใหม่จาก ${senderRoleTh} (${senderName})`,
        `ข้อความ: "${message.length > 50 ? message.substring(0, 50) + '...' : message}" (ติดต่อ: ${senderPhone} / ${senderEmail})`,
        "contact",
        "/admin/logs"
      );

      // หากผู้ใช้เข้าสู่ระบบ ให้บันทึกเข้าตาราง messages สำหรับแชท
      if (req.user?.id) {
        const msgId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO messages (id, sender_id, sender_name, receiver_id, receiver_name, message, created_at, is_read)
          VALUES (?, ?, ?, ?, ?, ?, ?, 0)
        `).run(msgId, req.user.id, senderName, admin.id, "ผู้ดูแลระบบ", `[ข้อความติดต่อถึงทีมงาน]: ${message}`, now);
      }
    });

    res.json({ message: "ส่งข้อความถึงผู้ดูแลระบบเรียบร้อยแล้ว ทีมงานและแอดมินได้รับการแจ้งเตือนแล้วครับ" });
  } catch (err) {
    console.error("Contact API error:", err);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการส่งข้อความ: " + err.message });
  }
});

// ดึงรายการรีวิวล่าสุด 8 รายการ (Public)
app.get("/api/reviews/latest", (req, res) => {
  try {
    const reviews = db.prepare(`
      SELECT r.*, d.name as dormitory_name, u.avatar_url as user_avatar, u.full_name as user_full_name
      FROM reviews r
      LEFT JOIN dormitories d ON r.dormitory_id = d.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 8
    `).all();

    const formatted = reviews.map((r) => ({
      id: r.id,
      rating: r.rating || 5,
      comment: r.comment,
      userName: r.user_full_name || r.user_name || "ผู้ใช้งาน",
      userPhoto: r.user_avatar || r.user_photo || "/images/default-avatar.jpg",
      dormitoryName: r.dormitory_name || "หอพักในระบบ",
      createdAt: r.created_at
    }));

    res.json({ reviews: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 6. FAVORITES APIS
// ==========================================

// ดึงรายการโปรดของผู้ใช้
app.get("/api/favorites/user/:userId", authenticateToken, (req, res) => {
  try {
    const favs = db.prepare(`
      SELECT f.id, f.dormitory_id, f.created_at,
             d.name, d.district, d.price_min, d.price_max, d.images, d.rating, d.status
      FROM favorites f
      JOIN dormitories d ON f.dormitory_id = d.id
      WHERE f.user_id = ?
    `).all(req.params.userId);

    const formatted = favs.map((f) => ({
      ...f,
      dormitoryId: f.dormitory_id,
      images: safeParseJson(f.images),
      priceMin: f.price_min,
      priceMax: f.price_max
    }));

    res.json({ favorites: formatted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// สลับสถานะถูกใจ (Toggle Favorite)
app.post("/api/favorites/toggle", authenticateToken, (req, res) => {
  try {
    const { dormitoryId } = req.body;
    const userId = req.user.id;

    const existing = db.prepare("SELECT id FROM favorites WHERE user_id = ? AND dormitory_id = ?").get(userId, dormitoryId);

    if (existing) {
      db.prepare("DELETE FROM favorites WHERE id = ?").run(existing.id);
      db.prepare("UPDATE dormitories SET favorite_count = MAX(0, favorite_count - 1) WHERE id = ?").run(dormitoryId);
      return res.json({ favorited: false, message: "ยกเลิกการบันทึกรายการโปรด" });
    } else {
      const id = crypto.randomUUID();
      const now = new Date().toISOString();
      db.prepare("INSERT INTO favorites (id, user_id, dormitory_id, created_at) VALUES (?, ?, ?, ?)").run(id, userId, dormitoryId, now);
      db.prepare("UPDATE dormitories SET favorite_count = favorite_count + 1 WHERE id = ?").run(dormitoryId);
      return res.json({ favorited: true, message: "บันทึกเป็นรายการโปรดแล้ว" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7. FILE UPLOAD API
// ==========================================

// อัปโหลดไฟล์รูปภาพ (โปรไฟล์ หรือ รูปหอพัก) เก็บในโฟลเดอร์ uploads/
app.post("/api/upload", upload.single("file"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "ไม่พบไฟล์ที่อัปโหลด" });
    }
    const publicUrl = `/uploads/${req.file.filename}`;
    res.json({
      message: "อัปโหลดไฟล์สำเร็จ",
      url: publicUrl,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 7.1 MESSAGES & CHAT APIS
// ==========================================

// ส่งข้อความ
app.post("/api/messages", authenticateToken, (req, res) => {
  try {
    const { receiverId, receiverName, dormitoryId, dormitoryName, message } = req.body;
    if (!receiverId || !message) {
      return res.status(400).json({ error: "ข้อมูลไม่ครบถ้วน" });
    }

    // ค้นหาข้อมูลผู้ส่งจาก users table เพื่อดึงชื่อจริงและรูปโปรไฟล์เสมอ (ไม่ใช้อีเมล)
    const senderUser = db.prepare("SELECT id, full_name, first_name, last_name, username, avatar_url, role FROM users WHERE id = ?").get(req.user.id);
    const senderFullName = senderUser?.full_name || `${senderUser?.first_name || ""} ${senderUser?.last_name || ""}`.trim() || senderUser?.username || "ผู้ใช้งาน";

    // ค้นหาข้อมูลผู้รับจาก users table
    const receiverUser = db.prepare("SELECT id, full_name, first_name, last_name, username, avatar_url, role FROM users WHERE id = ?").get(receiverId);
    let finalReceiverName = receiverName;
    if (!finalReceiverName || finalReceiverName.includes("@")) {
      finalReceiverName = receiverUser?.full_name || `${receiverUser?.first_name || ""} ${receiverUser?.last_name || ""}`.trim() || receiverUser?.username || "ผู้ใช้งาน";
    }

    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    db.prepare(`
      INSERT INTO messages (id, sender_id, sender_name, receiver_id, receiver_name, dormitory_id, dormitory_name, message, created_at, is_read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)
    `).run(
      id,
      req.user.id,
      senderFullName,
      receiverId,
      finalReceiverName,
      dormitoryId || null,
      dormitoryName || null,
      message,
      now
    );

    const created = db.prepare(`
      SELECT m.*,
             u_s.full_name as sender_full_name, u_s.username as sender_username, u_s.avatar_url as sender_avatar, u_s.role as sender_role,
             u_r.full_name as receiver_full_name, u_r.username as receiver_username, u_r.avatar_url as receiver_avatar, u_r.role as receiver_role
      FROM messages m
      LEFT JOIN users u_s ON m.sender_id = u_s.id
      LEFT JOIN users u_r ON m.receiver_id = u_r.id
      WHERE m.id = ?
    `).get(id);

    // แจ้งเตือนข้อความใหม่ไปยังผู้รับ (แอดมิน, เจ้าของหอ, ผู้เช่า)
    if (receiverId && receiverId !== req.user.id) {
      const targetRole = receiverUser?.role || "user";
      const chatLink = targetRole === "admin" ? "/admin/messages" : targetRole === "owner" ? "/owner/messages" : "/user/messages";
      createNotification(
        receiverId,
        `ข้อความใหม่จาก ${senderFullName}`,
        message.length > 50 ? message.substring(0, 50) + "..." : message,
        "chat",
        chatLink
      );
    }

    res.status(201).json({
      message: "ส่งข้อความสำเร็จ",
      chatMessage: {
        ...created,
        sender_name: senderFullName,
        sender_avatar: senderUser?.avatar_url || "",
        sender_role: senderUser?.role || "user",
        receiver_name: finalReceiverName,
        receiver_avatar: receiverUser?.avatar_url || "",
        receiver_role: receiverUser?.role || "user"
      }
    });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ดึงรายการการสนทนาทั้งหมดของผู้ใช้ (Conversation list)
app.get("/api/messages", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const allMsgs = db.prepare(`
      SELECT m.*,
             u_s.full_name as sender_full_name, u_s.username as sender_username, u_s.avatar_url as sender_avatar, u_s.role as sender_role,
             u_r.full_name as receiver_full_name, u_r.username as receiver_username, u_r.avatar_url as receiver_avatar, u_r.role as receiver_role
      FROM messages m
      LEFT JOIN users u_s ON m.sender_id = u_s.id
      LEFT JOIN users u_r ON m.receiver_id = u_r.id
      WHERE m.sender_id = ? OR m.receiver_id = ?
      ORDER BY m.created_at DESC
    `).all(userId, userId);

    const convMap = new Map();
    for (const msg of allMsgs) {
      const isSender = msg.sender_id === userId;
      const otherId = isSender ? msg.receiver_id : msg.sender_id;

      if (!convMap.has(otherId)) {
        // ค้นหาข้อมูลคู่สนทนาจาก users table เสมอ เพื่อให้ได้ชื่อจริง, avatar และ role ทุกบทบาท
        const otherUser = db.prepare("SELECT id, full_name, first_name, last_name, username, avatar_url, role FROM users WHERE id = ?").get(otherId);
        let otherUserName = otherUser?.full_name || `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim() || otherUser?.username;
        if (!otherUserName || otherUserName.includes("@")) {
          const fallback = isSender ? msg.receiver_name : msg.sender_name;
          otherUserName = (fallback && !fallback.includes("@")) ? fallback : (otherUser?.email ? otherUser.email.split("@")[0] : "ผู้ใช้งาน");
        }

        convMap.set(otherId, {
          otherUserId: otherId,
          otherUserName,
          otherUserAvatar: otherUser?.avatar_url || (isSender ? msg.receiver_avatar : msg.sender_avatar) || "",
          otherUserRole: otherUser?.role || (isSender ? msg.receiver_role : msg.sender_role) || "user",
          dormitoryId: msg.dormitory_id,
          dormitoryName: msg.dormitory_name,
          lastMessage: msg.message,
          lastMessageTime: msg.created_at,
          unreadCount: 0
        });
      }

      if (msg.receiver_id === userId && msg.is_read === 0) {
        convMap.get(otherId).unreadCount += 1;
      }
    }

    res.json({ conversations: Array.from(convMap.values()) });
  } catch (err) {
    console.error("Get messages error:", err);
    res.status(500).json({ error: err.message });
  }
});

// ดึงประวัติการคุยกับผู้ใช้อีกคน (Chat thread)
app.get("/api/messages/thread/:otherUserId", authenticateToken, (req, res) => {
  try {
    const userId = req.user.id;
    const otherId = req.params.otherUserId;

    const messages = db.prepare(`
      SELECT m.*,
             u_s.full_name as sender_full_name, u_s.first_name as sender_first_name, u_s.last_name as sender_last_name, u_s.username as sender_username, u_s.avatar_url as sender_avatar, u_s.role as sender_role,
             u_r.full_name as receiver_full_name, u_r.first_name as receiver_first_name, u_r.last_name as receiver_last_name, u_r.username as receiver_username, u_r.avatar_url as receiver_avatar, u_r.role as receiver_role
      FROM messages m
      LEFT JOIN users u_s ON m.sender_id = u_s.id
      LEFT JOIN users u_r ON m.receiver_id = u_r.id
      WHERE (m.sender_id = ? AND m.receiver_id = ?)
         OR (m.sender_id = ? AND m.receiver_id = ?)
      ORDER BY m.created_at ASC
    `).all(userId, otherId, otherId, userId);

    db.prepare(`
      UPDATE messages SET is_read = 1
      WHERE receiver_id = ? AND sender_id = ?
    `).run(userId, otherId);

    // ดึงข้อมูลคู่สนทนา (otherUser) เพื่อส่งให้ frontend แสดง avatar, name, role
    const otherUser = db.prepare("SELECT id, full_name, first_name, last_name, username, avatar_url, role FROM users WHERE id = ?").get(otherId);
    let otherUserName = otherUser?.full_name || `${otherUser?.first_name || ""} ${otherUser?.last_name || ""}`.trim() || otherUser?.username || "ผู้ใช้งาน";
    if (otherUserName.includes("@")) {
      otherUserName = otherUserName.split("@")[0];
    }

    // แปลงข้อความให้มีชื่อจริงและ avatar เสมอ
    const formattedMessages = messages.map((m) => {
      let sName = m.sender_full_name || `${m.sender_first_name || ""} ${m.sender_last_name || ""}`.trim() || m.sender_username || m.sender_name || "";
      if (!sName || sName.includes("@")) {
        sName = sName.includes("@") ? sName.split("@")[0] : "ผู้ใช้งาน";
      }

      return {
        id: m.id,
        sender_id: m.sender_id,
        sender_name: sName,
        sender_avatar: m.sender_avatar || "",
        sender_role: m.sender_role || "user",
        receiver_id: m.receiver_id,
        receiver_name: m.receiver_name,
        receiver_avatar: m.receiver_avatar || "",
        receiver_role: m.receiver_role || "user",
        dormitory_id: m.dormitory_id,
        dormitory_name: m.dormitory_name,
        message: m.message,
        created_at: m.created_at,
        is_read: m.is_read
      };
    });

    res.json({
      messages: formattedMessages,
      otherUser: otherUser ? {
        id: otherUser.id,
        userName: otherUserName,
        avatarUrl: otherUser.avatar_url || "",
        role: otherUser.role || "user"
      } : null
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ส่งข้อความติดต่อผู้ดูแลระบบ (Admin)
app.post("/api/contact", optionalAuth, (req, res) => {
  try {
    const { name, email, phone, message } = req.body;
    if (!message || !message.trim()) {
      return res.status(400).json({ error: "กรุณาระบุข้อความที่ต้องการติดต่อ" });
    }

    const senderName = name?.trim() || (req.user ? req.user.email : "ผู้ใช้งาน");
    const senderEmail = email?.trim() || (req.user ? req.user.email : "");
    const senderPhone = phone?.trim() || "";
    const contactMsg = message.trim();

    // ดึงผู้ดูแลระบบ (Admin) ทุกคนในระบบ
    const adminUsers = db.prepare("SELECT id, full_name, email FROM users WHERE role = 'admin'").all();

    // 1. ส่งการแจ้งเตือนไปยัง Admin ทุกคน
    adminUsers.forEach((admin) => {
      createNotification(
        admin.id,
        `มีข้อความติดต่อใหม่จากผู้ใช้งาน`,
        `จากคุณ ${senderName} (${senderEmail}${senderPhone ? ' / Tel: ' + senderPhone : ''}): "${contactMsg}"`,
        "contact",
        "/admin/messages"
      );

      // 2. หากผู้ส่งล็อกอินอยู่ ให้บันทึกเข้าตาราง messages สนทนากับ Admin ด้วย
      if (req.user && req.user.id) {
        const msgId = crypto.randomUUID();
        const now = new Date().toISOString();
        db.prepare(`
          INSERT INTO messages (id, sender_id, receiver_id, message, is_read, created_at)
          VALUES (?, ?, ?, ?, 0, ?)
        `).run(msgId, req.user.id, admin.id, `[ติดต่อเรา] ${contactMsg}`, now);
      }
    });

    // 3. บันทึกกิจกรรมระบบ
    logSystemActivity(
      "CONTACT_SUBMIT",
      senderName,
      `ส่งข้อความติดต่อ: ${contactMsg} (อีเมล: ${senderEmail})`,
      "contact"
    );

    res.json({ success: true, message: "ส่งข้อความถึงผู้ดูแลระบบเรียบร้อยแล้ว" });
  } catch (err) {
    console.error("Contact error:", err);
    res.status(500).json({ error: "ไม่สามารถส่งข้อความได้: " + err.message });
  }
});

// ==========================================
// 8. ADMIN STATS & USERS APIS
// ==========================================

app.get("/api/admin/stats", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "สำหรับแอดมินเท่านั้น" });
    }

    const totalUsers = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    const totalDorms = db.prepare("SELECT COUNT(*) as count FROM dormitories").get().count;
    const pendingDorms = db.prepare("SELECT COUNT(*) as count FROM dormitories WHERE status = 'pending'").get().count;
    const approvedDorms = db.prepare("SELECT COUNT(*) as count FROM dormitories WHERE status = 'approved'").get().count;
    const totalBookings = db.prepare("SELECT COUNT(*) as count FROM bookings").get().count;

    res.json({
      totalUsers,
      totalDorms,
      pendingDorms,
      approvedDorms,
      totalBookings
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/admin/users", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "สำหรับแอดมินเท่านั้น" });
    }
    const users = db.prepare("SELECT id, email, full_name, first_name, last_name, phone, username, avatar_url, role, created_at FROM users ORDER BY created_at DESC").all();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// แอดมินเปลี่ยนบทบาทผู้ใช้งาน (user / owner / admin)
app.put("/api/admin/users/:id/role", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "สำหรับแอดมินเท่านั้น" });
    }
    const { role } = req.body;
    if (!["user", "owner", "admin"].includes(role)) {
      return res.status(400).json({ error: "บทบาทไม่ถูกต้อง (ต้องเป็น user, owner หรือ admin)" });
    }
    const targetUserId = req.params.id;
    const now = new Date().toISOString();

    db.prepare("UPDATE users SET role = ?, updated_at = ? WHERE id = ?").run(role, now, targetUserId);
    const updated = db.prepare("SELECT id, email, full_name, role, phone FROM users WHERE id = ?").get(targetUserId);

    // แจ้งเตือนไปยังผู้ใช้ว่าบทบาทได้รับการอัปเดตแล้ว
    const roleText = role === "owner" ? "เจ้าของหอพัก" : role === "admin" ? "ผู้ดูแลระบบ" : "ผู้เช่าหอพัก";
    const profileLink = role === "owner" ? "/owner/profile" : role === "admin" ? "/admin/profile" : "/user/profile";
    createNotification(targetUserId, "อัปเดตบทบาทผู้ใช้งาน", `บทบาทบัญชีของคุณถูกเปลี่ยนเป็น ${roleText} เรียบร้อยแล้ว`, "system", profileLink);

    res.json({ message: "เปลี่ยนบทบาทสำเร็จ", user: updated });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// แอดมินลบผู้ใช้งาน
app.delete("/api/admin/users/:id", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "สำหรับแอดมินเท่านั้น" });
    }
    const targetUserId = req.params.id;
    if (targetUserId === req.user.id) {
      return res.status(400).json({ error: "ไม่สามารถลบบัญชีผู้ดูแลระบบที่กำลังใช้งานอยู่ได้" });
    }

    // ลบข้อมูลที่เกี่ยวข้องแบบ Cascade
    const ownerDorms = db.prepare("SELECT id FROM dormitories WHERE owner_id = ?").all(targetUserId);
    for (const d of ownerDorms) {
      db.prepare("DELETE FROM rooms WHERE dormitory_id = ?").run(d.id);
      db.prepare("DELETE FROM bookings WHERE dormitory_id = ?").run(d.id);
      db.prepare("DELETE FROM reviews WHERE dormitory_id = ?").run(d.id);
      db.prepare("DELETE FROM favorites WHERE dormitory_id = ?").run(d.id);
    }
    db.prepare("DELETE FROM rooms WHERE owner_id = ?").run(targetUserId);
    db.prepare("DELETE FROM messages WHERE sender_id = ? OR receiver_id = ?").run(targetUserId, targetUserId);
    db.prepare("DELETE FROM favorites WHERE user_id = ?").run(targetUserId);
    db.prepare("DELETE FROM reviews WHERE user_id = ?").run(targetUserId);
    db.prepare("DELETE FROM bookings WHERE user_id = ? OR owner_id = ?").run(targetUserId, targetUserId);
    db.prepare("DELETE FROM dormitories WHERE owner_id = ?").run(targetUserId);
    db.prepare("DELETE FROM users WHERE id = ?").run(targetUserId);

    res.json({ message: "ลบผู้ใช้งานเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงรายการบันทึกกิจกรรมในระบบ (System Activity Logs)
app.get("/api/admin/logs", authenticateToken, (req, res) => {
  try {
    let logs = db.prepare("SELECT * FROM system_logs ORDER BY created_at DESC").all();

    if (logs.length === 0) {
      const initialLogs = [
        {
          id: crypto.randomUUID(),
          action: "ระบบเริ่มทำงาน และเริ่มต้นฐานข้อมูล",
          details: "เริ่มต้นระบบและฐานข้อมูล SQLite สำเร็จ",
          performed_by: "system",
          type: "system",
          created_at: new Date(Date.now() - 3600000 * 5).toISOString()
        },
        {
          id: crypto.randomUUID(),
          action: "ผู้ใช้งานใหม่ลงทะเบียน: 'สมชาย ใจดี'",
          details: "สมัครสมาชิกสำเร็จในบทบาท: ผู้เช่าหอพัก (อีเมล: user@yooloei.com)",
          performed_by: "สมชาย ใจดี",
          type: "new_user",
          created_at: new Date(Date.now() - 3600000 * 2).toISOString()
        },
        {
          id: crypto.randomUUID(),
          action: "ผู้ใช้งานใหม่ลงทะเบียน: 'อนันต์ เจ้าของหอ'",
          details: "สมัครสมาชิกสำเร็จในบทบาท: เจ้าของหอพัก (อีเมล: owner@yooloei.com)",
          performed_by: "อนันต์ เจ้าของหอ",
          type: "new_user",
          created_at: new Date(Date.now() - 3600000 * 1).toISOString()
        }
      ];

      const stmt = db.prepare("INSERT INTO system_logs (id, action, details, performed_by, type, created_at) VALUES (?, ?, ?, ?, ?, ?)");
      initialLogs.forEach((l) => stmt.run(l.id, l.action, l.details, l.performed_by, l.type, l.created_at));
      logs = db.prepare("SELECT * FROM system_logs ORDER BY created_at DESC").all();
    }

    res.json({ logs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// 9. VIEW HISTORY & NOTIFICATIONS APIS
// ==========================================

// บันทึก/อัปเดตการดูหอพัก (View History)
app.post("/api/history/view", authenticateToken, (req, res) => {
  try {
    const { dormitoryId } = req.body;
    if (!dormitoryId) {
      return res.status(400).json({ error: "กรุณาระบุรหัสหอพัก" });
    }
    const userId = req.user.id;
    const now = new Date().toISOString();

    const existing = db.prepare("SELECT id FROM view_history WHERE user_id = ? AND dormitory_id = ?").get(userId, dormitoryId);
    if (existing) {
      db.prepare("UPDATE view_history SET viewed_at = ? WHERE id = ?").run(now, existing.id);
    } else {
      const id = crypto.randomUUID();
      db.prepare("INSERT INTO view_history (id, user_id, dormitory_id, viewed_at) VALUES (?, ?, ?, ?)").run(id, userId, dormitoryId, now);
    }

    db.prepare("UPDATE dormitories SET view_count = view_count + 1 WHERE id = ?").run(dormitoryId);
    res.json({ success: true, message: "บันทึกประวัติการดูหอพักเรียบร้อย" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงประวัติการดูหอพักทั้งหมดของผู้ใช้
app.get("/api/history/view", authenticateToken, (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT v.id as history_id, v.viewed_at, d.*
      FROM view_history v
      JOIN dormitories d ON v.dormitory_id = d.id
      WHERE v.user_id = ?
      ORDER BY v.viewed_at DESC
    `).all(req.user.id);

    const history = rows.map((r) => ({
      historyId: r.history_id,
      viewedAt: r.viewed_at,
      dormitory: formatDormitory(r)
    }));

    res.json({ history });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบประวัติหอพักเฉพาะรายการ
app.delete("/api/history/view/:dormitoryId", authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM view_history WHERE user_id = ? AND dormitory_id = ?").run(req.user.id, req.params.dormitoryId);
    res.json({ message: "ลบประวัติหอพักนี้เรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ล้างประวัติการดูหอพักทั้งหมด
app.delete("/api/history/view", authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM view_history WHERE user_id = ?").run(req.user.id);
    res.json({ message: "ล้างประวัติการดูหอพักทั้งหมดเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ดึงรายการการแจ้งเตือนและจำนวนที่ยังไม่อ่าน
app.get("/api/notifications", authenticateToken, (req, res) => {
  try {
    const notifications = db.prepare(`
      SELECT * FROM notifications
      WHERE user_id = ?
      ORDER BY created_at DESC
    `).all(req.user.id);

    const unreadCount = db.prepare("SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0").get(req.user.id).count;

    res.json({ notifications, unreadCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ทำเครื่องหมายอ่านแล้วทั้งหมด
app.put("/api/notifications/read-all", authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?").run(req.user.id);
    res.json({ message: "ทำเครื่องหมายอ่านแล้วทั้งหมดเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ทำเครื่องหมายอ่านแล้วเฉพาะรายการ
app.put("/api/notifications/:id/read", authenticateToken, (req, res) => {
  try {
    db.prepare("UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: "ทำเครื่องหมายอ่านแล้วเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ลบรายการการแจ้งเตือน
app.delete("/api/notifications/:id", authenticateToken, (req, res) => {
  try {
    db.prepare("DELETE FROM notifications WHERE id = ? AND user_id = ?").run(req.params.id, req.user.id);
    res.json({ message: "ลบการแจ้งเตือนเรียบร้อยแล้ว" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==========================================
// LOCATIONS & ZONES APIS
// ==========================================

// ดึงรายการพื้นที่ทั้งหมด (Public)
app.get("/api/locations", (req, res) => {
  try {
    const locations = db.prepare("SELECT * FROM locations ORDER BY name ASC").all();
    res.json(locations);
  } catch (err) {
    console.error("Fetch locations error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลพื้นที่ได้: " + err.message });
  }
});

// แอดมินเพิ่มพื้นที่ใหม่
app.post("/api/admin/locations", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    }
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "กรุณาระบุชื่อพื้นที่" });
    }

    const id = `loc-${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO locations (id, name, description, created_at) VALUES (?, ?, ?, ?)").run(
      id,
      name.trim(),
      description || "",
      now
    );

    logSystemActivity(
      "ADD_LOCATION",
      `เพิ่มพื้นที่ใหม่: ${name.trim()}`,
      req.user.email || req.user.id
    );

    res.json({ success: true, location: { id, name: name.trim(), description } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "มีชื่อพื้นที่นี้ในระบบอยู่แล้ว" });
    }
    console.error("Add location error:", err);
    res.status(500).json({ error: "ไม่สามารถเพิ่มพื้นที่ได้: " + err.message });
  }
});

// แอดมินแก้ไขพื้นที่
app.put("/api/admin/locations/:id", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    }
    const { name, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "กรุณาระบุชื่อพื้นที่" });
    }

    db.prepare("UPDATE locations SET name = ?, description = ? WHERE id = ?").run(
      name.trim(),
      description || "",
      req.params.id
    );

    logSystemActivity(
      "UPDATE_LOCATION",
      `แก้ไขพื้นที่ ID ${req.params.id}: ${name.trim()}`,
      req.user.email || req.user.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update location error:", err);
    res.status(500).json({ error: "ไม่สามารถแก้ไขพื้นที่ได้: " + err.message });
  }
});

// แอดมินลบพื้นที่
app.delete("/api/admin/locations/:id", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    }

    db.prepare("DELETE FROM locations WHERE id = ?").run(req.params.id);

    logSystemActivity(
      "DELETE_LOCATION",
      `ลบพื้นที่ ID ${req.params.id}`,
      req.user.email || req.user.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete location error:", err);
    res.status(500).json({ error: "ไม่สามารถลบพื้นที่ได้: " + err.message });
  }
});

// ==========================================
// 11.5 ROOM TYPES / RENTAL TERMS APIS
// ==========================================

// ดึงรายการประเภทห้องทั้งหมด (Public)
app.get("/api/room-types", (req, res) => {
  try {
    const roomTypes = db.prepare("SELECT * FROM room_types ORDER BY name ASC").all();
    res.json(roomTypes);
  } catch (err) {
    console.error("Fetch room types error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลประเภทห้องได้: " + err.message });
  }
});

// แอดมินเพิ่มประเภทห้อง/การเช่าใหม่
app.post("/api/admin/room-types", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    }
    const { name, category, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "กรุณาระบุชื่อประเภทห้อง/การเช่า" });
    }

    const id = `rt-${Date.now()}`;
    const now = new Date().toISOString();
    db.prepare("INSERT INTO room_types (id, name, category, description, created_at) VALUES (?, ?, ?, ?, ?)").run(
      id,
      name.trim(),
      category || "ทั่วไป",
      description || "",
      now
    );

    logSystemActivity(
      "ADD_ROOM_TYPE",
      `เพิ่มประเภทห้อง/การเช่าใหม่: ${name.trim()}`,
      req.user.email || req.user.id
    );

    res.json({ success: true, roomType: { id, name: name.trim(), category: category || "ทั่วไป", description } });
  } catch (err) {
    if (err.message.includes("UNIQUE")) {
      return res.status(400).json({ error: "มีชื่อประเภทห้องนี้ในระบบอยู่แล้ว" });
    }
    console.error("Add room type error:", err);
    res.status(500).json({ error: "ไม่สามารถเพิ่มประเภทห้องได้: " + err.message });
  }
});

// แอดมินแก้ไขประเภทห้อง
app.put("/api/admin/room-types/:id", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    }
    const { name, category, description } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "กรุณาระบุชื่อประเภทห้อง/การเช่า" });
    }

    db.prepare("UPDATE room_types SET name = ?, category = ?, description = ? WHERE id = ?").run(
      name.trim(),
      category || "ทั่วไป",
      description || "",
      req.params.id
    );

    logSystemActivity(
      "UPDATE_ROOM_TYPE",
      `แก้ไขประเภทห้อง ID ${req.params.id}: ${name.trim()}`,
      req.user.email || req.user.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Update room type error:", err);
    res.status(500).json({ error: "ไม่สามารถแก้ไขประเภทห้องได้: " + err.message });
  }
});

// แอดมินลบประเภทห้อง
app.delete("/api/admin/room-types/:id", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้น" });
    }

    db.prepare("DELETE FROM room_types WHERE id = ?").run(req.params.id);

    logSystemActivity(
      "DELETE_ROOM_TYPE",
      `ลบประเภทห้อง ID ${req.params.id}`,
      req.user.email || req.user.id
    );

    res.json({ success: true });
  } catch (err) {
    console.error("Delete room type error:", err);
    res.status(500).json({ error: "ไม่สามารถลบประเภทห้องได้: " + err.message });
  }
});

// ==========================================
// 12. SYSTEM SETTINGS APIS
// ==========================================

// ดึงข้อมูลการตั้งค่าระบบ (Public / ทุกคนเข้าถึงได้)
app.get("/api/settings", (req, res) => {
  try {
    const rows = db.prepare("SELECT key, value FROM system_settings").all();
    const settings = {};
    rows.forEach((r) => {
      settings[r.key] = r.value;
    });

    res.json({
      site_name: settings.site_name || "อยู่เลย เฮาส์",
      site_name_en: settings.site_name_en || "YOOLOEI HOUSE",
      site_logo: settings.site_logo || "/images/logo.png",
      theme_color: settings.theme_color || "#7da27c",
      admin_email: settings.admin_email || "admin@yooloei.com",
      contact_phone: settings.contact_phone || "042-123-456",
      auto_approve_dorms: settings.auto_approve_dorms || "manual"
    });
  } catch (err) {
    console.error("Get settings error:", err);
    res.status(500).json({ error: "ไม่สามารถดึงข้อมูลการตั้งค่าได้: " + err.message });
  }
});

// แอดมินแก้ไขการตั้งค่าระบบและธีมเว็บไซต์
app.put("/api/admin/settings", authenticateToken, (req, res) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ error: "เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเปลี่ยนการตั้งค่าได้" });
    }

    const {
      site_name,
      site_name_en,
      site_logo,
      theme_color,
      admin_email,
      contact_phone,
      auto_approve_dorms
    } = req.body;

    const now = new Date().toISOString();
    const upsertStmt = db.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `);

    if (site_name !== undefined) upsertStmt.run("site_name", site_name.trim(), now);
    if (site_name_en !== undefined) upsertStmt.run("site_name_en", site_name_en.trim(), now);
    if (site_logo !== undefined) upsertStmt.run("site_logo", site_logo.trim(), now);
    if (theme_color !== undefined) upsertStmt.run("theme_color", theme_color.trim(), now);
    if (admin_email !== undefined) upsertStmt.run("admin_email", admin_email.trim(), now);
    if (contact_phone !== undefined) upsertStmt.run("contact_phone", contact_phone.trim(), now);
    if (auto_approve_dorms !== undefined) upsertStmt.run("auto_approve_dorms", auto_approve_dorms, now);

    logSystemActivity(
      "UPDATE_SETTINGS",
      `ปรับแต่งการตั้งค่าระบบ ชื่อเว็บ: ${site_name || '-'} / โลโก้: ${site_logo || '-'} / สีธีม: ${theme_color || '-'}`,
      req.user.email || req.user.id
    );

    // ดึงค่าใหม่ทั้งหมดส่งกลับ
    const rows = db.prepare("SELECT key, value FROM system_settings").all();
    const updatedSettings = {};
    rows.forEach((r) => {
      updatedSettings[r.key] = r.value;
    });

    res.json({
      success: true,
      message: "บันทึกการตั้งค่าระบบเรียบร้อยแล้ว",
      settings: updatedSettings
    });
  } catch (err) {
    console.error("Update settings error:", err);
    res.status(500).json({ error: "ไม่สามารถบันทึกการตั้งค่าได้: " + err.message });
  }
});

// เริ่มต้นเปิด Server
app.listen(PORT, () => {
  console.log(`🚀 YooLoei House Backend API running at http://localhost:${PORT}`);
});
