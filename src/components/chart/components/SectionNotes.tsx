import { useState, useEffect, useRef } from 'react';
import { FileText, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { sectionNames } from '../types';
import type { FormState } from '../types';

export const SectionNotes = ({ sectionId, formData, updateField }: { sectionId: string, formData: FormState, updateField: (k: keyof FormState, v: unknown) => void }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [showAttention, setShowAttention] = useState(true);
    const popoverRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const value = formData.sectionNotes?.[sectionId] || '';
    const sectionName = sectionNames[sectionId] || 'Section';

    useEffect(() => {
        const timer = setTimeout(() => {
            setShowAttention(false);
        }, 6000);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        document.addEventListener('keydown', handleKeyDown);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen]);

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => {
                if (textareaRef.current) {
                    textareaRef.current.focus();
                    textareaRef.current.setSelectionRange(
                        textareaRef.current.value.length,
                        textareaRef.current.value.length
                    );
                }
            }, 50);
        }
    }, [isOpen]);

    return (
        <div className="fixed right-6 md:right-8 bottom-6 md:bottom-8 z-40" ref={popoverRef}>
            {/* Attention Grabber Speech Bubble */}
            {showAttention && !value && !isOpen && (
                <div className="absolute right-0 bottom-14 md:bottom-16 z-50 flex flex-col items-end animate-in fade-in slide-in-from-bottom-4 duration-300">
                    <div className="bg-slate-900 text-white text-xs font-semibold px-3 py-2 rounded-xl shadow-2xl flex items-center gap-2 whitespace-nowrap border border-slate-800">
                        <span className="flex h-1.5 w-1.5 rounded-full bg-teal-400 animate-pulse"></span>
                        <span>Add clinical notes for {sectionName}!</span>
                        <button
                            type="button"
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowAttention(false);
                            }}
                            className="ml-1 rounded-full p-0.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
                            title="Dismiss"
                        >
                            <X size={12} />
                        </button>
                    </div>
                    {/* Arrow pointing down into the button */}
                    <div className="w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-slate-900 mr-5 md:mr-6"></div>
                </div>
            )}

            <button
                type="button"
                onClick={() => {
                    setIsOpen(!isOpen);
                    setShowAttention(false);
                }}
                title={value ? `${sectionName} Note (Note exists)` : `Add ${sectionName} Note`}
                aria-label={value ? `${sectionName} Note (Note exists)` : `Add ${sectionName} Note`}
                className={cn(
                    "flex h-12 w-12 md:h-14 md:w-14 items-center justify-center rounded-full transition-all duration-300 shadow-xl border focus:outline-none focus:ring-4 focus:ring-teal-500/20 group relative hover:scale-105 active:scale-95",
                    value
                        ? "bg-gradient-to-br from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white border-teal-600 shadow-teal-500/20"
                        : "bg-gradient-to-br from-teal-50 to-white hover:from-teal-100 hover:to-teal-50 text-teal-600 border-teal-200 shadow-slate-200/50"
                )}
            >
                <FileText className="w-5 h-5 md:w-6 h-6" />
                
                {/* Glowing alert outer ring for attention */}
                {!value && !isOpen && (
                    <span className="absolute -inset-1 rounded-full bg-teal-400/10 animate-pulse pointer-events-none -z-10"></span>
                )}

                {value && (
                    <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-teal-400 opacity-75"></span>
                        <span className="relative inline-flex h-3.5 w-3.5 rounded-full bg-teal-500 border border-white"></span>
                    </span>
                )}
                
                {/* Expand label on hover */}
                <span className="absolute right-14 md:right-16 bg-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-lg opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap shadow-md">
                    {value ? `Edit ${sectionName} Note` : `Add ${sectionName} Note`}
                </span>
            </button>

            {isOpen && (
                <div className="absolute right-0 bottom-16 md:bottom-20 z-50 w-80 md:w-96 max-w-[calc(100vw-48px)] rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-bottom-4">
                    <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                            <FileText className="w-4 h-4 text-teal-500" /> {sectionName} Note
                        </span>
                        <button
                            type="button"
                            onClick={() => setIsOpen(false)}
                            className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
                            title="Close"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    </div>
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => updateField('sectionNotes', { ...formData.sectionNotes, [sectionId]: e.target.value })}
                        placeholder={`Type additional clinical notes for ${sectionName.toLowerCase()}...`}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10 min-h-[140px] resize-y shadow-inner"
                    />
                    <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
                        <span>Saved automatically</span>
                        {value && (
                            <button
                                type="button"
                                onClick={() => {
                                    updateField('sectionNotes', { ...formData.sectionNotes, [sectionId]: '' });
                                    setIsOpen(false);
                                }}
                                className="text-rose-500 hover:text-rose-600 hover:underline font-semibold"
                            >
                                Clear Note
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};
