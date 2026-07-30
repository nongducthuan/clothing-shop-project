import React from "react";
import { IMAGE_URL } from "./homeData";

const BannerOverlay = ({ title, subtitle }) => (
  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent flex flex-col items-center justify-center text-center text-white px-4 py-8 md:p-12">
    {title && (
      <h1 className="font-extrabold text-3xl sm:text-4xl md:text-5xl drop-shadow-lg mb-3 tracking-tight max-w-4xl">
        {title}
      </h1>
    )}
    {subtitle && (
      <p className="text-base sm:text-lg md:text-xl text-slate-200 drop-shadow-md max-w-2xl font-medium">
        {subtitle}
      </p>
    )}
  </div>
);

export default function HeroCarousel({ banners = [] }) {
  return (
    <div id="heroCarousel" className="carousel slide mb-8" data-bs-ride="carousel">
      <div className="carousel-inner">
        {banners.length > 0 ? (
          banners.map((banner, idx) => (
            <div
              key={banner.id}
              className={`carousel-item ${idx === 0 ? "active" : ""} 
              h-[40vh]           
              sm:h-[55vh]       
              md:h-[70vh]        
              lg:h-[85vh]        
              relative w-full overflow-hidden`}
            >
              <img
                src={`${IMAGE_URL}${banner.image_url}`}
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
          <div className="carousel-item active h-[45vh] sm:h-[60vh] md:h-[75vh] relative">
            <img
              src={`${IMAGE_URL}/public/images/placeholder-banner.png`}
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
