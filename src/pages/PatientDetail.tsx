import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, Clock, FileText, Sparkles, AlertCircle, Eye, X, Image as ImageIcon } from 'lucide-react';
import { patientService } from '@/services/patientService';
import type { ImageManagement } from '@/services/patientService';
import { clinicalService } from '@/services/clinicalService';
import type { DentalChart } from '@/services/clinicalService';
import { useToastStore } from '@/store/toastStore';

export default function PatientDetailPage() {
  const { id: patientId, chartId } = useParams<{ id: string; chartId: string }>();
  const navigate = useNavigate();
  const { show: showToast } = useToastStore();

  const [chart, setChart] = useState<DentalChart | null>(null);
  const [images, setImages] = useState<ImageManagement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchChartDetails = async () => {
      if (!chartId) return;
      try {
        setLoading(true);
        setError(null);
        
        // 1. Fetch dental chart details
        const chartData = await clinicalService.getDentalChartById(chartId);
        setChart(chartData);

        // 2. Fetch associated radiography images
        try {
          const imagesData = await patientService.getChartImages(chartId);
          setImages(imagesData);
        } catch (imgErr) {
          console.error("Failed to fetch chart images", imgErr);
          // Don't fail the whole page load if images fail, but log it
        }
      } catch (err: any) {
        console.error("Failed to retrieve chart details", err);
        const status = err?.response?.status;
        if (status === 404) {
          showToast("Record not found. It may have been deleted.", "error");
          setError("Record not found. It may have been deleted.");
          navigate(`/patients/${patientId}`, { replace: true });
        } else {
          showToast("Database connection error. Cannot retrieve chart details at this time.", "error");
          setError("Database connection error. Cannot retrieve chart details at this time.");
          navigate(`/patients/${patientId}`, { replace: true });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchChartDetails();
  }, [chartId, patientId, navigate, showToast]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 min-h-[60vh]">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-slate-500 font-semibold">Retrieving chart details...</p>
      </div>
    );
  }

  if (error || !chart) {
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
    <div className="flex flex-col w-full max-w-6xl mx-auto px-6 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button 
          onClick={() => navigate(`/patients/${patientId}`)}
          className="p-2 text-slate-500 hover:bg-slate-100 rounded-full transition-colors"
          title="Back to Patient Repository"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-3">
            Clinical Visit - {new Date(chart.created_at).toLocaleDateString()}
          </h1>
          <p className="text-slate-500 mt-1 flex items-center gap-2">
            Patient Repository / Chart / <span className="font-semibold text-slate-700">{chartId}</span>
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Chart Details */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
              <FileText className="w-5 h-5 text-teal-600" /> Chart Metadata
            </h3>
            
            <div className="space-y-4">
              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Status</span>
                <div className="mt-1">
                  <span className="px-2.5 py-1 text-xs font-bold uppercase tracking-wider rounded-lg bg-emerald-100 text-emerald-800">
                    Completed
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Created Date & Time</span>
                <div className="flex flex-col text-slate-700 text-sm mt-1 gap-1">
                  <span className="flex items-center gap-2 font-medium">
                    <Calendar className="w-4 h-4 text-slate-400" /> 
                    {new Date(chart.created_at).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-2 font-medium">
                    <Clock className="w-4 h-4 text-slate-400" /> 
                    {new Date(chart.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>

              {chart.notes && (
                <div>
                  <span className="text-xs uppercase font-bold text-slate-400 tracking-wider">Clinical Notes</span>
                  <p className="mt-2 text-slate-700 text-sm bg-slate-50 p-4 rounded-xl border border-slate-100 italic leading-relaxed whitespace-pre-wrap">
                    {chart.notes}
                  </p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-gradient-to-br from-teal-500 to-emerald-600 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
            <Sparkles className="w-20 h-20 text-white/10 absolute -right-4 -bottom-4 rotate-12" />
            <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
              Smart Charting System
            </h4>
            <p className="text-white/80 text-xs leading-relaxed">
              The teeth charting (odontogram) and smart diagnosis assist module are configured in read-only audit mode for this historical record.
            </p>
          </div>
        </div>

        {/* Right Col: Associated Radiography Images */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm min-h-[400px] flex flex-col">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2 border-b border-slate-100 pb-3">
              <ImageIcon className="w-5 h-5 text-teal-600" /> Associated X-Rays & Photos
            </h3>

            {images.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-12 bg-slate-50/50 rounded-xl border border-slate-100 border-dashed">
                <ImageIcon className="w-12 h-12 text-slate-300 mb-3" />
                <h4 className="text-base font-semibold text-slate-700">No images linked to this chart</h4>
                <p className="text-slate-400 text-sm max-w-xs mt-1">There are no radiography scans or intraoral photos associated with this clinical record.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {images.map((img) => (
                  <div key={img.image_id} className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group">
                    <div 
                      className="aspect-video relative cursor-pointer bg-slate-950 flex items-center justify-center"
                      onClick={() => setSelectedImageUrl(img.image_url || null)}
                    >
                      {img.image_url ? (
                        <img 
                          src={img.image_url} 
                          alt={img.description || img.image_file || 'Radiograph'}
                          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      ) : (
                        <span className="text-slate-500 font-mono text-xs">No preview available</span>
                      )}
                      <div className="absolute inset-0 bg-slate-900/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-xs font-bold border border-white/40 bg-slate-900/80 px-3 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-sm">
                          <Eye className="w-3.5 h-3.5" /> View Large Scan
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex justify-between items-start gap-2">
                        <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded bg-teal-50 text-teal-700 border border-teal-100">
                          {img.image_type}
                        </span>
                        <span className="text-slate-400 text-[10px] font-mono">
                          {new Date(img.uploaded_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-700 font-medium mt-2 line-clamp-2">
                        {img.description || "No description provided."}
                      </p>
                      {img.image_file && (
                        <span className="text-[10px] text-slate-400 block mt-2 font-mono truncate">
                          File: {img.image_file}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImageUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 flex items-center justify-center p-6 sm:p-12 backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
          <button 
            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white rounded-full p-2.5 transition-all outline-none"
            onClick={() => setSelectedImageUrl(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img 
            src={selectedImageUrl} 
            alt="Enlarged radiography view" 
            className="max-w-full max-h-full rounded-xl shadow-2xl object-contain border border-white/10"
          />
        </div>
      )}
    </div>
  );
}
