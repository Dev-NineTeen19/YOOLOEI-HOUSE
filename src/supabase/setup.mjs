import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://cekzcpyqxlvfgfiltysi.supabase.co";
const supabaseAnonKey = "sb_publishable_d557fUvPQ0Bb1rYzoy1BMQ_GbwDlkuG";

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function setup() {
  console.log("Testing Supabase Storage Bucket creation...");
  const buckets = ["avatars", "dormitories", "rooms"];
  for (const b of buckets) {
    const { data, error } = await supabase.storage.createBucket(b, { public: true });
    if (error) {
      console.log(`Bucket '${b}':`, error.message);
    } else {
      console.log(`Bucket '${b}' created successfully!`, data);
    }
  }
}

setup();
