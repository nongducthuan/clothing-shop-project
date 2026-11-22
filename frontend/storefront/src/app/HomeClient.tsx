"use client";

import { useHomePage } from "@/hooks/useHomePage";
import RecommendedProducts from "@/components/home/RecommendedProducts";
import HeroCarousel from "@/components/home/HeroCarousel";
import FeaturedCollections from "@/components/home/FeaturedCollections";
import GenderPromos from "@/components/home/GenderPromos";
import Lookbook from "@/components/home/Lookbook";
import Policies from "@/components/home/Policies";

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
