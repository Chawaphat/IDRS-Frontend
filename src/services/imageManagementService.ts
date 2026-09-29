import api from "@/lib/api";
import { supabase } from "@/lib/supabase";
import type { ImageManagement } from "./patientService";

export type ImageCategory = "intraoral" | "panoramic_xray" | "other";

export interface ImageManagementCreate {
  image_type: ImageCategory;
  image_file: string;
  image_url?: string;
  description?: string;
}

export interface ImageManagementUpdate {
  image_type?: ImageCategory;
  image_file?: string;
  image_url?: string;
  description?: string;
}

const BUCKET_NAME = import.meta.env.VITE_SUPABASE_BUCKET || "Image";
const imageRequests = new Map<string, Promise<ImageManagement[]>>();

// Other tabs (e.g. the Dental Status odontogram) mount once and stay alive via
// CSS visibility rather than remounting, so a plain useEffect keyed on chartId
// won't refetch after an upload/delete happens elsewhere. This event lets any
// screen showing chart images stay in sync without a page/chart reload.
const IMAGES_CHANGED_EVENT = "idrs:chart-images-changed";

function notifyImagesChanged(chartId: string) {
  imageRequests.delete(chartId);
  window.dispatchEvent(new CustomEvent(IMAGES_CHANGED_EVENT, { detail: { chartId } }));
}

export function onChartImagesChanged(chartId: string, callback: () => void): () => void {
  const handler = (event: Event) => {
    const detail = (event as CustomEvent<{ chartId: string }>).detail;
    if (detail?.chartId === chartId) callback();
  };
  window.addEventListener(IMAGES_CHANGED_EVENT, handler);
  return () => window.removeEventListener(IMAGES_CHANGED_EVENT, handler);
}

export const imageManagementService = {
  /**
   * Get all images for a chart (returns signed URLs from backend)
   */
  getByChart: (chartId: string, refreshUrls = false): Promise<ImageManagement[]> => {
    if (refreshUrls) imageRequests.delete(chartId);
    const cached = imageRequests.get(chartId);
    if (cached) return cached;

    const request = api
      .get<ImageManagement[]>(`/dental-charts/${chartId}/images`, {
        params: refreshUrls ? { refresh_urls: true } : undefined,
      })
      .then((response) => response.data)
      .catch((error) => {
        imageRequests.delete(chartId);
        throw error;
      });
    imageRequests.set(chartId, request);
    return request;
  },

  /**
   * Create an image metadata record in the database
   */
  create: async (
    chartId: string,
    payload: ImageManagementCreate,
  ): Promise<ImageManagement> => {
    const response = await api.post<ImageManagement>(
      `/dental-charts/${chartId}/images`,
      payload,
    );
    notifyImagesChanged(chartId);
    return response.data;
  },

  /**
   * Update image metadata
   */
  update: async (
    chartId: string,
    imageId: string,
    payload: ImageManagementUpdate,
  ): Promise<ImageManagement> => {
    const response = await api.put<ImageManagement>(
      `/dental-charts/${chartId}/images/${imageId}`,
      payload,
    );
    notifyImagesChanged(chartId);
    return response.data;
  },

  /**
   * Delete image metadata record
   */
  delete: async (chartId: string, imageId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/images/${imageId}`);
    notifyImagesChanged(chartId);
  },

  /**
   * Upload a file directly to Supabase Storage bucket.
   * Path convention: {category}/{uuid}.{ext}
   * Returns the file name (not the full path).
   */
  uploadToStorage: async (
    file: File,
    category: ImageCategory,
  ): Promise<string> => {
    const ext = file.name.split(".").pop() || "jpg";
    const uniqueName = `${crypto.randomUUID()}.${ext}`;
    const storagePath = `${category}/${uniqueName}`;

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(storagePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    console.log(error);
    if (error) {
      throw new Error(`Failed to upload image: ${error.message}`);
    }

    return uniqueName;
  },

  /**
   * Delete a file from Supabase Storage bucket. Never throws — a failure here
   * shouldn't block the caller (the DB record is usually already gone by the
   * time this runs) — but callers should check the returned flag and surface
   * it, or the orphaned file goes unnoticed forever.
   */
  deleteFromStorage: async (
    category: ImageCategory,
    fileName: string,
  ): Promise<boolean> => {
    const storagePath = `${category}/${fileName}`;
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error("Failed to delete from storage:", error.message);
      return false;
    }
    return true;
  },
};
