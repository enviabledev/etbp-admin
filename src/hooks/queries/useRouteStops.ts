import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useRouteStops(routeId: string) {
  return useQuery({
    queryKey: ["admin-route-stops", routeId],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/routes/${routeId}/stops`);
      return data;
    },
    enabled: !!routeId,
  });
}

export function useCreateRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, ...body }: { routeId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/api/admin/routes/${routeId}/stops`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-route-stops"] }),
  });
}

export function useDeleteRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, stopId }: { routeId: string; stopId: string }) => {
      await api.delete(`/api/admin/routes/${routeId}/stops/${stopId}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-route-stops"] }),
  });
}

export function useReorderRouteStops() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, stopIds }: { routeId: string; stopIds: string[] }) => {
      await api.post(`/api/admin/routes/${routeId}/stops/reorder`, { stop_ids: stopIds });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-route-stops"] }),
  });
}
