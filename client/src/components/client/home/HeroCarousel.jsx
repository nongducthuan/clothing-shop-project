import React from "react";
import { BACKEND_URL } from "./homeData";

const BannerOverlay = ({ title, subtitle }) => (
  <div className="absolute inset-0 bg-black/30 flex flex-col items-center justify-end md:justify-center text-center text-white p-4">
    {title && (
      <h1 className="fw-bold text-xl sm:text-2xl md:text-3xl drop-shadow-lg mb-2">
        {title}
      </h1>
    )}
    {subtitle && (
      <p className="text-base sm:text-lg md:text-xl drop-shadow-md max-w-2xl">
        {subtitle}
      </p>
    )}
  </div>
);

export default function HeroCarousel({ banners }) {
  return (
    <div id="heroCarousel" className="carousel slide mb-8" data-bs-ride="carousel">
      <div className="carousel-inner">
        {banners.length > 0 ? (
          banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`carousel-item ${idx === 0 ? "active" : ""} h-[50vh] md:h-[100vh] relative`}
            >
              <img
                src={`${BACKEND_URL}${banner.image_url}`}
                className="d-block w-full h-full object-cover object-top md:object-center"
                alt={banner.title || `Banner ${idx + 1}`}
              />
              {(banner.title || banner.subtitle) && (
                <BannerOverlay title={banner.title} subtitle={banner.subtitle} />
              )}
            </div>
          ))
        ) : (
          /* Fallback static banner if no banners are returned from API */
          <div className="carousel-item active h-[50vh] md:h-[100vh] relative">
            <img
              src={`${BACKEND_URL}/public/images/placeholder-banner.png`}
              className="d-block w-full h-full object-cover object-top md:object-center"
              alt="Default Banner"
            />
            <BannerOverlay
              title="Welcome to Clothing Shop"
              subtitle="The latest collection is here – Up to 50% off today!"
            />
          </div>
        )}
      </div>

      {/* Carousel Navigation Buttons */}
      {banners.length > 1 && (
        <>
          <button className="carousel-control-prev" type="button" data-bs-target="#heroCarousel" data-bs-slide="prev">
            <span className="carousel-control-prev-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Previous</span>
          </button>
          <button className="carousel-control-next" type="button" data-bs-target="#heroCarousel" data-bs-slide="next">
            <span className="carousel-control-next-icon" aria-hidden="true"></span>
            <span className="visually-hidden">Next</span>
          </button>
        </>
      )}
    </div>
  );
}
