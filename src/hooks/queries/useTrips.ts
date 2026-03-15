import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, Trip } from "@/types";

export function useTrips(params?: {
  route_id?: string; from_date?: string; to_date?: string;
  status?: string; page?: number; page_size?: number;
}) {
  return useQuery<PaginatedResponse<Trip>>({
    queryKey: ["admin-trips", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/schedules/trips", { params });
      return data;
    },
  });
}

export function useAssignTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ tripId, ...payload }: { tripId: string; vehicle_id?: string; driver_id?: string }) => {
      const { data } = await api.put(`/api/admin/schedules/trips/${tripId}/assign`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trips"] }),
  });
}

export function useUpdateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/schedules/trips/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-trips"] }),
  });
}
