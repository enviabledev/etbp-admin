import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, PromoCode } from "@/types";

export function usePromos(params?: { is_active?: boolean; search?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<PromoCode>>({
    queryKey: ["admin-promos", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/promos", { params });
      return data;
    },
  });
}

export function useCreatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/promos", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promos"] }),
  });
}

export function useUpdatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/promos/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promos"] }),
  });
}

export function useDeactivatePromo() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.put(`/api/admin/promos/${id}/deactivate`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-promos"] }),
  });
}
