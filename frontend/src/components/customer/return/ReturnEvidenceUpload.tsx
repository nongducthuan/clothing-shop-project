import { useLanguage } from "../../../context/LanguageContext";

interface Props {
  files?: File[] | FileList | null;
  onChange: (files: File[]) => void;
  variant?: "compact" | "card";
}

export default function ReturnEvidenceUpload({ files, onChange, variant = "compact" }: Props) {
  const { t } = useLanguage();
  const count = files ? Array.from(files).length : 0;
  const inputClass = variant === "card"
    ? "w-full text-sm text-slate-500 dark:text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-medium file:bg-slate-100 dark:file:bg-slate-700 file:text-slate-700 dark:file:text-slate-200 hover:file:bg-slate-200 dark:hover:file:bg-slate-600"
    : "w-full text-xs sm:text-sm text-gray-500 dark:text-slate-400 file:mr-3 file:py-2 file:px-3 sm:file:px-4 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-violet-50 dark:file:bg-violet-900/40 file:text-violet-700 dark:file:text-violet-300 hover:file:bg-violet-100 dark:hover:file:bg-violet-900/60";

  return (
    <div>
      <label className={`block text-xs font-bold ${variant === "card" ? "text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 ml-1" : "text-gray-500 dark:text-slate-400 uppercase mb-1"}`}>
        {t("lookup.images_label", "Ảnh minh chứng")}
      </label>
      <input type="file" multiple accept="image/*" className={inputClass} onChange={(e) => onChange(Array.from(e.target.files || []))} />
      {count > 0 && variant === "compact" && (
        <p className="text-xs text-violet-600 dark:text-violet-400 font-medium mt-1">
          <i className="fa-solid fa-paperclip mr-1"></i> {t("lookup.files_selected").replace("{count}", String(count))}
        </p>
      )}
      {variant === "compact" && <p className="text-[10px] text-gray-400 dark:text-slate-500 mt-1">{t("lookup.images_hint")}</p>}
    </div>
  );
}
