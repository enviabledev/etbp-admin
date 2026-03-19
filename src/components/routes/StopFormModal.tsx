"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Button from "@/components/ui/Button";
import { useCreateRouteStop, useUpdateRouteStop } from "@/hooks/queries/useRouteStops";
import { useToast } from "@/components/ui/Toast";

interface StopData {
  id?: string;
  name?: string;
  city?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  stop_order?: number;
  duration_from_origin_minutes?: number | null;
  stop_duration_minutes?: number;
  is_rest_stop?: boolean;
  is_pickup_point?: boolean;
  is_dropoff_point?: boolean;
  notes?: string | null;
}

interface StopFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  routeId: string;
  existingStop?: StopData | null;
  nextOrder?: number;
}

export default function StopFormModal({ isOpen, onClose, routeId, existingStop, nextOrder = 1 }: StopFormModalProps) {
  const { toast } = useToast();
  const createMutation = useCreateRouteStop();
  const updateMutation = useUpdateRouteStop();

  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [lat, setLat] = useState("");
  const [lng, setLng] = useState("");
  const [estMinutes, setEstMinutes] = useState("");
  const [duration, setDuration] = useState("0");
  const [isRest, setIsRest] = useState(true);
  const [isPickup, setIsPickup] = useState(false);
  const [isDropoff, setIsDropoff] = useState(false);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (existingStop) {
      setName(existingStop.name || "");
      setCity(existingStop.city || "");
      setLat(existingStop.latitude != null ? String(existingStop.latitude) : "");
      setLng(existingStop.longitude != null ? String(existingStop.longitude) : "");
      setEstMinutes(existingStop.duration_from_origin_minutes != null ? String(existingStop.duration_from_origin_minutes) : "");
      setDuration(String(existingStop.stop_duration_minutes || 0));
      setIsRest(existingStop.is_rest_stop ?? true);
      setIsPickup(existingStop.is_pickup_point ?? false);
      setIsDropoff(existingStop.is_dropoff_point ?? false);
      setNotes(existingStop.notes || "");
    } else {
      setName(""); setCity(""); setLat(""); setLng(""); setEstMinutes(""); setDuration("0"); setIsRest(true); setIsPickup(false); setIsDropoff(false); setNotes("");
    }
  }, [existingStop, isOpen]);

  const isEditing = !!existingStop?.id;
  const isPending = createMutation.isPending || updateMutation.isPending;

  const handleSave = () => {
    const payload = {
      name, city: city || undefined,
      latitude: parseFloat(lat), longitude: parseFloat(lng),
      stop_order: existingStop?.stop_order ?? nextOrder,
      duration_from_origin_minutes: parseInt(estMinutes) || 0,
      stop_duration_minutes: parseInt(duration) || 0,
      is_rest_stop: isRest, is_pickup_point: isPickup, is_dropoff_point: isDropoff,
      notes: notes || undefined,
    };

    if (isEditing && existingStop?.id) {
      updateMutation.mutate({ stopId: existingStop.id, ...payload }, {
        onSuccess: () => { onClose(); toast("success", "Stop updated"); },
        onError: () => toast("error", "Failed to update stop"),
      });
    } else {
      createMutation.mutate({ routeId, ...payload }, {
        onSuccess: () => { onClose(); toast("success", "Stop added"); },
        onError: () => toast("error", "Failed to add stop"),
      });
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Edit Stop" : "Add Stop"}>
      <div className="space-y-4">
        <Input label="Name *" value={name} onChange={e => setName(e.target.value)} placeholder="e.g., Ore Rest Stop" />
        <Input label="City" value={city} onChange={e => setCity(e.target.value)} placeholder="e.g., Ore" />
        <div className="grid grid-cols-2 gap-4">
          <Input label="Latitude *" type="number" step="0.000001" value={lat} onChange={e => setLat(e.target.value)} placeholder="6.6018" />
          <Input label="Longitude *" type="number" step="0.000001" value={lng} onChange={e => setLng(e.target.value)} placeholder="3.3515" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input label="Est. minutes from origin *" type="number" value={estMinutes} onChange={e => setEstMinutes(e.target.value)} placeholder="90" />
          <Input label="Stop duration (min)" type="number" value={duration} onChange={e => setDuration(e.target.value)} placeholder="15" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isRest} onChange={e => setIsRest(e.target.checked)} className="rounded" /> Rest Stop</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isPickup} onChange={e => setIsPickup(e.target.checked)} className="rounded" /> Pickup Point</label>
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={isDropoff} onChange={e => setIsDropoff(e.target.checked)} className="rounded" /> Dropoff Point</label>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="e.g., 15 min rest, fuel stop" className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm" />
        </div>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} loading={isPending} disabled={!name || !lat || !lng}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
