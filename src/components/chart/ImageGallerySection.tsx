import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  Camera,
  Upload,
  Trash2,
  X,
  Eye,
  ImagePlus,
  Loader2,
  AlertCircle,
  AlertTriangle,
  ScanLine,
  FileImage,
  FolderOpen,
  Sparkles,
  ZoomIn,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToastStore } from "@/store/toastStore";
import { imageManagementService } from "@/services/imageManagementService";
import type { ImageCategory } from "@/services/imageManagementService";
import type { ImageManagement } from "@/services/patientService";
import { aiDetectionResultService } from "@/services/aiDetectionResultService";
import { AIDetectionViewer } from "@/components/ai/AIDetectionViewer";
import type { AIDetectResult } from "@/lib/aiDetection";
import { format, parseISO } from "date-fns";
import { ToothLoaderIcon } from "@/components/ui/ToothLoader";

interface ImageGallerySectionProps {
  chartId: string;
}

const CATEGORIES: { id: ImageCategory; label: string; icon: React.ReactNode }[] = [
  { id: "intraoral", label: "Intraoral", icon: <ScanLine className="w-4 h-4" /> },
  { id: "panoramic_xray", label: "Panoramic X-ray", icon: <FileImage className="w-4 h-4" /> },
  { id: "other", label: "Other", icon: <FolderOpen className="w-4 h-4" /> },
];

