import { useState } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";
import { useUserFilters } from "./user/useUserFilters";
import { useUserList } from "./user/useUserList";
import { useUserForm } from "./user/useUserForm";
import { useUserDetail } from "./user/useUserDetail";
import { pickDefaultMembership, readErrorMessage, type AdminUser } from "./user/userTypes";

// Giữ export cũ để các component đang import type từ file này không vỡ.
export type { AdminUser, AdminMembership, UserOrderSummary } from "./user/userTypes";
export { EMPTY_USER_FORM } from "./user/userTypes";

/**
 * Quản lý người dùng phía Admin. Hook này chỉ ghép các hook con lại:
 * - useUserFilters: tìm kiếm / lọc vai trò / trang
 * - useUserList   : tải danh sách người dùng + hạng thành viên
 * - useUserForm   : form tạo / sửa
 * - useUserDetail : modal xem nhanh đơn hàng gần đây
 * và giữ 2 thao tác cần phối hợp nhiều phần: lưu (handleSubmit) và xóa (handleDelete).
 */
export function useUserManager() {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();

  const [saving, setSaving] = useState(false);

  const filters = useUserFilters();
  const { users, memberships, pagination, isLoading, fetchUsers } = useUserList({
    page: filters.page,
    debouncedSearch: filters.debouncedSearch,
    filterRole: filters.filterRole,
  });
  const userForm = useUserForm(memberships);
  const { editingId, form, resetForm } = userForm;
  const detail = useUserDetail();

  const handleSubmit = async (e: { preventDefault: () => void }) => {
    e.preventDefault();

    // Sửa người dùng mà ĐỔI VAI TRÒ là hành động nhạy cảm (cấp/gỡ quyền quản trị),
    // bắt xác nhận để tránh bấm nhầm. Bấm Hủy thì dừng, không gọi API.
    if (editingId) {
      const original = users.find((u) => u.id === editingId);
      if (original && original.role !== form.role) {
        const confirmMessage =
          form.role === "admin"
            ? t("admin.confirm_promote_admin", "Cấp quyền quản trị viên cho người dùng này?")
            : t("admin.confirm_demote_admin", "Gỡ quyền quản trị viên của người dùng này?");
        if (!window.confirm(confirmMessage)) return;
      }
    }

    setSaving(true);

    // Form rỗng (user cũ null hoặc memberships chưa kịp tải) thì tự thay bằng id hạng "Thường".
    const normalFallback = pickDefaultMembership(memberships);
    const membershipId =
      form.membership_id === ""
        ? normalFallback
          ? Number(normalFallback.id)
          : null
        : Number(form.membership_id);

    try {
      if (editingId) {
        await API.put(`/admin/users/${editingId}`, {
          name: form.name.trim(),
          phone: form.phone.trim(),
          role: form.role,
          membership_id: membershipId,
        });

        // Ô mật khẩu để trống = giữ nguyên mật khẩu hiện tại.
        if (form.password.trim()) {
          await API.put(`/admin/users/${editingId}/password`, { newPassword: form.password.trim() });
        }

        showToast(t("admin.user_updated", "Cập nhật người dùng thành công!"), "success");
      } else {
        await API.post("/admin/users", {
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          password: form.password,
          role: form.role,
          membership_id: membershipId,
        });
        showToast(t("admin.user_created", "Tạo người dùng thành công!"), "success");
      }

      resetForm();
      await fetchUsers();
    } catch (error) {
      showToast(`${t("common.error")}: ${translateApiMessage(readErrorMessage(error))}`, "error");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (user: AdminUser) => {
    if (!window.confirm(t("admin.confirm_delete_user", "Bạn có chắc muốn xóa người dùng này?"))) return;

    try {
      await API.delete(`/admin/users/${user.id}`);
      if (editingId === user.id) resetForm();
      await fetchUsers();
      showToast(t("admin.user_deleted", "Đã xóa người dùng!"), "success");
    } catch (error) {
      showToast(`${t("common.error")}: ${translateApiMessage(readErrorMessage(error))}`, "error");
    }
  };

  return {
    users,
    memberships,
    isLoading,
    saving,
    editingId,
    form,
    searchTerm: filters.searchTerm,
    setSearchTerm: filters.setSearchTerm,
    filterRole: filters.filterRole,
    setFilterRole: filters.setFilterRole,
    page: filters.page,
    setPage: filters.setPage,
    pagination,
    detailModal: detail.detailModal,
    handleChange: userForm.handleChange,
    handleSubmit,
    handleEdit: userForm.handleEdit,
    handleDelete,
    handleShowDetail: detail.handleShowDetail,
    closeDetail: detail.closeDetail,
    resetForm,
  };
}
