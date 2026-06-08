import React from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useToastStore } from '@/store/toastStore';
import type { Toast } from '@/store/toastStore';

export default function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast: Toast) => {
          const isSuccess = toast.type === 'success';
          const isError = toast.type === 'error';

          return (
            <motion.div
              key={toast.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 rounded-2xl border backdrop-blur-md shadow-lg transition-colors ${
                isSuccess
                  ? 'bg-emerald-50/90 border-emerald-200/80 text-emerald-900'
                  : isError
                  ? 'bg-rose-50/90 border-rose-200/80 text-rose-900'
                  : 'bg-slate-50/90 border-slate-200/80 text-slate-900'
              }`}
            >
              {isSuccess && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />}
              {isError && <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />}
              {!isSuccess && !isError && <Info className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />}

              <div className="flex-1 text-sm font-semibold leading-relaxed">
                {toast.message}
              </div>

              <button
                onClick={() => dismiss(toast.id)}
                className={`p-1 rounded-lg hover:bg-black/5 transition-colors shrink-0 ${
                  isSuccess ? 'text-emerald-700' : isError ? 'text-rose-700' : 'text-slate-500'
                }`}
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
