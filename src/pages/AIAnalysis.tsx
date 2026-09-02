import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  AlertTriangle,
  CircleDot,
  Cpu,
  Eye,
  Flame,
  ImagePlus,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  ScanLine,
  SlidersHorizontal,
  Sparkles,
  Target,
  X,
  ZoomIn,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/toastStore";
import { aiAnalysisService } from "@/services/aiAnalysisService";
import {
  UPPER_ARCH,
  LOWER_ARCH,
  ALL_DISEASE_NAMES,
  diseaseColor,
  diseaseDescription,
  cropToothImage,
  type AIDetectResult,
  type AITooth,
} from "@/lib/aiDetection";

const HOW_IT_WORKS = [
  {
    icon: ImagePlus,
    title: "Upload",
    desc: "Drag in a panoramic X-ray, or select one from your device. Supports JPG, PNG, and WebP, up to 15MB.",
  },
  {
    icon: Cpu,
    title: "AI Detects",
    desc: "Two models run together — YOLOv8x locates disease regions, while SEUNet segments and numbers all 32 teeth using FDI notation.",
  },
  {
    icon: Eye,
    title: "Review",
    desc: "Detected regions are highlighted directly on the X-ray. Tap any tooth in the chart for a full-size crop, confidence score, and plain-language explanation.",
  },
] as const;

const DISEASE_ICONS: Record<string, LucideIcon> = {
  Impacted: Lock,
  Caries: CircleDot,
  "Deep Caries": Flame,
  "Periapical Lesion": Target,
};

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 15 * 1024 * 1024; // 15MB — panoramic X-rays can be large

interface RenderRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export default function AIAnalysisPage() {
  const { show: showToast } = useToastStore();

  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AIDetectResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [conf, setConf] = useState(0.25);
  const [showConfPanel, setShowConfPanel] = useState(false);
  const [selectedFdi, setSelectedFdi] = useState<number | null>(null);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  const [renderRect, setRenderRect] = useState<RenderRect | null>(null);
  const [cropUrl, setCropUrl] = useState<string | null>(null);
  const [zoomedCropUrl, setZoomedCropUrl] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const currentFileRef = useRef<File | null>(null);
  const confDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cropCache = useRef<Map<number, string>>(new Map());
  const naturalSizeRef = useRef<{ w: number; h: number } | null>(null);

  const toothByFdi = useMemo(() => {
    const map = new Map<number, AITooth>();
    result?.teeth.forEach((t) => map.set(t.tooth_fdi, t));
    return map;
  }, [result]);

  const selectedTooth = selectedFdi != null ? toothByFdi.get(selectedFdi) ?? null : null;

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

  const runDetect = useCallback(
    async (file: File, confidence: number) => {
      setLoading(true);
      try {
        const res = await aiAnalysisService.detect(file, confidence);
        setResult(res);
        cropCache.current.clear();
        const firstDiseased = res.teeth.find((t) => t.diseases.length > 0);
        setSelectedFdi((firstDiseased ?? res.teeth[0])?.tooth_fdi ?? null);
        showToast(`Analysis complete — ${res.detections.length} finding(s) detected`, "success");
      } catch (err: any) {
        const detail = err?.response?.data?.detail || err?.message || "Failed to analyze image.";
        showToast(`Analysis failed: ${detail}`, "error");
      } finally {
        setLoading(false);
      }
    },
    [showToast]
  );

