import {
  Circle,
  Document,
  Font,
  Image,
  Line,
  Page,
  Path,
  Rect,
  StyleSheet,
  Svg,
  Text,
  Text as SvgText,
  View,
} from '@react-pdf/renderer';
import { Fragment, type ReactNode } from 'react';
import type { ChartExportData, PdfExportRecord } from '@/services/pdfExportService';
import thaiFont from '@fontsource/noto-sans-thai/files/noto-sans-thai-thai-400-normal.woff';
import thaiBoldFont from '@fontsource/noto-sans-thai/files/noto-sans-thai-thai-700-normal.woff';

Font.register({ family: 'NotoSansThai', src: thaiFont, fontWeight: 400 });
Font.register({ family: 'NotoSansThai', src: thaiBoldFont, fontWeight: 700 });

const colors = {
  ink: '#0f172a',
  text: '#334155',
  muted: '#64748b',
  faint: '#94a3b8',
  border: '#dbe5e7',
  surface: '#ffffff',
  canvas: '#f4f8f8',
  teal: '#0f766e',
  tealBright: '#14b8a6',
  tealSoft: '#ccfbf1',
  rose: '#e11d48',
  roseSoft: '#fff1f2',
  amber: '#d97706',
  amberSoft: '#fef3c7',
  blue: '#2563eb',
  blueSoft: '#dbeafe',
  indigoSoft: '#e0e7ff',
};

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingHorizontal: 32,
    paddingBottom: 34,
    fontFamily: 'NotoSansThai',
    fontSize: 8,
    color: colors.text,
    backgroundColor: colors.canvas,
  },
  coverPage: {
    padding: 0,
    fontFamily: 'NotoSansThai',
    fontSize: 9,
    color: colors.text,
    backgroundColor: colors.canvas,
  },
  coverHero: {
    height: 244,
    backgroundColor: colors.teal,
    paddingTop: 48,
    paddingHorizontal: 46,
    color: '#ffffff',
  },
  coverBrand: { fontSize: 8, fontWeight: 700, letterSpacing: 1.5, color: '#99f6e4', marginBottom: 20 },
  coverTitle: { fontSize: 28, fontWeight: 700, lineHeight: 1.12, marginBottom: 8 },
  coverSubtitle: { fontSize: 10, color: '#d1fae5', maxWidth: 330, lineHeight: 1.45 },
  coverRecord: { position: 'absolute', right: 46, top: 50, alignItems: 'flex-end' },
  coverRecordLabel: { fontSize: 6, color: '#99f6e4', letterSpacing: 1, marginBottom: 3 },
  coverRecordValue: { fontSize: 10, fontWeight: 700 },
  coverBody: { paddingHorizontal: 40, marginTop: -32 },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 16,
  },
  patientAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.tealSoft,
    color: colors.teal,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  patientInitials: { fontSize: 16, fontWeight: 700 },
  patientName: { fontSize: 17, fontWeight: 700, color: colors.ink, marginBottom: 3 },
  patientMeta: { fontSize: 7.5, color: colors.muted },
  patientAside: { marginLeft: 'auto', alignItems: 'flex-end' },
  patientAsideLabel: { fontSize: 6, color: colors.faint, marginBottom: 2 },
  patientAsideValue: { fontSize: 8, fontWeight: 700, color: colors.text },
  statRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  statCard: { flexGrow: 1, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 10 },
  statValue: { fontSize: 17, fontWeight: 700, color: colors.ink, marginBottom: 2 },
  statLabel: { fontSize: 6.5, color: colors.muted },
  coverSectionTitle: { fontSize: 8, fontWeight: 700, color: colors.ink, marginTop: 16, marginBottom: 7 },
  indexGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  indexItem: { width: '32.5%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 8 },
  indexNumber: { fontSize: 6, color: colors.teal, fontWeight: 700, marginBottom: 2 },
  indexLabel: { fontSize: 7.2, color: colors.text, fontWeight: 700 },
  alert: { marginTop: 12, backgroundColor: colors.roseSoft, borderLeftWidth: 4, borderLeftColor: colors.rose, borderRadius: 6, padding: 9 },
  alertLabel: { fontSize: 6, fontWeight: 700, color: colors.rose, letterSpacing: 0.7, marginBottom: 2 },
  alertText: { fontSize: 7.5, color: '#9f1239' },

  reportHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.teal,
    color: '#ffffff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 11,
  },
  reportBrand: { fontSize: 10, fontWeight: 700 },
  reportBrandSub: { fontSize: 5.5, color: '#99f6e4', letterSpacing: 0.7, marginTop: 1 },
  headerPatient: { alignItems: 'flex-end' },
  headerPatientName: { fontSize: 7.5, fontWeight: 700 },
  headerPatientMeta: { fontSize: 5.8, color: '#d1fae5', marginTop: 1 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 11,
    marginBottom: 9,
  },
  sectionAccent: { width: 4, height: 34, borderRadius: 2, backgroundColor: colors.tealBright, marginRight: 9 },
  sectionEyebrow: { fontSize: 5.5, fontWeight: 700, color: colors.teal, letterSpacing: 0.9, marginBottom: 2 },
  sectionTitle: { fontSize: 14, fontWeight: 700, color: colors.ink },
  sectionHint: { marginLeft: 'auto', width: 176, textAlign: 'right', color: colors.muted, fontSize: 6.2, lineHeight: 1.35 },
  footer: { position: 'absolute', left: 32, right: 32, bottom: 14, flexDirection: 'row', justifyContent: 'space-between', color: colors.faint, fontSize: 5.5 },

  contentGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 7 },
  card: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 9, marginBottom: 7 },
  halfCard: { width: '49.3%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 9 },
  cardTitle: { fontSize: 8.5, fontWeight: 700, color: colors.ink, marginBottom: 5 },
  cardHint: { fontSize: 5.8, color: colors.faint, marginTop: -3, marginBottom: 6 },
  narrative: { fontSize: 7.5, lineHeight: 1.5, color: colors.text },
  empty: { color: colors.faint, fontSize: 7 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#edf2f3', marginVertical: 6 },
  valueGrid: { flexDirection: 'row', flexWrap: 'wrap', borderWidth: 1, borderColor: colors.border, borderRadius: 7, overflow: 'hidden', backgroundColor: '#ffffff', marginBottom: 7 },
  valueCell: { width: '50%', minHeight: 40, padding: 8, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#edf2f3' },
  valueCellThird: { width: '33.333%', minHeight: 39, padding: 7, borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#edf2f3' },
  valueLabel: { fontSize: 5.8, color: colors.faint, letterSpacing: 0.35, marginBottom: 3 },
  valueText: { fontSize: 7.7, fontWeight: 700, color: colors.text, lineHeight: 1.35 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  chip: { borderRadius: 8, backgroundColor: colors.tealSoft, paddingVertical: 3, paddingHorizontal: 7, color: colors.teal, fontSize: 6.5, fontWeight: 700 },
  neutralChip: { borderRadius: 8, backgroundColor: '#f1f5f9', paddingVertical: 3, paddingHorizontal: 7, color: colors.text, fontSize: 6.5, fontWeight: 700 },
  structuredRow: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#f1f5f9' },
  structuredKey: { width: '35%', color: colors.muted, fontSize: 6.5, paddingRight: 5 },
  structuredValue: { width: '65%', color: colors.text, fontSize: 6.8, lineHeight: 1.35 },

  table: { borderWidth: 1, borderColor: colors.border, borderRadius: 6, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#ecfdf5', paddingVertical: 6, paddingHorizontal: 7 },
  tableRow: { flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 7, borderTopWidth: 1, borderTopColor: '#edf2f3' },
  tableHeaderText: { fontSize: 5.8, fontWeight: 700, color: colors.teal },
  tableText: { fontSize: 6.5, color: colors.text },
  medicationName: { width: '28%' },
  medicationDose: { width: '18%' },
  medicationFrequency: { width: '28%' },
  medicationTime: { width: '26%' },

  toothChart: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 8, padding: 9, marginBottom: 9 },
  archLabel: { fontSize: 5.8, fontWeight: 700, color: colors.muted, letterSpacing: 0.6, marginBottom: 4 },
  toothRow: { flexDirection: 'row', borderTopWidth: 1, borderLeftWidth: 1, borderColor: '#cbd5e1', marginBottom: 7 },
  toothTile: { width: '6.25%', height: 45, alignItems: 'center', justifyContent: 'center', borderRightWidth: 1, borderBottomWidth: 1, borderColor: '#cbd5e1', paddingHorizontal: 1 },
  toothNumber: { fontSize: 7, fontWeight: 700, color: colors.ink, marginBottom: 2 },
  toothState: { fontSize: 4.8, textAlign: 'center', color: colors.muted },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', fontSize: 5.8, color: colors.muted },
  legendSwatch: { width: 7, height: 7, borderRadius: 2, marginRight: 3 },
  toothDetailsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  toothDetail: { width: '49.4%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 8 },
  toothDetailHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  toothDetailNumber: { fontSize: 9, fontWeight: 700, color: colors.ink },
  toothDetailType: { fontSize: 5.8, color: colors.teal, backgroundColor: colors.tealSoft, borderRadius: 7, paddingVertical: 2, paddingHorizontal: 5 },
  findingLine: { fontSize: 6.3, color: colors.text, lineHeight: 1.35, marginBottom: 3 },
  findingLabel: { color: colors.muted },

  occlusalMetrics: { flexDirection: 'row', flexWrap: 'wrap', gap: 5, marginBottom: 8 },
  metricCard: { width: '24.25%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 6, padding: 6 },
  metricLabel: { fontSize: 5.2, color: colors.faint, marginBottom: 2 },
  metricValue: { fontSize: 7.2, fontWeight: 700, color: colors.text },
  contactGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  contactCard: { width: '49.4%', height: 130, backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 7 },
  contactCardHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  contactCardTitle: { fontSize: 7.3, fontWeight: 700, color: colors.ink },
  contactCardCount: { fontSize: 5.5, color: colors.teal },
  contactChart: { height: 91, borderWidth: 1, borderColor: '#f1f5f9', borderRadius: 5, backgroundColor: '#fbfdfe', padding: 2 },
  contactPairs: { fontSize: 5.2, color: colors.muted, marginTop: 3 },
  summaryCard: { width: '49.4%', height: 130, backgroundColor: colors.teal, borderRadius: 7, padding: 10, color: '#ffffff' },
  summaryTitle: { fontSize: 9, fontWeight: 700, marginBottom: 6 },
  summaryStats: { flexDirection: 'row', gap: 5, marginBottom: 7 },
  summaryStat: { flexGrow: 1, backgroundColor: '#115e59', borderRadius: 5, padding: 6 },
  summaryStatValue: { fontSize: 12, fontWeight: 700 },
  summaryStatLabel: { fontSize: 5, color: '#99f6e4', marginTop: 1 },
  summaryText: { fontSize: 5.8, color: '#d1fae5', lineHeight: 1.35, marginBottom: 3 },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  imageCard: { width: '49.2%', backgroundColor: '#ffffff', borderWidth: 1, borderColor: colors.border, borderRadius: 7, padding: 7 },
  image: { width: '100%', height: 170, objectFit: 'contain', backgroundColor: '#f8fafc' },
  imagePlaceholder: { width: '100%', height: 170, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9', color: colors.faint },
  imageType: { fontSize: 7, fontWeight: 700, color: colors.ink, marginTop: 6 },
  imageDescription: { fontSize: 6.2, color: colors.muted, marginTop: 2, lineHeight: 1.35 },
  imageMeta: { fontSize: 5.3, color: colors.faint, marginTop: 3 },
});

const hiddenKeys = new Set([
  'patient_id', 'chart_id', 'dentist_id', 'history_id', 'exam_id', 'esthetic_id', 'vdo_id',
  'assessment_id', 'occlusal_id', 'status_id', 'tooth_id', 'contact_id', 'image_id',
  'created_at', 'updated_at', 'edentulous_id', 'caries_id', 'filling_id', 'periodontal_id',
  'vitality_id', 'restoration_id', 'implant_id', 'id',
]);

const labels: Record<string, string> = {
  chief_complaint: 'Chief complaint',
  present_illness: 'Present illness',
  medical_history: 'Medical history',
  regular_doctor_visits: 'Regular doctor visits',
  regular_doctor_months: 'Visit interval',
  clinic_name: 'Clinic / hospital',
  current_medication: 'Current medication',
  allergy_status: 'Known allergy',
  allergy_detail: 'Allergy detail',
  dental_history: 'Dental history',
  patient_expectation: 'Patient expectations',
  patient_expectation_other: 'Other expectation',
  patient_self_evaluation: 'Current dental / prosthesis status',
  patient_expected_outcome: 'Expected treatment outcome',
  edentulous_time: 'Time edentulous',
  previous_denture_count: 'Previous dentures',
  present_denture_age: 'Current denture age',
  denture_complaint: 'Denture complaint',
  facial_symmetry: 'Facial symmetry',
  facial_profile: 'Facial profile',
  muscle_pain: 'Muscle pain',
  joint_pain: 'Joint pain',
  joint_sound: 'Joint sound',
  jaw_deviation: 'Jaw deviation',
  has_limited_opening: 'Limited mouth opening',
  mouth_opening_mm: 'Mouth opening',
  has_limited_movement: 'Limited border movement',
  specify_movement_detail: 'Movement detail',
  parafunctional_habit: 'Parafunctional habits',
  parafunctional_habit_other: 'Other habit',
  factors_affecting_tooth_wear: 'Factors affecting tooth wear',
  occlusal_plane: 'Occlusal plane',
  midline_discrepancy: 'Midline relationship',
  midline_shift: 'Midline shift',
  lip_thickness: 'Lip thickness',
  lip_length: 'Lip length',
  upper_tooth_exposure: 'Upper tooth exposure',
  lower_tooth_exposure: 'Lower tooth exposure',
  nasolabial_angle: 'Nasolabial angle',
  dentofacial_analysis: 'Dentofacial analysis',
  fv_sound: 'F-V sound',
  closest_speaking: 'Closest speaking space',
  reference_teeth: 'Reference teeth',
  facial_soft_tissue: 'Facial soft-tissue findings',
  free_way_space: 'Free-way space',
  bite_type: 'Bite type',
  ridge_height: 'Ridge height',
  ridge_width: 'Ridge width',
  jaw_size: 'Jaw size',
  ridge_shape_upper: 'Upper ridge shape',
  ridge_shape_lower: 'Lower ridge shape',
  ridge_relation: 'Ridge relation',
  ridge_parallelism: 'Ridge parallelism',
  interridge_space: 'Interridge space',
  lower_arch_form: 'Lower arch form',
  palatal_vault: 'Palatal vault',
  palatal_throat_form: 'Palatal throat form',
  freenum_attachment: 'Frenum attachment',
  ridge_deformity: 'Ridge deformity',
  torus_palatinus: 'Torus',
  tongue_size: 'Tongue size',
  tongue_position: 'Tongue position',
  saliva_amount: 'Saliva amount',
  saliva_consistency: 'Saliva consistency',
  lip_mobility: 'Lip mobility',
  facial_muscle_tone: 'Facial muscle tone',
  mental_attitude: 'Mental attitude',
  right_molar: 'Right first molar',
  left_molar: 'Left first molar',
  canine_right: 'Right canine',
  canine_left: 'Left canine',
  overlap_horizontal: 'Horizontal overlap',
  overlap_vertical: 'Vertical overlap',
  anterior_slide: 'Anterior slide',
  lateral_slide: 'Lateral slide',
  lateral_direction: 'Lateral direction',
  note: 'Clinical note',
};

const upperTeeth = [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28];
const lowerTeeth = [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38];

const contactTypes = [
  { key: 'mip', label: 'Maximum Intercuspation' },
  { key: 'premature', label: 'Premature contact' },
  { key: 'protrusive', label: 'Protrusive contact' },
  { key: 'working', label: 'Right lateral excursion' },
  { key: 'non_working', label: 'Left lateral excursion' },
] as const;

const isPresent = (value: unknown) => value !== null && value !== undefined && value !== '';
const asRecord = (value: unknown): PdfExportRecord => value && typeof value === 'object' && !Array.isArray(value) ? value as PdfExportRecord : {};
const asRecords = (value: unknown): PdfExportRecord[] => Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') as PdfExportRecord[] : [];
const humanize = (key: string) => labels[key] ?? key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
const pretty = (value: unknown): string => {
  if (!isPresent(value)) return 'Not recorded';
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (Array.isArray(value)) return value.length > 0 ? value.map(pretty).join(', ') : 'Not recorded';
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
const unitFor = (key: string) => key.includes('_mm') || key.includes('exposure') || key.includes('speaking') || key.includes('space') || key.includes('shift') || key.includes('slide') || key.includes('overlap') ? ' mm' : key === 'regular_doctor_months' ? ' months' : '';

function ReportHeader({ data }: { data: ChartExportData }) {
  return (
    <View style={styles.reportHeader} fixed>
      <View><Text style={styles.reportBrand}>IDRS Clinical Chart</Text><Text style={styles.reportBrandSub}>INTEGRATED DENTAL RECORD SYSTEM</Text></View>
      <View style={styles.headerPatient}><Text style={styles.headerPatientName}>{pretty(data.patient.name)}</Text><Text style={styles.headerPatientMeta}>HN {pretty(data.patient.hn_number)}  ·  {formatDate(data.chart.record_date)}</Text></View>
    </View>
  );
}

function SectionHeader({ title, hint }: { title: string; hint: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionAccent} />
      <View><Text style={styles.sectionEyebrow}>CLINICAL RECORD</Text><Text style={styles.sectionTitle}>{title}</Text></View>
      <Text style={styles.sectionHint}>{hint}</Text>
    </View>
  );
}

function Footer({ section }: { section: string }) {
  return <View style={styles.footer} fixed><Text>{section}</Text><Text render={({ pageNumber, totalPages }) => `IDRS  ·  ${pageNumber} / ${totalPages}`} /></View>;
}

function PageShell({ data, title, hint, children }: { data: ChartExportData; title: string; hint: string; children: ReactNode }) {
  return <Page size="A4" style={styles.page}><ReportHeader data={data} /><SectionHeader title={title} hint={hint} />{children}<Footer section={title} /></Page>;
}

function ValueGrid({ record, fields, columns = 2 }: { record: PdfExportRecord | null; fields: string[]; columns?: 2 | 3 }) {
  const source = record ?? {};
  return (
    <View style={styles.valueGrid}>
      {fields.map((key) => <View key={key} style={columns === 3 ? styles.valueCellThird : styles.valueCell}><Text style={styles.valueLabel}>{humanize(key).toUpperCase()}</Text><Text style={styles.valueText}>{pretty(source[key])}{isPresent(source[key]) ? unitFor(key) : ''}</Text></View>)}
    </View>
  );
}

function Chips({ value, neutral = false }: { value: unknown; neutral?: boolean }) {
  const values = Array.isArray(value) ? value : isPresent(value) ? [value] : [];
  if (values.length === 0) return <Text style={styles.empty}>Not recorded</Text>;
  return <View style={styles.chips}>{values.map((item, index) => <Text key={`${pretty(item)}-${index}`} style={neutral ? styles.neutralChip : styles.chip}>{pretty(item)}</Text>)}</View>;
}

function StructuredData({ value }: { value: unknown }) {
  if (!isPresent(value)) return <Text style={styles.empty}>Not recorded</Text>;
  if (Array.isArray(value)) return <View>{value.map((item, index) => <StructuredData key={index} value={item} />)}</View>;
  if (typeof value !== 'object') return <Text style={styles.narrative}>{pretty(value)}</Text>;
  const entries = Object.entries(value as PdfExportRecord).filter(([key, item]) => !hiddenKeys.has(key) && isPresent(item));
  if (entries.length === 0) return <Text style={styles.empty}>Not recorded</Text>;
  return <View>{entries.map(([key, item]) => <View key={key} style={styles.structuredRow}><Text style={styles.structuredKey}>{humanize(key)}</Text><Text style={styles.structuredValue}>{pretty(item)}</Text></View>)}</View>;
}

function NarrativeCard({ title, value }: { title: string; value: unknown }) {
  return <View style={styles.card} wrap={false}><Text style={styles.cardTitle}>{title}</Text><Text style={isPresent(value) ? styles.narrative : styles.empty}>{pretty(value)}</Text></View>;
}

function CoverPage({ data }: { data: ChartExportData }) {
  const sections = [data.medical_history, data.extraoral_exam, data.esthetic_evaluation, data.vdo_evaluation, data.dental_status, data.occlusal_analysis, data.residual_ridge_assessment];
  const completeSections = sections.filter(Boolean).length;
  const teeth = asRecords(data.dental_status?.teeth);
  const findings = teeth.filter(toothHasFinding).length;
  const allergy = data.medical_history?.allergy_detail ?? data.patient.allergy;
  const index = ['Patient history', 'Extraoral examination', 'Esthetic & VDO', 'Dental status', 'Occlusal analysis', 'Residual ridge', 'Clinical images'];
  return (
    <Page size="A4" style={styles.coverPage}>
      <View style={styles.coverHero}>
        <Text style={styles.coverBrand}>IDRS  /  CLINICAL DOCUMENTATION</Text>
        <Text style={styles.coverTitle}>Comprehensive{`\n`}Dental Chart</Text>
        <Text style={styles.coverSubtitle}>A structured clinical record for assessment, diagnosis support, treatment planning, and continuity of care.</Text>
        <View style={styles.coverRecord}><Text style={styles.coverRecordLabel}>RECORD DATE</Text><Text style={styles.coverRecordValue}>{formatDate(data.chart.record_date)}</Text></View>
      </View>
      <View style={styles.coverBody}>
        <View style={styles.patientCard}>
          <View style={styles.patientAvatar}><Text style={styles.patientInitials}>{initials(data.patient.name)}</Text></View>
          <View><Text style={styles.patientName}>{pretty(data.patient.name)}</Text><Text style={styles.patientMeta}>HN {pretty(data.patient.hn_number)}  ·  {pretty(data.patient.sex)}  ·  {pretty(data.patient.age)} years</Text><Text style={styles.patientMeta}>{pretty(data.patient.phone)}</Text></View>
          <View style={styles.patientAside}><Text style={styles.patientAsideLabel}>CHART STATUS</Text><Text style={styles.patientAsideValue}>{completeSections} of {sections.length} sections recorded</Text></View>
        </View>
        <View style={styles.statRow}>
          <View style={styles.statCard}><Text style={styles.statValue}>{completeSections}</Text><Text style={styles.statLabel}>Completed clinical sections</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{findings}</Text><Text style={styles.statLabel}>Teeth with recorded findings</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{data.occlusal_contacts.length}</Text><Text style={styles.statLabel}>Mapped occlusal contacts</Text></View>
          <View style={styles.statCard}><Text style={styles.statValue}>{data.images.length}</Text><Text style={styles.statLabel}>Clinical images</Text></View>
        </View>
        {isPresent(allergy) && <View style={styles.alert}><Text style={styles.alertLabel}>ALLERGY ALERT</Text><Text style={styles.alertText}>{pretty(allergy)}</Text></View>}
        <Text style={styles.coverSectionTitle}>Document contents</Text>
        <View style={styles.indexGrid}>{index.map((item, position) => <View key={item} style={styles.indexItem}><Text style={styles.indexNumber}>{String(position + 1).padStart(2, '0')}</Text><Text style={styles.indexLabel}>{item}</Text></View>)}</View>
      </View>
      <Footer section="Comprehensive Dental Chart" />
    </Page>
  );
}

function MedicationTable({ value }: { value: unknown }) {
  const medications = asRecords(value);
  if (medications.length === 0) return <Text style={styles.empty}>No medication recorded.</Text>;
  return (
    <View style={styles.table}>
      <View style={styles.tableHeader}><Text style={[styles.tableHeaderText, styles.medicationName]}>MEDICATION</Text><Text style={[styles.tableHeaderText, styles.medicationDose]}>DOSE</Text><Text style={[styles.tableHeaderText, styles.medicationFrequency]}>FREQUENCY</Text><Text style={[styles.tableHeaderText, styles.medicationTime]}>TIME</Text></View>
      {medications.map((medication, index) => <View key={String(medication.id ?? index)} style={styles.tableRow}><Text style={[styles.tableText, styles.medicationName]}>{pretty(medication.name)}</Text><Text style={[styles.tableText, styles.medicationDose]}>{pretty(medication.dose ?? medication.dosePerTime)}</Text><Text style={[styles.tableText, styles.medicationFrequency]}>{pretty(medication.frequency)}</Text><Text style={[styles.tableText, styles.medicationTime]}>{pretty(medication.timeOfDay)}</Text></View>)}
    </View>
  );
}

function MedicalHistoryPage({ data }: { data: ChartExportData }) {
  const history = data.medical_history ?? {};
  return (
    <PageShell data={data} title="Patient History" hint="Medical background, presenting concern, medications, allergies, expectations, and denture history.">
      <NarrativeCard title="Chief complaint" value={history.chief_complaint} />
      <NarrativeCard title="Present illness" value={history.present_illness} />
      <NarrativeCard title="Medical history" value={history.medical_history} />
      <ValueGrid record={history} fields={['regular_doctor_visits', 'regular_doctor_months', 'clinic_name', 'allergy_status']} />
      {isPresent(history.allergy_detail) && <View style={styles.alert}><Text style={styles.alertLabel}>ALLERGY DETAIL</Text><Text style={styles.alertText}>{pretty(history.allergy_detail)}</Text></View>}
      <View style={styles.card} wrap={false}><Text style={styles.cardTitle}>Current medication</Text><MedicationTable value={history.current_medication} /></View>
      <NarrativeCard title="Dental history" value={history.dental_history} />
      <View style={styles.card} wrap={false}><Text style={styles.cardTitle}>Patient expectations</Text><Chips value={history.patient_expectation} />{isPresent(history.patient_expectation_other) && <Text style={[styles.narrative, { marginTop: 5 }]}>Other: {pretty(history.patient_expectation_other)}</Text>}</View>
      <View style={styles.contentGrid}>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Current self-evaluation</Text><Text style={styles.narrative}>{pretty(history.patient_self_evaluation)}</Text></View>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Expected outcome</Text><Text style={styles.narrative}>{pretty(history.patient_expected_outcome)}</Text></View>
      </View>
      <Text style={[styles.cardTitle, { marginTop: 8 }]}>Edentulous history</Text>
      <ValueGrid record={history} fields={['edentulous_time', 'previous_denture_count', 'present_denture_age', 'denture_complaint']} />
      {isPresent(history.note) && <NarrativeCard title="Clinical note" value={history.note} />}
    </PageShell>
  );
}

function ExtraoralPage({ data }: { data: ChartExportData }) {
  const exam = data.extraoral_exam ?? {};
  return (
    <PageShell data={data} title="Extraoral Examination" hint="Facial assessment, muscle and joint findings, jaw function, parafunctional habits, and tooth-wear factors.">
      <ValueGrid record={exam} fields={['facial_symmetry', 'facial_profile', 'jaw_deviation']} columns={3} />
      <View style={styles.contentGrid}>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Muscle pain</Text><Chips value={exam.muscle_pain} neutral /></View>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Temporomandibular joint</Text><Text style={styles.valueLabel}>JOINT PAIN</Text><Chips value={exam.joint_pain} neutral /><View style={styles.divider} /><Text style={styles.valueLabel}>JOINT SOUND</Text><Text style={styles.valueText}>{pretty(exam.joint_sound)}</Text></View>
      </View>
      <Text style={[styles.cardTitle, { marginTop: 8 }]}>Jaw function</Text>
      <ValueGrid record={exam} fields={['has_limited_opening', 'mouth_opening_mm', 'has_limited_movement', 'specify_movement_detail']} />
      <View style={styles.contentGrid}>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Parafunctional habits</Text><Chips value={exam.parafunctional_habit} />{isPresent(exam.parafunctional_habit_other) && <Text style={[styles.narrative, { marginTop: 5 }]}>Other: {pretty(exam.parafunctional_habit_other)}</Text>}</View>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Factors affecting tooth wear</Text><StructuredData value={exam.factors_affecting_tooth_wear} /></View>
      </View>
      {isPresent(exam.note) && <NarrativeCard title="Clinical note" value={exam.note} />}
    </PageShell>
  );
}

function EstheticVdoPage({ data }: { data: ChartExportData }) {
  const esthetic = data.esthetic_evaluation ?? {};
  const vdo = data.vdo_evaluation ?? {};
  return (
    <PageShell data={data} title="Esthetic & VDO Evaluation" hint="Facial esthetics, lip and tooth display, phonetics, bite relationship, and vertical dimension assessment.">
      <Text style={styles.cardTitle}>Facial and dental esthetics</Text>
      <ValueGrid record={esthetic} fields={['occlusal_plane', 'midline_discrepancy', 'midline_shift', 'nasolabial_angle']} />
      <Text style={styles.cardTitle}>Lip and tooth display</Text>
      <ValueGrid record={esthetic} fields={['lip_thickness', 'lip_length', 'upper_tooth_exposure', 'lower_tooth_exposure']} />
      <Text style={styles.cardTitle}>Phonetics</Text>
      <ValueGrid record={esthetic} fields={['fv_sound', 'closest_speaking', 'reference_teeth']} columns={3} />
      <View style={styles.card}><Text style={styles.cardTitle}>Dentofacial analysis</Text><StructuredData value={esthetic.dentofacial_analysis} /></View>
      {isPresent(esthetic.note) && <NarrativeCard title="Esthetic note" value={esthetic.note} />}
      <View style={[styles.sectionHeader, { marginTop: 5 }]} wrap={false}><View style={styles.sectionAccent} /><View><Text style={styles.sectionEyebrow}>VERTICAL DIMENSION</Text><Text style={[styles.sectionTitle, { fontSize: 11 }]}>VDO Evaluation</Text></View></View>
      <ValueGrid record={vdo} fields={['bite_type', 'free_way_space', 'closest_speaking', 'reference_teeth']} />
      <View style={styles.card} wrap={false}><Text style={styles.cardTitle}>Facial soft-tissue findings</Text><Chips value={vdo.facial_soft_tissue} /></View>
      {isPresent(vdo.note) && <NarrativeCard title="VDO note" value={vdo.note} />}
    </PageShell>
  );
}

function ResidualRidgePage({ data }: { data: ChartExportData }) {
  const ridge = data.residual_ridge_assessment ?? {};
  return (
    <PageShell data={data} title="Residual Ridge Assessment" hint="Morphology, arch relationship, palatal anatomy, tongue and saliva, muscular activity, and patient attitude.">
      <Text style={styles.cardTitle}>Ridge morphology</Text>
      <ValueGrid record={ridge} fields={['ridge_height', 'ridge_width', 'jaw_size', 'ridge_shape_upper', 'ridge_shape_lower', 'ridge_relation']} columns={3} />
      <Text style={styles.cardTitle}>Arch relationship and palate</Text>
      <ValueGrid record={ridge} fields={['ridge_parallelism', 'interridge_space', 'lower_arch_form', 'palatal_vault', 'palatal_throat_form']} columns={3} />
      <View style={styles.contentGrid}>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Frenum attachment</Text><StructuredData value={ridge.freenum_attachment} /></View>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Ridge deformity</Text><StructuredData value={ridge.ridge_deformity} /></View>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Torus</Text><StructuredData value={ridge.torus_palatinus} /></View>
        <View style={styles.halfCard}><Text style={styles.cardTitle}>Tongue</Text><Text style={styles.valueLabel}>SIZE</Text><Text style={styles.valueText}>{pretty(ridge.tongue_size)}</Text><View style={styles.divider} /><Text style={styles.valueLabel}>POSITION</Text><Text style={styles.valueText}>{pretty(ridge.tongue_position)}</Text></View>
      </View>
      <Text style={[styles.cardTitle, { marginTop: 8 }]}>Functional environment</Text>
      <ValueGrid record={ridge} fields={['saliva_amount', 'saliva_consistency', 'lip_mobility', 'facial_muscle_tone', 'mental_attitude']} columns={3} />
      {isPresent(ridge.note) && <NarrativeCard title="Clinical note" value={ridge.note} />}
    </PageShell>
  );
}

function toothHasFinding(tooth: PdfExportRecord) {
  return tooth.tooth_type !== 'permanent' || isPresent(tooth.note) || isPresent(tooth.edentulous) || asRecords(tooth.caries).length > 0 || asRecords(tooth.fillings).length > 0 || isPresent(tooth.periodontal) || isPresent(tooth.vitality) || isPresent(tooth.restorations) || isPresent(tooth.implant);
}

function toothTags(tooth: PdfExportRecord | undefined) {
  if (!tooth) return ['NR'];
  const tags: string[] = [];
  if (tooth.tooth_type === 'edentulous' || tooth.edentulous) tags.push('EDEN');
  if (tooth.tooth_type === 'implant' || tooth.implant) tags.push('IMP');
  if (asRecords(tooth.caries).length > 0) tags.push(`CAR${asRecords(tooth.caries).length}`);
  if (asRecords(tooth.fillings).length > 0) tags.push(`FIL${asRecords(tooth.fillings).length}`);
  const periodontal = asRecord(tooth.periodontal);
  if (isPresent(periodontal.mobility_grade) && periodontal.mobility_grade !== 'normal') tags.push(pretty(periodontal.mobility_grade));
  const vitality = asRecord(tooth.vitality);
  if (isPresent(vitality.root_canal_treated) && vitality.root_canal_treated !== 'no') tags.push('RCT');
  if (tooth.restorations) tags.push('REST');
  return tags.length > 0 ? tags : ['OK'];
}

function toothColor(tooth: PdfExportRecord | undefined) {
  if (!tooth) return '#f8fafc';
  if (tooth.tooth_type === 'edentulous' || tooth.edentulous) return '#e2e8f0';
  if (tooth.tooth_type === 'implant' || tooth.implant) return colors.indigoSoft;
  if (asRecords(tooth.caries).length > 0) return colors.amberSoft;
  if (tooth.vitality || tooth.restorations) return colors.tealSoft;
  if (asRecords(tooth.fillings).length > 0) return colors.blueSoft;
  return '#ffffff';
}

function ToothArch({ numbers, records, label }: { numbers: number[]; records: Map<number, PdfExportRecord>; label: string }) {
  return <View><Text style={styles.archLabel}>{label}</Text><View style={styles.toothRow}>{numbers.map((number) => { const tooth = records.get(number); return <View key={number} style={[styles.toothTile, { backgroundColor: toothColor(tooth) }]}><Text style={styles.toothNumber}>{number}</Text><Text style={styles.toothState}>{toothTags(tooth).join('\n')}</Text></View>; })}</View></View>;
}

function compactObject(value: unknown) {
  const source = asRecord(value);
  return Object.entries(source).filter(([key, item]) => !hiddenKeys.has(key) && isPresent(item)).map(([key, item]) => `${humanize(key)}: ${pretty(item)}`).join(' · ');
}

function ToothDetailCard({ tooth }: { tooth: PdfExportRecord }) {
  const lines: { label: string; value: string }[] = [];
  const caries = asRecords(tooth.caries);
  const fillings = asRecords(tooth.fillings);
  if (tooth.edentulous) lines.push({ label: 'Edentulous', value: compactObject(tooth.edentulous) });
  caries.forEach((item, index) => lines.push({ label: `Caries ${index + 1}`, value: compactObject(item) }));
  fillings.forEach((item, index) => lines.push({ label: `Filling ${index + 1}`, value: compactObject(item) }));
  if (tooth.periodontal) lines.push({ label: 'Periodontal', value: compactObject(tooth.periodontal) });
  if (tooth.vitality) lines.push({ label: 'Vitality / endodontic', value: compactObject(tooth.vitality) });
  if (tooth.restorations) lines.push({ label: 'Restoration', value: compactObject(tooth.restorations) });
  if (tooth.implant) lines.push({ label: 'Implant', value: compactObject(tooth.implant) });
  if (isPresent(tooth.note)) lines.push({ label: 'Note', value: pretty(tooth.note) });
  return (
    <View style={styles.toothDetail} wrap={false}>
      <View style={styles.toothDetailHeader}><Text style={styles.toothDetailNumber}>Tooth {pretty(tooth.tooth_number)}</Text><Text style={styles.toothDetailType}>{pretty(tooth.tooth_type)}</Text></View>
      {lines.map((line, index) => <Text key={`${line.label}-${index}`} style={styles.findingLine}><Text style={styles.findingLabel}>{line.label}: </Text>{line.value}</Text>)}
    </View>
  );
}

function DentalStatusPage({ data }: { data: ChartExportData }) {
  const teeth = asRecords(data.dental_status?.teeth);
  const records = new Map(teeth.map((tooth) => [Number(tooth.tooth_number), tooth]));
  const findings = teeth.filter(toothHasFinding).sort((left, right) => Number(left.tooth_number) - Number(right.tooth_number));
  return (
    <PageShell data={data} title="Dental Status" hint="A tooth-by-tooth FDI chart with a complete detail card for every recorded clinical finding.">
      <View style={styles.toothChart} wrap={false}>
        <ToothArch label="MAXILLARY ARCH" numbers={upperTeeth} records={records} />
        <ToothArch label="MANDIBULAR ARCH" numbers={lowerTeeth} records={records} />
        <View style={styles.legend}>
          <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: colors.amberSoft }]} /><Text>Caries</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: colors.blueSoft }]} /><Text>Filling</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: colors.tealSoft }]} /><Text>Restoration / RCT</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: colors.indigoSoft }]} /><Text>Implant</Text></View>
          <View style={styles.legendItem}><View style={[styles.legendSwatch, { backgroundColor: '#e2e8f0' }]} /><Text>Edentulous</Text></View>
        </View>
      </View>
      <View style={[styles.sectionHeader, { marginBottom: 7 }]} wrap={false}><View style={styles.sectionAccent} /><View><Text style={styles.sectionEyebrow}>RECORDED FINDINGS</Text><Text style={[styles.sectionTitle, { fontSize: 10 }]}>Teeth requiring attention ({findings.length})</Text></View></View>
      {findings.length > 0 ? <View style={styles.toothDetailsGrid}>{findings.map((tooth) => <ToothDetailCard key={String(tooth.tooth_number)} tooth={tooth} />)}</View> : <View style={styles.card}><Text style={styles.empty}>No tooth-level findings recorded.</Text></View>}
    </PageShell>
  );
}

