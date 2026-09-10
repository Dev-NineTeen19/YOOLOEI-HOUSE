-- =====================================================
-- YOOLOEI HOUSE (อยู่เลย เฮาส์) - SUPABASE DATABASE SCHEMA
-- รันโค้ดนี้ใน Supabase Dashboard -> SQL Editor
-- =====================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. สร้างตาราง PROFILES (เก็บข้อมูลผู้ใช้งานและ Role)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  first_name TEXT,
  last_name TEXT,
  phone TEXT,
  username TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'owner', 'admin')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. สร้างตาราง DORMITORIES (หอพัก)
CREATE TABLE IF NOT EXISTS public.dormitories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  owner_name TEXT,
  name TEXT NOT NULL,
  district TEXT NOT NULL,
  address TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  line_id TEXT,
  price_min NUMERIC DEFAULT 0,
  price_max NUMERIC DEFAULT 0,
  amenities TEXT[] DEFAULT '{}',
  room_types TEXT[] DEFAULT '{}',
  images TEXT[] DEFAULT '{}',
  rating NUMERIC DEFAULT 0,
  review_count INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  favorite_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. สร้างตาราง ROOMS (ห้องพัก)
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dormitory_id UUID REFERENCES public.dormitories(id) ON DELETE CASCADE NOT NULL,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL,
  price NUMERIC DEFAULT 0,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'reserved', 'occupied')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. สร้างตาราง BOOKINGS (การจองห้องพัก)
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_email TEXT,
  user_name TEXT,
  user_phone TEXT,
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dormitory_id UUID REFERENCES public.dormitories(id) ON DELETE CASCADE NOT NULL,
  dormitory_name TEXT NOT NULL,
  room_id TEXT,
  room_number TEXT,
  booking_date TEXT NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled', 'completed')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. สร้างตาราง REVIEWS (รีวิวหอพัก)
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  user_name TEXT,
  user_photo TEXT,
  dormitory_id UUID REFERENCES public.dormitories(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  owner_reply TEXT,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. สร้างตาราง FAVORITES (รายการโปรด)
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  dormitory_id UUID REFERENCES public.dormitories(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(user_id, dormitory_id)
);

-- =====================================================
-- DATABASE TRIGGER: สร้าง Profile อัตโนมัติเมื่อ User สมัครสมาชิก
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    email,
    full_name,
    first_name,
    last_name,
    phone,
    username,
    role
  ) VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'displayName', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'user')
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- เปิด RLS ให้ทุกตาราง
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dormitories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Helper Function ตรวจสอบ Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$ LANGUAGE sql SECURITY DEFINER;

-- 1. นโยบายสำหรับ PROFILES
-- ทุกคนอ่านโปรไฟล์ได้
CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT USING (true);

-- ผู้ใช้สามารถอัปเดตข้อมูลของตนเองได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- 2. นโยบายสำหรับ DORMITORIES
-- ผู้ใช้งานและ Guest อ่านหอพักที่อนุมัติแล้วได้ (หรือเจ้าของหออ่านของตัวเองได้ทุกสถานะ หรือแอดมินอ่านได้ทั้งหมด)
CREATE POLICY "View approved dormitories or own dormitories"
  ON public.dormitories FOR SELECT
  USING (status = 'approved' OR auth.uid() = owner_id OR public.is_admin());

-- เจ้าของหอพักสามารถลงประกาศหอพักใหม่ได้ (สถานะเริ่มต้นจะเป็น 'pending' เสมอ)
CREATE POLICY "Authenticated users can create dormitories"
  ON public.dormitories FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- เจ้าของหอพักสามารถอัปเดตข้อมูลหอพักของตนเองได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!
-- (ยกเว้นการเปลี่ยนสถานะเป็น 'approved' ที่ต้องทำโดย Admin)
CREATE POLICY "Owners can update own dormitory details"
  ON public.dormitories FOR UPDATE
  USING (auth.uid() = owner_id OR public.is_admin());

-- เจ้าของหอพักหรือแอดมินสามารถลบหอพักได้
CREATE POLICY "Owners or admin can delete dormitory"
  ON public.dormitories FOR DELETE
  USING (auth.uid() = owner_id OR public.is_admin());

-- 3. นโยบายสำหรับ ROOMS
-- ทุกคนอ่านข้อมูลห้องพักได้
CREATE POLICY "Rooms are viewable by everyone"
  ON public.rooms FOR SELECT USING (true);

-- เจ้าของหอพักสามารถเพิ่ม, อัปเดตราคา/สถานะห้องว่าง, และลบห้องพักของตนเองได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!
CREATE POLICY "Owners can manage own rooms"
  ON public.rooms FOR ALL
  USING (auth.uid() = owner_id OR public.is_admin());

-- 4. นโยบายสำหรับ BOOKINGS
-- ผู้เช่าและเจ้าของหอพักดูการจองของตนเองได้
CREATE POLICY "Users and owners can view bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() = owner_id OR public.is_admin());

-- ผู้เช่าสามารถสร้างคำขอจองห้องพักได้
CREATE POLICY "Users can create bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ผู้เช่าสามารถยกเลิกการจองได้ และเจ้าของหอพักสามารถอนุมัติ/ปฏิเสธคำขอจองได้ตลอดเวลา
CREATE POLICY "Users and owners can update booking status"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() = owner_id OR public.is_admin());

-- 5. นโยบายสำหรับ REVIEWS
-- ทุกคนอ่านรีวิวได้
CREATE POLICY "Reviews are viewable by everyone"
  ON public.reviews FOR SELECT USING (true);

-- ผู้เช่าสามารถเขียนรีวิวได้
CREATE POLICY "Users can create review"
  ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ผู้เช่าแก้ไขรีวิวของตนเองได้ หรือเจ้าของหอพักพิมพ์ตอบกลับรีวิว (owner_reply) ได้ตลอดเวลาโดยไม่ต้องผ่านแอดมิน!
CREATE POLICY "Users can edit own review and owners can reply"
  ON public.reviews FOR UPDATE
  USING (
    auth.uid() = user_id OR
    EXISTS (SELECT 1 FROM public.dormitories WHERE id = dormitory_id AND owner_id = auth.uid()) OR
    public.is_admin()
  );

-- ผู้เช่าหรือแอดมินสามารถลบรีวิวได้
CREATE POLICY "Users or admin can delete review"
  ON public.reviews FOR DELETE
  USING (auth.uid() = user_id OR public.is_admin());

-- 6. นโยบายสำหรับ FAVORITES
CREATE POLICY "Users can view own favorites"
  ON public.favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add favorites"
  ON public.favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove favorites"
  ON public.favorites FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- STORAGE BUCKETS (สร้าง Bucket สำหรับเก็บรูปภาพ)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('dormitories', 'dormitories', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- นโยบาย Storage: ทุกคนดูรูปได้ ผู้ใช้งานที่ล็อกอินแล้วอัปโหลดรูปได้
CREATE POLICY "Public read storage dormitories"
  ON storage.objects FOR SELECT
  USING (bucket_id IN ('dormitories', 'avatars'));

CREATE POLICY "Authenticated users can upload images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id IN ('dormitories', 'avatars') AND auth.role() = 'authenticated');

CREATE POLICY "Users can update or delete own images"
  ON storage.objects FOR UPDATE
  USING (bucket_id IN ('dormitories', 'avatars') AND auth.role() = 'authenticated');
