"use client";

import { useHomePage } from "@/hooks/customer/useHomePage";
import RecommendedProducts from "@/components/customer/home/RecommendedProducts";
import HeroCarousel from "@/components/customer/home/HeroCarousel";
import FeaturedCollections from "@/components/customer/home/FeaturedCollections";
import GenderPromos from "@/components/customer/home/GenderPromos";
import Lookbook from "@/components/customer/home/Lookbook";
import Policies from "@/components/customer/home/Policies";

export default function HomeClient() {
  const { banners, currentUser } = useHomePage();

  return (
    <div className="w-full">
      <HeroCarousel banners={banners} />
      <RecommendedProducts userId={currentUser ? currentUser.id : null} />
      <FeaturedCollections />
      <GenderPromos />
      <Lookbook />
      <Policies />
    </div>
  );
}
