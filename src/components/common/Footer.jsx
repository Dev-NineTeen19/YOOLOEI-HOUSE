import { Link } from "react-router-dom";
import { useSiteSettings } from "../../context/SiteSettingsContext";

export default function Footer() {
  const { settings } = useSiteSettings();

  const scrollToTop = (e) => {
    e.preventDefault();
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  return (
    <footer className="footer">
      <div className="footer-container">
        {/* Logo & Description */}
        <div className="footer-column">
          <img
            src={settings.siteLogo || "/images/logo.png"}
            className="footer-logo"
            alt="Logo"
            onError={(e) => { e.target.src = "/images/logo.png"; }}
          />
          <p>
            เว็บไซต์ค้นหาหอพักในจังหวัดเลย<br />
            ครบทุกข้อมูล ค้นหาง่าย<br />
            เลือกหอพักที่ใช่สำหรับคุณ
          </p>
          <div className="social">
            <a href="#facebook" aria-label="Facebook"><i className="fab fa-facebook-f"></i></a>
            <a href="#line" aria-label="Line"><i className="fab fa-line"></i></a>
            <a href="#instagram" aria-label="Instagram"><i className="fab fa-instagram"></i></a>
            <a href={`mailto:${settings.adminEmail || 'yooloeihouse@gmail.com'}`} aria-label="Email"><i className="fas fa-envelope"></i></a>
          </div>
        </div>

        {/* Menu */}
        <div className="footer-column">
          <h3>เมนู</h3>
          <Link to="/">หน้าแรก</Link>
          <Link to="/dorms">ค้นหาหอพัก</Link>
          <Link to="/dorms?sort=latest">หอพักล่าสุด</Link>
          <Link to="/about">เกี่ยวกับเรา</Link>
          <Link to="/register">สมัครสมาชิก</Link>
        </div>

        {/* Information */}
        <div className="footer-column">
          <h3>ข้อมูล</h3>
          <Link to="/about">เกี่ยวกับเรา</Link>
          <a href="#privacy">นโยบายความเป็นส่วนตัว</a>
          <a href="#terms">เงื่อนไขการใช้งาน</a>
          <a href="#faq">คำถามที่พบบ่อย</a>
        </div>

        {/* Contact */}
        <div className="footer-column">
          <h3>ติดต่อ</h3>
          <p>{settings.contactPhone || "042-123-456"}</p>
          <p>{settings.adminEmail || "yooloeihouse@gmail.com"}</p>
          <p>234 ม.11 ต.เมือง อ.เมือง</p>
          <p>จ.เลย 42000</p>
        </div>

        {/* Map */}
        <div className="footer-column">
          <h3>แผนที่</h3>
          <img src="/images/map.jpg" className="map" alt="Map" onError={(e) => { e.target.style.display = "none"; }} />
        </div>
      </div>

      {/* Copyright */}
      <div className="copyright">
        © 2026 {settings.siteName || "อยู่เลยเฮาส์"} - {settings.siteNameEn || "Yooloei House"}. All Rights Reserved.
      </div>

      {/* Back To Top */}
      <a href="#top" className="back-top" onClick={scrollToTop} aria-label="เลื่อนขึ้นด้านบน">
        <i className="fa-solid fa-chevron-up"></i>
      </a>
    </footer>
  );
}
