import React from "react";
import SectionHeader from "./SectionHeader";
import { POLICIES } from "./homeData";

export default function Policies() {
  return (
    <section className="my-12 text-center" data-aos="fade-up">
      <SectionHeader title="Preferential Policy" />
      <div className="max-w-[1280px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6">
        {POLICIES.map((policy, idx) => (
          <div key={idx} className="bg-white rounded-3xl shadow-lg p-6">
            <h5 className="text-xl font-bold mb-2">{policy.icon} {policy.title}</h5>
            <p>{policy.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
