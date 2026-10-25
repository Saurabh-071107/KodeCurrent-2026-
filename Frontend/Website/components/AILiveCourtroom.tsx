'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Gavel,
  Landmark,
  BarChart2,
  User,
  Maximize2,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Hand,
  PhoneOff,
  Folder,
  FileText,
  ChevronRight,
  Upload,
  CheckCircle2,
  AlertTriangle,
  BookOpen,
  Scale,
  Brain,
  X,
  ArrowRight,
  Sliders,
  Check
} from 'lucide-react';

interface CaseScenarioPreset {
  id: string;
  title: string;
  category: string;
  actSection: string;
  caseNumber: string;
  filingDate: string;
  recommendedCourt: string;
  brief: string;
  facts: string[];
  documents: Array<{ name: string; pages: string }>;
  judgeQuestion: string;
}

const CASE_PRESETS: CaseScenarioPreset[] = [
  {
    id: 'bail',
    title: 'State v. Rohan Mehta',
    category: 'Bail Application · Criminal Law',
    actSection: 'Section 438 CrPC / 482 BNSS & Section 307 IPC',
    caseNumber: 'FIR No. 184/2024',
    filingDate: '12 Aug 2024',
    recommendedCourt: 'High Court (Bombay)',
    brief: 'Anticipatory bail petition in an alleged attempt to murder case where co-accused have already been enlarged on bail and custodial necessity is contested.',
    facts: [
      'Applicant seeks anticipatory bail under Section 438 CrPC in connection with FIR 184/2024.',
      'Alleged offence: Section 307 IPC (Attempt to Murder) and allied offences.',
      'Investigation is ongoing. No recovery of weapon or incriminating material made from applicant.',
      'Two co-accused have already been granted bail on parity grounds by the Sessions Court.'
    ],
    documents: [
      { name: 'FIR.pdf', pages: '12 pages' },
      { name: 'Case Diary.pdf', pages: '8 pages' },
      { name: 'Bail Application.pdf', pages: '14 pages' },
      { name: 'Opposition Reply.pdf', pages: '10 pages' },
    ],
    judgeQuestion:
      'Counsel, the offence is under Section 307 IPC. What are the exceptional circumstances that justify the grant of anticipatory bail in this case?'
  },
  {
    id: 'writ',
    title: 'Mehta Infrastructure v. Union of India',
    category: 'Article 226 Constitutional Writ · Administrative Law',
    actSection: 'Articles 14, 19(1)(g) & 226 of the Constitution',
    caseNumber: 'WP(C) 4120/2024',
    filingDate: '20 Jul 2024',
    recommendedCourt: 'High Court (Delhi)',
    brief: 'Challenge against an arbitrary governmental blacklisting order issued without issuing a Show Cause Notice or granting personal hearing.',
    facts: [
      'Petitioner challenges an order permanently debarring it from participating in public infrastructure tenders.',
      'The impugned order was passed in blatant violation of the principles of natural justice (audi alteram partem).',
      'No formal show cause notice or documentary evidence of default was furnished prior to debarment.',
      'Prejudice caused is immediate, threatening liquidation and livelihood of 400+ employees.'
    ],
    documents: [
      { name: 'Writ Petition.pdf', pages: '28 pages' },
      { name: 'Impugned Order.pdf', pages: '4 pages' },
      { name: 'Tender Agreement.pdf', pages: '45 pages' },
      { name: 'Affidavit in Support.pdf', pages: '6 pages' },
    ],
    judgeQuestion:
      'Counsel, why should this Court exercise its extraordinary prerogative writ jurisdiction when an arbitration clause exists in your contract?'
  },
  {
    id: 'commercial',
    title: 'Alpha Pharma Ltd. v. Apex Biotech Corp.',
    category: 'Commercial Injunction Suit · Intellectual Property',
    actSection: 'Section 48 Patents Act & Order 39 Rules 1 & 2 CPC',
    caseNumber: 'CS(COMM) 298/2024',
    filingDate: '05 Sep 2024',
    recommendedCourt: 'High Court (Bombay)',
    brief: 'Ad-interim injunction application restraining generic launch of a patented cardiovascular formulation based on clinical trials data.',
    facts: [
      'Plaintiff holds a valid granted Indian patent with 7 years remaining validity.',
      'Defendant announced commercial rollout of bio-equivalent formulation without obtaining voluntary license.',
      'The three-fold test of prima facie validity, balance of convenience, and irreparable injury leans in plaintiff favor.',
      'Defendant has lodged a pre-grant opposition which was previously rejected by the Controller.'
    ],
    documents: [
      { name: 'Plaint & Injunction App.pdf', pages: '34 pages' },
      { name: 'Patent Certificate.pdf', pages: '16 pages' },
      { name: 'Expert Chemical Affidavit.pdf', pages: '22 pages' },
      { name: 'Defendant Reply.pdf', pages: '18 pages' },
    ],
    judgeQuestion:
      'Counsel, how do you address the defendant plea under Section 64 that the compound lacks inventive step and involves prior art?'
  },
  {
    id: 'appeal',
    title: 'Vikram Singh v. State of Maharashtra',
    category: 'Criminal Appeal against Conviction · Section 374 CrPC',
    actSection: 'Section 302 IPC (Murder) & Section 27 Indian Evidence Act',
    caseNumber: 'Crl. Appeal No. 512/2023',
    filingDate: '15 Oct 2023',
    recommendedCourt: 'Supreme Court of India',
    brief: 'Appeal against concurrent life imprisonment conviction resting entirely on circumstantial evidence and disputed discovery memo.',
    facts: [
      'Appellant convicted under Section 302 IPC exclusively on circumstantial evidence without eyewitness testimony.',
      'The chain of circumstances contains material missing links between the last seen time and time of death.',
      'Recovery under Section 27 Evidence Act was made from an open, accessible public culvert.',
      'Forensic chemical examination of seized articles proved completely inconclusive.'
    ],
    documents: [
      { name: 'Trial Court Judgment.pdf', pages: '64 pages' },
      { name: 'High Court Confirmation.pdf', pages: '38 pages' },
      { name: 'Special Leave Petition.pdf', pages: '42 pages' },
      { name: 'Forensic Lab Report.pdf', pages: '9 pages' },
    ],
    judgeQuestion:
      'Counsel, the High Court concurrently affirmed the last seen theory along with the motive established by PW-3. Where exactly does the chain break?'
  }
];

