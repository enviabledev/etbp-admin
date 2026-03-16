import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse, Vehicle, VehicleType } from "@/types";

export function useVehicles(params?: { status?: string; search?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<Vehicle>>({
    queryKey: ["admin-vehicles", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/vehicles", { params });
      return data;
    },
  });
}

export function useVehicleTypes() {
  return useQuery<VehicleType[]>({
    queryKey: ["admin-vehicle-types"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/vehicles/types");
      return data;
    },
    staleTime: 60_000,
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/vehicles", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-vehicles"] }),
  });
}

export function useUpdateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/vehicles/${id}`, payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-vehicles"] }),
  });
}

export function useVehicle(id: string) {
  return useQuery<Vehicle>({
    queryKey: ["admin-vehicle", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/vehicles/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useVehicleType(id: string) {
  return useQuery<VehicleType>({
    queryKey: ["admin-vehicle-type", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/vehicles/types/${id}`);
      return data.vehicle_type ?? data;
    },
    enabled: !!id,
  });
}

export function useUpdateVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...payload }: Record<string, unknown> & { id: string }) => {
      const { data } = await api.put(`/api/admin/vehicles/types/${id}`, payload);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-vehicle-types"] });
      qc.invalidateQueries({ queryKey: ["admin-vehicle-type"] });
    },
  });
}

export function useCreateVehicleType() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/vehicles/types", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-vehicle-types"] }),
  });
}
