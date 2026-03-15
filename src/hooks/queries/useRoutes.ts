import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Route, RouteDetail, PaginatedResponse } from "@/types";

export function useRoutes(params?: { search?: string; is_active?: boolean; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<Route>>({
    queryKey: ["admin-routes", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/routes", { params });
      return data;
    },
  });
}

export function useRoute(id: string) {
  return useQuery<RouteDetail>({
    queryKey: ["admin-route", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/routes/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/routes", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-routes"] }),
  });
}

export function useUpdateRoute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/routes/${id}`, payload);
      return data;
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin-routes"] });
      qc.invalidateQueries({ queryKey: ["admin-route", vars.id] });
    },
  });
}

export function useAddRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, ...payload }: Record<string, unknown> & { routeId: string }) => {
      const { data } = await api.post(`/api/admin/routes/${routeId}/stops`, payload);
      return data;
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["admin-route", vars.routeId] }),
  });
}

export function useDeleteRouteStop() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ routeId, stopId }: { routeId: string; stopId: string }) => {
      await api.delete(`/api/admin/routes/${routeId}/stops/${stopId}`);
    },
    onSuccess: (_, vars) => qc.invalidateQueries({ queryKey: ["admin-route", vars.routeId] }),
  });
}
