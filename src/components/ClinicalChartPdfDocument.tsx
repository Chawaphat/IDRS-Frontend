import { Circle, Document, Font, Image, Line, Page, Path, Rect, StyleSheet, Svg, Text, View } from '@react-pdf/renderer';
import type { ReactNode } from 'react';
import type { ChartExportData, PdfExportRecord } from '@/services/pdfExportService';
import { ALL_DISEASE_NAMES, diseaseColor } from '@/lib/aiDetection';
import { formatMuscleName } from '@/components/faceMuscleAreas';
import latinFont from '@fontsource/noto-sans-thai/files/noto-sans-thai-latin-400-normal.woff';
import latinBoldFont from '@fontsource/noto-sans-thai/files/noto-sans-thai-latin-700-normal.woff';
import thaiFont from '@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff';
import thaiBoldFont from '@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff';
import { emptyChartPdfAssets, type ChartPdfAiAnalysis, type ChartPdfAssets } from '@/components/pdf/chartPdfAssets';
import {
  ANGLE_CLASS_OPTIONS,
  ESTHETIC_GROUPS,
  EXPECTATION_OPTIONS,
  EXTRAORAL_GROUPS,
  LIP_GUIDE_IMAGE,
  RIDGE_GROUPS,
  VDO_GROUPS,
  type PdfOption,
  type PdfOptionGroup,
} from '@/components/pdf/chartPdfOptions';

Font.register({ family: 'NotoSansLatin', fonts: [{ src: latinFont, fontWeight: 400 }, { src: latinBoldFont, fontWeight: 700 }] });
Font.register({ family: 'NotoSansThai', fonts: [{ src: thaiFont, fontWeight: 400 }, { src: thaiBoldFont, fontWeight: 700 }] });
Font.registerHyphenationCallback((word) => [word]);

const FONT_FAMILY = ['NotoSansLatin', 'NotoSansThai'];
const PAGE_WIDTH = 595.28;
const PAGE_PADDING_X = 30;
const PANEL_PADDING = 10;
const PANEL_INNER_WIDTH = PAGE_WIDTH - (PAGE_PADDING_X * 2) - (PANEL_PADDING * 2) - 2;

const c = {
  teal50: '#f0fdfa',
  teal100: '#ccfbf1',
  teal200: '#99f6e4',
  teal300: '#5eead4',
  teal500: '#14b8a6',
  teal600: '#0d9488',
  teal700: '#0f766e',
  teal800: '#115e59',
  teal900: '#134e4a',
  slate50: '#f8fafc',
  slate100: '#f1f5f9',
  slate200: '#e2e8f0',
  slate300: '#cbd5e1',
  slate400: '#94a3b8',
  slate500: '#64748b',
  slate600: '#475569',
  slate700: '#334155',
  slate800: '#1e293b',
  slate900: '#0f172a',
  rose50: '#fff1f2',
  rose200: '#fecdd3',
  rose500: '#f43f5e',
  rose600: '#e11d48',
  rose700: '#be123c',
  amber50: '#fffbeb',
  amber200: '#fde68a',
  amber700: '#b45309',
  amber800: '#92400e',
};

