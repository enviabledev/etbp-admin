"use client";

import { useState } from "react";
import Header from "@/components/layout/Header";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Card, { CardHeader, CardBody } from "@/components/ui/Card";
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
import api from "@/lib/api";
import { Plus, DollarSign, XCircle } from "lucide-react";

export default function PricingRulesPage() {
  const [showCreate, setShowCreate] = useState(false);
  const [deactivating, setDeactivating] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [ruleType, setRuleType] = useState("surge");
  const [modifierType, setModifierType] = useState("percentage");
  const [modifierValue, setModifierValue] = useState("");
  const [priority, setPriority] = useState("0");
  const [selectedDays, setSelectedDays] = useState<number[]>([]);
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [minOccupancy, setMinOccupancy] = useState("");
  const [minDaysBefore, setMinDaysBefore] = useState("");
  const [maxDaysBefore, setMaxDaysBefore] = useState("");
  const [simDate, setSimDate] = useState("");
  const [simTime, setSimTime] = useState("08:00");
  const [simResult, setSimResult] = useState<Record<string, unknown> | null>(null);
  const [simulating, setSimulating] = useState(false);
  const { toast } = useToast();

  const { data: rules, isLoading } = usePricingRules();
  const createMutation = useCreatePricingRule();
  const deactivateMutation = useDeactivatePricingRule();

  const handleCreate = () => {
    const condition: Record<string, unknown> = {};
    if (selectedDays.length > 0) condition.days_of_week = selectedDays;
    if (timeFrom && timeTo) condition.time_ranges = [{ start: timeFrom, end: timeTo }];
    if (minOccupancy) condition.min_occupancy = parseFloat(minOccupancy) / 100;
    if (minDaysBefore) condition.min_days_before = parseInt(minDaysBefore);
    if (maxDaysBefore) condition.max_days_before = parseInt(maxDaysBefore);

    createMutation.mutate({
      name, rule_type: ruleType, modifier_type: modifierType,
      modifier_value: parseFloat(modifierValue), priority: parseInt(priority),
      condition: Object.keys(condition).length > 0 ? condition : undefined,
    }, {
      onSuccess: () => {
        setShowCreate(false); setName(""); setModifierValue("");
        setSelectedDays([]); setTimeFrom(""); setTimeTo("");
        setMinOccupancy(""); setMinDaysBefore(""); setMaxDaysBefore("");
        toast("success", "Pricing rule created");
      },
      onError: () => toast("error", "Failed to create rule"),
    });
  };

  const handleSimulate = async () => {
    setSimulating(true);
    try {
      const { data } = await api.post("/api/admin/settings/pricing-rules/simulate", null, {
        params: { departure_date: simDate || undefined, departure_time: simTime || undefined },
      });
      setSimResult(data);
    } catch { toast("error", "Simulation failed"); }
    finally { setSimulating(false); }
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

      {/* Simulator */}
      <Card className="mt-6">
        <CardHeader><h3 className="font-semibold">Pricing Simulator</h3></CardHeader>
        <CardBody>
          <div className="grid grid-cols-3 gap-4">
            <Input label="Departure Date" type="date" value={simDate} onChange={e => setSimDate(e.target.value)} />
            <Input label="Departure Time" type="time" value={simTime} onChange={e => setSimTime(e.target.value)} />
            <div className="flex items-end">
              <Button variant="secondary" onClick={handleSimulate} loading={simulating}>Simulate</Button>
            </div>
          </div>
          {simResult && (
            <div className="mt-4 bg-gray-50 rounded-lg p-4">
              <div className="flex justify-between mb-2">
                <span className="text-sm text-gray-500">Base price</span>
                <span className="text-sm">{formatCurrency(simResult.base_price as number)}</span>
              </div>
              {(simResult.adjustments as Array<Record<string, unknown>>)?.map((adj, i: number) => (
                <div key={i} className="flex justify-between mb-1">
                  <span className="text-xs text-gray-500">{adj.rule_name as string}</span>
                  <span className={`text-xs font-medium ${(adj.change as number) > 0 ? "text-red-600" : "text-green-600"}`}>{(adj.change as number) > 0 ? "+" : ""}{formatCurrency(adj.change as number)}</span>
                </div>
              ))}
              <div className="border-t border-gray-200 mt-2 pt-2 flex justify-between">
                <span className="font-medium">Final price</span>
                <span className="font-bold text-lg">{formatCurrency(simResult.final_price as number)}</span>
              </div>
            </div>
          )}
        </CardBody>
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

          {/* Conditions */}
          <div className="border-t border-gray-100 pt-4 mt-4">
            <p className="text-sm font-medium text-gray-700 mb-3">Conditions</p>

            {(ruleType === "time_based" || ruleType === "surge") && (
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 mb-1">Days of week</p>
                  <div className="flex gap-1">
                    {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d, i) => (
                      <button key={d} type="button"
                        className={`px-2 py-1 text-xs rounded border ${selectedDays.includes(i) ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-200 text-gray-500"}`}
                        onClick={() => setSelectedDays(prev => prev.includes(i) ? prev.filter(x => x !== i) : [...prev, i])}
                      >{d}</button>
                    ))}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Input label="Time from" type="time" value={timeFrom} onChange={e => setTimeFrom(e.target.value)} />
                  <Input label="Time to" type="time" value={timeTo} onChange={e => setTimeTo(e.target.value)} />
                </div>
              </div>
            )}

            {ruleType === "demand_based" && (
              <Input label="Min occupancy (%)" type="number" value={minOccupancy} onChange={e => setMinOccupancy(e.target.value)} placeholder="e.g. 80 for 80% full" />
            )}

            {ruleType === "discount" && (
              <div className="grid grid-cols-2 gap-3">
                <Input label="Min days before departure" type="number" value={minDaysBefore} onChange={e => setMinDaysBefore(e.target.value)} placeholder="e.g. 7" />
                <Input label="Max days before departure" type="number" value={maxDaysBefore} onChange={e => setMaxDaysBefore(e.target.value)} placeholder="e.g. 30" />
              </div>
            )}
          </div>

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
