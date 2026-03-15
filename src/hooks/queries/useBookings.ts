import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Booking, PaginatedResponse } from "@/types";

export function useAdminBookings(params?: {
  status?: string; reference?: string; route_id?: string;
  from_date?: string; to_date?: string; page?: number; page_size?: number;
}) {
  return useQuery<PaginatedResponse<Booking>>({
    queryKey: ["admin-bookings", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/bookings", { params });
      return data;
    },
  });
}

export function useAdminBooking(id: string) {
  return useQuery<Booking>({
    queryKey: ["admin-booking", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/bookings/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useUpdateBookingStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bookingId, status }: { bookingId: string; status: string }) => {
      const { data } = await api.put(`/api/admin/bookings/${bookingId}/status`, null, {
        params: { status },
      });
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-booking"] });
    },
  });
}

export function useCheckInBooking() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data } = await api.put(`/api/admin/bookings/${bookingId}/check-in`);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-bookings"] });
      qc.invalidateQueries({ queryKey: ["admin-booking"] });
    },
  });
}
