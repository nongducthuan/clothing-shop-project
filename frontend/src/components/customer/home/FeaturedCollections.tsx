import React from "react";
import { useNavigate } from "react-router-dom";
import SectionHeader from "./SectionHeader";
import { COLLECTIONS } from "./homeData";
import { useLanguage } from "../../../context/LanguageContext";

export default function FeaturedCollections() {
  const navigate = useNavigate();
  const { t, getLocalizedText } = useLanguage();

  return (
    <section className="my-12" data-aos="fade-up">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <SectionHeader title={t("home.featured", "Featured Collections")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLLECTIONS.map((item, idx) => {
            const title = getLocalizedText(item, "title");
            const desc = getLocalizedText(item, "desc");
            return (
              <div
                key={idx}
                className="relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
                onClick={() => navigate("/search")}
              >
                <img
                  src={item.img}
                  alt={title}
                  className="w-full transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/50 flex flex-col justify-end md:justify-center items-center text-white p-4 transition-colors duration-300">
                  <h3 className="text-xl md:text-2xl font-bold mb-2 uppercase">{title}</h3>
                  <p className="text-sm md:text-base text-center mb-4">{desc}</p>
                  <span className="px-5 py-2 border border-white rounded-full text-sm font-medium opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                    {t("home.shop_collection", "Shop Collection →")}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

