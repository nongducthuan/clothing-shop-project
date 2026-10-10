import PageHeader from "../../components/admin/layout/PageHeader";
import PageLoader from "../../components/common/PageLoader";
import UserForm from "../../components/admin/users/UserForm";
import UserTable from "../../components/admin/users/UserTable";
import UserDetailModal from "../../components/admin/users/UserDetailModal";
import { useUserManager } from "../../hooks/admin/useUserManager";
import { useLanguage } from "../../context/LanguageContext";

export default function UserManager() {
  const { t } = useLanguage();

  const {
    users,
    memberships,
    isLoading,
    saving,
    editingId,
    form,
    searchTerm,
    setSearchTerm,
    filterRole,
    setFilterRole,
    pagination,
    setPage,
    detailModal,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleShowDetail,
    closeDetail,
    resetForm,
  } = useUserManager();

  return (
    <div className="container mx-auto px-4 py-8 lg:px-8 max-w-7xl flex-1 font-sans flex flex-col">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <PageHeader title={t("admin.user_management")} colorClass="bg-indigo-500" />
      </div>

      {isLoading ? (
        <PageLoader />
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Form: tạo mới / chỉnh sửa tài khoản */}
            <div className="lg:col-span-5 xl:col-span-4 bg-white dark:bg-slate-800 p-6 md:p-8 rounded-[2rem] border border-slate-200/80 dark:border-slate-700 shadow-sm transition-all duration-300 hover:shadow-md lg:sticky lg:top-24 lg:max-h-[calc(100vh-7.5rem)] lg:overflow-y-auto lg:overscroll-contain custom-scrollbar relative z-10">
              <UserForm
                form={form}
                handleChange={handleChange}
                handleSubmit={handleSubmit}
                saving={saving}
                editingId={editingId}
                resetForm={resetForm}
                memberships={memberships}
              />
            </div>

            {/* Danh sách + tìm kiếm + lọc vai trò */}
            <div className="lg:col-span-7 xl:col-span-8">
              <UserTable
                users={users}
                memberships={memberships}
                isLoading={isLoading}
                editingId={editingId}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterRole={filterRole}
                setFilterRole={setFilterRole}
                pagination={pagination}
                onPageChange={setPage}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onShowDetail={handleShowDetail}
              />
            </div>
          </div>

          {/* Modal chi tiết + lịch sử đơn hàng */}
          <UserDetailModal detailModal={detailModal} memberships={memberships} onClose={closeDetail} />
        </>
      )}
    </div>
  );
}
