import React from "react";
import { useLanguage } from "../../../context/LanguageContext";
import type { AdminMembership } from "../../../hooks/admin/useUserManager";

const inputClass =
  "w-full px-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-2xl transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500 disabled:opacity-60 disabled:cursor-not-allowed";

const labelClass = "block text-sm font-bold text-slate-700 dark:text-slate-300 mb-2 ml-1";

interface UserFormProps {
  form: {
    name: string;
    email: string;
    phone: string;
    password: string;
    role: string;
    membership_id: string;
  };
  handleChange: (e: { target: { name: string; value: string } }) => void;
  handleSubmit: (e: { preventDefault: () => void }) => void;
  saving: boolean;
  editingId: number | null;
  resetForm: () => void;
  memberships: AdminMembership[];
}

export default function UserForm({
  form,
  handleChange,
  handleSubmit,
  saving,
  editingId,
  resetForm,
  memberships,
}: UserFormProps) {
  const { t, getLocalizedText } = useLanguage();

  return (
    <div className="flex flex-col h-full">
      <h3 className="text-xl font-extrabold mb-6 text-slate-800 dark:text-slate-100 flex items-center gap-3 m-0 leading-none">
        {editingId ? (
          <><i className="fa-solid fa-user-pen text-violet-500 dark:text-violet-400"></i> {t("admin.edit_user")}</>
        ) : (
          <><i className="fa-solid fa-user-plus text-violet-500 dark:text-violet-400"></i> {t("admin.add_new_user")}</>
        )}
      </h3>

      <form onSubmit={handleSubmit} className="space-y-5 flex-1 flex flex-col">
        <div>
          <label className={labelClass}>{t("admin.full_name")}</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className={inputClass}
            placeholder={t("admin.full_name")}
          />
        </div>

        <div>
          <label className={labelClass}>{t("admin.phone")}</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            inputMode="numeric"
            className={inputClass}
            placeholder="0912345678"
          />
        </div>

        {/* Email: chỉ nhập lúc tạo mới vì là định danh đăng nhập */}
        <div>
          <label className={labelClass}>{t("admin.email")}</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required={!editingId}
            disabled={Boolean(editingId)}
            className={inputClass}
            placeholder="user@shop.com"
          />
          {editingId ? (
            <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 ml-1">
              <i className="fa-solid fa-lock mr-1"></i> {t("admin.user_email_locked_hint")}
            </p>
          ) : null}
        </div>

        {/* Mật khẩu: bắt buộc khi tạo, để trống khi sửa = giữ nguyên */}
        <div>
          <label className={labelClass}>
            {editingId ? t("admin.new_password") : t("admin.password")}
          </label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required={!editingId}
            minLength={6}
            autoComplete="new-password"
            className={inputClass}
            placeholder={t("admin.password_min_hint")}
          />
          <p className="text-xs font-medium text-slate-400 dark:text-slate-500 mt-2 ml-1">
            {editingId ? t("admin.password_keep_hint") : t("admin.password_min_hint")}
          </p>
        </div>

        {/* Vai trò + Hạng thành viên */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>{t("admin.role")}</label>
            <select name="role" value={form.role} onChange={handleChange} className={inputClass}>
              <option value="customer">{t("admin.role_customer")}</option>
              <option value="admin">{t("admin.role_admin")}</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>{t("admin.membership_tier")}</label>
            <select name="membership_id" value={form.membership_id} onChange={handleChange} className={inputClass}>
              {/* Mọi tài khoản đều có hạng, mặc định là "Thường" (min_spending = 0).
                  Không còn option rỗng "Chưa có hạng" cho cả tạo mới lẫn chỉnh sửa. */}
              {memberships.map((m) => (
                <option key={m.id} value={m.id}>
                  {getLocalizedText(m as unknown as Record<string, unknown>, "name")}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-4 mt-auto">
          <button
            type="submit"
            disabled={saving}
            className={`flex-1 text-white px-6 py-3.5 rounded-full font-bold transition-all duration-300 shadow-sm flex justify-center items-center gap-2 ${
              saving
                ? "bg-violet-300 cursor-not-allowed"
                : "bg-violet-600 hover:bg-violet-700 hover:shadow-md hover:-translate-y-0.5"
            }`}
          >
            {saving ? <i className="fa-solid fa-spinner fa-spin"></i> : null}
            {editingId ? t("admin.save_changes") : t("admin.create_user")}
          </button>

          {editingId && (
            <button
              type="button"
              className="px-6 py-3.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-all duration-300"
              onClick={resetForm}
            >
              {t("common.cancel")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
