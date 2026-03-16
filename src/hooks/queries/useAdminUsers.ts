import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, User } from "@/types";

export function useAdminUsersList(params?: { search?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ["admin-users-list", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/users/admins", { params });
      return data;
    },
  });
}
