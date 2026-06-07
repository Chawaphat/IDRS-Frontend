import React, { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useNavigate } from 'react-router-dom';
import { 
  Users, 
  Search, 
  Plus, 
  LogOut, 
  UserPlus, 
  Calendar, 
  ChevronRight, 
  Sparkles, 
  Database,
  FileText,
  Activity
} from 'lucide-react';

interface Patient {
  id: string;
  name: string;
  age: number;
  gender: string;
  lastVisit: string;
  status: string;
  phone: string;
}

const mockPatients: Patient[] = [
  { id: 'HN-10245', name: 'Somchai Jaidee', age: 42, gender: 'Male', lastVisit: '2026-06-05', status: 'Active Treatment', phone: '081-345-6789' },
  { id: 'HN-10246', name: 'Somsri Rakdee', age: 29, gender: 'Female', lastVisit: '2026-05-28', status: 'Completed', phone: '082-456-7890' },
  { id: 'HN-10247', name: 'Anan Panyadee', age: 35, gender: 'Male', lastVisit: '2026-06-01', status: 'Pending X-Ray', phone: '083-567-8901' },
  { id: 'HN-10248', name: 'Wipa Siriwattana', age: 54, gender: 'Female', lastVisit: '2026-06-06', status: 'Active Treatment', phone: '084-678-9012' },
  { id: 'HN-10249', name: 'Chatchai Mongkol', age: 23, gender: 'Male', lastVisit: '2026-05-15', status: 'Under Monitoring', phone: '085-789-0123' },
];

export default function PatientsPage() {
  const { user, signOut } = useAuthStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const filteredPatients = mockPatients.filter(patient => 
    patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    patient.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans">
      {/* Header NavBar */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center text-white font-bold shadow-md shadow-teal-500/10">
              IDRS
            </div>
            <div>
              <span className="text-base font-bold text-slate-900 block leading-tight">Patient Directory</span>
              <span className="text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Clinician Dashboard</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="block text-xs font-bold text-slate-800">{user?.email || 'Dr. Practitioner'}</span>
              <span className="block text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Authorized Clinician</span>
            </div>
            <button 
              onClick={handleSignOut}
              className="flex items-center gap-2 px-4 py-2 border border-slate-200 hover:border-red-200 text-slate-600 hover:text-red-500 font-semibold text-xs rounded-xl transition-all duration-200 bg-white"
            >
              <LogOut className="h-4 w-4" /> Sign Out
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-6 py-10">
        
        {/* Welcome Section */}
        <div className="mb-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200/80 p-6 rounded-3xl shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              Welcome back <Sparkles className="h-5 w-5 text-primary" />
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Select or search for a patient to access their odontogram chart, clinical notes, and AI panoramic scans.
            </p>
          </div>
          <button className="flex items-center gap-2 bg-primary hover:bg-primary-dark text-white font-bold text-xs px-5 py-3 rounded-xl transition-all duration-200 shadow-md shadow-teal-500/10 hover:shadow-lg active:scale-95">
            <Plus className="h-4 w-4" /> Add New Patient
          </button>
        </div>

        {/* Directory Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mb-6">
          {/* Search bar */}
          <div className="relative w-full sm:max-w-md">
            <Search className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input 
              type="text"
              placeholder="Search by HN or Patient Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-primary focus:ring-4 focus:ring-primary/10 rounded-2xl text-sm font-medium outline-none transition-all duration-200"
            />
          </div>

          {/* Quick Filter Info */}
          <div className="flex gap-6 text-xs text-slate-500 font-semibold">
            <span className="flex items-center gap-2">
              <Users className="h-4 w-4 text-primary" /> Total Patients: <strong className="text-slate-800">{mockPatients.length}</strong>
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-primary" /> Active Today: <strong className="text-slate-800">2</strong>
            </span>
          </div>
        </div>

        {/* Patients List Grid/Table */}
        <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold uppercase tracking-wider text-slate-500">
                  <th className="py-4 px-6">Hospital Number (HN)</th>
                  <th className="py-4 px-6">Name</th>
                  <th className="py-4 px-6">Age / Gender</th>
                  <th className="py-4 px-6">Phone</th>
                  <th className="py-4 px-6">Last Visit</th>
                  <th className="py-4 px-6">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium">
                {filteredPatients.length > 0 ? (
                  filteredPatients.map((patient) => (
                    <tr 
                      key={patient.id} 
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="py-4.5 px-6 font-mono text-xs text-slate-600 group-hover:text-primary transition-colors">
                        {patient.id}
                      </td>
                      <td className="py-4.5 px-6 text-slate-900 font-bold">
                        {patient.name}
                      </td>
                      <td className="py-4.5 px-6 text-slate-500">
                        {patient.age} yrs / {patient.gender}
                      </td>
                      <td className="py-4.5 px-6 text-slate-500 font-mono text-xs">
                        {patient.phone}
                      </td>
                      <td className="py-4.5 px-6 text-slate-500 font-mono text-xs">
                        {patient.lastVisit}
                      </td>
                      <td className="py-4.5 px-6">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${
                          patient.status === 'Active Treatment' ? 'bg-teal-50 text-primary' :
                          patient.status === 'Completed' ? 'bg-emerald-50 text-emerald-600' :
                          patient.status === 'Pending X-Ray' ? 'bg-amber-50 text-amber-600' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${
                            patient.status === 'Active Treatment' ? 'bg-primary' :
                            patient.status === 'Completed' ? 'bg-emerald-500' :
                            patient.status === 'Pending X-Ray' ? 'bg-amber-500' :
                            'bg-slate-400'
                          }`} />
                          {patient.status}
                        </span>
                      </td>
                      <td className="py-4.5 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-teal-50/20 transition-all font-semibold flex items-center gap-1">
                            <Activity className="h-3.5 w-3.5" /> Charting
                          </button>
                          <button className="h-8 px-3 rounded-lg border border-slate-200 text-xs text-slate-600 hover:text-primary hover:border-primary/30 hover:bg-teal-50/20 transition-all font-semibold flex items-center gap-1">
                            <Sparkles className="h-3.5 w-3.5" /> AI Scan
                          </button>
                          <button className="h-8 w-8 rounded-lg border border-slate-200 hover:border-primary/30 hover:bg-teal-50/20 text-slate-400 hover:text-primary transition-all flex items-center justify-center">
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-semibold">
                      No patients found matching the search term.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
}