const styles = StyleSheet.create({
  page: { paddingTop: 26, paddingHorizontal: PAGE_PADDING_X, paddingBottom: 36, fontFamily: FONT_FAMILY, fontSize: 8, color: c.slate700, backgroundColor: c.slate50 },
  coverPage: { padding: 0, fontFamily: FONT_FAMILY, fontSize: 9, color: c.slate700, backgroundColor: c.slate50 },

  coverHero: { height: 236, backgroundColor: c.teal700, paddingTop: 46, paddingHorizontal: 44, color: '#ffffff' },
  coverBrand: { fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: c.teal200, marginBottom: 18 },
  coverTitle: { fontSize: 28, fontWeight: 700, lineHeight: 1.12, marginBottom: 8 },
  coverSubtitle: { fontSize: 10, color: c.teal100, maxWidth: 330, lineHeight: 1.45 },
  coverRecord: { position: 'absolute', right: 44, top: 48, alignItems: 'flex-end' },
  coverRecordLabel: { fontSize: 6, color: c.teal200, letterSpacing: 1, marginBottom: 3 },
  coverRecordValue: { fontSize: 10, fontWeight: 700 },
  coverBody: { paddingHorizontal: 38, marginTop: -30 },
  patientCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ffffff', borderRadius: 12, borderWidth: 1, borderColor: c.slate200, padding: 16 },
  patientAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: c.teal100, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  patientInitials: { fontSize: 16, fontWeight: 700, color: c.teal700 },
  patientName: { fontSize: 17, fontWeight: 700, color: c.slate900, marginBottom: 3 },
  patientMeta: { fontSize: 7.5, color: c.slate500 },
  patientAside: { marginLeft: 'auto', alignItems: 'flex-end' },
  patientAsideLabel: { fontSize: 6, color: c.slate400, marginBottom: 2 },
  patientAsideValue: { fontSize: 8, fontWeight: 700, color: c.slate700 },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statCard: { flex: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: c.slate200, borderRadius: 8, padding: 10 },
  statValue: { fontSize: 17, fontWeight: 700, color: c.slate900, marginBottom: 2 },
  statLabel: { fontSize: 6.5, color: c.slate500 },
  coverSectionTitle: { fontSize: 8, fontWeight: 700, color: c.slate900, marginTop: 16, marginBottom: 7 },
  indexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  indexItem: { width: '32.4%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: c.slate200, borderRadius: 7, padding: 8 },
  indexNumber: { fontSize: 6, color: c.teal600, fontWeight: 700, marginBottom: 2 },
  indexLabel: { fontSize: 7.4, color: c.slate700, fontWeight: 700 },
  indexStatus: { fontSize: 5.8, color: c.slate400, marginTop: 2 },

  reportHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: c.slate200, paddingBottom: 7, marginBottom: 12 },
  reportBrandRow: { flexDirection: 'row', alignItems: 'center' },
  reportLogo: { width: 18, height: 18, borderRadius: 5, backgroundColor: c.teal600, alignItems: 'center', justifyContent: 'center', marginRight: 6 },
  reportLogoText: { color: '#ffffff', fontSize: 6, fontWeight: 700 },
  reportBrand: { fontSize: 8.5, fontWeight: 700, color: c.slate800 },
  reportBrandSub: { fontSize: 5.5, color: c.slate400, letterSpacing: 0.6 },
  headerPatient: { alignItems: 'flex-end' },
  headerPatientName: { fontSize: 7.5, fontWeight: 700, color: c.slate800 },
  headerPatientMeta: { fontSize: 5.8, color: c.slate500, marginTop: 1 },
  footer: { position: 'absolute', left: PAGE_PADDING_X, right: PAGE_PADDING_X, bottom: 14, flexDirection: 'row', justifyContent: 'space-between', color: c.slate400, fontSize: 5.8 },

  pageTitleBlock: { borderBottomWidth: 1, borderBottomColor: c.slate200, paddingBottom: 9, marginBottom: 11 },
  pageEyebrow: { fontSize: 6, fontWeight: 700, color: c.teal600, letterSpacing: 1, marginBottom: 2 },
  pageTitle: { fontSize: 17, fontWeight: 700, color: c.slate800 },
  pageSubtitle: { fontSize: 7.5, color: c.slate500, marginTop: 2 },

  panel: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: c.slate200, borderRadius: 10, marginBottom: 10, overflow: 'hidden' },
  panelHeader: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.slate50, borderBottomWidth: 1, borderBottomColor: c.slate100, paddingVertical: 7, paddingHorizontal: PANEL_PADDING },
  panelHeaderRose: { backgroundColor: c.rose50, borderBottomColor: c.rose200 },
  panelDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: c.teal500, marginRight: 6 },
  panelTitle: { fontSize: 9, fontWeight: 700, color: c.slate800 },
  panelBody: { padding: PANEL_PADDING },

  field: { marginBottom: 9 },
  fieldLabel: { fontSize: 7.4, fontWeight: 700, color: c.slate700, marginBottom: 4 },
  fieldEyebrow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  fieldEyebrowDot: { width: 3, height: 3, borderRadius: 1.5, backgroundColor: c.teal300, marginRight: 4 },
  fieldEyebrowText: { fontSize: 6.4, fontWeight: 700, color: c.teal600, letterSpacing: 0.8 },
  divider: { borderTopWidth: 1, borderTopColor: c.slate100, marginTop: 2, marginBottom: 9 },
  row: { flexDirection: 'row', gap: 10 },
  col: { flex: 1 },

  optionRow: { flexDirection: 'row', gap: 8, marginBottom: 8, flexShrink: 0 },
  optionCard: { flex: 1, borderWidth: 1.4, borderColor: c.slate200, borderRadius: 8, backgroundColor: '#ffffff', paddingVertical: 5, paddingHorizontal: 5, alignItems: 'center', justifyContent: 'center', minHeight: 20 },
  optionCardActive: { borderColor: c.teal500, backgroundColor: c.teal50 },
  optionPad: { flex: 1 },
  optionImage: { width: '100%', borderRadius: 5, marginBottom: 8, objectFit: 'contain', flexShrink: 0 },
  optionImageDimmed: { opacity: 0.45 },
  optionLabel: { fontSize: 6.8, fontWeight: 700, color: c.slate500, textAlign: 'center' },
  optionLabelActive: { color: c.teal900 },
  optionSub: { fontSize: 5.6, color: c.slate400, textAlign: 'center', marginTop: 1 },
  optionSubActive: { color: c.teal700 },
  checkBadge: { position: 'absolute', top: 3, right: 3, width: 9, height: 9, borderRadius: 4.5, backgroundColor: c.teal500, alignItems: 'center', justifyContent: 'center' },

  valueBox: { borderWidth: 1, borderColor: c.slate200, borderRadius: 7, backgroundColor: '#ffffff', paddingVertical: 5, paddingHorizontal: 7, flexDirection: 'row', alignItems: 'center', minHeight: 20 },
  valueText: { fontSize: 7.6, fontWeight: 700, color: c.slate800, flex: 1 },
  valueUnit: { fontSize: 6.4, fontWeight: 700, color: c.slate500 },
  valueEmpty: { fontSize: 7.2, color: c.slate300, flex: 1 },
  textBlock: { borderWidth: 1, borderColor: c.slate200, borderRadius: 7, backgroundColor: '#ffffff', padding: 7, minHeight: 26 },
  textBlockText: { fontSize: 7.4, lineHeight: 1.45, color: c.slate700 },
  requiredMark: { color: '#ef4444' },

  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { borderRadius: 8, backgroundColor: c.teal50, borderWidth: 1, borderColor: c.teal200, paddingVertical: 2, paddingHorizontal: 6, color: c.teal800, fontSize: 6.4, fontWeight: 700 },
  roseChip: { borderRadius: 8, backgroundColor: c.rose50, borderWidth: 1, borderColor: c.rose200, paddingVertical: 2, paddingHorizontal: 6, color: c.rose700, fontSize: 6.4, fontWeight: 700 },
  empty: { color: c.slate400, fontSize: 7 },

  summaryStrip: { flexDirection: 'row', backgroundColor: '#ffffff', borderWidth: 1, borderColor: c.teal100, borderRadius: 10, padding: 10, marginBottom: 10, gap: 8 },
  summaryLabel: { fontSize: 5.8, fontWeight: 700, color: c.slate500, letterSpacing: 0.5, marginBottom: 2 },
  summaryValue: { fontSize: 8, fontWeight: 700, color: c.slate800 },

  alertRose: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: c.rose50, borderWidth: 1, borderColor: c.rose200, borderRadius: 8, padding: 7, marginTop: 4 },
  alertAmber: { flexDirection: 'row', alignItems: 'flex-start', backgroundColor: c.amber50, borderWidth: 1, borderColor: c.amber200, borderRadius: 8, padding: 7, marginTop: 4 },
  alertTitleRose: { fontSize: 7.2, fontWeight: 700, color: c.rose700 },
  alertTextRose: { fontSize: 6.6, color: c.rose600, marginTop: 1, lineHeight: 1.35 },
  alertTitleAmber: { fontSize: 7.2, fontWeight: 700, color: c.amber800 },
  alertTextAmber: { fontSize: 6.6, color: c.amber700, marginTop: 1, lineHeight: 1.35 },
  alertIcon: { marginRight: 5, marginTop: 1 },
  neutralHint: { borderWidth: 1, borderStyle: 'dashed', borderColor: c.slate200, borderRadius: 8, padding: 7, color: c.slate400, fontSize: 6.8, textAlign: 'center', marginTop: 4 },
  badgeRose: { alignSelf: 'flex-start', backgroundColor: c.rose50, borderWidth: 1, borderColor: c.rose200, borderRadius: 5, color: c.rose600, fontSize: 6.4, fontWeight: 700, paddingVertical: 2, paddingHorizontal: 5, marginTop: 4 },

  table: { borderWidth: 1, borderColor: c.slate200, borderRadius: 7, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: c.slate50, borderBottomWidth: 1, borderBottomColor: c.slate200, paddingVertical: 5, paddingHorizontal: 7 },
  tableRow: { flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 7, borderTopWidth: 1, borderTopColor: c.slate100 },
  tableHeaderText: { fontSize: 6.2, fontWeight: 700, color: c.slate600 },
  tableText: { fontSize: 6.8, color: c.slate700 },
  tableTextStrong: { fontSize: 6.8, fontWeight: 700, color: c.slate700 },
  confirmBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.teal50, borderWidth: 1, borderColor: c.teal100, borderRadius: 8, padding: 8 },
  confirmText: { fontSize: 7.4, fontWeight: 700, color: c.teal800 },

  rankRow: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.teal200, backgroundColor: c.teal50, borderRadius: 7, paddingVertical: 4, paddingHorizontal: 6, marginBottom: 4 },
  rankNumber: { width: 13, height: 13, borderRadius: 6.5, backgroundColor: c.teal500, color: '#ffffff', fontSize: 6.4, fontWeight: 700, textAlign: 'center', paddingTop: 2, marginRight: 6 },
  rankLabel: { fontSize: 7.2, fontWeight: 700, color: c.teal900 },
  rankSub: { fontSize: 6.2, color: c.teal700, marginLeft: 5 },

  muscleRow: { flexDirection: 'row', gap: 8, alignItems: 'flex-end', marginBottom: 6 },
  muscleCol: { flex: 1, alignItems: 'center' },
  muscleCaption: { fontSize: 5.8, fontWeight: 700, color: c.slate400, letterSpacing: 0.8, marginBottom: 3 },
  muscleImage: { width: '100%', height: 128, objectFit: 'contain', borderRadius: 8, borderWidth: 1, borderColor: c.slate100 },

  guideBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: c.slate50, borderWidth: 1, borderColor: c.slate200, borderRadius: 8, padding: 12, gap: 16, marginTop: 14, flexShrink: 0 },
  guideImage: { width: 160, height: 112, objectFit: 'contain', borderRadius: 5, backgroundColor: '#ffffff', flexShrink: 0 },
  guideTitle: { fontSize: 6.6, fontWeight: 700, color: c.slate700, letterSpacing: 0.6, marginBottom: 2 },
  guideText: { fontSize: 6.8, color: c.slate600, lineHeight: 1.4 },

  odontogramRow: { flexDirection: 'row', gap: 2, marginBottom: 2 },
  toothLabel: { fontSize: 6.4, fontWeight: 700, color: c.slate600, textAlign: 'center' },
  toothTile: { borderWidth: 1, borderColor: c.slate200, borderRadius: 5, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', padding: 1 },
  toothTilePlaceholder: { borderWidth: 1, borderColor: c.slate100, borderRadius: 5, backgroundColor: c.slate50 },
  toothTileFinding: { borderColor: c.teal300 },
  toothImage: { objectFit: 'contain' },
  toothTags: { fontSize: 4.6, color: c.slate500, textAlign: 'center' },
  archCaption: { fontSize: 5.8, fontWeight: 700, color: c.slate400, letterSpacing: 0.8, marginVertical: 3 },
  toothDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toothDetail: { width: '49.3%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: c.slate200, borderRadius: 8, padding: 7 },
  toothDetailHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  toothDetailThumb: { width: 16, height: 26, objectFit: 'contain', marginRight: 5 },
  toothDetailNumber: { fontSize: 9, fontWeight: 700, color: c.slate900 },
  toothDetailType: { marginLeft: 'auto', fontSize: 5.8, color: c.teal700, backgroundColor: c.teal50, borderRadius: 6, paddingVertical: 2, paddingHorizontal: 5 },
  findingRow: { flexDirection: 'row', alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: c.slate100, paddingVertical: 4 },
  findingLabel: { width: '30%', fontSize: 5.9, fontWeight: 700, color: c.teal700, paddingRight: 5 },
  findingBody: { width: '70%' },
  findingValue: { fontSize: 6.5, color: c.slate700, lineHeight: 1.35 },
  findingNote: { fontSize: 5.9, color: c.slate500, lineHeight: 1.35, marginTop: 2 },

  contactCard: { borderWidth: 1, borderColor: c.slate200, borderRadius: 8, padding: 6, marginBottom: 7 },
  contactCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  contactCardTitle: { fontSize: 7.6, fontWeight: 700, color: c.slate800 },
  contactCardCount: { fontSize: 6, fontWeight: 700, color: c.teal700, backgroundColor: c.teal50, borderRadius: 6, paddingVertical: 1.5, paddingHorizontal: 5 },
  contactPairs: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 4 },
  contactPair: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: c.slate200, backgroundColor: c.slate50, borderRadius: 7, paddingVertical: 2, paddingHorizontal: 5 },
  contactPairInterference: { borderColor: c.rose200, backgroundColor: c.rose50 },
  contactPairDot: { width: 5, height: 5, borderRadius: 2.5, marginRight: 3 },
  contactPairText: { fontSize: 6.2, fontWeight: 700, color: c.slate700 },
  contactPairTextInterference: { color: c.rose700 },
  overviewRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  overviewStat: { flex: 1, backgroundColor: c.teal700, borderRadius: 8, padding: 7 },
  overviewValue: { fontSize: 12, fontWeight: 700, color: '#ffffff' },
  overviewLabel: { fontSize: 5.8, color: c.teal100, marginTop: 1 },

  imageGrid: { flexDirection: 'row', gap: 14, marginBottom: 18, flexShrink: 0 },
  imageCard: { width: (PAGE_WIDTH - PAGE_PADDING_X * 2 - 14) / 2, flexShrink: 0 },
  imageCardFull: { width: '100%', flexShrink: 0 },
  clinicalImage: { width: '100%', height: 210, objectFit: 'contain', backgroundColor: '#ffffff', flexShrink: 0 },
  imagePlaceholder: { width: '100%', height: 210, alignItems: 'center', justifyContent: 'center', backgroundColor: c.slate100 },
  imageCaption: { fontSize: 8, fontWeight: 700, color: c.slate800, lineHeight: 1.45, marginTop: 8 },
  imageMeta: { fontSize: 6.5, color: c.slate500, marginTop: 4 },
  imageFigure: { borderTopWidth: 2, borderTopColor: c.teal500, paddingTop: 7, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between' },
  imageFigureLabel: { fontSize: 7, fontWeight: 700, color: c.teal700 },
  imageFrame: { borderWidth: 1, borderColor: c.slate200, padding: 6, backgroundColor: '#ffffff' },
  xrayFrame: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: c.slate200, padding: 8, flexShrink: 0 },
  legendRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6, marginBottom: 6 },
  legendItem: { flexDirection: 'row', alignItems: 'center' },
  legendSwatch: { width: 7, height: 7, borderRadius: 2, marginRight: 3 },
  legendText: { fontSize: 6.4, color: c.slate600 },
});

type Assets = ChartPdfAssets;
type Selected = string | number | boolean | null | undefined | Array<string | number>;

const UPPER_TEETH = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const LOWER_TEETH = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];
const UPPER_OCCL_PLACEHOLDERS = new Set([13, 12, 11, 21, 22, 23]);
const LOWER_OCCL_PLACEHOLDERS = new Set([43, 42, 41, 31, 32, 33]);

const IMAGE_CATEGORIES = [
  { key: 'panoramic_xray', label: 'Panoramic X-ray' },
  { key: 'intraoral', label: 'Intraoral' },
  { key: 'other', label: 'Other' },
];

const CHART_SECTIONS = [
  { key: 'medical_history', label: 'Patient History' },
  { key: 'images', label: 'Image Gallery' },
  { key: 'extraoral_exam', label: 'Extraoral Exam' },
  { key: 'esthetic_evaluation', label: 'Esthetic Evaluation' },
  { key: 'vdo_evaluation', label: 'VDO Evaluation' },
  { key: 'dental_status', label: 'Dental Status' },
  { key: 'occlusal_analysis', label: 'Occlusal Analysis' },
  { key: 'residual_ridge_assessment', label: 'Residual Ridge Area' },
] as const;

