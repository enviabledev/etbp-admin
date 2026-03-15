import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Schedule } from "@/types";

export function useSchedules(params?: { route_id?: string; is_active?: boolean; page?: number; page_size?: number }) {
  return useQuery<Schedule[]>({
    queryKey: ["admin-schedules", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/schedules", { params });
      return data;
    },
  });
}

export function useCreateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/schedules", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-schedules"] }),
  });
}

export function useUpdateSchedule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/schedules/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-schedules"] }),
  });
}

export function useGenerateTrips() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { schedule_id: string; from_date: string; to_date: string }) => {
      const { data } = await api.post("/api/admin/schedules/trips/generate", payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-trips"] });
      qc.invalidateQueries({ queryKey: ["admin-schedules"] });
    },
  });
}
