import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

const BannerOverlay = ({ title, subtitle }) => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-center text-center text-white px-4 py-4 sm:px-6 sm:py-8 md:p-12 overflow-hidden">
    {title && (
      <h1 className="font-extrabold text-xl sm:text-3xl md:text-5xl drop-shadow-lg mb-1.5 sm:mb-3 tracking-tight max-w-4xl w-full line-clamp-2">
        {title}
      </h1>
    )}
    {subtitle && (
      <p className="text-xs sm:text-base md:text-xl text-slate-200 drop-shadow-md max-w-2xl w-full font-medium line-clamp-2">
        {subtitle}
      </p>
    )}
  </div>
);

export default function HeroCarousel({ banners = [] }) {
  const { getLocalizedText, t } = useLanguage();
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const slides = banners.length > 0 ? banners : [null]; // null = fallback slide

  const goTo = useCallback(
    (index: number) => {
      if (isTransitioning || index === current) return;
      setIsTransitioning(true);
      setCurrent((index + slides.length) % slides.length);
      setTimeout(() => setIsTransitioning(false), 500);
    },
    [current, isTransitioning, slides.length]
  );

  const prev = () => goTo(current - 1);
  const next = useCallback(() => goTo(current + 1), [current, goTo]);

  // Auto-advance every 5s
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, slides.length]);

  return (
    <div className="relative w-full overflow-hidden mb-8 group">
      {/* Slides */}
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(current * 100) / slides.length}%)`,
        }}
      >
        {slides.map((banner, idx) => {
          const title = banner ? getLocalizedText(banner, "title") : t("home.hero_fallback_title", "Welcome to LOOM");
          const subtitle = banner
            ? getLocalizedText(banner, "subtitle")
            : t("home.hero_fallback_subtitle", "The latest collection is here – Up to 50% off today!");
          const imgSrc = banner
            ? getImageUrl(banner.image_url)
            : getImageUrl("/public/images/placeholder-banner.png");

          return (
            <div
              key={banner?.id ?? "fallback"}
              style={{ width: `${100 / slides.length}%` }}
              className="relative h-[40vh] sm:h-[55vh] md:h-[70vh] lg:h-[85vh] shrink-0"
            >
              <img
                src={imgSrc}
                className="block w-full h-full object-cover object-top md:object-center"
                alt={title || `Banner ${idx + 1}`}
              />
              {(title || subtitle) && <BannerOverlay title={title} subtitle={subtitle} />}
            </div>
          );
        })}
      </div>

      {/* Prev / Next buttons — only shown when >1 slide */}
      {slides.length > 1 && (
        <>
          <button
            onClick={prev}
            aria-label={t("home.prev_slide", "Previous slide")}
            className="absolute left-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={next}
            aria-label={t("home.next_slide", "Next slide")}
            className="absolute right-3 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/40 hover:bg-black/65 text-white flex items-center justify-center transition-all opacity-0 group-hover:opacity-100 focus:opacity-100"
          >
            <ChevronRight size={22} />
          </button>

          {/* Dot indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {slides.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`rounded-full transition-all duration-300 ${
                  idx === current
                    ? "w-6 h-2 bg-white"
                    : "w-2 h-2 bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
