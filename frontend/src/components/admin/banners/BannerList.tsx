import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";

export default function BannerList({
  banners,
  handleEdit,
  handleDelete,
}) {
  return (
    <div className="h-full">
      {banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-center p-12 bg-white rounded-[2rem] border border-gray-100 shadow-sm">
          <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-4">
            <i className="fa-solid fa-panorama text-gray-300 text-3xl"></i>
          </div>
          <h4 className="text-gray-800 font-bold text-lg mb-1">No Banners Yet</h4>
          <p className="text-gray-500 text-sm max-w-sm">
            Add a new banner using the form to display promotional content to your users.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {banners.map((b) => {
            const imageSrc = getImageUrl(b.image_url);

            return (
              <div
                key={b.id}
                className="bg-white rounded-[1.5rem] border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-all duration-300 flex flex-col"
              >
                {/* Image Area */}
                <div className="relative w-full pb-[42.85%] bg-gray-100 overflow-hidden">
                  <img
                    src={imageSrc}
                    alt={b.title}
                    className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    onError={(e) =>
                      ((e.target as HTMLImageElement).src = "https://via.placeholder.com/600x250?text=No+Image+Available")
                    }
                  />
                </div>

                {/* Content Area */}
                <div className="p-5 flex-1 flex flex-col justify-between">
                  <div>
                    <h5 className="font-extrabold text-gray-800 text-lg truncate mb-1">
                      {b.title}
                    </h5>
                    <p className="text-gray-500 text-sm truncate">
                      {b.subtitle || "No subtitle provided"}
                    </p>
                  </div>

                  {/* Actions (Luôn hiển thị rõ ràng) */}
                  <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-gray-50">
                    <button
                      onClick={() => handleEdit(b)}
                      className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-600 hover:text-white transition-all duration-300 shadow-sm"
                      title="Edit"
                    >
                      <i className="fa-solid fa-pen text-sm"></i>
                    </button>
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-600 hover:text-white transition-all duration-300 shadow-sm"
                      title="Delete"
                    >
                      <i className="fa-solid fa-trash text-sm"></i>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

