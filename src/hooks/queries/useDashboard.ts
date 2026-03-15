import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats, RevenueData, BookingTrend } from "@/types";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/reports/dashboard");
      return data;
    },
    refetchInterval: 30_000,
  });
}

export function useRevenueData(groupBy = "day", fromDate?: string, toDate?: string) {
  return useQuery<RevenueData[]>({
    queryKey: ["revenue", groupBy, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = { group_by: groupBy };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const { data } = await api.get("/api/admin/reports/revenue", { params });
      return data;
    },
  });
}

export function useBookingTrends(groupBy = "day", fromDate?: string, toDate?: string) {
  return useQuery<BookingTrend[]>({
    queryKey: ["booking-trends", groupBy, fromDate, toDate],
    queryFn: async () => {
      const params: Record<string, string> = { group_by: groupBy };
      if (fromDate) params.from_date = fromDate;
      if (toDate) params.to_date = toDate;
      const { data } = await api.get("/api/admin/reports/booking-trends", { params });
      return data;
    },
  });
}

export function useRecentBookings() {
  return useQuery({
    queryKey: ["recent-bookings"],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/bookings", {
        params: { page: 1, page_size: 5 },
      });
      return data;
    },
    refetchInterval: 30_000,
  });
}
