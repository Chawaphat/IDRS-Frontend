import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Loader2, ScanLine, X, ZoomIn } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  UPPER_ARCH,
  LOWER_ARCH,
  diseaseColor,
  diseaseDescription,
  cropToothImage,
  type AIDetectResult,
  type AITooth,
} from "@/lib/aiDetection";

interface RenderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface AIDetectionViewerProps {
  /** The panoramic X-ray this result was computed from — a blob: URL (standalone
   * AI Analysis) or a remote signed URL (chart Image Gallery) both work. */
  imageUrl: string;
  result: AIDetectResult;
}

/**
 * Renders a full AI detection result: the X-ray with color-coded boxes,
 * a findings list, and a tap-through tooth chart with per-tooth crop +
 * explanation. Shared between the standalone AI Analysis tab and the
 * chart-level Image Gallery so both stay visually and behaviorally in sync.
 */
export function AIDetectionViewer({ imageUrl, result }: AIDetectionViewerProps) {
  const [selectedFdi, setSelectedFdi] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [renderRect, setRenderRect] = useState<RenderRect | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  // Distinguishes "still generating" from "generation failed" — cropToothImage
  // fails silently (returns ""), so without this both looked like an eternal
  // loading spinner with no way to tell the two apart.
  const [cropFailed, setCropFailed] = useState(false);
  const [zoomedCropUrl, setZoomedCropUrl] = useState<string | null>(null);

  const imgRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const cropCache = useRef<Map<number, string>>(new Map());
  const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

  const toothByFdi = useMemo(() => {
    const map = new Map<number, AITooth>();
    result.teeth.forEach((t) => map.set(t.tooth_fdi, t));
    return map;
  }, [result]);

  const selectedTooth = selectedFdi != null ? toothByFdi.get(selectedFdi) ?? null : null;

  const uniqueDiseases = useMemo(() => Array.from(new Set(result.detections.map((d) => d.disease))), [result]);

  // Auto-select the first diseased tooth (or the first tooth) whenever a new result arrives.
  useEffect(() => {
    cropCache.current.clear();
    setNaturalSize(null);
    naturalSizeRef.current = null;
    setRenderRect(null);
    const firstDiseased = result.teeth.find((t) => t.diseases.length > 0);
    setSelectedFdi((firstDiseased ?? result.teeth[0])?.tooth_fdi ?? null);
  }, [result, imageUrl]);

  // getBoundingClientRect() on an object-contain <img> returns its full CSS box
  // (w-full h-full), NOT the letterboxed visual content rect — object-fit is a
  // paint-time effect invisible to layout measurement. So we replicate the
  // "contain" math ourselves from the (stable, fixed-height) container's box
  // plus the image's natural size, rather than measuring the <img> element.
  const updateRenderRect = useCallback(() => {
    if (!imageContainerRef.current || !naturalSizeRef.current) return;
    const { width: cw, height: ch } = imageContainerRef.current.getBoundingClientRect();
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
    if (!imageContainerRef.current) return;
    const ro = new ResizeObserver(() => updateRenderRect());
    ro.observe(imageContainerRef.current);
    window.addEventListener("resize", updateRenderRect);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", updateRenderRect);
    };
  }, [updateRenderRect]);

  // Crop the selected tooth client-side once the image + result are both ready.
  useEffect(() => {
    setCropFailed(false);
    if (!selectedTooth || !naturalSize || !imgRef.current) {
      setCropUrl(null);
      return;
    }
    const cached = cropCache.current.get(selectedTooth.tooth_fdi);
    if (cached) {
      setCropUrl(cached);
      return;
    }
    const url = cropToothImage(imgRef.current, selectedTooth.bbox);
    if (!url) {
      setCropUrl(null);
      setCropFailed(true);
      return;
    }
    cropCache.current.set(selectedTooth.tooth_fdi, url);
    setCropUrl(url);
  }, [selectedTooth, naturalSize]);

  // Close the zoomed crop preview with Escape
  useEffect(() => {
    if (!zoomedCropUrl) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setZoomedCropUrl(null);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [zoomedCropUrl]);

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Image + overlay — fixed height, never grows with Findings' content */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[420px] lg:h-[560px]">
          <div className="flex items-start justify-between gap-4 flex-wrap border-b border-slate-100 pb-4 mb-4">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ScanLine className="w-5 h-5 text-teal-600" />
              Detected Regions
            </h3>
            <div className="flex items-center gap-3 flex-wrap">
              {uniqueDiseases.length === 0 ? (
                <span className="text-xs font-semibold text-slate-400">No findings</span>
              ) : (
                uniqueDiseases.map((name) => (
                  <span key={name} className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
                    <i className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: diseaseColor(name) }} />
                    {name}
                  </span>
                ))
              )}
            </div>
          </div>

          <div ref={imageContainerRef} className="relative rounded-2xl overflow-hidden bg-slate-950 flex-1 min-h-0">
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Panoramic X-ray"
              crossOrigin="anonymous"
              className="w-full h-full object-contain"
              onLoad={(e) => {
                const el = e.currentTarget;
                const ns = { w: el.naturalWidth, h: el.naturalHeight };
                naturalSizeRef.current = ns;
                setNaturalSize(ns);
                updateRenderRect();
              }}
            />
            {renderRect && naturalSize && (
              <div className="absolute inset-0">
                {result.detections.map((d, i) => {
                  const [x1, y1, x2, y2] = d.bbox;
                  const scaleX = renderRect.width / naturalSize.w;
                  const scaleY = renderRect.height / naturalSize.h;
                  const left = renderRect.left + x1 * scaleX;
                  const top = renderRect.top + y1 * scaleY;
                  const width = (x2 - x1) * scaleX;
                  const height = (y2 - y1) * scaleY;
                  const color = diseaseColor(d.disease);
                  const isSelected = d.tooth_fdi != null && d.tooth_fdi === selectedFdi;
                  return (
                    <div
                      key={i}
                      className="absolute rounded transition-all cursor-pointer"
                      style={{
                        left: `${left}px`,
                        top: `${top}px`,
                        width: `${width}px`,
                        height: `${height}px`,
                        border: `2px solid ${color}`,
                        boxShadow: isSelected ? `0 0 0 3px ${color}66` : "0 0 0 1px rgba(0,0,0,0.15)",
                      }}
                      onMouseEnter={() => setHoveredIndex(i)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      onClick={() => d.tooth_fdi != null && setSelectedFdi(d.tooth_fdi)}
                    >
                      <span
                        className="absolute -top-2 -left-2 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full text-[10px] font-extrabold text-white border-2 border-white shadow-sm"
                        style={{ backgroundColor: color }}
                      >
                        {d.tooth_fdi ?? "?"}
                      </span>
                      {hoveredIndex === i && (
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 text-white text-[11px] font-bold px-2.5 py-1.5 shadow-lg z-10">
                          {d.disease} · {(d.confidence * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Findings list */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 flex flex-col h-[420px] lg:h-[560px]">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-4">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            <div>
              <h3 className="text-lg font-bold text-slate-800">Findings</h3>
              <p className="text-xs text-slate-400 font-medium">
                {result.detections.length} across {result.teeth.length} segmented teeth
              </p>
            </div>
          </div>

          {result.detections.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm font-semibold text-slate-400 text-center px-4">
              No abnormalities detected 🎉
            </div>
          ) : (
            <div className="flex flex-col gap-2.5 overflow-y-auto flex-1 min-h-0 -mr-2 pr-2">
              {[...result.detections]
                .sort((a, b) => b.confidence - a.confidence)
                .map((d, i) => {
                  const color = diseaseColor(d.disease);
                  const isSelected = d.tooth_fdi === selectedFdi;
                  return (
                    <button
                      key={i}
                      type="button"
                      onClick={() => d.tooth_fdi != null && setSelectedFdi(d.tooth_fdi)}
                      className={cn(
                        "text-left rounded-xl border border-slate-200 bg-slate-50 p-3 transition-all hover:bg-slate-100 hover:border-slate-300",
                        isSelected && "bg-teal-50/60 border-teal-300"
                      )}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm font-extrabold text-slate-700 flex items-center gap-2">
                          <i className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                          {d.disease}
                        </span>
                        <span className="text-[11px] font-bold text-slate-500 bg-white border border-slate-200 rounded-full px-2 py-0.5">
                          FDI {d.tooth_fdi ?? "?"}
                        </span>
                      </div>
                      <div className="h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${d.confidence * 100}%`, backgroundColor: color }} />
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500 mt-1 block">
                        Confidence {(d.confidence * 100).toFixed(0)}%
                      </span>
                    </button>
                  );
                })}
            </div>
          )}
        </div>
      </div>

      {/* Tooth chart + detail viewer */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
        <div className="border-b border-slate-100 pb-4 mb-6">
          <h3 className="text-lg font-bold text-slate-800">Tooth Chart</h3>
          <p className="text-xs text-slate-400 font-medium mt-1">Tap a tooth to view its full cropped image and condition</p>
        </div>

        <div className="flex flex-col items-center gap-6 mb-8">
          {[
            { label: "Upper Arch", row: UPPER_ARCH },
            { label: "Lower Arch", row: LOWER_ARCH },
          ].map(({ label, row }) => (
            <div key={label} className="flex flex-col items-center gap-2 w-full">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
              <div
                className="grid gap-1 sm:gap-2 w-full max-w-[640px] mx-auto"
                style={{ gridTemplateColumns: "repeat(8, minmax(0, 1fr)) 12px repeat(8, minmax(0, 1fr))" }}
              >
                {row.map((fdi, idx) => {
                  const tooth = toothByFdi.get(fdi);
                  const hasDisease = !!tooth && tooth.diseases.length > 0;
                  const color = hasDisease ? diseaseColor(tooth!.diseases[0].disease) : undefined;
                  const isActive = selectedFdi === fdi;
                  const gridColumn = idx < 8 ? idx + 1 : idx + 2; // skip the midline spacer column

                  const chipStyle: React.CSSProperties = { gridColumn };
                  if (hasDisease && color) {
                    chipStyle.backgroundColor = `${color}18`;
                    chipStyle.color = color;
                    chipStyle.boxShadow = `inset 0 0 0 1.5px ${color}55`;
                  }

                  return (
                    <button
                      key={fdi}
                      type="button"
                      disabled={!tooth}
                      onClick={() => setSelectedFdi(fdi)}
                      style={chipStyle}
                      className={cn(
                        "relative w-full aspect-square max-w-11 mx-auto rounded-xl sm:rounded-2xl border text-[10px] sm:text-[13px] font-extrabold flex items-center justify-center transition-all duration-150",
                        !tooth && "opacity-30 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50",
                        tooth && !hasDisease && "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm",
                        tooth && hasDisease && "border-transparent hover:-translate-y-0.5 hover:shadow-md",
                        isActive && "ring-2 ring-offset-2 ring-teal-500 -translate-y-0.5 shadow-md scale-105"
                      )}
                    >
                      {fdi}
                      {hasDisease && (
                        <span
                          className="absolute -top-1 -right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 border-white"
                          style={{ backgroundColor: color }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Detail viewer */}
        {selectedTooth ? (
          <div className="flex flex-wrap gap-6 items-start bg-slate-50 rounded-2xl border border-slate-200 p-5">
            <button
              type="button"
              onClick={() => cropUrl && setZoomedCropUrl(cropUrl)}
              disabled={!cropUrl}
              className="group relative flex-shrink-0 w-[280px] max-w-full aspect-[4/3] rounded-2xl overflow-hidden bg-slate-950 shadow-md cursor-zoom-in disabled:cursor-default"
            >
              {cropUrl ? (
                <>
                  <img src={cropUrl} alt={`Tooth FDI ${selectedTooth.tooth_fdi}`} className="w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-lg">
                      <ZoomIn className="w-5 h-5 text-slate-700" />
                    </div>
                  </div>
                </>
              ) : cropFailed ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 px-4 text-center">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <span className="text-[11px] font-semibold text-slate-400">Couldn't generate this crop</span>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                </div>
              )}
            </button>

            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-3 flex-wrap mb-3">
                <span className="text-2xl font-black text-slate-800">FDI {selectedTooth.tooth_fdi}</span>
                <span
                  className={cn(
                    "text-xs font-bold px-2.5 py-1 rounded-full",
                    selectedTooth.diseases.length > 0 ? "bg-rose-50 text-rose-600" : "bg-green-100 text-green-700"
                  )}
                >
                  {selectedTooth.diseases.length > 0 ? selectedTooth.diseases.map((d) => d.disease).join(", ") : "Healthy"}
                </span>
              </div>

              {selectedTooth.diseases.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {selectedTooth.diseases.map((d, i) => {
                    const color = diseaseColor(d.disease);
                    return (
                      <div key={i} className="rounded-xl border border-slate-200 p-4 bg-white">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-sm font-extrabold flex items-center gap-2">
                            <i className="w-2 h-2 rounded-full inline-block flex-shrink-0" style={{ backgroundColor: color }} />
                            <span style={{ color }}>{d.disease}</span>
                          </span>
                          <span className="text-[11px] font-bold text-slate-500">Confidence {(d.confidence * 100).toFixed(0)}%</span>
                        </div>
                        <p className="text-[13px] leading-relaxed text-slate-600 m-0">{diseaseDescription(d.disease)}</p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-[13px] leading-relaxed text-slate-500">No abnormality detected in this region by the model.</p>
              )}
            </div>
          </div>
        ) : (
          <p className="text-sm font-semibold text-slate-400 text-center py-10">Select a tooth above to view its cropped image.</p>
        )}
      </div>

      {/* Zoomed crop preview */}
      {zoomedCropUrl && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md"
          onClick={() => setZoomedCropUrl(null)}
        >
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 h-auto rounded-full"
            onClick={() => setZoomedCropUrl(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={zoomedCropUrl}
            alt="Zoomed tooth crop"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
