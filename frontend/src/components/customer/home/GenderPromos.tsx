import React from "react";
import { useNavigate } from "react-router-dom";
import { GENDER_PROMOS } from "./homeData";
import { useLanguage } from "../../../context/LanguageContext";

export default function GenderPromos() {
  const navigate = useNavigate();
  const { t, getLocalizedText } = useLanguage();

  return (
    <section className="my-12" data-aos="fade-up">
      <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {GENDER_PROMOS.map((promo, idx) => {
          const title = getLocalizedText(promo, "title");
          const desc = getLocalizedText(promo, "desc");
          return (
            <div
              key={idx}
              className="relative rounded-3xl overflow-hidden shadow-lg group cursor-pointer"
              onClick={() => navigate("/search")}
            >
              <img
                src={promo.img}
                alt={title}
                className="w-full transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/30 group-hover:bg-black/50 text-white p-4 transition-colors duration-300">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">{title}</h2>
                <p className="text-sm md:text-base mb-5">{desc}</p>
                <span className="px-6 py-2.5 bg-white text-slate-900 rounded-full text-sm font-semibold opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-300">
                  {t("home.shop_now", "Shop Now →")}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

