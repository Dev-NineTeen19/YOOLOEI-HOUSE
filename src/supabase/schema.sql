-- =========================================================================
-- YOOLOEI HOUSE - SUPABASE DATABASE MIGRATION SCRIPT (CREATE TABLES & SEED)
-- คัดลอกสคริปต์นี้ไปวางใน Supabase Dashboard -> SQL Editor แล้วกด Run ได้เลยครับ!
-- =========================================================================

-- ลบตารางเก่า (หากมีอยู่) เพื่อป้องกันโครงสร้างชนกัน
DROP TABLE IF EXISTS room_types CASCADE;
DROP TABLE IF EXISTS locations CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS view_history CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS favorites CASCADE;
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS dormitories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. ตารางผู้ใช้งาน (USERS)
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  username TEXT,
  avatar_url TEXT DEFAULT '/images/default-avatar.jpg',
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ตารางหอพัก (DORMITORIES)
CREATE TABLE dormitories (
  id TEXT PRIMARY KEY,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  owner_name TEXT,
  name TEXT NOT NULL,
  tagline TEXT,
  district TEXT NOT NULL DEFAULT 'เมืองเลย',
  address TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  line_id TEXT,
  price_min NUMERIC DEFAULT 3500,
  price_max NUMERIC DEFAULT 3500,
  amenities JSONB DEFAULT '["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"]'::jsonb,
  room_types JSONB DEFAULT '["ห้องแอร์"]'::jsonb,
  images JSONB DEFAULT '["/images/dorm-1.jpg"]'::jsonb,
  rating NUMERIC DEFAULT 5,
  review_count INT DEFAULT 0,
  view_count INT DEFAULT 0,
  favorite_count INT DEFAULT 0,
  status TEXT DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. ตารางห้องพัก (ROOMS)
CREATE TABLE rooms (
  id TEXT PRIMARY KEY,
  dormitory_id TEXT REFERENCES dormitories(id) ON DELETE CASCADE,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. ตารางการจอง (BOOKINGS)
CREATE TABLE bookings (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT,
  user_name TEXT,
  user_phone TEXT,
  owner_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  dormitory_id TEXT REFERENCES dormitories(id) ON DELETE CASCADE,
  dormitory_name TEXT NOT NULL,
  room_id TEXT,
  room_number TEXT DEFAULT 'ห้องมาตรฐาน',
  booking_date TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. ตารางรีวิว (REVIEWS)
CREATE TABLE reviews (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  user_name TEXT,
  user_photo TEXT,
  dormitory_id TEXT REFERENCES dormitories(id) ON DELETE CASCADE,
  dormitory_name TEXT,
  rating INT DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  owner_reply TEXT,
  owner_reply_name TEXT,
  owner_reply_photo TEXT,
  owner_reply_role TEXT,
  owner_reply_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. ตารางรายการโปรด (FAVORITES)
CREATE TABLE favorites (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  dormitory_id TEXT REFERENCES dormitories(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, dormitory_id)
);

-- 7. ตารางข้อความแชท (MESSAGES)
CREATE TABLE messages (
  id TEXT PRIMARY KEY,
  sender_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  sender_name TEXT,
  receiver_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  receiver_name TEXT,
  dormitory_id TEXT,
  dormitory_name TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. ตารางประวัติการดูหอพัก (VIEW_HISTORY)
CREATE TABLE view_history (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  dormitory_id TEXT REFERENCES dormitories(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, dormitory_id)
);

-- 9. ตารางการแจ้งเตือน (NOTIFICATIONS)
CREATE TABLE notifications (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'system',
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. ตารางพื้นที่ / โซน (LOCATIONS)
CREATE TABLE locations (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. ตารางประเภทห้อง / การเช่า (ROOM_TYPES)
CREATE TABLE room_types (
  id TEXT PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'ทั่วไป',
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =========================================================================
-- SEED INITIAL SAMPLE DATA (ข้อมูลตัวอย่างเริ่มต้น)
-- =========================================================================

-- Seed Users First (Required for foreign key constraints)
INSERT INTO users (id, email, full_name, first_name, last_name, phone, role) VALUES
  ('owner_1', 'owner1@yooloei.com', 'สมชาย เจ้าของหอ', 'สมชาย', 'เจ้าของหอ', '081-234-5678', 'owner'),
  ('owner_2', 'owner2@yooloei.com', 'สมหญิง เจ้าของหอ', 'สมหญิง', 'เจ้าของหอ', '085-111-2233', 'owner'),
  ('user_1', 'user1@yooloei.com', 'ผู้ใช้งาน ทดสอบ', 'ผู้ใช้งาน', 'ทดสอบ', '089-999-9999', 'user')
ON CONFLICT (id) DO NOTHING;

-- Seed Locations
INSERT INTO locations (id, name, description) VALUES
  ('loc-1', 'กำเนิดเพชร', 'ใกล้ มรภ.เลย'),
  ('loc-2', 'เชียงคาน', 'แหล่งท่องเที่ยว'),
  ('loc-3', 'ราชภัฏเลย', 'โซนสถานศึกษา'),
  ('loc-4', 'โรงพยาบาลเลย', 'ศูนย์การแพทย์'),
  ('loc-5', 'โรงเรียนเลยพิท', 'สถานศึกษา'),
  ('loc-6', 'เมืองเลย', 'ศูนย์กลางเมือง'),
  ('loc-7', 'นาอาน', 'ชุมชนที่อยู่อาศัย'),
  ('loc-8', 'กุดป่อง', 'ใกล้มหาวิทยาลัย')
ON CONFLICT (id) DO NOTHING;

-- Seed Room Types
INSERT INTO room_types (id, name, category, description) VALUES
  ('rt-1', 'รายเดือน', 'รูปแบบการเช่า', 'เช่าระยะยาวรายเดือน'),
  ('rt-2', 'รายวัน', 'รูปแบบการเช่า', 'เช่าระยะสั้นรายวัน'),
  ('rt-3', 'ห้องแอร์', 'ประเภทห้อง', 'ห้องพักติดเครื่องปรับอากาศ'),
  ('rt-4', 'ห้องพัดลม', 'ประเภทห้อง', 'ห้องพักแบบพัดลม'),
  ('rt-5', 'ห้องสตูดิโอ', 'ประเภทห้อง', 'ห้องสตูดิโอพร้อมเฟอร์นิเจอร์'),
  ('rt-6', 'ห้องชุด', 'ประเภทห้อง', 'ห้องชุดแบ่งสัดส่วนกว้างขวาง')
ON CONFLICT (id) DO NOTHING;

-- Seed Sample Dormitories
INSERT INTO dormitories (id, owner_id, owner_name, name, district, address, description, phone, line_id, price_min, price_max, amenities, room_types, images, rating, review_count, status) VALUES
  ('sample-1', 'owner_1', 'สมชาย เจ้าของหอ', 'หอพัก อเธน่า', 'เมืองเลย', '1.2 km จากราชภัฏเลย', 'หอพักสะอาด ใกล้มหาวิทยาลัย ปลอดภัย', '081-234-5678', '@athena', 3500, 3500, '["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"]'::jsonb, '["ห้องแอร์"]'::jsonb, '["/images/dorm-1.jpg"]'::jsonb, 5, 12, 'approved'),
  ('sample-2', 'owner_1', 'สมชาย เจ้าของหอ', 'หอพัก ภูผาอินทร์', 'เมืองเลย', '1.2 km จากราชภัฏเลย', 'บรรยากาศดี สงบ เหมาะกับการอ่านหนังสือ', '089-876-5432', '@phupha', 3500, 3500, '["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"]'::jsonb, '["ห้องแอร์"]'::jsonb, '["/images/dorm-1.jpg"]'::jsonb, 5, 8, 'approved'),
  ('sample-3', 'owner_2', 'สมหญิง เจ้าของหอ', 'บ้านพักสบาย เชียงคาน', 'เชียงคาน', 'ใกล้ถนนคนเดินเชียงคาน', 'บ้านพักสไตล์โฮมสเตย์ ริมแม่น้ำโขง', '085-111-2233', '@chiangkhan', 4000, 4000, '["ห้องแอร์", "ฟรี WiFi", "เครื่องทำน้ำอุ่น"]'::jsonb, '["ห้องสตูดิโอ"]'::jsonb, '["/images/dorm-1.jpg"]'::jsonb, 5, 15, 'approved'),
  ('sample-4', 'owner_1', 'สมชาย เจ้าของหอ', 'หอพัก อานนท์', 'เมืองเลย', '1.2 km จากราชภัฏเลย', 'หอพักราคาย่อมเยา ปลอดภัย มีกล้องวงจรปิด', '084-555-6677', '@arnon', 3500, 3500, '["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"]'::jsonb, '["ห้องพัดลม"]'::jsonb, '["/images/dorm-1.jpg"]'::jsonb, 5, 6, 'approved')
ON CONFLICT (id) DO NOTHING;

-- Disable Row Level Security (RLS) for Public Client Access
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE dormitories DISABLE ROW LEVEL SECURITY;
ALTER TABLE rooms DISABLE ROW LEVEL SECURITY;
ALTER TABLE bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE reviews DISABLE ROW LEVEL SECURITY;
ALTER TABLE favorites DISABLE ROW LEVEL SECURITY;
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE view_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE locations DISABLE ROW LEVEL SECURITY;
ALTER TABLE room_types DISABLE ROW LEVEL SECURITY;