const COURTS = [
  'High Court (Bombay)',
  'High Court (Delhi)',
  'Supreme Court of India',
  'Sessions Court (City Civil & Sessions)'
];

const DIFFICULTIES = [
  { id: 'Beginner', label: 'Beginner', desc: 'Accommodating bench, guided prompts & hints' },
  { id: 'Moderate', label: 'Moderate', desc: 'Realistic courtroom pressure & standard bench questions' },
  { id: 'Challenging', label: 'Challenging', desc: 'Strict Division Bench, rigorous queries & citation checks' }
];

const ROLES = [
  { id: 'Petitioner Counsel', label: 'Petitioner Counsel', desc: 'Lead arguments and seek relief for applicant' },
  { id: 'Opposing Counsel', label: 'Opposing Counsel', desc: 'Defend state interest and contest prayer' },
  { id: 'Amicus Curiae', label: 'Amicus Curiae', desc: 'Assist the Bench with impartial jurisprudence' }
];

interface AILiveCourtroomProps {
  onBackToDashboard?: () => void;
  dashboardHref?: string;
}

export default function AILiveCourtroom({
  dashboardHref = '/student'
}: AILiveCourtroomProps) {
  // Pre-hearing Configuration State
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [presetsList, setPresetsList] = useState<CaseScenarioPreset[]>(CASE_PRESETS);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('bail');
  const [selectedCourt, setSelectedCourt] = useState<string>('High Court (Bombay)');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('Moderate');
  const [selectedRole, setSelectedRole] = useState<string>('Petitioner Counsel');

  // Fetch dynamic courtroom presets from backend
  useEffect(() => {
    api.getStudentAssets().then((res) => {
      if (res.success && res.data?.courtroomPresets && Array.isArray(res.data.courtroomPresets) && res.data.courtroomPresets.length > 0) {
        setPresetsList(res.data.courtroomPresets);
      }
    }).catch(() => {});
  }, []);

  const activeScenario = presetsList.find((c) => c.id === selectedScenarioId) || presetsList[0] || CASE_PRESETS[0];

  // Session Timer
  const [sessionSeconds, setSessionSeconds] = useState(12 * 60 + 34);
  const [isSessionActive, setIsSessionActive] = useState(false);

  useEffect(() => {
    if (!isSessionActive) return;
    const interval = setInterval(() => {
      setSessionSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isSessionActive]);

  const formatTimer = (totalSeconds: number) => {
    const hrs = Math.floor(totalSeconds / 3600);
    const mins = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Video and Speech Controls
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isHandRaised, setIsHandRaised] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [captionsEnabled, setCaptionsEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // De-congested Right Panel Mode
  const [rightPanelTab, setRightPanelTab] = useState<'context' | 'feedback' | 'documents'>('context');

  // Middle Transcript Tabs
  const [transcriptTab, setTranscriptTab] = useState<'live' | 'flow' | 'notes'>('live');

  // Interactive Transcript
  const [transcripts, setTranscripts] = useState([
    {
      id: 1,
      sender: 'Judge',
      time: '10:12 AM',
      text: activeScenario.judgeQuestion
    },
    {
      id: 2,
      sender: 'You',
      time: '10:13 AM',
      text: 'My Lord, the applicant has no prior criminal antecedents. The allegations are based primarily on statements of co-accused, which are yet to be corroborated by independent evidence...'
    },
    {
      id: 3,
      sender: 'Opposing Counsel',
      time: '10:14 AM',
      text: 'My Lord, the gravity of the offence and the possibility of witness tampering should be considered...'
    }
  ]);

  // Update transcript when scenario changes
  useEffect(() => {
    setTranscripts([
      {
        id: 1,
        sender: 'Judge',
        time: '10:12 AM',
        text: activeScenario.judgeQuestion
      },
      {
        id: 2,
        sender: 'You',
        time: '10:13 AM',
        text: 'My Lord, the applicant has no prior criminal antecedents. The allegations are based primarily on statements of co-accused, which are yet to be corroborated by independent evidence...'
      },
      {
        id: 3,
        sender: 'Opposing Counsel',
        time: '10:14 AM',
        text: 'My Lord, the gravity of the offence and the possibility of witness tampering should be considered...'
      }
    ]);
  }, [activeScenario]);

  // Notes state
  const [sessionNotes, setSessionNotes] = useState(
    '- Emphasize parity with co-accused granted bail on 5th Aug.\n- Prepare counter on Section 307 injury report non-fatal finding.\n- Cite Sushila Aggarwal v. State (NCT of Delhi) on scope of Section 438.'
  );

  // Modals
  const [activeToolModal, setActiveToolModal] = useState<string | null>(null);
  const [endSessionConfirm, setEndSessionConfirm] = useState(false);

  // Start hearing handler
  const handleStartHearing = () => {
    setIsConfiguring(false);
    setIsSessionActive(true);
  };

  // Speech simulation handlers
  const handleHoldToSpeak = () => {
    setIsSpeaking(true);
  };

  const handleReleaseSpeak = () => {
    if (!isSpeaking) return;
    setIsSpeaking(false);
    const newId = transcripts.length + 1;
    const now = new Date();
    const timeStr = `${now.getHours() % 12 || 12}:${now.getMinutes().toString().padStart(2, '0')} ${now.getHours() >= 12 ? 'PM' : 'AM'}`;

    setTranscripts((prev) => [
      ...prev,
      {
        id: newId,
        sender: 'You',
        time: timeStr,
        text: 'My Lord, custodial interrogation is unwarranted as the applicant has already submitted documentary safeguards and surrendered his passport to the Investigating Officer.'
      }
    ]);
  };

  // Video refs to guarantee autoplay and mute
  const judgeVideoRef = useRef<HTMLVideoElement>(null);
  const petitionerVideoRef = useRef<HTMLVideoElement>(null);
  const opposingVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!isConfiguring) {
      [judgeVideoRef, petitionerVideoRef, opposingVideoRef].forEach((ref) => {
        if (ref.current) {
          ref.current.muted = true;
          ref.current.play().catch(() => {});
        }
      });
    }
  }, [isConfiguring]);

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5] text-[#1E293B] font-sans antialiased">
      
      {/* ===================================================================== */}
      {/* 1. PRE-HEARING SETUP SCREEN (ASK SCENARIO, COURT, DIFFICULTY, ROLE)   */}
      {/* ===================================================================== */}
      {isConfiguring ? (
        <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-10 flex flex-col justify-center animate-in fade-in duration-200">
          
          {/* Header Banner */}
          <div className="mb-8 text-center max-w-2xl mx-auto space-y-2">
            <h1 className="font-serif font-bold text-3xl sm:text-4xl text-[#1E3A8A] tracking-tight">
              AI Live Courtroom Simulation
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B] leading-relaxed">
              Configure your courtroom parameters before addressing the Bench. Select your case scenario, forum, difficulty, and appearance role.
            </p>
          </div>

          {/* Configuration Form Card */}
          <div className="bg-white border border-[#EAE3D6] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8">
            
            {/* Step 1: Case Scenario */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">1</span>
                  <span>Select Case Scenario</span>
                </label>
                <span className="text-xs text-[#64748B] font-medium">
                  {CASE_PRESETS.length} Verified Briefs Available
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {CASE_PRESETS.map((scenario) => {
                  const isSelected = selectedScenarioId === scenario.id;
                  return (
                    <button
                      key={scenario.id}
                      type="button"
                      onClick={() => {
                        setSelectedScenarioId(scenario.id);
                        setSelectedCourt(scenario.recommendedCourt);
                      }}
                      className={`p-4 rounded-2xl border text-left transition flex flex-col justify-between gap-2.5 cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF5EB] border-[#1E3A8A] ring-2 ring-[#1E3A8A]/15 shadow-xs'
                          : 'bg-white border-[#DECDB8] hover:border-[#8C5320] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320]">
                            {scenario.category}
                          </span>
                          {isSelected && (
                            <div className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center">
                              <Check className="w-3 h-3" />
                            </div>
                          )}
                        </div>
                        <h3 className="font-bold text-sm text-[#1E293B] leading-snug">
                          {scenario.title}
                        </h3>
                        <p className="text-xs text-[#64748B] mt-1 line-clamp-2 leading-relaxed">
                          {scenario.brief}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[#DECDB8]/60 flex items-center justify-between text-[11px] text-[#64748B]">
                        <span>{scenario.caseNumber}</span>
                        <span className="font-medium text-[#1E3A8A]">{scenario.actSection}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Court & Jurisdiction */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">2</span>
                <span>Select Court & Bench</span>
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {COURTS.map((court) => {
                  const isSelected = selectedCourt === court;
                  return (
                    <button
                      key={court}
                      type="button"
                      onClick={() => setSelectedCourt(court)}
                      className={`p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                        isSelected
                          ? 'bg-[#FAF5EB] border-[#1E3A8A] ring-1 ring-[#1E3A8A] font-bold text-[#1E3A8A]'
                          : 'bg-white border-[#DECDB8] hover:bg-[#FAF8F5] text-[#334155]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Landmark className="w-4 h-4 text-[#C59B58]" />
                        <span className="text-xs truncate">{court}</span>
                      </div>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 3 & 4: Difficulty & Role */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              
              {/* Difficulty */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">3</span>
                  <span>Select Difficulty</span>
                </label>
                <div className="space-y-2">
                  {DIFFICULTIES.map((diff) => {
                    const isSelected = selectedDifficulty === diff.id;
                    return (
                      <button
                        key={diff.id}
                        type="button"
                        onClick={() => setSelectedDifficulty(diff.id)}
                        className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#FAF5EB] border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                            : 'bg-white border-[#DECDB8] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 font-bold text-xs text-[#1E293B]">
                            <BarChart2 className="w-3.5 h-3.5 text-[#C59B58]" />
                            <span>{diff.label}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{diff.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1E3A8A]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Role */}
              <div className="space-y-3">
                <label className="text-xs font-bold text-[#1E293B] uppercase tracking-wider flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center text-[10px]">4</span>
                  <span>Select Your Role</span>
                </label>
                <div className="space-y-2">
                  {ROLES.map((r) => {
                    const isSelected = selectedRole === r.id;
                    return (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => setSelectedRole(r.id)}
                        className={`w-full p-3 rounded-xl border text-left transition cursor-pointer flex items-center justify-between ${
                          isSelected
                            ? 'bg-[#FAF5EB] border-[#1E3A8A] ring-1 ring-[#1E3A8A]'
                            : 'bg-white border-[#DECDB8] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <div>
                          <div className="flex items-center gap-2 font-bold text-xs text-[#1E293B]">
                            <User className="w-3.5 h-3.5 text-[#C59B58]" />
                            <span>{r.label}</span>
                          </div>
                          <p className="text-[11px] text-[#64748B] mt-0.5">{r.desc}</p>
                        </div>
                        {isSelected && <Check className="w-4 h-4 text-[#1E3A8A]" />}
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Launch Action Bar */}
            <div className="pt-6 border-t border-[#EAE3D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs text-[#64748B]">
                Bench Ready: <strong className="text-[#1E293B]">{selectedCourt}</strong> · Role: <strong className="text-[#1E3A8A]">{selectedRole}</strong> · Mode: <strong className="text-[#8C5320]">{selectedDifficulty}</strong>
              </div>

              <div className="flex items-center gap-3">
                <Link
                  href={dashboardHref}
                  className="px-4 py-2.5 rounded-xl border border-[#DECDB8] text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition"
                >
                  Cancel
                </Link>
                <button
                  type="button"
                  onClick={handleStartHearing}
                  className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-bold shadow-md hover:shadow-lg transition flex items-center gap-2 cursor-pointer"
                >
                  <Gavel className="w-4 h-4 text-[#F3D7A2]" />
                  <span>Enter Courtroom & Start Hearing</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

          </div>

        </div>
      ) : (
        /* ===================================================================== */
        /* 2. LIVE COURTROOM SCREEN (SPACIOUS, DE-CONGESTED REDESIGN)           */
        /* ===================================================================== */
        <div className="flex-1 flex flex-col min-w-0">
          
          {/* TOP HEADER: Clean, Non-Congested Navigation */}
          <header className="bg-white border-b border-[#EAE3D6] px-4 sm:px-6 py-3 sticky top-0 z-30 shadow-2xs">
            <div className="max-w-[1780px] mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
              
              {/* Left: Title & Quick Setup Switcher */}
              <div className="flex items-center gap-3 flex-wrap">
                <div>
                  <h1 className="font-serif font-bold text-xl text-[#1E3A8A] leading-tight">
                    AI Live Courtroom
                  </h1>
                  <p className="text-[11px] text-[#64748B]">
                    Active Chamber Hearing · {activeScenario.title}
                  </p>
                </div>

                <div className="hidden lg:flex items-center gap-2 pl-3 border-l border-[#EAE3D6]">
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] border border-[#DECDB8] text-[11px] font-semibold text-[#8C5320]">
                    {selectedCourt}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] border border-[#DECDB8] text-[11px] font-semibold text-[#1E3A8A]">
                    {selectedRole}
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] border border-[#DECDB8] text-[11px] font-semibold text-[#64748B]">
                    {selectedDifficulty}
                  </span>
                </div>
              </div>

              {/* Right: Reconfigure / Timer / End Session */}
              <div className="flex items-center gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => setIsConfiguring(true)}
                  className="px-3 py-1.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] hover:bg-[#EAE3D6] text-xs font-semibold text-[#1E293B] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#8C5320]" />
                  <span>Change Scenario</span>
                </button>

                <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F1E36] text-white font-mono text-xs font-bold shadow-xs">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                  <span>{formatTimer(sessionSeconds)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => setEndSessionConfirm(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <PhoneOff className="w-3.5 h-3.5" />
                  <span>End Session</span>
                </button>
              </div>

            </div>
          </header>

          {/* MAIN WORKSPACE: SPACIOUS 2-COLUMN VIEW (NO SQUISHING) */}
          <main className="flex-1 p-4 sm:p-5 lg:p-6 max-w-[1780px] w-full mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
              
              {/* =============================================================== */}
              {/* LEFT COLUMN (7/12): SPACIOUS VIDEO STAGE, TRANSCRIPT, CONTROLS */}
              {/* =============================================================== */}
              <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
                
                {/* VIDEO STAGE */}
                <div className="flex flex-col gap-3">
                  
                  {/* TOP: HON'BLE AI JUDGE VIDEO FEED */}
                  <div className="relative w-full aspect-video sm:h-[400px] xl:h-[440px] bg-[#111827] rounded-3xl overflow-hidden border border-[#DECDB8] shadow-sm">
                    <video
                      ref={judgeVideoRef}
                      src="/videos/courtroom/judge.mp4"
                      poster="/videos/courtroom/judge.jpg"
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full object-cover"
                    />

                    {/* Floating Speech Bubble (Top Left Overlay) */}
                    {captionsEnabled && (
                      <div className="absolute top-4 left-4 max-w-sm sm:max-w-md bg-[#0F172A]/85 backdrop-blur-md border border-white/15 text-white p-3.5 rounded-2xl shadow-2xl animate-in fade-in slide-in-from-top-2 duration-150">
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <div className="flex items-center gap-1.5">
                            <div className="w-4 h-4 rounded-full bg-[#C59B58] text-[#0F172A] flex items-center justify-center font-bold text-[9px]">
                              2
                            </div>
                            <span className="text-xs font-bold text-[#E2E8F0]">Hon&apos;ble Judge</span>
                          </div>
                          <div className="flex items-center gap-0.5">
                            <span className="w-1 h-3 bg-cyan-400 rounded-full animate-pulse"></span>
                            <span className="w-1 h-4 bg-cyan-400 rounded-full animate-pulse delay-75"></span>
                            <span className="w-1 h-2 bg-cyan-400 rounded-full animate-pulse delay-150"></span>
                            <span className="w-1 h-5 bg-cyan-400 rounded-full animate-pulse"></span>
                          </div>
                        </div>
                        <p className="text-xs text-white/95 leading-relaxed font-sans">
                          {activeScenario.judgeQuestion}
                        </p>
                      </div>
                    )}

                    {/* Bottom Center: Brass Name Placard */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
                      <div className="px-6 py-1 rounded-sm bg-[#1A130B] border border-[#B38743] shadow-lg flex items-center justify-center">
                        <span className="font-serif tracking-widest text-[11px] sm:text-xs font-bold text-[#F3D7A2] uppercase drop-shadow-sm">
                          HON&apos;BLE AI JUDGE
                        </span>
                      </div>
                    </div>

                    {/* Top Right Quick Video Controls */}
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        className="w-8 h-8 rounded-full bg-black/50 backdrop-blur-sm border border-white/20 text-white flex items-center justify-center hover:bg-black/70 transition cursor-pointer"
                        title="Fullscreen"
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setCaptionsEnabled(!captionsEnabled)}
                        className={`w-8 h-8 rounded-full backdrop-blur-sm border transition flex items-center justify-center font-bold text-xs cursor-pointer ${
                          captionsEnabled ? 'bg-[#C59B58] text-[#0F172A] border-[#C59B58]' : 'bg-black/50 text-white border-white/20'
                        }`}
                        title="Toggle Captions"
                      >
                        CC
                      </button>
                    </div>
                  </div>

                  {/* BOTTOM: 2 COUNSEL FEEDS (SPLIT 50% / 50%) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    
                    {/* Petitioner / "You" */}
                    <div className="relative aspect-video sm:h-[190px] xl:h-[210px] bg-[#111827] rounded-2xl overflow-hidden border border-[#DECDB8] shadow-sm">
                      {isVideoOff ? (
                        <div className="w-full h-full flex flex-col items-center justify-center bg-[#1E293B] text-white/70">
                          <VideoOff className="w-8 h-8 text-[#94A3B8] mb-1" />
                          <span className="text-xs font-semibold">Video Off</span>
                        </div>
                      ) : (
                        <video
                          ref={petitionerVideoRef}
                          src="/videos/courtroom/petitioner.mp4"
                          poster="/videos/courtroom/petitioner.jpg"
                          autoPlay
                          loop
                          muted
                          playsInline
                          className="w-full h-full object-cover"
                        />
                      )}

                      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white">
                        <div className="w-4 h-4 rounded-full bg-[#1E3A8A] flex items-center justify-center text-white">
                          <User className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-[11px] font-bold">You</span>
                          <span className="text-[9px] text-white/75">{selectedRole}</span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 right-3 flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/15">
                        <span className={`w-0.5 h-2 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-white/40'}`}></span>
                        <span className={`w-0.5 h-3 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-pulse delay-75' : 'bg-white/40'}`}></span>
                        <span className={`w-0.5 h-4 rounded-full ${isSpeaking ? 'bg-cyan-400 animate-pulse delay-150' : 'bg-white/40'}`}></span>
                      </div>
                    </div>

                    {/* Opposing Counsel */}
                    <div className="relative aspect-video sm:h-[190px] xl:h-[210px] bg-[#111827] rounded-2xl overflow-hidden border border-[#DECDB8] shadow-sm">
                      <video
                        ref={opposingVideoRef}
                        src="/videos/courtroom/opposing.mp4"
                        poster="/videos/courtroom/opposing.jpg"
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />

                      <div className="absolute bottom-3 left-3 flex items-center gap-2 px-2.5 py-1 rounded-full bg-black/65 backdrop-blur-md border border-white/15 text-white">
                        <div className="w-4 h-4 rounded-full bg-[#8C5320] flex items-center justify-center text-white">
                          <User className="w-2.5 h-2.5" />
                        </div>
                        <div className="flex flex-col leading-none">
                          <span className="text-[11px] font-bold">Opposing Counsel</span>
                          <span className="text-[9px] text-white/75">State Prosecutor</span>
                        </div>
                      </div>

                      <div className="absolute bottom-3 right-3 w-6 h-6 rounded-full bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center">
                        <MicOff className="w-3 h-3 text-rose-300" />
                      </div>
                    </div>

                  </div>

                </div>

                {/* MIDDLE: SPACIOUS TRANSCRIPT & QUICK ARGUMENT CHIPS */}
                <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 shadow-2xs space-y-3">
                  
                  {/* Tabs Header + Quick Argument Chips */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2 border-b border-[#FAF5EB]">
                    <div className="flex items-center gap-4 text-xs font-bold">
                      <button
                        type="button"
                        onClick={() => setTranscriptTab('live')}
                        className={`flex items-center gap-1.5 pb-1 border-b-2 transition cursor-pointer ${
                          transcriptTab === 'live'
                            ? 'text-[#1E3A8A] border-[#1E3A8A]'
                            : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping"></span>
                        <span>Live Hearing Transcript</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setTranscriptTab('flow')}
                        className={`pb-1 border-b-2 transition cursor-pointer ${
                          transcriptTab === 'flow'
                            ? 'text-[#1E3A8A] border-[#1E3A8A]'
                            : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                        }`}
                      >
                        Courtroom Flow
                      </button>

                      <button
                        type="button"
                        onClick={() => setTranscriptTab('notes')}
                        className={`pb-1 border-b-2 transition cursor-pointer ${
                          transcriptTab === 'notes'
                            ? 'text-[#1E3A8A] border-[#1E3A8A]'
                            : 'text-[#64748B] border-transparent hover:text-[#1E293B]'
                        }`}
                      >
                        My Hearing Notes
                      </button>
                    </div>

                    {/* Quick Argument Assist Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-0.5">
                      {[
                        { name: 'Cite Precedent', icon: <BookOpen className="w-3 h-3" /> },
                        { name: 'Relevant Code', icon: <Scale className="w-3 h-3" /> },
                        { name: 'Counterarguments', icon: <Brain className="w-3 h-3" /> },
                      ].map((chip) => (
                        <button
                          key={chip.name}
                          type="button"
                          onClick={() => setActiveToolModal(chip.name)}
                          className="px-2.5 py-1 rounded-lg bg-[#FAF5EB] hover:bg-[#EAE3D6] border border-[#DECDB8] text-[11px] font-semibold text-[#1E3A8A] transition flex items-center gap-1 whitespace-nowrap cursor-pointer"
                        >
                          {chip.icon}
                          <span>{chip.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Transcript Content */}
                  {transcriptTab === 'live' && (
                    <div className="space-y-3 max-h-[190px] overflow-y-auto pr-1">
                      {transcripts.map((t) => (
                        <div key={t.id} className="flex items-start gap-2.5 text-xs leading-relaxed">
                          <div className="w-6 h-6 rounded-full bg-[#FAF5EB] border border-[#DECDB8] flex-shrink-0 flex items-center justify-center font-bold text-[10px] text-[#8C5320] mt-0.5">
                            {t.sender === 'Judge' ? <Gavel className="w-3 h-3 text-[#C59B58]" /> : <User className="w-3 h-3 text-[#1E3A8A]" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-0.5">
                              <span className="font-bold text-[#1E293B]">{t.sender}</span>
                              <span className="text-[10px] text-[#94A3B8]">{t.time}</span>
                            </div>
                            <p className="text-[#334155]">{t.text}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {transcriptTab === 'flow' && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs py-1">
                      <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900">
                        <span className="text-[10px] font-bold uppercase text-emerald-700 block">Phase 1</span>
                        <strong className="text-xs">Prosecution Case</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-blue-900">
                        <span className="text-[10px] font-bold uppercase text-blue-700 block">Phase 2 · Active</span>
                        <strong className="text-xs">Defence Arguments</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] text-[#64748B]">
                        <span className="text-[10px] font-bold uppercase block">Phase 3</span>
                        <strong className="text-xs">Judicial Queries</strong>
                      </div>
                      <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] text-[#64748B]">
                        <span className="text-[10px] font-bold uppercase block">Phase 4</span>
                        <strong className="text-xs">Order Pronouncement</strong>
                      </div>
                    </div>
                  )}

                  {transcriptTab === 'notes' && (
                    <div>
                      <textarea
                        value={sessionNotes}
                        onChange={(e) => setSessionNotes(e.target.value)}
                        placeholder="Keep case notes during hearing..."
                        rows={5}
                        className="w-full p-2.5 text-xs bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-[#1E293B] focus:outline-none focus:border-[#C59B58] resize-none"
                      />
                    </div>
                  )}
                </div>

                {/* BOTTOM: COMFORTABLE CONTROL BAR */}
                <div className="bg-white border border-[#DECDB8] rounded-2xl p-3 sm:px-6 shadow-sm flex flex-wrap items-center justify-between gap-3">
                  
                  {/* Left: Speaker Turn */}
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[#1E3A8A]/10 text-[#1E3A8A] flex items-center justify-center font-bold">
                      <User className="w-4 h-4" />
                    </div>
                    <div className="flex flex-col text-left">
                      <span className="text-[11px] font-bold text-[#1E3A8A]">Turn: You ({selectedRole})</span>
                      <span className="text-[10px] text-[#64748B] font-medium">Click or hold to speak</span>
                    </div>
                    <div className="hidden sm:flex items-center gap-1 ml-2">
                      <span className="w-1 h-3 bg-cyan-600 rounded-full animate-bounce"></span>
                      <span className="w-1 h-5 bg-cyan-600 rounded-full animate-bounce delay-75"></span>
                      <span className="w-1 h-2 bg-cyan-600 rounded-full animate-bounce delay-150"></span>
                    </div>
                  </div>

                  {/* Center Controls */}
                  <div className="flex items-center gap-3 sm:gap-4 mx-auto sm:mx-0">
                    
                    {/* Mute Button */}
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition ${
                        isMuted ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-[#FAF8F5] border-[#DECDB8] text-[#1E293B] hover:bg-[#EAE3D6]'
                      }`}>
                        {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4 text-rose-500" />}
                      </div>
                      <span className="text-[10px] font-medium text-[#64748B]">
                        {isMuted ? 'Unmute' : 'Mute'}
                      </span>
                    </button>

                    {/* Primary Action: Hold to Speak */}
                    <button
                      type="button"
                      onMouseDown={handleHoldToSpeak}
                      onMouseUp={handleReleaseSpeak}
                      onTouchStart={handleHoldToSpeak}
                      onTouchEnd={handleReleaseSpeak}
                      className="flex flex-col items-center gap-1 cursor-pointer group select-none"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-150 active:scale-95 ${
                        isSpeaking
                          ? 'bg-gradient-to-tr from-cyan-600 to-blue-600 ring-4 ring-cyan-300'
                          : 'bg-gradient-to-tr from-[#1E3A8A] to-[#2563EB] hover:from-[#172554] hover:to-[#1D4ED8] ring-4 ring-[#1E3A8A]/20'
                      }`}>
                        <Mic className="w-5 h-5" />
                      </div>
                      <span className="text-[11px] font-bold text-[#1E3A8A]">
                        {isSpeaking ? 'Listening...' : 'Hold to Speak'}
                      </span>
                    </button>

                    {/* Video Off Button */}
                    <button
                      type="button"
                      onClick={() => setIsVideoOff(!isVideoOff)}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition ${
                        isVideoOff ? 'bg-rose-50 border-rose-200 text-rose-600' : 'bg-[#FAF8F5] border-[#DECDB8] text-[#1E293B] hover:bg-[#EAE3D6]'
                      }`}>
                        {isVideoOff ? <VideoOff className="w-4 h-4 text-rose-500" /> : <Video className="w-4 h-4" />}
                      </div>
                      <span className="text-[10px] font-medium text-[#64748B]">
                        {isVideoOff ? 'Video On' : 'Video Off'}
                      </span>
                    </button>

                    {/* Raise Hand Button */}
                    <button
                      type="button"
                      onClick={() => setIsHandRaised(!isHandRaised)}
                      className="flex flex-col items-center gap-1 group cursor-pointer"
                    >
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center border transition ${
                        isHandRaised ? 'bg-amber-100 border-amber-300 text-amber-800' : 'bg-[#FAF8F5] border-[#DECDB8] text-[#1E293B] hover:bg-[#EAE3D6]'
                      }`}>
                        <Hand className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] font-medium text-[#64748B]">
                        Raise Hand
                      </span>
                    </button>

                  </div>

                </div>

              </div>

              {/* =============================================================== */}
              {/* RIGHT COLUMN (5/12): DEDICATED TABBED INTELLIGENCE PANEL         */}
              {/* (Solves the congestion by giving each section full space!)      */}
              {/* =============================================================== */}
              <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
                
                {/* Mode Selector Tabs (Case Brief vs Feedback vs Documents) */}
                <div className="p-1.5 bg-[#FAF5EB] border border-[#DECDB8] rounded-2xl flex items-center gap-1 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setRightPanelTab('context')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightPanelTab === 'context'
                        ? 'bg-white text-[#1E3A8A] shadow-xs border border-[#DECDB8]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <Folder className="w-3.5 h-3.5" />
                    <span>Case Brief</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightPanelTab('feedback')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightPanelTab === 'feedback'
                        ? 'bg-white text-[#1E3A8A] shadow-xs border border-[#DECDB8]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <BarChart2 className="w-3.5 h-3.5" />
                    <span>Score & Feedback</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRightPanelTab('documents')}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      rightPanelTab === 'documents'
                        ? 'bg-white text-[#1E3A8A] shadow-xs border border-[#DECDB8]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Docs ({activeScenario.documents.length})</span>
                  </button>
                </div>

                {/* TAB 1: CASE BRIEF & FACTS */}
                {rightPanelTab === 'context' && (
                  <div className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-2xs space-y-5 animate-in fade-in duration-150">
                    
                    {/* Case Header Card */}
                    <div className="p-4 bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold text-[#8C5320] uppercase tracking-wider block">
                            {activeScenario.category}
                          </span>
                          <h3 className="font-bold text-base text-[#1E293B] mt-0.5">
                            {activeScenario.title}
                          </h3>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-white border border-[#DECDB8] text-[10px] font-bold text-[#1E3A8A]">
                          Active Case
                        </span>
                      </div>

                      <div className="grid grid-cols-3 gap-2 pt-2.5 border-t border-[#DECDB8]/60 text-[11px] text-[#64748B]">
                        <div>
                          <span className="block text-[10px] text-[#94A3B8]">Reference</span>
                          <strong className="text-[#1E293B]">{activeScenario.caseNumber}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#94A3B8]">Filing Date</span>
                          <strong className="text-[#1E293B]">{activeScenario.filingDate}</strong>
                        </div>
                        <div>
                          <span className="block text-[10px] text-[#94A3B8]">Court Forum</span>
                          <strong className="text-[#1E293B]">{selectedCourt}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Factual Matrix */}
                    <div className="space-y-2.5">
                      <h4 className="font-bold text-xs text-[#1E293B] flex items-center justify-between">
                        <span>Factual Matrix & Grounds</span>
                        <span className="text-[10px] text-[#64748B] font-normal">{activeScenario.facts.length} core points</span>
                      </h4>

                      <div className="space-y-2 text-xs text-[#334155]">
                        {activeScenario.facts.map((fact, idx) => (
                          <div key={idx} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DECDB8]/80 flex items-start gap-2.5">
                            <span className="w-5 h-5 rounded-full bg-[#FAF5EB] text-[#8C5320] border border-[#DECDB8] font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span className="leading-relaxed">{fact}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Relevant Statutory Provisions */}
                    <div className="p-3.5 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                        Statutory Governing Provisions
                      </span>
                      <p className="text-xs text-[#1E293B] font-semibold">
                        {activeScenario.actSection}
                      </p>
                    </div>

                  </div>
                )}

                {/* TAB 2: SESSION FEEDBACK & SCORING */}
                {rightPanelTab === 'feedback' && (
                  <div className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-2xs space-y-5 animate-in fade-in duration-150">
                    
                    <div className="flex items-center justify-between pb-2 border-b border-[#FAF5EB]">
                      <div>
                        <h3 className="font-bold text-sm text-[#1E293B]">Bench Evaluation</h3>
                        <p className="text-[11px] text-[#64748B]">Real-time scoring based on oral submissions</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                        Live Assessing
                      </span>
                    </div>

                    {/* Score Gauge & Rating Bars */}
                    <div className="grid grid-cols-12 gap-4 items-center">
                      <div className="col-span-4 flex flex-col items-center justify-center p-2">
                        <div className="relative w-20 h-20 flex items-center justify-center">
                          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                            <path
                              className="text-[#E2E8F0]"
                              strokeWidth="3.5"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                            <path
                              className="text-teal-600 transition-all duration-1000 ease-out"
                              strokeDasharray="78, 100"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              stroke="currentColor"
                              fill="none"
                              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                            />
                          </svg>
                          <div className="absolute flex flex-col items-center">
                            <span className="font-bold text-xl text-[#0F172A] leading-none">78</span>
                            <span className="text-[8px] font-bold text-[#64748B] uppercase mt-0.5">Overall</span>
                          </div>
                        </div>
                      </div>

                      <div className="col-span-8 space-y-1.5 text-xs">
                        {[
                          { label: 'Legal Reasoning', score: 85, color: 'bg-emerald-500' },
                          { label: 'Use of Authorities', score: 72, color: 'bg-amber-500' },
                          { label: 'Clarity of Arguments', score: 80, color: 'bg-emerald-500' },
                          { label: 'Responsiveness', score: 75, color: 'bg-amber-500' },
                          { label: 'Courtroom Demeanour', score: 78, color: 'bg-emerald-500' },
                        ].map((bar) => (
                          <div key={bar.label} className="space-y-0.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="text-[#64748B] font-medium">{bar.label}</span>
                              <span className="font-bold text-[#1E293B]">{bar.score}</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#E2E8F0] rounded-full overflow-hidden">
                              <div
                                className={`h-full ${bar.color} rounded-full`}
                                style={{ width: `${bar.score}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Dual Insights */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Key Strengths</span>
                        </div>
                        <ul className="text-[11px] space-y-1 text-emerald-900 leading-tight">
                          <li className="flex items-start gap-1">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>Strong grasp of factual matrix</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-emerald-600 font-bold">✓</span>
                            <span>Proper reference to Section 438</span>
                          </li>
                        </ul>
                      </div>

                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-950 space-y-1.5">
                        <div className="flex items-center gap-1.5 text-rose-800 font-bold text-xs">
                          <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Areas to Improve</span>
                        </div>
                        <ul className="text-[11px] space-y-1 text-rose-900 leading-tight">
                          <li className="flex items-start gap-1">
                            <span className="text-rose-600 font-bold font-mono">!</span>
                            <span>Cite binding High Court ruling</span>
                          </li>
                          <li className="flex items-start gap-1">
                            <span className="text-rose-600 font-bold font-mono">!</span>
                            <span>Concede recovery timeline earlier</span>
                          </li>
                        </ul>
                      </div>
                    </div>

                    {/* Judicial Note */}
                    <div className="p-3.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs text-[#334155] leading-relaxed">
                      <strong className="text-[#1E293B] block text-[11px] mb-1">Bench Observation:</strong>
                      <p className="text-[11px] text-[#475569]">
                        &ldquo;You established the factual background well and identified the key legal issues. Strengthen submissions with more binding precedents and address the bench queries with direct case facts.&rdquo;
                      </p>
                    </div>

                  </div>
                )}

                {/* TAB 3: DOCUMENTS & EVIDENCE */}
                {rightPanelTab === 'documents' && (
                  <div className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-2xs space-y-4 animate-in fade-in duration-150">
                    <div className="flex items-center justify-between pb-2 border-b border-[#FAF5EB]">
                      <div>
                        <h3 className="font-bold text-sm text-[#1E293B]">Case Record & Exhibits</h3>
                        <p className="text-[11px] text-[#64748B]">Certified case files and police diary entries</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveToolModal('Upload Document')}
                        className="px-2.5 py-1 bg-[#1E3A8A] text-white rounded-lg text-xs font-semibold hover:bg-[#172554] transition flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3 h-3" />
                        <span>Upload</span>
                      </button>
                    </div>

                    <div className="space-y-2">
                      {activeScenario.documents.map((doc) => (
                        <div
                          key={doc.name}
                          onClick={() => setActiveToolModal(doc.name)}
                          className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] hover:border-[#1E3A8A] hover:bg-white transition flex items-center justify-between cursor-pointer group"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                              <FileText className="w-4 h-4 text-rose-500" />
                            </div>
                            <div>
                              <strong className="text-xs text-[#1E293B] group-hover:text-[#1E3A8A] block">
                                {doc.name}
                              </strong>
                              <span className="text-[10px] text-[#94A3B8]">{doc.pages} · Certified Copy</span>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition" />
                        </div>
                      ))}
                    </div>

                    <div className="p-3 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl text-center space-y-1">
                      <span className="text-xs font-bold text-[#8C5320]">Need additional materials?</span>
                      <p className="text-[11px] text-[#64748B]">
                        Attach case law PDFs or moot memorial references for AI bench evaluation.
                      </p>
                    </div>
                  </div>
                )}

              </div>

            </div>
          </main>

        </div>
      )}

      {/* ===================================================================== */}
      {/* 3. MODALS (ARGUMENT TOOLS & END SESSION CONFIRMATION)                 */}
      {/* ===================================================================== */}
      {activeToolModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3D6] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-2">
                <Gavel className="w-4 h-4 text-[#C59B58]" />
                <h3 className="font-bold text-base text-[#1E293B]">{activeToolModal}</h3>
              </div>
              <button
                type="button"
                onClick={() => setActiveToolModal(null)}
                className="w-8 h-8 rounded-full bg-[#FAF8F5] hover:bg-[#EAE3D6] text-[#64748B] flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#334155] leading-relaxed">
              <div className="p-3 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl space-y-2">
                <strong className="text-[#1E3A8A] block">Precedent Authority: Sushila Aggarwal v. State (NCT of Delhi) (2020)</strong>
                <p className="text-[11px] text-[#64748B]">
                  Constitution Bench held that anticipatory bail under Section 438 CrPC is a vital safeguard against arbitrary custody, and need not be restricted to fixed timelines.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setActiveToolModal(null)}
                  className="px-4 py-2 border border-[#DECDB8] rounded-xl text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5]"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setTranscripts((prev) => [
                      ...prev,
                      {
                        id: prev.length + 1,
                        sender: 'You',
                        time: 'Just now',
                        text: 'My Lord, I rely upon the landmark precedent in Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1 to urge that anticipatory bail should be granted with conditions rather than custodial arrest.'
                      }
                    ]);
                    setActiveToolModal(null);
                  }}
                  className="px-4 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs font-bold hover:bg-[#172554]"
                >
                  Insert Argument into Hearing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {endSessionConfirm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#EAE3D6] rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center">
              <PhoneOff className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-[#1E293B]">End Courtroom Session?</h3>
              <p className="text-xs text-[#64748B] mt-1">
                Your performance score of <strong>78/100</strong> and oral transcript will be saved to your Student Profile.
              </p>
            </div>
            <div className="flex items-center gap-3 justify-center pt-2">
              <button
                type="button"
                onClick={() => setEndSessionConfirm(false)}
                className="px-4 py-2 rounded-xl border border-[#DECDB8] bg-white text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Resume Hearing
              </button>
              <Link
                href={dashboardHref}
                className="px-5 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition cursor-pointer"
              >
                Confirm & Exit
              </Link>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
