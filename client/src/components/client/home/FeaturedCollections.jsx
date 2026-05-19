import React from "react";
import SectionHeader from "./SectionHeader";
import { COLLECTIONS } from "./homeData";

export default function FeaturedCollections() {
  return (
    <section className="my-12" data-aos="fade-up">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <SectionHeader title="Featured Collections" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {COLLECTIONS.map((item, idx) => (
            <div key={idx} className="relative rounded-3xl overflow-hidden shadow-lg">
              <img src={item.img} alt={item.title} className="w-full" />
              <div className="absolute inset-0 bg-black/30 flex flex-col justify-end md:justify-center items-center text-white p-4">
                <h3 className="text-xl md:text-2xl font-bold mb-2 uppercase">{item.title}</h3>
                <p className="text-sm md:text-base text-center">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
