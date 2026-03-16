"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Badge from "@/components/ui/Badge";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import EmptyState from "@/components/ui/EmptyState";
import { TableSkeleton } from "@/components/ui/Skeleton";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { Table, Thead, Tbody, Th, Tr, Td } from "@/components/ui/Table";
import { usePricingRules, useCreatePricingRule, useDeactivatePricingRule } from "@/hooks/queries/useSettings";
import { useToast } from "@/components/ui/Toast";
import { formatCurrency } from "@/lib/utils";
import { Plus, DollarSign, XCircle } from "lucide-react";

export default function PricingRulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState("surge");
  const [modifierType, setModifierType] = useState("percentage");
  const [modifierValue, setModifierValue] = useState("");
  const [priority, setPriority] = useState("0");
  const { toast } = useToast();

  const { data: rules, isLoading } = usePricingRules();
  const createMutation = useCreatePricingRule();
  const deactivateMutation = useDeactivatePricingRule();

  const handleCreate = () => {
    createMutation.mutate({
      name, rule_type: ruleType, modifier_type: modifierType,
      modifier_value: parseFloat(modifierValue), priority: parseInt(priority),
    }, {
      onSuccess: () => {
        setShowCreate(false); setName(""); setModifierValue("");
        toast("success", "Pricing rule created");
      },
      onError: () => toast("error", "Failed to create rule"),
    });
  };

  return (
    <>
      <Breadcrumb items={[{ label: "Settings", href: "/settings" }, { label: "Pricing Rules" }]} />
      <Header title="Pricing Rules" subtitle={`${rules?.length || 0} rules`}
        actions={<Button onClick={() => setShowCreate(true)}><Plus className="h-4 w-4 mr-2" /> New Rule</Button>}
      />

      <Card>
        {isLoading ? <TableSkeleton /> : !rules || rules.length === 0 ? (
          <EmptyState icon={DollarSign} title="No pricing rules" description="Create dynamic pricing rules to adjust prices automatically" actionLabel="Create Rule" onAction={() => setShowCreate(true)} />
        ) : (
          <Table>
            <Thead><tr><Th>Name</Th><Th>Type</Th><Th>Modifier</Th><Th>Value</Th><Th>Priority</Th><Th>Status</Th><Th>Actions</Th></tr></Thead>
            <Tbody>
              {rules.map((r) => (
                <Tr key={r.id}>
                  <Td className="font-medium">{r.name}</Td>
                  <Td><span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{r.rule_type.replace(/_/g, " ")}</span></Td>
                  <Td className="capitalize">{r.modifier_type}</Td>
                  <Td className="font-medium">{r.modifier_type === "percentage" ? `${r.modifier_value}%` : formatCurrency(r.modifier_value)}</Td>
                  <Td>{r.priority}</Td>
                  <Td><Badge status={r.is_active ? "active" : "retired"} /></Td>
                  <Td>
                    {r.is_active && (
                      <button onClick={() => setDeactivating(r.id)} className="p-1 text-gray-400 hover:text-red-500">
                        <XCircle className="h-4 w-4" />
                      </button>
                    )}
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        )}
      </Card>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Pricing Rule" size="sm">
        <div className="space-y-4">
          <Input label="Rule Name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Peak hour surge" />
          <Select label="Rule Type" value={ruleType} onChange={(e) => setRuleType(e.target.value)}
            options={[
              { value: "surge", label: "Surge" }, { value: "discount", label: "Discount" },
              { value: "time_based", label: "Time Based" }, { value: "demand_based", label: "Demand Based" },
            ]} />
          <div className="grid grid-cols-2 gap-4">
            <Select label="Modifier Type" value={modifierType} onChange={(e) => setModifierType(e.target.value)}
              options={[{ value: "percentage", label: "Percentage" }, { value: "fixed", label: "Fixed Amount" }]} />
            <Input label="Value" type="number" value={modifierValue} onChange={(e) => setModifierValue(e.target.value)} />
          </div>
          <Input label="Priority" type="number" value={priority} onChange={(e) => setPriority(e.target.value)} />
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowCreate(false)}>Cancel</Button>
            <Button onClick={handleCreate} loading={createMutation.isPending} disabled={!name || !modifierValue}>Create</Button>
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!deactivating}
        onClose={() => setDeactivating(null)}
        onConfirm={() => {
          if (deactivating) deactivateMutation.mutate(deactivating, {
            onSuccess: () => { setDeactivating(null); toast("success", "Rule deactivated"); },
            onError: () => toast("error", "Failed to deactivate"),
          });
        }}
        title="Deactivate Pricing Rule"
        message="This rule will no longer affect pricing. Are you sure?"
        confirmLabel="Deactivate"
        loading={deactivateMutation.isPending}
      />
    </>
  );
}
