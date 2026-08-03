import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { AlertTriangle, HelpCircle, Info, X } from 'lucide-react';
import { useConfirmStore } from '@/store/confirmStore';

export default function ConfirmationModal() {
  const { isOpen, options, confirm, cancel } = useConfirmStore();

  // Handle ESC key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        cancel();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cancel]);

  if (!options) return null;

  const {
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    type = 'info',
  } = options;

  const isDanger = type === 'danger';
  const isWarning = type === 'warning';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={cancel}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ type: 'spring', duration: 0.3 }}
            className="relative bg-white rounded-3xl p-6 border border-slate-100 max-w-md w-full shadow-2xl z-10 flex flex-col gap-4 overflow-hidden"
          >
            {/* Header section with Icon & Close btn */}
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-4 items-start">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isDanger
                      ? 'bg-rose-50 text-rose-600 border border-rose-100'
                      : isWarning
                      ? 'bg-amber-50 text-amber-600 border border-amber-100'
                      : 'bg-teal-50 text-teal-600 border border-teal-100'
                  }`}
                >
                  {isDanger && <AlertTriangle className="w-6 h-6" />}
                  {isWarning && <HelpCircle className="w-6 h-6" />}
                  {!isDanger && !isWarning && <Info className="w-6 h-6" />}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-lg font-bold text-slate-900 leading-tight">
                    {title}
                  </h3>
                  <p className="text-sm text-slate-500 font-medium leading-relaxed mt-1">
                    {message}
                  </p>
                </div>
              </div>

              <button
                onClick={cancel}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-50 transition-colors shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={cancel}
                className="px-5 h-11 rounded-xl font-semibold border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                onClick={confirm}
                className={`px-6 h-11 rounded-xl font-bold text-white shadow-md transition-all active:scale-[0.98] cursor-pointer ${
                  isDanger
                    ? 'bg-rose-500 hover:bg-rose-600 shadow-rose-500/10'
                    : isWarning
                    ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10'
                    : 'bg-teal-500 hover:bg-teal-600 shadow-teal-500/10'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
