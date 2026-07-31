import React from "react";
import { useHomePage } from "../../hooks/customer/useHomePage";
import RecommendedProducts from "../../components/customer/home/RecommendedProducts";
import HeroCarousel from "../../components/customer/home/HeroCarousel";
import FeaturedCollections from "../../components/customer/home/FeaturedCollections";
import GenderPromos from "../../components/customer/home/GenderPromos";
import Lookbook from "../../components/customer/home/Lookbook";
import Policies from "../../components/customer/home/Policies";

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

    </div>
  );
}
