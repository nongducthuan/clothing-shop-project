import React from "react";

export default function CategoryList({
  categories,
  filterGender,
  setFilterGender,
  handleEdit,
  handleDelete,
  backendUrl,
}) {
  // Gender tabs configuration
  const genderTabs = [
    { key: "male", label: "Male" },
    { key: "female", label: "Female" },
    { key: "unisex", label: "Unisex" },
  ];

  // Helper to display gender label with soft pill styling
  const renderGenderBadge = (g) => {
    const styles = {
      male: "bg-blue-50 text-blue-600",
      female: "bg-pink-50 text-pink-600",
      unisex: "bg-purple-50 text-purple-600"
    };
    const labels = { male: "Male", female: "Female", unisex: "Unisex" };

    return (
      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${styles[g] || "bg-gray-100 text-gray-600"}`}>
        {labels[g]}
      </span>
    );
  };

  // Filter categories based on selected tab
  const filteredCategories = categories.filter(
    (cat) => cat.gender === filterGender
  );

  return (
    <div className="flex flex-col h-full">

      {/* Premium Pill Segmented Control */}
      <div className="flex justify-center md:justify-start mb-6">
        <div className="inline-flex p-1.5 bg-gray-200/60 rounded-full shadow-inner">
          {genderTabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setFilterGender(t.key)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ease-out ${
                filterGender === t.key
                  ? "bg-white text-violet-600 shadow-sm scale-100"
                  : "text-gray-500 hover:text-gray-800 bg-transparent hover:bg-gray-200/50 scale-95"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Borderless Table Card */}
      <div className="bg-white shadow-sm border border-gray-100 rounded-[2rem] overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                <th className="p-4 pl-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-24">Image</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Category Name</th>
                <th className="p-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-32">Gender</th>
                <th className="p-4 pr-6 text-xs font-bold text-gray-400 uppercase tracking-wider w-32 text-right">Actions</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-50">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-gray-50/50 transition-colors duration-200 group">
                  <td className="p-4 pl-6">
                    {(() => {
                      const imageSrc = cat.image_url || cat.preview_image;
                      return imageSrc ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-gray-100 shadow-sm border border-gray-100">
                          <img
                            src={
                              imageSrc.startsWith("http")
                                ? imageSrc
                                : `${backendUrl}${imageSrc}`
                            }
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={cat.name}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 border border-dashed border-gray-200 flex items-center justify-center">
                          <i className="fa-solid fa-image text-gray-300"></i>
                        </div>
                      );
                    })()}
                  </td>

                  <td className="p-4 font-bold text-gray-800">
                    {cat.name}
                  </td>

                  <td className="p-4">
                    {renderGenderBadge(cat.gender)}
                  </td>

                  <td className="p-4 pr-6">
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="w-10 h-10 flex items-center justify-center bg-blue-50 text-blue-600 rounded-full hover:bg-blue-500 hover:text-white transition-all duration-300 shadow-sm"
                        title="Edit"
                      >
                        <i className="fa-solid fa-pen text-sm"></i>
                      </button>

                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 text-red-600 rounded-full hover:bg-red-500 hover:text-white transition-all duration-300 shadow-sm"
                        title="Delete"
                      >
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-12 text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="fa-solid fa-folder-open text-gray-300 text-2xl"></i>
                    </div>
                    <p className="text-gray-500 font-medium">No categories found in this section.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
