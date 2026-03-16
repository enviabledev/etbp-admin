"use client";

import { useRouter } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Header from "@/components/layout/Header";
import Card, { CardBody, CardHeader } from "@/components/ui/Card";
import RouteForm from "@/components/forms/RouteForm";
import { useCreateRoute } from "@/hooks/queries/useRoutes";
import { useToast } from "@/components/ui/Toast";

export default function NewRoutePage() {
  const router = useRouter();
  const { toast } = useToast();
  const createMutation = useCreateRoute();

  const handleCreate = (data: Record<string, unknown>) => {
    createMutation.mutate(data, {
      onSuccess: (result) => {
        toast("success", "Route created successfully");
        router.push(`/routes/${result.id}`);
      },
      onError: () => toast("error", "Failed to create route"),
    });
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Routes", href: "/routes" }, { label: "New Route" }]} />
      <Header title="Create Route" subtitle="Add a new transport route" />
      <Card className="max-w-3xl">
        <CardHeader><h3 className="font-semibold">Route Details</h3></CardHeader>
        <CardBody><RouteForm onSubmit={handleCreate} isLoading={createMutation.isPending} /></CardBody>
      </Card>
    </>
  );
}