  const handleFile = useCallback(
    (file: File) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        showToast("Please upload a JPG, PNG, or WebP image.", "error");
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        showToast("File size exceeds 15MB limit.", "error");
        return;
      }
      currentFileRef.current = file;
      setFileName(file.name);
      setResult(null);
      setSelectedFdi(null);
      setNaturalSize(null);
      naturalSizeRef.current = null;
      setRenderRect(null);
      setShowConfPanel(false);
      setImageUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return URL.createObjectURL(file);
      });
      runDetect(file, conf);
    },
    [conf, runDetect, showToast]
  );

  const handleConfChange = (value: number) => {
    setConf(value);
    if (currentFileRef.current) {
      if (confDebounceRef.current) clearTimeout(confDebounceRef.current);
      confDebounceRef.current = setTimeout(() => runDetect(currentFileRef.current!, value), 400);
    }
  };

  const handleReset = () => {
    if (imageUrl) URL.revokeObjectURL(imageUrl);
    currentFileRef.current = null;
    setFileName(null);
    setImageUrl(null);
    setResult(null);
    setSelectedFdi(null);
    setNaturalSize(null);
    naturalSizeRef.current = null;
    setRenderRect(null);
    setShowConfPanel(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };
  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    e.target.value = "";
  };

  const uniqueDiseases = useMemo(() => {
    if (!result) return [];
    return Array.from(new Set(result.detections.map((d) => d.disease)));
  }, [result]);

  const hasResult = !!result && !!imageUrl;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 w-full flex flex-col gap-6">
      {/* Header — carries the compact upload toolbar once a result exists */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">AI Analysis</h2>
            <p className="text-slate-500 mt-1">
              Detect dental conditions on a panoramic X-ray. Standalone — not saved to any patient record.
            </p>
          </div>
        </div>

        {hasResult && (
          <div className="flex items-center gap-1.5 bg-white rounded-2xl border border-slate-200 shadow-sm pl-2 pr-2.5 py-2">
            <div className="w-9 h-9 rounded-lg overflow-hidden bg-slate-900 flex-shrink-0">
              <img src={imageUrl} alt="" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0 mx-2">
              <p className="text-xs font-bold text-slate-700 truncate max-w-[150px]">{fileName}</p>
              <p className="text-[11px] text-slate-400 font-semibold">{result.detections.length} finding(s)</p>
            </div>

            <div className="relative">
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                title="Confidence threshold"
                onClick={() => setShowConfPanel((v) => !v)}
              >
                <SlidersHorizontal className="w-4 h-4" />
              </Button>
              {showConfPanel && (
                <div className="absolute right-0 top-10 z-20 w-64 bg-white rounded-2xl border border-slate-200 shadow-lg p-4">
                  <label className="text-xs font-bold text-slate-600 flex items-center justify-between mb-2">
                    Confidence threshold
                    <span className="bg-teal-50 text-teal-700 font-extrabold px-2 py-0.5 rounded-full text-xs">{conf.toFixed(2)}</span>
                  </label>
                  <input
                    type="range"
                    min={0.05}
                    max={0.9}
                    step={0.05}
                    value={conf}
                    onChange={(e) => handleConfChange(Number(e.target.value))}
                    className="w-full accent-teal-500"
                  />
                </div>
              )}
            </div>

            <Button type="button" variant="ghost" size="icon-sm" title="Change X-ray" onClick={() => fileInputRef.current?.click()}>
              <ImagePlus className="w-4 h-4" />
            </Button>
            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileSelect} />

            <Button type="button" variant="ghost" size="icon-sm" title="Start over" onClick={handleReset} className="text-slate-400">
              <RotateCcw className="w-4 h-4" />
            </Button>

            {loading && <Loader2 className="w-4 h-4 text-teal-500 animate-spin ml-1" />}
          </div>
        )}
      </div>

      {/* Pre-analysis: upload card + two detailed info cards */}
      {!hasResult && (
        <>
          {/* Upload */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => !loading && fileInputRef.current?.click()}
              className={cn(
                "relative rounded-2xl border-2 border-dashed p-10 text-center transition-all duration-200 cursor-pointer",
                dragOver ? "border-teal-400 bg-teal-50/50 scale-[1.005]" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50",
                loading && "pointer-events-none opacity-70"
              )}
            >
              <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileSelect} />

              {loading ? (
                <div className="flex flex-col items-center gap-3 py-4">
                  <Loader2 className="w-10 h-10 text-teal-500 animate-spin" />
                  <p className="text-sm font-bold text-slate-700">Analyzing X-ray...</p>
                  <p className="text-xs text-slate-400">Running YOLOv8x + SEUNet — this may take a moment</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-3">
                  <div className="h-14 w-14 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-400">
                    <ImagePlus className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Drag & drop a panoramic X-ray, or{" "}
                      <span className="text-teal-600 underline underline-offset-2">browse files</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">JPG, PNG, WebP · Max 15MB · Panoramic X-ray only</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* How it works — one hero card, connected stepper */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-teal-50/50 shadow-sm p-6 sm:p-8">
            <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-teal-100/40 blur-3xl pointer-events-none" />

            <div className="relative flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Process</span>
            </div>
            <h3 className="relative text-lg font-bold text-slate-800">How It Works</h3>
            <p className="relative text-xs text-slate-400 font-medium mt-1 mb-8">Three steps from X-ray to findings</p>

            <div className="relative grid grid-cols-1 sm:grid-cols-3 gap-8 sm:gap-6">
              {/* Connecting line — desktop only, sits behind the icon circles */}
              <div className="hidden sm:block absolute top-7 left-[16.6%] right-[16.6%] h-0.5 bg-gradient-to-r from-teal-200 via-teal-400 to-teal-200" />

              {HOW_IT_WORKS.map(({ icon: Icon, title, desc }, i) => (
                <div key={title} className="relative flex flex-col items-center sm:items-start text-center sm:text-left gap-3">
                  <div className="relative z-10 w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/25 ring-4 ring-white">
                    <Icon className="w-6 h-6 text-white" strokeWidth={2.25} />
                  </div>
                  <div>
                    <span className="text-[10px] font-black tracking-wider text-teal-500">STEP {i + 1}</span>
                    <p className="text-base font-bold text-slate-800 mt-0.5">{title}</p>
                    <p className="text-sm text-slate-500 leading-relaxed mt-1.5">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* What we detect — hero card, gradient-accented disease grid */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white via-white to-slate-50 shadow-sm p-6 sm:p-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-black tracking-widest text-teal-600 uppercase">Detection Model</span>
            </div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-800">What We Detect</h3>
              <span className="flex items-center gap-1 bg-teal-50 text-teal-700 text-[10px] font-extrabold px-2 py-0.5 rounded-full">
                <Sparkles className="w-2.5 h-2.5" />
                YOLOv8x + SEUNet
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-1 mb-6">Four disease classes, trained on the DENTEX dataset</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ALL_DISEASE_NAMES.map((name) => {
                const color = diseaseColor(name);
                const Icon = DISEASE_ICONS[name] ?? CircleDot;
                return (
                  <div
                    key={name}
                    className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5"
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, ${color}, ${color}33)` }}
                    />
                    <div className="flex items-start gap-3">
                      <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-200 group-hover:scale-105"
                        style={{ backgroundColor: `${color}15` }}
                      >
                        <Icon className="w-5 h-5" style={{ color }} strokeWidth={2.25} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-sm font-extrabold" style={{ color }}>
                          {name}
                        </span>
                        <p className="text-xs text-slate-500 leading-relaxed mt-1">{diseaseDescription(name)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-start gap-2 mt-6 pt-5 border-t border-slate-100 text-slate-400">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <p className="text-[11px] leading-relaxed">
                For research and educational use — trained on a small public dataset. Always confirm findings clinically before recording
                them.
              </p>
            </div>
          </div>
        </>
      )}

      {/* Results */}
      {hasResult && (
        <>
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
                <div key={label} className="flex flex-col items-center gap-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
                  <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(8, 44px) 18px repeat(8, 44px)" }}>
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
                            "relative w-11 h-11 rounded-2xl border text-[13px] font-extrabold flex items-center justify-center transition-all duration-150",
                            !tooth && "opacity-30 cursor-not-allowed border-slate-200 text-slate-400 bg-slate-50",
                            tooth && !hasDisease && "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:bg-slate-50 hover:-translate-y-0.5 hover:shadow-sm",
                            tooth && hasDisease && "border-transparent hover:-translate-y-0.5 hover:shadow-md",
                            isActive && "ring-2 ring-offset-2 ring-teal-500 -translate-y-0.5 shadow-md scale-105"
                          )}
                        >
                          {fdi}
                          {hasDisease && (
                            <span
                              className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full border-2 border-white"
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
                  {cropUrl && (
                    <>
                      <img src={cropUrl} alt={`Tooth FDI ${selectedTooth.tooth_fdi}`} className="w-full h-full object-contain" />
                      <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 rounded-full p-2.5 shadow-lg">
                          <ZoomIn className="w-5 h-5 text-slate-700" />
                        </div>
                      </div>
                    </>
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
                      {selectedTooth.diseases.length > 0
                        ? selectedTooth.diseases.map((d) => d.disease).join(", ")
                        : "Healthy"}
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
        </>
      )}

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
