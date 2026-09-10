import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// กำหนดที่อยู่ไฟล์ฐานข้อมูล yooloei.db ที่เปิดด้วย DB Browser for SQLite ได้โดยตรง
const dbPath = path.join(__dirname, "yooloei.db");
const uploadsDir = path.join(__dirname, "uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export const db = new DatabaseSync(dbPath);

// สร้างตารางทั้งหมด (DDL)
export function initDatabase() {
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    -- 1. ตารางผู้ใช้งาน (USERS)
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      full_name TEXT,
      first_name TEXT,
      last_name TEXT,
      phone TEXT,
      username TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 2. ตารางหอพัก (DORMITORIES)
    CREATE TABLE IF NOT EXISTS dormitories (
      id TEXT PRIMARY KEY,
      owner_id TEXT NOT NULL,
      owner_name TEXT,
      name TEXT NOT NULL,
      district TEXT NOT NULL,
      address TEXT NOT NULL,
      description TEXT,
      phone TEXT,
      line_id TEXT,
      price_min REAL DEFAULT 0,
      price_max REAL DEFAULT 0,
      amenities TEXT DEFAULT '[]',     -- เก็บ JSON array
      room_types TEXT DEFAULT '[]',    -- เก็บ JSON array
      images TEXT DEFAULT '[]',        -- เก็บ JSON array
      rating REAL DEFAULT 0,
      review_count INTEGER DEFAULT 0,
      view_count INTEGER DEFAULT 0,
      favorite_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 3. ตารางห้องพัก (ROOMS)
    CREATE TABLE IF NOT EXISTS rooms (
      id TEXT PRIMARY KEY,
      dormitory_id TEXT NOT NULL,
      owner_id TEXT NOT NULL,
      room_number TEXT NOT NULL,
      room_type TEXT NOT NULL,
      price REAL DEFAULT 0,
      status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied')),
      created_at TEXT NOT NULL,
      FOREIGN KEY (dormitory_id) REFERENCES dormitories(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 4. ตารางการจอง (BOOKINGS)
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_email TEXT,
      user_name TEXT,
      user_phone TEXT,
      owner_id TEXT NOT NULL,
      dormitory_id TEXT NOT NULL,
      dormitory_name TEXT NOT NULL,
      room_id TEXT,
      room_number TEXT,
      booking_date TEXT NOT NULL,
      note TEXT,
      status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (dormitory_id) REFERENCES dormitories(id) ON DELETE CASCADE
    );

    -- 5. ตารางรีวิว (REVIEWS)
    CREATE TABLE IF NOT EXISTS reviews (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT,
      user_photo TEXT,
      dormitory_id TEXT NOT NULL,
      rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
      comment TEXT NOT NULL,
      owner_reply TEXT,
      owner_reply_name TEXT,
      owner_reply_photo TEXT,
      owner_reply_role TEXT,
      owner_reply_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (dormitory_id) REFERENCES dormitories(id) ON DELETE CASCADE
    );

    -- 6. ตารางรายการโปรด (FAVORITES)
    CREATE TABLE IF NOT EXISTS favorites (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dormitory_id TEXT NOT NULL,
      created_at TEXT NOT NULL,
      UNIQUE(user_id, dormitory_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (dormitory_id) REFERENCES dormitories(id) ON DELETE CASCADE
    );

    -- 7. ตารางข้อความแชท (MESSAGES)
    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      sender_name TEXT,
      receiver_id TEXT NOT NULL,
      receiver_name TEXT,
      dormitory_id TEXT,
      dormitory_name TEXT,
      message TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_read INTEGER DEFAULT 0,
      FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (receiver_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 8. ตารางประวัติการดูหอพัก (VIEW_HISTORY)
    CREATE TABLE IF NOT EXISTS view_history (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      dormitory_id TEXT NOT NULL,
      viewed_at TEXT NOT NULL,
      UNIQUE(user_id, dormitory_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (dormitory_id) REFERENCES dormitories(id) ON DELETE CASCADE
    );

    -- 9. ตารางการแจ้งเตือน (NOTIFICATIONS)
    CREATE TABLE IF NOT EXISTS notifications (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      link TEXT,
      is_read INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    -- 10. ตารางบันทึกกิจกรรม (SYSTEM_LOGS)
    CREATE TABLE IF NOT EXISTS system_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      details TEXT,
      performed_by TEXT NOT NULL,
      type TEXT DEFAULT 'system',
      created_at TEXT NOT NULL
    );

    -- 11. ตารางพื้นที่ / โซน (LOCATIONS)
    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at TEXT NOT NULL
    );

    -- 12. ตารางตั้งค่าระบบ (SYSTEM_SETTINGS)
    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    -- 13. ตารางประเภทห้อง / การเช่า (ROOM_TYPES)
    CREATE TABLE IF NOT EXISTS room_types (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      category TEXT DEFAULT 'ทั่วไป',
      description TEXT,
      created_at TEXT NOT NULL
    );
  `);

  console.log("✅ SQLite Database initialized at:", dbPath);
  try { db.exec("ALTER TABLE reviews ADD COLUMN owner_reply_name TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN owner_reply_photo TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN owner_reply_role TEXT;"); } catch (e) {}
  try { db.exec("ALTER TABLE reviews ADD COLUMN owner_reply_at TEXT;"); } catch (e) {}
  seedInitialData();
  seedLocations();
  seedRoomTypes();
  seedSettings();
  try {
    db.prepare("UPDATE users SET avatar_url = '/images/default-avatar.jpg' WHERE avatar_url IS NULL OR avatar_url = '' OR avatar_url LIKE '%user1.jpg%'").run();
  } catch (e) {
    console.error("Failed to update user avatars:", e);
  }
}

function seedSettings() {
  try {
    const count = db.prepare("SELECT COUNT(*) as count FROM system_settings").get().count;
    if (count === 0) {
      const defaultSettings = [
        ["site_name", "อยู่เลย เฮาส์"],
        ["site_name_en", "YOOLOEI HOUSE"],
        ["site_logo", "/images/logo.png"],
        ["theme_color", "#7da27c"],
        ["admin_email", "admin@yooloei.com"],
        ["contact_phone", "042-123-456"],
        ["auto_approve_dorms", "manual"]
      ];
      const stmt = db.prepare("INSERT INTO system_settings (key, value, updated_at) VALUES (?, ?, ?)");
      const now = new Date().toISOString();
      defaultSettings.forEach(([k, v]) => {
        stmt.run(k, v, now);
      });
      console.log("🌱 Default system settings seeded into SQLite.");
    }
  } catch (e) {
    console.error("Settings seeding error:", e.message);
  }
}

function seedLocations() {
  try {
    const count = db.prepare("SELECT COUNT(*) as count FROM locations").get().count;
    if (count === 0) {
      const defaultLocs = [
        "กำเนิดเพชร",
        "เชียงคาน",
        "ราชภัฏเลย",
        "โรงพยาบาลเลย",
        "โรงเรียนเลยพิท",
        "เมืองเลย",
        "นาอาน",
        "กุดป่อง"
      ];
      const stmt = db.prepare("INSERT INTO locations (id, name, description, created_at) VALUES (?, ?, ?, ?)");
      const now = new Date().toISOString();
      defaultLocs.forEach((locName, idx) => {
        stmt.run(`loc-${idx + 1}`, locName, "พื้นที่ในจังหวัดเลย", now);
      });
      console.log("🌱 Default locations seeded into SQLite.");
    }
  } catch (e) {
    console.error("Location seeding error:", e.message);
  }
}

function seedRoomTypes() {
  try {
    const count = db.prepare("SELECT COUNT(*) as count FROM room_types").get().count;
    if (count === 0) {
      const defaultTypes = [
        ["rt-1", "รายเดือน", "รูปแบบการเช่า", "เช่าระยะยาวรายเดือน"],
        ["rt-2", "รายวัน", "รูปแบบการเช่า", "เช่าระยะสั้นรายวัน"],
        ["rt-3", "ห้องแอร์", "ประเภทห้อง", "ห้องพักติดเครื่องปรับอากาศ"],
        ["rt-4", "ห้องพัดลม", "ประเภทห้อง", "ห้องพักแบบพัดลม"],
        ["rt-5", "ห้องสตูดิโอ", "ประเภทห้อง", "ห้องสตูดิโอพร้อมเฟอร์นิเจอร์"],
        ["rt-6", "ห้องชุด", "ประเภทห้อง", "ห้องชุดแบ่งสัดส่วนกว้างขวาง"]
      ];
      const stmt = db.prepare("INSERT INTO room_types (id, name, category, description, created_at) VALUES (?, ?, ?, ?, ?)");
      const now = new Date().toISOString();
      defaultTypes.forEach(([id, name, cat, desc]) => {
        stmt.run(id, name, cat, desc, now);
      });
      console.log("🌱 Default room types seeded into SQLite.");
    }
  } catch (e) {
    console.error("Room types seeding error:", e.message);
  }
}

// ข้อมูลเริ่มต้นสำหรับทดสอบระบบ
function seedInitialData() {
  const userCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
  if (userCount > 0) {
    return; // มีข้อมูลอยู่แล้ว ไม่ต้อง seed ซ้ำ
  }

  console.log("🌱 Seeding initial data into SQLite...");

  const now = new Date().toISOString();
  const adminId = crypto.randomUUID();
  const ownerId = crypto.randomUUID();
  const userId = crypto.randomUUID();

  // 1. ผู้ใช้งานเริ่มต้น
  const insertUser = db.prepare(`
    INSERT INTO users (id, email, password_hash, full_name, first_name, last_name, phone, username, role, avatar_url, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const adminPass = bcrypt.hashSync("admin1234", 10);
  const ownerPass = bcrypt.hashSync("owner1234", 10);
  const userPass = bcrypt.hashSync("user1234", 10);

  const defaultAvatar = "/images/default-avatar.jpg";
  insertUser.run(adminId, "admin@yooloei.com", adminPass, "ผู้ดูแลระบบ แอดมิน", "ผู้ดูแลระบบ", "แอดมิน", "0812345678", "admin", "admin", defaultAvatar, now, now);
  insertUser.run(ownerId, "owner@yooloei.com", ownerPass, "สมชาย เจ้าของหอ", "สมชาย", "เจ้าของหอ", "0898765432", "somchai_owner", "owner", defaultAvatar, now, now);
  insertUser.run(userId, "user@yooloei.com", userPass, "สมหญิง ผู้เช่าใจดี", "สมหญิง", "ผู้เช่าใจดี", "0851112233", "somying_user", "user", defaultAvatar, now, now);

  // 2. หอพักตัวอย่างในจังหวัดเลย
  const insertDorm = db.prepare(`
    INSERT INTO dormitories (
      id, owner_id, owner_name, name, district, address, description, phone, line_id,
      price_min, price_max, amenities, room_types, images, rating, review_count, view_count, favorite_count, status, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const dorm1Id = crypto.randomUUID();
  const dorm2Id = crypto.randomUUID();
  const dorm3Id = crypto.randomUUID();
  const dorm4Id = crypto.randomUUID();

  insertDorm.run(
    dorm1Id,
    ownerId,
    "สมชาย เจ้าของหอ",
    "อยู่เลย เฮาส์ (YooLoei House)",
    "เมืองเลย",
    "123/4 ถ.มลิวรรณ ต.กุดป่อง อ.เมือง จ.เลย 42000",
    "หอพักบรรยากาศสงบ ร่มรื่น ใกล้มหาวิทยาลัยราชภัฏเลย สิ่งอำนวยความสะดวกครบครัน มีระบบรักษาความปลอดภัย 24 ชม.",
    "089-876-5432",
    "yooloeihouse",
    2500,
    3500,
    JSON.stringify(["เครื่องปรับอากาศ", "เครื่องทำน้ำอุ่น", "Wi-Fi ฟรี", "ที่จอดรถ", "กล้องวงจรปิด", "ระบบคีย์การ์ด", "เครื่องซักผ้าหยอดเหรียญ"]),
    JSON.stringify(["ห้องพัดลม", "ห้องแอร์"]),
    JSON.stringify(["/images/dorm-hero.jpg", "/images/dorm-1.jpg", "/images/dorm-2.jpg"]),
    4.8,
    1,
    45,
    2,
    "approved",
    now,
    now
  );

  insertDorm.run(
    dorm2Id,
    ownerId,
    "สมชาย เจ้าของหอ",
    "ภูเรือ ริเวอร์ไซด์ คอนโดเทล",
    "ภูเรือ",
    "88 หมู่ 2 ต.หนองบัว อ.ภูเรือ จ.เลย 42160",
    "สัมผัสอากาศหนาวเย็นตลอดทั้งปี วิวภูเขาและสายน้ำ ใกล้แหล่งท่องเที่ยว เดินทางสะดวกสบาย",
    "082-345-6789",
    "phurua_river",
    3200,
    4500,
    JSON.stringify(["เครื่องปรับอากาศ", "เครื่องทำน้ำอุ่น", "Wi-Fi ฟรี", "ตู้เย็น", "ทีวี", "ที่จอดรถ"]),
    JSON.stringify(["ห้องแอร์ VIP", "ห้องสตูดิโอ"]),
    JSON.stringify(["/images/dorm-2.jpg", "/images/dorm-hero.jpg"]),
    4.5,
    0,
    28,
    1,
    "approved",
    now,
    now
  );

  insertDorm.run(
    dorm3Id,
    ownerId,
    "สมชาย เจ้าของหอ",
    "เชียงคาน วิวสวย หอพักนักศึกษา",
    "เชียงคาน",
    "45 ถนนชายโขง ต.เชียงคาน อ.เชียงคาน จ.เลย 42110",
    "หอพักใจกลางเชียงคาน ใกล้ถนนคนเดิน ติดริมแม่น้ำโขง สะอาด ปลอดภัย ราคาเป็นมิตร",
    "081-999-8888",
    "ckview42",
    2000,
    2800,
    JSON.stringify(["พัดลม", "Wi-Fi ฟรี", "ที่จอดรถจักรยานยนต์", "ระบบคีย์การ์ด"]),
    JSON.stringify(["ห้องพัดลม", "ห้องแอร์"]),
    JSON.stringify(["/images/dorm-1.jpg"]),
    5.0,
    0,
    19,
    0,
    "approved",
    now,
    now
  );

  // หอพักรออนุมัติ สำหรับให้แอดมินทดสอบปุ่มยืนยัน
  insertDorm.run(
    dorm4Id,
    ownerId,
    "สมชาย เจ้าของหอ",
    "หอพักใหม่ รื่นรมย์การ์เด้น (รออนุมัติ)",
    "วังสะพุง",
    "99/1 ต.วังสะพุง อ.วังสะพุง จ.เลย",
    "หอพักสร้างใหม่ บรรยากาศสวน พร้อมเปิดให้บริการ เร็วๆ นี้",
    "089-876-5432",
    "ruenrom_wang",
    2200,
    3000,
    JSON.stringify(["เครื่องปรับอากาศ", "Wi-Fi ฟรี", "ที่จอดรถ"]),
    JSON.stringify(["ห้องแอร์"]),
    JSON.stringify(["/images/dorm-hero.jpg"]),
    0,
    0,
    5,
    0,
    "pending",
    now,
    now
  );

  // 3. ห้องพักตัวอย่าง
  const insertRoom = db.prepare(`
    INSERT INTO rooms (id, dormitory_id, owner_id, room_number, room_type, price, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertRoom.run(crypto.randomUUID(), dorm1Id, ownerId, "101", "ห้องพัดลม", 2500, "available", now);
  insertRoom.run(crypto.randomUUID(), dorm1Id, ownerId, "102", "ห้องแอร์", 3500, "available", now);
  insertRoom.run(crypto.randomUUID(), dorm1Id, ownerId, "103", "ห้องแอร์", 3500, "occupied", now);
  insertRoom.run(crypto.randomUUID(), dorm2Id, ownerId, "A01", "ห้องแอร์ VIP", 4500, "available", now);

  // 4. รีวิวตัวอย่าง
  const insertReview = db.prepare(`
    INSERT INTO reviews (id, user_id, user_name, user_photo, dormitory_id, rating, comment, owner_reply, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertReview.run(
    crypto.randomUUID(),
    userId,
    "สมหญิง ผู้เช่าใจดี",
    null,
    dorm1Id,
    5,
    "หอพักสะอาด เจ้าของหอดูแลดีมาก ใกล้ของกิน แนะนำเลยค่ะ!",
    "ขอบคุณมากครับ ทางเรายินดีให้บริการเสมอครับ",
    now,
    now
  );

  // 5. รายการโปรดตัวอย่าง
  const insertFav = db.prepare(`
    INSERT INTO favorites (id, user_id, dormitory_id, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertFav.run(crypto.randomUUID(), userId, dorm1Id, now);

  console.log("🌱 Seeding completed successfully!");
}
