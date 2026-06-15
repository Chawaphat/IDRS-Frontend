import React from 'react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { RefreshCcw } from 'lucide-react';
import { cn } from '../lib/utils';

interface RankedExpectationSelectorProps {
    selectedExpectations: string[];
    onSelectionsChange: (selections: string[]) => void;
    otherValue: string;
    onOtherChange: (value: string) => void;
}

const OPTIONS = [
    { id: 'chewing', label: 'Chewing', th: 'Masticatory function' },
    { id: 'esthetic', label: 'Esthetic', th: 'Appearance & aesthetics' },
    { id: 'health', label: 'Health', th: 'Oral health maintenance' },
    { id: 'phonetics', label: 'Phonetics', th: 'Speech & phonation' },
    { id: 'others', label: 'Others...', th: 'Please specify below' },
];

export const RankedExpectationSelector: React.FC<RankedExpectationSelectorProps> = ({
    selectedExpectations,
    onSelectionsChange,
    otherValue,
    onOtherChange,
}) => {
    // Helper to get current rank of an option (1-based)
    const getRankNumber = (id: string): number | null => {
        const index = selectedExpectations.indexOf(id);
        return index !== -1 ? index + 1 : null;
    };

    const handleCardClick = (id: string) => {
        const index = selectedExpectations.indexOf(id);
        if (index !== -1) {
            // Deselect and re-order remaining
            const newSelections = [...selectedExpectations];
            newSelections.splice(index, 1);
            onSelectionsChange(newSelections);
            if (id === 'others') {
                onOtherChange('');
            }
        } else {
            // Append to the end, getting the next available rank
            onSelectionsChange([...selectedExpectations, id]);
        }
    };

    const handleReset = () => {
        onSelectionsChange([]);
        onOtherChange('');
    };

    // Width calculation based on priority (index 0 is longest)
    const getBarWidth = (rankNumber: number) => {
        const totalSelected = selectedExpectations.length;
        if (totalSelected === 1) return '100%';
        // Create an even distribution
        const percentage = 100 - ((rankNumber - 1) * (80 / (totalSelected - 1)));
        return `${Math.max(percentage, 20)}%`;
    };

    const isOthersSelected = selectedExpectations.includes('others');

    return (
        <div className="space-y-8">
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-5 bg-[#0d9488] rounded-full"></div>
                        <Label className="text-base font-bold text-slate-800">Tap in order of priority</Label>
                    </div>
                    {selectedExpectations.length > 0 && (
                        <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-4 text-[#0d9488] hover:text-[#115e59] hover:bg-[#f0fdfa] font-semibold rounded-xl transition-colors"
                            onClick={handleReset}
                        >
                            <RefreshCcw className="w-4 h-4 mr-2" />
                            Reset Selection
                        </Button>
                    )}
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {OPTIONS.map(opt => {
                        const rankNumber = getRankNumber(opt.id);
                        const isSelected = rankNumber !== null;
                        
                        return (
                            <div
                                key={opt.id}
                                onClick={() => handleCardClick(opt.id)}
                                className={cn(
                                    "relative p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col gap-1.5 min-h-[5.5rem] justify-center group select-none",
                                    isSelected
                                        ? "border-[#0d9488] bg-[#f0fdfa] shadow-md shadow-[#0d9488]/10 scale-[1.02] ring-1 ring-[#0d9488]/20"
                                        : "border-slate-200 bg-white hover:border-[#0d9488]/50 hover:bg-slate-50 hover:shadow-sm"
                                )}
                            >
                                {/* Background glow effect for selected */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-br from-[#0d9488]/5 to-transparent pointer-events-none rounded-2xl" />
                                )}
                                
                                {/* Rank Badge */}
                                {isSelected && (
                                    <div className="absolute -top-3 -left-3 w-8 h-8 bg-[#0d9488] text-white rounded-full flex items-center justify-center font-bold text-sm shadow-sm ring-4 ring-white transition-transform animate-in zoom-in">
                                        {rankNumber}
                                    </div>
                                )}
                                
                                <span className={cn("font-bold text-base transition-colors", isSelected ? "text-slate-900" : "text-slate-700 group-hover:text-slate-900")}>
                                    {opt.label}
                                </span>
                                <span className={cn("text-xs font-medium transition-colors", isSelected ? "text-[#0d9488]" : "text-slate-400 group-hover:text-[#0d9488]/70")}>
                                    {opt.th}
                                </span>
                            </div>
                        );
                    })}
                </div>

                {isOthersSelected && (
                    <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100 animate-in fade-in slide-in-from-top-2 duration-300">
                        <Label className="text-xs font-bold text-slate-500 mb-2 block uppercase tracking-wider">Specify Other Expectation</Label>
                        <Input
                            value={otherValue}
                            onChange={e => onOtherChange(e.target.value)}
                            className="focus-visible:ring-[#0d9488] bg-white border-slate-200 h-11"
                            placeholder="Please specify..."
                            autoFocus
                        />
                    </div>
                )}
            </div>

            {/* Selected Priority List */}
            {selectedExpectations.length > 0 && (
                <div className="bg-slate-50 rounded-3xl p-6 border border-slate-200 shadow-sm animate-in fade-in duration-500">
                    <div className="flex items-center gap-2 mb-5">
                        <div className="w-1.5 h-5 bg-[#0d9488] rounded-full shadow-sm"></div>
                        <Label className="text-sm font-bold text-slate-800 uppercase tracking-wider">Priority Ranking Result</Label>
                    </div>
                    <div className="space-y-3">
                        {selectedExpectations.map((id, index) => {
                            const option = OPTIONS.find(o => o.id === id);
                            const label = option ? option.label : id;
                            const rankNumber = index + 1;
                            
                            // Visual hierarchy: rank 1 is most prominent
                            const isFirst = rankNumber === 1;
                            
                            return (
                                <div 
                                    key={id} 
                                    className="group relative overflow-hidden animate-in slide-in-from-bottom-2 duration-300"
                                    style={{ animationDelay: `${index * 50}ms` }}
                                >
                                    <div className={cn(
                                        "flex items-center gap-4 relative z-10 p-3.5 rounded-2xl transition-all border",
                                        isFirst 
                                            ? "bg-[#f0fdfa] border-[#0d9488]/30 shadow-sm ring-1 ring-[#0d9488]/10" 
                                            : "bg-white border-slate-200 hover:border-[#0d9488]/30 hover:bg-slate-50/50 hover:shadow-sm"
                                    )}>
                                        <div className={cn(
                                            "w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold shrink-0 shadow-sm transition-colors",
                                            isFirst
                                                ? "bg-[#0d9488] text-white"
                                                : "bg-slate-100 text-slate-600 group-hover:bg-[#f0fdfa] group-hover:text-[#0d9488]"
                                        )}>
                                            {rankNumber}
                                        </div>
                                        <div className="flex flex-col flex-1">
                                            <span className={cn(
                                                "font-bold transition-colors",
                                                isFirst ? "text-slate-900 text-base" : "text-slate-700 text-sm group-hover:text-slate-900"
                                            )}>
                                                {label}
                                            </span>
                                            {id === 'others' && otherValue && (
                                                <span className="text-xs font-medium text-slate-500 truncate mt-0.5">{otherValue}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
};
