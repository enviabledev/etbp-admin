"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, UserPlus, FileText, Trash2 } from "lucide-react";
import { useCorporateAccount, useAddCorporateEmployee, useRemoveCorporateEmployee, useCorporateInvoices, useGenerateInvoice, useRecordInvoicePayment } from "@/hooks/queries/useCorporate";
import { useToast } from "@/components/ui/Toast";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { formatCurrency, formatDate, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

type Tab = "overview" | "employees" | "invoices";

export default function CorporateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [tab, setTab] = useState<Tab>("overview");
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [showGenInvoice, setShowGenInvoice] = useState(false);
  const [showPayment, setShowPayment] = useState<string | null>(null);
  const [removingEmployeeId, setRemovingEmployeeId] = useState<string | null>(null);
  const [empForm, setEmpForm] = useState({ email: "", first_name: "", last_name: "", phone: "", department: "", employee_id: "" });
  const [invForm, setInvForm] = useState({ period_start: "", period_end: "" });
  const [payForm, setPayForm] = useState({ amount: "", payment_reference: "", notes: "" });

  const { data: account, isLoading } = useCorporateAccount(id);
  const { data: invoicesData } = useCorporateInvoices({ corporate_account_id: id });
  const addEmpMutation = useAddCorporateEmployee();
  const removeEmpMutation = useRemoveCorporateEmployee();
  const genInvMutation = useGenerateInvoice();
  const payMutation = useRecordInvoicePayment();

  if (isLoading || !account) return <LoadingSpinner />;

  const invoices = invoicesData?.items || [];

  return (
    <div className="space-y-6">
      <Link href="/corporate" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Corporate
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{account.company_name}</h1>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize mt-1 inline-block", account.status === "active" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>{account.status}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
        {(["overview", "employees", "invoices"] as Tab[]).map(t => (
          <button key={t} onClick={() => setTab(t)} className={cn("px-4 py-2 rounded-md text-sm font-medium capitalize", tab === t ? "bg-white text-blue-600 shadow-sm" : "text-gray-500")}>{t}</button>
        ))}
      </div>

      {/* Overview */}
      {tab === "overview" && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card><CardBody><p className="text-xs text-gray-500">Credit Limit</p><p className="text-xl font-bold">{formatCurrency(account.credit_limit)}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-gray-500">Current Balance</p><p className="text-xl font-bold">{formatCurrency(account.current_balance)}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-gray-500">Available Credit</p><p className="text-xl font-bold text-green-600">{formatCurrency(account.available_credit)}</p></CardBody></Card>
          <Card><CardBody><p className="text-xs text-gray-500">Utilization</p><p className="text-xl font-bold">{account.utilization}%</p></CardBody></Card>
        </div>
      )}

      {/* Employees */}
      {tab === "employees" && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold">Employees ({account.employees?.length || 0})</h3>
            <Button size="sm" onClick={() => setShowAddEmployee(true)}><UserPlus className="h-4 w-4 mr-1" /> Add</Button>
          </CardHeader>
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Name</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Email</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Department</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Admin</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {(account.employees || []).map((e: Record<string, string | boolean>) => (
                <tr key={e.id as string}>
                  <td className="px-5 py-3 text-sm font-medium">{e.name}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{e.email}</td>
                  <td className="px-5 py-3 text-sm">{e.department || "—"}</td>
                  <td className="px-5 py-3 text-sm">{e.is_admin ? "Yes" : "No"}</td>
                  <td className="px-5 py-3">
                    <button onClick={() => setRemovingEmployeeId(e.id as string)}
                      className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

      {/* Invoices */}
      {tab === "invoices" && (
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h3 className="font-semibold">Invoices</h3>
            <Button size="sm" onClick={() => setShowGenInvoice(true)}><FileText className="h-4 w-4 mr-1" /> Generate</Button>
          </CardHeader>
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Invoice #</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Period</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Amount</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Paid</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Due</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {invoices.map((inv: Record<string, string | number>) => (
                <tr key={inv.id as string}>
                  <td className="px-5 py-3 text-sm font-mono font-medium">{inv.invoice_number}</td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(inv.period_start as string)} - {formatDate(inv.period_end as string)}</td>
                  <td className="px-5 py-3 text-sm font-medium">{formatCurrency(inv.total_amount as number)}</td>
                  <td className="px-5 py-3 text-sm">{formatCurrency(inv.paid_amount as number)}</td>
                  <td className="px-5 py-3">
                    <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize",
                      inv.status === "paid" ? "bg-green-100 text-green-700" : inv.status === "overdue" ? "bg-red-100 text-red-700" : inv.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"
                    )}>{(inv.status as string)?.replace(/_/g, " ")}</span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-500">{formatDate(inv.due_date as string)}</td>
                  <td className="px-5 py-3">
                    {inv.status !== "paid" && <button onClick={() => setShowPayment(inv.id as string)} className="text-xs text-blue-600 hover:underline">Record Payment</button>}
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && <tr><td colSpan={7} className="text-center py-8 text-gray-400">No invoices yet</td></tr>}
            </tbody>
          </table>
        </Card>
      )}

      {/* Add Employee Modal */}
      <Modal isOpen={showAddEmployee} onClose={() => setShowAddEmployee(false)} title="Add Employee">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="First Name" value={empForm.first_name} onChange={e => setEmpForm({ ...empForm, first_name: e.target.value })} />
            <Input label="Last Name" value={empForm.last_name} onChange={e => setEmpForm({ ...empForm, last_name: e.target.value })} />
          </div>
          <Input label="Email *" value={empForm.email} onChange={e => setEmpForm({ ...empForm, email: e.target.value })} />
          <Input label="Phone" value={empForm.phone} onChange={e => setEmpForm({ ...empForm, phone: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Employee ID" value={empForm.employee_id} onChange={e => setEmpForm({ ...empForm, employee_id: e.target.value })} />
            <Input label="Department" value={empForm.department} onChange={e => setEmpForm({ ...empForm, department: e.target.value })} />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowAddEmployee(false)}>Cancel</Button>
            <Button onClick={() => addEmpMutation.mutate({ accountId: id, ...empForm }, { onSuccess: () => { setShowAddEmployee(false); toast("success", "Employee added"); }, onError: () => toast("error", "Failed") })} loading={addEmpMutation.isPending} disabled={!empForm.email}>Add</Button>
          </div>
        </div>
      </Modal>

      {/* Generate Invoice Modal */}
      <Modal isOpen={showGenInvoice} onClose={() => setShowGenInvoice(false)} title="Generate Invoice">
        <div className="space-y-4">
          <Input label="Period Start" type="date" value={invForm.period_start} onChange={e => setInvForm({ ...invForm, period_start: e.target.value })} />
          <Input label="Period End" type="date" value={invForm.period_end} onChange={e => setInvForm({ ...invForm, period_end: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowGenInvoice(false)}>Cancel</Button>
            <Button onClick={() => genInvMutation.mutate({ corporate_account_id: id, period_start: invForm.period_start, period_end: invForm.period_end }, { onSuccess: () => { setShowGenInvoice(false); toast("success", "Invoice generated"); }, onError: () => toast("error", "Failed") })} loading={genInvMutation.isPending} disabled={!invForm.period_start || !invForm.period_end}>Generate</Button>
          </div>
        </div>
      </Modal>

      {/* Record Payment Modal */}
      <Modal isOpen={!!showPayment} onClose={() => setShowPayment(null)} title="Record Payment">
        <div className="space-y-4">
          <Input label="Amount (₦)" type="number" value={payForm.amount} onChange={e => setPayForm({ ...payForm, amount: e.target.value })} />
          <Input label="Payment Reference" value={payForm.payment_reference} onChange={e => setPayForm({ ...payForm, payment_reference: e.target.value })} />
          <Input label="Notes" value={payForm.notes} onChange={e => setPayForm({ ...payForm, notes: e.target.value })} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowPayment(null)}>Cancel</Button>
            <Button onClick={() => payMutation.mutate({ invoiceId: showPayment!, amount: parseFloat(payForm.amount), payment_reference: payForm.payment_reference || undefined, notes: payForm.notes || undefined }, { onSuccess: () => { setShowPayment(null); toast("success", "Payment recorded"); }, onError: () => toast("error", "Failed") })} loading={payMutation.isPending} disabled={!payForm.amount}>Record</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!removingEmployeeId}
        onClose={() => setRemovingEmployeeId(null)}
        onConfirm={() => {
          if (removingEmployeeId) {
            removeEmpMutation.mutate({ accountId: id, employeeId: removingEmployeeId }, { onSuccess: () => toast("success", "Removed") });
          }
          setRemovingEmployeeId(null);
        }}
        title="Remove Employee"
        message="Remove this employee from the corporate account?"
        confirmLabel="Remove"
        variant="danger"
      />
    </div>
  );
}
