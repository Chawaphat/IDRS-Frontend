import { useCallback, useEffect, useMemo, useRef, useState, type ComponentType } from "react";
import { AlertTriangle, Eye, EyeOff, FileImage, ScanLine, Sparkles, X, Images } from "lucide-react";
import { imageManagementService, onChartImagesChanged } from "@/services/imageManagementService";
import {
  aiDetectionResultService,
  onChartAiAnalysesChanged,
} from "@/services/aiDetectionResultService";
import type { ImageManagement } from "@/services/patientService";
import { diseaseColor, type AIDetectResult } from "@/lib/aiDetection";

interface ImageReferencePanelProps {
  chartId?: string;
}

type FilterTab = "all" | "intraoral" | "panoramic_xray";

interface RenderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

/**
 * Read-only quick-reference gallery for the chart's clinical images, shown
 * below the tooth grid while charting. Not an upload/manage surface — that's
 * the Image Gallery tab; this is purely "glance at the real photo/X-ray
 * without leaving Dental Status." The panoramic X-ray can also overlay its
 * saved AI detection boxes, toggleable on/off.
 */
export function ImageReferencePanel({ chartId }: ImageReferencePanelProps) {
  const [loading, setLoading] = useState(true);
  // Distinguishes "chart genuinely has no images" from "the fetch failed" —
  // without this, a load error left `images` at [] with no visible sign
  // anything had gone wrong, identical to the empty state.
  const [loadFailed, setLoadFailed] = useState(false);
  const [images, setImages] = useState<ImageManagement[]>([]);
  const [analysesById, setAnalysesById] = useState<Map<string, AIDetectResult>>(new Map());
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>("all");
  const [showAIBoxes, setShowAIBoxes] = useState(true);

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
        const [imgs, analyses] = await Promise.all([
          imageManagementService.getByChart(chartId),
          aiDetectionResultService.getByChart(chartId).catch(() => []),
        ]);
        if (cancelled) return;
        setImages(imgs);
        setAnalysesById(new Map(analyses.map((a) => [a.image_id, a.detection_data])));
      } catch (err) {
        console.error("Failed to load image references:", err);
        if (!cancelled) setLoadFailed(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    // The Dental Status tab stays mounted (hidden, not unmounted) once visited, so a
    // plain chartId-keyed effect won't pick up uploads/deletes made from Image Gallery
    // afterwards. Re-fetch whenever this chart's images change anywhere in the app.
    const unsubscribeImages = onChartImagesChanged(chartId, load);
    const unsubscribeAnalyses = onChartAiAnalysesChanged(chartId, (analysis) => {
      setAnalysesById((previous) => new Map(previous).set(
        analysis.image_id,
        analysis.detection_data,
      ));
    });
    return () => {
      cancelled = true;
      unsubscribeImages();
      unsubscribeAnalyses();
    };
  }, [chartId]);

  // Close the zoom with Escape
  useEffect(() => {
    if (!zoomUrl) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomUrl(null);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [zoomUrl]);

  const intraoral = useMemo(() => images.filter((i) => i.image_type === "intraoral"), [images]);
  const panoramic = useMemo(() => images.find((i) => i.image_type === "panoramic_xray"), [images]);
  const panoramicResult = panoramic ? analysesById.get(panoramic.image_id) ?? null : null;

  const tabs: { id: FilterTab; label: string; count: number }[] = [
    { id: "all", label: "All", count: images.length },
    { id: "intraoral", label: "Intraoral", count: intraoral.length },
    { id: "panoramic_xray", label: "Panoramic X-Ray", count: panoramic ? 1 : 0 },
  ];

  const showIntraoral = tab === "all" || tab === "intraoral";
  const showPanoramic = tab === "all" || tab === "panoramic_xray";
  // When only one column is visible, let it use the full row instead of
  // leaving the other grid track empty.
  const onlyPanoramic = showPanoramic && !showIntraoral;
  const onlyIntraoral = showIntraoral && !showPanoramic;

  return (
    <div className="mt-auto flex-1 flex w-full flex-col gap-4 border-t border-slate-100 bg-slate-50/50 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Images className="h-4 w-4 text-slate-400" />
          <p className="text-[13px] font-bold uppercase tracking-wide text-slate-700">Image References</p>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm">
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                tab === t.id ? "bg-slate-800 text-white shadow-sm" : "text-slate-500 hover:bg-slate-100"
              }`}
            >
              {t.label}
              <span className={`text-[10px] ${tab === t.id ? "text-slate-300" : "text-slate-400"}`}>{t.count}</span>
            </button>
          ))}
        </div>
      </div>

      {!loading && loadFailed && (
        <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold rounded-xl px-3.5 py-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          Couldn't load this chart's images — try switching tabs and back to retry.
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <SkeletonBox className="aspect-square" />
          <SkeletonBox className="aspect-square" />
          <SkeletonBox className="col-span-2 aspect-[2/1] sm:col-span-2" />
        </div>
      ) : images.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <EmptyBox icon={FileImage} label="No images uploaded for this chart yet" className="h-full py-16" />
        </div>
      ) : (
        <div className="flex-1 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {/* Panoramic — large hero tile, spans 2 columns (or all 3 when it's the only column shown) */}
          {showPanoramic && (
            <div className={onlyPanoramic ? "sm:col-span-3" : "sm:col-span-2"}>
              <div className="mb-1.5 flex items-center justify-between">
                <p className="text-xs font-semibold text-slate-500">Panoramic X-Ray</p>
                <div className="flex items-center gap-3">
                  {panoramicResult && (
                    <>
                      <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600">
                        <Sparkles className="h-2.5 w-2.5" />
                        AI Analyzed
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowAIBoxes((v) => !v)}
                        className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-bold transition-colors ${
                          showAIBoxes
                            ? "border-slate-300 bg-slate-800 text-white hover:bg-slate-700"
                            : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        {showAIBoxes ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                        {showAIBoxes ? "Hide boxes" : "Show boxes"}
                      </button>
                    </>
                  )}
                </div>
              </div>
              {!panoramic ? (
                <EmptyBox icon={FileImage} label="No panoramic X-ray yet" className="aspect-[2/1]" />
              ) : (
                <PanoramicTile
                  imageUrl={panoramic.image_url!}
                  result={showAIBoxes ? panoramicResult : null}
                  onZoom={() => setZoomUrl(panoramic.image_url!)}
                />
              )}
            </div>
          )}

          {/* Intraoral — thumbnail grid */}
          {showIntraoral && (
            <div className={`flex flex-col ${onlyIntraoral ? "sm:col-span-3" : ""}`}>
              <div className="mb-1.5 flex items-center justify-between shrink-0">
                <p className="text-xs font-semibold text-slate-500">Intraoral</p>
                {intraoral.length > 0 && <span className="text-[10px] font-bold text-slate-400">{intraoral.length}</span>}
              </div>
              {intraoral.length === 0 ? (
                <EmptyBox icon={ScanLine} label="No intraoral photos yet" className="flex-1" />
              ) : (
                <div className={`grid gap-2 ${onlyIntraoral ? "grid-cols-4 sm:grid-cols-6" : "grid-cols-3"}`}>
                  {intraoral.map((img) => (
                    <button
                      key={img.image_id}
                      type="button"
                      onClick={() => img.image_url && setZoomUrl(img.image_url)}
                      disabled={!img.image_url}
                      className="group relative aspect-square overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg"
                    >
                      <img
                        src={img.image_url}
                        alt={img.description || "Intraoral photo"}
                        className="h-full w-full object-contain transition-transform group-hover:scale-[1.05]"
                        loading="lazy"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Zoom modal */}
      {zoomUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md sm:p-8"
          onClick={() => setZoomUrl(null)}
        >
          <button
            type="button"
            onClick={() => setZoomUrl(null)}
            className="absolute right-4 top-4 rounded-full p-2 text-white hover:bg-white/10"
          >
            <X className="h-6 w-6" />
          </button>
          <img
            src={zoomUrl}
            alt="Zoomed reference"
            className="max-h-full max-w-full rounded-lg object-contain shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}

/**
 * Panoramic hero tile. When an AI result is passed in, draws its color-coded
 * detection boxes over the X-ray — same object-fit:contain math as
 * AIDetectionViewer, replicated in miniature since this tile has no
 * click-to-select / findings list, just a glanceable, toggleable overlay.
 */
function PanoramicTile({
  imageUrl,
  result,
  onZoom,
}: {
  imageUrl: string;
  result: AIDetectResult | null;
  onZoom: () => void;
}) {
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [renderRect, setRenderRect] = useState<RenderRect | null>(null);
  const containerRef = useRef<HTMLButtonElement>(null);
  const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

  const updateRenderRect = useCallback(() => {
    if (!containerRef.current || !naturalSizeRef.current) return;
    const { width: cw, height: ch } = containerRef.current.getBoundingClientRect();
    const { w: nw, h: nh } = naturalSizeRef.current;
    if (cw === 0 || ch === 0 || nw === 0 || nh === 0) return;
    const scale = Math.min(cw / nw, ch / nh);
    const renderedW = nw * scale;
    const renderedH = nh * scale;
    setRenderRect({
      left: (cw - renderedW) / 2,
      top: (ch - renderedH) / 2,
      width: renderedW,
      height: renderedH,
    });
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const ro = new ResizeObserver(() => updateRenderRect());
    ro.observe(containerRef.current);
    window.addEventListener("resize", updateRenderRect);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateRenderRect);
    };
  }, [updateRenderRect]);

  return (
    <button
      type="button"
      onClick={onZoom}
      ref={containerRef}
      className="relative aspect-[2/1] w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <img
        src={imageUrl}
        alt="Panoramic X-ray"
        crossOrigin="anonymous"
        className="h-full w-full object-contain"
        loading="lazy"
        onLoad={(e) => {
          const el = e.currentTarget;
          const ns = { w: el.naturalWidth, h: el.naturalHeight };
          naturalSizeRef.current = ns;
          setNaturalSize(ns);
          updateRenderRect();
        }}
      />
      {result && renderRect && naturalSize && (
        <div className="absolute inset-0">
          {result.detections.map((d, i) => {
            const [x1, y1, x2, y2] = d.bbox;
            const scaleX = renderRect.width / naturalSize.w;
            const scaleY = renderRect.height / naturalSize.h;
            const color = diseaseColor(d.disease);
            return (
              <div
                key={i}
                className="absolute rounded-sm"
                style={{
                  left: `${renderRect.left + x1 * scaleX}px`,
                  top: `${renderRect.top + y1 * scaleY}px`,
                  width: `${(x2 - x1) * scaleX}px`,
                  height: `${(y2 - y1) * scaleY}px`,
                  border: `1.5px solid ${color}`,
                  boxShadow: "0 0 0 1px rgba(0,0,0,0.15)",
                }}
              >
                <span
                  className="absolute -top-1.5 -left-1.5 flex h-3.5 min-w-[14px] items-center justify-center rounded-full border border-white px-0.5 text-[8px] font-extrabold leading-none text-white"
                  style={{ backgroundColor: color }}
                >
                  {d.tooth_fdi ?? "?"}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </button>
  );
}

function EmptyBox({
  icon: Icon,
  label,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  className?: string;
}) {
  return (
    <div className={`flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-100 px-2 py-6 text-center text-slate-400 ${className}`}>
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </div>
  );
}

function SkeletonBox({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-slate-200 ${className}`} />;
}
