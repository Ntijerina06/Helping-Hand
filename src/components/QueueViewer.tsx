import React from "react";
import { Users, Clock, Flame, ArrowUp, AlertCircle, Play, Pause, ChevronRight, CheckCircle } from "lucide-react";
import { QueuePatient } from "../types";
import { getPriorityScore } from "../data/mockPatients";

interface QueueViewerProps {
  currentPatientName: string;
  currentPatientEsi: number;
  currentPatientSymptoms: string;
  queue: QueuePatient[];
  onTickMinutes: (mins: number) => void;
  onCallNextPatient: () => void;
  isSimulating: boolean;
  setIsSimulating: (val: boolean) => void;
  recentCalledName: string | null;
}

export default function QueueViewer({
  currentPatientName,
  currentPatientEsi,
  currentPatientSymptoms,
  queue,
  onTickMinutes,
  onCallNextPatient,
  isSimulating,
  setIsSimulating,
  recentCalledName,
}: QueueViewerProps) {

  // Sort queue by priority score descending
  const sortedQueue = [...queue].sort((a, b) => {
    return getPriorityScore(b) - getPriorityScore(a);
  });

  // Find user's position
  const userIndex = sortedQueue.findIndex((p) => p.isCurrentUser);
  const userPositionText = userIndex !== -1 ? `#${userIndex + 1}` : "Admitted";
  const totalPatients = sortedQueue.length;

  // Calculate estimated wait time based on physicians and ESI level
  // Let's assume there are 2 doctors on duty, and average duration of treatment varies per ESI block
  const calculateEstWaitTime = () => {
    if (userIndex === -1) return 0;
    
    // Sum estimated treatment time for everyone ahead of us, divided by 2 active doctors
    let totalTimeAhead = 0;
    for (let i = 0; i < userIndex; i++) {
      const p = sortedQueue[i];
      // Treatment duration assumption by ESI severity
      switch (p.esi) {
        case 1: totalTimeAhead += 40; break;
        case 2: totalTimeAhead += 30; break;
        case 3: totalTimeAhead += 20; break;
        case 4: totalTimeAhead += 12; break;
        case 5: totalTimeAhead += 8; break;
      }
    }
    // Round to nearest 5 minutes
    return Math.max(5, Math.round(totalTimeAhead / 2));
  };

  const estWait = calculateEstWaitTime();

  const getEsiBadgeStyles = (esi: number) => {
    switch (esi) {
      case 1: return "bg-rose-500 text-white border-rose-600";
      case 2: return "bg-orange-500 text-white border-orange-600";
      case 3: return "bg-amber-500 text-white border-amber-600";
      case 4: return "bg-teal-600 text-white border-teal-700";
      default: return "bg-slate-400 text-white border-slate-500";
    }
  };

  const getEsiLabel = (esi: number) => {
    switch (esi) {
      case 1: return "ESI-1 Critical";
      case 2: return "ESI-2 Emergent";
      case 3: return "ESI-3 Urgent";
      case 4: return "ESI-4 Semi-Urgent";
      default: return "ESI-5 Non-Urgent";
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8" id="queue-viewer-container">
      {/* LEFT & MID COLUMNS: Queue status & patient list */}
      <div className="lg:col-span-2 space-y-6">
        {/* Urgent Care Status Alert (If any was called recently) */}
        {recentCalledName && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 animate-pulse" id="alert-called">
            <CheckCircle className="text-emerald-500 flex-shrink-0" size={20} />
            <p className="text-sm text-emerald-800 font-medium">
              <strong className="font-bold">{recentCalledName}</strong> has just been admitted to the Clinic Triage Room!
            </p>
          </div>
        )}

        {/* Dashboard Top Stats Card */}
        <div className="bg-white rounded-3xl p-6 border border-teal-50 shadow-xl shadow-teal-900/5 relative overflow-hidden grid grid-cols-1 md:grid-cols-3 gap-6" id="patient-queue-summary">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 opacity-40"></div>
          
          <div className="relative z-10 flex items-center gap-4 border-r border-slate-100 last:border-0 md:pr-4">
            <div className="p-3.5 bg-teal-50 rounded-2xl text-teal-600 flex-shrink-0">
              <Users size={24} className="stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Your Position
              </span>
              <span className="text-3xl font-display font-black text-slate-800">
                {userPositionText} {userIndex !== -1 && <span className="text-slate-400 font-normal text-sm">of {totalPatients}</span>}
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 border-r border-slate-100 last:border-0 md:px-4">
            <div className="p-3.5 bg-rose-50 rounded-2xl text-rose-500 flex-shrink-0">
              <Clock size={24} className="stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Est. Wait Time
              </span>
              <span className="text-3xl font-display font-black text-slate-800">
                {estWait} <span className="text-slate-400 font-normal text-sm">mins</span>
              </span>
            </div>
          </div>

          <div className="relative z-10 flex items-center gap-4 last:border-0 md:pl-4">
            <div className="p-3.5 bg-amber-50 rounded-2xl text-amber-500 flex-shrink-0">
              <Flame size={24} className="stroke-[1.5]" />
            </div>
            <div>
              <span className="text-xs font-semibold text-slate-400 block uppercase tracking-wider">
                Anti-Starvation
              </span>
              <span className="text-3xl font-display font-black text-slate-800 flex items-center gap-1.5" id="anti-starve-indicator">
                Active
                <span className="inline-flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </span>
            </div>
          </div>
        </div>

        {/* The Live Waiting Room Queue List */}
        <div className="bg-white rounded-3xl p-6 border border-teal-50 shadow-xl shadow-teal-900/5 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-teal-50 rounded-full -mr-20 -mt-20 opacity-55"></div>
          
          <div className="relative z-10">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-4">
              <div>
                <h2 className="text-lg font-display font-bold text-slate-800">Live Waiting Room Queue</h2>
                <p className="text-xs text-slate-400">Ordered by Priority (Triage Level + Accumulated Wait Time)</p>
              </div>
              <span className="text-xs bg-slate-50 text-slate-500 px-3 py-1 rounded-full border border-slate-150 font-mono font-medium">
                {totalPatients} Clinical Records
              </span>
            </div>

          {/* List header headings */}
          <div className="grid grid-cols-12 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-50 mb-2">
            <div className="col-span-1 text-center">Pos</div>
            <div className="col-span-6 pl-2">Patient Details</div>
            <div className="col-span-3 text-center">ESI Level</div>
            <div className="col-span-2 text-right">Wait Duration</div>
          </div>

          {/* Patient rows */}
          <div className="space-y-3" id="patient-rows-list">
            {sortedQueue.map((patient, index) => {
              const pos = index + 1;
              const isUser = patient.isCurrentUser;
              const points = getPriorityScore(patient);
              const showsBoost = patient.accumulatedWaitMinutes > 40 && patient.esi > 2;

              return (
                <div
                  key={patient.id}
                  className={`grid grid-cols-12 items-center p-4 rounded-2xl border transition-all duration-300 ${
                    isUser
                      ? "bg-teal-50/70 border-teal-200 ring-2 ring-teal-100/50 shadow-sm"
                      : "bg-white hover:bg-slate-50/50 border-slate-100"
                  }`}
                  id={`queue-row-${patient.id}`}
                >
                  {/* Position number */}
                  <div className="col-span-1 text-center font-display font-extrabold text-slate-600 text-lg">
                    {pos}
                  </div>

                  {/* Patient Info */}
                  <div className="col-span-6 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-semibold text-sm text-slate-800">
                        {patient.name}
                      </span>
                      {isUser && (
                        <span className="bg-teal-600 text-teal-50 px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase font-display tracking-wider">
                          YOU
                        </span>
                      )}
                      {showsBoost && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full text-[9px] font-bold animate-pulse">
                          <ArrowUp size={10} className="stroke-[2.5]" /> Priority Boosted
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-slate-500 block truncate max-w-xs sm:max-w-md mt-0.5">
                      {patient.symptomsSummary}
                    </span>
                  </div>

                  {/* ESI Badge */}
                  <div className="col-span-3 flex justify-center">
                    <span className={`px-2.5 py-1 text-[10px] font-extrabold rounded-full border tracking-wide uppercase font-display ${getEsiBadgeStyles(patient.esi)}`}>
                      {getEsiLabel(patient.esi)}
                    </span>
                  </div>

                  {/* Wait Time */}
                  <div className="col-span-2 text-right">
                    <span className="font-mono text-xs font-semibold text-slate-700 block">
                      {patient.accumulatedWaitMinutes}m
                    </span>
                    <span className="text-[10px] text-slate-400 block font-mono">
                      score: {points}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

      {/* RIGHT COLUMN: Urgent Care Simulation Controls */}
      <div className="space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-teal-50 shadow-xl shadow-teal-900/5 relative overflow-hidden" id="simulation-dashboard">
          <div className="absolute right-4 top-4 text-rose-500 opacity-5">
            <Clock size={160} />
          </div>
          <h2 className="text-lg font-display font-bold text-slate-800 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 animate-pulse"></span>
            Triage Simulator
          </h2>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            As time passes, wait-times tick up. Watch the ESI Severity priority balance against our anti-starvation algorithm interactively.
          </p>

          <div className="space-y-4 mt-6">
            {/* Auto Sim Status */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
              <div>
                <span className="font-semibold text-xs text-slate-700 block">Automated Timeline</span>
                <span className="text-[10px] text-slate-400 block">
                  {isSimulating ? "Time: 1 min per 5 sec of real-time" : "Simulation is paused"}
                </span>
              </div>
              <button
                onClick={() => setIsSimulating(!isSimulating)}
                className={`p-2 rounded-xl border transition cursor-pointer ${
                  isSimulating
                    ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                    : "bg-teal-50 border-teal-200 text-teal-600 hover:bg-teal-100"
                }`}
                id="toggle-sim-btn"
              >
                {isSimulating ? <Pause size={18} /> : <Play size={18} />}
              </button>
            </div>

            {/* Direct Resolution Action */}
            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                Resolve Queue
              </span>
              <button
                onClick={onCallNextPatient}
                className="w-full bg-slate-800 hover:bg-slate-900 font-display font-bold text-white text-xs py-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
                id="call-doctor-btn"
              >
                <span>Call Next to Doctor Room</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>

        {/* Explain the Triage math card */}
        <div className="bg-gradient-to-br from-teal-50 to-emerald-50 rounded-3xl p-6 border border-teal-100/50" id="algorithm-explainer">
          <h3 className="text-sm font-display font-bold text-teal-800 flex items-center gap-1.5">
            <AlertCircle size={16} /> How ESI Priorities Work
          </h3>
          <div className="text-xs text-teal-950 mt-3 space-y-2.5 leading-relaxed">
            <p>
              1. <strong>Base Score</strong>: Patients assigned severity ESI levels receive priority blocks. Level 1 starts with 1000 pts (critical care), sliding down to level 5 with 40 pts.
            </p>
            <p>
              2. <strong>Anti-Starvation</strong>: Each minute waiting adds <strong>+2 priority points</strong>.
            </p>
            <div className="bg-white/60 p-2.5 rounded-xl border border-teal-100/50 font-mono text-[10px] text-teal-900 mt-2">
              Formula:
              <br />
              <span className="font-bold">Score = BaseESI + (WaitMins * 2)</span>
            </div>
            <p className="text-[10px] text-teal-700 italic">
              *With the automated timeline active, Chloe Baker (Level 5) will gradually climb above other patients as her wait-time accumulates!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
