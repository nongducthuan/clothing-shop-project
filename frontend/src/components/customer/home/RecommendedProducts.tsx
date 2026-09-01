import { useEffect, useState } from "react";
import API from "../../../services/apiClient";
import ProductCard from "../product/ProductCard";
import AOS from "aos";

/**
 * Sub-component: Skeleton Loader
 * Purpose: Preserves layout space while waiting for Python calculation (approx. 2s).
 * This prevents "Layout Shift" and improves UX.
 */
const SkeletonCard = () => (
  <div className="bg-white rounded-2xl shadow-sm overflow-hidden p-3 animate-pulse border border-gray-100">
    {/* Image Placeholder */}
    <div className="bg-gray-200 h-48 w-full rounded-xl mb-3"></div>
    {/* Title Placeholder */}
    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
    {/* Price Placeholder */}
    <div className="h-4 bg-gray-200 rounded w-1/2"></div>
  </div>
);

const RecommendedProducts = ({ userId }) => {
  const [products, setProducts] = useState([]);
  const [activePromotions, setActivePromotions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const targetUserId = userId || 'guest';
    setLoading(true);

    Promise.allSettled([
      API.get(`/products/recommendations/${targetUserId}`),
      API.get("/promotions")
    ])
      .then(([recRes, promoRes]) => {
        if (recRes.status === "fulfilled") {
          const data = recRes.value.data;
          const list = Array.isArray(data) ? data : (data.products || []);
          setProducts(list);
        } else {
          setProducts([]);
        }

        if (promoRes.status === "fulfilled") {
          const promoData = promoRes.value.data?.data || promoRes.value.data || [];
          setActivePromotions(Array.isArray(promoData) ? promoData : []);
        }
      })
      .finally(() => {
        setLoading(false);
        setTimeout(() => AOS.refresh(), 100);
      });
  }, [userId]);

  const getPromotionForProduct = (productId) => {
    return activePromotions.find((promo) => String(promo.buy_product_id) === String(productId));
  };

  // Show section unconditionally (fallback products will be fetched if guest/new user)
  return (
    <section className="container mx-auto px-4 my-12" data-aos="fade-up">
      {/* Section Title */}
      <div className="text-center mb-8">
         <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-400 to-sky-400 bg-clip-text text-transparent inline-block uppercase">
            Recommend For You
          </h2>
          <div className="h-1 w-24 mx-auto mt-2 bg-gradient-to-r from-blue-400 to-sky-400 rounded"></div>
      </div>

      {/* Product Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />) // Show 4 skeleton placeholders
          : products.map((p) => (
              <ProductCard
                key={p.id}
                product={p}
                promotion={getPromotionForProduct(p.id)}
              />
            ))       // Show actual products with promotion badge if any
        }
      </div>
    </section>
  );
};

export default RecommendedProducts;

