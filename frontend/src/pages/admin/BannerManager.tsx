import { useBannerManager } from "../../hooks/admin/useBannerManager";
import BannerForm from "../../components/admin/banners/BannerForm";
import BannerList from "../../components/admin/banners/BannerList";
import { useLanguage } from "../../context/LanguageContext";

const PageHeader = () => {
  const { t } = useLanguage();
  return (
    <div className="flex justify-center md:justify-start mb-8">
      <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
        <h2 className="font-bold uppercase text-slate-700 dark:text-slate-200 tracking-wider text-sm m-0 leading-none">
          {t("admin.banner_management")}
        </h2>
      </div>
    </div>
  );
};

export default function BannerManager() {
  const {
    banners, isUploading, editingId, form, setForm,
    uploadImage, saveBanner, deleteBanner, selectForEdit, resetForm
  } = useBannerManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        <div className="lg:col-span-4 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md lg:sticky lg:top-24 relative z-10">
          <BannerForm
            form={form}
            setForm={setForm}
            handleSubmit={saveBanner}
            handleFileUpload={(e) => uploadImage(e.target.files[0])}
            uploading={isUploading}
            editingId={editingId}
            onCancel={resetForm}
          />
        </div>

        {/* ======================== LIST SECTION ======================== */}
        {/* Placed inside a clean card container */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm min-h-[500px]">
          <BannerList
            banners={banners}
            handleEdit={selectForEdit}
            handleDelete={deleteBanner}
          />
        </div>

      </div>
    </div>
  );
}
