import React from "react";
import { getImageUrl } from "../../../utils/imageUtils";
import EmptyState from "../../common/EmptyState";
import { useLanguage } from "../../../context/LanguageContext";

export default function CategoryList({
  categories,
  filterGender,
  setFilterGender,
  handleEdit,
  handleDelete,
}) {
  const { t, getLocalizedText } = useLanguage();

  const genderTabs = [
    { key: "male", label: t("gender.male") },
    { key: "female", label: t("gender.female") },
    { key: "unisex", label: t("gender.unisex") },
  ];

  const renderGenderBadge = (g) => {
    const styles = {
      male: "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400",
      female: "bg-pink-50 dark:bg-pink-950/50 text-pink-600 dark:text-pink-400",
      unisex: "bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400"
    };

    return (
      <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${styles[g] || "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}>
        {t(`gender.${g}`) || g}
      </span>
    );
  };

  const filteredCategories = categories.filter(
    (cat) => cat.gender === filterGender
  );

  return (
    <div className="flex flex-col h-full">

      {/* Premium Pill Segmented Control */}
      <div className="flex justify-center md:justify-start mb-6">
        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full shadow-inner">
          {genderTabs.map((tItem) => (
            <button
              key={tItem.key}
              onClick={() => setFilterGender(tItem.key)}
              className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all duration-300 ease-out ${
                filterGender === tItem.key
                  ? "bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm scale-100"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50 scale-95"
              }`}
            >
              {tItem.label}
            </button>
          ))}
        </div>
      </div>

      {/* Modern Borderless Table Card */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700 rounded-[2rem] overflow-hidden flex-1">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="p-4 pl-6 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-24">{t("admin.cover_image")}</th>
                <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider">{t("admin.category")}</th>
                <th className="p-4 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-32">{t("admin.gender")}</th>
                <th className="p-4 pr-6 text-xs font-bold text-slate-400 dark:text-slate-400 uppercase tracking-wider w-32 text-right">{t("admin.actions")}</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {filteredCategories.map((cat) => (
                <tr key={cat.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors duration-200 group">
                  <td className="p-4 pl-6">
                    {(() => {
                      const rawImage = cat.image_url || cat.preview_image;
                      const imageSrc = rawImage && rawImage !== "null" && rawImage !== "undefined" ? rawImage : null;
                      return imageSrc ? (
                        <div className="w-14 h-14 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-700 shadow-sm border border-slate-200/80 dark:border-slate-600">
                          <img
                            src={getImageUrl(imageSrc)}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            alt={cat.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).onerror = null;
                              (e.target as HTMLImageElement).src = getImageUrl(null);
                            }}
                          />
                        </div>
                      ) : (
                        <div className="w-14 h-14 rounded-2xl bg-slate-50 dark:bg-slate-700/40 border border-dashed border-slate-200 dark:border-slate-600 flex items-center justify-center">
                          <i className="fa-solid fa-image text-slate-300 dark:text-slate-500"></i>
                        </div>
                      );
                    })()}
                  </td>

                  <td className="p-4 font-bold text-slate-800 dark:text-slate-100">
                    {getLocalizedText(cat, "name")}
                  </td>

                  <td className="p-4">
                    {renderGenderBadge(cat.gender)}
                  </td>

                  <td className="p-4 pr-6">
                    <div className="flex justify-end gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleEdit(cat)}
                        className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 dark:hover:text-white transition-all duration-300 shadow-sm"
                        title={t("common.edit")}
                      >
                        <i className="fa-solid fa-pen text-sm"></i>
                      </button>

                      <button
                        onClick={() => handleDelete(cat.id)}
                        className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-600 dark:hover:text-white transition-all duration-300 shadow-sm"
                        title={t("common.delete")}
                      >
                        <i className="fa-solid fa-trash text-sm"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}

              {filteredCategories.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-12 text-center">
                    <EmptyState 
                      title={t("admin.no_products_found")}
                      subtitle={t("search.no_items_desc")}
                      icon="fa-folder-open"
                    />
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

