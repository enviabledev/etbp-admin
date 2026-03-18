"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Send, Users, CheckCircle, XCircle, Clock } from "lucide-react";
import { useCampaign, useSendCampaign } from "@/hooks/queries/useNotifications";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const STATUS_STYLES: Record<string, string> = {
  draft: "bg-gray-100 text-gray-700",
  sending: "bg-blue-100 text-blue-700",
  sent: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-700",
};

export default function CampaignDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: campaign, isLoading } = useCampaign(id);
  const sendMutation = useSendCampaign();
  const toast = useToast();

  if (isLoading) return <LoadingSpinner />;
  if (!campaign) return <div className="text-center py-16 text-gray-500">Campaign not found</div>;

  const successRate = campaign.total_recipients > 0 ? Math.round((campaign.sent_count / campaign.total_recipients) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/notifications" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Notifications
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{campaign.title}</h1>
          <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium capitalize mt-2", STATUS_STYLES[campaign.status])}>
            {campaign.status}
          </span>
        </div>
        {campaign.status === "draft" && (
          <Button onClick={() => sendMutation.mutate(id, { onSuccess: () => toast.toast("success","Sent!"), onError: () => toast.toast("error","Failed") })} loading={sendMutation.isPending}>
            <Send className="h-4 w-4 mr-2" /> Send Now
          </Button>
        )}
      </div>

      {/* Message */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="font-semibold text-gray-900 mb-3">Message</h2>
        <div className="bg-gray-50 rounded-lg p-4">
          <p className="font-semibold text-sm">{campaign.title}</p>
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{campaign.body}</p>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
          <div><span className="text-gray-500">Channel</span><p className="font-medium capitalize">{campaign.channel === "both" ? "Push + SMS" : campaign.channel}</p></div>
          <div><span className="text-gray-500">Target</span><p className="font-medium capitalize">{campaign.target_description || campaign.target_type?.replace(/_/g, " ")}</p></div>
          <div><span className="text-gray-500">Created</span><p className="font-medium">{formatDateTime(campaign.created_at)}</p></div>
        </div>
      </div>

      {/* Stats */}
      {campaign.status !== "draft" && (
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: "Total Recipients", value: campaign.total_recipients, icon: Users, color: "text-blue-600" },
            { label: "Sent", value: campaign.sent_count, icon: CheckCircle, color: "text-green-600" },
            { label: "Failed", value: campaign.failed_count, icon: XCircle, color: "text-red-600" },
            { label: "Success Rate", value: `${successRate}%`, icon: Clock, color: "text-gray-600" },
          ].map(stat => (
            <div key={stat.label} className="bg-white rounded-xl border p-5">
              <stat.icon className={cn("h-5 w-5 mb-2", stat.color)} />
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      )}

      {campaign.sent_at && (
        <p className="text-sm text-gray-500">Sent at: {formatDateTime(campaign.sent_at)}</p>
      )}
    </div>
  );
}
