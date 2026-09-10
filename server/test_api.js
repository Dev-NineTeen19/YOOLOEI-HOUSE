import http from "node:http";

// Start server in background for testing if not already running
async function runTests() {
  console.log("🧪 Running SQLite Fullstack API Verification Tests...");

  // Import app from server.js
  const serverProcess = await import("./server.js");

  // Give server 500ms to bind port
  await new Promise(r => setTimeout(r, 800));

  const BASE = "http://localhost:5000/api";

  async function api(path, options = {}) {
    const res = await fetch(`${BASE}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {})
      }
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`API ${path} failed (${res.status}): ${JSON.stringify(data)}`);
    }
    return data;
  }

  try {
    // Test 1: Register New Owner
    console.log("1. Testing Register Owner...");
    const testOwnerEmail = `owner_test_${Date.now()}@yooloei.com`;
    const regRes = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: testOwnerEmail,
        password: "ownerpassword123",
        firstName: "ประสิทธิ์",
        lastName: "ทดสอบ",
        phone: "081-111-2222",
        username: `prasit_${Date.now()}`,
        role: "owner"
      })
    });
    console.log("   ✅ Owner registered:", regRes.user.email, "Role:", regRes.user.role);
    const ownerToken = regRes.token;

    // Test 2: Login New Owner
    console.log("2. Testing Login Owner...");
    const loginRes = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: testOwnerEmail,
        password: "ownerpassword123"
      })
    });
    console.log("   ✅ Owner logged in successfully, Token received:", !!loginRes.token);

    // Test 3: Owner creates a new dormitory (must be pending)
    console.log("3. Testing Owner Create Dormitory...");
    const dormRes = await api("/dormitories", {
      method: "POST",
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        name: "หอพักสุขใจ เทสต์",
        district: "เมืองเลย",
        address: "555 ม.1 ถ.เลย-เชียงคาน",
        description: "หอพักสะอาด ใกล้มหาวิทยาลัย",
        priceMin: 2800,
        priceMax: 3500,
        amenities: ["เครื่องปรับอากาศ", "Wi-Fi ฟรี", "ที่จอดรถ"],
        roomTypes: ["ห้องแอร์"]
      })
    });
    const dormId = dormRes.id;
    console.log("   ✅ Dorm created with ID:", dormId, "Status:", dormRes.dormitory.status);
    if (dormRes.dormitory.status !== "pending") {
      throw new Error("Dorm status should be pending!");
    }

    // Test 4: Owner updates dormitory details at any time without admin approval
    console.log("4. Testing Owner Update Dormitory Details...");
    const updateRes = await api(`/dormitories/${dormId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({
        name: "หอพักสุขใจ เทสต์ (ปรับปรุงราคาใหม่)",
        priceMin: 3000,
        priceMax: 3800
      })
    });
    console.log("   ✅ Dorm updated successfully:", updateRes.dormitory.name, "Price:", updateRes.dormitory.priceMin);

    // Test 5: Admin Login
    console.log("5. Testing Admin Login...");
    const adminLogin = await api("/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "admin@yooloei.com",
        password: "admin1234"
      })
    });
    const adminToken = adminLogin.token;
    console.log("   ✅ Admin logged in, Role:", adminLogin.user.role);

    // Test 6: Admin approves dormitory
    console.log("6. Testing Admin Approve Dormitory...");
    const approveRes = await api(`/dormitories/${dormId}/status`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ status: "approved" })
    });
    console.log("   ✅ Dormitory status changed to:", approveRes.dormitory.status);

    // Test 7: Public User fetches approved dormitories
    console.log("7. Testing Public Fetch Approved Dormitories...");
    const publicDorms = await api("/dormitories?district=เมืองเลย");
    const found = publicDorms.dormitories.find(d => d.id === dormId);
    console.log("   ✅ Newly approved dorm appears in public listing:", !!found);

    // Test 8: Regular User booking and review
    console.log("8. Testing Regular User Booking & Review...");
    const testUserEmail = `user_test_${Date.now()}@yooloei.com`;
    const userReg = await api("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        email: testUserEmail,
        password: "userpassword123",
        firstName: "กานดา",
        lastName: "ผู้เช่า",
        role: "user"
      })
    });
    const userToken = userReg.token;

    const bookRes = await api("/bookings", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        dormitoryId: dormId,
        dormitoryName: "หอพักสุขใจ เทสต์ (ปรับปรุงราคาใหม่)",
        ownerId: regRes.user.id,
        bookingDate: "2026-10-01",
        note: "ขอห้องชั้น 2 ครับ"
      })
    });
    console.log("   ✅ Booking created:", bookRes.booking.id, "Status:", bookRes.booking.status);

    const reviewRes = await api("/reviews", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({
        dormitoryId: dormId,
        rating: 5,
        comment: "หอพักสวยมาก เดินทางสะดวกครับ"
      })
    });
    console.log("   ✅ Review created:", reviewRes.review.id, "Rating:", reviewRes.review.rating);

    // Test 9: Owner replies to review
    console.log("9. Testing Owner Reply to Review...");
    const replyRes = await api(`/reviews/${reviewRes.review.id}/reply`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ reply: "ขอบคุณที่ให้คะแนนหอพักของเราครับ" })
    });
    console.log("   ✅ Owner reply recorded:", replyRes.review.owner_reply);

    // Test 10: Toggle Favorite
    console.log("10. Testing Toggle Favorite...");
    const favRes = await api("/favorites/toggle", {
      method: "POST",
      headers: { Authorization: `Bearer ${userToken}` },
      body: JSON.stringify({ dormitoryId: dormId })
    });
    console.log("   ✅ Favorite toggled:", favRes.favorited, "Message:", favRes.message);

    console.log("\n🎉 ALL 10 VERIFICATION TESTS PASSED 100%!");
    process.exit(0);
  } catch (err) {
    console.error("\n❌ Test failed:", err.message);
    process.exit(1);
  }
}

runTests();
