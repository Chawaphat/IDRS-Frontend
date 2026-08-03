/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { patientService } from '@/services/patientService';
import type { BackendPatient, ImageManagement } from '@/services/patientService';
import { dentalChartService } from '@/services/dentalChartService';
import type { DentalChart } from '@/services/types/dentalChart';
import { ArrowLeft, Plus, FileText, Calendar, Clock, ChevronRight, LayoutDashboard, ImageIcon, Stethoscope, PanelLeftClose, PanelLeft, X, Trash2, AlertTriangle } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import type { Patient } from './Patients';
import { useAuthStore } from '@/store/authStore';
import { useConfirmStore } from '@/store/confirmStore';

const SIDEBAR_MENUS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'charts', label: 'Clinical Charts', icon: Stethoscope },
  { id: 'images', label: 'Images', icon: ImageIcon },
];

export default function PatientProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { show: showToast } = useToastStore();
  const { user } = useAuthStore();
  
  const [patient, setPatient] = useState<Patient | null>(null);
  const [charts, setCharts] = useState<DentalChart[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeMenu, setActiveMenu] = useState('overview');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const [images, setImages] = useState<ImageManagement[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [isCreatingChart, setIsCreatingChart] = useState(false);

  const askConfirm = useConfirmStore((state) => state.ask);

  const [isEditing, setIsEditing] = useState(false);
  const [isSavingEdit, setIsSavingEdit] = useState(false);
  const hasOpenedEditFromRoute = useRef(false);
  const [editForm, setEditForm] = useState({
    name: '',
    sex: 'Male',
    age: '',
    phone: '',
    allergy: ''
  });

  const handleOpenEdit = () => {
    if (!patient) return;
    setEditForm({
      name: patient.name,
      sex: patient.gender === 'Unknown' ? 'Male' : patient.gender,
      age: patient.age.toString(),
      phone: patient.phone === 'No phone' ? '' : patient.phone,
      allergy: patient.clinicalSummary?.medicalAlerts?.join(', ') || ''
    });
    setIsEditing(true);
  };

  useEffect(() => {
    const stateData = location.state as { openEditProfile?: boolean } | null;
    if (!patient || !stateData?.openEditProfile || hasOpenedEditFromRoute.current) return;

    hasOpenedEditFromRoute.current = true;
    handleOpenEdit();
    navigate(location.pathname, {
      replace: true,
      state: { ...stateData, openEditProfile: false }
    });
  }, [patient, location.state, location.pathname, navigate]);

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !patient) return;

    // Validate (SRS-04)
    if (!editForm.name.trim()) {
      showToast("Full Name is required.", "error"); // SRS-05
      return;
    }

    if (editForm.age) {
      const parsedAge = parseInt(editForm.age, 10);
      if (isNaN(parsedAge) || parsedAge < 0) {
        showToast("Age must be a positive number.", "error"); // SRS-05
        return;
      }
    }

    try {
      setIsSavingEdit(true);
      const payload = {
        name: editForm.name.trim(),
        age: editForm.age ? parseInt(editForm.age, 10) : null,
        sex: editForm.sex,
        hn_number: patient.hn, // keep existing HN
        phone: editForm.phone.trim() || null,
        allergy: editForm.allergy.trim() || null
      };

      // Send request to update patient record (SRS-06)
      const updatedBackendPatient = await patientService.update(id, payload);
      
      // Update local state (SRS-09)
      setPatient({
        id: updatedBackendPatient.patient_id,
        hn: updatedBackendPatient.hn_number,
        name: updatedBackendPatient.name,
        age: updatedBackendPatient.age || 0,
        gender: updatedBackendPatient.sex || 'Unknown',
        phone: updatedBackendPatient.phone || 'No phone',
        status: 'Active',
        lastVisit: 'N/A',
        clinicalSummary: {
          medicalAlerts: updatedBackendPatient.allergy ? [updatedBackendPatient.allergy] : []
        }
      });

      showToast("Patient profile updated successfully", "success"); // SRS-08
      setIsEditing(false); // Close form
    } catch (err: any) {
      console.error("Failed to update patient profile", err);
      // Database connection error (SRS-07)
      showToast("Database connection error. Cannot update patient profile at this time.", "error");
    } finally {
      setIsSavingEdit(false);
    }
  };


  const fetchImages = async (chartsList: DentalChart[]) => {
    try {
      setLoadingImages(true);
      const imagesPromises = chartsList.map(chart => 
        patientService.getChartImages(chart.chart_id).catch(() => [] as ImageManagement[])
      );
      const results = await Promise.all(imagesPromises);
      setImages(results.flat());
    } catch (err) {
      console.error("Failed to load images", err);
    } finally {
      setLoadingImages(false);
    }
  };

  const confirmDeleteChart = (e: React.MouseEvent, chart: DentalChart) => {
    e.stopPropagation();
    askConfirm({
      title: "Delete Dental Chart",
      message: `Are you sure you want to delete the clinical chart created on ${new Date(chart.created_at).toLocaleDateString()} at ${new Date(chart.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}? All associated records will be permanently removed.`,
      confirmText: "Delete Chart",
      cancelText: "Cancel",
      type: "danger",
      onConfirm: async () => {
        try {
          await dentalChartService.delete(chart.chart_id); // SRS-60
          setCharts(prev => prev.filter(c => c.chart_id !== chart.chart_id)); // SRS-61
          showToast("Dental chart deleted successfully", "success"); // SRS-62
        } catch (err) {
          console.error("Failed to delete dental chart", err);
          showToast("Cannot connect to the database. Failed to delete dental chart.", "error"); // SRS-63
        }
      }
    });
  };

  const refreshChartsList = async () => {
    if (!id) return;
    try {
      const chartsRes = await dentalChartService.getByPatient(id);
      setCharts(chartsRes);
      if (chartsRes.length > 0) {
        await fetchImages(chartsRes);
      } else {
        setImages([]);
      }
    } catch (err) {
      console.error("Failed to refresh chart list", err);
    }
  };

  const handleChartClick = async (chartId: string) => {
    try {
      // Send request to retrieve detailed data for selected chart (SRS-01)
      await dentalChartService.getById(chartId);
      // Redirect to Chart Detail upon successful data retrieval (SRS-04)
      navigate(`/patients/${patient?.id}/charts/${chartId}`);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // Record not found: display message & refresh chart list (SRS-03)
        showToast("Record not found. It may have been deleted.", "error");
        refreshChartsList();
      } else {
        // Database connection error: display message & keep user on page (SRS-02)
        showToast("Database connection error. Cannot retrieve chart details at this time.", "error");
      }
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const handleImageClick = async (chartId: string, imageId: string) => {
    try {
      // Send request to retrieve detailed data for selected image (SRS-01)
      await patientService.getImageById(chartId, imageId);
      // Redirect to Chart Detail upon successful data retrieval (SRS-04)
      navigate(`/patients/${patient?.id}/charts/${chartId}`);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 404) {
        // Record not found: display message & refresh chart list (SRS-03)
        showToast("Record not found. It may have been deleted.", "error");
        refreshChartsList();
      } else {
        // Database connection error: display message & keep user on page (SRS-02)
        showToast("Database connection error. Cannot retrieve chart details at this time.", "error");
      }
    }
  };

  useEffect(() => {
    const stateData = location.state as { patientData?: BackendPatient; chartsData?: DentalChart[] } | null;
    
    if (stateData?.patientData) {
      const p = stateData.patientData;
      setPatient({
        id: p.patient_id,
        hn: p.hn_number,
        name: p.name,
        age: p.age || 0,
        gender: p.sex || 'Unknown',
        phone: p.phone || 'No phone',
        status: 'Active',
        lastVisit: 'N/A',
        clinicalSummary: {
          medicalAlerts: p.allergy ? [p.allergy] : []
        }
      });
      const cList = stateData.chartsData || [];
      setCharts(cList);
      setLoading(false);
      if (cList.length > 0) {
        fetchImages(cList);
      }
      return;
    }

    const fetchPatientData = async () => {
      try {
        setLoading(true);
        if (!id) return;

        // Fetch patient details
        const p = await patientService.getById(id);
        setPatient({
          id: p.patient_id,
          hn: p.hn_number,
          name: p.name,
          age: p.age || 0,
          gender: p.sex || 'Unknown',
          phone: p.phone || 'No phone',
          status: 'Active',
          lastVisit: 'N/A',
          clinicalSummary: {
            medicalAlerts: p.allergy ? [p.allergy] : []
          }
        });

        // Fetch charts
        let chartsRes: DentalChart[] = [];
        try {
          chartsRes = await dentalChartService.getByPatient(id);
        } catch (chartErr: any) {
          if (chartErr?.response?.status !== 404) {
            throw chartErr;
          }
        }
        setCharts(chartsRes);
        if (chartsRes.length > 0) {
          await fetchImages(chartsRes);
        }
      } catch (err: any) {
        console.error("Failed to fetch patient data", err);
        const status = err?.response?.status;
        if (status === 404) {
          showToast("Patient record not found. It may have been deleted.", "error");
          setError("Patient record not found. It may have been deleted.");
        } else {
          showToast("Database connection error. Cannot retrieve patient data at this time.", "error");
          setError("Database connection error. Cannot retrieve patient data at this time.");
        }
        navigate('/patients', { replace: true });
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [id, location.state, navigate, showToast]);

  if (loading) {
    return (
      <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-6 py-8">
        {/* Title Header Skeleton */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              className="p-2 h-auto text-slate-400 hover:bg-slate-200 rounded-full transition-colors" 
              disabled
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Repository</h1>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-slate-400 text-sm">Directory /</span>
                <div className="h-4 bg-slate-200 rounded w-24 animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Layout Area */}
        <div className="flex-1 flex gap-8 w-full min-h-0 overflow-hidden">
            
          {/* Left Sidebar Menu Skeleton */}
          <aside className="bg-white border border-slate-200 rounded-2xl flex flex-col py-6 shrink-0 w-72 shadow-sm h-full">
              <div className="flex items-center justify-between mb-6 px-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Repository Menu</h3>
              </div>

              {/* Minimal Patient Card in Sidebar */}
              <div className="flex items-center gap-3 mb-6 px-5">
                  <div className="w-12 h-12 rounded-full bg-slate-200 animate-pulse shrink-0"></div>
                  <div className="flex flex-col space-y-1.5 flex-1">
                      <div className="h-4 bg-slate-200 rounded w-3/4 animate-pulse"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/2 animate-pulse"></div>
                  </div>
              </div>
              
              <div className="flex-1 px-3 space-y-1 w-full opacity-60 pointer-events-none">
                  {SIDEBAR_MENUS.map(menu => {
                      const isActive = activeMenu === menu.id;
                      const Icon = menu.icon;
                      return (
                          <button
                              key={menu.id}
                              className={`w-full flex items-center px-3 py-3 rounded-xl text-left text-sm font-medium border border-transparent ${
                                  isActive ? "bg-teal-50 text-teal-700 font-semibold" : "text-slate-600"
                              }`}
                          >
                              <Icon className={`w-5 h-5 shrink-0 mr-3 ${isActive ? "text-teal-600" : "text-slate-400"}`} />
                              <span>{menu.label}</span>
                          </button>
                      );
                  })}
              </div>
          </aside>

          {/* Dynamic Content Area Skeleton */}
          <main className="flex-1 flex flex-col min-h-0 relative h-full pr-2">
              <div className="flex-1 flex flex-col gap-6 min-h-0">
                  
                  {/* Patient Summary Panel Skeleton */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shrink-0">
                      <div className="flex-1 space-y-2.5">
                          <div className="h-6 bg-slate-200 rounded w-1/3 animate-pulse"></div>
                          <div className="flex items-center gap-3">
                              <div className="h-5 bg-slate-200 rounded w-20 animate-pulse"></div>
                              <div className="h-4 bg-slate-200 rounded w-32 animate-pulse"></div>
                          </div>
                      </div>
                      <div className="h-10 bg-slate-100 rounded-xl w-28 animate-pulse shrink-0"></div>
                  </div>

                  {/* Charts Section Skeleton */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col min-h-0">
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
                          <div className="space-y-2 flex-1">
                              <div className="h-5 bg-slate-200 rounded w-32 animate-pulse"></div>
                              <div className="h-3 bg-slate-200 rounded w-56 animate-pulse"></div>
                          </div>
                          <div className="h-10 bg-slate-100 rounded-xl w-32 animate-pulse shrink-0"></div>
                      </div>

                      <div className="flex-1 overflow-y-auto pr-1 pl-4 py-2 custom-scrollbar">
                          <div className="relative ml-4 pl-8 space-y-6">
                              {[1, 2, 3].map((i, index) => (
                                  <div key={i} className="relative group animate-pulse">
                                      {/* Skeleton Timeline Line Connector */}
                                      {index < 2 && (
                                          <div className="absolute -left-[33px] top-12 -bottom-11 w-[2px] bg-slate-100" />
                                      )}

                                      {/* Skeleton Timeline Dot Indicator */}
                                      <div className="absolute top-5 -left-[49px] w-8 h-8 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                                          <span className="w-2.5 h-2.5 rounded-full bg-slate-200" />
                                      </div>

                                      {/* Skeleton Timeline Card */}
                                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
                                          <div className="space-y-3 flex-1 w-full">
                                              <div className="flex items-center gap-3">
                                                  <div className="h-5 bg-slate-200 rounded w-48"></div>
                                                  <div className="h-4 bg-slate-200 rounded w-16"></div>
                                              </div>
                                              <div className="h-3 bg-slate-200 rounded w-3/4"></div>
                                          </div>

                                          <div className="flex items-center gap-6 shrink-0 w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 pt-4 md:pt-0 border-slate-100 mt-2 md:mt-0">
                                              <div className="flex items-center text-xs text-slate-500 font-semibold gap-3">
                                                  <div className="h-8 bg-slate-200/50 rounded-lg w-24"></div>
                                                  <div className="h-8 bg-slate-200/50 rounded-lg w-24"></div>
                                              </div>
                                              <div className="w-5 h-5 rounded bg-slate-200"></div>
                                          </div>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                  </div>
              </div>
          </main>
        </div>
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="flex flex-col items-center justify-center p-20 h-full">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Error</h2>
        <p className="text-slate-500 mb-6">{error || "Patient not found"}</p>
        <button 
          className="bg-teal-500 hover:bg-teal-600 text-white font-semibold py-2 px-6 rounded-xl transition-colors"
          onClick={() => navigate('/patients')}
        >
          Back to Directory
        </button>
      </div>
    );
  }

  const handleCreateChart = async () => {
    if (!patient) return;
    if (!user) {
      showToast("Authentication error. Please log in again.", "error");
      return;
    }

    try {
      setIsCreatingChart(true);
      const newChart = await dentalChartService.create({
        patient_id: patient.id,
        dentist_id: user.id
      });
      showToast("Clinical chart created successfully", "success");
      navigate(`/patients/${patient.id}/charts/${newChart.chart_id}`);
    } catch (err: any) {
      console.error("Failed to create dental chart", err);
      showToast("Database connection error. Cannot create dental chart at this time.", "error");
    } finally {
      setIsCreatingChart(false);
    }
  };

  const sortedCharts = [...charts].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  return (
    <div className="flex flex-col h-full w-full max-w-7xl mx-auto px-6 py-8">
      {/* Title Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 shrink-0">
        <div className="flex items-center gap-4">
          <button 
            className="p-2 h-auto text-slate-500 hover:bg-slate-200 rounded-full transition-colors" 
            onClick={() => navigate('/patients')}
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Patient Repository</h1>
            <p className="text-slate-500 mt-1 flex items-center gap-2">
                Directory / <span className="font-semibold text-slate-700">{patient.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Layout Area */}
      <div className="flex-1 flex gap-8 w-full min-h-0 overflow-hidden">
          
        {/* Left Sidebar Menu */}
        <aside className={`bg-white border border-slate-200 rounded-2xl flex flex-col py-6 shrink-0 z-20 overflow-y-auto shadow-sm transition-all duration-300 ease-in-out h-full ${isSidebarOpen ? "w-72" : "w-20 items-center"}`}>
            {/* Header / Collapse Toggle */}
            <div className={`flex items-center mb-6 px-4 ${isSidebarOpen ? "justify-between" : "justify-center"}`}>
                {isSidebarOpen && <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Repository Menu</h3>}
                <button 
                  onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
                  className="p-1.5 h-auto text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg" 
                  title={isSidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
                >
                    {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeft className="w-5 h-5" />}
                </button>
            </div>

            {/* Minimal Patient Card in Sidebar */}
            {isSidebarOpen && (
                <div className="flex items-center gap-3 mb-6 px-5">
                    <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-lg font-bold shrink-0 border border-slate-200">
                        {patient.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                        <h3 className="font-bold text-slate-900 text-base truncate">{patient.name}</h3>
                        <span className="text-slate-500 text-xs font-mono">{patient.hn}</span>
                    </div>
                </div>
            )}
            {!isSidebarOpen && (
                <div className="flex flex-col items-center mb-6" title={`${patient.name} (${patient.hn})`}>
                    <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-sm border border-slate-200">
                        {patient.name.charAt(0).toUpperCase()}
                    </div>
                </div>
            )}
            
            <div className="flex-1 px-3 space-y-1 w-full">
                {SIDEBAR_MENUS.map(menu => {
                    const isActive = activeMenu === menu.id;
                    const Icon = menu.icon;
                    return (
                        <button
                            key={menu.id}
                            onClick={() => setActiveMenu(menu.id)}
                            className={`w-full flex items-center px-3 py-3 rounded-xl text-left text-sm font-medium transition-all group ${
                                isSidebarOpen ? "justify-start" : "justify-center"
                            } ${
                                isActive 
                                    ? "bg-teal-50 text-teal-700 shadow-sm border border-teal-100 font-semibold" 
                                    : "text-slate-600 hover:bg-slate-50 border border-transparent"
                            }`}
                            title={!isSidebarOpen ? menu.label : undefined}
                        >
                            <Icon className={`w-5 h-5 shrink-0 ${isActive ? "text-teal-600" : "text-slate-400 group-hover:text-slate-500"} ${isSidebarOpen ? "mr-3" : ""}`} />
                            {isSidebarOpen && <span className="truncate">{menu.label}</span>}
                        </button>
                    );
                })}
            </div>
        </aside>

        {/* Dynamic Content Area */}
        <main className="flex-1 flex flex-col min-h-0 relative h-full pr-2">
            <div className="flex-1 flex flex-col gap-6 min-h-0">
                
                {/* Patient Summary Panel */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col md:flex-row gap-6 items-start md:items-center justify-between shrink-0">
                    <div className="flex flex-col">
                        <h2 className="text-xl font-bold text-slate-900 mb-1">{patient.name}</h2>
                        <div className="flex items-center gap-3 text-sm text-slate-500">
                            <span className="font-mono text-slate-700 font-semibold bg-slate-100 px-2 py-0.5 rounded">{patient.hn}</span>
                            <span>{patient.gender}, {patient.age} yrs</span>
                            {patient.phone !== 'No phone' && <span>• {patient.phone}</span>}
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {patient.clinicalSummary?.medicalAlerts && patient.clinicalSummary.medicalAlerts.length > 0 && (
                            <div className="flex items-center gap-2 bg-red-50 text-red-700 px-3 py-1.5 rounded-lg border border-red-100">
                                <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center text-xs font-bold">!</span>
                                <span className="text-sm font-medium">{patient.clinicalSummary.medicalAlerts.join(', ')}</span>
                            </div>
                        )}
                        <button
                          onClick={handleOpenEdit}
                          className="flex items-center text-teal-600 border border-teal-200 bg-teal-50/50 hover:bg-teal-50 hover:border-teal-300 font-semibold text-sm px-4 py-2 rounded-xl transition-all shadow-sm"
                        >
                          Edit Profile
                        </button>
                    </div>
                </div>

                {/* Overview Section */}
                {activeMenu === 'overview' && (
                    <div className="flex flex-col gap-6 flex-1 min-h-0 overflow-y-auto pr-1 custom-scrollbar">
                        {/* Top Row: Latest Clinical Chart */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm shrink-0">
                            <div className="flex items-center justify-between mb-5 pb-4 border-b border-slate-100">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Latest Clinical Chart</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">Most recent patient visit</p>
                                </div>
                                <button 
                                    onClick={handleCreateChart}
                                    disabled={isCreatingChart}
                                    className="flex items-center justify-center bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-sm px-4 h-10 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed shrink-0 gap-2"
                                >
                                    {isCreatingChart ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : <><Plus className="w-4 h-4" /> New Chart</>}
                                </button>
                            </div>

                            {charts.length === 0 ? (
                                <div className="bg-slate-50 border border-slate-200 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center">
                                    <FileText className="w-10 h-10 text-slate-300 mb-3" />
                                    <h4 className="text-sm font-semibold text-slate-700">No charts found</h4>
                                    <p className="text-slate-500 text-xs mt-1">Start documenting this patient.</p>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row gap-4 items-center">
                                    <div 
                                        onClick={() => handleChartClick(sortedCharts[0].chart_id)}
                                        className="flex-1 w-full p-5 hover:bg-slate-50 rounded-xl border border-slate-200 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4 group hover:shadow-sm hover:border-teal-200"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 rounded-full bg-teal-50 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                                                <Stethoscope className="w-6 h-6 text-teal-600" />
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-bold text-slate-800 text-base group-hover:text-teal-700 transition-colors">
                                                        Clinical Visit
                                                    </h4>
                                                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-50 text-teal-700 border border-teal-100 shadow-sm animate-pulse">
                                                        Latest
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3 text-xs font-medium text-slate-500">
                                                    <span className="flex items-center gap-1.5">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {new Date(sortedCharts[0].created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                    </span>
                                                    <span className="flex items-center gap-1.5">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        {new Date(sortedCharts[0].created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {sortedCharts[0].notes && (
                                            <div className="text-sm text-slate-600 bg-white border border-slate-100 p-3 rounded-lg flex-1 max-w-lg hidden md:block">
                                                <p className="line-clamp-2 leading-relaxed">{sortedCharts[0].notes}</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <button 
                                        onClick={() => setActiveMenu('charts')}
                                        className="w-full sm:w-auto shrink-0 text-sm font-bold text-teal-600 hover:text-teal-700 hover:bg-teal-50 px-4 py-2.5 rounded-xl text-center transition-colors border border-transparent flex items-center justify-center gap-1.5"
                                    >
                                        View All <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Bottom Row: Recent Images (Mocked) */}
                        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col shrink-0 mb-6">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
                                <div>
                                    <h3 className="text-lg font-bold text-slate-800">Images Overview</h3>
                                    <p className="text-sm text-slate-500 mt-0.5">X-ray Photos & Intraoral Photos</p>
                                </div>
                            </div>
                            <div className="flex-1 flex items-center justify-center">
                                <div className="relative w-full max-w-2xl aspect-[16/9] rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center group cursor-pointer hover:bg-slate-100 transition-colors">
                                    <svg className="absolute inset-0 w-full h-full text-slate-200 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                                        <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                                        <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                                    </svg>
                                    <div className="bg-white/90 backdrop-blur-sm px-6 py-3 rounded-xl shadow-sm border border-slate-200 text-sm font-bold text-slate-600 flex items-center gap-2">
                                        <ImageIcon className="w-5 h-5 text-slate-400" />
                                        Images Placeholder
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Charts Section */}
                {activeMenu === 'charts' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">Clinical Charts Timeline</h3>
                                <p className="text-sm text-slate-500">History of visits and medical records</p>
                            </div>
                            <button 
                                onClick={handleCreateChart}
                                disabled={isCreatingChart}
                                className="flex items-center bg-teal-500 hover:bg-teal-600 text-white rounded-xl shadow-sm px-5 h-10 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isCreatingChart ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="w-4 h-4 mr-2" />
                                        New Chart
                                    </>
                                )}
                            </button>
                        </div>

                        {charts.length === 0 ? (
                            <div className="bg-slate-50 border border-slate-200 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center text-center flex-1">
                                <FileText className="w-10 h-10 text-slate-300 mb-3" />
                                <h4 className="text-base font-semibold text-slate-700">No charts found</h4>
                                <p className="text-slate-500 text-sm mt-1">Click 'New Chart' to start documenting.</p>
                            </div>
                        ) : (
                            <div className="flex-1 overflow-y-auto pr-1 pl-4 py-2 custom-scrollbar">
                                <div className="relative ml-4 pl-8 space-y-6">
                                    {sortedCharts.map((chart, index) => (
                                        <div key={chart.chart_id} className="relative group">
                                            {/* Timeline Line Connector */}
                                            {index < sortedCharts.length - 1 && (
                                                <div className="absolute -left-[33px] top-12 -bottom-11 w-[2px] bg-slate-100 group-hover:bg-[#1D9E75]/30 transition-colors" />
                                            )}

                                            {/* Timeline Dot Indicator */}
                                            {index === 0 ? (
                                                <div className="absolute top-6 -left-[49px] w-8 h-8 rounded-full bg-[#f0faf6] border-2 border-[#1D9E75] flex items-center justify-center shadow-md transition-all group-hover:scale-110 z-10">
                                                    <span className="relative flex h-3 w-3">
                                                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#1D9E75] opacity-75"></span>
                                                        <span className="relative inline-flex rounded-full h-3 w-3 bg-[#1D9E75]"></span>
                                                    </span>
                                                </div>
                                            ) : (
                                                <div className="absolute top-6 -left-[49px] w-8 h-8 rounded-full bg-white border-2 border-slate-200 group-hover:border-[#1D9E75] flex items-center justify-center shadow-sm transition-all group-hover:scale-110 z-10">
                                                    <span className="w-2.5 h-2.5 rounded-full bg-slate-300 group-hover:bg-[#1D9E75] transition-colors" />
                                                </div>
                                            )}

                                            {/* Timeline Content */}
                                            <div 
                                                onClick={() => handleChartClick(chart.chart_id)}
                                                className="py-4 pl-4 pr-6 hover:bg-slate-50/80 rounded-2xl transition-all cursor-pointer flex flex-col md:flex-row gap-6 items-start md:items-center justify-between group-hover:translate-x-1"
                                            >
                                                <div className="space-y-2.5 flex-1 w-full">
                                                    <div className="flex flex-wrap items-center gap-3">
                                                        <h4 className="font-bold text-slate-800 text-base group-hover:text-[#1D9E75] transition-colors">
                                                            Clinical Visit
                                                        </h4>
                                                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#f0faf6] text-[#1D9E75] border border-[#1D9E75]/20">
                                                            Completed
                                                        </span>
                                                        {index === 0 && (
                                                            <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-md bg-[#f0faf6] text-[#1D9E75] border border-[#1D9E75]/20 shadow-sm shadow-[#1D9E75]/5 animate-pulse">
                                                                Latest Visit
                                                            </span>
                                                        )}
                                                    </div>
                                                    
                                                    {/* Visit Timestamp & Metadata Row */}
                                                    <div className="flex flex-wrap items-center gap-y-1.5 gap-x-3 text-[12px] font-medium text-slate-500">
                                                        <span className="flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                            {new Date(chart.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="flex items-center gap-1.5">
                                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                            {new Date(chart.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                        <span className="text-slate-300">•</span>
                                                        <span className="flex items-center gap-1 text-slate-400">
                                                            ID: #{chart.chart_id.slice(0, 8)}
                                                        </span>
                                                    </div>

                                                    {chart.notes && (
                                                        <div className="mt-2 text-sm text-slate-600 flex items-start gap-2 max-w-3xl bg-slate-50/50 p-3 rounded-lg border border-slate-100">
                                                            <p className="line-clamp-2 leading-relaxed">{chart.notes}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center justify-end shrink-0 self-end md:self-center w-full md:w-auto mt-2 md:mt-0 gap-2">
                                                    <button 
                                                        onClick={(e) => confirmDeleteChart(e, chart)}
                                                        className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 text-rose-400 hover:bg-rose-50 hover:text-rose-500 transition-all duration-300"
                                                        title="Delete Chart"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-100/80 text-slate-400 group-hover:bg-[#f0faf6] group-hover:text-[#1D9E75] transition-all duration-300">
                                                        <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/*  Images Section */}
                {activeMenu === 'images' && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col min-h-0">
                        <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-100 shrink-0">
                            <div>
                                <h3 className="text-lg font-bold text-slate-800">X-ray & Photos</h3>
                                <p className="text-sm text-slate-500">Intraoral photos and panoramic X-ray scans</p>
                            </div>
                        </div>

                        <div className="flex-1 flex items-center justify-center p-8">
                            <div className="relative w-full max-w-2xl aspect-[16/9] rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300 flex items-center justify-center group">
                                <svg className="absolute inset-0 w-full h-full text-slate-200 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                                    <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                                    <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                                </svg>
                                <div className="bg-white/90 backdrop-blur-sm px-6 py-4 rounded-xl shadow-lg border border-slate-200 flex flex-col items-center gap-2">
                                    <ImageIcon className="w-8 h-8 text-slate-400" />
                                    <span className="text-base font-bold text-slate-700">Images Module</span>
                                    <span className="text-sm text-slate-500">Mockup placeholder (Coming Soon)</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* Placeholders for other menus */}
                {activeMenu !== 'overview' && activeMenu !== 'charts' && activeMenu !== 'images' && (
                   <div className="bg-white border border-slate-200 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center shadow-sm flex-1">
                       <h4 className="text-lg font-semibold text-slate-700 mb-2">Module under construction</h4>
                       <p className="text-slate-500 text-sm max-w-sm">This section is part of the patient repository but has not been implemented in the prototype yet.</p>
                   </div>
                )}
            </div>
        </main>
      </div>

      {/* Edit Profile Modal Dialog */}
      {isEditing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div 
            className="bg-white border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-teal-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">Edit Patient Profile</h3>
                  <p className="text-slate-400 text-xs font-mono mt-0.5">HN: {patient?.hn}</p>
                </div>
              </div>
              <button 
                onClick={() => setIsEditing(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                title="Cancel and close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="p-6 space-y-6">
              <div className="space-y-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label htmlFor="edit-name" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    id="edit-name"
                    type="text"
                    value={editForm.name}
                    onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter full name"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-sm font-medium"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Gender */}
                  <div className="space-y-1">
                    <label htmlFor="edit-sex" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Gender
                    </label>
                    <select
                      id="edit-sex"
                      value={editForm.sex}
                      onChange={(e) => setEditForm(prev => ({ ...prev, sex: e.target.value }))}
                      className="w-full h-11 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-sm font-medium"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  {/* Age */}
                  <div className="space-y-1">
                    <label htmlFor="edit-age" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                      Age
                    </label>
                    <input
                      id="edit-age"
                      type="number"
                      min="0"
                      value={editForm.age}
                      onChange={(e) => setEditForm(prev => ({ ...prev, age: e.target.value }))}
                      placeholder="Age"
                      className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-sm font-medium"
                    />
                  </div>
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label htmlFor="edit-phone" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Phone Number
                  </label>
                  <input
                    id="edit-phone"
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="e.g. 081-234-5678"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-sm font-medium"
                  />
                </div>

                {/* Medical Alert / Allergy */}
                <div className="space-y-1">
                  <label htmlFor="edit-allergy" className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Medical Alerts / Allergies
                  </label>
                  <input
                    id="edit-allergy"
                    type="text"
                    value={editForm.allergy}
                    onChange={(e) => setEditForm(prev => ({ ...prev, allergy: e.target.value }))}
                    placeholder="e.g. Penicillin Allergy"
                    className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors text-sm font-medium"
                  />
                </div>
              </div>

              <div className="border-t border-slate-100 pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="h-11 px-5 rounded-xl font-semibold text-sm text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="h-11 px-6 rounded-xl font-semibold text-sm bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSavingEdit ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    "Save Changes"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
