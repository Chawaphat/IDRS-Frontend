import { FileText } from 'lucide-react';
import { sectionNames } from '../types';

export interface SectionNotesProps {
    sectionId: string;
    value: string;
    onChange: (value: string) => void;
}

/**
 * Inline note field shown at the bottom of every chart section. Was
 * previously a floating popover button in the corner of the screen — moved
 * inline so it reads as part of the form instead of a hidden extra step.
 */
export const SectionNotes = ({ sectionId, value, onChange }: SectionNotesProps) => {
    const sectionName = sectionNames[sectionId] || 'Section';

    return (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 mt-4">
            <label htmlFor={`section-note-${sectionId}`} className="mb-3 flex items-center gap-2 text-sm font-bold text-slate-700">
                <FileText className="w-4 h-4 text-teal-500" />
                {sectionName} Note
            </label>
            <textarea
                id={`section-note-${sectionId}`}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                placeholder={`Add additional clinical notes for ${sectionName.toLowerCase()}...`}
                className="min-h-[100px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 p-3 text-sm text-slate-800 outline-none transition-all placeholder:text-slate-300 focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/10"
            />
        </div>
    );
};
