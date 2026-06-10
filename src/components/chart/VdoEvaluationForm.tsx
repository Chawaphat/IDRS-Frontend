import React, { useState, useEffect } from "react";
import { Ruler, UserMinus, Focus, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vdoEvaluationService } from "@/services/vdoEvaluationService";
import type { VdoEvaluationUpdate, FacialConditionType, BiteType } from "@/services/types/vdoEvaluation";
import { SectionNotes } from "./components/SectionNotes";

interface VdoEvaluationFormProps {
  chartId: string;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

const SelectCard = ({ label, subLabel, isSelected, onClick }: { label: string; subLabel?: string; isSelected: boolean; onClick: () => void }) => (
  <div
      onClick={onClick}
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

export default function VdoEvaluationForm({ chartId }: VdoEvaluationFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [isNewRecord, setIsNewRecord] = useState(false);

  const [formData, setFormData] = useState<VdoEvaluationUpdate>({
    facial_soft_tissue: [],
    closest_speaking: null,
    free_way_space: null,
    bite_type: null,
    reference_teeth: [],
    note: "",
  });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await vdoEvaluationService.getByChart(chartId);
        if (data) {
          setFormData({
            facial_soft_tissue: data.facial_soft_tissue || [],
            closest_speaking: data.closest_speaking ?? null,
            free_way_space: data.free_way_space ?? null,
            bite_type: data.bite_type ?? null,
            reference_teeth: data.reference_teeth || [],
            note: data.note || "",
          });
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setIsNewRecord(true);
        } else {
          console.error("Error fetching VDO Evaluation:", err);
        }
      } finally {
        setLoading(false);
        setTimeout(() => setInitialDataLoaded(true), 500);
      }
    };
    if (chartId) fetchData();
  }, [chartId]);

  useEffect(() => {
    const saveData = async () => {
      if (!initialDataLoaded || loading) return;
      try {
        setSaving(true);
        if (isNewRecord) {
          await vdoEvaluationService.create(chartId, debouncedFormData as any);
          setIsNewRecord(false);
        } else {
          try {
            await vdoEvaluationService.update(chartId, debouncedFormData);
          } catch (updateErr: any) {
            if (updateErr?.response?.status === 404) {
              await vdoEvaluationService.create(chartId, debouncedFormData as any);
              setIsNewRecord(false);
            } else {
              throw updateErr;
            }
          }
        }
      } catch (err) {
        console.error("Error saving VDO Evaluation:", err);
      } finally {
        setSaving(false);
      }
    };
    saveData();
  }, [debouncedFormData, chartId, initialDataLoaded, loading]);

  const updateField = (field: keyof VdoEvaluationUpdate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleArrayField = (value: FacialConditionType) => {
    setFormData((prev) => {
      const arr = prev.facial_soft_tissue ? [...prev.facial_soft_tissue] : [];
      if (arr.includes(value)) {
        return { ...prev, facial_soft_tissue: arr.filter(item => item !== value) };
      }
      return { ...prev, facial_soft_tissue: [...arr, value] };
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin" />
      </div>
    );
  }

  const isVdoLost = formData.free_way_space !== null && formData.free_way_space !== undefined && formData.free_way_space > 4;

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 relative">
      
      <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <Ruler className="w-8 h-8 text-teal-600" />
              VDO Evaluations
          </h2>
          <p className="text-slate-500 mt-1">Vertical Dimension of Occlusion analysis and soft tissue assessment.</p>
        </div>
        {saving && <span className="text-sm text-slate-400 italic flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div> Saving...</span>}
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <UserMinus className="w-5 h-5 text-pink-500" />
              <h3 className="font-semibold text-slate-800">Facial Soft Tissue Contour</h3>
          </div>
          <div className="p-6">
              <Label className="text-sm font-bold text-slate-700 mb-3 block">
                  Select present conditions <span className="text-slate-400 font-normal ml-1">(Multi-select)</span>
              </Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {[
                      { id: 'nasolabial_fold', label: 'Nasolabial fold' },
                      { id: 'prominent_chin', label: 'Prominent chin' },
                      { id: 'drooping_commissure', label: 'Drooping commissure' },
                      { id: 'thin_lips', label: 'Thin lips' }
                  ].map(opt => (
                      <SelectCard
                          key={opt.id}
                          label={opt.label}
                          isSelected={formData.facial_soft_tissue?.includes(opt.id as FacialConditionType) ?? false}
                          onClick={() => toggleArrayField(opt.id as FacialConditionType)}
                      />
                  ))}
              </div>
          </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <Focus className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-slate-800">Functional & Bite Assessment</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">

              <div className="space-y-4">
                  <Label className="text-sm font-bold text-slate-700">Closest Speaking Space</Label>
                  <div className="space-y-4 pt-1">
                      <div className="relative w-full">
                          <Input
                              type="number"
                              value={formData.closest_speaking || ""}
                              onChange={(e) => updateField('closest_speaking', e.target.value ? parseFloat(e.target.value) : null)}
                              className="pr-10 border-slate-200 focus-visible:ring-teal-500"
                              placeholder="e.g. 2"
                          />
                          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                      </div>

                      <div className="space-y-2">
                          <Label className="text-xs font-bold text-slate-400 uppercase">Reference Teeth</Label>
                          <Input
                              value={formData.reference_teeth?.join(", ") || ""}
                              onChange={e => {
                                  const arr = e.target.value.split(",").map((s) => parseInt(s.trim(), 10)).filter((n) => !isNaN(n));
                                  updateField('reference_teeth', arr);
                              }}
                              className="bg-white focus-visible:ring-teal-500"
                              placeholder="e.g., 11, 41"
                          />
                      </div>
                  </div>
              </div>

              <div className="space-y-4 md:border-l md:border-slate-100 md:pl-8">
                  <Label className="text-sm font-bold text-slate-700">Present Bite Type</Label>
                  <div className="grid grid-cols-2 gap-3">
                      {[
                          { id: 'normal_bite', label: 'Normal bite' },
                          { id: 'deep_bite', label: 'Deep bite' },
                          { id: 'edge_to_edge', label: 'Edge to edge' },
                          { id: 'crossbite', label: 'Crossbite' }
                      ].map(opt => (
                          <SelectCard
                              key={opt.id}
                              label={opt.label}
                              isSelected={formData.bite_type === opt.id}
                              onClick={() => updateField('bite_type', opt.id as BiteType)}
                          />
                      ))}
                  </div>
              </div>

          </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6">

              <div className="space-y-2 w-full md:w-1/2">
                  <Label className="text-sm font-bold text-slate-700">Free-way space (VDO - VDR)</Label>
                  <div className="relative w-full">
                      <Input
                          type="number"
                          value={formData.free_way_space || ""}
                          onChange={(e) => updateField('free_way_space', e.target.value ? parseFloat(e.target.value) : null)}
                          className="pr-10 border-slate-200"
                          placeholder="e.g. 2"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                  </div>
              </div>

              <div className="w-full md:w-1/2 h-full flex items-center">
                  {isVdoLost ? (
                      <div className="animate-in zoom-in-95 fade-in duration-300 w-full flex items-start gap-3 bg-rose-50 border border-rose-200 p-4 rounded-2xl text-rose-700">
                          <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                          <div>
                              <h4 className="font-bold text-sm">Loss of VDO Indicated</h4>
                              <p className="text-xs text-rose-600/80 mt-0.5">A free-way space greater than 4mm suggests a loss of Vertical Dimension.</p>
                          </div>
                      </div>
                  ) : (
                      <div className="w-full flex items-center justify-center p-4 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-sm">
                          Expected normal range is ≤ 4mm
                      </div>
                  )}
              </div>

          </div>
      </div>
      
      <SectionNotes
        sectionId="vdo"
        value={formData.note || ""}
        onChange={(val) => updateField("note", val)}
      />
    </div>
  );
}
