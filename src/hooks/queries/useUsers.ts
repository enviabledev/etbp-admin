import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { User } from "@/types";

interface UserListResponse {
  items: User[];
  total: number;
  page: number;
  page_size: number;
}

export function useAdminUsers(params?: { role?: string; is_active?: boolean; search?: string; page?: number; page_size?: number }) {
  return useQuery<UserListResponse>({
    queryKey: ["admin-users", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/users", { params });
      return data;
    },
  });
}

export function useChangeUserRole() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, role }: { userId: string; role: string }) => {
      const { data } = await api.put(`/api/admin/users/${userId}/role`, null, { params: { role } });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}

export function useToggleUserActive() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ userId, activate }: { userId: string; activate: boolean }) => {
      const endpoint = activate ? "activate" : "deactivate";
      const { data } = await api.put(`/api/admin/users/${userId}/${endpoint}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });
}
