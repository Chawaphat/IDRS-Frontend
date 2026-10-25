import { dentalStatusToOdontogramSnapshot } from '@/components/chart/dentalStatusMapper';
import { FACE_FRONT_IMAGE, FACE_SIDE_IMAGE, MUSCLE_AREAS, SIDEVIEW_MUSCLE_AREAS, type MuscleArea } from '@/components/faceMuscleAreas';
import { renderOdontogramTeethSvgs } from '@/components/odontogram/odontogram';
import { aiDetectionResultService } from '@/services/aiDetectionResultService';
import type { ChartExportData } from '@/services/pdfExportService';
import type { DentalStatusResponse } from '@/services/types/dentalStatus';
import type { AIDetectResult } from '@/lib/aiDetection';
import { PDF_OPTION_GROUPS, PDF_REFERENCE_IMAGES } from './chartPdfOptions';

export interface ChartPdfAiAnalysis {
  imageId: string;
  modelName: string;
  modelVersion: string;
  result: AIDetectResult;
}

export interface ChartPdfAssets {
  /** Rasterized reference/option images, keyed by their source path. */
  pictures: Record<string, string>;
  /** User-visible omissions, also printed in a partial export. */
  warnings?: string[];
  teeth: { side: Record<number, string>; occl: Record<number, string> };
  muscleViews: { right?: string; front?: string; left?: string };
  /** Downscaled clinical uploads, keyed by image_id. */
  clinicalImages: Record<string, string>;
  aiAnalyses: ChartPdfAiAnalysis[];
}

export const emptyChartPdfAssets = (): ChartPdfAssets => ({
  pictures: {},
  teeth: { side: {}, occl: {} },
  muscleViews: {},
  clinicalImages: {},
  aiAnalyses: [],
});

const MUSCLE_HIGHLIGHT = 'rgba(239, 68, 68, 0.7)';

function loadImage(src: string, crossOrigin = false): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (crossOrigin) image.crossOrigin = 'anonymous';
    const timer = setTimeout(() => {
      image.onload = null;
      image.onerror = null;
      image.src = "";
      reject(new Error("Image loading timed out"));
    }, 15_000);
    image.onload = () => { clearTimeout(timer); resolve(image); };
    image.onerror = () => { clearTimeout(timer); reject(new Error(`Failed to load image: ${src}`)); };
    image.src = src;
  });
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const context = canvas.getContext('2d');
  if (!context) throw new Error('Canvas 2D context is unavailable');
  return { canvas, context };
}

async function rasterize(src: string, maxSize: number, options: { crossOrigin?: boolean; format?: 'jpeg' | 'png' } = {}) {
  const image = await loadImage(src, options.crossOrigin);
  const scale = Math.min(1, maxSize / Math.max(image.naturalWidth || maxSize, image.naturalHeight || maxSize));
  const { canvas, context } = createCanvas((image.naturalWidth || maxSize) * scale, (image.naturalHeight || maxSize) * scale);
  if (options.format !== 'png') {
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
  }
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  return options.format === 'png' ? canvas.toDataURL('image/png') : canvas.toDataURL('image/jpeg', 0.86);
}

async function rasterizeSvgMarkup(markup: string, scale: number) {
  const doc = new DOMParser().parseFromString(markup, 'image/svg+xml');
  const svg = doc.documentElement;
  const [, , width = 40, height = 64] = (svg.getAttribute('viewBox') ?? '').split(/\s+/).map(Number);
  svg.setAttribute('width', String(width * scale));
  svg.setAttribute('height', String(height * scale));
  const url = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)], { type: 'image/svg+xml' }));
  try {
    const image = await loadImage(url);
    const { canvas, context } = createCanvas(width * scale, height * scale);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/png');
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function settle<T>(task: () => Promise<T>, label: string, warnings: string[]): Promise<T | undefined> {
  try {
    return await task();
  } catch (error) {
    console.warn(`PDF asset skipped (${label})`, error);
    warnings.push(`${label}: unavailable. Try exporting again to include it.`);
    return undefined;
  }
}

async function loadPictures(warnings: string[]) {
  const sources = new Map(PDF_REFERENCE_IMAGES.map((src, index) => [src, `Reference illustration ${index + 1}`]));
  PDF_OPTION_GROUPS.forEach((group) => group.options.forEach((item) => {
    if (item.image) sources.set(item.image, `${group.title}: ${item.label} illustration`);
  }));
  const entries = await Promise.all(
    Array.from(sources).map(async ([src, label]) => [src, await settle(() => rasterize(encodeURI(src), 420), label, warnings)] as const),
  );
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[1])));
}

async function loadTeeth(dentalStatus: ChartExportData['dental_status'], warnings: string[]) {
  const teeth: ChartPdfAssets['teeth'] = { side: {}, occl: {} };
  const snapshot = dentalStatusToOdontogramSnapshot(dentalStatus as unknown as DentalStatusResponse | null);
  const rendered = await renderOdontogramTeethSvgs(snapshot);
  await Promise.all(rendered.map(async ({ toothNo, view, svg }) => {
    const png = await settle(() => rasterizeSvgMarkup(svg, 3), `Tooth ${toothNo} ${view} illustration`, warnings);
    if (png) teeth[view][toothNo] = png;
  }));
  return teeth;
}