const hiddenKeys = new Set([
  'patient_id', 'chart_id', 'dentist_id', 'history_id', 'exam_id', 'esthetic_id', 'vdo_id',
  'assessment_id', 'occlusal_id', 'status_id', 'tooth_id', 'contact_id', 'image_id',
  'created_at', 'updated_at', 'edentulous_id', 'caries_id', 'filling_id', 'periodontal_id',
  'vitality_id', 'restoration_id', 'implant_id', 'id',
]);

const isPresent = (value: unknown) => value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0);
const asRecord = (value: unknown): PdfExportRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as PdfExportRecord : {};
const asRecords = (value: unknown): PdfExportRecord[] => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as PdfExportRecord[] : [];
const asStrings = (value: unknown): string[] => Array.isArray(value) ? value.filter((item) => typeof item === 'string' || typeof item === 'number').map(String) : [];
const humanize = (key: string) => key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const pretty = (value: unknown): string => {
  if (!isPresent(value)) return 'Not recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.map(pretty).join(', ');
  if (typeof value === 'object') {
    const entries = Object.entries(value as PdfExportRecord).filter(([key, item]) => !hiddenKeys.has(key) && isPresent(item));
    return entries.length > 0 ? entries.map(([key, item]) => `${humanize(key)}: ${pretty(item)}`).join(' · ') : 'Not recorded';
  }
  return String(value).replace(/_/g, ' ');
};
const initials = (name: unknown) => pretty(name).split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');
const formatDate = (value: unknown) => {
  if (!isPresent(value)) return 'Not recorded';
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? pretty(value) : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};
const chunk = <T,>(items: T[], size: number) => Array.from({ length: Math.ceil(items.length / size) }, (_, index) => items.slice(index * size, (index + 1) * size));
const hnLabel = (value: unknown) => { const hn = pretty(value); return /^HN/i.test(hn) ? hn : `HN ${hn}`; };
const textOption = (value: string, label: string, sub?: string): PdfOption => ({ value, label, sub });
const yesNoGroup = (title: string, yesLabel = 'Yes', noLabel = 'No'): PdfOptionGroup => ({ title, options: [textOption('true', yesLabel), textOption('false', noLabel)] });
const boolKey = (value: unknown) => typeof value === 'boolean' ? String(value) : undefined;

function CheckIcon({ size = 6, color = '#ffffff' }: { size?: number; color?: string }) {
  return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M5 12.5l4.5 4.5L19 7.5" stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" /></Svg>;
}

function WarningIcon({ color }: { color: string }) {
  return <Svg width={9} height={9} viewBox="0 0 24 24" style={styles.alertIcon}><Path d="M12 3L2 21h20L12 3z" stroke={color} strokeWidth={2.2} fill="none" strokeLinejoin="round" /><Line x1="12" y1="10" x2="12" y2="14.5" stroke={color} strokeWidth={2.2} strokeLinecap="round" /><Circle cx="12" cy="17.6" r="1.2" fill={color} /></Svg>;
}

function ReportHeader({ data }: { data: ChartExportData }) {
  return (
    <View style={styles.reportHeader} fixed>
      <View style={styles.reportBrandRow}>
        <View style={styles.reportLogo}><Text style={styles.reportLogoText}>IDRS</Text></View>
        <View><Text style={styles.reportBrand}>Clinical Chart</Text><Text style={styles.reportBrandSub}>INTEGRATED DENTAL RECORD SYSTEM</Text></View>
      </View>
      <View style={styles.headerPatient}>
        <Text style={styles.headerPatientName}>{pretty(data.patient.name)}</Text>
        <Text style={styles.headerPatientMeta}>{hnLabel(data.patient.hn_number)}  ·  Visit {formatDate(data.chart.record_date)}</Text>
      </View>
    </View>
  );
}

function Footer({ section }: { section: string }) {
  return <View style={styles.footer} fixed><Text>{section}</Text><Text render={({ pageNumber, totalPages }) => `IDRS  ·  Page ${pageNumber} of ${totalPages}`} /></View>;
}

function SectionPage({ data, title, subtitle, children }: { data: ChartExportData; title: string; subtitle: string; children: ReactNode }) {
  return (
    <Page size="A4" style={styles.page}>
      <ReportHeader data={data} />
      <View style={styles.pageTitleBlock}><Text style={styles.pageEyebrow}>CLINICAL CHART</Text><Text style={styles.pageTitle}>{title}</Text><Text style={styles.pageSubtitle}>{subtitle}</Text></View>
      {children}
      <Footer section={title} />
    </Page>
  );
}

function Panel({ title, tone = 'default', children, wrap = true }: { title: string; tone?: 'default' | 'rose'; children: ReactNode; wrap?: boolean }) {
  return (
    <View style={styles.panel} wrap={wrap}>
      <View style={tone === 'rose' ? [styles.panelHeader, styles.panelHeaderRose] : styles.panelHeader} wrap={false} minPresenceAhead={40}>
        <View style={tone === 'rose' ? [styles.panelDot, { backgroundColor: c.rose500 }] : styles.panelDot} />
        <Text style={styles.panelTitle}>{title}</Text>
      </View>
      <View style={styles.panelBody}>{children}</View>
    </View>
  );
}

function FieldLabel({ children, eyebrow = false }: { children: ReactNode; eyebrow?: boolean }) {
  if (eyebrow) return <View style={styles.fieldEyebrow}><View style={styles.fieldEyebrowDot} /><Text style={styles.fieldEyebrowText}>{children}</Text></View>;
  return <Text style={styles.fieldLabel}>{children}</Text>;
}

function OptionCards({ group, selected, assets, columns, imageHeight = 56, title, eyebrow = false }: {
  group: PdfOptionGroup;
  selected: Selected;
  assets: Assets;
  columns?: number;
  imageHeight?: number;
  title?: string;
  eyebrow?: boolean;
}) {
  const chosen = new Set((Array.isArray(selected) ? selected : [selected]).filter(isPresent).map(String));
  const columnCount = columns ?? Math.min(group.options.length, 4);
  return (
    <View style={styles.field} wrap={false}>
      <FieldLabel eyebrow={eyebrow}>{title ?? group.title}</FieldLabel>
      {chosen.size === 0 && <Text style={styles.empty}>Not recorded</Text>}
      {chunk(group.options, columnCount).map((row, rowIndex) => (
        <View key={rowIndex} style={styles.optionRow}>
          {row.map((item) => {
            const active = chosen.has(item.value);
            const picture = item.image ? assets.pictures[item.image] : undefined;
            return (
              <View key={item.value} style={active ? [styles.optionCard, styles.optionCardActive] : styles.optionCard}>
                {picture && <Image src={picture} style={[styles.optionImage, { height: imageHeight, objectFit: group.imageFit ?? 'contain' }, ...(active ? [] : [styles.optionImageDimmed])]} />}
                <Text style={active ? [styles.optionLabel, styles.optionLabelActive] : styles.optionLabel}>{item.label}</Text>
                {item.sub && <Text style={active ? [styles.optionSub, styles.optionSubActive] : styles.optionSub}>{item.sub}</Text>}
                {active && <View style={styles.checkBadge}><CheckIcon /></View>}
              </View>
            );
          })}
          {Array.from({ length: columnCount - row.length }, (_, index) => <View key={`pad-${index}`} style={styles.optionPad} />)}
        </View>
      ))}
    </View>
  );
}

function ValueBox({ label, value, unit, eyebrow = false }: { label?: string; value: unknown; unit?: string; eyebrow?: boolean }) {
  return (
    <View style={styles.field} wrap={false}>
      {label && <FieldLabel eyebrow={eyebrow}>{label}</FieldLabel>}
      <View style={styles.valueBox}>
        {isPresent(value) ? <Text style={styles.valueText}>{pretty(value)}</Text> : <Text style={styles.valueEmpty}>Not recorded</Text>}
        {unit && <Text style={styles.valueUnit}>{unit}</Text>}
      </View>
    </View>
  );
}

function TextBlock({ label, value, required = false }: { label: string; value: unknown; required?: boolean }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}{required && <Text style={styles.requiredMark}> *</Text>}</Text>
      <View style={styles.textBlock}><Text style={isPresent(value) ? styles.textBlockText : styles.valueEmpty}>{isPresent(value) ? String(value) : 'Not recorded'}</Text></View>
    </View>
  );
}

function Notes({ value }: { value: unknown }) {
  if (!isPresent(value)) return null;
  return <Panel title="Clinical Notes" wrap><Text style={styles.textBlockText}>{String(value)}</Text></Panel>;
}

function Alert({ tone, title, text }: { tone: 'rose' | 'amber'; title: string; text?: string }) {
  const rose = tone === 'rose';
  return (
    <View style={rose ? styles.alertRose : styles.alertAmber} wrap={false}>
      <WarningIcon color={rose ? c.rose600 : c.amber700} />
      <View style={styles.col}><Text style={rose ? styles.alertTitleRose : styles.alertTitleAmber}>{title}</Text>{text && <Text style={rose ? styles.alertTextRose : styles.alertTextAmber}>{text}</Text>}</View>
    </View>
  );
}

function sectionRecorded(data: ChartExportData, key: typeof CHART_SECTIONS[number]['key']) {
  if (key === 'images') return data.images.length > 0;
  if (key === 'dental_status') return asRecords(data.dental_status?.teeth).length > 0;
  return Boolean(data[key]);
}

