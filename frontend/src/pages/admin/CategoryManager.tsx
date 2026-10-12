import { useCategoryManager } from "../../hooks/admin/useCategoryManager";
import CategoryForm from "../../components/admin/categories/CategoryForm";
import CategoryList from "../../components/admin/categories/CategoryList";
import { useLanguage } from "../../context/LanguageContext";

const PageHeader = () => {
  const { t } = useLanguage();
  return (
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
      {/* Pill Badge Title */}
      <div className="inline-flex items-center gap-3 px-6 py-2.5 bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 rounded-full shadow-sm">
        <div className="w-2.5 h-2.5 rounded-full bg-fuchsia-500 animate-pulse"></div>
        <h2 className="font-bold uppercase text-slate-700 dark:text-slate-200 tracking-wider text-sm m-0 leading-none">
          {t("admin.category_management")}
        </h2>
      </div>
    </div>
  );
};

export default function CategoryManager() {
  const {
    categories, editingId, loading, filterGender, setFilterGender,
    categoryImages, recommendNames, form, setForm,
    handleChange, handleSubmit, handleEdit, handleDelete, resetForm
  } = useCategoryManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1">

      {/* Reusable Pill Header & Actions */}
      <PageHeader />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

        {/* ======================== FORM SECTION ======================== */}
        {/* Placed inside a heavily rounded card */}
        <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md lg:sticky lg:top-24 relative z-10">
          <CategoryForm
            form={form}
            setForm={setForm}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            loading={loading}
            editingId={editingId}
            resetForm={resetForm}
            recommendNames={recommendNames}
            categoryImages={categoryImages}
          />
        </div>

        {/* ======================== LIST SECTION ======================== */}
        {/* Placed inside a clean card container */}
        <div className="lg:col-span-7 xl:col-span-8 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm min-h-[500px]">
          <CategoryList
            categories={categories}
            filterGender={filterGender}
            setFilterGender={setFilterGender}
            handleEdit={handleEdit}
            handleDelete={handleDelete}
          />
        </div>

      </div>
    </div>
  );
}
