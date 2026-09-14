import { supabase } from "../supabase/config";

const FALLBACK_DORMS = [
  {
    id: "sample-1",
    name: "หอพัก อเธน่า",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"],
    status: "approved"
  },
  {
    id: "sample-2",
    name: "หอพัก ภูผาอินทร์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องแอร์", "ฟรี WiFi", "ที่จอดรถ"],
    status: "approved"
  },
  {
    id: "sample-3",
    name: "บ้านพักสบาย เชียงคาน",
    district: "เชียงคาน",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 4000,
    priceMax: 4000,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องแอร์", "ฟรี WiFi", "เครื่องทำน้ำอุ่น"],
    status: "approved"
  },
  {
    id: "sample-4",
    name: "หอพัก อานนท์",
    district: "เมืองเลย",
    address: "1.2 km จากราชภัฏเลย",
    priceMin: 3500,
    priceMax: 3500,
    rating: 5,
    images: ["/images/dorm-1.jpg"],
    amenities: ["ห้องพัดลม", "ฟรี WiFi", "ที่จอดรถ"],
    status: "approved"
  }
];

// Helper ปรับข้อมูลจาก Supabase DB ให้อยู่ในฟอร์แมต camelCase ของ Frontend
function mapDormFields(d) {
  if (!d) return null;
  return {
    id: d.id,
    name: d.name,
    tagline: d.tagline || "",
    district: d.district || "เมืองเลย",
    address: d.address || "",
    description: d.description || "",
    priceMin: Number(d.price_min || d.priceMin || 3500),
    priceMax: Number(d.price_max || d.priceMax || 3500),
    phone: d.phone || "",
    lineId: d.line_id || d.lineId || "",
    amenities: Array.isArray(d.amenities) ? d.amenities : (typeof d.amenities === "string" ? JSON.parse(d.amenities || "[]") : ["ห้องแอร์", "ฟรี WiFi"]),
    roomTypes: Array.isArray(d.room_types) ? d.room_types : (typeof d.room_types === "string" ? JSON.parse(d.room_types || "[]") : ["ห้องแอร์"]),
    images: Array.isArray(d.images) ? d.images : (typeof d.images === "string" ? JSON.parse(d.images || "[]") : ["/images/dorm-1.jpg"]),
    rating: Number(d.rating || 5),
    reviewCount: Number(d.review_count || d.reviewCount || 0),
    ownerId: d.owner_id || d.ownerId || "",
    status: d.status || "approved",
    viewCount: Number(d.view_count || d.viewCount || 0),
    createdAt: d.created_at || d.createdAt
  };
}

// 1. ดึงหอพักที่ได้รับการอนุมัติ (สำหรับ Guest / User ทั่วไป)
export async function getApprovedDormitories(filters = {}) {
  try {
    let query = supabase.from("dormitories").select("*").eq("status", "approved");

    if (filters.name) {
      query = query.ilike("name", `%${filters.name}%`);
    }
    if (filters.district) {
      query = query.eq("district", filters.district);
    }

    const { data, error } = await query;
    if (error || !data || data.length === 0) {
      return FALLBACK_DORMS;
    }
    return data.map(mapDormFields);
  } catch (error) {
    console.warn("getApprovedDormitories Supabase warning:", error);
    return FALLBACK_DORMS;
  }
}

// 2. ดึงหอพักตาม ID พร้อมข้อมูล
export async function getDormitoryById(id) {
  try {
    const { data, error } = await supabase
      .from("dormitories")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      const match = FALLBACK_DORMS.find((d) => d.id === id);
      return match ? mapDormFields(match) : null;
    }
    return mapDormFields(data);
  } catch (error) {
    console.error("Error fetching Supabase dormitory by id:", error);
    const match = FALLBACK_DORMS.find((d) => d.id === id);
    return match ? mapDormFields(match) : null;
  }
}

