import { useEffect, useState, type ComponentType } from "react";
import { FileImage, ScanLine, Sparkles, X } from "lucide-react";
import { imageManagementService } from "@/services/imageManagementService";
import { aiDetectionResultService } from "@/services/aiDetectionResultService";
import type { ImageManagement } from "@/services/patientService";

interface ImageReferencePanelProps {
  chartId?: string;
}

/**
 * Read-only quick-reference strip for the chart's clinical images, shown
 * below the tooth grid while charting. Not an upload/manage surface — that's
 * the Image Gallery tab; this is purely "glance at the real photo/X-ray
 * without leaving Dental Status."
 */
export function ImageReferencePanel({ chartId }: ImageReferencePanelProps) {
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageManagement[]>([]);
  const [analyzed, setAnalyzed] = useState(false);
  const [zoomUrl, setZoomUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!chartId) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const [imgs, analyses] = await Promise.all([
          imageManagementService.getByChart(chartId),
          aiDetectionResultService.getByChart(chartId).catch(() => []),
        ]);
        if (cancelled) return;
        setImages(imgs);
        const pano = imgs.find((i) => i.image_type === "panoramic_xray");
        setAnalyzed(!!pano && analyses.some((a) => a.image_id === pano.image_id));
      } catch (err) {
        console.error("Failed to load image references:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
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

  const intraoral = images.filter((i) => i.image_type === "intraoral");
  const panoramic = images.find((i) => i.image_type === "panoramic_xray");

  return (
    <div className="mt-auto flex w-full flex-col gap-3 border-t border-slate-100 bg-slate-50/50 p-5">
      <div className="flex items-center justify-between">
        <p className="text-[13px] font-bold uppercase tracking-wide text-slate-700">Image References</p>
        {!loading && images.length > 0 && (
          <span className="text-[11px] font-semibold text-slate-400">
            {images.length} image{images.length !== 1 ? "s" : ""}
          </span>
        )}
      </div>

      <div className="flex h-[180px] flex-row gap-4">
        {/* Intraoral — horizontal scroll strip, can hold many photos */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Intraoral</p>
            {intraoral.length > 0 && <span className="text-[10px] font-bold text-slate-400">{intraoral.length}</span>}
          </div>
          {loading ? (
            <SkeletonBox />
          ) : intraoral.length === 0 ? (
            <EmptyBox icon={ScanLine} label="No intraoral photos yet" />
          ) : (
            <div className="flex h-full w-full gap-2 overflow-x-auto rounded-xl">
              {intraoral.map((img) => (
                <button
                  key={img.image_id}
                  type="button"
                  onClick={() => img.image_url && setZoomUrl(img.image_url)}
                  disabled={!img.image_url}
                  className="relative h-full w-20 flex-shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 transition-transform hover:-translate-y-0.5 hover:shadow-md"
                >
                  <img
                    src={img.image_url}
                    alt={img.description || "Intraoral photo"}
                    className="h-full w-full object-contain"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Panoramic — one image, shown large */}
        <div className="flex min-w-0 flex-1 flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold text-slate-500">Panoramic X-Ray</p>
            {analyzed && (
              <span className="flex items-center gap-1 text-[10px] font-bold text-teal-600">
                <Sparkles className="h-2.5 w-2.5" />
                AI
              </span>
            )}
          </div>
          {loading ? (
            <SkeletonBox />
          ) : !panoramic ? (
            <EmptyBox icon={FileImage} label="No panoramic X-ray yet" />
          ) : (
            <button
              type="button"
              onClick={() => panoramic.image_url && setZoomUrl(panoramic.image_url)}
              disabled={!panoramic.image_url}
              className="h-full w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-950 transition-transform hover:-translate-y-0.5 hover:shadow-md"
            >
              <img
                src={panoramic.image_url}
                alt={panoramic.description || "Panoramic X-ray"}
                className="h-full w-full object-contain"
                loading="lazy"
              />
            </button>
          )}
        </div>
      </div>

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

function EmptyBox({ icon: Icon, label }: { icon: ComponentType<{ className?: string }>; label: string }) {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-xl border border-dashed border-slate-300 bg-slate-100 px-2 text-center text-slate-400">
      <Icon className="h-5 w-5" />
      <span className="text-[11px] font-medium leading-tight">{label}</span>
    </div>
  );
}

function SkeletonBox() {
  return <div className="h-full w-full animate-pulse rounded-xl bg-slate-200" />;
}
