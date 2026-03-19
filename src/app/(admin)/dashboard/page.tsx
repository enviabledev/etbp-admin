"use client";

import { useState, useCallback } from "react";
import { Responsive, WidthProvider } from "react-grid-layout";
import { Settings, Plus, Save, RotateCcw, X as XIcon } from "lucide-react";
import { useDashboardWidgets, useSaveLayout, useDeleteWidget, useResetDashboard } from "@/hooks/queries/useDashboardWidgets";
import { useToast } from "@/components/ui/Toast";
import Button from "@/components/ui/Button";
import WidgetWrapper from "@/components/dashboard/WidgetWrapper";
import AddWidgetModal from "@/components/dashboard/AddWidgetModal";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface LayoutItem {
  i: string;
  x: number;
  y: number;
  w: number;
  h: number;
}

export default function DashboardPage() {
  const [editMode, setEditMode] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [pendingLayout, setPendingLayout] = useState<LayoutItem[] | null>(null);
  const { toast } = useToast();

  const { data: widgets = [], isLoading } = useDashboardWidgets();
  const saveLayout = useSaveLayout();
  const deleteWidget = useDeleteWidget();
  const resetDashboard = useResetDashboard();

  const gridLayouts = {
    lg: (widgets || []).map(w => ({
      i: w.id,
      x: w.position?.x ?? 0,
      y: w.position?.y ?? 0,
      w: w.position?.w ?? 6,
      h: w.position?.h ?? 4,
      minW: 2,
      minH: 2,
    })),
  };

  const handleLayoutChange = useCallback((layout: LayoutItem[]) => {
    if (editMode) {
      setPendingLayout(layout);
    }
  }, [editMode]);

  const handleSave = () => {
    if (pendingLayout) {
      saveLayout.mutate({
        widgets: pendingLayout.map(l => ({ id: l.i, position: { x: l.x, y: l.y, w: l.w, h: l.h } })),
      }, {
        onSuccess: () => { toast("success", "Dashboard saved"); setEditMode(false); setPendingLayout(null); },
        onError: () => toast("error", "Save failed"),
      });
    } else {
      setEditMode(false);
    }
  };

  const handleReset = () => {
    if (confirm("Reset dashboard to defaults? All custom widgets will be removed.")) {
      resetDashboard.mutate(widgets.map(w => w.id), {
        onSuccess: () => { setEditMode(false); toast("success", "Dashboard reset"); },
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[5, 6].map(i => <div key={i} className="h-64 bg-gray-100 rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="flex gap-2">
          {editMode ? (
            <>
              <Button size="sm" onClick={() => setShowAdd(true)}><Plus className="h-4 w-4 mr-1" /> Add Widget</Button>
              <Button size="sm" onClick={handleSave} loading={saveLayout.isPending}><Save className="h-4 w-4 mr-1" /> Save</Button>
              <Button size="sm" variant="secondary" onClick={() => { setEditMode(false); setPendingLayout(null); }}><XIcon className="h-4 w-4 mr-1" /> Cancel</Button>
              <Button size="sm" variant="danger" onClick={handleReset} loading={resetDashboard.isPending}><RotateCcw className="h-4 w-4 mr-1" /> Reset</Button>
            </>
          ) : (
            <Button size="sm" variant="secondary" onClick={() => setEditMode(true)}><Settings className="h-4 w-4 mr-1" /> Customize</Button>
          )}
        </div>
      </div>

      {widgets.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border">
          <p className="text-gray-500 mb-4">Loading your dashboard widgets...</p>
        </div>
      ) : (
        <ResponsiveGridLayout
          layouts={gridLayouts}
          breakpoints={{ lg: 1200, md: 996, sm: 768 }}
          cols={{ lg: 12, md: 6, sm: 3 }}
          rowHeight={80}
          isDraggable={editMode}
          isResizable={editMode}
          onLayoutChange={handleLayoutChange}
          draggableHandle=".widget-drag-handle"
          containerPadding={[0, 0]}
          margin={[16, 16]}
        >
          {widgets.map(w => (
            <div key={w.id}>
              <WidgetWrapper widget={w} editMode={editMode} onRemove={() => deleteWidget.mutate(w.id)} />
            </div>
          ))}
        </ResponsiveGridLayout>
      )}

      <AddWidgetModal isOpen={showAdd} onClose={() => setShowAdd(false)} />
    </div>
  );
}
