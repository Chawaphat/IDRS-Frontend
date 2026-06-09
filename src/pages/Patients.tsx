/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  UserPlus, 
  Activity, 
  Clock, 
  Trash2, 
  ArrowRight
} from 'lucide-react';
import { patientService } from '@/services/patientService';
import type { BackendPatient } from '@/services/patientService';
import { useConfirmStore } from '@/store/confirmStore';
import { useToastStore } from '@/store/toastStore';

export interface Patient {
  id: string; // Internal UUID
  hn: string; // Hospital Number (display ID)
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: string;
  phone: string;
  clinicalSummary?: {
    chiefComplaint?: string;
    activeConditions?: string[];
    nextPlannedTreatment?: string;
    medicalAlerts?: string[];
  };
  created_at?: string;
}

export default function PatientsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [defaultPatients, setDefaultPatients] = useState<Patient[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const askConfirm = useConfirmStore((state) => state.ask);
  const showToast = useToastStore((state) => state.show);
  const location = useLocation();

  const hasShownLoginToast = React.useRef(false);

  useEffect(() => {
    const state = location.state as { showLoginSuccess?: boolean } | null;
    if (state?.showLoginSuccess && !hasShownLoginToast.current) {
      hasShownLoginToast.current = true;
      showToast('Logged In Successfully', 'success');
      // Clear the React Router state so it doesn't fire again on refresh
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, showToast, navigate, location.pathname]);

  const mapBackendPatientToPatient = (p: BackendPatient): Patient => ({
    id: p.patient_id,
    hn: p.hn_number,
    name: p.name,
    age: p.age || 0,
    gender: p.sex || 'Unknown',
    phone: p.phone || 'No phone',
    created_at: p.created_at,
    lastVisit: p.last_visit ? new Date(p.last_visit).toLocaleDateString() : 'N/A',
    status: p.status || 'Active',
    clinicalSummary: {
      medicalAlerts: p.allergy ? [p.allergy] : [],
      chiefComplaint: p.chief_complaint || 'No complaint recorded.',
    }
  });

  React.useEffect(() => {
    const fetchPatients = async () => {
      try {
        const data = await patientService.getAll();
        const mappedPatients = data.map(mapBackendPatientToPatient);
        setDefaultPatients(mappedPatients);
        setPatients(mappedPatients);
      } catch (error) {
        console.error("Failed to fetch patients:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchPatients();
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    // SRS-04: Ignore search execution and prompt if empty
    if (!searchTerm.trim()) {
      showToast("Please enter a search keyword.", "error");
      return;
    }

    setLoading(true);
    try {
      // SRS-05: Query backend database for matching patients
      const data = await patientService.search(searchTerm.trim());
      const mappedPatients = data.map(mapBackendPatientToPatient);
      setPatients(mappedPatients);
    } catch (error) {
      console.error("Failed to search patients:", error);
      // SRS-06: Database connection error toast
      showToast("Database connection error. Cannot perform search at this time.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);

    // SRS-02: Clear search resets view to default list of all patients
    if (!value.trim()) {
      setPatients(defaultPatients);
    }
  };

  const totalPatients = defaultPatients.length;
  
  // Calculate real statistics based on data
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const recentVisitsThisMonth = defaultPatients.filter(p => {
    if (!p.lastVisit || p.lastVisit === 'N/A') return false;
    const lastVisitDate = new Date(p.lastVisit);
    return lastVisitDate.getMonth() === currentMonth && lastVisitDate.getFullYear() === currentYear;
  }).length;

  return (
    <div className="flex flex-col h-full space-y-8 pb-8">
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">Patient Directory</h2>
            <p className="text-slate-500 mt-1">Manage your clinic's patient records and medical history.</p>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:border-teal-200 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center shrink-0">
              <Users className="w-7 h-7 text-teal-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-500 mb-0.5">Total Patients</p>
              <h3 className="text-3xl font-bold text-slate-900">{totalPatients}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1">All registered records</p>
            </div>
          </div>
          
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm flex items-center gap-5 hover:border-indigo-200 transition-colors">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center shrink-0">
              <Activity className="w-7 h-7 text-indigo-600" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-slate-500 mb-0.5">Recent Visits</p>
              <h3 className="text-3xl font-bold text-slate-900">{recentVisitsThisMonth}</h3>
              <p className="text-[11px] font-medium text-slate-400 mt-1">Active within 30 days</p>
            </div>
          </div>

          <button 
            onClick={() => navigate('/patient-entry')}
            className="group bg-teal-500 hover:bg-teal-600 rounded-3xl p-6 border border-transparent shadow-sm flex items-center justify-between transition-all active:scale-[0.98]"
          >
            <div className="flex items-center gap-5">
              <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shrink-0 group-hover:scale-110 transition-transform">
                <UserPlus className="w-7 h-7 text-white" />
              </div>
              <div className="text-left">
                <p className="text-teal-50 text-sm font-medium mb-0.5">Action</p>
                <h3 className="text-2xl font-bold text-white tracking-tight">New Patient</h3>
                <p className="text-[11px] font-medium text-teal-100/80 mt-1">Create new record</p>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors shrink-0">
              <Plus className="w-5 h-5 text-white" />
            </div>
          </button>
        </div>

        {/* Patient Data Grid Area */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden flex flex-col flex-1 min-h-[500px]">
          
          {/* Table Toolbar */}
          <form onSubmit={handleSearch} className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="flex gap-3 w-full max-w-md">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text"
                  placeholder="Search by name or HN..."
                  className="w-full pl-9 pr-4 h-11 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-sm font-medium"
                  value={searchTerm}
                  onChange={handleSearchInputChange}
                />
              </div>
              <button
                type="submit"
                className="px-5 h-11 bg-teal-500 hover:bg-teal-600 text-white rounded-xl text-sm font-semibold transition-all active:scale-95 shadow-sm shadow-teal-500/10 flex items-center gap-1.5 shrink-0"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
            </div>
          </form>

          {/* Scrollable Card Grid Area */}
          <div className="overflow-y-auto w-full flex-1 p-6 bg-slate-50/50">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-white rounded-3xl border border-slate-200 shadow-sm flex flex-col overflow-hidden animate-pulse">
                    {/* Skeleton Header */}
                    <div className="p-5 border-b border-slate-100 flex items-start gap-4 bg-slate-50/30">
                      <div className="w-12 h-12 rounded-full bg-slate-200 shrink-0"></div>
                      <div className="flex-1 space-y-2 mt-1">
                        <div className="h-5 bg-slate-200 rounded w-2/3"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      </div>
                    </div>
                    {/* Skeleton Body */}
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      <div className="flex justify-between border-b border-slate-100 pb-3">
                        <div className="h-3 bg-slate-200 rounded w-1/3"></div>
                      </div>
                      <div className="flex-1 space-y-2 mb-1">
                        <div className="h-2.5 bg-slate-200 rounded w-1/4 mb-2"></div>
                        <div className="h-3.5 bg-slate-200 rounded w-full"></div>
                        <div className="h-3.5 bg-slate-200 rounded w-4/5"></div>
                      </div>
                      <div className="pt-3 border-t border-slate-100 mt-auto flex items-center gap-2">
                        <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    </div>
                    {/* Skeleton Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="h-3 bg-slate-200 rounded w-1/4"></div>
                      <div className="h-3 bg-slate-200 rounded w-1/6"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : patients.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-slate-400 space-y-4 py-20">
                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center">
                  <UserPlus className="w-10 h-10 text-slate-300" />
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-700">No patients found</p>
                  <p className="text-sm mt-1">Try adjusting your search criteria or register a new patient.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {patients.map((patient: Patient) => (
                  <div 
                    key={patient.id} 
                    className="bg-white rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group flex flex-col overflow-hidden cursor-pointer hover:border-teal-200"
                    onClick={() => navigate(`/patients/${patient.id}`)}
                  >
                    {/* Card Header */}
                    <div className="p-5 border-b border-slate-100 flex items-start justify-between bg-slate-50/30">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-sm">
                          {patient.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-900 text-lg leading-tight">{patient.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[10px] font-bold font-mono">
                              {patient.hn}
                            </span>
                            <span className="text-xs font-medium text-slate-500">{patient.age} yrs • {patient.gender}</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Action Menu Trigger (Hover) */}
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => {
                        e.stopPropagation();
                        askConfirm({
                          title: "Delete Patient",
                          message: `Are you sure you want to delete ${patient.name}? This action cannot be undone.`,
                          confirmText: "Delete",
                          cancelText: "Cancel",
                          type: "danger",
                          onConfirm: () => {
                            patientService.delete(patient.id).then(() => {
                              setPatients(prev => prev.filter(p => p.id !== patient.id));
                              setDefaultPatients(prev => prev.filter(p => p.id !== patient.id));
                              showToast('Patient deleted successfully', 'success');
                            }).catch(err => {
                              console.error('Failed to delete patient:', err);
                              showToast('Failed to delete patient', 'error');
                            });
                          }
                        });
                      }}>
                        <button className="w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Card Body - Clinical Data */}
                    <div className="p-5 flex-1 flex flex-col gap-3">
                      {/* Last Visit */}
                      <div className="flex items-center justify-between text-[11px] font-medium border-b border-slate-100 pb-3">
                        <div className="flex items-center gap-1.5 text-slate-500">
                          <Clock className="w-3.5 h-3.5" />
                          Last Visit: {patient.lastVisit}
                        </div>
                      </div>
                      
                      {/* Chief Complaint */}
                      <div className="flex-1 mb-1">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                          <Activity className="w-3 h-3" />
                          Chief Complaint
                        </h4>
                        <p className="text-sm text-slate-700 line-clamp-2 font-medium">
                          {patient.clinicalSummary?.chiefComplaint || 'No complaint recorded.'}
                        </p>
                      </div>

                      {/* Alerts */}
                      {patient.clinicalSummary?.medicalAlerts && patient.clinicalSummary.medicalAlerts.length > 0 ? (
                        <div className="flex items-start gap-2 pt-3 border-t border-slate-100 mt-auto">
                          <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-rose-100 text-rose-600 font-bold text-[10px]">!</span>
                          <p className="text-xs font-medium text-rose-600 mt-0.5 leading-tight">
                            <span className="font-bold opacity-80 mr-1">Allergy:</span>
                            {patient.clinicalSummary.medicalAlerts.join(', ')}
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center pt-3 border-t border-slate-100 mt-auto text-slate-400 gap-1.5">
                           <span className="shrink-0 inline-flex items-center justify-center w-5 h-5 rounded-full bg-slate-100 text-slate-400 font-bold text-[10px]">✓</span>
                           <p className="text-xs italic">No medical alerts</p>
                        </div>
                      )}
                    </div>

                    {/* Card Footer */}
                    <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                        Phone: {patient.phone}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-bold text-teal-600 group-hover:text-teal-700 transition-colors">
                        View Profile
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
      </div>
    </div>
  );
}
