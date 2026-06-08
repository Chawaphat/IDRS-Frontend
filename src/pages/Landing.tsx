import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { 
  Activity, 
  Cpu, 
  FileText, 
  ArrowRight, 
  Database, 
  Menu, 
  X,
  Stethoscope
} from 'lucide-react';

export default function LandingPage() {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 selection:bg-teal-100 selection:text-teal-900">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 glass border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-teal-500/10">
              <Stethoscope className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">IDRS</span>
              <span className="block text-[10px] text-slate-500 uppercase tracking-widest font-semibold">Dental System</span>
            </div>
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">How it Works</a>
            <a href="#ai-demo" className="text-sm font-medium text-slate-600 hover:text-primary transition-colors">AI Diagnostics</a>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button 
              onClick={() => navigate('/auth/login')}
              className="text-sm font-semibold text-slate-700 hover:text-primary px-4 py-2 transition-colors"
            >
              Log In
            </button>
            <button 
              onClick={() => navigate('/auth/register')}
              className="text-sm font-semibold text-white bg-primary hover:bg-primary-dark hover:shadow-md px-5 py-2.5 rounded-xl transition-all duration-200 flex items-center gap-2"
            >
              Get Started <ArrowRight className="h-4 w-4" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-slate-600 hover:text-slate-900 transition-colors"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu Drawer */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-20 left-0 w-full bg-white border-b border-slate-200 shadow-xl px-6 py-6 md:hidden flex flex-col gap-5"
            >
              <a 
                href="#features" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-slate-700 hover:text-primary"
              >
                Features
              </a>
              <a 
                href="#how-it-works" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-slate-700 hover:text-primary"
              >
                How it Works
              </a>
              <a 
                href="#ai-demo" 
                onClick={() => setMobileMenuOpen(false)}
                className="text-lg font-medium text-slate-700 hover:text-primary"
              >
                AI Diagnostics
              </a>
              <div className="h-px bg-slate-100 my-2" />
              <div className="flex flex-col gap-3">
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/auth/login'); }}
                  className="w-full text-center font-semibold text-slate-700 py-3 rounded-xl border border-slate-200 hover:bg-slate-50 transition-colors"
                >
                  Log In
                </button>
                <button 
                  onClick={() => { setMobileMenuOpen(false); navigate('/auth/register'); }}
                  className="w-full text-center font-semibold text-white bg-primary py-3 rounded-xl"
                >
                  Get Started
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Hero Section (Clean solid background color) */}
      <section className="relative pt-16 pb-24 bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-12 items-center">
          <div className="md:col-span-6 flex flex-col gap-6 text-center md:text-left">

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-slate-900">
              The Intelligent Way to Manage <span className="text-primary">Dental Records</span>
            </h1>
            
            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-xl">
              Centralized patient charting, real-time tooth visualization, and preliminary AI diagnosis on panoramic X-rays—tailored for Dentists and Dental Assistants.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start mt-2">
              <button 
                onClick={() => navigate('/auth/login')}
                className="w-full sm:w-auto text-center font-semibold text-white bg-primary hover:bg-primary-dark hover:shadow-lg px-8 py-4 rounded-2xl transition-all duration-200 flex items-center justify-center gap-3 group"
              >
                Access Platform <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>
              <a href="#ai-demo" className="w-full sm:w-auto text-center font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200/80 shadow-sm px-8 py-4 rounded-2xl transition-colors flex items-center justify-center gap-2">
                Try AI Scan Demo
              </a>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-slate-200/80 mt-4">
              <div>
                <span className="block text-2xl lg:text-3xl font-extrabold text-slate-900">30+ min</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Manual Charting to &lt; 5m</span>
              </div>
              <div>
                <span className="block text-2xl lg:text-3xl font-extrabold text-slate-900">100%</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Paperless Record Transition</span>
              </div>
              <div>
                <span className="block text-2xl lg:text-3xl font-extrabold text-slate-900">Instant</span>
                <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">Patient History Access</span>
              </div>
            </div>
          </div>

          {/* Interactive Mockup Visual */}
          <div className="md:col-span-6 relative flex justify-center">
            <div className="relative w-full max-w-[520px] aspect-[4/3] rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300">
              <svg className="absolute inset-0 w-full h-full text-slate-200 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section id="features" className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col gap-4">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">Product Features</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Everything you need for premium dental documentation
          </h2>
          <p className="text-slate-600 text-lg">
            We provide dental clinics with a single platform that streamlines administrative workflows and elevates diagnostic accuracy.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          
          {/* Card 1 */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center text-primary">
              <Database className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Patient Profiles</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Consolidate full patient metadata, dental history, and radiographic records within a secure, centralized electronic repository.
            </p>
          </div>

          {/* Card 2 */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-primary-light flex items-center justify-center text-primary">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Dental Charting</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Interactive 2D visualization of adult and primary dentitions. Effortlessly record conditions per tooth, root, or surface in real-time.
            </p>
          </div>

          {/* Card 3 */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-accent">
              <Cpu className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">AI Object Detection</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Scan panoramic X-rays using state-of-the-art computer vision to pre-identify cavities, crowns, implants, and anomalies.
            </p>
          </div>

          {/* Card 4 */}
          <div className="glass-card p-6 rounded-2xl flex flex-col gap-4 hover:-translate-y-1.5 transition-all duration-300">
            <div className="h-12 w-12 rounded-xl bg-teal-50 flex items-center justify-center text-accent">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="font-bold text-lg text-slate-900">Exportable PDFs</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Generate structured, visually rich PDF reports containing dental charts and clinical metadata for referrals and patient education.
            </p>
          </div>

        </div>
      </section>

      {/* Consultation Workflow Section */}
      <section id="how-it-works" className="py-24 bg-slate-900 text-white relative overflow-hidden">
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="text-center max-w-2xl mx-auto mb-16 flex flex-col gap-4">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">Clinical Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-bold">Fluid 4-Step Consultation Session</h2>
            <p className="text-slate-400 text-base">
              A unified digital flow designed to streamline your daily workflow, from patient intake to post-consultation reporting.
            </p>
          </div>

          <div className="grid md:grid-cols-12 gap-12 items-center">
            {/* Left Column - Steps */}
            <div className="md:col-span-6 flex flex-col gap-8">
              
              {/* Step 1 */}
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  1
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Review Patient History</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Instantly load previous dental records, treatment history, and diagnostic baselines as soon as the patient sits in the chair.
                  </p>
                </div>
              </div>

              {/* Step 2 */}
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  2
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">AI-Assisted X-Ray Inspection</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Upload panoramic X-rays to get immediate preliminary suggestions for cavities, crowns, and implants, reducing oversight risks.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  3
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Quick Odontogram Charting</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Confirm AI suggestions and update the interactive 2D charting interface directly. Log tooth status and surfaces with fewer clicks.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-sm flex-shrink-0">
                  4
                </div>
                <div>
                  <h3 className="font-bold text-lg text-slate-100">Generate Professional Reports</h3>
                  <p className="text-sm text-slate-400 mt-1 leading-relaxed">
                    Instantly export the completed charting into structured PDF summaries to explain the treatment plan to patients or for referral records.
                  </p>
                </div>
              </div>

            </div>

            {/* Right Column - Mockup */}
            <div className="md:col-span-6">
              <div className="relative w-full aspect-[4/3] rounded-3xl overflow-hidden bg-slate-800 border-2 border-dashed border-slate-700">
                <svg className="absolute inset-0 w-full h-full text-slate-700 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                  <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                  <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive AI Demo Section */}
      <section id="ai-demo" className="py-24 max-w-7xl mx-auto px-6">
        <div className="flex flex-col items-center gap-8">
          <span className="text-xs font-bold uppercase tracking-widest text-primary">AI Diagnostics Demo</span>
          <div className="relative w-full max-w-[800px] aspect-[16/9] rounded-3xl overflow-hidden bg-slate-50 border-2 border-dashed border-slate-300">
            <svg className="absolute inset-0 w-full h-full text-slate-200 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
              <line x1="0" y1="0" x2="100%" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
              <line x1="100%" y1="0" x2="0" y2="100%" stroke="currentColor" strokeWidth="1.5" strokeDasharray="4 4" />
            </svg>
          </div>
        </div>
      </section>

      {/* Sign-off / Join Banner (Solid Teal bg) */}
      <section className="bg-primary py-20 text-white text-center relative overflow-hidden">
        <div className="max-w-4xl mx-auto px-6 relative flex flex-col items-center gap-6">
          <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
            Ready to upgrade your clinical workflow?
          </h2>
          <p className="text-teal-100 text-base sm:text-lg max-w-xl leading-relaxed">
            Join modern dental clinics using IDRS to optimize record-keeping, speed up diagnoses, and eliminate recording overhead.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto mt-4">
            <button 
              onClick={() => navigate('/auth/register')}
              className="bg-white text-primary font-bold px-8 py-4 rounded-2xl shadow-lg transition-transform active:scale-95"
            >
              Create Clinic Account
            </button>
            <button className="bg-primary-dark border border-teal-500/30 text-white font-bold px-8 py-4 rounded-2xl transition-colors">
              Speak with Advisor
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-50 border-t border-slate-200 py-16 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-12">
          
          <div className="col-span-2 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary flex items-center justify-center">
                <Stethoscope className="h-5 w-5 text-white" />
              </div>
              <span className="font-bold text-slate-900 text-sm">IDRS</span>
            </div>
            <p className="leading-relaxed max-w-xs text-slate-500">
              Integrated Dental Record System. Elevating modern dentistry with artificial intelligence and optimized, fluid clinical interfaces.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-800 text-sm">Product</span>
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-primary transition-colors">Workflows</a>
            <a href="#ai-demo" className="hover:text-primary transition-colors">AI Demo</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-800 text-sm">Documentation</span>
            <a href="#" className="hover:text-primary transition-colors">User Manual</a>
            <a href="#" className="hover:text-primary transition-colors">API References</a>
            <a href="#" className="hover:text-primary transition-colors">Security Standards</a>
          </div>

          <div className="flex flex-col gap-3">
            <span className="font-bold text-slate-800 text-sm">Legal</span>
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-primary transition-colors">GDPR & HIPAA Compliance</a>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 pt-12 mt-12 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <span>&copy; {new Date().getFullYear()} IDRS Project. All rights reserved.</span>
          <span>Developed by Software Engineering Program, CAMT, CMU.</span>
        </div>
      </footer>
    </div>
  );
}
