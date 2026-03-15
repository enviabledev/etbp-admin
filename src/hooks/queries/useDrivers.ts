import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";

interface Driver {
  id: string;
  user_id: string;
  license_number: string;
  license_expiry: string;
  license_class: string | null;
  years_experience: number | null;
  rating_avg: number;
  total_trips: number;
  is_available: boolean;
  user?: { id: string; first_name: string; last_name: string; email: string; phone: string };
  assigned_terminal?: { id: string; name: string; code: string } | null;
}

export type { Driver };

export function useDrivers(params?: { is_available?: boolean; search?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<Driver>>({
    queryKey: ["admin-drivers", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/drivers", { params });
      return data;
    },
  });
}

export function useCreateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/drivers", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-drivers"] }),
  });
}

export function useUpdateDriver() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/drivers/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-drivers"] }),
  });
}
