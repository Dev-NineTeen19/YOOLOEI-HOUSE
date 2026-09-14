import { createClient } from "@supabase/supabase-js";

// ดึงค่า URL และ anon Key ของโครงการ cekzcpyqxlvfgfiltysi
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cekzcpyqxlvfgfiltysi.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_d557fUvPQ0Bb1rYzoy1BMQ_GbwDlkuG";


export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
