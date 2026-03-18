"use client";

import { useState } from "react";
import Link from "next/link";
import { Building2, Plus, Eye } from "lucide-react";
import { useCorporateAccounts, useCreateCorporateAccount } from "@/hooks/queries/useCorporate";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function CorporatePage() {
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ company_name: "", company_email: "", credit_limit: "", billing_cycle: "monthly", discount_percentage: "0", contact_person_name: "", contact_person_email: "" });
  const { toast } = useToast();

  const { data, isLoading } = useCorporateAccounts();
  const createMutation = useCreateCorporateAccount();

  const accounts = data?.items || [];

  const handleCreate = () => {
    createMutation.mutate(
      { ...form, credit_limit: parseFloat(form.credit_limit) || 0, discount_percentage: parseFloat(form.discount_percentage) || 0 },
      {
        onSuccess: () => { setShowCreate(false); toast("success", "Account created"); },
        onError: () => toast("error", "Failed to create account"),
      }
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Corporate Accounts</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Account</Button>
      </div>

      {isLoading ? <LoadingSpinner /> : accounts.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No corporate accounts</h3>
          <p className="text-gray-500 mb-6">Create corporate accounts for companies that book in bulk.</p>
          <Button onClick={() => setShowCreate(true)}>Create Account</Button>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Company</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Contact</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Credit Limit</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Balance</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Utilization</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {accounts.map((a: Record<string, string | number>) => (
                <tr key={a.id as string}>
                  <td className="px-5 py-4 font-medium">{a.company_name}</td>
                  <td className="px-5 py-4 text-sm text-gray-500">{a.contact_person_name || "—"}</td>
                  <td className="px-5 py-4 text-sm">{formatCurrency(a.credit_limit as number)}</td>
                  <td className="px-5 py-4 text-sm font-medium">{formatCurrency(a.current_balance as number)}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-gray-200 rounded-full overflow-hidden">
                        <div className={cn("h-full rounded-full", (a.utilization as number) > 80 ? "bg-red-500" : (a.utilization as number) > 50 ? "bg-yellow-500" : "bg-green-500")} style={{ width: `${Math.min(a.utilization as number, 100)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500">{a.utilization}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", a.status === "active" ? "bg-green-100 text-green-700" : a.status === "suspended" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600")}>{a.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    <Link href={`/corporate/${a.id}`}><button className="p-1.5 rounded hover:bg-gray-100"><Eye className="h-4 w-4 text-gray-500" /></button></Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Corporate Account" size="lg">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Company Name *" value={form.company_name} onChange={e => setForm({ ...form, company_name: e.target.value })} />
            <Input label="Company Email *" value={form.company_email} onChange={e => setForm({ ...form, company_email: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Contact Person" value={form.contact_person_name} onChange={e => setForm({ ...form, contact_person_name: e.target.value })} />
            <Input label="Contact Email" value={form.contact_person_email} onChange={e => setForm({ ...form, contact_person_email: e.target.value })} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Credit Limit (₦)" type="number" value={form.credit_limit} onChange={e => setForm({ ...form, credit_limit: e.target.value })} />
            <Select label="Billing Cycle" value={form.billing_cycle} onChange={e => setForm({ ...form, billing_cycle: e.target.value })} options={[
              { value: "weekly", label: "Weekly" }, { value: "biweekly", label: "Biweekly" },
              { value: "monthly", label: "Monthly" }, { value: "quarterly", label: "Quarterly" },
            ]} />
            <Input label="Discount %" type="number" value={form.discount_percentage} onChange={e => setForm({ ...form, discount_percentage: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!form.company_name || !form.company_email}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