// 3. ดึงหอพักของเจ้าของหอ (Owner)
export async function getDormitoriesByOwner(ownerId) {
  try {
    const { data, error } = await supabase
      .from("dormitories")
      .select("*")
      .eq("owner_id", ownerId);

    if (error || !data) return [];
    return data.map(mapDormFields);
  } catch (error) {
    console.error("Error fetching owner dormitories from Supabase:", error);
    return [];
  }
}

// 4. ดึงหอพักทั้งหมดในระบบ (สำหรับ Admin)
export async function getAllDormitoriesAdmin() {
  try {
    const { data, error } = await supabase
      .from("dormitories")
      .select("*")
      .order("created_at", { ascending: false });

    if (error || !data || data.length === 0) {
      return FALLBACK_DORMS;
    }
    return data.map(mapDormFields);
  } catch (error) {
    console.error("Error fetching all dormitories for admin from Supabase:", error);
    return FALLBACK_DORMS;
  }
}

// 5. เจ้าของเพิ่มหอพักใหม่
export async function createDormitory(data, ownerId) {
  const newId = `dorm_${Date.now()}`;
  const payload = {
    id: newId,
    name: data.name,
    tagline: data.tagline || "",
    district: data.district || "เมืองเลย",
    address: data.address || "",
    description: data.description || "",
    price_min: Number(data.priceMin || 3500),
    price_max: Number(data.priceMax || 3500),
    phone: data.phone || "",
    line_id: data.lineId || "",
    amenities: data.amenities || ["ห้องแอร์", "ฟรี WiFi"],
    room_types: data.roomTypes || ["ห้องแอร์"],
    images: data.images || ["/images/dorm-1.jpg"],
    rating: 5,
    review_count: 0,
    owner_id: ownerId,
    status: "pending",
    created_at: new Date().toISOString()
  };

  const { data: created, error } = await supabase
    .from("dormitories")
    .insert([payload])
    .select();

  if (error) {
    console.error("createDormitory Supabase error:", error);
  }
  return created?.[0]?.id || newId;
}

// 6. เจ้าของแก้ไขข้อมูลหอพักตนเอง
export async function updateDormitory(id, data) {
  const updatePayload = {
    name: data.name,
    tagline: data.tagline,
    district: data.district,
    address: data.address,
    description: data.description,
    price_min: data.priceMin !== undefined ? Number(data.priceMin) : undefined,
    price_max: data.priceMax !== undefined ? Number(data.priceMax) : undefined,
    phone: data.phone,
    line_id: data.lineId,
    amenities: data.amenities,
    room_types: data.roomTypes,
    images: data.images,
    updated_at: new Date().toISOString()
  };

  Object.keys(updatePayload).forEach((k) => {
    if (updatePayload[k] === undefined) delete updatePayload[k];
  });

  const { data: updated, error } = await supabase
    .from("dormitories")
    .update(updatePayload)
    .eq("id", id)
    .select();

  if (error) console.error("updateDormitory Supabase error:", error);
  return mapDormFields(updated?.[0] || data);
}

// 7. Admin อนุมัติ / ปฏิเสธ หอพัก
export async function setDormitoryStatus(id, status) {
  const { data: updated, error } = await supabase
    .from("dormitories")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select();

  if (error) console.error("setDormitoryStatus Supabase error:", error);
  return mapDormFields(updated?.[0] || { id, status });
}

// 8. ลบหอพัก
export async function deleteDormitory(id) {
  const { error } = await supabase
    .from("dormitories")
    .delete()
    .eq("id", id);

  if (error) console.error("deleteDormitory Supabase error:", error);
  return true;
}

// 9. เพิ่มยอดวิว
export async function incrementDormView(id) {
  try {
    const { data: current } = await supabase
      .from("dormitories")
      .select("view_count")
      .eq("id", id)
      .single();

    const count = Number(current?.view_count || 0) + 1;
    await supabase.from("dormitories").update({ view_count: count }).eq("id", id);
  } catch {
    // Optional
  }
}
