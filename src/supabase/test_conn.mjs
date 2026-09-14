import { createClient } from "@supabase/supabase-js";

const key = "sb_publishable_d557fUvPQ0Bb1rYzoy1BMQ_GbwDlkuG";

async function testProject(url) {
  console.log(`Testing ${url}...`);
  const client = createClient(url, key);
  const { data, error } = await client.from("dormitories").select("count");
  if (error) {
    console.log(`Error for ${url}:`, error.message, error.code);
  } else {
    console.log(`Success for ${url}:`, data);
  }
}

async function run() {
  await testProject("https://cekzcpyqxlvfgfiltysi.supabase.co");
  await testProject("https://npifzkbdjpfkkukeyhab.supabase.co");
}

run();
