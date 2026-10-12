import { useState, useEffect, useCallback } from "react";
import API from "../../../services/apiClient";
import type { AdminUser, AdminMembership } from "./userTypes";

interface UserListQuery {
  page: number;
  debouncedSearch: string;
  filterRole: string;
}

/** Tải danh sách người dùng (lọc + phân trang ở server) và danh sách hạng thành viên. */
export function useUserList({ page, debouncedSearch, filterRole }: UserListQuery) {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [memberships, setMemberships] = useState<AdminMembership[]>([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalUsers: 0 });
  const [isLoading, setIsLoading] = useState(true);

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
      setMemberships(Array.isArray(list) ? list : []);
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

  return { users, memberships, pagination, isLoading, fetchUsers };
}
