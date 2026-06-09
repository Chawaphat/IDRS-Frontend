import React, { useState, useEffect, useCallback } from "react";
import { Check, FileText, CalendarDays, MessageSquareText, HeartPulse, Activity, Trash2, Stethoscope, Clock, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ToggleButtonGroup } from "@/components/ui/ToggleButton";
import { RankedExpectationSelector } from "@/components/RankedExpectationSelector";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { medicalHistoryService } from "@/services/medicalHistoryService";
import type { MedicalHistoryUpdate, AllergyStatusType, PatientExpectationsType, Medication } from "@/services/types/medicalHistory";
import { useToastStore } from "@/store/toastStore";

interface MedicalHistoryFormProps {
  chartId: string;
  patient: any;
  onEditPatient?: () => void;
}

function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function MedicalHistoryForm({ chartId, patient, onEditPatient }: MedicalHistoryFormProps) {
  const { show: showToast } = useToastStore();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const [visitDate, setVisitDate] = useState<Date | undefined>(new Date());
  
  const [formData, setFormData] = useState<MedicalHistoryUpdate>({
    chief_complaint: "",
    present_illness: "",
    medical_history: "",
    regular_doctor_visits: false,
    regular_doctor_months: null,
    clinic_name: "",
    current_medication: [],
    allergy_status: "no",
    allergy_detail: "",
    dental_history: "",
    patient_expectation: [],
    patient_expectation_other: "",
    patient_self_evaluation: "",
    patient_expected_outcome: "",
    edentulous_time: "",
    previous_denture_count: "",
    present_denture_age: "",
    denture_complaint: ""
  });
  
  const [hasMedications, setHasMedications] = useState<boolean | null>(null);
  const [medFormInput, setMedFormInput] = useState({ name: "", dose: "", frequency: "", dosePerTime: "", timeOfDay: "" });

  const debouncedFormData = useDebounce(formData, 1000);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const data = await medicalHistoryService.getByChart(chartId);
        if (data) {
          setFormData({
            chief_complaint: data.chief_complaint || "",
            present_illness: data.present_illness || "",
            medical_history: data.medical_history || "",
            regular_doctor_visits: data.regular_doctor_visits || false,
            regular_doctor_months: data.regular_doctor_months || null,
            clinic_name: data.clinic_name || "",
            current_medication: data.current_medication || [],
            allergy_status: data.allergy_status || "no",
            allergy_detail: data.allergy_detail || "",
            dental_history: data.dental_history || "",
            patient_expectation: data.patient_expectation || [],
            patient_expectation_other: data.patient_expectation_other || "",
            patient_self_evaluation: data.patient_self_evaluation || "",
            patient_expected_outcome: data.patient_expected_outcome || "",
            edentulous_time: data.edentulous_time || "",
            previous_denture_count: data.previous_denture_count || "",
            present_denture_age: data.present_denture_age || "",
            denture_complaint: data.denture_complaint || ""
          });
          if (data.current_medication && data.current_medication.length > 0) {
            setHasMedications(true);
          } else if (data.current_medication && data.current_medication.length === 0) {
             setHasMedications(false);
          }
        }
      } catch (err: any) {
        if (err?.response?.status !== 404) {
          showToast("Failed to load medical history.", "error");
        }
      } finally {
        setLoading(false);
        setInitialDataLoaded(true);
      }
    };
    fetchData();
  }, [chartId, showToast]);

  useEffect(() => {
    if (!initialDataLoaded) return;
    const saveToBackend = async () => {
      try {
        setSaving(true);
        try {
          await medicalHistoryService.update(chartId, debouncedFormData);
        } catch (updateErr: any) {
          if (updateErr?.response?.status === 404) {
            await medicalHistoryService.create(chartId, debouncedFormData as any);
          } else {
            throw updateErr;
          }
        }
      } catch (err) {
        console.error("Auto-save failed", err);
      } finally {
        setSaving(false);
      }
    };
    saveToBackend();
  }, [debouncedFormData, chartId, initialDataLoaded]);

  const updateField = (field: keyof MedicalHistoryUpdate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
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
      <div className="border-b border-slate-200 pb-4 flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <FileText className="w-8 h-8 text-teal-600" />
              Patient History
          </h2>
          <p className="text-slate-500 mt-1">Please fill in the patient's medical and dental background.</p>
        </div>
        {saving && <span className="text-sm text-slate-400 italic flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-teal-500 animate-pulse"></div> Saving...</span>}
      </div>

      <div className="relative bg-linear-to-br from-white via-teal-50/30 to-cyan-50/30 rounded-2xl border border-teal-100 shadow-sm p-5 md:p-6">
          {onEditPatient && (
              <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  title="Edit patient profile"
                  aria-label="Edit patient profile"
                  onClick={onEditPatient}
                  className="absolute right-3 top-3 h-8 w-8 rounded-full text-slate-500 hover:bg-white hover:text-teal-700 hover:shadow-sm"
              >
                  <Pencil className="h-4 w-4" />
              </Button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pr-10 md:pr-12">
              <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Patient Name</p>
                  <p className="text-sm font-bold text-slate-800">{patient?.name || "N/A"}</p>
              </div>
              <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Sex / Age</p>
                  <p className="text-sm font-bold text-slate-800">{patient?.gender || patient?.sex || "N/A"} / {patient?.age || "N/A"}</p>
              </div>
              <div className="space-y-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">HN</p>
                  <p className="text-sm font-bold text-slate-800">{patient?.hn_number || patient?.hn || "N/A"}</p>
              </div>
              <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wide text-slate-500">Visit Date</Label>
                  <Popover>
                      <PopoverTrigger asChild>
                          <Button
                              type="button"
                              variant="outline"
                              className={cn(
                                  "h-10 w-full justify-between rounded-xl border-slate-200 bg-white text-left font-semibold text-slate-700 hover:bg-slate-50 aria-expanded:bg-white aria-expanded:text-slate-700",
                                  !visitDate && "text-slate-400"
                              )}
                          >
                              <span>{visitDate ? format(visitDate, "PPP") : "Select date"}</span>
                              <CalendarDays className="h-4 w-4 text-teal-600" />
                          </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="end">
                          <Calendar
                              mode="single"
                              selected={visitDate}
                              onSelect={setVisitDate}
                          />
                      </PopoverContent>
                  </Popover>
              </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <MessageSquareText className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800">Primary Concerns</h3>
          </div>
          <div className="p-6 space-y-6">
              <div className="space-y-3">
                  <Label htmlFor="chief_complaint" className="text-sm font-bold text-slate-700">Chief Complaint</Label>
                  <Textarea
                      id="chief_complaint"
                      value={formData.chief_complaint || ""}
                      onChange={e => updateField("chief_complaint", e.target.value)}
                      className="h-20 resize-none focus-visible:ring-teal-500"
                      placeholder="Patient's primary reason for visiting..."
                  />
              </div>
              <div className="space-y-3">
                  <Label htmlFor="present_illness" className="text-sm font-bold text-slate-700">Present Illness</Label>
                  <Textarea
                      id="present_illness"
                      value={formData.present_illness || ""}
                      onChange={e => updateField("present_illness", e.target.value)}
                      className="h-24 resize-none focus-visible:ring-teal-500"
                      placeholder="History and details of the present illness..."
                  />
              </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <HeartPulse className="w-5 h-5 text-teal-500" />
              <h3 className="font-semibold text-slate-800">Medical Information</h3>
          </div>
          <div className="p-6 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 border-b border-slate-100 pb-8">
                  <div className="space-y-3">
                      <Label htmlFor="medical_history" className="text-sm font-bold text-slate-700">Medical History</Label>
                      <Textarea
                          id="medical_history"
                          value={formData.medical_history || ""}
                          onChange={e => updateField("medical_history", e.target.value)}
                          className="h-20 resize-none focus-visible:ring-teal-500"
                          placeholder="Systemic diseases, e.g., Diabetes, Hypertension"
                      />
                  </div>

                  <div className="space-y-4 flex flex-col justify-center">
                      <Label className="text-sm font-bold text-slate-700">Regular Doctor Visits?</Label>
                      <ToggleButtonGroup
                          value={formData.regular_doctor_visits ? "yes" : "no"}
                          onChange={(v) => {
                              updateField("regular_doctor_visits", v === "yes");
                              if (v === "no") {
                                  updateField("regular_doctor_months", null);
                                  updateField("clinic_name", "");
                              }
                          }}
                          options={[
                              { value: "yes", label: "Yes" },
                              { value: "no", label: "No" }
                          ]}
                          name="regular_doctor_visits"
                      />
                      {formData.regular_doctor_visits && (
                          <div className="space-y-4 animate-in fade-in slide-in-from-left-2 duration-300 border-t border-slate-100 pt-4 mt-2">
                              <div className="flex items-center gap-2">
                                  <Input
                                      type="number"
                                      value={formData.regular_doctor_months || ""}
                                      onChange={e => updateField("regular_doctor_months", parseInt(e.target.value) || null)}
                                      className="w-24 h-9"
                                      placeholder="0"
                                      autoFocus
                                  />
                                  <span className="text-sm text-slate-500 font-medium">Months</span>
                              </div>
                              <Input
                                  type="text"
                                  value={formData.clinic_name || ""}
                                  onChange={e => updateField("clinic_name", e.target.value)}
                                  className="focus-visible:ring-blue-500"
                                  placeholder="e.g., Maharaj Hospital"
                              />
                          </div>
                      )}
                  </div>
              </div>

              <div className="space-y-5">
                  <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold text-slate-700">Current Medications</Label>
                      {hasMedications !== null && (
                          <button
                              type="button"
                              onClick={() => {
                                  setHasMedications(null);
                                  updateField("current_medication", []);
                              }}
                              className="text-xs text-teal-600 hover:text-teal-700 hover:underline font-semibold"
                          >
                              Reset Status
                          </button>
                      )}
                  </div>

                  {hasMedications === null ? (
                      <div className="rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center flex flex-col items-center justify-center animate-in fade-in duration-300">
                          <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                              <HeartPulse className="w-6 h-6 animate-pulse text-slate-500" />
                          </div>
                          <p className="text-sm font-bold text-slate-700">Is the patient currently taking any medications?</p>
                          <div className="flex gap-3 mt-5 w-full max-w-sm">
                              <button
                                  type="button"
                                  onClick={() => {
                                      setHasMedications(false);
                                      updateField("current_medication", []);
                                  }}
                                  className="flex-1 min-h-11 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-sm shadow-sm transition-all"
                              >
                                  No Medications
                              </button>
                              <button
                                  type="button"
                                  onClick={() => {
                                      setHasMedications(true);
                                  }}
                                  className="flex-1 min-h-11 rounded-xl bg-teal-500 hover:bg-teal-600 text-white font-bold text-sm shadow-md transition-all"
                              >
                                  Yes, Has Medications
                              </button>
                          </div>
                      </div>
                  ) : hasMedications === false ? (
                      <div className="rounded-2xl border border-teal-100 bg-teal-50/30 p-5 flex items-center gap-3.5 animate-in fade-in duration-300">
                          <div className="h-10 w-10 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                              <Activity className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                              <p className="text-sm font-bold text-teal-800">Confirmed: No Current Medications</p>
                          </div>
                          <button
                              type="button"
                              onClick={() => setHasMedications(true)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-teal-200 bg-white hover:bg-slate-50 text-teal-700 shadow-sm transition-colors"
                          >
                              Add Medication
                          </button>
                      </div>
                  ) : (
                      <div className="space-y-5 p-5 border border-slate-100 bg-slate-50/30 rounded-2xl animate-in fade-in duration-300">
                          <div className="space-y-2">
                              <Label htmlFor="medicineName" className="text-xs font-bold text-slate-700">Medicine Name</Label>
                              <Input
                                  id="medicineName"
                                  type="text"
                                  className="focus-visible:ring-teal-500 bg-white"
                                  placeholder="e.g., Paracetamol"
                                  value={medFormInput.name}
                                  onChange={(e) => setMedFormInput(prev => ({ ...prev, name: e.target.value }))}
                              />
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                              <div className="space-y-2">
                                  <Label htmlFor="dose" className="text-xs font-bold text-slate-700">Dose</Label>
                                  <div className="flex items-center gap-2">
                                      <Input id="dose" type="number" className="focus-visible:ring-teal-500 bg-white flex-1" placeholder="0" value={medFormInput.dose} onChange={(e) => setMedFormInput(prev => ({ ...prev, dose: e.target.value }))} />
                                      <span className="text-xs text-slate-500 min-w-fit">mg</span>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="frequency" className="text-xs font-bold text-slate-700">Frequency</Label>
                                  <div className="flex items-center gap-2">
                                      <Input id="frequency" type="number" className="focus-visible:ring-teal-500 bg-white flex-1" placeholder="0" value={medFormInput.frequency} onChange={(e) => setMedFormInput(prev => ({ ...prev, frequency: e.target.value }))} />
                                      <span className="text-xs text-slate-500 min-w-fit">x/day</span>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="dosePerTime" className="text-xs font-bold text-slate-700">Per Time</Label>
                                  <div className="flex items-center gap-2">
                                      <Input id="dosePerTime" type="number" className="focus-visible:ring-teal-500 bg-white flex-1" placeholder="0" value={medFormInput.dosePerTime} onChange={(e) => setMedFormInput(prev => ({ ...prev, dosePerTime: e.target.value }))} />
                                      <span className="text-xs text-slate-500 min-w-fit">mg</span>
                                  </div>
                              </div>
                              <div className="space-y-2">
                                  <Label htmlFor="timeOfDay" className="text-xs font-bold text-slate-700">Time of Day</Label>
                                  <Input id="timeOfDay" type="time" className="focus-visible:ring-teal-500 bg-white cursor-text" value={medFormInput.timeOfDay} onChange={(e) => setMedFormInput(prev => ({ ...prev, timeOfDay: e.target.value }))} />
                              </div>
                          </div>

                          <Button
                              type="button"
                              onClick={() => {
                                  if (medFormInput.name.trim()) {
                                      const newMed: Medication = {
                                          id: Date.now().toString(),
                                          name: medFormInput.name.trim(),
                                          dose: medFormInput.dose,
                                          frequency: medFormInput.frequency,
                                          dosePerTime: medFormInput.dosePerTime,
                                          timeOfDay: medFormInput.timeOfDay
                                      };
                                      updateField("current_medication", [...(formData.current_medication || []), newMed]);
                                      setMedFormInput({ name: "", dose: "", frequency: "", dosePerTime: "", timeOfDay: "" });
                                  }
                              }}
                              className="bg-teal-500 hover:bg-teal-600 text-white font-bold"
                          >
                              + Add Medication
                          </Button>

                          {(formData.current_medication || []).length > 0 && (
                              <div className="mt-4 border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white">
                                  <table className="w-full">
                                      <thead className="bg-slate-50 border-b border-slate-200">
                                          <tr>
                                              <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">Name</th>
                                              <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">Dose</th>
                                              <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">Freq</th>
                                              <th className="px-4 py-2.5 text-left text-xs font-bold text-slate-600">Schedule</th>
                                              <th className="px-4 py-2.5 text-center text-xs font-bold text-slate-600">Action</th>
                                          </tr>
                                      </thead>
                                      <tbody>
                                          {(formData.current_medication || []).map((med) => (
                                              <tr key={med.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                                                  <td className="px-4 py-2.5 text-sm font-semibold text-slate-700">{med.name}</td>
                                                  <td className="px-4 py-2.5 text-sm text-slate-600">{med.dose}</td>
                                                  <td className="px-4 py-2.5 text-sm text-slate-600">{med.frequency}</td>
                                                  <td className="px-4 py-2.5 text-sm text-slate-600">{med.timeOfDay}</td>
                                                  <td className="px-4 py-2.5 text-center">
                                                      <button
                                                          type="button"
                                                          onClick={() => {
                                                              updateField("current_medication", (formData.current_medication || []).filter(m => m.id !== med.id));
                                                          }}
                                                          className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 p-1.5 rounded-lg transition-colors"
                                                      >
                                                          <Trash2 className="w-4 h-4" />
                                                      </button>
                                                  </td>
                                              </tr>
                                          ))}
                                      </tbody>
                                  </table>
                              </div>
                          )}
                      </div>
                  )}
              </div>

              <div className="bg-teal-50/50 p-5 rounded-xl border border-teal-100 space-y-4">
                  <Label className="text-sm font-bold text-slate-800">Known Allergies</Label>
                  <ToggleButtonGroup
                      value={formData.allergy_status || "no"}
                      onChange={(v) => {
                          updateField("allergy_status", v as AllergyStatusType);
                          if (v !== "yes") updateField("allergy_detail", "");
                      }}
                      options={[
                          { value: "no", label: "Deny" },
                          { value: "dont_know", label: "Don't know" },
                          { value: "yes", label: "Yes, has allergies" }
                      ]}
                      name="allergy_status"
                  />

                  {formData.allergy_status === "yes" && (
                      <div className="pt-2 animate-in fade-in slide-in-from-top-2 duration-300">
                          <Input
                              id="allergy_detail"
                              value={formData.allergy_detail || ""}
                              onChange={e => updateField("allergy_detail", e.target.value)}
                              className="border-rose-200 focus-visible:ring-rose-500 bg-white"
                              placeholder="Please specify allergic items (e.g., Penicillin, Latex, Seafood)..."
                              autoFocus
                          />
                      </div>
                  )}
              </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-teal-600" />
              <h3 className="font-semibold text-slate-800">Dental Background & Expectations</h3>
          </div>
          <div className="p-6 space-y-8">
              <div className="space-y-3">
                  <Label htmlFor="dental_history" className="text-sm font-bold text-slate-700">Dental History</Label>
                  <Textarea
                      id="dental_history"
                      value={formData.dental_history || ""}
                      onChange={e => updateField("dental_history", e.target.value)}
                      className="h-20 resize-none focus-visible:ring-teal-500"
                      placeholder="Regular checkup, Relevant past treatments, Past experiences..."
                  />
              </div>

              <div className="space-y-3">
                  <Label htmlFor="patient_self_evaluation" className="text-sm font-bold text-slate-700">Patient Self Evaluation</Label>
                  <Textarea
                      id="patient_self_evaluation"
                      value={formData.patient_self_evaluation || ""}
                      onChange={e => updateField("patient_self_evaluation", e.target.value)}
                      className="h-24 resize-none focus-visible:ring-teal-500"
                      placeholder="Patient's view on their current oral condition..."
                  />
              </div>

              <div className="space-y-3 pt-2">
                  <Label className="text-sm font-bold text-slate-700">Patient Expectations (Ranked)</Label>
                  <p className="text-xs text-slate-500 mb-3">Tap the options below in the order of patient's priorities (1 = Most important).</p>
                  <RankedExpectationSelector
                      selectedExpectations={formData.patient_expectation || []}
                      onSelectionsChange={(newExpectations: string[]) => updateField("patient_expectation", newExpectations as PatientExpectationsType[])}
                      otherValue={formData.patient_expectation_other || ""}
                      onOtherChange={(val: string) => updateField("patient_expectation_other", val)}
                  />
              </div>

              <div className="space-y-3 pt-2">
                  <Label htmlFor="patient_expected_outcome" className="text-sm font-bold text-slate-700">Expected Outcome / Notes</Label>
                  <Textarea
                      id="patient_expected_outcome"
                      value={formData.patient_expected_outcome || ""}
                      onChange={e => updateField("patient_expected_outcome", e.target.value)}
                      className="h-24 resize-none focus-visible:ring-teal-500"
                      placeholder="What does the patient hope to achieve from the treatment?"
                  />
              </div>
          </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
          <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-slate-800">Edentulous History</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-3">
                  <Label htmlFor="edentulous_time" className="text-sm font-bold text-slate-700">Length of time edentulous</Label>
                  <Input
                      id="edentulous_time"
                      value={formData.edentulous_time || ""}
                      onChange={e => updateField("edentulous_time", e.target.value)}
                      className="focus-visible:ring-teal-500"
                      placeholder="e.g., 5 months, 2 years"
                  />
              </div>
              <div className="space-y-3">
                  <Label htmlFor="previous_denture_count" className="text-sm font-bold text-slate-700">Number of previous denture</Label>
                  <Input
                      id="previous_denture_count"
                      value={formData.previous_denture_count || ""}
                      onChange={e => updateField("previous_denture_count", e.target.value)}
                      className="focus-visible:ring-teal-500"
                      placeholder="e.g., 1, None"
                  />
              </div>
              <div className="space-y-3">
                  <Label htmlFor="present_denture_age" className="text-sm font-bold text-slate-700">Age of present denture</Label>
                  <Input
                      id="present_denture_age"
                      value={formData.present_denture_age || ""}
                      onChange={e => updateField("present_denture_age", e.target.value)}
                      className="focus-visible:ring-teal-500"
                      placeholder="e.g., 3 years, N/A"
                  />
              </div>
              <div className="space-y-3">
                  <Label htmlFor="denture_complaint" className="text-sm font-bold text-slate-700">Nature of complaint</Label>
                  <Input
                      id="denture_complaint"
                      value={formData.denture_complaint || ""}
                      onChange={e => updateField("denture_complaint", e.target.value)}
                      className="focus-visible:ring-teal-500"
                      placeholder="e.g., Loose, hurts when chewing"
                  />
              </div>
          </div>
      </div>
    </div>
  );
}
