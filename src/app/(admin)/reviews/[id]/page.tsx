"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Star, Flag, MessageCircle } from "lucide-react";
import api from "@/lib/api";
import { useToast } from "@/components/ui/Toast";
import { formatDateTime, cn } from "@/lib/utils";
import Button from "@/components/ui/Button";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function ReviewDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [response, setResponse] = useState("");

  const { data: review, isLoading } = useQuery({
    queryKey: ["admin-review", id],
    queryFn: async () => { const { data } = await api.get(`/api/admin/reviews/${id}`); return data; },
    enabled: !!id,
  });

  const respondMutation = useMutation({
    mutationFn: async () => { await api.post(`/api/admin/reviews/${id}/respond`, { response }); },
    onSuccess: () => { toast("success", "Response added"); qc.invalidateQueries({ queryKey: ["admin-review", id] }); },
    onError: () => toast("error", "Failed to respond"),
  });

  const flagMutation = useMutation({
    mutationFn: async (flag: boolean) => { await api.post(`/api/admin/reviews/${id}/${flag ? "flag" : "unflag"}`); },
    onSuccess: () => { toast("success", "Updated"); qc.invalidateQueries({ queryKey: ["admin-review", id] }); },
    onError: () => toast("error", "Failed"),
  });

  if (isLoading || !review) return <LoadingSpinner />;

  const stars = (rating: number | null, label: string) => rating ? (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-500 w-24">{label}</span>
      <div className="flex gap-0.5">
        {[1,2,3,4,5].map(s => <Star key={s} className={cn("h-4 w-4", s <= rating ? "text-amber-400 fill-amber-400" : "text-gray-300")} />)}
      </div>
      <span className="text-sm font-medium ml-1">{rating}/5</span>
    </div>
  ) : null;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <Link href="/reviews" className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-600">
        <ArrowLeft className="h-4 w-4" /> Back to Reviews
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Review Detail</h1>
        <div className="flex gap-2">
          {review.is_flagged ? (
            <Button variant="secondary" onClick={() => flagMutation.mutate(false)} loading={flagMutation.isPending}>Unflag</Button>
          ) : (
            <Button variant="danger" onClick={() => flagMutation.mutate(true)} loading={flagMutation.isPending}>
              <Flag className="h-4 w-4 mr-2" /> Flag
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardHeader><h3 className="font-semibold">Ratings</h3></CardHeader>
        <CardBody className="space-y-2">
          {stars(review.overall_rating, "Overall")}
          {stars(review.driver_rating, "Driver")}
          {stars(review.bus_condition_rating, "Bus")}
          {stars(review.punctuality_rating, "Punctuality")}
          {stars(review.comfort_rating, "Comfort")}
        </CardBody>
      </Card>

      {review.comment && (
        <Card>
          <CardHeader><h3 className="font-semibold">Comment</h3></CardHeader>
          <CardBody><p className="text-sm text-gray-700 whitespace-pre-wrap">{review.comment}</p></CardBody>
        </Card>
      )}

      <Card>
        <CardHeader><h3 className="font-semibold">Info</h3></CardHeader>
        <CardBody className="space-y-2 text-sm">
          <div className="flex justify-between"><span className="text-gray-500">Reviewer</span><span>{review.reviewer}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Anonymous</span><span>{review.is_anonymous ? "Yes" : "No"}</span></div>
          <div className="flex justify-between"><span className="text-gray-500">Submitted</span><span>{formatDateTime(review.created_at)}</span></div>
          {review.is_flagged && <div className="flex justify-between"><span className="text-gray-500">Status</span><span className="text-red-600 font-medium">Flagged</span></div>}
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h3 className="font-semibold flex items-center gap-2"><MessageCircle className="h-4 w-4" /> Admin Response</h3></CardHeader>
        <CardBody>
          {review.admin_response ? (
            <div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{review.admin_response}</p>
              <p className="text-xs text-gray-400 mt-2">Responded {review.admin_responded_at ? formatDateTime(review.admin_responded_at) : ""}</p>
            </div>
          ) : (
            <div className="space-y-3">
              <textarea value={response} onChange={e => setResponse(e.target.value)} placeholder="Write a response to this review..." rows={3} className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
              <Button onClick={() => respondMutation.mutate()} loading={respondMutation.isPending} disabled={!response.trim()}>
                Send Response
              </Button>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
