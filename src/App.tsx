import React, { useState, useEffect } from "react";
import { HeartHandshake, ClipboardCheck, Users, MessageSquareCode, ShieldAlert, BadgeCheck } from "lucide-react";
import { PatientInfo, TriageAssessment, QueuePatient, Message } from "./types";
import { INITIAL_MOCK_PATIENTS, getPriorityScore } from "./data/mockPatients";
import CheckInForm from "./components/CheckInForm";
import QueueViewer from "./components/QueueViewer";
import UpdatesChat from "./components/UpdatesChat";

export default function App() {
  const [currentPage, setCurrentPage] = useState<'checkin' | 'queue' | 'updates'>('checkin');
  
  // Registration and Assessment State
  const [patientInfo, setPatientInfo] = useState<PatientInfo | null>(null);
  const [assessment, setAssessment] = useState<TriageAssessment | null>(null);

  // Queue state (initialized with 6 mock patients)
  const [queue, setQueue] = useState<QueuePatient[]>(INITIAL_MOCK_PATIENTS);
  
  // Messaging state
  const [messages, setMessages] = useState<Message[]>([]);
  
  // Simulation States
  const [isSimulating, setIsSimulating] = useState(false);
  const [recentCalledName, setRecentCalledName] = useState<string | null>(null);

  // Automated Timeline Simulation Ticks
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isSimulating) {
      // Every 5 seconds represents 1 minute of wait-room duration
      timer = setInterval(() => {
        handleTickMinutes(1);
      }, 5000);
    }
    return () => clearInterval(timer);
  }, [isSimulating]);

  // Handle Tick Minutes
  const handleTickMinutes = (mins: number) => {
    setQueue((prevQueue) => {
      return prevQueue.map((p) => ({
        ...p,
        accumulatedWaitMinutes: p.accumulatedWaitMinutes + mins
      }));
    });
  };

  // Call next highest priority patient to see doctor
  const handleCallNextPatient = () => {
    // Sort queue by priority score descending
    const sorted = [...queue].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
    if (sorted.length === 0) return;
    
    const calledPatient = sorted[0];
    
    // Remove from queue
    setQueue((prev) => prev.filter((p) => p.id !== calledPatient.id));
    setRecentCalledName(calledPatient.name);

    // Create a real-time notification block inside page 3
    if (patientInfo) {
      const formattedTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      const nextInLine = [...queue]
        .filter(p => p.id !== calledPatient.id)
        .sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
      
      const userIdx = nextInLine.findIndex(p => p.isCurrentUser);
      const userPos = userIdx !== -1 ? userIdx + 1 : 1;

      let msgText = "";
      if (calledPatient.isCurrentUser) {
        msgText = `★ Helping Hand CLINIC ALERT:\n${patientInfo.name} has been called for doctor's evaluation. Please proceed directly to Treatment Room A immediately. Care clinicians are expecting you!`;
      } else {
        msgText = `★ Helping Hand Update:\nPatient ${calledPatient.name} has been admitted. ${patientInfo.name} has moved up in line and is currently at position #${userPos} in the wait room.`;
      }

      const alertMsg: Message = {
        id: `proactive-call-${Date.now()}`,
        sender: "ai",
        text: msgText,
        isProactive: true,
        timestamp: formattedTime,
      };
      setMessages((prev) => [...prev, alertMsg]);
    }

    // Auto-timeout called alert after 6 seconds
    setTimeout(() => {
      setRecentCalledName(null);
    }, 6000);
  };

  // Callback on Step 1 form submit
  const handleCheckInComplete = async (info: PatientInfo, resAssessment: TriageAssessment) => {
    setPatientInfo(info);
    setAssessment(resAssessment);

    // Append our user patient directly to the wait list queue!
    const userPatient: QueuePatient = {
      id: "user-patient-id",
      name: info.name + ` (${info.age})`,
      esi: resAssessment.esi,
      symptomsSummary: info.symptoms,
      accumulatedWaitMinutes: 0, // Freshly arrived
      isCurrentUser: true
    };

    setQueue((prev) => [...prev.filter((p) => p.id !== "user-patient-id"), userPatient]);

    // Fetch opening Gemini summarizing update message for PAGE 3
    try {
      const res = await fetch("/api/chat-open", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: info.name,
          esi: resAssessment.esi,
          esiName: resAssessment.esiName,
          explanation: resAssessment.explanation,
          nextSteps: resAssessment.nextSteps,
          waitTime: 25, // Initial projected minutes
          contactName: info.contact.name,
          relationship: info.contact.relationship
        })
      });

      if (!res.ok) throw new Error("Fallback required");
      
      const data = await res.json();
      setMessages([
        {
          id: "opening-sms",
          sender: "ai",
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    } catch {
      // Compassionate fallback summary message
      setMessages([
        {
          id: "opening-sms-fallback",
          sender: "ai",
          text: `Hello ${info.contact.name}, this is Helping Hand Urgent Care. We are writing to reassure you that ${info.name} has checked in safely. Their clinical symptoms are triaged as ${resAssessment.esiName}. A nurse is currently preparing their station, with an estimated physician wait of 25 minutes. We will keep this SMS link updated with live sequence changes.`,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }
      ]);
    }

    // Progress to waiting room queue page!
    setCurrentPage('queue');
  };

  // Simulate proactive clinic update from the hospital team
  const handleSimulateProactive = () => {
    if (!patientInfo) return;
    
    // Select from realistic hospital check-in event templates
    const alerts = [
      "Helping Hand Staff Update: Dr. Rebecca Miller has reported on shift, increasing clinic velocity. Wait times have dropped by 10%.",
      `Triage Update: Nursing team has checked ${patientInfo.name}'s preliminary temperature and blood pressure. All vitals are reassuringly stable.`,
      "Clinic Update: Fast-track care stations are running at optimal throughput today. Thank you for your patience.",
      `Helping Hand Update: We have adjusted the queue to prioritize high-risk rooms. ${patientInfo.name} remains safely logged in line and closely supervised.`
    ];

    const randomAlert = alerts[Math.floor(Math.random() * alerts.length)];
    const proactiveMsg: Message = {
      id: `proactive-gen-${Date.now()}`,
      sender: "ai",
      text: `★ Helping Hand Update:\n${randomAlert}`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isProactive: true,
    };
    setMessages((prev) => [...prev, proactiveMsg]);
  };

  // Render navigation icons dynamically depending on check-in state
  const isCheckedIn = patientInfo !== null && assessment !== null;

  // Track patient's current position to feed into components
  const sorted = [...queue].sort((a, b) => getPriorityScore(b) - getPriorityScore(a));
  const userIdx = sorted.findIndex(p => p.isCurrentUser);
  const currentPosition = userIdx !== -1 ? userIdx + 1 : 1;

  // Calculate estimated wait dynamically
  let totalTimeAhead = 0;
  for (let i = 0; i < (userIdx !== -1 ? userIdx : 0); i++) {
    const p = sorted[i];
    switch (p.esi) {
      case 1: totalTimeAhead += 40; break;
      case 2: totalTimeAhead += 30; break;
      case 3: totalTimeAhead += 20; break;
      case 4: totalTimeAhead += 12; break;
      default: totalTimeAhead += 8; break;
    }
  }
  const estWaitTime = Math.max(5, Math.round(totalTimeAhead / 2));

  return (
    <div className="min-h-screen bg-[#F7FAF9] flex flex-col font-sans" id="applet-viewport">
      {/* BRAND HEADER BAR */}
      <header className="h-20 bg-white border-b border-teal-100 flex items-center justify-between px-6 md:px-12 sticky top-0 z-50 shadow-sm shrink-0" id="app-header">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-teal-500 rounded-xl flex items-center justify-center shadow-xs">
            <HeartHandshake className="text-white w-6 h-6 stroke-[2.2]" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-slate-800 font-display leading-none">
              Helping Hand
            </h1>
            <span className="text-[10px] text-slate-400 font-bold block mt-1 tracking-widest uppercase">
              AI CLINICAL TRIAGE ASSISTANT
            </span>
          </div>
        </div>

        {/* Dynamic Patient Profile or Status Indicators */}
        <div className="flex items-center gap-4">
          {isCheckedIn && patientInfo ? (
            <div className="flex items-center gap-3 animate-fade-in">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Patient</p>
                <p className="text-sm font-bold text-slate-700">{patientInfo.name}</p>
              </div>
              <div className="w-10 h-10 bg-rose-100 border-2 border-white rounded-full overflow-hidden shadow-xs flex items-center justify-center">
                {patientInfo.photoUrl ? (
                  <img src={patientInfo.photoUrl} alt="Patient" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <div className="w-full h-full bg-teal-100 text-teal-700 font-bold font-display text-base flex items-center justify-center">
                    {patientInfo.name.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 font-bold uppercase tracking-wider">
              <div className="h-2 w-2 rounded-full bg-teal-500 animate-pulse"></div>
              <span>Clinical Registry open</span>
            </div>
          )}
        </div>
      </header>

      {/* THREE-STEP NAVIGATION PROGRESS INDICATOR */}
      <div className="max-w-4xl w-full mx-auto px-6 mt-8 mb-6" id="app-nav-container">
        <div className="bg-white border border-teal-100 rounded-3xl p-4 shadow-xl shadow-teal-900/5 flex items-center justify-center md:justify-between gap-4 overflow-x-auto">
          <nav className="flex items-center gap-8 mx-auto">
            {/* Step 1: Check-in */}
            <button
              onClick={() => setCurrentPage('checkin')}
              className={`flex items-center gap-3 transition cursor-pointer text-sm font-semibold ${
                currentPage === 'checkin' ? "text-teal-600 font-bold" : "text-slate-500 opacity-60 hover:opacity-100"
              }`}
              id="nav-step1-btn"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                isCheckedIn ? "bg-teal-500 text-white animate-pulse" : currentPage === 'checkin' ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                {isCheckedIn ? "✓" : "1"}
              </div>
              <span className="font-display">Check-In</span>
            </button>

            {/* Link 1 */}
            <div className="h-[2px] w-8 bg-teal-100 hidden md:block"></div>

            {/* Step 2: Live Queue */}
            <button
              onClick={() => { if (isCheckedIn) setCurrentPage('queue'); }}
              disabled={!isCheckedIn}
              className={`flex items-center gap-3 transition text-sm font-semibold ${
                !isCheckedIn ? "text-slate-350 cursor-not-allowed opacity-40" : currentPage === 'queue' ? "text-teal-600 font-bold cursor-pointer" : "text-slate-500 opacity-60 hover:opacity-100 cursor-pointer"
              }`}
              id="nav-step2-btn"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentPage === 'queue' ? "bg-teal-500 text-white" : isCheckedIn ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                2
              </div>
              <span className="font-display">Live Queue</span>
            </button>

            {/* Link 2 */}
            <div className="h-[2px] w-8 bg-slate-100 hidden md:block"></div>

            {/* Step 3: Updates */}
            <button
              onClick={() => { if (isCheckedIn) setCurrentPage('updates'); }}
              disabled={!isCheckedIn}
              className={`flex items-center gap-3 transition text-sm font-semibold ${
                !isCheckedIn ? "text-slate-350 cursor-not-allowed opacity-40" : currentPage === 'updates' ? "text-teal-600 font-bold cursor-pointer" : "text-slate-500 opacity-60 hover:opacity-100 cursor-pointer"
              }`}
              id="nav-step3-btn"
            >
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                currentPage === 'updates' ? "bg-teal-500 text-white" : "bg-slate-200 text-slate-600"
              }`}>
                3
              </div>
              <span className="font-display">Family Updates</span>
            </button>
          </nav>
        </div>
      </div>

      {/* APP MAIN VIEWPORT CONTAINER */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 pb-16">
        {currentPage === 'checkin' && (
          <CheckInForm onSubmit={handleCheckInComplete} />
        )}

        {currentPage === 'queue' && isCheckedIn && patientInfo && assessment && (
          <QueueViewer
            currentPatientName={patientInfo.name}
            currentPatientEsi={assessment.esi}
            currentPatientSymptoms={patientInfo.symptoms}
            queue={queue}
            onTickMinutes={handleTickMinutes}
            onCallNextPatient={handleCallNextPatient}
            isSimulating={isSimulating}
            setIsSimulating={setIsSimulating}
            recentCalledName={recentCalledName}
          />
        )}

        {currentPage === 'updates' && isCheckedIn && patientInfo && assessment && (
          <UpdatesChat
            patientInfo={patientInfo}
            assessment={assessment}
            currentPosition={currentPosition}
            estWaitTime={estWaitTime}
            messages={messages}
            onAddMessage={(msg) => setMessages((prev) => [...prev, msg])}
            onSimulateProactive={handleSimulateProactive}
          />
        )}
      </main>

      {/* FOOTER METADATA SECURITY DISCLAIMER */}
      <footer className="h-16 px-6 md:px-12 flex flex-col md:flex-row items-center justify-between text-[10px] font-bold text-slate-450 uppercase tracking-[0.18em] bg-white border-t border-teal-100 shrink-0 gap-2 text-center" id="app-footer">
        <span>Helping Hand Urgent Care • West Wing</span>
        <span className="flex items-center gap-1.5 justify-center md:justify-end">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          AI Assessment Triage Engine Active
        </span>
      </footer>
    </div>
  );
}
