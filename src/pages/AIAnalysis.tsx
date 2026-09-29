import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Activity,
  CheckCircle2,
  CircleDot,
  Cpu,
  Eye,
  Flame,
  ImagePlus,
  Info,
  Loader2,
  Lock,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Target,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToastStore } from "@/store/toastStore";
import { aiAnalysisService } from "@/services/aiAnalysisService";
import { AIDetectionViewer } from "@/components/ai/AIDetectionViewer";
import { ALL_DISEASE_NAMES, diseaseColor, diseaseDescription, type AIDetectResult } from "@/lib/aiDetection";

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

export default function AIAnalysisPage() {
  const { show: showToast } = useToastStore();

  const [fileName, setFileName] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [result, setResult] = useState<AIDetectResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [conf, setConf] = useState(0.25);
  const [showConfPanel, setShowConfPanel] = useState(false);
  const [clinicianReviewed, setClinicianReviewed] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentFileRef = useRef<File | null>(null);
  const confDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runDetect = useCallback(
    async (file: File, confidence: number) => {
      setLoading(true);
      try {
        const res = await aiAnalysisService.detect(file, confidence);
        setResult(res);
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
      setClinicianReviewed(false);
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
    setClinicianReviewed(false);
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

  const hasResult = !!result && !!imageUrl;

  return (
    <div className="max-w-6xl mx-auto px-6 py-10 max-md:px-2 w-full flex flex-col gap-6">
      {/* Header — carries the compact upload toolbar once a result exists */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 flex items-center justify-center flex-shrink-0">
            <Activity className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <div className="clinical-eyebrow mb-1">Clinical decision support</div>
            <h2 className="clinical-page-title text-3xl font-bold text-slate-900">AI Analysis</h2>
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

      {hasResult && (
        <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-2xl border px-5 py-4 ${clinicianReviewed ? 'border-emerald-200 bg-emerald-50/60' : 'border-amber-200 bg-amber-50/70'}`}>
          <div className="flex items-start gap-3">
            {clinicianReviewed ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <Info className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />}
            <div><p className={`text-sm font-bold ${clinicianReviewed ? 'text-emerald-900' : 'text-amber-900'}`}>{clinicianReviewed ? 'Clinician review recorded for this session' : 'AI suggestions require clinical review'}</p><p className={`mt-0.5 text-xs ${clinicianReviewed ? 'text-emerald-800' : 'text-amber-800'}`}>AI results are not a diagnosis and are not saved to a patient record from this page.</p></div>
          </div>
          <Button type="button" variant="outline" onClick={() => setClinicianReviewed(value => !value)} className={clinicianReviewed ? 'border-emerald-300 bg-white text-emerald-800 hover:bg-emerald-50' : 'border-amber-300 bg-white text-amber-800 hover:bg-amber-50'}>
            <CheckCircle2 className="mr-2 h-4 w-4" />{clinicianReviewed ? 'Mark as not reviewed' : 'Mark as reviewed'}
          </Button>
        </div>
      )}

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
      {hasResult && <AIDetectionViewer imageUrl={imageUrl} result={result} />}
    </div>
  );
}
