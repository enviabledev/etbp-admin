import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";

interface Customer {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  phone: string | null;
  total_bookings: number;
  last_booking_date: string | null;
  created_at: string;
}

export type { Customer };

export function useCustomers(params?: { search?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<Customer>>({
    queryKey: ["admin-customers", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/users/customers", { params });
      return data;
    },
  });
}
