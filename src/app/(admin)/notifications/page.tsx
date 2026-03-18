"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Plus, Send, Trash2, Eye } from "lucide-react";
import { useCampaigns, useDeleteCampaign, useSendCampaign } from "@/hooks/queries/useNotifications";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const CHANNEL_LABELS: Record<string, string> = { push: "Push", sms: "SMS", both: "Push + SMS" };
const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function NotificationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading } = useCampaigns({ page });
  const deleteMutation = useDeleteCampaign();
  const sendMutation = useSendCampaign();
  const toast = useToast();

  const campaigns = data?.items || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
          <p className="text-sm text-gray-500 mt-1">{data?.total || 0} campaigns</p>
        </div>
        <div className="flex gap-3">
          <Link href="/notifications/new">
            <Button><Plus className="h-4 w-4 mr-2" /> New Notification</Button>
          </Link>
        </div>
      </div>

      {isLoading ? (
        <LoadingSpinner />
      ) : campaigns.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
          <p className="text-gray-500 mb-6">Send your first notification to passengers, drivers, or agents.</p>
          <Link href="/notifications/new"><Button>Create Notification</Button></Link>
        </div>
      ) : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Title</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Channel</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Target</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Recipients</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Status</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Sent</th>
                <th className="text-left text-xs font-semibold text-gray-500 uppercase px-5 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {campaigns.map((c: any) => (
                <tr key={c.id}>
                  <td className="px-5 py-4">
                    <p className="font-medium text-gray-900 truncate max-w-[200px]">{c.title}</p>
                    <p className="text-xs text-gray-500 truncate max-w-[200px]">{c.body}</p>
                  </td>
                  <td className="px-5 py-4 text-sm">{CHANNEL_LABELS[c.channel] || c.channel}</td>
                  <td className="px-5 py-4 text-sm capitalize">{c.target_description || c.target_type?.replace(/_/g, " ")}</td>
                  <td className="px-5 py-4 text-sm">
                    <span className="font-bold">{c.sent_count}</span>
                    <span className="text-gray-400">/{c.total_recipients}</span>
                    {c.failed_count > 0 && <span className="text-red-500 text-xs ml-1">({c.failed_count} failed)</span>}
                  </td>
                  <td className="px-5 py-4">
                    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize", STATUS_STYLES[c.status] || "bg-gray-100 text-gray-700")}>
                      {c.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-500">{c.sent_at ? formatDateTime(c.sent_at) : "\u2014"}</td>
                  <td className="px-5 py-4">
                    <div className="flex gap-2">
                      <Link href={`/notifications/${c.id}`}>
                        <button className="p-1.5 rounded hover:bg-gray-100" title="View"><Eye className="h-4 w-4 text-gray-500" /></button>
                      </Link>
                      {c.status === "draft" && (
                        <>
                          <button
                            className="p-1.5 rounded hover:bg-blue-50"
                            title="Send"
                            onClick={() => {
                              if (confirm("Send this campaign now?")) {
                                sendMutation.mutate(c.id, {
                                  onSuccess: () => toast.toast("success","Campaign sent"),
                                  onError: () => toast.toast("error","Send failed"),
                                });
                              }
                            }}
                          >
                            <Send className="h-4 w-4 text-blue-600" />
                          </button>
                          <button
                            className="p-1.5 rounded hover:bg-red-50"
                            title="Delete"
                            onClick={() => {
                              if (confirm("Delete this draft?")) {
                                deleteMutation.mutate(c.id, { onSuccess: () => toast.toast("success","Deleted") });
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
