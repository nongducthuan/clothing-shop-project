import React from "react";
import SectionHeader from "./SectionHeader";
import { LOOKBOOK_IMAGES } from "./homeData";

export default function Lookbook() {
  return (
    <section className="my-12" data-aos="fade-up">
      <div className="max-w-[1280px] mx-auto px-4 text-center">
        <SectionHeader title="Outfit Inspiration Lookbook" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 justify-items-center">
          {LOOKBOOK_IMAGES.map((img, idx) => (
            <div key={idx} className="w-full md:w-[380px] aspect-w-4 aspect-h-6 rounded-3xl overflow-hidden shadow-lg">
              <img src={img} className="w-full h-full object-cover" alt={`Look ${idx + 1}`} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
