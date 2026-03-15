import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Terminal, PaginatedResponse } from "@/types";

export function useTerminals(params?: { search?: string; is_active?: boolean; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<Terminal>>({
    queryKey: ["admin-terminals", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/routes/terminals", { params });
      return data;
    },
  });
}

export function useAllTerminals() {
  return useQuery<PaginatedResponse<Terminal>>({
    queryKey: ["admin-terminals-all"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/routes/terminals", { params: { page_size: 200 } });
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCreateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/routes/terminals", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-terminals"] }),
  });
}

export function useUpdateTerminal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/routes/terminals/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-terminals"] }),
  });
}
