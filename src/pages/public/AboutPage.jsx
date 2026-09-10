import { Link } from "react-router-dom";

export default function AboutPage() {
  return (
    <div>
      {/* =====================================================
              1. HERO BANNER SECTION (Same UI as HomePage)
      ===================================================== */}
      <section
        className="home-hero-container"
        style={{
          position: "relative",
          width: "100%",
          minHeight: "460px",
          background: "url('/images/banner.jpg') center right / cover no-repeat",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          paddingBottom: "70px"
        }}
      >
        {/* Light Green Overlay on Left */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(90deg, rgba(235, 245, 233, 0.96) 0%, rgba(235, 245, 233, 0.85) 50%, rgba(255, 255, 255, 0.15) 100%)",
            zIndex: 1
          }}
        ></div>

        <div
          style={{
            position: "relative",
            zIndex: 2,
            maxWidth: "1120px",
            width: "100%",
            margin: "0 auto",
            padding: "50px 30px 40px 30px"
          }}
        >
          <div style={{ maxWidth: "650px" }}>
            <span
              style={{
                backgroundColor: "#c8dfc6",
                color: "#2e4a2c",
                fontSize: "13px",
                fontWeight: "700",
                padding: "4px 14px",
                borderRadius: "20px",
                display: "inline-block",
                marginBottom: "14px"
              }}
            >
              YOOLOEI HOUSE PLATFORM
            </span>

            <h1
              style={{
                fontSize: "44px",
                fontWeight: "800",
                color: "#1e293b",
                lineHeight: "1.2",
                margin: "0 0 4px 0"
              }}
            >
              เกี่ยวกับ อยู่เลย เฮาส์
            </h1>
            <h1
              style={{
                fontSize: "44px",
                fontWeight: "800",
                color: "#5b8e66",
                lineHeight: "1.2",
                margin: "0 0 16px 0"
              }}
            >
              ศูนย์รวมหอพักอันดับ 1 ในเลย
            </h1>

            <p style={{ fontSize: "17px", color: "#475569", lineHeight: "1.6", margin: "0 0 28px 0" }}>
              แพลตฟอร์มค้นหา จอง และบริหารจัดการหอพักในจังหวัดเลย<br />
              เชื่อมโยงผู้เช่าและเจ้าของหอพัก ด้วยข้อมูลที่โปร่งใส สะดวก และน่าเชื่อถือที่สุด
            </p>

            <div style={{ display: "flex", gap: "14px", flexWrap: "wrap" }}>
              <Link to="/dorms" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "#688d67",
                    color: "#ffffff",
                    border: "none",
                    borderRadius: "8px",
                    padding: "12px 26px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px",
                    boxShadow: "0 4px 12px rgba(104, 141, 103, 0.3)"
                  }}
                >
                  <i className="fa-solid fa-magnifying-glass"></i>
                  ค้นหาหอพัก
                </button>
              </Link>
              <Link to="/contact" style={{ textDecoration: "none" }}>
                <button
                  style={{
                    backgroundColor: "#ffffff",
                    color: "#334155",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    padding: "12px 24px",
                    fontSize: "15px",
                    fontWeight: "600",
                    cursor: "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "8px"
                  }}
                >
                  <i className="fa-regular fa-envelope"></i>
                  ติดต่อเรา
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Floating Overlapping Stats Box (Same as HomePage floating box) */}
        <div
          style={{
            position: "absolute",
            bottom: "-48px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "calc(100% - 40px)",
            maxWidth: "1200px",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            padding: "20px 24px",
            boxShadow: "0 10px 30px rgba(0, 0, 0, 0.08)",
            border: "1px solid #f1f5f9",
            zIndex: 10
          }}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
              gap: "20px",
              textAlign: "center"
            }}
          >
            <div style={{ borderRight: "1px solid #f1f5f9", padding: "6px" }}>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#5b8e66" }}>100+</div>
              <div style={{ fontSize: "13.5px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                หอพักพาร์ทเนอร์ในเลย
              </div>
            </div>
            <div style={{ borderRight: "1px solid #f1f5f9", padding: "6px" }}>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#5b8e66" }}>500+</div>
              <div style={{ fontSize: "13.5px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                ห้องพักพร้อมให้บริการ
              </div>
            </div>
            <div style={{ borderRight: "1px solid #f1f5f9", padding: "6px" }}>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#5b8e66" }}>1,000+</div>
              <div style={{ fontSize: "13.5px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                ผู้ใช้งานที่ไว้วางใจ
              </div>
            </div>
            <div style={{ padding: "6px" }}>
              <div style={{ fontSize: "32px", fontWeight: "800", color: "#f59e0b" }}>4.8 ★</div>
              <div style={{ fontSize: "13.5px", color: "#64748b", fontWeight: "600", marginTop: "2px" }}>
                คะแนนรีวิวเฉลี่ย
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing for overlapping card */}
      <div style={{ height: "70px", backgroundColor: "#ffffff" }}></div>

      {/* =====================================================
              2. SECTION: พันธกิจ & วิสัยทัศน์ (Mission & Vision)
      ===================================================== */}
      <section style={{ padding: "30px 0 40px 0", backgroundColor: "#ffffff" }}>
        <div style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
              gap: "24px"
            }}
          >
            {/* พันธกิจ */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "32px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#c8dfc6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <i className="fa-solid fa-bullseye" style={{ fontSize: "22px", color: "#3d643b" }}></i>
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                  พันธกิจของเรา (Our Mission)
                </h3>
              </div>
              <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.7", margin: 0 }}>
                "อยู่เลย เฮาส์" ก่อตั้งขึ้นด้วยความตั้งใจที่จะพัฒนาระบบค้นหาและจองที่พักในจังหวัดเลยให้มีความสะดวก รวดเร็ว และเข้าถึงง่าย สำหรับนักศึกษา มรภ.เลย, คนทำงาน และบุคคลทั่วไป เพื่อลดขั้นตอนความยุ่งยากในการตระเวนหาหอพักในพื้นที่
              </p>
            </div>

            {/* วิสัยทัศน์ */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                padding: "32px",
                boxShadow: "0 4px 20px rgba(0,0,0,0.04)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "14px", marginBottom: "16px" }}>
                <div
                  style={{
                    width: "48px",
                    height: "48px",
                    borderRadius: "50%",
                    backgroundColor: "#c8dfc6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <i className="fa-solid fa-eye" style={{ fontSize: "22px", color: "#3d643b" }}></i>
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: "800", color: "#1e293b", margin: 0 }}>
                  วิสัยทัศน์ของเรา (Our Vision)
                </h3>
              </div>
              <p style={{ fontSize: "15px", color: "#475569", lineHeight: "1.7", margin: 0 }}>
                เรามุ่งมั่นที่จะเป็นศูนย์กลางข้อมูลและแพลตฟอร์มบริหารจัดการที่พักอาศัยอันดับหนึ่งในจังหวัดเลย ที่ช่วยขับเคลื่อนเศรษฐกิจท้องถิ่น และยกระดับคุณภาพชีวิตของผู้อยู่อาศัยและเจ้าของหอพักผ่านเทคโนโลยีที่ทันสมัย
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* =====================================================
              3. SECTION: ทำไมต้องเลือก อยู่เลยเฮาส์ (Same as HomePage)
      ===================================================== */}
      <section className="home-section why-choose-section" style={{ padding: "40px 0", backgroundColor: "#fafdfa" }}>
        <div className="section-container" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: "30px" }}>
            ทำไมต้องเลือก <span style={{ color: "#7da27c" }}>อยู่เลยเฮาส์</span>
          </h2>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px" }}>
            {[
              {
                icon: "fa-magnifying-glass",
                title: "ค้นหาได้ง่าย ตรงใจ",
                desc: "ค้นหาหอพักได้รวดเร็ว ครบทุกทำเลและโซนสำคัญในจังหวัดเลย"
              },
              {
                icon: "fa-images",
                title: "ภาพจริง ข้อมูลครบ",
                desc: "รูปภาพสถานที่จริง ค่าน้ำ ค่าไฟ และพิกัดแผนที่ชัดเจน"
              },
              {
                icon: "fa-star",
                title: "รีวิวจากผู้เช่าจริง",
                desc: "รีวิวและคะแนนดาวจากผู้เข้าพักจริง ช่วยเพิ่มความมั่นใจในการตัดสินใจ"
              },
              {
                icon: "fa-comments",
                title: "ติดต่อเจ้าของง่าย",
                desc: "ติดต่อเจ้าของหอพักและส่งคำขอจองห้องพักได้โดยตรงผ่านระบบแชท"
              }
            ].map((item, idx) => (
              <div
                key={idx}
                style={{
                  backgroundColor: "#edf4ec",
                  borderRadius: "14px",
                  padding: "20px 18px",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px",
                  border: "1px solid #dce8d6",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.03)"
                }}
              >
                <div
                  style={{
                    width: "50px",
                    height: "50px",
                    borderRadius: "50%",
                    backgroundColor: "#c8dfc6",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  <i className={`fa-solid ${item.icon}`} style={{ fontSize: "20px", color: "#3d643b" }}></i>
                </div>
                <div>
                  <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#2e4a2c", margin: "0 0 4px 0" }}>
                    {item.title}
                  </h4>
                  <p style={{ fontSize: "12px", color: "#526550", margin: 0, lineHeight: "1.4" }}>
                    {item.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* =====================================================
              4. SECTION: วิธีใช้งานเว็บไซต์ (Same as HomePage)
      ===================================================== */}
      <section className="home-section how-to-use-section" style={{ padding: "40px 0 60px 0", backgroundColor: "#ffffff" }}>
        <div className="section-container" style={{ maxWidth: "1120px", margin: "0 auto", padding: "0 30px" }}>
          <h2 style={{ fontSize: "26px", fontWeight: "800", color: "#1e293b", textAlign: "center", marginBottom: "30px" }}>
            วิธีใช้งานเว็บไซต์
          </h2>

          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 20px rgba(0,0,0,0.05)",
              padding: "36px 24px"
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-around",
                flexWrap: "wrap",
                gap: "24px"
              }}
            >
              {/* Step 1 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 220px", minWidth: "220px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#5b835a",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  1
                </div>
                <i className="fa-solid fa-magnifying-glass" style={{ fontSize: "32px", color: "#334155", flexShrink: 0 }}></i>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#5b835a", margin: "0 0 4px 0" }}>
                    ค้นหาหอพัก
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                    ค้นหาหอพักที่ต้องการ จากตัวกรองที่มีให้
                  </p>
                </div>
              </div>

              {/* Arrow 1 */}
              <div style={{ color: "#7da27c", fontSize: "24px", display: "flex", alignItems: "center" }} className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              {/* Step 2 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 220px", minWidth: "220px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#5b835a",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  2
                </div>
                <i className="fa-solid fa-scale-balanced" style={{ fontSize: "32px", color: "#334155", flexShrink: 0 }}></i>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#5b835a", margin: "0 0 4px 0" }}>
                    เปรียบเทียบ
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                    เปรียบเทียบราคา สิ่งอำนวยความสะดวก และรีวิว เพื่อประกอบการตัดสินใจ
                  </p>
                </div>
              </div>

              {/* Arrow 2 */}
              <div style={{ color: "#7da27c", fontSize: "24px", display: "flex", alignItems: "center" }} className="step-arrow">
                <i className="fa-solid fa-arrow-right"></i>
              </div>

              {/* Step 3 */}
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flex: "1 1 220px", minWidth: "220px" }}>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    backgroundColor: "#5b835a",
                    color: "#ffffff",
                    fontWeight: "800",
                    fontSize: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0
                  }}
                >
                  3
                </div>
                <i className="fa-solid fa-calendar-days" style={{ fontSize: "32px", color: "#334155", flexShrink: 0 }}></i>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#5b835a", margin: "0 0 4px 0" }}>
                    จองห้อง
                  </h4>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: 0, lineHeight: "1.4" }}>
                    ติดต่อเจ้าของหอพัก และจองห้องได้ง่าย
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
