import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";

export function useCorporateAccounts(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["admin-corporate", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/corporate/accounts", { params });
      return data;
    },
  });
}

export function useCorporateAccount(id: string) {
  return useQuery({
    queryKey: ["admin-corporate", id],
    queryFn: async () => {
      const { data } = await api.get(`/api/admin/corporate/accounts/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateCorporateAccount() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/corporate/accounts", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-corporate"] }),
  });
}

export function useAddCorporateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, ...body }: { accountId: string } & Record<string, unknown>) => {
      const { data } = await api.post(`/api/admin/corporate/accounts/${accountId}/employees`, body);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-corporate"] }),
  });
}

export function useRemoveCorporateEmployee() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ accountId, employeeId }: { accountId: string; employeeId: string }) => {
      const { data } = await api.delete(`/api/admin/corporate/accounts/${accountId}/employees/${employeeId}`);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-corporate"] }),
  });
}

export function useCorporateInvoices(params?: Record<string, unknown>) {
  return useQuery({
    queryKey: ["admin-invoices", params],
    queryFn: async () => {
      const { data } = await api.get("/api/admin/corporate/invoices", { params });
      return data;
    },
  });
}

export function useGenerateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const { data } = await api.post("/api/admin/corporate/invoices/generate", payload);
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-invoices"] }),
  });
}

export function useRecordInvoicePayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ invoiceId, ...body }: { invoiceId: string } & Record<string, unknown>) => {
      const { data } = await api.patch(`/api/admin/corporate/invoices/${invoiceId}/payment`, body);
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-invoices"] });
      qc.invalidateQueries({ queryKey: ["admin-corporate"] });
    },
  });
}
