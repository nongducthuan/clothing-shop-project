import { getImageUrl } from "../../../utils/imageUtils";
import { useLanguage } from "../../../context/LanguageContext";

export default function ReturnEvidenceGallery({ images }: { images?: string[] }) {
  const { t } = useLanguage();
  if (!images?.length) return null;

  return (
    <div className="pt-3 border-t border-amber-200/60 dark:border-amber-900/40">
      <span className="block text-[10px] font-extrabold text-amber-900/70 dark:text-amber-200/70 uppercase mb-2.5 tracking-wider">
        {t("admin.evidence_attachments", "Ảnh minh chứng")} ({images.length})
      </span>
      <div className="flex flex-wrap gap-3">
        {images.map((img, idx) => {
          const fullImgUrl = getImageUrl(img);
          return (
            <div key={idx} className="relative group">
              <img
                src={fullImgUrl}
                alt={`${t("admin.evidence_attachments", "Ảnh minh chứng")} ${idx + 1}`}
                className="w-20 h-20 object-cover rounded-xl border-2 border-white dark:border-slate-600 shadow-md cursor-pointer hover:scale-105 transition-transform duration-300"
                onClick={() => window.open(fullImgUrl, "_blank")}
              />
              <div className="absolute inset-0 bg-black/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <i className="fa-solid fa-magnifying-glass-plus text-white text-xs"></i>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
