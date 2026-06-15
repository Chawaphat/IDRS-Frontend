/* eslint-disable react-hooks/set-state-in-effect */
import React, { useState, useEffect, useRef } from 'react';
import { Stethoscope, ArrowLeft, Mail, Lock, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useToastStore } from '@/store/toastStore';
import { authService } from '@/services/authService';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export default function AuthPage({ mode: initialMode }: AuthPageProps) {
  const { user } = useAuthStore();
  const { show: showToast } = useToastStore();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Trigger toasts on error/success state updates
  useEffect(() => {
    if (errorMsg) {
      showToast(errorMsg, 'error');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setErrorMsg(null);
    }
  }, [errorMsg, showToast]);

  useEffect(() => {
    if (successMsg) {
      showToast(successMsg, 'success');
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSuccessMsg(null);
    }
  }, [successMsg, showToast]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [authLoading, setAuthLoading] = useState(false);
  
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  // Handle URL hash/query parameters for OAuth success, cancel, and error states
  useEffect(() => {
    // 1. Check if user is successfully logged in (either via email/password or OAuth redirect)
    if (user) {
      return;
    }

    // 2. Parse URL parameters for errors
    const params = new URLSearchParams(window.location.search);
    const hashParams = new URLSearchParams(window.location.hash.substring(1));

    const error = params.get('error') || hashParams.get('error');
    const errorDescription = params.get('error_description') || hashParams.get('error_description');

    if (error) {
      // If error is access_denied, or contains words like cancel
      const isCancel = error === 'access_denied' || 
                       errorDescription?.toLowerCase().includes('cancel') || 
                       errorDescription?.toLowerCase().includes('user_cancelled');
      
      if (isCancel) {
        setErrorMsg('Google Log In cancelled'); // SRS-08
      } else {
        setErrorMsg('Authentication failed. Please try again.'); // SRS-10
      }

      // SRS-07 & SRS-09: Redirect back to Login Page (clearing hash/query parameters to clean up URL)
      navigate('/auth/login', { replace: true });
    }
  }, [user, navigate]);

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

  const validateRegistration = () => {
    setFieldErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);
    let isValid = true;
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = "This field is required"; // SRS-06
      isValid = false;
    }
    if (!lastName.trim()) {
      errors.lastName = "This field is required"; // SRS-07
      isValid = false;
    }
    if (!email.trim()) {
      errors.email = "This field is required"; // SRS-08
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format"; // SRS-10
      isValid = false;
    }
    if (!password) {
      errors.password = "This field is required"; // SRS-09
      isValid = false;
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters"; // SRS-12
      isValid = false;
    }
    if (!confirmPassword) {
      errors.confirmPassword = "This field is required"; // SRS-09
      isValid = false;
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match"; // SRS-11
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(errors);
    }
    return isValid;
  };

  const validateLogin = () => {
    setFieldErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);
    let isValid = true;
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email = "This field is required"; // SRS-07
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = "Invalid email format"; // SRS-09
      isValid = false;
    }
    if (!password) {
      errors.password = "This field is required"; // SRS-08
      isValid = false;
    }

    if (!isValid) {
      setFieldErrors(errors);
    }
    return isValid;
  };

  const handleBackToLogin = () => {
    // SRS-16: Clear all inputs
    setFirstName('');
    setLastName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFieldErrors({});
    setErrorMsg(null);
    setSuccessMsg(null);
    // SRS-17: Redirect to "Log In"
    setMode('login');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);
    setFieldErrors({});

    if (mode === 'register') {
      if (!validateRegistration()) {
        return;
      }
    } else if (mode === 'login') {
      if (!validateLogin()) {
        return;
      }
    }

    setAuthLoading(true);

    try {
      if (mode === 'login') {
        await authService.signIn(email, password);
        // Toast and redirect handled by App.tsx PublicRoute
      } else {
        await authService.signUp(email, password, firstName, lastName);
        setSuccessMsg('Registered Successfully');
        setMode('login');
        setFirstName('');
        setLastName('');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'An error occurred during authentication.';
      setErrorMsg(errorMsg);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setErrorMsg(null);
    setAuthLoading(true);
    try {
      await authService.signInWithGoogle();
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Google Auth redirection failed.';
      setErrorMsg(errorMsg);
      setAuthLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none overflow-hidden select-none">
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-[0.8]" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
      </div>

      <button 
        onClick={() => navigate('/')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2.5 bg-white/90 backdrop-blur-sm border border-slate-200/80 rounded-2xl text-slate-700 hover:text-teal-600 hover:border-teal-200 hover:shadow-lg hover:shadow-slate-100/50 hover:scale-[1.02] active:scale-[0.98] font-bold text-xs shadow-sm transition-all duration-200 group z-20 cursor-pointer"
      >
        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform text-slate-400 group-hover:text-teal-600" />
        Back to Website
      </button>

      <div className="w-full max-w-[460px] md:max-w-[860px] bg-white rounded-3xl shadow-xl border border-slate-200 relative z-10 hover:shadow-2xl hover:border-slate-300/80 transition-all duration-300 overflow-hidden grid grid-cols-1 md:grid-cols-12">
        
        <div className="md:col-span-5 bg-slate-50/50 p-8 flex flex-col justify-center items-center md:items-start text-center md:text-left border-b md:border-b-0 md:border-r border-slate-100">
          <div className="h-12 w-12 rounded-2xl bg-primary flex items-center justify-center shadow-lg shadow-teal-500/10 hover:scale-105 transition-transform duration-300 mb-6">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            {mode === 'login' ? 'Login' : 'Create Account'}
          </h2>
          <span className="text-slate-500 text-[10px] font-bold uppercase tracking-wider mt-1 block">IDRS Dental System</span>
          <p className="text-xs text-slate-500 mt-4 leading-relaxed max-w-xs">
            {mode === 'login' 
              ? 'Welcome back. Log in with your credentials to access patient charting and AI diagnostics support.' 
              : 'Register your clinic workspace to start digitized patient files, 2D charting, and instant reports.'}
          </p>
        </div>

        <div className="md:col-span-7 p-8 flex flex-col justify-center">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            
            {mode === 'register' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">First Name</label>
                  <div className="relative">
                    <User className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      disabled={authLoading}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${fieldErrors.firstName ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-primary/10'} focus:bg-white focus:ring-4 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50`}
                    />
                  </div>
                  {fieldErrors.firstName && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.firstName}</span>}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Last Name</label>
                  <div className="relative">
                    <User className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      disabled={authLoading}
                      className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${fieldErrors.lastName ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-primary/10'} focus:bg-white focus:ring-4 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50`}
                    />
                  </div>
                  {fieldErrors.lastName && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.lastName}</span>}
                </div>
              </div>
            )}

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Email Address</label>
              <div className="relative">
                <Mail className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="dentist@clinic.com"
                  disabled={authLoading}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${fieldErrors.email ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-primary/10'} focus:bg-white focus:ring-4 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50`}
                />
              </div>
              {fieldErrors.email && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.email}</span>}
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Password</label>

              </div>
              <div className="relative">
                <Lock className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={authLoading}
                  className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${fieldErrors.password ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-primary/10'} focus:bg-white focus:ring-4 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50`}
                />
              </div>
              {fieldErrors.password && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.password}</span>}
            </div>

            {mode === 'register' && (
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Confirm Password</label>
                <div className="relative">
                  <Lock className="h-4.5 w-4.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input 
                    type="password" 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    disabled={authLoading}
                    className={`w-full pl-11 pr-4 py-3 bg-slate-50 border ${fieldErrors.confirmPassword ? 'border-red-300 focus:ring-red-500/10' : 'border-slate-200 focus:border-primary focus:ring-primary/10'} focus:bg-white focus:ring-4 rounded-xl text-sm font-medium outline-none transition-all duration-200 disabled:opacity-50`}
                  />
                </div>
                {fieldErrors.confirmPassword && <span className="text-[10px] text-red-500 font-semibold">{fieldErrors.confirmPassword}</span>}
              </div>
            )}

            <button 
              type="submit" 
              disabled={authLoading}
              className="w-full py-3.5 bg-primary hover:bg-primary-dark hover:shadow-lg hover:shadow-teal-500/20 text-white rounded-xl font-bold text-sm shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 mt-2 disabled:opacity-50"
            >
              {authLoading ? 'Processing...' : (mode === 'login' ? 'Log In' : 'Register')}
            </button>

            <div className="relative my-2 flex items-center justify-center">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <span className="relative bg-white px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">or</span>
            </div>

            <button 
              type="button"
              onClick={handleGoogleSignIn}
              disabled={authLoading}
              className="w-full py-3 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 hover:border-slate-300 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-50 cursor-pointer"
            >
              <svg className="h-4.5 w-4.5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v3.9h6.69c-.29 1.5-.1.13-1.14 2.87v2.4h2.5c4.14-3.8 6.54-9.4 6.54-15.6l-.8-.5z" />
                <path fill="#34A853" d="M12 24c3.24 0 5.97-1.08 7.96-2.93l-3.88-3c-1.08.73-2.47 1.16-4.08 1.16-3.14 0-5.8-2.12-6.75-4.97H2.82v3.1A12 12 0 0012 24z" />
                <path fill="#FBBC05" d="M5.25 14.26a7.2 7.2 0 010-4.52V6.63H2.82a12 12 0 000 10.74l2.43-3.1z" />
                <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.43-3.43A12 12 0 002.82 6.63L5.25 9.74c.95-2.85 3.61-4.99 6.75-4.99z" />
              </svg>
              Login with Google
            </button>

          </form>

          <div className="text-center mt-6 text-xs text-slate-500 font-medium">
            {mode === 'login' ? (
              <p>
                New to IDRS?{' '}
                <button 
                  onClick={() => setMode('register')}
                  className="text-primary font-bold hover:underline hover:text-primary-dark transition-colors"
                >
                  Register
                </button>
              </p>
            ) : (
              <p>
                <button 
                  onClick={handleBackToLogin}
                  className="text-primary font-bold hover:underline hover:text-primary-dark transition-colors"
                >
                  Back to Login
                </button>
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
