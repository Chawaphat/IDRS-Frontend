import { cn } from '@/lib/utils';

export const MedicalIcon = ({ type, className }: { type: string; className?: string }) => {
    const base = "w-full h-16 sm:h-20 mb-2 rounded-lg border bg-slate-50 flex items-center justify-center p-2 transition-colors";

    const renderGraphic = () => {
        switch (type) {
            case 'smile-avg':
                return <svg viewBox="0 0 100 50" className="w-16 h-8"><path d="M10 25 Q50 45 90 25 Q50 35 10 25" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M15 26 Q50 40 85 26" fill="none" stroke="#cbd5e1" strokeWidth="1" /></svg>;
            case 'smile-high':
                return <svg viewBox="0 0 100 50" className="w-16 h-8"><path d="M10 25 Q50 45 90 25 L90 15 Q50 35 10 15 Z" fill="#fbcfe8" stroke="#f9a8d4" strokeWidth="1" /><path d="M10 25 Q50 45 90 25 Q50 35 10 25" fill="#fff" stroke="#94a3b8" strokeWidth="2" /></svg>;
            case 'smile-low':
                return <svg viewBox="0 0 100 50" className="w-16 h-8"><path d="M10 15 Q50 35 90 15 Q50 25 10 15" fill="#fff" stroke="#94a3b8" strokeWidth="2" /></svg>;
            case 'curve-convex':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 10 Q50 35 80 10" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="42" y="5" width="16" height="20" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="5" width="14" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="61" y="5" width="14" height="15" rx="2" fill="#fff" stroke="#94a3b8" /></svg>;
            case 'curve-straight':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 25 L80 25" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="42" y="5" width="16" height="17" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="5" width="14" height="17" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="61" y="5" width="14" height="17" rx="2" fill="#fff" stroke="#94a3b8" /></svg>;
            case 'curve-reverse':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 30 Q50 10 80 30" fill="none" stroke="#0f766e" strokeWidth="3" strokeLinecap="round" /><rect x="42" y="5" width="16" height="12" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="5" width="14" height="18" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="61" y="5" width="14" height="18" rx="2" fill="#fff" stroke="#94a3b8" /></svg>;
            case 'mid-center':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="10" y="10" width="80" height="20" rx="4" fill="#fff" stroke="#94a3b8" /><line x1="50" y1="0" x2="50" y2="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" /></svg>;
            case 'mid-left':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="10" y="10" width="80" height="20" rx="4" fill="#fff" stroke="#94a3b8" /><line x1="65" y1="0" x2="65" y2="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" /></svg>;
            case 'mid-right':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="10" y="10" width="80" height="20" rx="4" fill="#fff" stroke="#94a3b8" /><line x1="35" y1="0" x2="35" y2="40" stroke="#ef4444" strokeWidth="2" strokeDasharray="4" /></svg>;
            case 'teeth-6':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M25 15 Q50 25 75 15" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 10" /></svg>;
            case 'teeth-8':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M15 10 Q50 25 85 10" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 10" /></svg>;
            case 'teeth-10':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M5 5 Q50 25 95 5" fill="none" stroke="#94a3b8" strokeWidth="8" strokeLinecap="round" strokeDasharray="2 10" /></svg>;
            case 'teeth-16':
                return <svg viewBox="0 0 100 30" className="w-16 h-6"><path d="M0 5 Q50 25 100 5 M0 25 Q50 5 100 25" fill="none" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" strokeDasharray="2 8" /></svg>;
            case 'lip-touching':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M15 10 Q50 35 85 10" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M10 15 Q50 35 90 15" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" /></svg>;
            case 'lip-not-touching':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M20 10 Q50 25 80 10" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M10 20 Q50 40 90 20" fill="none" stroke="#f43f5e" strokeWidth="3" strokeLinecap="round" /></svg>;
            case 'lip-covered':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M15 10 Q50 45 85 10" fill="#fff" stroke="#94a3b8" strokeWidth="2" /><path d="M10 25 Q50 20 90 25 Q50 38 10 25" fill="#fbcfe8" stroke="#f43f5e" strokeWidth="1" /></svg>;
            case 'mid-ul-right':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="15" y="5" width="70" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="20" width="50" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><line x1="56" y1="2" x2="56" y2="20" stroke="#ef4444" strokeWidth="1.5" /><line x1="50" y1="20" x2="50" y2="38" stroke="#3b82f6" strokeWidth="1.5" /></svg>;
            case 'mid-ul-left':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="15" y="5" width="70" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="20" width="50" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><line x1="44" y1="2" x2="44" y2="20" stroke="#ef4444" strokeWidth="1.5" /><line x1="50" y1="20" x2="50" y2="38" stroke="#3b82f6" strokeWidth="1.5" /></svg>;
            case 'mid-ul-straight':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><rect x="15" y="5" width="70" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><rect x="25" y="20" width="50" height="15" rx="2" fill="#fff" stroke="#94a3b8" /><line x1="50" y1="2" x2="50" y2="38" stroke="#10b981" strokeWidth="1.5" /></svg>;
            case 'buccal-normal':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M5 20 Q50 45 95 20 Q50 5 5 20" fill="#1e293b" /><path d="M12 20 Q50 38 88 20 Q50 10 12 20" fill="#fff" stroke="#94a3b8" strokeWidth="1" /></svg>;
            case 'buccal-increased':
                return <svg viewBox="0 0 100 40" className="w-16 h-8"><path d="M5 20 Q50 45 95 20 Q50 5 5 20" fill="#1e293b" /><path d="M28 20 Q50 35 72 20 Q50 12 28 20" fill="#fff" stroke="#94a3b8" strokeWidth="1" /></svg>;
            default:
                return <div className="w-8 h-8 rounded-full bg-slate-200" />;
        }
    };

    return <div className={cn(base, className)}>{renderGraphic()}</div>;
};