const contactColors = ['#14b8a6', '#f43f5e', '#8b5cf6', '#f59e0b', '#3b82f6', '#ec4899', '#0d9488', '#a855f7', '#ef4444', '#0ea5e9', '#84cc16', '#f97316', '#6366f1'];
const contactColor = (tooth: number) => contactColors[tooth % contactColors.length];
const isLeftContact = (upper: number, lower: number) => (upper >= 21 && upper <= 28) || (lower >= 31 && lower <= 38);
const isRightContact = (upper: number, lower: number) => (upper >= 11 && upper <= 18) || (lower >= 41 && lower <= 48);
const isInterference = (type: string, upper: number, lower: number) => (type === 'working' && isLeftContact(upper, lower)) || (type === 'non_working' && isRightContact(upper, lower));

function ContactChart({ type, contacts }: { type: typeof contactTypes[number]; contacts: PdfExportRecord[] }) {
  const width = 585;
  const height = 150;
  const boxSize = 26;
  const startX = 17;
  const step = 36.2;
  const upperY = 13;
  const lowerY = 111;
  const centerX = (index: number) => startX + (index * step) + (boxSize / 2);
  const upperIndex = new Map(upperTeeth.map((tooth, index) => [tooth, index]));
  const lowerIndex = new Map(lowerTeeth.map((tooth, index) => [tooth, index]));
  const pairedUpper = new Set(contacts.map((contact) => Number(contact.upper_tooth)));
  const pairedLower = new Map<number, number>();
  contacts.forEach((contact) => pairedLower.set(Number(contact.lower_tooth), Number(contact.upper_tooth)));
  return (
    <View style={styles.contactChart}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`}>
        <Line x1={width / 2} y1="4" x2={width / 2} y2={height - 4} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
        {contacts.map((contact, index) => {
          const upper = Number(contact.upper_tooth); const lower = Number(contact.lower_tooth);
          const upperPosition = upperIndex.get(upper); const lowerPosition = lowerIndex.get(lower);
          if (upperPosition === undefined || lowerPosition === undefined) return null;
          const x1 = centerX(upperPosition); const x2 = centerX(lowerPosition);
          const color = isInterference(type.key, upper, lower) ? colors.rose : contactColor(upper);
          return <Path key={`line-${index}`} d={`M ${x1} ${upperY + boxSize} C ${x1} 68, ${x2} 82, ${x2} ${lowerY}`} fill="none" stroke={color} strokeWidth="1.8" strokeDasharray={isInterference(type.key, upper, lower) ? '4 3' : undefined} />;
        })}
        {upperTeeth.map((tooth, index) => { const active = pairedUpper.has(tooth); const color = contactColor(tooth); return <Fragment key={`upper-${tooth}`}><Rect x={startX + (index * step)} y={upperY} width={boxSize} height={boxSize} rx="6" fill={active ? `${color}22` : '#ffffff'} stroke={active ? color : '#cbd5e1'} strokeWidth={active ? 1.7 : 1} /><SvgText x={centerX(index)} y={upperY + 17} textAnchor="middle" fontSize="8" fill={active ? color : '#475569'}>{tooth}</SvgText></Fragment>; })}
        {lowerTeeth.map((tooth, index) => { const upper = pairedLower.get(tooth); const active = upper !== undefined; const color = active ? contactColor(upper) : '#475569'; return <Fragment key={`lower-${tooth}`}><Rect x={startX + (index * step)} y={lowerY} width={boxSize} height={boxSize} rx="6" fill={active ? `${color}22` : '#ffffff'} stroke={active ? color : '#cbd5e1'} strokeWidth={active ? 1.7 : 1} /><SvgText x={centerX(index)} y={lowerY + 17} textAnchor="middle" fontSize="8" fill={color}>{tooth}</SvgText></Fragment>; })}
        {contacts.flatMap((contact, index) => {
          const upper = Number(contact.upper_tooth); const lower = Number(contact.lower_tooth);
          const upperPosition = upperIndex.get(upper); const lowerPosition = lowerIndex.get(lower);
          if (upperPosition === undefined || lowerPosition === undefined) return [];
          const color = isInterference(type.key, upper, lower) ? colors.rose : contactColor(upper);
          return [<Circle key={`u-${index}`} cx={centerX(upperPosition)} cy={upperY + boxSize} r="2.5" fill={color} />, <Circle key={`l-${index}`} cx={centerX(lowerPosition)} cy={lowerY} r="2.5" fill={color} />];
        })}
      </Svg>
    </View>
  );
}

function OcclusalPage({ data }: { data: ChartExportData }) {
  const analysis = data.occlusal_analysis ?? {};
  const metricKeys = ['right_molar', 'left_molar', 'canine_right', 'canine_left', 'overlap_horizontal', 'overlap_vertical', 'anterior_slide', 'lateral_slide', 'lateral_direction'];
  const totalContacts = data.occlusal_contacts.length;
  const mappedTypes = contactTypes.filter((type) => data.occlusal_contacts.some((contact) => contact.contact_type === type.key)).length;
  const interferenceCount = data.occlusal_contacts.filter((contact) => isInterference(String(contact.contact_type), Number(contact.upper_tooth), Number(contact.lower_tooth))).length;
  return (
    <PageShell data={data} title="Occlusal Analysis" hint="Functional measurements and five UI-style maps of upper-to-lower tooth contacts.">
      <View style={styles.occlusalMetrics}>{metricKeys.map((key) => <View key={key} style={styles.metricCard}><Text style={styles.metricLabel}>{humanize(key).toUpperCase()}</Text><Text style={styles.metricValue}>{pretty(analysis[key])}{isPresent(analysis[key]) ? unitFor(key) : ''}</Text></View>)}</View>
      <View style={styles.contactGrid}>
        {contactTypes.map((type) => {
          const contacts = data.occlusal_contacts.filter((contact) => contact.contact_type === type.key);
          return <View key={type.key} style={styles.contactCard} wrap={false}><View style={styles.contactCardHeader}><Text style={styles.contactCardTitle}>{type.label}</Text><Text style={styles.contactCardCount}>{contacts.length} mapped</Text></View><ContactChart type={type} contacts={contacts} /><Text style={styles.contactPairs}>{contacts.length > 0 ? contacts.map((contact) => `${contact.upper_tooth}—${contact.lower_tooth}${isInterference(type.key, Number(contact.upper_tooth), Number(contact.lower_tooth)) ? ' !' : ''}`).join('   ') : 'No contacts mapped.'}</Text></View>;
        })}
        <View style={styles.summaryCard} wrap={false}>
          <Text style={styles.summaryTitle}>Clinical overview</Text>
          <View style={styles.summaryStats}><View style={styles.summaryStat}><Text style={styles.summaryStatValue}>{totalContacts}</Text><Text style={styles.summaryStatLabel}>Mapped pairs</Text></View><View style={styles.summaryStat}><Text style={styles.summaryStatValue}>{mappedTypes}/5</Text><Text style={styles.summaryStatLabel}>Contact types</Text></View><View style={styles.summaryStat}><Text style={styles.summaryStatValue}>{interferenceCount}</Text><Text style={styles.summaryStatLabel}>Interferences</Text></View></View>
          <Text style={styles.summaryText}>Solid colored line: mapped contact</Text><Text style={styles.summaryText}>Rose dashed line / !: balancing interference</Text><Text style={styles.summaryText}>Notes: {pretty(analysis.note)}</Text>
        </View>
      </View>
    </PageShell>
  );
}

function ImagesPage({ data }: { data: ChartExportData }) {
  return (
    <PageShell data={data} title="Clinical Images" hint="Chart-level intraoral, panoramic, and supporting clinical images with descriptions and upload metadata.">
      {data.images.length > 0 ? <View style={styles.imageGrid}>{data.images.map((image, index) => <View key={String(image.image_id ?? index)} style={styles.imageCard} wrap={false}>{typeof image.image_url === 'string' ? <Image src={image.image_url} style={styles.image} /> : <View style={styles.imagePlaceholder}><Text>Image unavailable</Text></View>}<Text style={styles.imageType}>{pretty(image.image_type)}</Text><Text style={styles.imageDescription}>{pretty(image.description)}</Text><Text style={styles.imageMeta}>{pretty(image.image_file)}  ·  {formatDate(image.uploaded_at)}</Text></View>)}</View> : <View style={styles.card}><Text style={styles.empty}>No clinical images recorded for this chart.</Text></View>}
    </PageShell>
  );
}

export function ClinicalChartPdfDocument({ data }: { data: ChartExportData }) {
  return (
    <Document title={`IDRS Clinical Chart - ${pretty(data.patient.name)}`} author="IDRS">
      <CoverPage data={data} />
      <MedicalHistoryPage data={data} />
      <ExtraoralPage data={data} />
      <EstheticVdoPage data={data} />
      <DentalStatusPage data={data} />
      <OcclusalPage data={data} />
      <ResidualRidgePage data={data} />
      <ImagesPage data={data} />
    </Document>
  );
}