function CoverPage({ data }: { data: ChartExportData }) {
  const recorded = CHART_SECTIONS.filter((section) => sectionRecorded(data, section.key)).length;
  const findings = asRecords(data.dental_status?.teeth).filter(toothHasFinding).length;
  const allergy = data.medical_history?.allergy_status === 'yes' ? data.medical_history?.allergy_detail : data.patient.allergy;
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverHero}>
        <Text style={styles.coverBrand}>IDRS  /  CLINICAL DOCUMENTATION</Text>
        <Text style={styles.coverTitle}>{'Comprehensive\nDental Chart'}</Text>
        <Text style={styles.coverSubtitle}>A structured clinical record for assessment, diagnosis support, treatment planning, and continuity of care.</Text>
        <View style={styles.coverRecord}><Text style={styles.coverRecordLabel}>VISIT DATE</Text><Text style={styles.coverRecordValue}>{formatDate(data.chart.record_date)}</Text></View>
      </View>
      <View style={styles.coverBody}>
        <View style={styles.patientCard}>
          <View style={styles.patientAvatar}><Text style={styles.patientInitials}>{initials(data.patient.name)}</Text></View>
          <View><Text style={styles.patientName}>{pretty(data.patient.name)}</Text><Text style={styles.patientMeta}>{hnLabel(data.patient.hn_number)}  ·  {pretty(data.patient.sex)}  ·  {pretty(data.patient.age)} years</Text><Text style={styles.patientMeta}>{pretty(data.patient.phone)}</Text></View>
          <View style={styles.patientAside}><Text style={styles.patientAsideLabel}>CHART STATUS</Text><Text style={styles.patientAsideValue}>{recorded} of {CHART_SECTIONS.length} sections recorded</Text></View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{recorded}</Text><Text style={styles.statLabel}>Recorded chart sections</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{findings}</Text><Text style={styles.statLabel}>Teeth with recorded findings</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{data.occlusal_contacts.length}</Text><Text style={styles.statLabel}>Mapped occlusal contacts</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{data.images.length}</Text><Text style={styles.statLabel}>Clinical images</Text></View>
        </View>
        {isPresent(allergy) && <Alert tone="rose" title="Allergy alert" text={pretty(allergy)} />}
        <Text style={styles.coverSectionTitle}>Document contents</Text>
        <View style={styles.indexGrid}>
          {CHART_SECTIONS.map((section, position) => (
            <View key={section.key} style={styles.indexItem}>
              <Text style={styles.indexNumber}>{String(position + 1).padStart(2, '0')}</Text>
              <Text style={styles.indexLabel}>{section.label}</Text>
              <Text style={styles.indexStatus}>{sectionRecorded(data, section.key) ? 'Recorded' : 'Not recorded'}</Text>
            </View>
          ))}
        </View>
      </View>
      <Footer section="Comprehensive Dental Chart" />
    </Page>
  );
}

function MedicationTable({ value }: { value: unknown }) {
  const medications = asRecords(value);
  if (medications.length === 0) {
    return <View style={styles.confirmBox}><CheckIcon size={8} color={c.teal600} /><Text style={[styles.confirmText, { marginLeft: 5 }]}>Confirmed: No Current Medications</Text></View>;
  }
  const columns = [{ label: 'Name', width: '34%' }, { label: 'Dose', width: '18%' }, { label: 'Freq', width: '18%' }, { label: 'Schedule', width: '30%' }];
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}>{columns.map((column) => <Text key={column.label} style={[styles.tableHeaderText, { width: column.width }]}>{column.label}</Text>)}</View>
      {medications.map((medication, index) => (
        <View key={String(medication.id ?? index)} style={styles.tableRow} wrap={false}>
          <Text style={[styles.tableTextStrong, { width: '34%' }]}>{pretty(medication.name)}</Text>
          <Text style={[styles.tableText, { width: '18%' }]}>{isPresent(medication.dose) ? `${String(medication.dose)} tab` : 'Not recorded'}</Text>
          <Text style={[styles.tableText, { width: '18%' }]}>{isPresent(medication.frequency) ? `${String(medication.frequency)} x/day` : 'Not recorded'}</Text>
          <Text style={[styles.tableText, { width: '30%' }]}>{isPresent(medication.timeOfDay) ? String(medication.timeOfDay) : 'Not recorded'}</Text>
        </View>
      ))}
    </View>
  );
}

function PatientHistoryPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const history = data.medical_history ?? {};
  const visits = history.regular_doctor_visits;
  const expectations = asStrings(history.patient_expectation);
  return (
    <SectionPage data={data} title="Patient History" subtitle="The patient's medical and dental background.">
      <View style={styles.summaryStrip}>
        {[['PATIENT NAME', pretty(data.patient.name)], ['SEX / AGE', `${pretty(data.patient.sex)} / ${pretty(data.patient.age)}`], ['HN', pretty(data.patient.hn_number)], ['VISIT DATE', formatDate(data.chart.record_date)]].map(([label, value]) => (
          <View key={label} style={styles.col}><Text style={styles.summaryLabel}>{label}</Text><Text style={styles.summaryValue}>{value}</Text></View>
        ))}
      </View>
      <Panel title="Primary Concerns">
        <TextBlock label="Chief Complaint" value={history.chief_complaint} required />
        <TextBlock label="Present Illness" value={history.present_illness} required />
      </Panel>
      <Panel title="Medical Information" wrap>
        <View style={styles.row}>
          <View style={styles.col}><TextBlock label="Medical History" value={history.medical_history} /></View>
          <View style={styles.col}>
            <OptionCards group={yesNoGroup('Regular Doctor Visits?')} selected={boolKey(visits)} assets={assets} />
            {visits === true && <View style={styles.row}><View style={styles.col}><ValueBox label="Every" value={history.regular_doctor_months} unit={history.regular_doctor_months === 1 ? 'month' : 'months'} /></View><View style={styles.col}><ValueBox label="Clinic / hospital" value={history.clinic_name} /></View></View>}
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.field}><FieldLabel>Current Medications</FieldLabel><MedicationTable value={history.current_medication} /></View>
        <OptionCards
          group={{ title: 'Known Allergies', options: [textOption('no', 'Deny'), textOption('dont_know', "Don't know"), textOption('yes', 'Yes, has allergies')] }}
          selected={history.allergy_status as string | undefined}
          assets={assets}
        />
        {history.allergy_status === 'yes' && <Alert tone="rose" title="Allergic items" text={pretty(history.allergy_detail)} />}
      </Panel>
      <Panel title="Dental Background & Expectations">
        <TextBlock label="Dental History" value={history.dental_history} />
        <TextBlock label="Patient Self Evaluation" value={history.patient_self_evaluation} />
        <View style={styles.field} wrap={false}>
          <FieldLabel>Patient Expectations (Ranked)</FieldLabel>
          {expectations.length > 0 ? expectations.map((value, index) => {
            const item = EXPECTATION_OPTIONS.find((candidate) => candidate.value === value);
            const isOther = value === 'others';
            return (
              <View key={value} style={styles.rankRow}>
                <Text style={styles.rankNumber}>{index + 1}</Text>
                <Text style={styles.rankLabel}>{isOther ? 'Others' : item?.label ?? pretty(value)}</Text>
                <Text style={styles.rankSub}>{isOther ? pretty(history.patient_expectation_other) : item?.sub}</Text>
              </View>
            );
          }) : <Text style={styles.empty}>No expectations ranked.</Text>}
        </View>
        <TextBlock label="Expected Outcome / Notes" value={history.patient_expected_outcome} />
      </Panel>
      <Panel title="Edentulous History" wrap={false}>
        <View style={styles.row}>
          <View style={styles.col}><ValueBox label="Length of time edentulous" value={history.edentulous_time} /></View>
          <View style={styles.col}><ValueBox label="Number of previous denture" value={history.previous_denture_count} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}><ValueBox label="Age of present denture" value={history.present_denture_age} /></View>
          <View style={styles.col}><ValueBox label="Nature of complaint" value={history.denture_complaint} /></View>
        </View>
      </Panel>
      <Notes value={history.note} />
    </SectionPage>
  );
}

function PanoramicHero({ image, assets }: { image: PdfExportRecord; assets: Assets }) {
  const src = assets.clinicalImages[String(image.image_id)] ?? (assets.warnings === undefined && typeof image.image_url === 'string' ? image.image_url : undefined);
  const height = 360;
  return (
    <View style={styles.field} wrap={false}>
      <View style={styles.xrayFrame}>
        {src ? (
          <Image src={src} style={{ width: '100%', height, objectFit: 'contain', flexShrink: 0 }} />
        ) : <View style={[styles.imagePlaceholder, { height }]}><Text style={styles.empty}>Image unavailable</Text></View>}
      </View>
      <Text style={styles.imageCaption}>{isPresent(image.description) ? String(image.description) : 'Panoramic X-ray'}</Text>
      <Text style={styles.imageMeta}>{`Uploaded ${formatDate(image.uploaded_at)}`}</Text>
    </View>
  );
}

function ClinicalImageCard({ image, assets, number, fullWidth = false }: { image: PdfExportRecord; assets: Assets; number: number; fullWidth?: boolean }) {
  const src = assets.clinicalImages[String(image.image_id)] ?? (assets.warnings === undefined && typeof image.image_url === 'string' ? image.image_url : undefined);
  const height = fullWidth ? 380 : 210;
  return (
    <View style={fullWidth ? styles.imageCardFull : styles.imageCard} wrap={false}>
      <View style={styles.imageFigure}>
        <Text style={styles.imageFigureLabel}>{`IMAGE ${String(number).padStart(2, '0')}`}</Text>
        <Text style={styles.imageMeta}>{formatDate(image.uploaded_at)}</Text>
      </View>
      <View style={styles.imageFrame}>
        {src ? <Image src={src} style={[styles.clinicalImage, { height }]} /> : <View style={[styles.imagePlaceholder, { height }]}><Text style={styles.empty}>Image unavailable</Text></View>}
      </View>
      <Text style={styles.imageCaption}>{isPresent(image.description) ? String(image.description) : 'No description'}</Text>
    </View>
  );
}

function AiFindings({ analysis }: { analysis: ChartPdfAiAnalysis }) {
  const detections = [...analysis.result.detections].sort((left, right) => (left.tooth_fdi ?? 99) - (right.tooth_fdi ?? 99));
  const counts = new Map<string, number>();
  detections.forEach((detection) => counts.set(detection.disease, (counts.get(detection.disease) ?? 0) + 1));
  return (
    <Panel title="AI Detection Results" wrap>
      <Alert tone="amber" title="AI suggestions require clinical review" text="AI results are not a diagnosis. Findings must be confirmed by the treating dentist." />
      <View style={styles.legendRow}>
        {ALL_DISEASE_NAMES.map((name) => <View key={name} style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: diseaseColor(name) }]} /><Text style={styles.legendText}>{`${name} (${counts.get(name) ?? 0})`}</Text></View>)}
      </View>
      {detections.length > 0 ? (
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { width: '10%' }]}>#</Text>
            <Text style={[styles.tableHeaderText, { width: '20%' }]}>Tooth (FDI)</Text>
            <Text style={[styles.tableHeaderText, { width: '45%' }]}>Condition</Text>
            <Text style={[styles.tableHeaderText, { width: '25%' }]}>Confidence</Text>
          </View>
          {detections.map((detection, index) => (
            <View key={index} style={styles.tableRow} wrap={false}>
              <Text style={[styles.tableText, { width: '10%' }]}>{index + 1}</Text>
              <Text style={[styles.tableTextStrong, { width: '20%' }]}>{detection.tooth_fdi ?? 'Unassigned'}</Text>
              <View style={{ width: '45%', flexDirection: 'row', alignItems: 'center' }}><View style={[styles.legendSwatch, { backgroundColor: diseaseColor(detection.disease) }]} /><Text style={styles.tableText}>{detection.disease}</Text></View>
              <Text style={[styles.tableText, { width: '25%' }]}>{`${(detection.confidence * 100).toFixed(1)}%`}</Text>
            </View>
          ))}
        </View>
      ) : <Text style={styles.empty}>No findings detected on this X-ray.</Text>}
    </Panel>
  );
}

function ImageGalleryPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  if (data.images.length === 0) {
    return <SectionPage data={data} title="Image Gallery" subtitle="Clinical photographs and radiographs attached to this chart."><Text style={styles.empty}>No clinical images recorded for this chart.</Text></SectionPage>;
  }
  return (
    <>
      {IMAGE_CATEGORIES.map((category) => {
        const images = data.images.filter((image) => image.image_type === category.key);
        const perPage = category.key === 'panoramic_xray' ? 1 : 4;
        return chunk(images, perPage).map((group, pageIndex) => (
          <SectionPage key={`${category.key}-${pageIndex}`} data={data} title={`Image Gallery / ${category.label}`} subtitle={`${pageIndex * perPage + 1}-${pageIndex * perPage + group.length} of ${images.length} images  |  Visit ${formatDate(data.chart.record_date)}`}>
            {category.key === 'panoramic_xray'
              ? <PanoramicHero image={group[0]} assets={assets} />
              : chunk(group, 2).map((row, rowIndex) => (
                <View key={rowIndex} style={styles.imageGrid} wrap={false}>
                  {row.map((image, columnIndex) => <ClinicalImageCard key={String(image.image_id)} image={image} assets={assets} number={pageIndex * perPage + rowIndex * 2 + columnIndex + 1} fullWidth={group.length === 1} />)}
                </View>
              ))}
          </SectionPage>
        ));
      })}
      {assets.aiAnalyses.filter((analysis) => data.images.some((image) => String(image.image_id) === analysis.imageId)).map((analysis, index) => (
        <SectionPage key={`${analysis.imageId}-${index}`} data={data} title="AI Detection Results" subtitle="Recorded findings from the chart's panoramic X-ray; clinical images are shown separately.">
          <AiFindings analysis={analysis} />
        </SectionPage>
      ))}
    </>
  );
}

function ExtraoralPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const exam = data.extraoral_exam ?? {};
  const muscles = asStrings(exam.muscle_pain);
  const opening = Number(exam.mouth_opening_mm);
  const wear = asRecord(exam.factors_affecting_tooth_wear);
  const habits = [...asStrings(exam.parafunctional_habit), ...(isPresent(exam.parafunctional_habit_other) ? ['other'] : [])];
  const wearDetails = [['Hard food', wear.wearHardFoodDetail], ['Acid Beverage', wear.wearAcidBeverageDetail], ['Other', wear.wearOtherDetail]].filter(([, value]) => isPresent(value));
  const views = [['RIGHT SIDE', assets.muscleViews.right], ['FRONT VIEW', assets.muscleViews.front], ['LEFT SIDE', assets.muscleViews.left]] as const;
  return (
    <SectionPage data={data} title="Extraoral Examination" subtitle="Facial symmetry, TMJ, muscle pain, and habits assessment.">
      <Panel title="Facial Appearance">
        <OptionCards group={EXTRAORAL_GROUPS.facialSymmetry} selected={exam.facial_symmetry as string} assets={assets} imageHeight={92} />
        <OptionCards group={EXTRAORAL_GROUPS.facialProfile} selected={exam.facial_profile as string} assets={assets} imageHeight={92} />
      </Panel>
      <Panel title="Muscles & TMJ Assessment">
        <View wrap={false}>
          <FieldLabel>Muscle Pain</FieldLabel>
          {views.some(([, src]) => src) && (
            <View style={styles.muscleRow}>
              {views.map(([caption, src]) => <View key={caption} style={styles.muscleCol}><Text style={styles.muscleCaption}>{caption}</Text>{src && <Image src={src} style={styles.muscleImage} />}</View>)}
            </View>
          )}
          <View style={[styles.chips, { marginBottom: 9 }]}>
            {muscles.length > 0 ? muscles.map((id) => <Text key={id} style={styles.roseChip}>{`${formatMuscleName(id)} (${id.endsWith('-L') ? 'Left' : 'Right'})`}</Text>) : <Text style={styles.empty}>No muscle pain recorded (absence of pain not confirmed).</Text>}
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={EXTRAORAL_GROUPS.jointPain} selected={asStrings(exam.joint_pain)} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={EXTRAORAL_GROUPS.jawDeviation} selected={exam.jaw_deviation as string} assets={assets} /></View>
        </View>
        <OptionCards group={EXTRAORAL_GROUPS.jointSound} selected={exam.joint_sound as string} assets={assets} />
        <View style={styles.divider} />
        <View style={styles.row}>
          <View style={styles.col}>
            <ValueBox label="Maximum Mouth Opening" value={exam.mouth_opening_mm} unit="mm" />
            {opening > 0 && opening < 35 && <Text style={styles.badgeRose}>Limited opening</Text>}
          </View>
          <View style={styles.col}>
            <OptionCards group={EXTRAORAL_GROUPS.limitedMovement} selected={boolKey(exam.has_limited_movement)} assets={assets} />
            {exam.has_limited_movement === true && <ValueBox value={exam.specify_movement_detail} />}
          </View>
        </View>
      </Panel>
      <Panel title="Habits & Factors Affecting Tooth Wear">
        <OptionCards group={EXTRAORAL_GROUPS.habits} selected={habits} assets={assets} columns={5} />
        {isPresent(exam.parafunctional_habit_other) && <ValueBox label="Other habit" value={exam.parafunctional_habit_other} />}
        <OptionCards group={EXTRAORAL_GROUPS.toothWear} selected={Object.keys(wear).filter((key) => wear[key] === true)} assets={assets} columns={3} />
        {wearDetails.map(([label, value]) => <ValueBox key={String(label)} label={`${String(label)} detail`} value={value} />)}
      </Panel>
      <Notes value={exam.note} />
    </SectionPage>
  );
}

function EstheticPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const esthetic = data.esthetic_evaluation ?? {};
  const dentofacial = asRecord(esthetic.dentofacial_analysis);
  const lipGuide = assets.pictures[LIP_GUIDE_IMAGE];
  return (
    <>
    <SectionPage data={data} title="Esthetic Evaluation / Facial Analysis" subtitle="Occlusal plane, nasolabial angle, and facial-to-dental midline.">
      <Panel title="1. Facial Analysis">
        <OptionCards group={ESTHETIC_GROUPS.occlusalPlane} selected={esthetic.occlusal_plane as string} assets={assets} imageHeight={118} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.nasolabialAngle} selected={esthetic.nasolabial_angle as string} assets={assets} imageHeight={118} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.midline} selected={esthetic.midline_discrepancy as string} assets={assets} imageHeight={108} />
        {isPresent(esthetic.midline_discrepancy) && esthetic.midline_discrepancy !== 'symmetric' && <ValueBox label="Midline shift" value={esthetic.midline_shift} unit="mm" />}
      </Panel>
    </SectionPage>
    <SectionPage data={data} title="Esthetic Evaluation / Lip at Rest" subtitle="Lip fullness, length, and tooth exposure at rest.">
      <Panel title="2. Lip at Rest">
        <OptionCards group={ESTHETIC_GROUPS.lipFullness} selected={esthetic.lip_thickness as string} assets={assets} imageHeight={140} />
        <OptionCards group={ESTHETIC_GROUPS.lipLength} selected={esthetic.lip_length as string} assets={assets} />
        <View style={styles.divider} />
        <FieldLabel>Tooth Exposure at Rest</FieldLabel>
        <View style={styles.row} wrap={false}>
          <View style={styles.col}><ValueBox label="Upper" value={esthetic.upper_tooth_exposure} unit="mm" /></View>
          <View style={styles.col}><ValueBox label="Lower" value={esthetic.lower_tooth_exposure} unit="mm" /></View>
        </View>
        {lipGuide && (
          <View style={styles.guideBox} wrap={false}>
            <Image src={lipGuide} style={styles.guideImage} />
            <View style={styles.col}><Text style={styles.guideTitle}>LIP MEASUREMENT GUIDE</Text><Text style={styles.guideText}>Measure from the base of the nose to the bottom edge of the upper lip. Record in millimeters.</Text></View>
          </View>
        )}
      </Panel>
    </SectionPage>
    <SectionPage data={data} title="Esthetic Evaluation / Smile Analysis" subtitle="Smile line, incisal silhouette, tooth display, and lower lip relationship.">
      <Panel title="3. Dentofacial Analysis / Smile">
        <OptionCards group={ESTHETIC_GROUPS.smileLine} selected={dentofacial.smile_line as string} assets={assets} imageHeight={92} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.incisalCurve} selected={dentofacial.incisal_curve as string} assets={assets} imageHeight={92} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.teethExposed} selected={dentofacial.teeth_exposed as string} assets={assets} imageHeight={82} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.lipPosition} selected={dentofacial.lip_position as string} assets={assets} imageHeight={92} eyebrow />
      </Panel>
    </SectionPage>
    <SectionPage data={data} title="Esthetic Evaluation / Midline & Phonetics" subtitle="Midline alignment, buccal corridor, and F-V sound assessment.">
      <Panel title="3. Dentofacial Analysis / Alignment">
        <OptionCards group={ESTHETIC_GROUPS.midlinePhiltrum} selected={dentofacial.midline_philtrum as string} assets={assets} imageHeight={90} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.midlineIncisors} selected={dentofacial.midline_incisors as string} assets={assets} imageHeight={90} eyebrow />
        <OptionCards group={ESTHETIC_GROUPS.buccalCorridor} selected={dentofacial.buccal_corridor as string} assets={assets} imageHeight={90} eyebrow />
      </Panel>
      <Panel title="4. Phonetics" wrap={false}>
        <OptionCards group={ESTHETIC_GROUPS.fvSound} selected={boolKey(esthetic.fv_sound)} assets={assets} title="F-V Sound — incisal edge of maxillary centrals on wet/dry line of lower lip?" />
        {(isPresent(esthetic.closest_speaking) || isPresent(esthetic.reference_teeth)) && <View style={styles.row}>
          <View style={styles.col}><ValueBox label="Closest Speaking Space" value={esthetic.closest_speaking} unit="mm" /></View>
          <View style={styles.col}><ValueBox label="Reference Teeth" value={asStrings(esthetic.reference_teeth).join(', ')} /></View>
        </View>}
      </Panel>
      <Notes value={esthetic.note} />
    </SectionPage>
    </>
  );
}

function VdoPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const vdo = data.vdo_evaluation ?? {};
  const freeWaySpace = Number(vdo.free_way_space);
  return (
    <SectionPage data={data} title="VDO Evaluation" subtitle="Vertical dimension of occlusion, facial soft tissue, and bite assessment.">
      <Panel title="Facial Soft Tissue Contour" wrap={false}>
        <OptionCards group={VDO_GROUPS.softTissue} selected={asStrings(vdo.facial_soft_tissue)} assets={assets} title="Present conditions" />
      </Panel>
      <Panel title="Functional & Bite Assessment" wrap={false}>
        <View style={styles.row}>
          <View style={styles.col}>
            <ValueBox label="Closest Speaking Space" value={vdo.closest_speaking} unit="mm" />
            <ValueBox label="Reference Teeth" value={asStrings(vdo.reference_teeth).join(', ')} />
          </View>
          <View style={styles.col}><OptionCards group={VDO_GROUPS.biteType} selected={vdo.bite_type as string} assets={assets} columns={2} /></View>
        </View>
      </Panel>
      <Panel title="Free-way Space" wrap={false}>
        <View style={styles.row}>
          <View style={styles.col}><ValueBox label="Free-way space (VDO - VDR)" value={vdo.free_way_space} unit="mm" /></View>
          <View style={styles.col}>
            {!isPresent(vdo.free_way_space) ? <Text style={styles.empty}>Not recorded</Text> : freeWaySpace > 4
              ? <Alert tone="rose" title="Loss of VDO Indicated" text="A free-way space greater than 4mm suggests a loss of Vertical Dimension." />
              : <Text style={styles.neutralHint}>Expected normal range is up to 4mm</Text>}
          </View>
        </View>
      </Panel>
      <Notes value={vdo.note} />
    </SectionPage>
  );
}

const odontogramStatePrefix = 'IDRS_ODONTOGRAM_STATE_V1:';

type ToothFinding = { label: string; value: string; note?: string };

function decodeOdontogramState(note: unknown): PdfExportRecord | null {
  if (typeof note !== 'string' || !note.startsWith(odontogramStatePrefix)) return null;
  try {
    const parsed = JSON.parse(note.slice(odontogramStatePrefix.length));
    return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed as PdfExportRecord : null;
  } catch {
    return null;
  }
}

function cleanNote(note: unknown) {
  return typeof note === 'string' && note.trim() && !note.startsWith(odontogramStatePrefix) ? note.trim() : undefined;
}

function findingValue(record: PdfExportRecord, fields: Array<{ key: string; label: string; unit?: string }>) {
  return fields
    .filter(({ key }) => isPresent(record[key]))
    .map(({ key, label, unit = '' }) => `${label}: ${pretty(record[key])}${unit}`)
    .join(' | ');
}

function odontogramStateFindings(note: unknown): ToothFinding[] {
  const state = decodeOdontogramState(note);
  if (!state) return [];

  const conditions: string[] = [];
  const selection = String(state.toothSelection ?? '');
  const fractureSurfaces = new Set<string>();
  if (state.brokenMesial || selection.includes('mesial')) fractureSurfaces.add('Mesial');
  if (state.brokenIncisal || selection.includes('inicisal')) fractureSurfaces.add('Incisal');
  if (state.brokenDistal || selection.includes('distal')) fractureSurfaces.add('Distal');
  if (fractureSurfaces.size > 0 || state.crownMaterial === 'broken') conditions.push(`Fracture${fractureSurfaces.size > 0 ? ` (${Array.from(fractureSurfaces).join(', ')})` : ''}`);

  if (selection === 'tooth-crownprep') conditions.push('Crown preparation');
  if (selection === 'tooth-radix') conditions.push('Retained root');
  if (state.fissureSealing) conditions.push('Fissure sealant');
  if (state.contactMesial || state.contactDistal) {
    const sides = [state.contactMesial && 'mesial', state.contactDistal && 'distal'].filter(Boolean).join(', ');
    conditions.push(`Missing contact (${sides})`);
  }
  if (state.bruxismWear) conditions.push('Occlusal wear from bruxism');
  if (state.bruxismNeckWear) conditions.push('Cervical wear from bruxism');
  if (state.extractionPlan) conditions.push('Planned extraction');
  if (state.endoResection) conditions.push('Endodontic resection');
  if (state.parapulpalPin) conditions.push('Parapulpal pin');
  if (state.crownReplace) conditions.push('Crown replacement indicated');
  if (state.crownNeeded) conditions.push('Crown indicated');
  if (state.missingClosed) conditions.push('Closed edentulous space');
  if (state.bridgePillar) conditions.push('Bridge abutment');
  if (isPresent(state.bridgeUnit) && state.bridgeUnit !== 'none') conditions.push(`Bridge unit: ${pretty(state.bridgeUnit)}`);

  const findings: ToothFinding[] = conditions.length > 0 ? [{ label: 'Other findings', value: conditions.join(', ') }] : [];
  const notes = [cleanNote(state.note), cleanNote(state.othersNote)].filter(Boolean) as string[];
  if (notes.length > 0) findings.push({ label: 'Clinical note', value: notes.join(' | ') });
  return findings;
}

function toothFindings(tooth: PdfExportRecord): ToothFinding[] {
  const findings: ToothFinding[] = [];
  const edentulous = asRecord(tooth.edentulous);
  if (Object.keys(edentulous).length > 0) findings.push({ label: 'Edentulous', value: findingValue(edentulous, [{ key: 'edentulous_type', label: 'Type' }]), note: cleanNote(edentulous.note) });

  asRecords(tooth.caries).forEach((caries, index) => findings.push({
    label: `Caries ${index + 1}`,
    value: findingValue(caries, [{ key: 'surface', label: 'Surface' }, { key: 'depth', label: 'Depth' }]),
    note: cleanNote(caries.note),
  }));
  asRecords(tooth.fillings).forEach((filling, index) => findings.push({
    label: `Filling ${index + 1}`,
    value: findingValue(filling, [{ key: 'surfaces', label: 'Surfaces' }, { key: 'material', label: 'Material' }, { key: 'size_mm', label: 'Size', unit: ' mm' }]),
    note: cleanNote(filling.note),
  }));

  const periodontal = asRecord(tooth.periodontal);
  if (Object.keys(periodontal).length > 0) findings.push({ label: 'Periodontal', value: findingValue(periodontal, [{ key: 'mobility_grade', label: 'Mobility' }, { key: 'recession_mm', label: 'Recession', unit: ' mm' }]), note: cleanNote(periodontal.note) });
  const vitality = asRecord(tooth.vitality);
  if (Object.keys(vitality).length > 0) findings.push({ label: 'Pulp / endodontic', value: findingValue(vitality, [{ key: 'pulp_status', label: 'Pulp' }, { key: 'ept_result', label: 'EPT' }, { key: 'root_canal_treated', label: 'Root canal' }]), note: cleanNote(vitality.note) });
  const restoration = asRecord(tooth.restorations);
  if (Object.keys(restoration).length > 0) findings.push({ label: 'Restoration', value: findingValue(restoration, [{ key: 'restoration_type', label: 'Type' }, { key: 'material', label: 'Material' }, { key: 'post_type', label: 'Post' }]), note: cleanNote(restoration.note) });
  const implant = asRecord(tooth.implant);
  if (Object.keys(implant).length > 0) findings.push({ label: 'Implant', value: findingValue(implant, [{ key: 'component_type', label: 'Component' }, { key: 'retention_type', label: 'Retention' }, { key: 'material', label: 'Material' }, { key: 'brand', label: 'Implant brand' }, { key: 'crown_brand', label: 'Crown brand' }]), note: cleanNote(implant.note) });

  findings.push(...odontogramStateFindings(tooth.note));
  const note = cleanNote(tooth.note);
  if (note) findings.push({ label: 'Clinical note', value: note });
  return findings.filter((finding) => finding.value || finding.note);
}

function toothHasFinding(tooth: PdfExportRecord) {
  return tooth.tooth_type !== 'permanent' || toothFindings(tooth).length > 0;
}

function toothTags(tooth: PdfExportRecord | undefined) {
  if (!tooth) return ['NR'];
  const tags: string[] = [];
  if (tooth.tooth_type === 'edentulous' || tooth.edentulous) tags.push('EDEN');
  if (tooth.tooth_type === 'implant' || tooth.implant) tags.push('IMP');
  if (asRecords(tooth.caries).length > 0) tags.push(`CAR${asRecords(tooth.caries).length}`);
  if (asRecords(tooth.fillings).length > 0) tags.push(`FIL${asRecords(tooth.fillings).length}`);
  const vitality = asRecord(tooth.vitality);
  if (isPresent(vitality.root_canal_treated) && vitality.root_canal_treated !== 'no') tags.push('RCT');
  if (tooth.restorations) tags.push('REST');
  return tags.length > 0 ? tags : ['OK'];
}

const ODONTOGRAM_GAP = 2;
const TOOTH_TILE_WIDTH = (PANEL_INNER_WIDTH - (ODONTOGRAM_GAP * 15)) / 16;

function ToothTile({ toothNo, image, height, tooth, imageHeight }: { toothNo: number; image?: string; height: number; tooth?: PdfExportRecord; imageHeight: number }) {
  const style = [styles.toothTile, { width: TOOTH_TILE_WIDTH, height }, ...(tooth && toothHasFinding(tooth) ? [styles.toothTileFinding] : [])];
  return (
    <View style={style}>
      {image
        ? <Image src={image} style={[styles.toothImage, { width: TOOTH_TILE_WIDTH - 4, height: imageHeight }]} />
        : <Text style={styles.toothTags}>{toothTags(tooth).join('\n')}</Text>}
      {!image && <Text style={styles.toothTags}>{toothNo}</Text>}
    </View>
  );
}

