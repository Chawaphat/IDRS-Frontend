import { useCallback, useEffect, useRef, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, RefreshCw, Save } from "lucide-react";
import OdontogramUI from "@/components/odontogram/OdontogramUI";
import {
  getOdontogramStatusSnapshot,
  loadOdontogramStatusSnapshot,
  subscribeOdontogram,
  type OdontogramStatusSnapshot,
} from "@/components/odontogram/odontogram";
import { Button } from "@/components/ui/button";
import { dentalStatusService } from "@/services/dentalStatusService";
import { useToastStore } from "@/store/toastStore";
import { useAuthStore } from "@/store/authStore";
import {
  dentalStatusToOdontogramSnapshot,
  odontogramSnapshotToDentalStatus,
} from "./dentalStatusMapper";
import { useSectionSave } from "@/hooks/useSectionSave";
import { API_BASE_URL } from "@/lib/apiBaseUrl";

interface DentalStatusFormProps {
  chartId: string;
}

export default function DentalStatusForm({ chartId }: DentalStatusFormProps) {
  const { show: showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusId, setStatusId] = useState<string | null>(null);
  const [saveError, setSaveError] = useState(false);

  const { markDirty, markClean, registerSave } = useSectionSave("dentalStatus");

  const hydratingRef = useRef(false);
  const lastSavedPayloadRef = useRef("");
  const saveErrorShownRef = useRef(false);

  const currentSnapshotRef = useRef<OdontogramStatusSnapshot | null>(null);
  const chartIdRef = useRef(chartId);
  const initialDataLoadedRef = useRef(false);
  const loadingRef = useRef(loading);

  useEffect(() => { chartIdRef.current = chartId; }, [chartId]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);

  // keepalive flush on tab/browser close only — NOT on section switch/unmount,
  // because section-switch saves go through the UnsavedChangesDialog (explicit user action).
  useEffect(() => {
    const flushSave = () => {
      if (!initialDataLoadedRef.current || loadingRef.current || hydratingRef.current) return;
      const snap = currentSnapshotRef.current;
      if (!snap) return;

      const payload = odontogramSnapshotToDentalStatus(snap);
      const serializedPayload = JSON.stringify(payload);
      if (serializedPayload === lastSavedPayloadRef.current) return;

      const token = useAuthStore.getState().session?.access_token;
      if (!token) return;

      const url = `${API_BASE_URL}/dental-charts/${chartIdRef.current}/dental-status`;
      fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: serializedPayload,
        keepalive: true,
      }).catch(err => console.error("Flush save failed:", err));

      lastSavedPayloadRef.current = serializedPayload;
    };

    window.addEventListener("beforeunload", flushSave);
    return () => {
      window.removeEventListener("beforeunload", flushSave);
    };
  }, []);

  // Track odontogram changes → mark dirty
  useEffect(() => {
    return subscribeOdontogram(() => {
      if (hydratingRef.current) return;
      const snap = getOdontogramStatusSnapshot();
      currentSnapshotRef.current = snap;
      markDirty();
    });
  }, [markDirty]);

  // Load dental status on mount / chartId change
  useEffect(() => {
    let cancelled = false;

    const loadDentalStatus = async () => {
      try {
        setLoading(true);
        initialDataLoadedRef.current = false;
        const data = await dentalStatusService.getByChart(chartId);
        if (cancelled) return;

        setStatusId(data?.status_id ?? null);
        const odontogramSnapshot = dentalStatusToOdontogramSnapshot(data);

        hydratingRef.current = true;
        loadOdontogramStatusSnapshot(odontogramSnapshot);

        const currentSnapshot = getOdontogramStatusSnapshot();
        currentSnapshotRef.current = currentSnapshot;
        lastSavedPayloadRef.current = JSON.stringify(odontogramSnapshotToDentalStatus(currentSnapshot));
        saveErrorShownRef.current = false;
        initialDataLoadedRef.current = true;

        registerSave(async () => {
          const snap = currentSnapshotRef.current;
          if (!snap) return;
          const payload = odontogramSnapshotToDentalStatus(snap);
          const serializedPayload = JSON.stringify(payload);
          if (serializedPayload === lastSavedPayloadRef.current) return;
          setSaving(true);
          try {
            const saved = await dentalStatusService.update(chartId, payload);
            setStatusId(saved.status_id);
            lastSavedPayloadRef.current = serializedPayload;
            saveErrorShownRef.current = false;
            setSaveError(false);
          } catch (err) {
            setSaveError(true);
            if (!saveErrorShownRef.current) {
              showToast("Failed to save dental status.", "error");
              saveErrorShownRef.current = true;
            }
            throw err;
          } finally {
            setSaving(false);
          }
        });
        markClean();
      } catch (err) {
        console.error("Failed to load dental status:", err);
        if (!cancelled) {
          showToast("Failed to load dental status.", "error");
          initialDataLoadedRef.current = false;
        }
      } finally {
        if (!cancelled) setLoading(false);
        window.setTimeout(() => { hydratingRef.current = false; }, 0);
      }
    };

    loadDentalStatus();
    return () => { cancelled = true; };
  }, [chartId, showToast, registerSave, markClean]);

  const retrySave = () => {
    saveErrorShownRef.current = false;
    lastSavedPayloadRef.current = "";
  };

  return (
    <div className="h-full min-h-[720px] w-full animate-in fade-in duration-300">
      {saveError && (
        <div className="mb-3 flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>Save failed — check your connection</span>
          <button
            onClick={retrySave}
            className="ml-auto flex items-center gap-1 rounded-lg border border-red-300 bg-white px-2 py-0.5 font-semibold hover:bg-red-50"
          >
            <RefreshCw className="h-3 w-3" /> Retry
          </button>
        </div>
      )}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          {saving ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-teal-600" />
              Saving dental status
            </>
          ) : statusId ? (
            <>
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              Dental status saved
            </>
          ) : (
            <>
              <Save className="h-4 w-4 text-slate-400" />
              Ready to chart
            </>
          )}
        </div>
      </div>

      <div className="relative h-[calc(100%-3.5rem)] min-h-[660px] w-full overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <OdontogramUI />
        {loading && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-slate-50/75 backdrop-blur-sm">
            <div className="flex flex-col items-center rounded-2xl border border-teal-100 bg-white p-6 shadow-xl">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-teal-100 border-t-teal-500" />
              <p className="text-sm font-bold text-slate-800">Loading Dental Status</p>
              <p className="mt-1 text-xs font-medium text-slate-500">Retrieving chart data...</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
