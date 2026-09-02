// Shared constants for the AI Dental Detection feature (standalone AI Analysis
// tab + the chart-integrated Dental Status suggestion panel). Keep both
// surfaces visually and textually consistent by pulling from here.

// Same tooth ordering used by the real IDRS odontogram (odontogram.ts ALL_TEETH)
export const UPPER_ARCH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
export const LOWER_ARCH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

export type DiseaseName = "Impacted" | "Caries" | "Deep Caries" | "Periapical Lesion";

export const ALL_DISEASE_NAMES: DiseaseName[] = ["Impacted", "Caries", "Deep Caries", "Periapical Lesion"];

// One distinct, high-contrast color per disease class (against a grayscale X-ray).
export const DISEASE_COLORS: Record<string, string> = {
  Impacted: "#3b82f6", // blue-500
  Caries: "#f59e0b", // amber-500
  "Deep Caries": "#ef4444", // red-500
  "Periapical Lesion": "#a855f7", // purple-500
};

export const DISEASE_FALLBACK_COLOR = "#64748b"; // slate-500

export function diseaseColor(name: string): string {
  return DISEASE_COLORS[name] ?? DISEASE_FALLBACK_COLOR;
}

export const DISEASE_DESCRIPTIONS: Record<string, string> = {
  Impacted:
    "An impacted tooth is unable to fully emerge through the gum line, often blocked by an adjacent tooth or bone. Most common with third molars (wisdom teeth) and may require surgical extraction if it causes pain, infection, or crowding.",
  Caries:
    "Dental caries (tooth decay) is the progressive destruction of enamel caused by acid-producing bacteria. Early-stage caries is typically confined to the enamel and can often be treated with a simple filling.",
  "Deep Caries":
    "Deep caries indicates decay that has progressed past the enamel into the dentin, approaching or reaching the pulp. It carries a higher risk of pulp exposure and may require root canal treatment.",
  "Periapical Lesion":
    "A periapical lesion is an area of inflammation or infection at the root tip, usually resulting from untreated deep decay or trauma that has killed the tooth's pulp. Often requires root canal therapy or extraction.",
};

export function diseaseDescription(name: string): string {
  return DISEASE_DESCRIPTIONS[name] ?? "No description available for this condition.";
}

export interface AIDetection {
  disease: string;
  confidence: number;
  bbox: [number, number, number, number];
  tooth_fdi: number | null;
}

export interface AITooth {
  tooth_fdi: number;
  bbox: [number, number, number, number];
  diseases: { disease: string; confidence: number }[];
  is_healthy: boolean;
}

export interface AIDetectResult {
  image_size: { width: number; height: number };
  detections: AIDetection[];
  teeth: AITooth[];
}

/**
 * Crop a tooth's region out of a loaded <img> element using its detected
 * bbox, returning a data URL. Client-side crop keeps the backend response
 * light — it only ever sends bbox coordinates, never image bytes.
 *
 * Returns "" on failure instead of throwing — in particular, a cross-origin
 * image (e.g. a Supabase signed URL, unlike a same-origin blob: URL) taints
 * the canvas and makes toDataURL() throw a SecurityError. Callers must load
 * such images with crossOrigin="anonymous" to avoid the taint in the first
 * place; this guard exists so a CORS misconfiguration degrades to "no crop
 * preview" instead of crashing the page.
 */
export function cropToothImage(img: HTMLImageElement, bbox: [number, number, number, number], padding = 6): string {
  try {
    const [bx1, by1, bx2, by2] = bbox;
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) return "";

    const x1 = Math.max(0, bx1 - padding);
    const y1 = Math.max(0, by1 - padding);
    const x2 = Math.min(w, bx2 + padding);
    const y2 = Math.min(h, by2 + padding);
    const cropW = Math.max(1, x2 - x1);
    const cropH = Math.max(1, y2 - y1);

    const canvas = document.createElement("canvas");
    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.drawImage(img, x1, y1, cropW, cropH, 0, 0, cropW, cropH);
    return canvas.toDataURL("image/jpeg", 0.92);
  } catch (err) {
    console.error("cropToothImage failed:", err);
    return "";
  }
}
