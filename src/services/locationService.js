import { supabase } from "../supabase/config";

const DEFAULT_LOCATIONS = [
  { id: "loc-1", name: "กำเนิดเพชร", description: "ใกล้ มรภ.เลย" },
  { id: "loc-2", name: "เชียงคาน", description: "แหล่งท่องเที่ยว" },
  { id: "loc-3", name: "ราชภัฏเลย", description: "โซนสถานศึกษา" },
  { id: "loc-4", name: "โรงพยาบาลเลย", description: "ศูนย์การแพทย์" },
  { id: "loc-5", name: "โรงเรียนเลยพิท", description: "สถานศึกษา" },
  { id: "loc-6", name: "เมืองเลย", description: "ศูนย์กลางเมือง" },
  { id: "loc-7", name: "นาอาน", description: "ชุมชนที่อยู่อาศัย" },
  { id: "loc-8", name: "กุดป่อง", description: "ใกล้มหาวิทยาลัย" }
];

// 1. ดึงรายการพื้นที่/โซนทั้งหมดจาก Supabase
export async function getLocations() {
  try {
    const { data, error } = await supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true });

    if (error || !data || data.length === 0) {
      return DEFAULT_LOCATIONS;
    }
    return data;
  } catch (error) {
    console.error("Error fetching locations from Supabase:", error);
    return DEFAULT_LOCATIONS;
  }
}

// 2. แอดมินเพิ่มพื้นที่ใหม่ใน Supabase
export async function addLocation(name, description = "") {
  try {
    const newId = `loc_${Date.now()}`;
    const { data, error } = await supabase
      .from("locations")
      .insert([{ id: newId, name, description, created_at: new Date().toISOString() }])
      .select();

    if (error) throw error;
    return data?.[0] || { id: newId, name, description };
  } catch (error) {
    console.error("Error adding location to Supabase:", error);
    throw error;
  }
}

// 3. แอดมินแก้ไขพื้นที่ใน Supabase
export async function updateLocation(id, name, description = "") {
  try {
    const { data, error } = await supabase
      .from("locations")
      .update({ name, description, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select();

    if (error) throw error;
    return data?.[0] || { id, name, description };
  } catch (error) {
    console.error("Error updating location in Supabase:", error);
    throw error;
  }
}

// 4. แอดมินลบพื้นที่ใน Supabase
export async function deleteLocation(id) {
  try {
    const { error } = await supabase
      .from("locations")
      .delete()
      .eq("id", id);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error("Error deleting location in Supabase:", error);
    throw error;
  }
}
