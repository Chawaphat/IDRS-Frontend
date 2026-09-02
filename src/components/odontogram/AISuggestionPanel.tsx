import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, Sparkles, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiDetectionResultService } from "@/services/aiDetectionResultService";
import { imageManagementService } from "@/services/imageManagementService";
import { diseaseColor, diseaseDescription, cropToothImage, type AIDetectResult, type AITooth } from "@/lib/aiDetection";

interface AISuggestionPanelProps {
  chartId?: string;
  toothNo: number;
}

/**
 * Read-only "AI Suggestion" panel shown below the tooth wizard in Dental
 * Status. Surfaces whatever the chart's panoramic X-ray AI analysis found
 * for the currently active tooth — it never writes to the odontogram state;
 * the dentist decides whether to act on it manually.
 *
 * Always shows a large crop of the segmented tooth (healthy or not) so the
 * dentist can visually check each tooth one by one against the X-ray, not
 * just the ones with a flagged disease.
 */
export function AISuggestionPanel({ chartId, toothNo }: AISuggestionPanelProps) {
  const [loading, setLoading] = useState(true);
  const [analysis, setAnalysis] = useState<AIDetectResult | null>(null);
  const [xrayUrl, setXrayUrl] = useState<string | null>(null);
  const [xrayLoaded, setXrayLoaded] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [zoomed, setZoomed] = useState(false);

  const xrayImgRef = useRef<HTMLImageElement>(null);
  const cropCache = useRef<Map<number, string>>(new Map());

  // Fetch once per chart — the AI analysis + the panoramic X-ray it ran on.
  useEffect(() => {
    if (!chartId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [analyses, images] = await Promise.all([
          aiDetectionResultService.getByChart(chartId),
          imageManagementService.getByChart(chartId),
        ]);
        if (cancelled) return;
        // A chart holds one panoramic X-ray, so at most one analysis matters — take the latest.
        const latest = analyses[analyses.length - 1] ?? null;
        setAnalysis(latest?.detection_data ?? null);
        const xray = images.find((img) => img.image_type === "panoramic_xray");
        setXrayUrl(xray?.image_url ?? null);
      } catch (err) {
        // Non-critical for the wizard — fail silently, just don't show a suggestion.
        console.error("Failed to load AI suggestion data:", err);
        if (!cancelled) setAnalysis(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [chartId]);

  const tooth: AITooth | undefined = analysis?.teeth.find((t) => t.tooth_fdi === toothNo);
  const diseases = tooth?.diseases ?? [];

  // Crop the active tooth out of the full X-ray once both are ready.
  useEffect(() => {
    setZoomed(false); // switching teeth should close any open zoom
    if (!tooth || !xrayLoaded || !xrayImgRef.current) {
      setCropUrl(null);
      return;
    }
    const cached = cropCache.current.get(tooth.tooth_fdi);
    if (cached) {
      setCropUrl(cached);
      return;
    }
    const url = cropToothImage(xrayImgRef.current, tooth.bbox);
    cropCache.current.set(tooth.tooth_fdi, url);
    setCropUrl(url || null);
  }, [tooth, xrayLoaded]);

  // Close the zoom with Escape
  useEffect(() => {
    if (!zoomed) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomed(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [zoomed]);

  if (!chartId || loading) return null; // don't add visual noise while nothing to show yet
  if (!analysis) return null; // no AI analysis has been run for this chart

  return (
    <div className="mt-4">
      {/* Hidden — loaded purely so we can crop from it via canvas.
          crossOrigin is required: this is a remote Supabase signed URL, and
          without it the canvas gets tainted and toDataURL() throws. */}
      {xrayUrl && (
        <img
          ref={xrayImgRef}
          src={xrayUrl}
          alt=""
          crossOrigin="anonymous"
          className="hidden"
          onLoad={() => setXrayLoaded(true)}
          onError={() => setXrayLoaded(false)}
        />
      )}

      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-3.5 h-3.5 text-teal-600" />
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Suggestion</p>
      </div>

      {!tooth ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3.5">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
            <span className="text-xs font-extrabold text-amber-700">Possibly missing</span>
          </div>
          <p className="text-[11px] leading-relaxed text-amber-700/80">
            The AI model did not detect this tooth in the panoramic X-ray. This may mean the tooth is missing — or the
            image angle made it hard to segment. Please verify before recording.
          </p>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          {/* Large, clear crop — always shown for a segmented tooth, healthy or not */}
          <button
            type="button"
            onClick={() => cropUrl && setZoomed(true)}
            disabled={!cropUrl}
            className="group relative block w-full aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 border border-slate-200 mb-3 cursor-zoom-in disabled:cursor-default"
          >
            {cropUrl ? (
              <>
                <img src={cropUrl} alt={`Tooth FDI ${toothNo}`} className="w-full h-full object-contain" />
                <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2 shadow-lg">
                    <ZoomIn className="w-4 h-4 text-slate-700" />
                  </div>
                </div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}
          </button>

          {diseases.length === 0 ? (
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs font-semibold text-slate-500">AI did not detect any issues on this tooth.</span>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {diseases.map((d, i) => {
                  const color = diseaseColor(d.disease);
                  return (
                    <div key={i} className="flex items-center justify-between gap-2">
                      <span className="text-xs font-extrabold flex items-center gap-1.5" style={{ color }}>
                        <i className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                        {d.disease}
                      </span>
                      <span className="text-[10px] font-bold text-slate-400 flex-shrink-0">
                        {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="text-[11px] leading-relaxed text-slate-500 mt-3 pt-3 border-t border-slate-100">
                {diseaseDescription(diseases[0].disease)}
              </p>
            </>
          )}

          <p className="text-[10px] leading-relaxed text-slate-400 mt-2">
            AI-detected finding — not applied automatically. Review and record manually if confirmed.
          </p>
        </div>
      )}

      {/* Zoomed crop preview */}
      {zoomed && cropUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md"
          onClick={() => setZoomed(false)}
        >
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 h-auto rounded-full"
            onClick={() => setZoomed(false)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={cropUrl}
            alt={`Tooth FDI ${toothNo} zoomed`}
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
