import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCampaigns(params?: { status?: string; page?: number }) {
  return useQuery({
    queryKey: ["admin-campaigns", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/notifications/campaigns", { params });
      return data;
    },
  });
}

export function useCampaign(id: string) {
  return useQuery({
    queryKey: ["admin-campaign", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/notifications/campaigns/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/notifications/campaigns", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });
}

export function usePreviewCampaign() {
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/admin/notifications/campaigns/${id}/preview`);
      return data;
    },
  });
}

export function useSendCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.post(`/api/admin/notifications/campaigns/${id}/send`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });
}

export function useQuickSend() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/notifications/quick-send", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });
}

export function useDeleteCampaign() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await api.delete(`/api/admin/notifications/campaigns/${id}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });
}

export function useDisruptionAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/notifications/disruption-alert", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-campaigns"] }),
  });
}
