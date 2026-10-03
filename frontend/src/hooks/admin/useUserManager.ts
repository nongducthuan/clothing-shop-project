import { useState, useEffect, useCallback } from "react";
import API from "../../services/apiClient";
import { useToast } from "../../context/ToastContext";
import { useLanguage } from "../../context/LanguageContext";

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  role: "admin" | "customer";
  total_spent?: string | number | null;
  membership_id?: number | null;
  created_at?: string;
  membership?: {
    id: number;
    name: string;
    name_vi?: string | null;
    name_en?: string | null;
    discount_percent?: string | number | null;
  } | null;
  _count?: { orders?: number };
}

export interface AdminMembership {
  id: number;
  name: string;
  name_vi?: string | null;
  name_en?: string | null;
  min_spending?: string | number | null;
  discount_percent?: string | number | null;
}

export interface UserOrderSummary {
  id: number;
  status: string;
  payment_status: string;
  payment_method: string;
  total_price: string | number;
  created_at: string;
}

export const EMPTY_USER_FORM = {
  name: "",
  email: "",
  phone: "",
  password: "",
  role: "customer",
  membership_id: "",
};

const readErrorMessage = (error: unknown): string => {
  const axiosError = error as { response?: { data?: { message?: string } }; message?: string };
  return axiosError?.response?.data?.message || axiosError?.message || "";
};

/**
 * Quản lý người dùng phía Admin: tải danh sách (lọc phía server), tạo / sửa /
 * đặt lại mật khẩu / xóa tài khoản và xem nhanh đơn hàng gần đây.
 */
export function useUserManager() {
  const { showToast } = useToast();
  const { t, translateApiMessage } = useLanguage();

  const [users, setUsers] = useState<AdminUser[]>([]);
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  // Form tạo mới: mặc định hạng "Thường" (min_spending = 0) ngay khi
  // danh sách hạng tải xong - không để "Chưa có hạng".
  const [form, setForm] = useState({ ...EMPTY_USER_FORM });
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [detailModal, setDetailModal] = useState<{
    isOpen: boolean;
    loading: boolean;
    user: AdminUser | null;
    orders: UserOrderSummary[];
  }>({ isOpen: false, loading: false, user: null, orders: [] });

  // Gõ tìm kiếm liên tục không nên bắn request mỗi ký tự => chờ 300ms.
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm.trim()), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Đổi từ khóa tìm kiếm hoặc vai trò => tự reset về trang 1.
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, filterRole]);

  const fetchUsers = useCallback(async () => {
    try {
      const params: Record<string, string | number> = {
        page,
        limit: 20,
      };
      if (debouncedSearch) params.search = debouncedSearch;
      if (filterRole !== "all") params.role = filterRole;

      const res = await API.get("/admin/users", { params });
      const payload = res.data;
      const list = Array.isArray(payload) ? payload : payload.data;
      setUsers(Array.isArray(list) ? list : []);

      if (payload && typeof payload === "object" && "totalPages" in payload) {
        setPagination({
          currentPage: Number(payload.currentPage) || page,
          totalPages: Number(payload.totalPages) || 1,
          totalUsers: Number(payload.totalUsers) || 0,
        });
      } else {
        const total = Array.isArray(list) ? list.length : 0;
        setPagination({ currentPage: 1, totalPages: 1, totalUsers: total });
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, filterRole]);

  const fetchMemberships = useCallback(async () => {
    try {
      const res = await API.get("/admin/memberships");
      const list = Array.isArray(res.data) ? res.data : res.data.data;
      const arr: AdminMembership[] = Array.isArray(list) ? list : [];
      setMemberships(arr);
      // Thống nhất: mọi tài khoản đều có hạng, mặc định là "Thường"
      // (min_spending = 0). Memberships load bất đồng bộ nên gán sau khi có danh sách.
      // Kể cả đang sửa (editingId != null) mà form đang rỗng (user cũ null) thì cũng
      // tự gán "Thường" để select luôn có giá trị hợp lệ.
      setForm((prev) => {
        if (prev.membership_id !== "" || arr.length === 0) return prev;
        const normal = arr.find((m) => Number(m.min_spending) === 0) || arr[0];
        return normal ? { ...prev, membership_id: String(normal.id) } : prev;
      });
    } catch (error) {
      console.error("Failed to fetch memberships:", error);
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  useEffect(() => {
    fetchMemberships();
  }, [fetchMemberships]);

  // Thống nhất mới/cũ đều là "Thường" (min_spending = 0), không còn "Chưa có hạng".
  // - Lần đầu mở trang: memberships chưa tải xong ([]) nên giữ rỗng, chờ có danh sách
  //   rồi tự chọn (tránh gán id sai khi danh sách rỗng).
  // - Đang sửa user cũ bị null: form đang rỗng ("") cũng tự gán "Thường".
  useEffect(() => {
    if (form.membership_id !== "") return;
    const normalTier =
      memberships.find((m) => Number(m.min_spending) === 0) || memberships[0];
    if (normalTier) {
      setForm((prev) =>
        prev.membership_id === "" ? { ...prev, membership_id: String(normalTier.id) } : prev
      );
    }
  }, [form.membership_id, memberships]);

  const handleChange = (e: { target: { name: string; value: string } }) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setEditingId(null);
    // Reset về "Thường" thay vì rỗng để khớp mặc định lúc mở form.
    const normal = memberships.find((m) => Number(m.min_spending) === 0) || memberships[0];
    setForm({ ...EMPTY_USER_FORM, membership_id: normal ? String(normal.id) : "" });
  };

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

    // Thống nhất mới/cũ đều là "Thường": form rỗng (user cũ null hoặc
    // memberships chưa kịp tải) thì tự thay bằng id hạng "Thường".
    const normalFallback =
      memberships.find((m) => Number(m.min_spending) === 0) || memberships[0];
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

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id);
    // Thống nhất: user cũ đang null cũng hiển thị "Thường" ngay trong form.
    // memberships đã có sẵn ở hook nên dùng luôn; nếu chưa tải kịp thì effect
    // mặc định bên trên sẽ tự gán khi danh sách về.
    const normal = memberships.find((m) => Number(m.min_spending) === 0) || memberships[0];
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "customer",
      membership_id: user.membership_id ? String(user.membership_id) : normal ? String(normal.id) : "",
    });
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

  const handleShowDetail = async (user: AdminUser) => {
    setDetailModal({ isOpen: true, loading: true, user, orders: [] });

    try {
      const res = await API.get(`/admin/users/${user.id}`);
      const detail = res.data.data || res.data;
      setDetailModal({
        isOpen: true,
        loading: false,
        user: detail,
        orders: Array.isArray(detail.orders) ? detail.orders : [],
      });
    } catch (error) {
      setDetailModal({ isOpen: true, loading: false, user, orders: [] });
      showToast(`${t("common.error")}: ${translateApiMessage(readErrorMessage(error))}`, "error");
    }
  };

  const closeDetail = () => setDetailModal((prev) => ({ ...prev, isOpen: false }));

  return {
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
    page,
    setPage,
    pagination,
    detailModal,
    handleChange,
    handleSubmit,
    handleEdit,
    handleDelete,
    handleShowDetail,
    closeDetail,
    resetForm,
  };
}