const percent = (value: string) => Number.parseFloat(value) / 100;

async function drawMuscleHighlight(context: CanvasRenderingContext2D, area: MuscleArea, width: number, height: number) {
  const mask = await loadImage(encodeURI(area.src));
  const boxX = percent(area.left) * width;
  const boxY = percent(area.top) * height;
  const boxW = percent(area.width) * width;
  const boxH = percent(area.height) * height;
  const ratio = Math.min(boxW / (mask.naturalWidth || boxW), boxH / (mask.naturalHeight || boxH));
  const drawW = (mask.naturalWidth || boxW) * ratio;
  const drawH = (mask.naturalHeight || boxH) * ratio;
  const { canvas: tint, context: tintContext } = createCanvas(drawW, drawH);
  tintContext.drawImage(mask, 0, 0, tint.width, tint.height);
  tintContext.globalCompositeOperation = 'source-in';
  tintContext.fillStyle = MUSCLE_HIGHLIGHT;
  tintContext.fillRect(0, 0, tint.width, tint.height);
  context.drawImage(tint, boxX + (boxW - drawW) / 2, boxY + (boxH - drawH) / 2);
}

async function renderMuscleView(base: string, width: number, height: number, areas: MuscleArea[], mirror: boolean) {
  const { canvas, context } = createCanvas(width, height);
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, width, height);
  if (mirror) {
    context.translate(width, 0);
    context.scale(-1, 1);
  }
  context.drawImage(await loadImage(encodeURI(base)), 0, 0, width, height);
  for (const area of areas) await drawMuscleHighlight(context, area, width, height);
  return canvas.toDataURL('image/jpeg', 0.86);
}

async function loadMuscleViews(selected: string[], warnings: string[]): Promise<ChartPdfAssets['muscleViews']> {
  const sideAreas = (suffix: 'R' | 'L') => SIDEVIEW_MUSCLE_AREAS.filter((area) => selected.includes(`${area.id}-${suffix}`));
  const [right, front, left] = await Promise.all([
    settle(() => renderMuscleView(FACE_SIDE_IMAGE, 520, 520, sideAreas('R'), false), 'Right muscle view', warnings),
    settle(() => renderMuscleView(FACE_FRONT_IMAGE, 448, 600, MUSCLE_AREAS.filter((area) => selected.includes(area.id)), false), 'Front muscle view', warnings),
    settle(() => renderMuscleView(FACE_SIDE_IMAGE, 520, 520, sideAreas('L'), true), 'Left muscle view', warnings),
  ]);
  return { right, front, left };
}

async function loadClinicalImages(images: ChartExportData['images'], warnings: string[]) {
  const entries = await Promise.all(images.map(async (image) => {
    const id = String(image.image_id ?? '');
    const url = typeof image.image_url === 'string' ? image.image_url : '';
    if (!id || !url) {
      warnings.push(`Clinical image ${id || '(unknown)'}: image URL unavailable.`);
      return [id, undefined] as const;
    }
    return [id, await settle(() => rasterize(url, 1400, { crossOrigin: true }), `Clinical image ${id}`, warnings)] as const;
  }));
  return Object.fromEntries(entries.filter((entry): entry is readonly [string, string] => Boolean(entry[0] && entry[1])));
}

async function loadAiAnalyses(chartId: string): Promise<ChartPdfAiAnalysis[]> {
  const analyses = await aiDetectionResultService.getByChart(chartId, { fresh: true, timeout: 30_000 });
  if (analyses.some((analysis) => !Array.isArray(analysis.detection_data?.detections))) {
    throw new Error('Saved AI findings contain an invalid result');
  }
  return analyses
    .map((analysis) => ({
      imageId: analysis.image_id,
      modelName: analysis.model_name,
      modelVersion: analysis.model_version,
      result: analysis.detection_data,
    }));
}

/** Prepares browser-rendered visuals so the PDF mirrors the chart UI; any asset that fails to load is omitted. */
export async function prepareChartPdfAssets(data: ChartExportData, chartId: string): Promise<ChartPdfAssets> {
  const warnings: string[] = [];
  const muscles = Array.isArray(data.extraoral_exam?.muscle_pain) ? (data.extraoral_exam.muscle_pain as unknown[]).filter((item): item is string => typeof item === 'string') : [];
  const [pictures, teeth, muscleViews, clinicalImages, aiAnalyses] = await Promise.all([
    loadPictures(warnings),
    settle(() => loadTeeth(data.dental_status, warnings), 'Odontogram', warnings),
    loadMuscleViews(muscles, warnings),
    loadClinicalImages(data.images, warnings),
    settle(() => loadAiAnalyses(chartId), 'Saved AI findings', warnings),
  ]);
  return {
    pictures,
    warnings,
    teeth: teeth ?? { side: {}, occl: {} },
    muscleViews,
    clinicalImages,
    aiAnalyses: aiAnalyses ?? [],
  };
}
