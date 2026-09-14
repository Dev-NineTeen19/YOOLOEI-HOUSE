import { supabase } from "../supabase/config";

// แปลงไฟล์เป็น Base64 Data URL สำหรับเป็นทางเลือกสำรองภาพอัปโหลด
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

// ฟังก์ชันอัปโหลดหลักเข้า Supabase Storage
async function uploadToSupabaseBucket(bucket, path, file) {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${path}_${Date.now()}.${fileExt}`;
    const filePath = `${fileName}`;

    // ลองอัปโหลดเข้า Supabase Storage Bucket
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, { upsert: true });

    if (error) throw error;

    // ดึง Public URL ของไฟล์
    const { data: publicUrlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath);

    return publicUrlData.publicUrl;
  } catch (err) {
    console.warn(`Supabase storage upload error in bucket '${bucket}':`, err);
    // สำรอง: แปลงเป็น Data URL เพื่อให้รูปแสดงผลได้ 100% เสมอ
    return await fileToDataUrl(file);
  }
}

// 1. อัปโหลดรูปภาพ Avatar ผู้ใช้
export async function uploadUserAvatar(userId, file) {
  return uploadToSupabaseBucket("avatars", `user_${userId || "avatar"}`, file);
}

// 2. อัปโหลดรูปภาพหอพัก
export async function uploadDormitoryImage(dormitoryId, file) {
  return uploadToSupabaseBucket("dormitories", `dorm_${dormitoryId || "img"}`, file);
}

// 3. อัปโหลดรูปภาพห้องพัก
export async function uploadRoomImage(roomId, file) {
  return uploadToSupabaseBucket("rooms", `room_${roomId || "img"}`, file);
}