function OdontogramChart({ records, assets }: { records: Map<number, PdfExportRecord>; assets: Assets }) {
  const hasImages = Object.keys(assets.teeth.side).length > 0;
  const labelRow = (teeth: number[]) => <View style={styles.odontogramRow}>{teeth.map((toothNo) => <Text key={toothNo} style={[styles.toothLabel, { width: TOOTH_TILE_WIDTH }]}>{toothNo}</Text>)}</View>;
  const sideRow = (teeth: number[]) => <View style={styles.odontogramRow}>{teeth.map((toothNo) => <ToothTile key={toothNo} toothNo={toothNo} image={assets.teeth.side[toothNo]} tooth={records.get(toothNo)} height={hasImages ? 58 : 42} imageHeight={52} />)}</View>;
  const occlRow = (teeth: number[], placeholders: Set<number>) => (
    <View style={styles.odontogramRow}>
      {teeth.map((toothNo) => placeholders.has(toothNo) || !assets.teeth.occl[toothNo]
        ? <View key={toothNo} style={[styles.toothTilePlaceholder, { width: TOOTH_TILE_WIDTH, height: 30 }]} />
        : <ToothTile key={toothNo} toothNo={toothNo} image={assets.teeth.occl[toothNo]} tooth={records.get(toothNo)} height={30} imageHeight={25} />)}
    </View>
  );
  return (
    <View wrap={false}>
      <Text style={styles.archCaption}>MAXILLARY ARCH</Text>
      {labelRow(UPPER_TEETH)}
      {sideRow(UPPER_TEETH)}
      {hasImages && occlRow(UPPER_TEETH, UPPER_OCCL_PLACEHOLDERS)}
      <View style={{ height: 6 }} />
      {hasImages && occlRow(LOWER_TEETH, LOWER_OCCL_PLACEHOLDERS)}
      {sideRow(LOWER_TEETH)}
      {labelRow(LOWER_TEETH)}
      <Text style={styles.archCaption}>MANDIBULAR ARCH</Text>
    </View>
  );
}

function ToothDetailCard({ tooth, assets }: { tooth: PdfExportRecord; assets: Assets }) {
  const lines = toothFindings(tooth);
  const thumb = assets.teeth.side[Number(tooth.tooth_number)];
  return (
    <View style={styles.toothDetail} wrap={false}>
      <View style={styles.toothDetailHeader}>
        {thumb && <Image src={thumb} style={styles.toothDetailThumb} />}
        <Text style={styles.toothDetailNumber}>Tooth {pretty(tooth.tooth_number)}</Text>
        <Text style={styles.toothDetailType}>{pretty(tooth.tooth_type)}</Text>
      </View>
      {lines.map((line, index) => <View key={`${line.label}-${index}`} style={styles.findingRow}><Text style={styles.findingLabel}>{line.label}</Text><View style={styles.findingBody}><Text style={styles.findingValue}>{line.value}</Text>{line.note && <Text style={styles.findingNote}>{`Note: ${line.note}`}</Text>}</View></View>)}
    </View>
  );
}

function DentalStatusPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const teeth = asRecords(data.dental_status?.teeth);
  const records = new Map(teeth.map((tooth) => [Number(tooth.tooth_number), tooth]));
  const findings = Array.from(records.values()).filter(toothHasFinding).sort((left, right) => Number(left.tooth_number) - Number(right.tooth_number));
  return (
    <SectionPage data={data} title="Dental Status" subtitle="Interactive odontogram as recorded in the chart (FDI notation), with a detail card for every finding.">
      <Panel title="Odontogram"><OdontogramChart records={records} assets={assets} /></Panel>
      <Panel title={`Recorded Findings (${findings.length})`} wrap>
        {findings.length > 0
          ? <View style={styles.toothDetailsGrid}>{findings.map((tooth) => <ToothDetailCard key={String(tooth.tooth_number)} tooth={tooth} assets={assets} />)}</View>
          : <Text style={styles.empty}>No tooth-level findings recorded.</Text>}
      </Panel>
    </SectionPage>
  );
}

const CONTACT_TYPES = [
  { key: 'mip', label: 'Maximum Intercuspation' },
  { key: 'premature', label: 'Premature contact' },
  { key: 'protrusive', label: 'Protrusive contact' },
  { key: 'working', label: 'Right lateral excursion' },
  { key: 'non_working', label: 'Left lateral excursion' },
] as const;

const contactPalettes = [
  { strong: '#14b8a6', soft: '#e6fffb' },
  { strong: '#f43f5e', soft: '#fff1f3' },
  { strong: '#8b5cf6', soft: '#f3efff' },
  { strong: '#f59e0b', soft: '#fff7df' },
  { strong: '#3b82f6', soft: '#edf5ff' },
  { strong: '#ec4899', soft: '#fff0f7' },
  { strong: '#0d9488', soft: '#e7faf7' },
  { strong: '#a855f7', soft: '#f8efff' },
  { strong: '#ef4444', soft: '#fff0f0' },
  { strong: '#0ea5e9', soft: '#ebf8ff' },
  { strong: '#84cc16', soft: '#f5fce8' },
  { strong: '#f97316', soft: '#fff3e9' },
  { strong: '#6366f1', soft: '#f0f1ff' },
];
const contactPalette = (tooth: number) => contactPalettes[tooth % contactPalettes.length];
const isLeftContact = (upper: number, lower: number) => (upper >= 21 && upper <= 28) || (lower >= 31 && lower <= 38);
const isRightContact = (upper: number, lower: number) => (upper >= 11 && upper <= 18) || (lower >= 41 && lower <= 48);
const isInterference = (type: string, upper: number, lower: number) => (type === 'working' && isLeftContact(upper, lower)) || (type === 'non_working' && isRightContact(upper, lower));

const CONTACT_CHART = { width: 620, height: 150, boxSize: 26, startX: 17, step: 36.2, upperY: 13, lowerY: 111 };
const CONTACT_CHART_WIDTH = PANEL_INNER_WIDTH;

function ContactChart({ type, contacts }: { type: string; contacts: PdfExportRecord[] }) {
  const { width, height, boxSize, startX, step, upperY, lowerY } = CONTACT_CHART;
  const scale = CONTACT_CHART_WIDTH / width;
  const centerX = (index: number) => startX + (index * step) + (boxSize / 2);
  const upperIndex = new Map(UPPER_TEETH.map((tooth, index) => [tooth, index]));
  const lowerIndex = new Map(LOWER_TEETH.map((tooth, index) => [tooth, index]));
  const pairedUpper = new Set(contacts.map((contact) => Number(contact.upper_tooth)));
  const pairedLower = new Map<number, number>();
  contacts.forEach((contact) => pairedLower.set(Number(contact.lower_tooth), Number(contact.upper_tooth)));
  const numberStyle = (x: number, y: number, active: boolean, color: string) => ({
    position: 'absolute' as const,
    left: x * scale,
    top: (y + (boxSize / 2)) * scale - 4.2,
    width: boxSize * scale,
    textAlign: 'center' as const,
    fontSize: 7,
    fontWeight: active ? 700 : 400,
    color: active ? color : c.slate500,
  });
  return (
    <View style={{ position: 'relative', width: CONTACT_CHART_WIDTH, height: height * scale }}>
      <Svg width={CONTACT_CHART_WIDTH} height={height * scale} viewBox={`0 0 ${width} ${height}`}>
        <Line x1={width / 2} y1="4" x2={width / 2} y2={height - 4} stroke={c.slate200} strokeWidth="1" strokeDasharray="4 4" />
        {contacts.map((contact, index) => {
          const upper = Number(contact.upper_tooth); const lower = Number(contact.lower_tooth);
          const upperPosition = upperIndex.get(upper); const lowerPosition = lowerIndex.get(lower);
          if (upperPosition === undefined || lowerPosition === undefined) return null;
          const x1 = centerX(upperPosition); const x2 = centerX(lowerPosition);
          const interference = isInterference(type, upper, lower);
          const color = interference ? c.rose500 : contactPalette(upper).strong;
          return <Path key={`line-${index}`} d={`M ${x1} ${upperY + boxSize} C ${x1} 68, ${x2} 82, ${x2} ${lowerY}`} fill="none" stroke={color} strokeOpacity={interference ? 0.95 : 0.7} strokeWidth="1.8" strokeDasharray={interference ? '4 3' : undefined} />;
        })}
        {UPPER_TEETH.map((tooth, index) => { const active = pairedUpper.has(tooth); const palette = contactPalette(tooth); return <Rect key={`upper-${tooth}`} x={startX + (index * step)} y={upperY} width={boxSize} height={boxSize} rx="6" fill={active ? palette.soft : '#ffffff'} stroke={active ? palette.strong : c.slate300} strokeWidth={active ? 1.7 : 1} />; })}
        {LOWER_TEETH.map((tooth, index) => { const upper = pairedLower.get(tooth); const active = upper !== undefined; const palette = contactPalette(active ? upper : tooth); return <Rect key={`lower-${tooth}`} x={startX + (index * step)} y={lowerY} width={boxSize} height={boxSize} rx="6" fill={active ? palette.soft : '#ffffff'} stroke={active ? palette.strong : c.slate300} strokeWidth={active ? 1.7 : 1} />; })}
        {contacts.flatMap((contact, index) => {
          const upper = Number(contact.upper_tooth); const lower = Number(contact.lower_tooth);
          const upperPosition = upperIndex.get(upper); const lowerPosition = lowerIndex.get(lower);
          if (upperPosition === undefined || lowerPosition === undefined) return [];
          const color = isInterference(type, upper, lower) ? c.rose500 : contactPalette(upper).strong;
          return [<Circle key={`u-${index}`} cx={centerX(upperPosition)} cy={upperY + boxSize} r="2.5" fill={color} />, <Circle key={`l-${index}`} cx={centerX(lowerPosition)} cy={lowerY} r="2.5" fill={color} />];
        })}
      </Svg>
      {UPPER_TEETH.map((tooth, index) => <Text key={`upper-label-${tooth}`} style={numberStyle(startX + (index * step), upperY, pairedUpper.has(tooth), contactPalette(tooth).strong)}>{tooth}</Text>)}
      {LOWER_TEETH.map((tooth, index) => { const upper = pairedLower.get(tooth); return <Text key={`lower-label-${tooth}`} style={numberStyle(startX + (index * step), lowerY, upper !== undefined, contactPalette(upper ?? tooth).strong)}>{tooth}</Text>; })}
    </View>
  );
}

