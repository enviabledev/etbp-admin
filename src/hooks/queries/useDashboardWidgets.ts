import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export interface DashboardWidget {
  id: string;
  widget_type: string;
  data_source: string;
  title: string;
  config: Record<string, unknown> | null;
  position: { x: number; y: number; w: number; h: number };
}

export function useDashboardWidgets() {
  return useQuery<DashboardWidget[]>({
    queryKey: ["dashboard-widgets"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/analytics/dashboard/widgets");
      return data;
    },
  });
}

export function useWidgetData(widgetId: string) {
  return useQuery({
    queryKey: ["widget-data", widgetId],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/analytics/dashboard/widgets/${widgetId}/data`);
      return data;
    },
    refetchInterval: 300000,
    enabled: !!widgetId,
  });
}

export function useCreateWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/analytics/dashboard/widgets", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }),
  });
}

export function useDeleteWidget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/admin/analytics/dashboard/widgets/${id}`);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }),
  });
}

export function useSaveLayout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { widgets: Array<{ id: string; position: { x: number; y: number; w: number; h: number } }> }) => {
      await api.put("/api/admin/analytics/dashboard/widgets/layout", payload);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }),
  });
}

export function useResetDashboard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (widgetIds: string[]) => {
      for (const id of widgetIds) {
        await api.delete(`/api/admin/analytics/dashboard/widgets/${id}`);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["dashboard-widgets"] }),
  });
}
