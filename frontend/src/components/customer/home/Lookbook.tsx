import React from "react";
import SectionHeader from "./SectionHeader";
import { LOOKBOOK_IMAGES } from "./homeData";
import { useLanguage } from "../../../context/LanguageContext";

export default function Lookbook() {
  const { t } = useLanguage();

  return (
    <section className="my-12" data-aos="fade-up">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <SectionHeader title={t("home.lookbook_title", "Outfit Inspiration Lookbook")} />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          {LOOKBOOK_IMAGES.map((img, idx) => (
            <div
              key={idx}
              className="w-full md:w-[380px] aspect-w-4 aspect-h-6 rounded-3xl overflow-hidden shadow-lg relative group cursor-pointer"
            >
              <img
                src={img}
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                alt={`Look ${idx + 1}`}
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex flex-col items-center justify-center transition-all duration-300">
                <span className="text-white font-semibold text-lg opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                  {t("home.look", "Look")} #{idx + 1}
                </span>
                <span className="mt-2 px-5 py-2 border border-white rounded-full text-sm text-white font-medium opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300 delay-75">
                  {t("home.view_style", "View Style")}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

