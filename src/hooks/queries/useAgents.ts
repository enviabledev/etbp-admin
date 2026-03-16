import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, User } from "@/types";

export function useAgents(params?: { search?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<User>>({
    queryKey: ["admin-agents", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/agents", { params });
      return data;
    },
  });
}

export function useCreateAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/agents", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-agents"] }),
  });
}
