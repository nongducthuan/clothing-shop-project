import { useHomePage } from "../../hooks/customer/useHomePage";
import SEO from "../../components/common/SEO";
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
      <SEO
        title="Trang chủ"
        description="Khám phá các bộ sưu tập thời trang nam nữ mới nhất, ưu đãi giảm giá và chính sách bán hàng tại Clothing Shop."
      />

      {/* Carousel Banner */}
      <HeroCarousel banners={banners} />

      {/* Recommended Products Section */}
      <RecommendedProducts userId={currentUser ? currentUser.id : null} />

      {/* Featured Collections Section */}
      <FeaturedCollections />

      {/* Men/Women Promo Banners */}
      <GenderPromos />

      {/* Lookbook Section */}
      <Lookbook />

      {/* Offers Policy Section */}
      <Policies />

    </div>
  );
}
