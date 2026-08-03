import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { patientService } from '@/services/patientService';
import { useToastStore } from '@/store/toastStore';
import { UserPlus, Activity, Hash, User, Phone, Stethoscope } from 'lucide-react';

export default function PatientEntryPage() {
  const navigate = useNavigate();
  const { show: showToast } = useToastStore();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Trigger toasts on error state updates
  useEffect(() => {
    if (error) {
      showToast(error, 'error');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setError(null);
    }
  }, [error, showToast]);

  // Canvas background dot animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    
    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const handleMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      };
    };

    window.addEventListener('mousemove', handleMouseMove);

    const drawGrid = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const dotSpacing = 24;
      const maxDistance = 120;
      const mouse = mouseRef.current;

      for (let x = dotSpacing / 2; x < canvas.width; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < canvas.height; y += dotSpacing) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let dotSize = 1;
          let dotColor = 'rgba(148, 163, 184, 0.25)';

          if (distance < maxDistance) {
            const factor = 1 - distance / maxDistance;
            dotSize = 1 + factor * 2.5;
            dotColor = `rgba(13, 148, 136, ${0.25 + factor * 0.75})`;
          }

          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fillStyle = dotColor;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(drawGrid);
    };

    drawGrid();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  const [formData, setFormData] = useState({
    hn_number: '',
    name: '',
    age: '',
    sex: 'Male',
    phone: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // SRS-04 / SRS-05 Validation
    if (!formData.name.trim()) {
      showToast("Full Name is required.", "error");
      return;
    }

    if (formData.age) {
      const parsedAge = parseInt(formData.age, 10);
      if (isNaN(parsedAge) || parsedAge < 0) {
        showToast("Age must be a positive number.", "error");
        return;
      }
    }
    
    setLoading(true);
    setError(null);

    try {
      const payload = {
        name: formData.name.trim(),
        age: formData.age ? parseInt(formData.age, 10) : null,
        sex: formData.sex,
        hn_number: formData.hn_number.trim() || `HN-${Date.now().toString().slice(-6)}`,
        phone: formData.phone.trim() || null,
      };

      // SRS-07 / SRS-09
      const newPatient = await patientService.create(payload);
      showToast("Patient registered successfully", "success");
      navigate(`/patients/${newPatient.patient_id}`);
    } catch (err: unknown) {
      console.error(err);
      let errorMsg = "Database connection error. Cannot register patient at this time."; // SRS-08 Default connection/server error
      
      if (err && typeof err === 'object') {
        const errorObj = err as { response?: { status?: number; data?: { detail?: string } }; message?: string };
        // If we received a response that is not a 500 server error, use the specific backend detail message
        if (errorObj.response && errorObj.response.status !== 500 && errorObj.response.data?.detail) {
          errorMsg = errorObj.response.data.detail;
        }
      }
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-full flex-1 flex flex-col">
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-[0.8] pointer-events-none z-0" />
      
      <div className="relative z-10 max-w-2xl mx-auto px-6 py-10 w-full flex flex-col space-y-10">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/10 flex items-center justify-center">
            <UserPlus className="w-6 h-6 text-teal-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 tracking-tight">New Patient Registration</h1>
            <p className="text-slate-500 mt-1">Enter the patient's details below to create a new medical record.</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden mt-4">
          <div className="border-b border-slate-100 bg-slate-50/50 p-6 flex items-center gap-3">
            <Stethoscope className="w-5 h-5 text-slate-400" />
            <h2 className="text-lg font-semibold text-slate-800">Clinical Profile</h2>
          </div>
          
          <form onSubmit={handleSubmit} className="p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Full Name */}
              <div className="space-y-2 md:col-span-2">
                <label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <User className="w-4 h-4 text-slate-400" />
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  id="name"
                  name="name"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Hospital Number */}
              <div className="space-y-2">
                <label htmlFor="hn_number" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Hash className="w-4 h-4 text-slate-400" />
                  Hospital Number (HN)
                </label>
                <input
                  id="hn_number"
                  name="hn_number"
                  placeholder="Leave blank to auto-generate"
                  value={formData.hn_number}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
                <p className="text-xs text-slate-400 font-medium ml-1">If unknown, the system will assign one.</p>
              </div>

              {/* Phone Number */}
              <div className="space-y-2">
                <label htmlFor="phone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  Phone Number
                </label>
                <input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="e.g. 081-234-5678"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>

              {/* Biological Sex */}
              <div className="space-y-2">
                <label htmlFor="sex" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-slate-400" />
                  Gender
                </label>
                <select
                  id="sex"
                  name="sex"
                  value={formData.sex}
                  onChange={handleChange}
                  className="flex h-11 w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-colors"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Age */}
              <div className="space-y-2">
                <label htmlFor="age" className="text-sm font-semibold text-slate-700">
                  Age
                </label>
                <input
                  id="age"
                  name="age"
                  type="number"
                  min="0"
                  placeholder="e.g. 30"
                  value={formData.age}
                  onChange={handleChange}
                  className="w-full h-11 px-4 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-colors"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 flex items-center justify-end gap-4">
              <button
                type="button"
                onClick={() => navigate('/patients')}
                className="h-11 px-6 rounded-xl font-semibold text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="h-11 px-8 rounded-xl font-semibold bg-teal-500 hover:bg-teal-600 text-white shadow-md shadow-teal-500/20 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Registering..." : "Register Patient"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