function OcclusalPage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const analysis = data.occlusal_analysis ?? {};
  const contacts = data.occlusal_contacts;
  const mappedTypes = CONTACT_TYPES.filter((type) => contacts.some((contact) => contact.contact_type === type.key)).length;
  const interferences = contacts.filter((contact) => isInterference(String(contact.contact_type), Number(contact.upper_tooth), Number(contact.lower_tooth))).length;
  return (
    <SectionPage data={data} title="Occlusal Analysis" subtitle="Upper-to-lower contact mapping and orthodontic & occlusal measurements.">
      <View style={styles.overviewRow} wrap={false}>
        <View style={styles.overviewStat}><Text style={styles.overviewValue}>{contacts.length}</Text><Text style={styles.overviewLabel}>Mapped contact pairs</Text></View>
        <View style={styles.overviewStat}><Text style={styles.overviewValue}>{`${mappedTypes} of ${CONTACT_TYPES.length}`}</Text><Text style={styles.overviewLabel}>Contact types mapped</Text></View>
        <View style={[styles.overviewStat, interferences > 0 ? { backgroundColor: c.rose600 } : {}]}><Text style={styles.overviewValue}>{interferences}</Text><Text style={styles.overviewLabel}>Balancing interferences</Text></View>
      </View>
      <View>
        <View style={styles.panelHeader} minPresenceAhead={150}>
          <View style={styles.panelDot} />
          <Text style={styles.panelTitle}>Contact Maps</Text>
        </View>
        {CONTACT_TYPES.map((type) => {
          const typed = contacts.filter((contact) => contact.contact_type === type.key);
          return (
            <View key={type.key} style={styles.contactCard} wrap={false}>
              <View style={styles.contactCardHeader}><Text style={styles.contactCardTitle}>{type.label}</Text><Text style={styles.contactCardCount}>{`${typed.length} mapped`}</Text></View>
              <ContactChart type={type.key} contacts={typed} />
              <View style={styles.contactPairs}>
                {typed.length > 0 ? typed.map((contact, index) => {
                  const upper = Number(contact.upper_tooth); const lower = Number(contact.lower_tooth);
                  const interference = isInterference(type.key, upper, lower);
                  return (
                    <View key={index} style={interference ? [styles.contactPair, styles.contactPairInterference] : styles.contactPair}>
                      <View style={[styles.contactPairDot, { backgroundColor: interference ? c.rose500 : contactPalette(upper).strong }]} />
                      <Text style={interference ? [styles.contactPairText, styles.contactPairTextInterference] : styles.contactPairText}>{`${upper} — ${lower}${interference ? '  (interference)' : ''}`}</Text>
                    </View>
                  );
                }) : <Text style={styles.empty}>No contacts mapped.</Text>}
              </View>
            </View>
          );
        })}
      </View>
      <Panel title="Orthodontic & Occlusal Measurements">
        <View wrap={false}>
          <FieldLabel eyebrow>{"ANGLE'S CLASSIFICATION"}</FieldLabel>
          <View style={styles.row}>
            <View style={styles.col}><OptionCards group={ANGLE_CLASS_OPTIONS} selected={analysis.right_molar as string} assets={assets} title="Right first molar" /></View>
            <View style={styles.col}><OptionCards group={ANGLE_CLASS_OPTIONS} selected={analysis.left_molar as string} assets={assets} title="Left first molar" /></View>
          </View>
          <View style={styles.row}>
            <View style={styles.col}><OptionCards group={ANGLE_CLASS_OPTIONS} selected={analysis.canine_right as string} assets={assets} title="Right canine" /></View>
            <View style={styles.col}><OptionCards group={ANGLE_CLASS_OPTIONS} selected={analysis.canine_left as string} assets={assets} title="Left canine" /></View>
          </View>
        </View>
        <View style={styles.divider} />
        <View style={styles.row} wrap={false}>
          <View style={styles.col}>
            <FieldLabel eyebrow>OVERLAPS</FieldLabel>
            <View style={styles.row}>
              <View style={styles.col}><ValueBox label="Horizontal" value={analysis.overlap_horizontal} unit="mm" /></View>
              <View style={styles.col}><ValueBox label="Vertical" value={analysis.overlap_vertical} unit="mm" /></View>
            </View>
          </View>
          <View style={styles.col}>
            <FieldLabel eyebrow>CR - MIP</FieldLabel>
            <View style={styles.row}>
              <View style={styles.col}><ValueBox label="Anterior slide" value={analysis.anterior_slide} unit="mm" /></View>
              <View style={styles.col}><ValueBox label={`Lateral slide (${isPresent(analysis.lateral_direction) ? pretty(analysis.lateral_direction) : 'direction not recorded'})`} value={analysis.lateral_slide} unit="mm" /></View>
            </View>
          </View>
        </View>
      </Panel>
      <Notes value={analysis.note} />
    </SectionPage>
  );
}

function ResidualRidgePage({ data, assets }: { data: ChartExportData; assets: Assets }) {
  const ridge = data.residual_ridge_assessment ?? {};
  const torus = asRecord(ridge.torus_palatinus);
  const deformity = asRecord(ridge.ridge_deformity);
  const frenum = asRecord(ridge.freenum_attachment);
  const torusSelected = Array.isArray(ridge.torus_palatinus) ? asStrings(ridge.torus_palatinus) : asStrings(torus.selected);
  const deformitySelected = Array.isArray(ridge.ridge_deformity) ? asStrings(ridge.ridge_deformity) : asStrings(deformity.selected);
  const deformityDetails = [['Exostosis Details', deformity.exostosis_detail], ['Bony Spicule Details', deformity.bony_spicule_detail], ['Flabby Tissue Details', deformity.flabby_tissue_detail]].filter(([, value]) => isPresent(value));
  const pick = (key: string) => ridge[key] as string;
  return (
    <SectionPage data={data} title="Residual Ridge Area" subtitle="Comprehensive evaluation of the edentulous ridge, soft tissues, and patient attitude.">
      <Panel title="1. Arch & Ridge Morphology">
        <OptionCards group={RIDGE_GROUPS.ridgeHeight} selected={pick('ridge_height')} assets={assets} />
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.ridgeWidth} selected={pick('ridge_width')} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.jawSize} selected={pick('jaw_size')} assets={assets} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.ridgeShapeUpper} selected={pick('ridge_shape_upper')} assets={assets} columns={2} title="Ridge shape — upper arch (U)" /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.ridgeShapeLower} selected={pick('ridge_shape_lower')} assets={assets} columns={2} title="Ridge shape — lower arch (L)" /></View>
        </View>
        <OptionCards group={RIDGE_GROUPS.ridgeRelation} selected={pick('ridge_relation')} assets={assets} />
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.ridgeParallelism} selected={pick('ridge_parallelism')} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.interridgeSpace} selected={pick('interridge_space')} assets={assets} /></View>
        </View>
        <OptionCards group={RIDGE_GROUPS.lowerArchForm} selected={pick('lower_arch_form')} assets={assets} />
      </Panel>
      <Panel title="2. Palatal & Throat Morphology" wrap={false}>
        <OptionCards group={RIDGE_GROUPS.palatalVault} selected={pick('palatal_vault')} assets={assets} />
        <OptionCards group={RIDGE_GROUPS.palatalThroat} selected={pick('palatal_throat_form')} assets={assets} />
      </Panel>
      <Panel title="3. Anomalies & Attachments" tone="rose">
        <View style={styles.row}>
          <View style={styles.col}>
            <OptionCards group={RIDGE_GROUPS.torus} selected={torusSelected} assets={assets} title="Torus present (multi-select)" />
            {isPresent(torus.size_mm) && <ValueBox label="Torus size" value={torus.size_mm} unit="mm" />}
          </View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.ridgeDeformity} selected={deformitySelected} assets={assets} columns={2} title="Ridge deformity (multi-select)" /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.frenumUpper} selected={asStrings(frenum.upper)} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.frenumLower} selected={asStrings(frenum.lower)} assets={assets} /></View>
        </View>
        {deformityDetails.map(([label, value]) => <ValueBox key={String(label)} label={String(label)} value={value} />)}
      </Panel>
      <Panel title="4. Soft Tissue & Environment">
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.tongueSize} selected={pick('tongue_size')} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.tonguePosition} selected={pick('tongue_position')} assets={assets} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.lipMobility} selected={pick('lip_mobility')} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.facialMuscleTone} selected={pick('facial_muscle_tone')} assets={assets} /></View>
        </View>
        <View style={styles.row}>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.salivaAmount} selected={pick('saliva_amount')} assets={assets} /></View>
          <View style={styles.col}><OptionCards group={RIDGE_GROUPS.salivaConsistency} selected={pick('saliva_consistency')} assets={assets} /></View>
        </View>
      </Panel>
      <Panel title="5. Mental Attitude" wrap={false}>
        <OptionCards group={RIDGE_GROUPS.mentalAttitude} selected={pick('mental_attitude')} assets={assets} columns={2} />
      </Panel>
      <Notes value={ridge.note} />
    </SectionPage>
  );
}

export function ClinicalChartPdfDocument({ data, assets = emptyChartPdfAssets() }: { data: ChartExportData; assets?: ChartPdfAssets }) {
  return (
    <Document title={`IDRS Clinical Chart - ${pretty(data.patient.name)}`} author="IDRS" subject="Comprehensive dental chart">
      <CoverPage data={data} />
      {(assets.warnings?.length ?? 0) > 0 && (
        <SectionPage data={data} title="Export limitations" subtitle="This PDF is incomplete. The following content could not be loaded at export time.">
          <Alert tone="amber" title="Partial export" text="Missing content does not mean that no findings were recorded. Retry the export to obtain the unavailable content." />
          {assets.warnings?.map((warning, index) => <Text key={index} style={{ marginBottom: 8 }}>{warning}</Text>)}
        </SectionPage>
      )}
      <PatientHistoryPage data={data} assets={assets} />
      <ImageGalleryPage data={data} assets={assets} />
      <ExtraoralPage data={data} assets={assets} />
      <EstheticPage data={data} assets={assets} />
      <VdoPage data={data} assets={assets} />
      <DentalStatusPage data={data} assets={assets} />
      <OcclusalPage data={data} assets={assets} />
      <ResidualRidgePage data={data} assets={assets} />
    </Document>
  );
}
