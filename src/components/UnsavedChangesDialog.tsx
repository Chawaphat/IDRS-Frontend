import { AlertTriangle, Loader2 } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface Props {
  open: boolean;
  sectionName?: string;
  onSave: () => Promise<void>;
  onDiscard: () => void;
  onCancel: () => void;
}

export function UnsavedChangesDialog({ open, sectionName, onSave, onDiscard, onCancel }: Props) {
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave();
    } catch {
      // Error already handled by the form (shows a toast); keep the dialog open.
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-100">
            <AlertTriangle className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-bold text-slate-800">Unsaved Changes</p>
            {sectionName && (
              <p className="text-xs text-slate-500">{sectionName}</p>
            )}
          </div>
        </div>
        <p className="mb-5 text-sm text-slate-600">
          Do you want to save your changes before leaving this section?
        </p>
        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full bg-teal-600 hover:bg-teal-700 text-white rounded-xl"
          >
            {saving ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>
            ) : "Save"}
          </Button>
          <Button
            onClick={onDiscard}
            disabled={saving}
            variant="outline"
            className="w-full rounded-xl border-slate-200 text-slate-700 hover:bg-slate-50"
          >
            Discard Changes
          </Button>
          <Button
            onClick={onCancel}
            disabled={saving}
            variant="ghost"
            className="w-full rounded-xl text-slate-500 hover:bg-slate-50"
          >
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
