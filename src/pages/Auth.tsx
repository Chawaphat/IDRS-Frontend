import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope, ArrowLeft, Mail, Lock, User, Phone } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode: initialMode }: AuthPageProps) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const navigate = useNavigate();

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

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

      const dotSpacing = 24; // Denser dot spacing
      const maxDistance = 120; // Radius around mouse to animate
      const mouse = mouseRef.current;

      for (let x = dotSpacing / 2; x < canvas.width; x += dotSpacing) {
        for (let y = dotSpacing / 2; y < canvas.height; y += dotSpacing) {
          const dx = mouse.x - x;
          const dy = mouse.y - y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          let dotSize = 1; // Normal dot radius (2px diameter)
          let dotColor = 'rgba(148, 163, 184, 0.25)'; // slate-400 with low opacity

          if (distance < maxDistance) {
            const factor = 1 - distance / maxDistance; // Proximity factor: 1 at cursor, 0 at edge
            dotSize = 1 + factor * 2.5; // Swell up to 3.5px radius (7px diameter)
            // Blend slate gray into primary teal (#0d9488) based on proximity
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setAuthLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              phone: phone
            }
          }
        });
        if (error) throw error;
        alert('Registration successful! Please check your email for verification if required.');
      }
      navigate('/patients');
    } catch (err: any) {
      setErrorMsg(err.message || 'An error occurred during authentication.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setAuthLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: window.location.origin + '/patients'
        }
      });
      if (error) throw error;
    } catch (err: any) {
      setErrorMsg(err.message || 'Google Auth redirection failed.');
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        {/* Interactive canvas dot grid */}
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-[0.8]" />
        
        {/* Soft decorative teal circles */}
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      {/* Back button */}
      <button 
        onClick={() => navigate('/')}
        className="absolute top-8 left-8 flex items-center gap-2 text-slate-500 hover:text-primary font-semibold text-sm transition-all duration-200 group z-20"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back to Home
      </button>

      <div className="w-full max-w-[460px] md:max-w-[860px] bg-white rounded-3xl shadow-xl border border-slate-200 relative z-10 hover:shadow-2xl hover:border-slate-300/80 transition-all duration-300 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        {/* Left column (Branding / Info) */}
        <div className="md:col-span-5 bg-slate-50/50 p-8 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-slate-100">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-teal-500/10 hover:scale-105 transition-transform duration-300 mb-6">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </h2>
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1 block">IDRS Dental System</span>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-xs">
            {mode === 'login' 
              ? 'Welcome back. Sign in with your credentials to access patient charting and AI diagnostics support.' 
              : 'Register your clinic workspace to start digitized patient files, 2D charting, and instant reports.'}
          </p>
        </div>

        {/* Right column (Form) */}
        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          {/* Error Message Box */}
          {errorMsg && (
            <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs font-semibold leading-relaxed">
              {errorMsg}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {mode === 'register' && (
              <>
                {/* Full Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Full Name</label>
                  <div className="relative">
                    <User className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      required 
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Dr. John Doe"
                      disabled={authLoading}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Phone Number</label>
                  <div className="relative">
                    <Phone className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="tel" 
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="081-234-5678"
                      disabled={authLoading}
                      className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                    />
                  </div>
                </div>

              </>
            )}

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dentist@clinic.com"
                  disabled={authLoading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Password */}
            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>
                {mode === 'login' && (
                  <a href="#" className="text-[10px] font-bold text-primary hover:text-primary-dark transition-colors">Forgot?</a>
                )}
              </div>
              <div className="relative">
                <Lock className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  required 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={authLoading}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 focus:border-primary focus:bg-white focus:ring-4 focus:ring-primary/10 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50"
                />
              </div>
            </div>

            {/* Button */}
            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark hover:shadow-lg hover:shadow-teal-500/20 text-white rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 mt-2 disabled:opacity-50"
            >
              {authLoading ? 'Signing processing...' : (mode === 'login' ? 'Sign In' : 'Register Account')}
            </button>

            {/* Divider */}
            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
            </div>

            {/* Google OAuth Button */}
            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.13-1.14 2.87v2.4h2.5c4.14-3.8 6.54-9.4 6.54-15.6l-.8-.5z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.97-1.08 7.96-2.93l-3.88-3c-1.08.73-2.47 1.16-4.08 1.16-3.14 0-5.8-2.12-6.75-4.97H2.82v3.1A12 12 0 0012 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.25 14.26a7.2 7.2 0 010-4.52V6.63H2.82a12 12 0 000 10.74l2.43-3.1z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A12 12 0 002.82 6.63L5.25 9.74c.95-2.85 3.61-4.99 6.75-4.99z"
                />
              </svg>
              Sign in with Google
            </button>

          </form>

          {/* Footer Toggle */}
          <div className="text-center mt-6 text-xs text-slate-500 font-medium">
            {mode === 'login' ? (
              <p>
                New to IDRS?{' '}
                <button 
                  onClick={() => setMode('register')}
                  className="text-primary font-bold hover:underline hover:text-primary-dark transition-colors"
                >
                  Create an account
                </button>
              </p>
            ) : (
              <p>
                Already have an account?{' '}
                <button 
                  onClick={() => setMode('login')}
                  className="text-primary font-bold hover:underline hover:text-primary-dark transition-colors"
                >
                  Sign in instead
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
