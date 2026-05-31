import React, { useState, useRef } from "react";
import { User, Heart, Shield, Sparkles, Upload, Loader2, ArrowRight } from "lucide-react";
import { PatientInfo, TriageAssessment } from "../types";

interface CheckInFormProps {
  onSubmit: (info: PatientInfo, assessment: TriageAssessment) => void;
}

export default function CheckInForm({ onSubmit }: CheckInFormProps) {
  // Form fields
  const [name, setName] = useState("");
  const [age, setAge] = useState<number | "">("");
  const [symptoms, setSymptoms] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [contactName, setContactName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [contactPhone, setContactPhone] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhraseIndex, setLoadingPhraseIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Triage state
  const [assessment, setAssessment] = useState<TriageAssessment | null>(null);
  const [patientInfoToSubmit, setPatientInfoToSubmit] = useState<PatientInfo | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadingPhrases = [
    "AI Clinical Triage evaluating symptoms...",
    "Comparing against Emergency Severity guidelines...",
    "Safeguarding priority and establishing care index...",
    "Reassuring medical team of check-in parameters..."
  ];

  // Rotate loading phrases
  React.useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isLoading) {
      interval = setInterval(() => {
        setLoadingPhraseIndex((prev) => (prev + 1) % loadingPhrases.length);
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [isLoading]);

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setPhotoUrl(url);
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !symptoms || !contactName || !relationship || !contactPhone) {
      setErrorMsg("Please fill out all required fields.");
      return;
    }
    
    setIsLoading(true);
    setErrorMsg(null);
    setLoadingPhraseIndex(0);

    const info: PatientInfo = {
      name,
      age: Number(age),
      symptoms,
      photoUrl,
      contact: {
        name: contactName,
        relationship,
        phone: contactPhone,
      },
    };

    try {
      const response = await fetch("/api/assess-symptoms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, age: Number(age), symptoms }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || "Triage service returned an error.");
      }

      const rawAssessment = await response.json();
      setAssessment(rawAssessment);
      setPatientInfoToSubmit(info);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to make a server call to the medical triage API. Please make sure the server is active.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleProceed = () => {
    if (patientInfoToSubmit && assessment) {
      onSubmit(patientInfoToSubmit, assessment);
    }
  };

  const getEsiStyles = (level: number) => {
    switch (level) {
      case 1:
        return {
          bg: "bg-rose-50 border-rose-200 text-rose-700",
          badge: "bg-rose-500 text-white",
          text: "Critical Care Required"
        };
      case 2:
        return {
          bg: "bg-orange-50 border-orange-200 text-orange-700",
          badge: "bg-orange-500 text-white",
          text: "Emergent Care Triage"
        };
      case 3:
        return {
          bg: "bg-amber-50 border-amber-200 text-amber-700",
          badge: "bg-amber-500 text-white",
          text: "Urgent Attention"
        };
      case 4:
        return {
          bg: "bg-teal-50 border-teal-200 text-teal-700",
          badge: "bg-teal-600 text-white",
          text: "Semi-Urgent Evaluation"
        };
      default:
        return {
          bg: "bg-slate-50 border-slate-200 text-slate-700",
          badge: "bg-slate-500 text-white",
          text: "Standard Care Route"
        };
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto bg-white rounded-3xl border border-teal-50 shadow-xl shadow-teal-900/5 relative overflow-hidden" id="check-in-pane">
      {/* Step Header */}
      <div className="bg-teal-500 p-8 text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-teal-400 rounded-full -mr-16 -mt-16 opacity-30"></div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full -mr-12 -mt-12 opacity-10"></div>
        <div className="relative z-10">
          <span className="bg-teal-600/50 text-teal-50 px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider font-display">
            Step 1 of 3
          </span>
          <h1 className="text-3xl font-display font-bold mt-3">Clinical Intake & Triage</h1>
          <p className="text-teal-100 mt-2 text-sm max-w-lg leading-relaxed">
            Please state your current condition in your own words. Our smart AI system maps your symptoms immediately to the clinical Emergency Severity Index.
          </p>
        </div>
      </div>

      <div className="p-8">
        {!assessment ? (
          <form onSubmit={handleSubmit} className="space-y-6">
            {errorMsg && (
              <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 text-sm rounded-2xl flex items-start gap-2 animate-fade-in" id="form-error">
                <span className="font-bold flex-shrink-0">⚠️ Error:</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* General Info */}
            <div className="space-y-4">
              <h2 className="text-md font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <User size={18} className="text-teal-500" /> Patient Demographics
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    id="patient-name-field"
                    placeholder="e.g., Jane Watson"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Age</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="115"
                    id="patient-age-field"
                    placeholder="e.g., 28"
                    value={age}
                    onChange={(e) => setAge(e.target.value === "" ? "" : Number(e.target.value))}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 text-sm transition"
                  />
                </div>
              </div>
            </div>

            {/* Symptoms textbox + photo upload */}
            <div className="space-y-4">
              <h2 className="text-md font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Sparkles size={18} className="text-teal-500" /> Medical Concerns
              </h2>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">
                  Describe symptoms, pain levels, or how the injury occurred
                </label>
                <textarea
                  required
                  rows={4}
                  id="symptoms-textarea"
                  placeholder="Tell us what hurts... E.g., 'Sprained ankle with severe swelling after tripping on a curb, can't bear any weight.' or 'Sudden radiating pressure in chest with shortness of breath.'"
                  value={symptoms}
                  onChange={(e) => setSymptoms(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 text-sm placeholder-slate-450 transition"
                ></textarea>
                <span className="text-xs text-slate-400 mt-1 block">
                  Be as expressive and detailed as possible. Better detail helps our clinic triage you more accurately.
                </span>
              </div>

              {/* Photo upload */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-2">
                  Optional Picture / Injury Photo
                </label>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <div
                    onClick={triggerFileSelect}
                    className="flex-1 w-full border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center cursor-pointer hover:border-teal-500 hover:bg-teal-50/20 transition-all flex flex-col items-center justify-center gap-1"
                  >
                    <Upload size={24} className="text-slate-400" />
                    <span className="text-xs font-semibold text-teal-600">Click to import / select file</span>
                    <span className="text-[10px] text-slate-400">PNG, JPG up to 5MB</span>
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      accept="image/*"
                      className="hidden"
                    />
                  </div>
                  {photoUrl ? (
                    <div className="relative w-28 h-28 rounded-2xl overflow-hidden border border-slate-200 flex-shrink-0 group">
                      <img
                        src={photoUrl}
                        alt="Triage preview"
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <button
                        type="button"
                        onClick={() => setPhotoUrl(null)}
                        className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-xs text-white font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div className="w-28 h-28 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center flex-shrink-0 text-[10px] text-slate-400 text-center p-2">
                      No photo uploaded
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Contacts */}
            <div className="space-y-4">
              <h2 className="text-md font-semibold text-slate-800 flex items-center gap-2 border-b border-slate-100 pb-2">
                <Heart size={18} className="text-teal-500" /> Emergency Contact
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Arthur Watson"
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Relationship</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Spouse, Parent"
                    value={relationship}
                    onChange={(e) => setRelationship(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 text-sm transition"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g., 555-019-2834"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-hidden focus:border-teal-500 focus:ring-2 focus:ring-teal-100 text-slate-800 text-sm transition"
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-teal-500 hover:bg-teal-600 font-display font-semibold text-white py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed text-base"
              id="submit-checkin-btn"
            >
              {isLoading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  <span>{loadingPhrases[loadingPhraseIndex]}</span>
                </>
              ) : (
                <>
                  <Shield size={18} />
                  <span>Secure Submit & Clinical Triage</span>
                </>
              )}
            </button>
          </form>
        ) : (
          /* CONFIRMATION & TRIAGE RESULT CARD */
          <div className="space-y-6 animate-fade-in" id="triage-result">
            <div className="text-center pb-2">
              <div className="inline-flex p-3 bg-emerald-50 rounded-full text-emerald-500 mb-3">
                <Shield size={32} className="stroke-[1.5]" />
              </div>
              <h2 className="text-2xl font-display font-bold text-slate-800">Check-In Successful</h2>
              <p className="text-xs text-slate-400 mt-1">
                Your medical dashboard is secured under Patient ID: HH-{(Math.random() * 10000).toFixed(0)}
              </p>
            </div>

            {/* Clinical Assessment Display */}
            <div className={`p-6 rounded-2xl border ${getEsiStyles(assessment.esi).bg}`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 border-b border-slate-200/55 pb-4">
                <div>
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    AI Clinical Score
                  </span>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-sm font-bold rounded-full ${getEsiStyles(assessment.esi).badge}`}>
                      ESI Level {assessment.esi}
                    </span>
                    <span className="text-lg font-display font-bold text-slate-800">
                      {assessment.esiName}
                    </span>
                  </div>
                </div>
                <div className="text-left sm:text-right">
                  <span className="text-xs uppercase tracking-wider font-semibold text-slate-400 block mb-1">
                    Care Velocity
                  </span>
                  <span className="text-sm font-semibold capitalize bg-white/70 px-3 py-1 rounded-full shadow-2xs">
                    {getEsiStyles(assessment.esi).text}
                  </span>
                </div>
              </div>

              {/* Patient details confirmation */}
              <div className="text-sm space-y-3">
                <div>
                  <span className="font-semibold block text-xs underline decoration-teal-500 text-slate-500">
                    Clinical Explanation:
                  </span>
                  <p className="text-slate-700 italic mt-1 leading-relaxed">
                    "{assessment.explanation}"
                  </p>
                </div>
                <div>
                  <span className="font-semibold block text-xs underline decoration-teal-500 text-slate-400">
                    What To Expect Next:
                  </span>
                  <p className="text-slate-700 mt-1 leading-relaxed">
                    {assessment.nextSteps}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-xs text-slate-500 flex items-start gap-2">
              <span className="text-amber-500 flex-shrink-0 text-base">ℹ️</span>
              <p>
                Helping Hand runs constant queue algorithms factoring in triage ratings, room staffing, and emergency escalations. Your contact, <strong className="text-slate-700">{patientInfoToSubmit?.contact.name}</strong>, will receive automated SMS updates immediately.
              </p>
            </div>

            <button
              onClick={handleProceed}
              className="w-full bg-teal-500 hover:bg-teal-600 font-display font-bold text-white py-4 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer text-base"
              id="proceed-queue-btn"
            >
              <span>Verify Queue & Enter Wait Room</span>
              <ArrowRight size={18} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
