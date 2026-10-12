import { useState, useEffect } from "react";
import API from "../../services/apiClient";
import AOS from "aos";
import "aos/dist/aos.css";

export function useHomePage() {
  const [banners, setBanners] = useState([]);
  const currentUser = (() => {
    try {
      const storedUser = localStorage.getItem("user");
      return storedUser ? JSON.parse(storedUser) : null;
    } catch {
      try { localStorage.removeItem("user"); } catch { /* Storage may be unavailable. */ }
      return null;
    }
  })();

  useEffect(() => {
    API.get("/banners")
      .then((res) => {
        setBanners(res.data);
      })
      .catch((error) => {
        console.error("Failed to fetch banners:", error);
      });

    const timer = setTimeout(() => {
      AOS.init({
        duration: 800,
        offset: 100,
        once: true,
        easing: "ease-out-cubic",
      });
    }, 500);

    // Refresh AOS on window load to ensure correct positioning
    const handleRefresh = () => AOS.refresh();
    window.addEventListener("load", handleRefresh);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", handleRefresh);
    };
  }, []);

  return { banners, currentUser };
}
