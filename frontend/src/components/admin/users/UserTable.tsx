import React from "react";
import EmptyState from "../../common/EmptyState";
import AdminPagination from "../layout/AdminPagination";
import { useLanguage } from "../../../context/LanguageContext";
import { formatCurrency } from "../../../utils/currencyUtils";
import type { AdminMembership, AdminUser } from "../../../hooks/admin/useUserManager";

interface UserTableProps {
  users: AdminUser[];
  memberships: AdminMembership[];
  isLoading: boolean;
  editingId: number | null;
  searchTerm: string;
  setSearchTerm: (value: string) => void;
  filterRole: string;
  setFilterRole: (value: string) => void;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalUsers: number;
  };
  onPageChange?: (page: number) => void;
  onEdit: (user: AdminUser) => void;
  onDelete: (user: AdminUser) => void;
  onShowDetail: (user: AdminUser) => void;
}

const getInitials = (name?: string): string => {
  const parts = String(name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

export default function UserTable({
  users,
  memberships,
  isLoading,
  editingId,
  searchTerm,
  setSearchTerm,
  filterRole,
  setFilterRole,
  pagination,
  onPageChange,
  onEdit,
  onDelete,
  onShowDetail,
}: UserTableProps) {
  const { t, language, getLocalizedText } = useLanguage();

  const roleTabs = [
    { key: "all", label: t("admin.all_roles") },
    { key: "admin", label: t("admin.role_admin") },
    { key: "customer", label: t("admin.role_customer") },
  ];

  const renderRoleBadge = (role: string) => {
    const isAdmin = role === "admin";
    return (
      <span
        className={`inline-flex items-center justify-center w-max max-w-none whitespace-nowrap px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${
          isAdmin
            ? "bg-violet-50 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400"
            : "bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400"
        }`}
      >
        {isAdmin ? t("admin.role_admin") : t("admin.role_customer")}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-full">
      {/* Thanh tìm kiếm + bộ lọc vai trò */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <i className="fa-solid fa-magnifying-glass absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"></i>
          <input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={t("admin.search_users_placeholder")}
            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-slate-700/60 border border-slate-200/80 dark:border-slate-600 focus:bg-white dark:focus:bg-slate-700 focus:border-violet-500 dark:focus:border-violet-400 focus:ring-4 focus:ring-violet-500/10 rounded-full transition-all duration-300 outline-none text-slate-800 dark:text-slate-100 font-medium placeholder:text-slate-400 dark:placeholder:text-slate-500"
          />
        </div>

        <div className="inline-flex p-1.5 bg-slate-100 dark:bg-slate-700/60 rounded-full shadow-inner self-start">
          {roleTabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilterRole(tab.key)}
              className={`px-5 py-2 rounded-full font-bold text-sm transition-all duration-300 ease-out ${
                filterRole === tab.key
                  ? "bg-white dark:bg-slate-800 text-violet-600 dark:text-violet-400 shadow-sm"
                  : "text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 bg-transparent hover:bg-slate-200/50 dark:hover:bg-slate-700/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Bảng người dùng */}
      <div className="bg-white dark:bg-slate-800 shadow-sm border border-slate-200/80 dark:border-slate-700 rounded-[2rem] overflow-hidden flex-1">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-center border-collapse min-w-[760px]">
            <thead className="bg-slate-50 dark:bg-slate-700/50 border-b border-slate-200/80 dark:border-slate-700">
              <tr>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center">
                  {t("admin.users_title")}
                </th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center w-28">
                  {t("admin.role")}
                </th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center w-36">
                  {t("admin.membership_tier")}
                </th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center w-24">
                  {t("admin.orders_count")}
                </th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center w-32">
                  {t("admin.total_spent")}
                </th>
                <th className="p-4 text-xs font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap text-center w-36">
                  {t("admin.actions")}
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
              {isLoading && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-slate-400">
                    <i className="fa-solid fa-spinner fa-spin text-2xl"></i>
                    <p className="mt-3 font-medium">{t("common.loading")}</p>
                  </td>
                </tr>
              )}

              {!isLoading &&
                users.map((user) => (
                  <tr
                    key={user.id}
                    className={`hover:bg-slate-50/60 dark:hover:bg-slate-700/30 transition-colors duration-200 group ${
                      editingId === user.id ? "bg-violet-50/60 dark:bg-violet-950/20" : ""
                    }`}
                  >
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-11 h-11 flex-shrink-0 rounded-2xl flex items-center justify-center font-black text-sm text-white shadow-sm ${
                            user.role === "admin" ? "bg-violet-500" : "bg-sky-500"
                          }`}
                        >
                          {getInitials(user.name)}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-slate-800 dark:text-slate-100 m-0 truncate">{user.name}</p>
                          <p className="text-xs text-slate-400 dark:text-slate-500 m-0 truncate">{user.email}</p>
                        </div>
                      </div>
                    </td>

                    <td className="p-4 whitespace-nowrap text-center">{renderRoleBadge(user.role)}</td>

                    <td className="p-4 text-center">
                      {user.membership ? (
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {getLocalizedText(user.membership as unknown as Record<string, unknown>, "name")}
                        </span>
                      ) : (
                        /* Fallback tạm cho user cũ đang null (chưa chạy migration):
                           hiển thị "Thường" thay vì "Chưa có hạng". */
                        <span className="font-bold text-slate-700 dark:text-slate-200">
                          {(() => {
                            const normal = memberships.find((m) => Number(m.min_spending) === 0) || memberships[0];
                            return normal
                              ? getLocalizedText(normal as unknown as Record<string, unknown>, "name")
                              : t("admin.no_membership");
                          })()}
                        </span>
                      )}
                    </td>

                    <td className="p-4 text-center font-bold text-slate-700 dark:text-slate-200">
                      {user._count?.orders ?? 0}
                    </td>

                    <td className="p-4 text-center font-extrabold text-emerald-600 dark:text-emerald-400 whitespace-nowrap">
                      {formatCurrency(user.total_spent, language)}
                    </td>

                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2 opacity-80 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onShowDetail(user)}
                          className="w-10 h-10 flex items-center justify-center bg-slate-100 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 rounded-full hover:bg-slate-600 hover:text-white dark:hover:bg-slate-600 transition-all duration-300 shadow-sm"
                          title={t("admin.user_detail")}
                        >
                          <i className="fa-solid fa-eye text-sm"></i>
                        </button>

                        <button
                          onClick={() => onEdit(user)}
                          className="w-10 h-10 flex items-center justify-center bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 rounded-full hover:bg-blue-500 hover:text-white dark:hover:bg-blue-600 transition-all duration-300 shadow-sm"
                          title={t("common.edit")}
                        >
                          <i className="fa-solid fa-pen text-sm"></i>
                        </button>

                        <button
                          onClick={() => onDelete(user)}
                          className="w-10 h-10 flex items-center justify-center bg-red-50 dark:bg-red-950/50 text-red-600 dark:text-red-400 rounded-full hover:bg-red-500 hover:text-white dark:hover:bg-red-600 transition-all duration-300 shadow-sm"
                          title={t("common.delete")}
                        >
                          <i className="fa-solid fa-trash text-sm"></i>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

              {!isLoading && users.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center">
                    <EmptyState
                      title={t("admin.no_users_found")}
                      subtitle={t("search.no_items_desc")}
                      icon="fa-users-slash"
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {pagination && onPageChange && (
          <AdminPagination
            currentPage={pagination.currentPage}
            totalPages={pagination.totalPages}
            totalItems={pagination.totalUsers}
            onPageChange={onPageChange}
            disabled={isLoading}
          />
        )}
      </div>
    </div>
  );
}
