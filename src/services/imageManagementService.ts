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

export const imageManagementService = {
  /**
   * Get all images for a chart (returns signed URLs from backend)
   */
  getByChart: async (chartId: string): Promise<ImageManagement[]> => {
    const response = await api.get<ImageManagement[]>(
      `/dental-charts/${chartId}/images`,
    );
    return response.data;
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
    return response.data;
  },

  /**
   * Delete image metadata record
   */
  delete: async (chartId: string, imageId: string): Promise<void> => {
    await api.delete(`/dental-charts/${chartId}/images/${imageId}`);
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
   * Delete a file from Supabase Storage bucket.
   */
  deleteFromStorage: async (
    category: ImageCategory,
    fileName: string,
  ): Promise<void> => {
    const storagePath = `${category}/${fileName}`;
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([storagePath]);

    if (error) {
      console.error("Failed to delete from storage:", error.message);
    }
  },
};
