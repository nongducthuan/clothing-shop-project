import React from "react";
import { useHomePage } from "../../hooks/client/useHomePage";
import RecommendedProducts from "../../components/client/home/RecommendedProducts";
import HeroCarousel from "../../components/client/home/HeroCarousel";
import FeaturedCollections from "../../components/client/home/FeaturedCollections";
import GenderPromos from "../../components/client/home/GenderPromos";
import Lookbook from "../../components/client/home/Lookbook";
import Policies from "../../components/client/home/Policies";
import Footer from "../../components/client/layout/Footer";

export default function Home() {
  const { banners, currentUser } = useHomePage();

  return (
    <div className="w-full">
      {/* 🖼 Carousel Banner */}
      <HeroCarousel banners={banners} />

      {/* 🔮 Recommended Products Section */}
      <RecommendedProducts userId={currentUser ? currentUser.id : null} />

      {/* 🌟 Featured Collections Section */}
      <FeaturedCollections />

      {/* 👫 Men/Women Promo Banners */}
      <GenderPromos />

      {/* 👕 Lookbook Section */}
      <Lookbook />

      {/* 🎁 Offers Policy Section */}
      <Policies />

      {/* ⚙️ Footer */}
      <Footer />
    </div>
  );
}
