import React from "react";
import { GENDER_PROMOS } from "./homeData";

export default function GenderPromos() {
  return (
    <section className="my-12" data-aos="fade-up">
      <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-2 gap-6">
        {GENDER_PROMOS.map((promo, idx) => (
          <div key={idx} className="relative rounded-3xl overflow-hidden shadow-lg">
            <img src={promo.img} alt={promo.title} className="w-full" />
            <div className="absolute inset-0 flex flex-col justify-center items-center bg-black/30 text-white p-4">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">{promo.title}</h2>
              <p className="text-sm md:text-base">{promo.desc}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
