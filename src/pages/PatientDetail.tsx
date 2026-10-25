/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { useState, useEffect, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSectionSaveStore } from '@/store/sectionSaveStore';
import { UnsavedChangesDialog } from '@/components/UnsavedChangesDialog';
import { ArrowLeft, ArrowRight, Save, Upload, Trash2, X, ChevronRight, AlertCircle, FileText, HeartPulse, Stethoscope, UserSquare2, Activity, Zap, Info, Sparkles, ScanFace, Smile, Mic2, Ruler, AlertTriangle, UserMinus, Focus, Layers, Droplets, Brain, Maximize, CalendarDays, Clock, PanelLeftClose, PanelLeft, Download } from 'lucide-react';
import { pdf } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ToggleButtonGroup } from '@/components/ui/ToggleButton';
import { cn } from '@/lib/utils';
import { Image as ImageIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ToothLoaderIcon } from '@/components/ui/ToothLoader';

import { FaceMuscleChart } from '@/components/FaceMuscleChart';
import { RankedExpectationSelector } from '@/components/RankedExpectationSelector';
import { FacialSymmetry } from '@/components/FacialSymmetry';
import { FacialProfile } from '@/components/FacialProfile';

import { patientService, type BackendPatient } from '@/services/patientService';
import { imageManagementService } from '@/services/imageManagementService';
import { dentalChartService } from '@/services/dentalChartService';
import { estheticEvaluationService } from '@/services/estheticEvaluationService';
import { ClinicalChartPdfDocument } from '@/components/ClinicalChartPdfDocument';
import { prepareSavedChartPdf, type PreparedChartPdf } from '@/components/pdf/chartPdfExportWorkflow';
import type { DentalChart } from '@/services/types/dentalChart';
import { useToastStore } from '@/store/toastStore';
import MedicalHistoryForm from '@/components/chart/MedicalHistoryForm';
import ExtraoralExamForm from '@/components/chart/ExtraoralExamForm';
import EstheticEvaluation from '@/components/chart/EstheticEvaluation';
import VdoEvaluationForm from '@/components/chart/VdoEvaluationForm';
import ResidualRidgeAssessmentForm from '@/components/chart/ResidualRidgeAssessmentForm';
import { DEFAULT_STATE, sectionNames } from '@/components/chart/types';
import type { FormState } from '@/components/chart/types';

// Extracted UI Components are now in src/components/chart/components

const SECTIONS = [
    { id: 'patientHistory', title: 'Patient History' },
    { id: 'imageGallery', title: 'Image Gallery' },
    { id: 'extraoral', title: 'Extraoral Exam' },
    { id: 'esthetic', title: 'Esthetic Evaluation' },
    { id: 'vdo', title: 'VDO Evaluation' },
    { id: 'dentalStatus', title: 'Dental Status' },
    { id: 'occlusal', title: 'Occlusal Analysis' },
    { id: 'residualRidge', title: 'Residual Ridge Area' },
];

// Sections whose content spans the full width (odontogram, occlusal grids, etc.) —
// the "Next" button below them should match that width instead of the default max-w-4xl.
const WIDE_SECTIONS = new Set(['dentalStatus', 'occlusal', 'residualRidge']);
const ImageGallerySection = lazy(() => import('@/components/chart/ImageGallerySection'));
const DentalStatusForm = lazy(() => import('@/components/chart/DentalStatusForm'));
const OcclusalAnalysis = lazy(() => import('@/components/OcclusalAnalysis'));

// Types and DEFAULT_STATE extracted to src/components/chart/types.ts