export const TextCard = ({ label, isSelected, onClick }: { label: string; isSelected: boolean; onClick: () => void }) => (
    <div
        onClick={onClick}
        className={cn(
            "px-3 py-2.5 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-bold text-center",
            isSelected ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
        )}
    >
        {label}
    </div>
);

export const RadioCard = ({ label, value, currentValue, onChange, className }: { label: string, value: string, currentValue: string, onChange: (v: string) => void, className?: string }) => {
    const isSelected = currentValue === value;
    return (
        <button
            type="button"
            onClick={() => onChange(value)}
            className={cn(
                "flex items-center justify-center px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200",
                isSelected ? "border-teal-500 bg-teal-50 text-teal-800 shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
                className
            )}
        >
            {label}
        </button>
    );
};

export const SelectCard = ({ label, subLabel, isSelected, onClick, type = 'radio' }: { label: string; subLabel?: string; isSelected: boolean; onClick: () => void; type?: 'radio' | 'checkbox' }) => (
    <div
        onClick={onClick}
        data-type={type}
        className={cn(
            "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-center select-none",
            isSelected
                ? "border-teal-500 bg-teal-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50"
        )}
    >
        <span className={cn("text-sm font-bold", isSelected ? "text-teal-900" : "text-slate-700")}>{label}</span>
        {subLabel && <span className={cn("text-xs mt-0.5", isSelected ? "text-teal-600" : "text-slate-400")}>{subLabel}</span>}
    </div>
);

export const VisualCard = ({ id, label, svgType, imagePath, isSelected, onClick, cardClassName, iconClassName }: { id: string; label: string; svgType?: string; imagePath?: string; isSelected: boolean; onClick: () => void; cardClassName?: string; iconClassName?: string }) => (
    <div
        data-id={id}
        onClick={onClick}
        className={cn(
            "p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col items-center justify-center text-sm font-bold text-center group",
            isSelected ? "border-teal-500 bg-teal-50 text-teal-900 shadow-md ring-2 ring-teal-100 ring-offset-1" : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50",
            cardClassName
        )}
    >
        {imagePath ? (
            <img
                src={imagePath}
                alt={label}
                className={cn("mb-3 object-contain rounded-lg border-2 transition-colors", isSelected ? "border-teal-300" : "border-slate-100 group-hover:border-slate-200", iconClassName)}
            />
        ) : (
            <MedicalIcon type={svgType || ""} className={cn(isSelected ? "border-teal-200 bg-white" : "border-slate-100 group-hover:border-slate-200", iconClassName)} />
        )}
        <span>{label}</span>
    </div>
);
