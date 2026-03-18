"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MessageCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { cn } from "@/lib/utils";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

const STATUS_COLORS: Record<string, string> = { open: "bg-yellow-100 text-yellow-700", assigned: "bg-blue-100 text-blue-700", resolved: "bg-green-100 text-green-700", closed: "bg-gray-100 text-gray-600" };

export default function MessagesPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [selectedConv, setSelectedConv] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-conversations", statusFilter],
    queryFn: async () => { const { data } = await api.get("/api/admin/messages/conversations", { params: { status: statusFilter || undefined } }); return data; },
  });

  const { data: messagesData } = useQuery({
    queryKey: ["admin-messages", selectedConv],
    queryFn: async () => { const { data } = await api.get(`/api/v1/messages/conversations/${selectedConv}/messages`); return data; },
    enabled: !!selectedConv,
    refetchInterval: 10000,
  });

  const sendMutation = useMutation({
    mutationFn: async () => { await api.post(`/api/v1/messages/conversations/${selectedConv}/messages`, { content: replyText }); },
    onSuccess: () => { setReplyText(""); qc.invalidateQueries({ queryKey: ["admin-messages", selectedConv] }); qc.invalidateQueries({ queryKey: ["admin-conversations"] }); },
  });

  const resolveMutation = useMutation({
    mutationFn: async () => { await api.patch(`/api/admin/messages/conversations/${selectedConv}/resolve`); },
    onSuccess: () => { toast("success", "Resolved"); qc.invalidateQueries({ queryKey: ["admin-conversations"] }); },
  });

  const conversations = data?.items || [];
  const messages = messagesData?.messages || [];

  return (
    <div className="flex h-[calc(100vh-120px)] gap-4">
      {/* Conversation list */}
      <div className="w-80 bg-white rounded-xl border overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-gray-900">Messages</h2>
          <div className="flex gap-1 mt-2">
            {["", "open", "assigned", "resolved"].map(s => (
              <button key={s} onClick={() => setStatusFilter(s)} className={cn("px-2 py-1 rounded text-xs font-medium", statusFilter === s ? "bg-blue-50 text-blue-700" : "text-gray-500")}>{s || "All"}</button>
            ))}
          </div>
        </div>
        {isLoading ? <div className="p-4"><LoadingSpinner /></div> : conversations.map((c: Record<string, string | number | null>) => (
          <button key={c.id as string} onClick={() => setSelectedConv(c.id as string)}
            className={cn("w-full text-left p-3 border-b hover:bg-gray-50", selectedConv === c.id ? "bg-blue-50" : "")}>
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-gray-900 truncate max-w-[180px]">{c.subject}</p>
              <span className={cn("text-[10px] px-1.5 py-0.5 rounded-full", STATUS_COLORS[c.status as string] || "")}>{c.status}</span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-1">{c.last_message_preview || "No messages"}</p>
            <p className="text-[10px] text-gray-400 mt-1">{c.created_by_name} · {(c.conversation_type as string)?.replace("_", " ")}</p>
          </button>
        ))}
      </div>

      {/* Chat area */}
      <div className="flex-1 bg-white rounded-xl border flex flex-col">
        {!selectedConv ? (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            <div className="text-center"><MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" /><p>Select a conversation</p></div>
          </div>
        ) : (
          <>
            <div className="p-4 border-b flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">{messagesData?.conversation?.subject || "Chat"}</h3>
              {messagesData?.conversation?.status !== "resolved" && (
                <button onClick={() => resolveMutation.mutate()} className="text-xs text-green-600 hover:underline font-medium">Resolve</button>
              )}
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m: Record<string, string | boolean>) => (
                <div key={m.id as string} className={cn("max-w-[70%]", m.message_type === "system" ? "mx-auto text-center" : "")}>
                  {m.message_type === "system" ? (
                    <p className="text-xs text-gray-400 italic">{m.content}</p>
                  ) : (
                    <div className="bg-gray-100 rounded-lg p-3">
                      <p className="text-xs font-medium text-gray-500 mb-1">{m.sender_name}</p>
                      <p className="text-sm text-gray-800">{m.content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="p-3 border-t flex gap-2">
              <input value={replyText} onChange={e => setReplyText(e.target.value)} onKeyDown={e => { if (e.key === "Enter" && replyText.trim()) sendMutation.mutate(); }} placeholder="Type a message..." className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <button onClick={() => { if (replyText.trim()) sendMutation.mutate(); }} disabled={!replyText.trim() || sendMutation.isPending} className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium disabled:opacity-50">Send</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
