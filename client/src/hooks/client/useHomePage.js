import { useState, useEffect } from "react";
import API from "../../services/apiClient";
import AOS from "aos";
import "aos/dist/aos.css";

export function useHomePage() {
  const [banners, setBanners] = useState([]);
  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    // Fetch banner data from API
    API.get("/banners")
      .then((res) => {
        setBanners(res.data);
      })
      .catch((error) => {
        console.error("Failed to fetch banners:", error);
      });

    // Initialize Animation On Scroll library
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

    // Cleanup event listeners and timers
    return () => {
      clearTimeout(timer);
      window.removeEventListener("load", handleRefresh);
    };
  }, []);

  return { banners, currentUser };
}
