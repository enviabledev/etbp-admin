import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { PaginatedResponse } from "@/types";

interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
}

interface SupportTicket {
  id: string;
  user_id: string;
  booking_id: string | null;
  category: string;
  subject: string;
  description: string;
  status: string;
  priority: string;
  assigned_to: string | null;
  resolved_at: string | null;
  created_at: string;
}

interface PricingRule {
  id: string;
  name: string;
  route_id: string | null;
  rule_type: string;
  condition: Record<string, unknown> | null;
  modifier_type: string;
  modifier_value: number;
  priority: number;
  is_active: boolean;
  valid_from: string | null;
  valid_until: string | null;
}

export type { AuditLog, SupportTicket, PricingRule };

export function useAuditLogs(params?: { action?: string; resource_type?: string; from_date?: string; to_date?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<AuditLog>>({
    queryKey: ["audit-logs", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/settings/audit-logs", { params });
      return data;
    },
  });
}

export function useSupportTickets(params?: { status?: string; priority?: string; page?: number; page_size?: number }) {
  return useQuery<PaginatedResponse<SupportTicket>>({
    queryKey: ["support-tickets", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/settings/support-tickets", { params });
      return data;
    },
  });
}

export function useResolveTicket() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ticketId: string) => {
      const { data } = await api.put(`/api/admin/settings/support-tickets/${ticketId}/resolve`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["support-tickets"] }),
  });
}

export function usePricingRules(params?: { route_id?: string; is_active?: boolean }) {
  return useQuery<PricingRule[]>({
    queryKey: ["pricing-rules", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/settings/pricing-rules", { params });
      return data;
    },
  });
}

export function useCreatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/settings/pricing-rules", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });
}

export function useDeactivatePricingRule() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (ruleId: string) => {
      const { data } = await api.put(`/api/admin/settings/pricing-rules/${ruleId}/deactivate`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pricing-rules"] }),
  });
}
