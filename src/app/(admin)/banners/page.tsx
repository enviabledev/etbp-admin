"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Image, Trash2 } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import LoadingSpinner from "@/components/ui/LoadingSpinner";
import ConfirmDialog from "@/components/ui/ConfirmDialog";

export default function BannersPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [deletingBannerId, setDeletingBannerId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", heading: "", body_text: "", placement: "home_hero", background_color: "#0057FF", text_color: "#FFFFFF", cta_text: "", cta_action: "url", cta_value: "", start_date: "", end_date: "", priority: "0" });
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({ queryKey: ["admin-banners"], queryFn: async () => { const { data } = await api.get("/api/admin/banners"); return data; } });
  const createMutation = useMutation({
    mutationFn: async (payload: Record<string, unknown>) => { const { data } = await api.post("/api/admin/banners", payload); return data; },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); setShowCreate(false); toast("success", "Banner created"); },
    onError: () => toast("error", "Failed"),
  });
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => { await api.delete(`/api/admin/banners/${id}`); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["admin-banners"] }); toast("success", "Deleted"); },
  });

  const banners = data?.items || [];
  const STATUS_COLORS: Record<string, string> = { active: "bg-green-100 text-green-700", scheduled: "bg-blue-100 text-blue-700", expired: "bg-gray-100 text-gray-600" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Banners</h1>
        <Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> Create Banner</Button>
      </div>

      {isLoading ? <LoadingSpinner /> : banners.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border"><Image className="h-12 w-12 text-gray-300 mx-auto mb-4" /><h3 className="text-lg font-semibold mb-2">No banners</h3><p className="text-gray-500 mb-4">Create promotional banners for the customer apps.</p><Button onClick={() => setShowCreate(true)}>Create</Button></div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b"><tr>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Title</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Placement</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Impressions</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Clicks</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">CTR</th>
              <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
            </tr></thead>
            <tbody className="divide-y">
              {banners.map((b: Record<string, string | number | boolean>) => (
                <tr key={b.id as string}>
                  <td className="px-5 py-4"><p className="font-medium">{b.title}</p><p className="text-xs text-gray-400">{b.heading}</p></td>
                  <td className="px-5 py-4 text-sm capitalize">{(b.placement as string)?.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4"><span className={cn("text-xs px-2 py-0.5 rounded-full font-medium capitalize", STATUS_COLORS[b.status as string] || "")}>{b.status}</span></td>
                  <td className="px-5 py-4 text-sm">{b.impressions?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm">{b.clicks?.toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm">{b.ctr}%</td>
                  <td className="px-5 py-4"><button onClick={() => setDeletingBannerId(b.id as string)} className="p-1 text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!deletingBannerId}
        onClose={() => setDeletingBannerId(null)}
        onConfirm={() => { if (deletingBannerId) deleteMutation.mutate(deletingBannerId); setDeletingBannerId(null); }}
        title="Delete Banner"
        message="Delete this banner? This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
      />

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Banner" size="lg">
        <div className="space-y-4">
          <Input label="Title (internal)" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} />
          <Input label="Heading (shown to users)" value={form.heading} onChange={e => setForm({ ...form, heading: e.target.value })} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="Background Color" type="color" value={form.background_color} onChange={e => setForm({ ...form, background_color: e.target.value })} />
            <Input label="Text Color" type="color" value={form.text_color} onChange={e => setForm({ ...form, text_color: e.target.value })} />
          </div>
          <Select label="Placement" value={form.placement} onChange={e => setForm({ ...form, placement: e.target.value })} options={[
            { value: "home_hero", label: "Home Hero" }, { value: "home_card", label: "Home Card" }, { value: "search_top", label: "Search Top" },
          ]} />
          <div className="grid grid-cols-2 gap-4">
            <Input label="CTA Text" value={form.cta_text} onChange={e => setForm({ ...form, cta_text: e.target.value })} placeholder="Book Now" />
            <Input label="CTA Value" value={form.cta_value} onChange={e => setForm({ ...form, cta_value: e.target.value })} placeholder="URL or route ID" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Input label="Start Date" type="datetime-local" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} />
            <Input label="End Date" type="datetime-local" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} />
          </div>
          <Input label="Priority" type="number" value={form.priority} onChange={e => setForm({ ...form, priority: e.target.value })} />
          {/* Preview */}
          {form.heading && (
            <div className="rounded-lg p-6 text-center" style={{ backgroundColor: form.background_color, color: form.text_color }}>
              <p className="text-lg font-bold">{form.heading}</p>
              {form.body_text && <p className="text-sm mt-1 opacity-90">{form.body_text}</p>}
              {form.cta_text && <button className="mt-3 px-4 py-1.5 bg-white/20 rounded-full text-sm font-medium">{form.cta_text}</button>}
            </div>
          )}
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={() => createMutation.mutate({ ...form, priority: parseInt(form.priority) || 0, start_date: form.start_date ? new Date(form.start_date).toISOString() : undefined, end_date: form.end_date ? new Date(form.end_date).toISOString() : undefined })} loading={createMutation.isPending} disabled={!form.title || !form.start_date || !form.end_date}>Create</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
