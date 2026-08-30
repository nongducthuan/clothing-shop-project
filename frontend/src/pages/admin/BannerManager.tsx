import { useBannerManager } from "../../hooks/admin/useBannerManager";
import BannerForm from "../../components/admin/banners/BannerForm";
import BannerList from "../../components/admin/banners/BannerList";

// --- SUB-COMPONENTS ---

/**
 * PageHeader Component
 * Displays a minimal, pill-shaped title badge for consistency across the admin panel.
 */
const PageHeader = () => (
  <div className="flex justify-center md:justify-start mb-8">
    <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white border border-gray-100 rounded-full shadow-sm">
      <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse"></div>
      <h2 className="font-bold uppercase text-gray-700 tracking-wider text-sm m-0 leading-none">
        Banner Management
      </h2>
    </div>
  </div>
);

// --- MAIN COMPONENT ---

/**
 * BannerManager Page Component.
 * Orchestrates the Banner Form and Banner List side-by-side in a modern UI wrapper.
 */
export default function BannerManager() {
  // Destructure all logic from our custom hook (Logic remains 100% untouched)
  const {
    banners, isUploading, editingId, form, setForm,
    uploadImage, saveBanner, deleteBanner, selectForEdit, resetForm
  } = useBannerManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      {/* Reusable Pill Header */}
      <PageHeader />

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ======================== FORM SECTION ======================== */}
        {/* Placed inside a heavily rounded white card to pop against the background */}
        <div className="lg:col-span-4 bg-white p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-sm transition-all duration-300 hover:shadow-md lg:sticky lg:top-24 relative z-10">
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
        {/* Placed inside a soft gray, track-like container (similar to the pill grid) */}
        <div className="lg:col-span-8 bg-gray-50/80 p-6 md:p-8 rounded-[2rem] border border-gray-100 shadow-inner min-h-[500px]">
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
