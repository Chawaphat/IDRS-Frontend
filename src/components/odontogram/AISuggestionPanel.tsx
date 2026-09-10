import { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileImage, Loader2, Sparkles, UploadCloud, X, ZoomIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { aiDetectionResultService } from "@/services/aiDetectionResultService";
import { imageManagementService, onChartImagesChanged } from "@/services/imageManagementService";
import type { ImageManagement } from "@/services/patientService";
import { diseaseColor, cropToothImage, type AIDetectResult, type AITooth } from "@/lib/aiDetection";

interface AISuggestionPanelProps {
  chartId?: string;
  toothNo: number;
  /** Lets the empty state jump straight to the Image Gallery tab to upload a panoramic X-ray. */
  onGoToImageGallery?: () => void;
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
export function AISuggestionPanel({ chartId, toothNo, onGoToImageGallery }: AISuggestionPanelProps) {
  const [loading, setLoading] = useState(true);
  // A load failure used to be swallowed (console.error only), leaving the panel
  // showing the "no X-ray uploaded" empty state — misleading, since the X-ray
  // may well exist and only the fetch failed. Surface it instead.
  const [loadFailed, setLoadFailed] = useState(false);
  const [analysis, setAnalysis] = useState<AIDetectResult | null>(null);
  const [xrayImage, setXrayImage] = useState<ImageManagement | null>(null);
  const [xrayLoaded, setXrayLoaded] = useState(false);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  // Distinguishes "still generating" from "generation failed" — cropToothImage
  // fails silently (returns ""), so without this both looked like an eternal
  // loading spinner with no way to tell the two apart.
  const [cropFailed, setCropFailed] = useState(false);
  const [zoomed, setZoomed] = useState(false);
  const [detecting, setDetecting] = useState(false);
  // Surfaces a detect-request failure inline — runDetection previously only
  // console.error'd, leaving the button clickable again with no sign anything
  // had gone wrong, indistinguishable from "never clicked".
  const [detectError, setDetectError] = useState(false);

  const xrayImgRef = useRef<HTMLImageElement>(null);
  const cropCache = useRef<Map<number, string>>(new Map());
  const xrayUrl = xrayImage?.image_url ?? null;

  // Fetch once per chart — the AI analysis + the panoramic X-ray it ran on.
  useEffect(() => {
    if (!chartId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setLoadFailed(false);
      try {
        const [analyses, images] = await Promise.all([
          aiDetectionResultService.getByChart(chartId),
          imageManagementService.getByChart(chartId),
        ]);
        if (cancelled) return;
        // A chart holds one panoramic X-ray, so at most one analysis matters — take the latest.
        const latest = analyses[analyses.length - 1] ?? null;
        setAnalysis(latest?.detection_data ?? null);
        setXrayImage(images.find((img) => img.image_type === "panoramic_xray") ?? null);
      } catch (err) {
        console.error("Failed to load AI suggestion data:", err);
        if (!cancelled) {
          setAnalysis(null);
          setLoadFailed(true);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // Dental Status stays mounted (hidden, not unmounted) once visited, so a
    // plain chartId-keyed effect won't notice an X-ray uploaded afterwards
    // from the Image Gallery tab. Re-fetch whenever this chart's images change.
    const unsubscribe = onChartImagesChanged(chartId, load);
    return () => {
      cancelled = true;
      unsubscribe();
    };
  }, [chartId]);

  // Inline "Run AI Detection" — same call the Image Gallery's Detect button
  // makes, just reachable without leaving the charting screen.
  const runDetection = async () => {
    if (!chartId || !xrayImage) return;
    setDetecting(true);
    setDetectError(false);
    try {
      const result = await aiDetectionResultService.detect(chartId, xrayImage.image_id);
      setAnalysis(result.detection_data);
    } catch (err) {
      console.error("Failed to run AI detection:", err);
      setDetectError(true);
    } finally {
      setDetecting(false);
    }
  };

  const tooth: AITooth | undefined = analysis?.teeth.find((t) => t.tooth_fdi === toothNo);
  const diseases = tooth?.diseases ?? [];

  // Crop the active tooth out of the full X-ray once both are ready.
  useEffect(() => {
    setZoomed(false); // switching teeth should close any open zoom
    setCropFailed(false);
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
    if (!url) {
      setCropUrl(null);
      setCropFailed(true);
      return;
    }
    cropCache.current.set(tooth.tooth_fdi, url);
    setCropUrl(url);
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

  if (!chartId) return null; // no chart context at all — nothing to ever show here

  // Loading: render the same shell (header + card) with skeleton placeholders
  // instead of nothing, so the panel doesn't flash empty while data fetches.
  if (loading) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Suggestion</p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5">
          <div className="w-full aspect-[4/3] rounded-xl bg-slate-100 animate-pulse mb-3 flex items-center justify-center">
            <Loader2 className="w-5 h-5 text-slate-300 animate-spin" />
          </div>
          <div className="h-4 w-2/3 rounded bg-slate-100 animate-pulse" />
        </div>
      </div>
    );
  }

  // The fetch failed — say so, rather than falling through to the "no X-ray
  // uploaded" empty state, which would be misleading.
  if (loadFailed) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Suggestion</p>
        </div>
        <div className="min-h-[320px] rounded-2xl border border-amber-200 bg-amber-50 p-10 flex flex-col items-center justify-center text-center gap-3">
          <AlertTriangle className="w-8 h-8 text-amber-500" />
          <p className="text-base font-bold text-amber-800">Couldn't load the AI suggestion</p>
          <p className="text-sm leading-relaxed text-amber-700 max-w-xs">
            Charting still works — switch away from Dental Status and back to retry.
          </p>
        </div>
      </div>
    );
  }

  // No panoramic X-ray uploaded at all — nudge toward the Image Gallery instead of just hiding.
  if (!xrayImage) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Suggestion</p>
        </div>
        <div className="min-h-[320px] rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-white border border-slate-200 flex items-center justify-center">
            <FileImage className="w-8 h-8 text-slate-300" />
          </div>
          <p className="text-lg font-bold text-slate-700">No panoramic X-ray uploaded yet</p>
          <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
            Upload one in the Image Gallery to get AI-powered suggestions while charting.
          </p>
          {onGoToImageGallery && (
            <Button
              type="button"
              onClick={onGoToImageGallery}
              className="mt-2 bg-teal-500 hover:bg-teal-600 text-white h-11 px-6 text-sm"
            >
              <UploadCloud className="w-4 h-4 mr-2" />
              Go to Image Gallery
            </Button>
          )}
        </div>
      </div>
    );
  }

  // X-ray exists but hasn't been analyzed yet — offer to run it right here.
  if (!analysis) {
    return (
      <div className="mt-4">
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-3.5 h-3.5 text-teal-600" />
          <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400">AI Suggestion</p>
        </div>
        <div className="min-h-[320px] rounded-2xl border border-slate-200 bg-white p-10 flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-teal-50 flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-teal-600" />
          </div>
          <p className="text-lg font-bold text-slate-700">This X-ray hasn't been analyzed yet</p>
          <p className="text-sm leading-relaxed text-slate-400 max-w-xs">
            Run AI detection to get per-tooth suggestions while charting.
          </p>
          <Button
            type="button"
            onClick={runDetection}
            disabled={detecting}
            className="mt-2 bg-teal-500 hover:bg-teal-600 text-white h-11 px-6 text-sm"
          >
            {detecting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Detecting...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Run AI Detection
              </>
            )}
          </Button>
          {detectError && (
            <div className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
              AI detection failed. Please try again.
            </div>
          )}
        </div>
      </div>
    );
  }

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
            ) : cropFailed ? (
              <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-semibold text-slate-400">Couldn't generate this crop</span>
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Loader2 className="w-5 h-5 text-slate-400 animate-spin" />
              </div>
            )}
          </button>

          {diseases.length === 0 ? (
            <div className="flex items-center gap-2 rounded-xl bg-green-50 px-3 py-2.5">
              <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              <span className="text-xs font-bold text-green-700">No issues detected on this tooth</span>
            </div>
          ) : (
            <div className="space-y-1.5">
              {diseases.map((d, i) => {
                const color = diseaseColor(d.disease);
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                    style={{ backgroundColor: `${color}14` }}
                  >
                    <span className="flex items-center gap-2 text-sm font-extrabold" style={{ color }}>
                      <i className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                      {d.disease}
                    </span>
                    <span className="text-base font-extrabold flex-shrink-0" style={{ color }}>
                      {(d.confidence * 100).toFixed(0)}%
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-[10px] leading-relaxed text-slate-400 mt-2.5">
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
