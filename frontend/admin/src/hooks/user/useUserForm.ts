import { useState, useEffect } from "react";
import {
  EMPTY_USER_FORM,
  pickDefaultMembership,
  type AdminMembership,
  type AdminUser,
} from "./userTypes";

/** Form tạo / sửa người dùng: state form, chế độ sửa và mặc định hạng "Thường". */
export function useUserForm(memberships: AdminMembership[]) {
  const [editingId, setEditingId] = useState<number | null>(null);
  // Form tạo mới: mặc định hạng "Thường" (min_spending = 0) ngay khi
  // danh sách hạng tải xong - không để "Chưa có hạng".
  const [form, setForm] = useState({ ...EMPTY_USER_FORM });

  // - Lần đầu mở trang: memberships chưa tải xong ([]) nên giữ rỗng, chờ có danh sách
  //   rồi tự chọn (tránh gán id sai khi danh sách rỗng).
  // - Đang sửa user cũ bị null: form đang rỗng ("") cũng tự gán "Thường".
  useEffect(() => {
    if (form.membership_id !== "") return;
    const normalTier = pickDefaultMembership(memberships);
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
    const normal = pickDefaultMembership(memberships);
    setForm({ ...EMPTY_USER_FORM, membership_id: normal ? String(normal.id) : "" });
  };

  const handleEdit = (user: AdminUser) => {
    setEditingId(user.id);
    // User cũ đang null cũng hiển thị "Thường" ngay trong form.
    const normal = pickDefaultMembership(memberships);
    setForm({
      name: user.name || "",
      email: user.email || "",
      phone: user.phone || "",
      password: "",
      role: user.role || "customer",
      membership_id: user.membership_id ? String(user.membership_id) : normal ? String(normal.id) : "",
    });
  };

  return { editingId, form, handleChange, handleEdit, resetForm };
}
