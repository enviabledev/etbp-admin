"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Send, Save, Users, Eye } from "lucide-react";
import { useCreateCampaign, usePreviewCampaign, useSendCampaign } from "@/hooks/queries/useNotifications";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import Link from "next/link";

const TARGET_OPTIONS = [
  { value: "all_customers", label: "All Customers" },
  { value: "all_drivers", label: "All Drivers" },
  { value: "all_agents", label: "All Agents" },
  { value: "route", label: "By Route" },
  { value: "terminal", label: "By Terminal" },
  { value: "city", label: "By City" },
  { value: "frequent_travelers", label: "Frequent Travelers (5+ bookings)" },
  { value: "new_users", label: "New Users (last 7 days)" },
  { value: "inactive", label: "Inactive Users (30+ days)" },
];

export default function NewNotificationPage() {
  const router = useRouter();
  const toast = useToast();
  const createMutation = useCreateCampaign();
  const previewMutation = usePreviewCampaign();
  const sendMutation = useSendCampaign();

  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [channel, setChannel] = useState("push");
  const [targetType, setTargetType] = useState("all_customers");
  const [targetValue, setTargetValue] = useState("");
  const [preview, setPreview] = useState<{ count: number; sample: { id: string; name: string; email?: string; phone?: string }[] } | null>(null);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [showSendConfirm, setShowSendConfirm] = useState(false);

  const needsValue = ["route", "terminal", "city"].includes(targetType);

  const handlePreview = async () => {
    if (!title.trim() || !body.trim()) { toast.toast("error","Title and body are required"); return; }
    try {
      const campaign = createdId ? { id: createdId } : await createMutation.mutateAsync({
        title, body, channel, target_type: targetType,
        target_value: needsValue ? targetValue : undefined,
        target_description: TARGET_OPTIONS.find(o => o.value === targetType)?.label,
      });
      if (!createdId) setCreatedId(campaign.id);
      const result = await previewMutation.mutateAsync(campaign.id);
      setPreview(result);
    } catch (e: unknown) {
      const msg = (e as Record<string, Record<string, Record<string, string>>>)?.response?.data?.detail || "Preview failed";
      toast.toast("error", msg);
    }
  };

  const handleSend = () => {
    if (!createdId) { toast.toast("error","Preview first"); return; }
    setShowSendConfirm(true);
  };

  const performSend = async () => {
    setShowSendConfirm(false);
    if (!createdId) return;
    setSending(true);
    try {
      await sendMutation.mutateAsync(createdId);
      toast.toast("success","Campaign sent!");
      router.push("/notifications");
    } catch (e: unknown) {
      const msg = (e as Record<string, Record<string, Record<string, string>>>)?.response?.data?.detail || "Send failed";
      toast.toast("error", msg);
    } finally {
      setSending(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!title.trim() || !body.trim()) { toast.toast("error","Title and body are required"); return; }
    if (createdId) { toast.toast("success","Already saved"); router.push("/notifications"); return; }
    try {
      await createMutation.mutateAsync({
        title, body, channel, target_type: targetType,
        target_value: needsValue ? targetValue : undefined,
        target_description: TARGET_OPTIONS.find(o => o.value === targetType)?.label,
      });
      toast.toast("success","Draft saved");
      router.push("/notifications");
    } catch (e: unknown) {
      const msg = (e as Record<string, Record<string, Record<string, string>>>)?.response?.data?.detail || "Save failed";
      toast.toast("error", msg);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/notifications" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Notifications
      </Link>

      <h1 className="text-2xl font-bold text-gray-900">Compose Notification</h1>

      {/* Message */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Message</h2>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-gray-400">({title.length}/100)</span></label>
          <input value={title} onChange={e => setTitle(e.target.value.slice(0, 100))} placeholder="Notification title" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Body <span className="text-gray-400">({body.length}/500)</span></label>
          <textarea value={body} onChange={e => setBody(e.target.value.slice(0, 500))} placeholder="Notification message..." rows={4} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500" />
        </div>

        {/* Preview card */}
        {title && (
          <div className="bg-gray-50 rounded-lg p-4 border">
            <p className="text-xs text-gray-400 mb-1">Preview</p>
            <p className="font-semibold text-sm text-gray-900">{title}</p>
            <p className="text-sm text-gray-600">{body || "..."}</p>
          </div>
        )}
      </div>

      {/* Channel */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Channel</h2>
        <div className="flex gap-4">
          {[{ value: "push", label: "Push Notification" }, { value: "sms", label: "SMS" }, { value: "both", label: "Both" }].map(opt => (
            <label key={opt.value} className={`flex items-center gap-2 px-4 py-3 rounded-lg border cursor-pointer transition-colors ${channel === opt.value ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:bg-gray-50"}`}>
              <input type="radio" name="channel" value={opt.value} checked={channel === opt.value} onChange={() => setChannel(opt.value)} className="accent-blue-600" />
              <span className="text-sm font-medium">{opt.label}</span>
            </label>
          ))}
        </div>
        {channel === "sms" && <p className="text-xs text-amber-600">SMS costs apply per recipient.</p>}
      </div>

      {/* Target */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Target Audience</h2>
        <select value={targetType} onChange={e => { setTargetType(e.target.value); setPreview(null); setCreatedId(null); }} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm">
          {TARGET_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {needsValue && (
          <input value={targetValue} onChange={e => setTargetValue(e.target.value)} placeholder={targetType === "city" ? "City name (e.g., Lagos)" : `${targetType} ID`} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        )}
      </div>

      {/* Preview */}
      <div className="bg-white rounded-xl border p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recipients</h2>
          <Button variant="secondary" onClick={handlePreview} loading={previewMutation.isPending}>
            <Eye className="h-4 w-4 mr-2" /> Preview Recipients
          </Button>
        </div>
        {preview && (
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-5 w-5 text-blue-600" />
              <span className="text-lg font-bold text-gray-900">{preview.count} recipients</span>
            </div>
            {preview.sample?.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-3 space-y-1">
                <p className="text-xs text-gray-400 mb-2">Sample (first {preview.sample.length})</p>
                {preview.sample.map((u) => (
                  <p key={u.id} className="text-sm text-gray-700">{u.name} — {u.email || u.phone || "\u2014"}</p>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={handleSaveDraft} loading={createMutation.isPending}>
          <Save className="h-4 w-4 mr-2" /> Save as Draft
        </Button>
        <Button onClick={handleSend} loading={sending} disabled={!preview}>
          <Send className="h-4 w-4 mr-2" /> Send Now
        </Button>
      </div>

      <ConfirmDialog
        isOpen={showSendConfirm}
        onClose={() => setShowSendConfirm(false)}
        onConfirm={performSend}
        title="Send Campaign"
        message={`Send ${channel === "both" ? "Push + SMS" : channel.toUpperCase()} to ${preview?.count || "?"} recipients?`}
        confirmLabel="Send Now"
        variant="primary"
        loading={sending}
      />
    </div>
  );
}
