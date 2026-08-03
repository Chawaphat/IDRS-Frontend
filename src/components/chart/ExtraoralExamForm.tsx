import React, { useState, useEffect, useRef } from "react";
import { Info, Activity, Zap, UserSquare2 } from "lucide-react";
import { useToastStore } from "@/store/toastStore";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extraoralExamService } from "@/services/extraoralExamService";
import type { 
  ExtraoralExamUpdate, 
  FacialSymmetryType, 
  FacialProfileType, 
  HabitType, 
  JointSoundType, 
  JawDeviationType, 
  JointPainType 
} from "@/services/types/extraoralExam";
import { FacialProfile } from "@/components/FacialProfile";
import { FacialSymmetry } from "@/components/FacialSymmetry";
import { FaceMuscleChart } from "@/components/FaceMuscleChart";
import { SectionNotes } from "./components/SectionNotes";
import { useSectionSave } from "@/hooks/useSectionSave";

interface ExtraoralExamFormProps {
  chartId: string;
}

export default function ExtraoralExamForm({ chartId }: ExtraoralExamFormProps) {
  const { show: showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { markDirty, markClean, registerSave } = useSectionSave("extraoral");

  const [formData, setFormData] = useState<ExtraoralExamUpdate>({
    facial_symmetry: "symmetry",
    facial_profile: "straight",
    muscle_pain: [],
    joint_pain: [],
    joint_sound: "no",
    jaw_deviation: "none",
    has_limited_opening: false,
    mouth_opening_mm: null,
    has_limited_movement: false,
    specify_movement_detail: "",
    parafunctional_habit: [],
    parafunctional_habit_other: "",
    factors_affecting_tooth_wear: {},
    note: ""
  });

  const formDataRef = useRef(formData);
  useEffect(() => { formDataRef.current = formData; }, [formData]);

  useEffect(() => {
    const fetchExam = async () => {
      try {
        setLoading(true);
        const data = await extraoralExamService.getByChart(chartId);
        if (data) {
          const mapped = {
            ...data,
            muscle_pain: Array.isArray(data.muscle_pain) ? data.muscle_pain : [],
            joint_pain: data.joint_pain || [],
            parafunctional_habit: data.parafunctional_habit || [],
            factors_affecting_tooth_wear: data.factors_affecting_tooth_wear || {},
            note: data.note || ""
          };
          setFormData(mapped);
        }
      } catch (err) {
        console.error("Failed to fetch extraoral exam:", err);
        showToast("Failed to load extraoral exam.", "error");
      } finally {
        setLoading(false);
        registerSave(async () => {
          setSaving(true);
          try {
            await extraoralExamService.update(chartId, { ...formDataRef.current });
          } catch (err) {
            showToast("Failed to save extraoral exam.", "error");
            throw err;
          } finally {
            setSaving(false);
          }
        });
        markClean();
      }
    };
    fetchExam();
  }, [chartId, showToast, registerSave, markClean]);

  const updateField = (field: keyof ExtraoralExamUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    markDirty();
  };

  const toggleArrayField = (field: keyof ExtraoralExamUpdate, value: string) => {
    setFormData(prev => {
      const arr = (prev[field] as string[]) || [];
      if (arr.includes(value)) {
        return { ...prev, [field]: arr.filter(item => item !== value) };
      }
      return { ...prev, [field]: [...arr, value] };
    });
    markDirty();
  };

  const handleToggleToothWear = (factor: string) => {
    setFormData(prev => {
      const current = prev.factors_affecting_tooth_wear || {};
      return {
        ...prev,
        factors_affecting_tooth_wear: {
          ...current,
          [factor]: !current[factor]
        }
      };
    });
    markDirty();
  };

  if (loading) {
    return (
        <div className="absolute inset-0 bg-slate-50/50 backdrop-blur-sm z-10 flex flex-col items-center justify-center min-h-[60vh] rounded-3xl">
            <div className="bg-white p-8 rounded-3xl shadow-xl border border-teal-100 flex flex-col items-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 border-4 border-teal-100 border-t-teal-500 rounded-full animate-spin mb-6 shadow-sm" />
                <h3 className="text-xl font-bold text-slate-800 mb-2">Loading Section</h3>
                <p className="text-slate-500 font-medium">Retrieving clinical data...</p>
            </div>
        </div>
    );
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="border-b border-slate-200 pb-4 flex items-start justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <UserSquare2 className="w-8 h-8 text-teal-600" />
              Extraoral Examination
          </h2>
          <p className="text-slate-500 mt-1">Facial symmetry, TMJ, muscle pain, and habits assessment.</p>
        </div>
        {saving && <span className="text-sm text-slate-400 italic flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div> Saving...</span>}
      </div>

      {/* 1. Facial Appearance */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
            <Info className="w-5 h-5 text-indigo-500" />
            <h3 className="font-semibold text-slate-800">Facial Appearance</h3>
        </div>
        <div className="p-6 flex flex-col gap-10">
          <div className="space-y-3">
            <FacialSymmetry 
              value={formData.facial_symmetry as string} 
              onChange={(val) => updateField('facial_symmetry', val as FacialSymmetryType)} 
            />
          </div>
          <div className="space-y-3">
            <FacialProfile 
              value={formData.facial_profile as string} 
              onChange={(val) => updateField('facial_profile', val as FacialProfileType)} 
            />
          </div>
        </div>
      </div>

      {/* 2. Muscles & TMJ Assessment */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
            <Activity className="w-5 h-5 text-teal-500" />
            <h3 className="font-semibold text-slate-800">Muscles & TMJ Assessment</h3>
        </div>
        <div className="p-6 space-y-10">
          
          <div className="space-y-4">
            <Label className="text-sm font-bold text-slate-700 mb-4 block">Muscle Pain <span className="text-slate-400 font-normal ml-1">(Click on the face chart)</span></Label>
            <FaceMuscleChart 
              selectedMuscles={formData.muscle_pain as string[] || []}
              onToggleMuscle={(id) => toggleArrayField('muscle_pain', id)}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Present Joint Pain</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: 'function', label: 'Function' },
                  { value: 'palpation', label: 'Palpation' }
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => toggleArrayField('joint_pain', opt.value)}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-semibold select-none",
                      (formData.joint_pain || []).includes(opt.value as JointPainType)
                        ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <Label className="text-sm font-bold text-slate-700">Jaw Deviation</Label>
              <div className="flex flex-col gap-3">
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: 'None', value: 'none' }, 
                    { label: 'Left', value: 'to_left' }, 
                    { label: 'Right', value: 'to_right' }
                  ].map(opt => (
                    <div
                      key={opt.value}
                      onClick={() => {
                        updateField('jaw_deviation', opt.value);
                      }}
                      className={cn(
                        "px-3 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-semibold select-none whitespace-nowrap",
                        formData.jaw_deviation === opt.value
                          ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                          : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                      )}
                    >
                      {opt.label}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-3 md:col-span-2">
              <Label className="text-sm font-bold text-slate-700">Joint Sound</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { value: 'no', label: 'No' }, 
                  { value: 'clicking', label: 'Clicking' }, 
                  { value: 'crepitus', label: 'Crepitus' }, 
                  { value: 'popping', label: 'Popping' }
                ].map(opt => (
                  <div
                    key={opt.value}
                    onClick={() => updateField('joint_sound', opt.value)}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-semibold select-none",
                      formData.joint_sound === opt.value
                        ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t border-slate-100 pt-8">
            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-700">Maximum Mouth Opening (mm)</Label>
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Input
                    type="number"
                    value={formData.mouth_opening_mm || ''}
                    onChange={(e) => {
                      const val = e.target.value ? parseInt(e.target.value) : null;
                      updateField('mouth_opening_mm', val);
                      updateField('has_limited_opening', val !== null && val < 35 && val > 0);
                    }}
                    className="w-full pr-10 border-slate-200"
                    placeholder="e.g. 40"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-semibold">mm</span>
                </div>
                {Number(formData.mouth_opening_mm) > 0 && Number(formData.mouth_opening_mm) < 35 && (
                  <span className="text-sm text-rose-500 font-semibold bg-rose-50 px-3 py-1.5 rounded-lg border border-rose-200 shrink-0">Limited opening</span>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-bold text-slate-700">Limited Border Movement?</Label>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { value: false, label: 'No' },
                  { value: true, label: 'Yes' }
                ].map(opt => (
                  <div
                    key={opt.label}
                    onClick={() => {
                      updateField('has_limited_movement', opt.value);
                      if (!opt.value) updateField('specify_movement_detail', '');
                    }}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-semibold select-none",
                      formData.has_limited_movement === opt.value
                        ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt.label}
                  </div>
                ))}
              </div>

              {formData.has_limited_movement && (
                <div className="animate-in fade-in slide-in-from-top-2 duration-300 pt-2">
                  <Input
                    value={formData.specify_movement_detail || ''}
                    onChange={e => updateField('specify_movement_detail', e.target.value)}
                    className="bg-white border-rose-200 focus-visible:ring-rose-500"
                    placeholder="Specify details..."
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Habits & Factors Affecting Tooth Wear */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800">Habits & Factors Affecting Tooth Wear</h3>
        </div>
        <div className="p-6 space-y-8">
          <div className="space-y-3">
            <Label className="text-sm font-bold text-slate-700">Parafunctional Habit <span className="text-slate-400 font-normal ml-1">(Multi-select)</span></Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { value: 'nail_biting', label: 'Nail Biting' },
                { value: 'bruxism', label: 'Bruxism' },
                { value: 'clenching', label: 'Clenching' },
                { value: 'tongue_thrust', label: 'Tongue Thrust' },
                { value: 'other', label: 'Other' }
              ].map(opt => (
                <div
                  key={opt.value}
                  onClick={() => {
                    if (opt.value === 'other') {
                      if (formData.parafunctional_habit_other !== null) {
                        updateField('parafunctional_habit_other', null);
                      } else {
                        updateField('parafunctional_habit_other', '');
                      }
                    } else {
                      toggleArrayField('parafunctional_habit', opt.value);
                    }
                  }}
                  className={cn(
                    "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-semibold select-none",
                    (opt.value === 'other' ? formData.parafunctional_habit_other !== null : (formData.parafunctional_habit || []).includes(opt.value as HabitType))
                      ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                      : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  {opt.label}
                </div>
              ))}
            </div>

            {formData.parafunctional_habit_other !== null && (
              <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                <div className="flex bg-amber-50/50 border border-amber-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-all shadow-sm">
                  <span className="flex items-center px-4 bg-amber-100/50 text-amber-800 text-sm font-semibold border-r border-amber-200 whitespace-nowrap">
                    Other
                  </span>
                  <Input
                    value={formData.parafunctional_habit_other || ''}
                    onChange={e => updateField('parafunctional_habit_other', e.target.value)}
                    className="flex-1 border-0 focus-visible:ring-0 rounded-none bg-transparent px-4"
                    placeholder="Specify..."
                    autoFocus
                  />
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3 border-t border-slate-100 pt-6">
            <Label className="text-sm font-bold text-slate-700">Factors Affecting Tooth Wear <span className="text-slate-400 font-normal ml-1">(Multi-select)</span></Label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {['Hard food', 'Acid Beverage', 'Bulimia', 'Swimming', 'GERD', 'Other'].map(opt => {
                const isChecked = formData.factors_affecting_tooth_wear?.[opt] || false;
                return (
                  <div
                    key={opt}
                    onClick={() => handleToggleToothWear(opt)}
                    className={cn(
                      "px-4 py-3 rounded-xl border-2 cursor-pointer transition-all flex items-center justify-center text-sm font-semibold select-none text-center",
                      isChecked
                        ? "border-teal-500 bg-teal-50 text-teal-900 shadow-sm"
                        : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                    )}
                  >
                    {opt}
                  </div>
                )
              })}
            </div>

            {(formData.factors_affecting_tooth_wear?.['Hard food'] || formData.factors_affecting_tooth_wear?.['Other']) && (
              <div className="pt-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                {formData.factors_affecting_tooth_wear?.['Hard food'] && (
                  <div className="flex bg-amber-50/50 border border-amber-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-all shadow-sm">
                    <span className="flex items-center px-4 bg-amber-100/50 text-amber-800 text-sm font-semibold border-r border-amber-200 whitespace-nowrap">
                      Hard food
                    </span>
                    <Input
                      value={formData.factors_affecting_tooth_wear?.['wearHardFoodDetail'] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          factors_affecting_tooth_wear: {
                            ...(prev.factors_affecting_tooth_wear || {}),
                            wearHardFoodDetail: val
                          }
                        }));
                      }}
                      className="flex-1 border-0 focus-visible:ring-0 rounded-none bg-transparent px-4"
                      placeholder="Specify type..."
                      autoFocus
                    />
                  </div>
                )}
                {formData.factors_affecting_tooth_wear?.['Other'] && (
                  <div className="flex bg-amber-50/50 border border-amber-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-amber-500 focus-within:border-transparent transition-all shadow-sm">
                    <span className="flex items-center px-4 bg-amber-100/50 text-amber-800 text-sm font-semibold border-r border-amber-200 whitespace-nowrap">
                      Other
                    </span>
                    <Input
                      value={formData.factors_affecting_tooth_wear?.['wearOtherDetail'] || ''}
                      onChange={e => {
                        const val = e.target.value;
                        setFormData(prev => ({
                          ...prev,
                          factors_affecting_tooth_wear: {
                            ...(prev.factors_affecting_tooth_wear || {}),
                            wearOtherDetail: val
                          }
                        }));
                      }}
                      className="flex-1 border-0 focus-visible:ring-0 rounded-none bg-transparent px-4"
                      placeholder="Specify factor..."
                      autoFocus
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <SectionNotes 
        sectionId="extraoral" 
        value={formData.note || ""} 
        onChange={(val) => updateField("note", val)} 
      />
    </div>
  );
}
