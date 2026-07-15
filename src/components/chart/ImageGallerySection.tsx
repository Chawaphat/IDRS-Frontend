import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Camera,
  Upload,
  Trash2,
  X,
  Eye,
  ImagePlus,
  Loader2,
  AlertCircle,
  ScanLine,
  FileImage,
  FolderOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToastStore } from "@/store/toastStore";
import { imageManagementService } from "@/services/imageManagementService";
import type { ImageCategory } from "@/services/imageManagementService";
import type { ImageManagement } from "@/services/patientService";
import { format, parseISO } from "date-fns";

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

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await fetchImages();
      setLoading(false);
    };
    load();
  }, [fetchImages]);

  // Filtered images for active category
  const filteredImages = images.filter((img) => img.image_type === activeCategory);

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

  // Upload handler
  const handleUpload = useCallback(
    async (file: File) => {
      const error = validateFile(file);
      if (error) {
        showToast(error, "error");
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

        // 3. Refresh gallery
        await fetchImages();
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
      }
    },
    [activeCategory, chartId, description, fetchImages, showToast]
  );

  // Delete handler
  const handleDelete = useCallback(
    async (image: ImageManagement) => {
      setDeletingId(image.image_id);
      try {
        // 1. Delete metadata from backend
        await imageManagementService.delete(chartId, image.image_id);

        // 2. Delete file from storage
        if (image.image_file) {
          await imageManagementService.deleteFromStorage(image.image_type, image.image_file);
        }

        // 3. Refresh gallery
        await fetchImages();
        showToast("Image deleted successfully.", "success");
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
    if (file) handleUpload(file);
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
    e.target.value = "";
  };

  // Loading state
  if (loading) {
    return (
      <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center min-h-[60vh] rounded-3xl">
        <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
          <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-6 shadow-sm" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Images</h3>
          <p className="text-slate-500 font-medium">Retrieving image gallery...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      {/* Section Header */}
      <div className="border-b border-slate-200 pb-4">
        <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
          <Camera className="w-8 h-8 text-teal-600" />
          Image Gallery
        </h2>
        <p className="text-slate-500 mt-1">
          Upload and manage clinical images organized by category.
        </p>
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
                    isActive
                      ? "bg-teal-500 text-white shadow-md shadow-teal-500/20"
                      : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
                  )}
                >
                  {cat.icon}
                  <span>{cat.label}</span>
                  {count > 0 && (
                    <span
                      className={cn(
                        "ml-1 min-w-[20px] h-5 flex items-center justify-center rounded-full text-xs font-bold px-1.5",
                        isActive
                          ? "bg-white/20 text-white"
                          : "bg-slate-100 text-slate-500"
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
              "relative rounded-2xl border-2 border-dashed p-8 text-center transition-all duration-200",
              dragOver
                ? "border-teal-400 bg-teal-50/50 scale-[1.01]"
                : "border-slate-200 bg-slate-50/50 hover:border-slate-300 hover:bg-slate-50",
              uploading && "pointer-events-none opacity-60"
            )}
          >
            {uploading ? (
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <Loader2 className="w-12 h-12 text-teal-500 animate-spin" />
                </div>
                <div className="w-full max-w-xs">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-teal-400 to-teal-500 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="text-sm font-semibold text-teal-700 mt-2">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col items-center gap-3">
                  <div
                    className={cn(
                      "h-14 w-14 rounded-2xl flex items-center justify-center transition-colors",
                      dragOver
                        ? "bg-teal-100 text-teal-600"
                        : "bg-slate-100 text-slate-400"
                    )}
                  >
                    <ImagePlus className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-700">
                      Drag & drop an image here, or{" "}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="text-teal-600 hover:text-teal-700 underline underline-offset-2"
                      >
                        browse files
                      </button>
                    </p>
                    <p className="text-xs text-slate-400 mt-1">
                      JPG, PNG, WebP • Max 10MB
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
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.webp"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Image Grid */}
          {filteredImages.length === 0 ? (
            <div className="rounded-2xl border border-slate-100 bg-slate-50/30 py-16 flex flex-col items-center justify-center text-center">
              <div className="h-16 w-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300 mb-4">
                <Camera className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-600">
                No {CATEGORIES.find((c) => c.id === activeCategory)?.label} images yet
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Upload your first image using the area above.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {filteredImages.map((image) => (
                <div
                  key={image.image_id}
                  className="group relative bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden transition-all hover:shadow-md hover:border-slate-300"
                >
                  {/* Image Container */}
                  <div className="relative aspect-[4/3] bg-slate-100 overflow-hidden">
                    <img
                      src={image.image_url}
                      alt={image.description || "Clinical image"}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      loading="lazy"
                    />

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-end justify-center pb-4 gap-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedImageUrl(image.image_url || null)}
                        className="bg-white/90 hover:bg-white text-slate-700 rounded-xl shadow-lg backdrop-blur-sm h-9 px-3"
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
                        className="bg-white/90 hover:bg-rose-50 text-rose-600 hover:text-rose-700 rounded-xl shadow-lg backdrop-blur-sm h-9 px-3"
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
                    {image.description && (
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {image.description}
                      </p>
                    )}
                    <p className="text-xs text-slate-400 mt-0.5">
                      {image.uploaded_at
                        ? format(parseISO(image.uploaded_at), "MMM d, yyyy • h:mm a")
                        : ""}
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
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl px-4 py-3 mb-4">
                "{confirmDeleteImage.description}"
              </p>
            )}

            <div className="flex gap-3 mt-6">
              <Button
                type="button"
                variant="outline"
                className="flex-1 rounded-xl"
                onClick={() => setConfirmDeleteImage(null)}
              >
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
    </div>
  );
}
