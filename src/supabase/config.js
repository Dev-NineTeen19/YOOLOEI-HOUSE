import { createClient } from "@supabase/supabase-js";

// ดึงค่า URL และ anon Key ของโครงการ kwjktlaldlquuovnteos
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://kwjktlaldlquuovnteos.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_Y-4RFkxNOczFOKDc-POt9g_cAqXE-9a";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
