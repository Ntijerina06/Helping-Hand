import React, { useState, useRef, useEffect } from "react";
import { Send, Heart, Shield, RefreshCw, MessageCircle, AlertCircle, Phone, Sparkles } from "lucide-react";
import { Message, PatientInfo, TriageAssessment } from "../types";

interface UpdatesChatProps {
  patientInfo: PatientInfo;
  assessment: TriageAssessment;
  currentPosition: number;
  estWaitTime: number;
  messages: Message[];
  onAddMessage: (msg: Message) => void;
  onSimulateProactive: () => void;
}

export default function UpdatesChat({
  patientInfo,
  assessment,
  currentPosition,
  estWaitTime,
  messages,
  onAddMessage,
  onSimulateProactive,
}: UpdatesChatProps) {
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add contact's message to the state
    const userMsg: Message = {
      id: `contact-${Date.now()}`,
      sender: "contact",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    onAddMessage(userMsg);
    setInputText("");
    setIsTyping(true);

    try {
      // Prepared messages for chat-reply context
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.text
      }));
      // Include the new outgoing message to history
      chatHistory.push({ sender: 'contact', text });

      const response = await fetch("/api/chat-reply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chatHistory,
          patientName: patientInfo.name,
          esi: assessment.esi,
          symptoms: patientInfo.symptoms,
          currentPosition,
          estWaitTime,
          newMessage: text,
          contactName: patientInfo.contact.name,
        }),
      });

      if (!response.ok) {
        throw new Error("Chat reply service returned an error.");
      }

      const data = await response.json();
      
      const aiReply: Message = {
        id: `ai-${Date.now()}`,
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      onAddMessage(aiReply);
    } catch (error) {
      console.error(error);
      const errorReply: Message = {
        id: `ai-err-${Date.now()}`,
        sender: "ai",
        text: "I apologize, but our automated messaging link is currently experiencing high load. A triage nurse stands by to assist you in the lobby.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      onAddMessage(errorReply);
    } finally {
      setIsTyping(false);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  const quickReplies = [
    "When will they be seen?",
    "What happened exactly?",
    "Can I come see them?",
    "Request an update"
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-12 gap-8" id="updates-page-layout">
      {/* LEFT COLUMN: Patient Info & Channel status (4 cols) */}
      <div className="md:col-span-4 space-y-6">
        <div className="bg-white rounded-3xl p-6 border border-teal-50 shadow-xl shadow-teal-900/5 relative overflow-hidden space-y-4">
          <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full -mr-16 -mt-16 opacity-40"></div>
          
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={20} className="text-teal-500" />
              <h3 className="text-sm font-display font-semibold text-slate-800 uppercase tracking-wider">
                Emergency Channel
              </h3>
            </div>
            
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Primary Contact</span>
                <span className="font-semibold text-slate-800 block text-sm">{patientInfo.contact.name}</span>
                <span className="text-slate-500 block">{patientInfo.contact.relationship} • {patientInfo.contact.phone}</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl space-y-1">
                <span className="text-[10px] text-slate-400 font-bold block uppercase">Checked-In Patient</span>
                <span className="font-semibold text-slate-800 block text-sm">{patientInfo.name}</span>
                <span className="text-slate-500 block">Age {patientInfo.age} • ESI Level {assessment.esi}</span>
              </div>

              <div className="p-3 bg-teal-50 rounded-xl space-y-1">
                <span className="text-[10px] text-teal-600 font-bold block uppercase">Current Medical Status</span>
                <span className="font-semibold text-teal-900 block text-sm">Waiting Room • Queue Line #{currentPosition}</span>
                <span className="text-teal-700 block">approximately {estWaitTime}m wait remaining</span>
              </div>
            </div>
          </div>
        </div>

        {/* Demo-assistance check-in triggering */}
        <div className="bg-slate-800 rounded-3xl p-6 text-white shadow-xl shadow-slate-900/10 space-y-4">
          <h4 className="text-xs uppercase font-extrabold font-display tracking-wider text-teal-400 flex items-center gap-1.5">
            <Sparkles size={14} /> SMS Simulator Toolkit
          </h4>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Simulate realistic incoming status alerts from the triage clinic to showcase the app's proactive capabilities.
          </p>
          <button
            onClick={onSimulateProactive}
            className="w-full bg-teal-500 hover:bg-teal-600 font-display font-bold text-white text-xs py-2.5 px-3 rounded-xl transition flex items-center justify-center gap-2 cursor-pointer"
            id="simulate-sms-btn"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Simulate Proactive Clinic SMS</span>
          </button>
        </div>
      </div>

      {/* RIGHT COLUMN: Mobile phone frame chat thread (8 cols) */}
      <div className="md:col-span-8 flex justify-center">
        {/* iPhone Mockup Frame */}
        <div className="w-full max-w-md bg-slate-900 rounded-[40px] p-3 shadow-xl border-4 border-slate-700 relative flex flex-col h-[640px]" id="phone-chat-frame">
          {/* Speaker pill top */}
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 w-32 h-4 bg-slate-950 rounded-full flex items-center justify-center z-10">
            <div className="w-12 h-1 bg-slate-800 rounded-full"></div>
          </div>

          {/* Screen Content */}
          <div className="flex-1 bg-slate-50 rounded-[30px] overflow-hidden flex flex-col mt-4 relative">
            {/* Phone Message Header */}
            <div className="bg-white border-b border-slate-100 p-4 pt-6 flex items-center justify-between shadow-3xs">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-display font-extrabold text-sm border border-teal-200">
                  HH
                </div>
                <div>
                  <h4 className="font-display font-bold text-slate-800 text-xs flex items-center gap-1">
                    Helping Hand updates
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 inline-block"></span>
                  </h4>
                  <span className="text-[10px] text-slate-400 block">Automated Medical Line</span>
                </div>
              </div>
              <Phone size={14} className="text-slate-400 cursor-pointer hover:text-teal-500 transition" />
            </div>

            {/* Chat Body Scroll */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4" id="chat-messages-container">
              {messages.map((m) => {
                const isAI = m.sender === "ai";
                return (
                  <div
                    key={m.id}
                    className={`flex flex-col max-w-[85%] ${isAI ? "self-start" : "self-end ml-auto"}`}
                  >
                    <div
                      className={`px-4 py-3 rounded-2xl text-xs leading-relaxed shadow-3xs ${
                        isAI
                          ? "bg-white text-slate-800 rounded-tl-none border border-slate-100"
                          : "bg-teal-500 text-white rounded-tr-none"
                      }`}
                    >
                      {/* Proactive badge */}
                      {m.isProactive && (
                        <span className="text-[9px] font-extrabold text-teal-600 block mb-1 uppercase tracking-wider bg-teal-50 px-1.5 py-0.5 rounded-sm w-fit">
                          ★ CLINIC ALERT
                        </span>
                      )}
                      <p className="whitespace-pre-wrap">{m.text}</p>
                    </div>
                    <span className="text-[9px] text-slate-400 mt-1 px-1 self-end font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                );
              })}

              {/* Typing indicator */}
              {isTyping && (
                <div className="flex flex-col max-w-[80%] self-start" id="is-typing-loader">
                  <div className="px-4 py-3 rounded-2xl bg-white border border-slate-100 rounded-tl-none text-slate-400 text-xs flex items-center gap-1">
                    <span>AI Assistant is drafting response</span>
                    <span className="flex gap-0.5 items-center pl-1">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce"></span>
                    </span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies Panel */}
            <div className="px-3 pb-2 pt-1.5 bg-slate-50 border-t border-slate-100 overflow-x-auto flex gap-2 no-scrollbar" id="quick-replies-list">
              {quickReplies.map((qr) => (
                <button
                  key={qr}
                  onClick={() => handleQuickReply(qr)}
                  className="bg-white hover:bg-teal-50 text-slate-600 hover:text-teal-700 border border-slate-200 hover:border-teal-300 rounded-full px-3 py-1 text-[10px] whitespace-nowrap transition cursor-pointer font-medium shadow-3xs flex-shrink-0"
                >
                  {qr}
                </button>
              ))}
            </div>

            {/* Message Input Footer Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(inputText);
              }}
              className="bg-white border-t border-slate-100 p-3 flex gap-2 items-center"
            >
              <input
                type="text"
                placeholder="Type question regarding care..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
                id="contact-message-input"
              />
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="bg-teal-500 hover:bg-teal-600 text-white p-2.5 rounded-full cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed transition"
                id="send-message-btn"
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
