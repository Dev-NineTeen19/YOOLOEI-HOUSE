import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    // เลื่อนขึ้นไปด้านบนสุดของหน้าต่างเสมอเมื่อเปลี่ยนเส้นทางหรือ Query Params
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: "instant"
    });
  }, [pathname, search]);

  return null;
}