export default function SequentialPatientPage() {
    const { id: patientId, chartId } = useParams<{ id: string; chartId: string }>();
    const navigate = useNavigate();
    const { show: showToast } = useToastStore();

    const [patient, setPatient] = useState<BackendPatient | null>(null);
    const [chart, setChart] = useState<DentalChart | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

    const [activeSection, setActiveSection] = useState<string>('patientHistory');
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const { sections: sectionSaveMap } = useSectionSaveStore();

    const [pendingNavPath, setPendingNavPath] = useState<string | null>(null);
    const [showNavBlockDialog, setShowNavBlockDialog] = useState(false);

    const handleSectionChange = useCallback(async (newSectionId: string) => {
        if (newSectionId === activeSection) return;
        const current = sectionSaveMap[activeSection];
        if (current?.isDirty) {
            try {
                await current.save();
            } catch {
                showToast('Failed to save changes. Please check your connection and try again.', 'error');
                return;
            }
        }
        setActiveSection(newSectionId);
        document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' });
    }, [activeSection, sectionSaveMap, showToast]);

    // Guard for navigating away from the page (back button, save record, etc.)
    const navigateWithGuard = useCallback((path: string) => {
        const hasDirty = Object.values(sectionSaveMap).some(s => s.isDirty);
        if (hasDirty) {
            setPendingNavPath(path);
            setShowNavBlockDialog(true);
            return;
        }
        navigate(path);
    }, [sectionSaveMap, navigate]);

    // Browser tab close guard
    useEffect(() => {
        const onBeforeUnload = (e: BeforeUnloadEvent) => {
            const hasDirty = Object.values(sectionSaveMap).some(s => s.isDirty);
            if (hasDirty) {
                e.preventDefault();
                e.returnValue = '';
            }
        };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [sectionSaveMap]);
    const [visitDate, setVisitDate] = useState<Date | undefined>(undefined);

    const [formData, setFormData] = useState<FormState>(DEFAULT_STATE);
    const [medFormInput, setMedFormInput] = useState({
        name: '',
        dose: '',
        frequency: '',
        dosePerTime: '',
        timeOfDay: ''
    });
    const [hasMedications, setHasMedications] = useState<boolean | null>(null);

    const [isUploading, setIsUploading] = useState(false);
    const [isExportingPdf, setIsExportingPdf] = useState(false);
    const [pendingPdf, setPendingPdf] = useState<PreparedChartPdf | null>(null);
    const pdfExportLock = useRef(false);

    useEffect(() => {
        const fetchChartDetails = async () => {
            if (!chartId || !patientId) return;
            try {
                setLoading(true);
                setError(null);
                
                const [patientResult, chartResult, imagesResult] = await Promise.allSettled([
                    patientService.getById(patientId),
                    dentalChartService.getById(chartId),
                    imageManagementService.getByChart(chartId),
                ]);

                if (patientResult.status === 'rejected') {
                    throw patientResult.reason;
                }
                if (chartResult.status === 'rejected') {
                    throw chartResult.reason;
                }

                const patientData = patientResult.value;
                setPatient(patientData);
                if (patientData.last_visit) {
                    setVisitDate(parseISO(patientData.last_visit));
                }

                setChart(chartResult.value);

                if (imagesResult.status === 'fulfilled') {
                    // Warm the shared image cache for the Image Gallery and odontogram.
                } else {
                    console.error("Failed to fetch chart images", imagesResult.reason);
                }
            } catch (err: any) {
                console.error("Failed to retrieve chart details", err);
                const status = err?.response?.status;
                if (status === 404) {
                    showToast("Record not found. It may have been deleted.", "error");
                    setError("Record not found. It may have been deleted.");
                } else {
                    showToast("Database connection error. Cannot retrieve chart details.", "error");
                    setError("Database connection error. Cannot retrieve chart details.");
                }
            } finally {
                setLoading(false);
            }
        };

        fetchChartDetails();
    }, [chartId, patientId, showToast]);

    // sectionNotes saving logic removed - handled by individual components

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updateField = (field: keyof FormState, value: any) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const toggleArrayField = (field: keyof FormState, value: string) => {
        setFormData(prev => {
            const arr = prev[field] as string[];
            if (arr.includes(value)) {
                return { ...prev, [field]: arr.filter(item => item !== value) };
            }
            return { ...prev, [field]: [...arr, value] };
        });
    };

    const isVdoLost = Number(formData.vdoFreewaySpaceMm) > 4;

    const handleSave = async () => {
        const dirtySections = Object.values(sectionSaveMap).filter(s => s.isDirty);
        if (dirtySections.length > 0) {
            try {
                await Promise.all(dirtySections.map(s => s.save()));
            } catch {
                showToast('Failed to save changes. Please check your connection and try again.', 'error');
                return;
            }
        }
        showToast('Clinical charting session completed and saved.', 'success');
        navigate(`/patients/${patientId}`);
    };

    const downloadPreparedPdf = async ({ data, assets }: PreparedChartPdf) => {
        const blob = await pdf(<ClinicalChartPdfDocument data={data} assets={assets} />).toBlob();
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        try {
            link.href = url;
            const identifier = String(data.patient.hn_number ?? chartId).replace(/[\\/:*?"<>|]/g, '-');
            link.download = `IDRS-Clinical-Chart-${identifier}.pdf`;
            document.body.appendChild(link);
            link.click();
            showToast(assets.warnings?.length ? 'Partial PDF downloaded. See Export limitations in the document.' : 'Clinical chart PDF downloaded.', assets.warnings?.length ? 'info' : 'success');
        } finally {
            link.remove();
            // Allow the browser to start reading the blob before revoking it.
            setTimeout(() => URL.revokeObjectURL(url), 60_000);
        }
    };

    const handlePdfExport = async (partial?: PreparedChartPdf) => {
        if (!chartId || pdfExportLock.current) return;
        pdfExportLock.current = true;
        setPendingPdf(null);
        setIsExportingPdf(true);
        try {
            const prepared = partial ?? await prepareSavedChartPdf(chartId);
            if (!partial && prepared.assets.warnings?.length) {
                setPendingPdf(prepared);
                return;
            }
            await downloadPreparedPdf(prepared);
        } catch (err) {
            console.error('Failed to export clinical chart PDF', err);
            showToast(err instanceof Error && err.message.startsWith('Changes could not be saved')
                ? err.message : 'Could not create the PDF. Please try again.', 'error');
        } finally {
            pdfExportLock.current = false;
            setIsExportingPdf(false);
        }
    };

    const backPath = `/patients/${patientId}`;

    if (loading) {
        return (
            <div className="flex h-full min-h-[24rem] items-center justify-center bg-slate-50 p-6">
                <div className="flex w-full max-w-sm flex-col items-center rounded-2xl border border-slate-200 bg-white px-8 py-7 text-center shadow-sm">
                    <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-full bg-teal-50">
                        <ToothLoaderIcon className="h-16 w-16" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800">Opening clinical chart</h3>
                    <p className="mt-1 text-sm text-slate-500">Loading the patient record and chart details.</p>
                </div>
            </div>
        );
    }

    if (error || !chart || !patient) {
        return (
            <div className="flex flex-col items-center justify-center p-20 min-h-[60vh] text-center">
                <AlertCircle className="w-12 h-12 text-rose-500 mb-4" />
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Error Loading Chart</h2>
                <p className="text-slate-500 mb-6">{error || "Chart details could not be found."}</p>
                <button 
                    onClick={() => navigate(`/patients/${patientId}`)}
                    className="bg-slate-800 hover:bg-slate-900 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
                >
                    Back to Patient Repository
                </button>
            </div>
        );
    }


    return (
        <>
        <div inert={isExportingPdf || !!pendingPdf} className="flex flex-col h-full bg-slate-50 relative">
            {/* Top Header */}
            <header className="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shrink-0 shadow-sm z-10 relative gap-3">
                <div className="flex min-w-0 items-center gap-2 sm:gap-4 border-slate-200 pr-2 sm:pr-4">
                    <Button variant="ghost" className="p-2 h-auto text-slate-500 hover:bg-slate-100 rounded-full" onClick={() => navigateWithGuard(backPath)}>
                        <ArrowLeft className="w-5 h-5" />
                    </Button>
                    <div className="flex min-w-0 flex-col">
                        <div className="mb-1 flex items-center gap-2"><span className="text-[10px] font-bold uppercase tracking-wider text-teal-700">Clinical chart</span><span className="h-1 w-1 rounded-full bg-slate-300" /><span className="hidden sm:inline text-[10px] font-medium text-slate-400">{format(parseISO(chart.record_date), 'PPP')}</span></div>
                        <h2 className="truncate text-lg sm:text-xl font-bold text-slate-800 flex items-center gap-3">
                            {patient.name}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-xs sm:text-sm text-slate-500">
                            <span>{patient.hn_number}</span>
                            <span>•</span>
                            <span>{patient.sex}, {patient.age}</span>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 sm:gap-3">
                    <Button aria-label="Download PDF" variant="outline" onClick={() => void handlePdfExport()} disabled={isExportingPdf} className="h-10 gap-2 rounded-xl border-slate-300 px-3 text-slate-700 hover:bg-slate-100 sm:h-11 sm:px-4">
                        <Download className="w-4 h-4" />
                        <span className="sm:hidden">{isExportingPdf ? 'Creating...' : 'PDF'}</span>
                        <span className="hidden sm:inline">{isExportingPdf ? 'Creating PDF...' : 'Download PDF'}</span>
                    </Button>
                    <Button onClick={handleSave} className="h-10 gap-2 rounded-xl bg-teal-500 px-3 text-white shadow-md shadow-teal-500/10 hover:bg-teal-600 sm:h-11 sm:px-6">
                        <Save className="w-4 h-4" />
                        <span className="sm:hidden">Save</span>
                        <span className="hidden sm:inline">Save record</span>
                    </Button>
                </div>
            </header>

            {/* Main Layout Area */}
            <div className="flex-1 flex overflow-hidden w-full">

                {/* Left Sidebar Menu */}
                <aside className={cn(
                    "bg-white border-r border-slate-200 flex flex-col pt-5 shrink-0 z-20 overflow-y-auto transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "w-72 max-md:w-16" : "w-20 items-center"
                )}>
                    <div className={cn("flex items-center mb-4 px-4", isSidebarOpen ? "justify-between" : "justify-center")}>
                        {isSidebarOpen && <h3 className="max-md:hidden text-xs font-bold uppercase tracking-wider text-slate-400">Clinical record</h3>}
                        <Button variant="ghost" size="sm" onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="p-1.5 h-auto text-slate-400 hover:text-slate-600 hover:bg-slate-100" title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}>
                            {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                        </Button>
                    </div>
                    <div className="flex-1 px-3 space-y-1 w-full">
                        {SECTIONS.map((sec, idx) => {
                            const isActive = activeSection === sec.id;
                            return (
                                <button
                                    key={sec.id}
                                    onClick={() => handleSectionChange(sec.id)}
                                    className={cn(
                                        "w-full flex items-center px-3 py-3 rounded-xl text-left text-sm font-medium transition-all group",
                                        isSidebarOpen ? "justify-between max-md:justify-center" : "justify-center",
                                        isActive
                                            ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-100"
                                            : "text-slate-600 hover:bg-slate-100 border border-transparent"
                                    )}
                                    title={sec.title}
                                >
                                    <span className={cn("flex items-center", isSidebarOpen ? "gap-3" : "justify-center")}>
                                        <span className={cn(
                                            "flex items-center justify-center shrink-0 w-6 h-6 rounded-full text-xs font-bold font-mono transition-colors",
                                            isActive ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-500 group-hover:bg-slate-300"
                                        )}>
                                            {idx + 1}
                                        </span>
                                        {isSidebarOpen && <span className="max-md:hidden truncate">{sec.title}</span>}
                                        {sectionSaveMap[sec.id]?.isDirty && (
                                            <span className="ml-1 h-2 w-2 shrink-0 rounded-full bg-amber-400" title="Unsaved changes" />
                                        )}
                                    </span>
                                    {isSidebarOpen && isActive && <ChevronRight className="max-md:hidden w-4 h-4 shrink-0" />}
                                </button>
                            )
                        })}
                    </div>
                </aside>

                {/* Dynamic Content Area */}
                <main className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-6 md:p-8 relative">
                    <div className={cn("mb-5 flex items-center justify-between border-b border-slate-200 pb-3", WIDE_SECTIONS.has(activeSection) ? "w-full max-w-none" : "max-w-4xl mx-auto")}>
                        <h1 className="text-base font-bold text-slate-800 sm:text-lg">
                            {SECTIONS.find(section => section.id === activeSection)?.title}
                        </h1>
                        <span className="rounded-md bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-700">
                            {SECTIONS.findIndex(section => section.id === activeSection) + 1} / {SECTIONS.length}
                        </span>
                    </div>
                    {/* 2. Patient History */}
                    {chartId && patient && activeSection === "patientHistory" && (
                        <div className="max-w-4xl mx-auto">
                            <MedicalHistoryForm
                                chartId={chartId}
                                patient={patient}
                                onEditPatient={() => navigate(`/patients/${patient.patient_id}`, { state: { openEditProfile: true } })}
                            />
                        </div>
                    )}

                    {/* 3. Image Gallery */}
                    {chartId && activeSection === "imageGallery" && (
                        <div className="max-w-4xl mx-auto">
                            <Suspense fallback={<ChartSectionLoader />}>
                                <ImageGallerySection chartId={chartId} />
                            </Suspense>
                        </div>
                    )}

                    {/* 4. Extraoral Exam Form */}
                    {chartId && activeSection === "extraoral" && (
                        <div className="max-w-4xl mx-auto">
                            <ExtraoralExamForm chartId={chartId} />
                        </div>
                    )}

                    {/* 4. Esthetic Evaluation */}
                    {chartId && activeSection === 'esthetic' && (
                        <div className="max-w-4xl mx-auto">
                            <EstheticEvaluation chartId={chartId} />
                        </div>
                    )}

                    {/* 5. VDO Evaluation */}
                    {chartId && activeSection === 'vdo' && (
                        <div className="max-w-4xl mx-auto">
                            <VdoEvaluationForm chartId={chartId} />
                        </div>
                    )}

                    {/* 6. Dental Status */}
                    {chartId && activeSection === 'dentalStatus' && (
                        <div className="h-full w-full max-w-none">
                            <Suspense fallback={<ChartSectionLoader />}>
                                <DentalStatusForm
                                    chartId={chartId}
                                    onNext={() => {
                                        const idx = SECTIONS.findIndex(s => s.id === 'dentalStatus');
                                        const next = SECTIONS[idx + 1];
                                        if (next) handleSectionChange(next.id);
                                    }}
                                    nextLabel={`Next: ${SECTIONS[SECTIONS.findIndex(s => s.id === 'dentalStatus') + 1]?.title ?? ''}`}
                                    onGoToImageGallery={() => handleSectionChange('imageGallery')}
                                />
                            </Suspense>
                        </div>
                    )}

                    {/* 7. Occlusal Analysis */}
                    {chartId && activeSection === 'occlusal' && (
                        <div className="w-full max-w-none">
                            <Suspense fallback={<ChartSectionLoader />}>
                                <OcclusalAnalysis chartId={chartId} />
                            </Suspense>
                        </div>
                    )}

                    {/* 8. Residual Ridge Area */}
                    {chartId && activeSection === 'residualRidge' && (
                        <div className="w-full max-w-none">
                            <ResidualRidgeAssessmentForm chartId={chartId} />
                        </div>
                    )}

                    {/* Next Section Button */}
                    {chartId && (() => {
                        // Dental Status has its own "Next" button in the odontogram header — skip the floating one here.
                        if (activeSection === 'dentalStatus') return null;
                        const currentIndex = SECTIONS.findIndex(s => s.id === activeSection);
                        if (currentIndex === -1 || currentIndex === SECTIONS.length - 1) return null;
                        const nextSection = SECTIONS[currentIndex + 1];
                        const isWide = WIDE_SECTIONS.has(activeSection);
                        return (
                            <div className={cn("mt-5 flex justify-end border-t border-slate-200 pt-4 pb-8", isWide ? "w-full max-w-none" : "max-w-4xl mx-auto")}>
                                <Button
                                    onClick={() => handleSectionChange(nextSection.id)}
                                    className="h-10 rounded-lg bg-slate-800 px-4 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-slate-700"
                                >
                                    Next: {nextSection.title}
                                    <ArrowRight className="ml-2 w-4 h-4" />
                                </Button>
                            </div>
                        );
                    })()}
                </main>
            </div>

            {/* Unsaved changes dialog — navigating away from page */}
            <UnsavedChangesDialog
                open={showNavBlockDialog}
                sectionName="All unsaved sections"
                onSave={async () => {
                    const saves = Object.values(sectionSaveMap)
                        .filter(s => s.isDirty)
                        .map(s => s.save());
                    await Promise.all(saves);
                    setShowNavBlockDialog(false);
                    if (pendingNavPath) navigate(pendingNavPath);
                }}
                onDiscard={() => {
                    setShowNavBlockDialog(false);
                    if (pendingNavPath) navigate(pendingNavPath);
                    setPendingNavPath(null);
                }}
                onCancel={() => {
                    setShowNavBlockDialog(false);
                    setPendingNavPath(null);
                }}
            />

            {selectedImageUrl && (
                <div className="fixed inset-0 z-50 bg-slate-900/95 flex items-center justify-center p-4 sm:p-8 backdrop-blur-md animate-in zoom-in-95 duration-200">
                    <Button variant="ghost" className="absolute top-4 right-4 text-white hover:bg-white/10 p-2 h-auto" onClick={() => setSelectedImageUrl(null)}>
                        <X className="w-6 h-6" />
                    </Button>
                    <img src={selectedImageUrl} alt="Preview" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain" />
                </div>
            )}
        </div>
        {isExportingPdf && <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40" role="status" aria-live="polite"><div className="rounded-2xl bg-white p-8 shadow-xl">Saving chart and preparing PDF...</div></div>}
        {pendingPdf && (
            <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-slate-900/40 p-4">
                <div role="dialog" aria-modal="true" aria-labelledby="pdf-warning-title" className="max-h-[85vh] w-full max-w-lg overflow-auto rounded-2xl bg-white p-6 shadow-xl" onKeyDown={(event) => {
                    if (event.key === 'Escape') setPendingPdf(null);
                    if (event.key === 'Tab') {
                        const buttons = Array.from(event.currentTarget.querySelectorAll('button'));
                        const first = buttons[0]; const last = buttons[buttons.length - 1];
                        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
                        if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
                    }
                }}>
                    <h2 id="pdf-warning-title" className="text-xl font-bold">Some content could not be loaded</h2>
                    <p className="mt-2 text-sm text-slate-600">Retry to include the missing content, or export a partial PDF with these limitations listed in the document.</p>
                    <ul className="my-4 list-disc space-y-2 pl-5 text-sm">{pendingPdf.assets.warnings?.map((warning, index) => <li key={index}>{warning}</li>)}</ul>
                    <div className="flex flex-wrap justify-end gap-2">
                        <Button variant="outline" onClick={() => setPendingPdf(null)}>Cancel</Button>
                        <Button autoFocus onClick={() => void handlePdfExport()}>Retry</Button>
                        <Button variant="outline" onClick={() => void handlePdfExport(pendingPdf)}>Export available content</Button>
                    </div>
                </div>
            </div>
        )}
        </>
    );
}

function ChartSectionLoader() {
    return (
        <div className="w-full animate-pulse space-y-6 py-2">
            <div className="h-6 w-52 rounded-md bg-slate-200" />
            <div className="grid gap-5 lg:grid-cols-[16rem_1fr]">
                <div className="space-y-3">
                    {[1, 2, 3, 4].map((item) => <div key={item} className="h-16 rounded-xl bg-slate-200" />)}
                </div>
                <div className="min-h-72 rounded-xl border border-slate-200 bg-white p-6">
                    <div className="h-5 w-40 rounded bg-slate-200" />
                    <div className="mt-6 grid grid-cols-4 gap-3 sm:grid-cols-8">
                        {Array.from({ length: 16 }, (_, index) => <div key={index} className="aspect-square rounded-lg bg-slate-100" />)}
                    </div>
                </div>
            </div>
        </div>
    );
}
