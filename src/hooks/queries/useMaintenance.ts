import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useMaintenance(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["admin-maintenance", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/maintenance", { params });
      return data;
    },
  });
}

export function useMaintenanceStats() {
  return useQuery({
    queryKey: ["admin-maintenance-stats"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/maintenance/stats");
      return data;
    },
  });
}

export function useMaintenanceDetail(id: string) {
  return useQuery({
    queryKey: ["admin-maintenance", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/maintenance/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateMaintenance() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/maintenance", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-maintenance"] }),
  });
}

export function useUpdateMaintenanceStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...body }: { id: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/api/admin/maintenance/${id}/status`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-maintenance"] }),
  });
}

export function useVehicleDocuments(vehicleId: string) {
  return useQuery({
    queryKey: ["admin-vehicle-docs", vehicleId],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/maintenance/vehicles/${vehicleId}/documents`);
      return data;
    },
    enabled: !!vehicleId,
  });
}

export function useCreateVehicleDocument() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ vehicleId, ...body }: { vehicleId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/api/admin/maintenance/vehicles/${vehicleId}/documents`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-vehicle-docs"] }),
  });
}

export function useExpiringDocuments(daysAhead = 30) {
  return useQuery({
    queryKey: ["admin-expiring-docs", daysAhead],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/maintenance/vehicle-documents/expiring", { params: { days_ahead: daysAhead } });
      return data;
    },
  });
}