const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function ImageGallerySection({ chartId }: ImageGallerySectionProps) {
  const { show: showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [images, setImages] = useState<ImageManagement[]>([]);
  const [activeCategory, setActiveCategory] = useState<ImageCategory>("intraoral");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [description, setDescription] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteImage, setConfirmDeleteImage] = useState<ImageManagement | null>(null);
  const [detectingId, setDetectingId] = useState<string | null>(null);
  // image_id -> its AI result. Doubles as "has this image been analyzed" (analyzedImageIds derives from its keys).
  const [analysesById, setAnalysesById] = useState<Map<string, AIDetectResult>>(new Map());
  const [showAIResults, setShowAIResults] = useState(true);
  const [pendingReplaceFile, setPendingReplaceFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch images
  const fetchImages = useCallback(async () => {
    try {
      const data = await imageManagementService.getByChart(chartId);
      setImages(data);
    } catch (err: any) {
      const errorDetail = err?.response?.data?.detail || err?.message || "Failed to fetch images.";
      console.error("====== GET IMAGES ERROR ======");
      console.error(errorDetail);
      console.error("==============================");
      showToast(`Failed to load images: ${errorDetail}`, "error");
    }
  }, [chartId]);

  // Which images already have an AI analysis on record — drives "Detect" vs
  // "Re-detect" label, and lets the panoramic hero auto-show results on load.
  const fetchAnalyses = useCallback(async () => {
    try {
      const analyses = await aiDetectionResultService.getByChart(chartId);
      setAnalysesById(new Map(analyses.map((a) => [a.image_id, a.detection_data])));
    } catch (err) {
      // Non-critical — the gallery still works without this, just shows "Detect" instead of "Re-detect"
      console.error("Failed to load AI analysis status:", err);
    }
  }, [chartId]);

  const analyzedImageIds = useMemo(() => new Set(analysesById.keys()), [analysesById]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchImages(), fetchAnalyses()]);
      setLoading(false);
    };
    load();
  }, [fetchImages, fetchAnalyses]);

  // Filtered images for active category
  const filteredImages = images.filter((img) => img.image_type === activeCategory);
  const panoramicImage = images.find((img) => img.image_type === "panoramic_xray");

  // Count per category
  const countByCategory = (cat: ImageCategory) => images.filter((img) => img.image_type === cat).length;

  // File validation
  const validateFile = (file: File): string | null => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Please upload JPG, PNG, or WebP images.";
    }
    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 10MB limit.";
    }
    return null;
  };

  const clearPreview = useCallback(() => {
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return null;
    });
  }, []);

  // Actual upload — assumes any "replace existing panoramic" confirmation has already happened
  const performUpload = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        showToast(error, "error");
        clearPreview();
        return;
      }

      setUploading(true);
      setUploadProgress(10);

      try {
        // 1. Upload to Supabase Storage
        setUploadProgress(30);
        const fileName = await imageManagementService.uploadToStorage(file, activeCategory);
        setUploadProgress(70);

        // 2. Register metadata in backend
        await imageManagementService.create(chartId, {
          image_type: activeCategory,
          image_file: fileName,
          description: description.trim() || undefined,
        });
        setUploadProgress(100);

        // 3. Refresh gallery + AI analysis status (a replaced image loses its old analysis)
        await Promise.all([fetchImages(), fetchAnalyses()]);
        setDescription("");
        showToast("Image uploaded successfully!", "success");
      } catch (err: any) {
        const errorDetail = err?.response?.data?.detail || err?.message || "Failed to upload image. Please try again.";
        console.error("====== BACKEND ERROR ======");
        console.error(errorDetail);
        console.error("===========================");
        showToast(`Upload failed: ${errorDetail}`, "error");
      } finally {
        setUploading(false);
        setUploadProgress(0);
        clearPreview();
      }
    },
    [activeCategory, chartId, description, fetchImages, fetchAnalyses, showToast, clearPreview]
  );

  // Upload gate — a chart holds one panoramic X-ray, so uploading a second one
  // means replacing the first. Warn before doing anything destructive.
  const handleUpload = useCallback(
    (file: File) => {
      if (activeCategory === "panoramic_xray") {
        const existing = images.find((img) => img.image_type === "panoramic_xray");
        if (existing) {
          setPendingReplaceFile(file);
          return;
        }
      }
      performUpload(file);
    },
    [activeCategory, images, performUpload]
  );

  // Entry point for both drag-drop and the file picker — validates first so we
  // never show a live preview of a file we're about to reject, then shows the
  // preview immediately (good upload UX: show what's being uploaded, not just
  // an abstract spinner) before handing off to the upload gate.
  const selectFile = useCallback(
    (file: File) => {
      const error = validateFile(file);
      if (error) {
        showToast(error, "error");
        return;
      }
      clearPreview();
      setPreviewUrl(URL.createObjectURL(file));
      handleUpload(file);
    },
    [handleUpload, showToast, clearPreview]
  );

  // Deletes the existing panoramic X-ray (and its AI analysis, via backend cascade)
  // then uploads the new one.
  const confirmReplace = useCallback(async () => {
    if (!pendingReplaceFile) return;
    const file = pendingReplaceFile;
    const existing = images.find((img) => img.image_type === "panoramic_xray");
    setPendingReplaceFile(null);

    if (existing) {
      setUploading(true);
      try {
        await imageManagementService.delete(chartId, existing.image_id);
        if (existing.image_file) {
          const storageDeleted = await imageManagementService.deleteFromStorage(existing.image_type, existing.image_file);
          if (!storageDeleted) {
            showToast("Replaced the X-ray, but the old file couldn't be fully deleted from storage.", "error");
          }
        }
      } catch (err) {
        console.error("Failed to remove existing panoramic X-ray:", err);
        showToast("Failed to replace the existing panoramic X-ray.", "error");
        setUploading(false);
        clearPreview();
        return;
      }
      setUploading(false);
    }
    performUpload(file);
  }, [pendingReplaceFile, images, chartId, performUpload, showToast, clearPreview]);

  // AI detection handler — the fresh result is shown inline immediately,
  // no need to re-fetch it.
  const handleDetect = useCallback(
    async (image: ImageManagement) => {
      setDetectingId(image.image_id);
      try {
        const analysis = await aiDetectionResultService.detect(chartId, image.image_id);
        setAnalysesById((prev) => new Map(prev).set(image.image_id, analysis.detection_data));
        setShowAIResults(true);
        const count = analysis.detection_data?.detections?.length ?? 0;
        showToast(`AI analysis complete — ${count} finding(s) detected`, "success");
      } catch (err: any) {
        const detail = err?.response?.data?.detail || err?.message || "Failed to run AI detection.";
        showToast(`AI detection failed: ${detail}`, "error");
      } finally {
        setDetectingId(null);
      }
    },
    [chartId, showToast]
  );

  // Delete handler
  const handleDelete = useCallback(
    async (image: ImageManagement) => {
      setDeletingId(image.image_id);
      try {
        // 1. Delete metadata from backend
        await imageManagementService.delete(chartId, image.image_id);

        // 2. Delete file from storage — the record above is already gone
        // either way, so a failure here doesn't undo the delete; it just
        // leaves an orphaned file, which we surface instead of hiding.
        let storageDeleted = true;
        if (image.image_file) {
          storageDeleted = await imageManagementService.deleteFromStorage(image.image_type, image.image_file);
        }

        // 3. Refresh gallery — also drops the now-cascade-deleted AI analysis, if any
        setAnalysesById((prev) => {
          if (!prev.has(image.image_id)) return prev;
          const next = new Map(prev);
          next.delete(image.image_id);
          return next;
        });
        await fetchImages();
        if (storageDeleted) {
          showToast("Image deleted successfully.", "success");
        } else {
          showToast("Image removed, but its file couldn't be fully deleted from storage.", "error");
        }
      } catch (err) {
        console.error("Delete failed:", err);
        showToast("Failed to delete image.", "error");
      } finally {
        setDeletingId(null);
        setConfirmDeleteImage(null);
      }
    },
    [chartId, fetchImages, showToast]
  );

  // Drag & Drop handlers
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
    if (file) selectFile(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) selectFile(file);
    e.target.value = "";
  };

  // Loading state
  if (loading) {
    return (
      <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center min-h-[60vh] rounded-3xl">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <ToothLoaderIcon className="w-16 h-16 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Images</h3>
          <p className="text-slate-500 font-medium">Retrieving image gallery...</p>
        </div>
      </div>
    );
  }

  const activeCategoryLabel = CATEGORIES.find((c) => c.id === activeCategory)?.label ?? "";
  const isPanoramicTab = activeCategory === "panoramic_xray";

  return (
    <div className="space-y-8 pb-12">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-4 flex items-end justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
            <Camera className="w-8 h-8 text-teal-600" />
            Image Gallery
          </h2>
          <p className="text-slate-500 mt-1">Upload and manage clinical images organized by category.</p>
        </div>
        <div className="flex items-center gap-4 text-xs font-semibold text-slate-400">
          {CATEGORIES.map((cat, i) => (
            <span key={cat.id} className="flex items-center gap-1.5">
              {i > 0 && <span className="text-slate-200">·</span>}
              {countByCategory(cat.id)} {cat.label}
            </span>
          ))}
        </div>
      </div>

      {/* Category Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-4 py-3">
          <div className="flex gap-2">
            {CATEGORIES.map((cat) => {
              const count = countByCategory(cat.id);
              const isActive = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    isActive ? "bg-teal-500 text-white shadow-md shadow-teal-500/20" : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5",
                        isActive ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Upload Area */}
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-2xl border-2 border-dashed transition-all duration-200 overflow-hidden",
              dragOver ? "border-teal-400 bg-teal-50/50 scale-[1.01]" : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50",
              uploading && "pointer-events-none"
            )}
          >
            {uploading ? (
              <div className="flex items-center gap-5 p-6">
                {/* Live preview of the file actually being uploaded — not just a spinner */}
                <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-slate-900 flex-shrink-0 shadow-md">
                  {previewUrl && <img src={previewUrl} alt="Uploading" className="w-full h-full object-cover opacity-70" />}
                  <div className="absolute inset-0 flex items-center justify-center bg-slate-900/30">
                    <Loader2 className="w-7 h-7 text-white animate-spin" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-slate-700">Uploading to {activeCategoryLabel}...</p>
                  <div className="h-2 bg-slate-200 rounded-full overflow-hidden mt-2 max-w-xs">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-xs font-semibold text-teal-700 mt-1.5">{uploadProgress}%</p>
                </div>
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-colors",
                      dragOver ? "bg-teal-100 text-teal-600" : "bg-slate-100 text-slate-400"
                    )}
                  >
                    <ImagePlus className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Drag & drop {isPanoramicTab ? "a panoramic X-ray" : "an image"} here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-teal-600 hover:text-teal-700 underline underline-offset-2"
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG, WebP · Max 10MB{isPanoramicTab && panoramicImage ? " · Uploading here replaces the current X-ray" : ""}
                    </p>
                  </div>
                </div>

                {/* Description input */}
                <div className="mt-5 max-w-md mx-auto">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a description (optional)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="text-sm focus-visible:ring-teal-500 bg-white"
                    />
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="bg-teal-500 hover:bg-teal-600 text-white shrink-0 shadow-md"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      Upload
                    </Button>
                  </div>
                </div>
              </div>
            )}

            <input ref={fileInputRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden" onChange={handleFileSelect} />
          </div>

          {/* ---------- Panoramic X-ray: one image, shown large and uncropped ---------- */}
          {isPanoramicTab ? (
            panoramicImage ? (
              <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
                <div className="relative bg-slate-950 flex items-center justify-center">
                  {/* object-contain, not cover — an X-ray must never be edge-cropped */}
                  <img
                    src={panoramicImage.image_url}
                    alt={panoramicImage.description || "Panoramic X-ray"}
                    className="w-full max-h-[480px] object-contain cursor-zoom-in"
                    onClick={() => setSelectedImageUrl(panoramicImage.image_url || null)}
                  />
                  <button
                    type="button"
                    onClick={() => setSelectedImageUrl(panoramicImage.image_url || null)}
                    className="absolute bottom-3 right-3 flex items-center gap-1.5 bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-lg backdrop-blur-sm h-9 px-3 text-sm font-semibold transition-colors"
                  >
                    <ZoomIn className="w-4 h-4" />
                    Full size
                  </button>
                  {analyzedImageIds.has(panoramicImage.image_id) && (
                    <span className="absolute top-3 left-3 flex items-center gap-1 bg-teal-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-sm">
                      <Sparkles className="w-3 h-3" />
                      AI Analyzed
                    </span>
                  )}
                </div>

                <div className="p-4 flex items-center justify-between gap-3 flex-wrap">
                  <div className="min-w-0">
                    {panoramicImage.description && (
                      <p className="text-sm font-medium text-slate-700 truncate">{panoramicImage.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {panoramicImage.uploaded_at ? format(parseISO(panoramicImage.uploaded_at), "MMM d, yyyy • h:mm a") : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleDetect(panoramicImage)}
                      disabled={detectingId === panoramicImage.image_id}
                      className="rounded-xl text-teal-700 border-teal-200 hover:bg-teal-50"
                    >
                      {detectingId === panoramicImage.image_id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                          Detecting...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4 mr-1.5" />
                          {analyzedImageIds.has(panoramicImage.image_id) ? "Re-detect" : "Detect X-ray"}
                        </>
                      )}
                    </Button>
                    {analyzedImageIds.has(panoramicImage.image_id) && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAIResults((v) => !v)}
                        className="rounded-xl text-slate-600 border-slate-200 hover:bg-slate-50"
                      >
                        {showAIResults ? <ChevronUp className="w-4 h-4 mr-1.5" /> : <ChevronDown className="w-4 h-4 mr-1.5" />}
                        {showAIResults ? "Hide results" : "View results"}
                      </Button>
                    )}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmDeleteImage(panoramicImage)}
                      disabled={deletingId === panoramicImage.image_id}
                      className="rounded-xl text-rose-600 border-rose-200 hover:bg-rose-50"
                    >
                      {deletingId === panoramicImage.image_id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                {/* Inline AI results — same viewer used by the standalone AI Analysis tab */}
                {showAIResults && analysesById.has(panoramicImage.image_id) && (
                  <div className="border-t border-slate-100 p-4 sm:p-6 bg-slate-50/50">
                    <AIDetectionViewer
                      imageUrl={panoramicImage.image_url!}
                      result={analysesById.get(panoramicImage.image_id)!}
                    />
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl border border-slate-100 bg-slate-50/30 py-16 flex flex-col items-center justify-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                  <FileImage className="w-8 h-8" />
                </div>
                <p className="text-sm font-bold text-slate-600">No panoramic X-ray yet</p>
                <p className="text-xs text-slate-400 mt-1">Upload one using the area above — a chart holds one at a time.</p>
              </div>
            )
          ) : /* ---------- Intraoral / Other: grid, never cropped ---------- */
          filteredImages.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/30 py-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-600">No {activeCategoryLabel} images yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload your first image using the area above.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.image_id}
                  className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Image Container — object-contain on a neutral bg so nothing is ever cropped out of view */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.description || "Clinical image"}
                      className="w-full h-full object-contain transition-transform duration-300 group-hover:scale-105 cursor-zoom-in"
                      loading="lazy"
                      onClick={() => setSelectedImageUrl(image.image_url || null)}
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 gap-2 px-2 pointer-events-none">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImageUrl(image.image_url || null)}
                        className="bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-lg backdrop-blur-sm h-9 px-3 pointer-events-auto"
                      >
                        <Eye className="w-4 h-4 mr-1.5" />
                        View
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setConfirmDeleteImage(image)}
                        disabled={deletingId === image.image_id}
                        className="bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl shadow-lg backdrop-blur-sm h-9 px-3 pointer-events-auto"
                      >
                        {deletingId === image.image_id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Trash2 className="w-4 h-4 mr-1.5" />
                            Delete
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Image Info */}
                  <div className="p-3">
                    {image.description && <p className="text-sm font-medium text-slate-700 truncate">{image.description}</p>}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {image.uploaded_at ? format(parseISO(image.uploaded_at), "MMM d, yyyy • h:mm a") : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Full-screen Image Preview Modal */}
      {selectedImageUrl && (
        <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in zoom-in-95 duration-200">
          <Button
            variant="ghost"
            className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 h-auto rounded-full"
            onClick={() => setSelectedImageUrl(null)}
          >
            <X className="w-6 h-6" />
          </Button>
          <img
            src={selectedImageUrl}
            alt="Preview"
            className="max-w-full max-h-full rounded-lg shadow-2xl object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {confirmDeleteImage && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Delete Image</h3>
                <p className="text-sm text-slate-500">This action cannot be undone.</p>
              </div>
            </div>

            {confirmDeleteImage.description && (
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-4">"{confirmDeleteImage.description}"</p>
            )}

            <div className="flex gap-3 mt-6">
              <Button type="button" variant="outline" className="flex-1 rounded-xl" onClick={() => setConfirmDeleteImage(null)}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1 bg-rose-500 hover:bg-rose-600 text-white rounded-xl shadow-md"
                onClick={() => handleDelete(confirmDeleteImage)}
                disabled={deletingId === confirmDeleteImage.image_id}
              >
                {deletingId === confirmDeleteImage.image_id ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Trash2 className="w-4 h-4 mr-2" />
                )}
                Delete
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Replace Panoramic X-ray Confirmation Dialog */}
      {pendingReplaceFile && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-full bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Replace Panoramic X-ray?</h3>
                <p className="text-sm text-slate-500">A chart holds one panoramic X-ray at a time.</p>
              </div>
            </div>

            {/* Before / after visual so the swap is unambiguous, not just text */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400 mb-1.5">Current</p>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950">
                  {panoramicImage?.image_url && (
                    <img src={panoramicImage.image_url} alt="Current panoramic X-ray" className="w-full h-full object-contain opacity-60" />
                  )}
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-teal-600 mb-1.5">New</p>
                <div className="aspect-[4/3] rounded-xl overflow-hidden bg-slate-950 ring-2 ring-teal-400">
                  {previewUrl && <img src={previewUrl} alt="New panoramic X-ray" className="w-full h-full object-contain" />}
                </div>
              </div>
            </div>

            <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-4">
              This will delete the current X-ray and its AI detection result, then upload{" "}
              <span className="font-semibold">{pendingReplaceFile.name}</span> in its place.
            </p>

            <div className="flex gap-3 mt-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => {
                  setPendingReplaceFile(null);
                  clearPreview();
                }}
              >
                Cancel
              </Button>
              <Button type="button" className="flex-1 bg-amber-500 hover:bg-amber-600 text-white rounded-xl shadow-md" onClick={confirmReplace}>
                Replace
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
