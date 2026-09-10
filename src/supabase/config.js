import { createClient } from "@supabase/supabase-js";

// ดึงค่า URL และ anon Key ของโครงการ cekzcpyqxlvfgfiltysi
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || "https://cekzcpyqxlvfgfiltysi.supabase.co";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNla3pjcHlxeGx2ZmdmaWx0eXNpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg2OTU4MTIsImV4cCI6MjEwNDI3MTgxMn0.d7dp9u7CillmueeGP6mh6A747dpG3_ie99HaasifyC4";

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true
  }
});

export default supabase;
