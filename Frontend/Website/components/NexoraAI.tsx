'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Search,
  Plus,
  RefreshCw,
  Folder,
  FileText,
  Sparkles,
  Paperclip,
  ArrowUp,
  MoreVertical,
  ChevronRight,
  ExternalLink,
  ChevronDown,
  Scale,
  Target,
  BookOpen,
  SlidersHorizontal,
  Clock,
  Send,
  MessageSquare,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';

export interface CaseMatter {
  id: string;
  title: string;
  caseNumber: string;
  category: string;
  court: string;
  documentsCount: number;
  documents: Array<{
    name: string;
    type: 'pdf' | 'doc';
    date: string;
    size: string;
  }>;
  timeline: Array<{
    date: string;
    event: string;
    active?: boolean;
  }>;
  judgments: Array<{
    title: string;
    citation: string;
    principle: string;
  }>;
}

const MATTERS: CaseMatter[] = [
  {
    id: 'matter-1',
    title: 'Sharma vs Mehta',
    caseNumber: 'CS/1023/2024',
    category: 'Civil Suit',
    court: 'Bombay High Court',
    documentsCount: 12,
    documents: [
      { name: 'Plaint.pdf', type: 'pdf', date: '12 Aug 2024', size: '2.4 MB' },
      { name: 'Written Statement.pdf', type: 'pdf', date: '28 Aug 2024', size: '3.1 MB' },
      { name: 'Replication.pdf', type: 'doc', date: '14 Jan 2025', size: '1.8 MB' },
      { name: 'Additional Affidavit (Defendant).pdf', type: 'pdf', date: '20 Oct 2026', size: '1.2 MB' },
      { name: 'Previous Order.pdf', type: 'doc', date: '05 Oct 2026', size: '0.9 MB' }
    ],
    timeline: [
      { date: '20 Oct 2026', event: 'Additional affidavit filed by defendant', active: true },
      { date: '05 Oct 2026', event: 'Previous hearing & order on injunction' },
      { date: '14 Jan 2025', event: 'Replication filed by plaintiff' },
      { date: '28 Aug 2024', event: 'Written statement filed' },
      { date: '12 Aug 2024', event: 'Plaint instituted & registered' }
    ],
    judgments: [
      {
        title: 'Salem Advocate Bar Association v. UOI',
        citation: '(2005) 6 SCC 344',
        principle: 'Courts can refuse belated documents if it causes prejudice and delay.'
      },
      {
        title: 'Kailash v. Nanhku',
        citation: '(2005) 4 SCC 480',
        principle: 'Additional evidence should not be allowed to fill up lacunae.'
      },
      {
        title: 'Arjun Singh v. Mohindra Kumar',
        citation: 'AIR 1964 SC 993',
        principle: 'Discretion to allow additional evidence must be exercised judiciously.'
      }
    ]
  },
  {
    id: 'matter-2',
    title: 'Madhav Traders vs Apex Logistics',
    caseNumber: 'ARB/402/2025',
    category: 'Commercial Arbitration',
    court: 'Arbitral Tribunal Mumbai',
    documentsCount: 18,
    documents: [
      { name: 'Arbitration_Notice_Claim.pdf', type: 'pdf', date: '10 Feb 2025', size: '4.2 MB' },
      { name: 'Statement_of_Defence_Apex.pdf', type: 'pdf', date: '15 Mar 2025', size: '5.5 MB' },
      { name: 'Interim_Application_Sec17.pdf', type: 'pdf', date: '18 Jul 2025', size: '2.1 MB' }
    ],
    timeline: [
      { date: '18 Oct 2026', event: 'Cross-examination of claimant witness', active: true },
      { date: '12 Sep 2026', event: 'Framing of arbitration issues' },
      { date: '10 Feb 2025', event: 'Section 11 tribunal constitution' }
    ],
    judgments: [
      {
        title: 'Vidya Drolia v. Durga Trading Corp.',
        citation: '(2021) 2 SCC 1',
        principle: 'Arbitrability standards and jurisdiction under Sec 8 & 11.'
      },
      {
        title: 'Associate Builders v. DDA',
        citation: '(2015) 3 SCC 49',
        principle: 'Scope of public policy interference in arbitral awards.'
      }
    ]
  }
];

export interface DiscussionThread {
  id: string;
  title: string;
  time: string;
  group: 'Today' | 'Previous';
}

const INITIAL_DISCUSSIONS: DiscussionThread[] = [
  { id: 'disc-1', title: 'Strategy on additional affidavit', time: '10:24 AM', group: 'Today' },
  { id: 'disc-2', title: 'Arguments on maintainability', time: '09:15 AM', group: 'Today' },
  { id: 'disc-3', title: 'Drafting reply points', time: '08:30 AM', group: 'Today' },
  { id: 'disc-4', title: 'Analysis of similar judgements', time: '24 Oct 2026', group: 'Previous' },
  { id: 'disc-5', title: 'Question on limitation', time: '20 Oct 2026', group: 'Previous' },
  { id: 'disc-6', title: 'Relief and alternatives', time: '18 Oct 2026', group: 'Previous' },
  { id: 'disc-7', title: 'Evidence strategy', time: '15 Oct 2026', group: 'Previous' },
  { id: 'disc-8', title: 'Court fee issue', time: '12 Oct 2026', group: 'Previous' }
];

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  timestamp: string;
  content?: string;
  structuredResponse?: {
    intro?: string;
    keyPosition?: string;
    mainArguments?: string[];
    proceduralSteps?: string[];
    references?: Array<{
      title: string;
      citation: string;
      principle: string;
    }>;
    statutoryProvisions?: Array<{
      act: string;
      section: string;
      description?: string;
    }>;
  };
}

const INITIAL_MESSAGES_BY_DISCUSSION: Record<string, ChatMessage[]> = {
  'disc-1': [
    {
      id: 'msg-1-1',
      sender: 'user',
      timestamp: '10:24 AM',
      content:
        'The opposing party has filed an additional affidavit. Based on the documents in this matter and similar cases, what should be our approach? Give me concrete points for arguments with proper legal references.'
    },
    {
      id: 'msg-1-2',
      sender: 'assistant',
      timestamp: '10:25 AM',
      structuredResponse: {
        intro:
          'Based on the case documents, timeline and comparable judgments, here is a structured strategy with arguments and references.',
        keyPosition:
          'We can oppose the additional affidavit on the ground of belated filing and prejudice, unless the court is satisfied that it is necessary for determining the real controversy. Our primary submission should be to reject it, or in the alternative, to seek time and an opportunity to file a detailed reply.',
        mainArguments: [
          'The affidavit is filed at a belated stage without sufficient cause, which may cause prejudice to our client.',
          'It introduces new facts which could and should have been raised earlier.',
          'Allowing it would delay the proceedings and defeat the principle of finality.',
          'We are ready to meet the new contentions, and in the alternative, request time to file a reply if the court is inclined to consider it.'
        ],
        proceduralSteps: [
          'Record an oral objection on maintainability and lack of leave under Order VIII Rule 9 CPC.',
          'Request reasonable time (minimum 2 weeks) to file a formal counter-affidavit if the court takes it on record.'
        ],
        references: [
          {
            title: 'Salem Advocate Bar Association v. Union of India',
            citation: '(2005) 6 SCC 344',
            principle: 'Courts can refuse belated documents if it causes prejudice and delay.'
          },
          {
            title: 'Kailash v. Nanhku',
            citation: '(2005) 4 SCC 480',
            principle: 'Additional evidence should not be allowed to fill up lacunae.'
          },
          {
            title: 'Arjun Singh v. Mohindra Kumar',
            citation: 'AIR 1964 SC 993',
            principle: 'Discretion to allow additional evidence must be exercised judiciously.'
          }
        ]
      }
    }
  ],
  'disc-2': [
    {
      id: 'msg-2-1',
      sender: 'user',
      timestamp: '09:15 AM',
      content:
        'Opposing counsel claims the plaint lacks a cause of action and is barred by limitation. What are our strongest preliminary maintainability arguments under CPC?'
    },
    {
      id: 'msg-2-2',
      sender: 'assistant',
      timestamp: '09:16 AM',
      structuredResponse: {
        intro:
          'Maintainability assessment under Order VII Rule 11 of the Code of Civil Procedure, 1908 (CPC):',
        keyPosition:
          'At the Order VII Rule 11 stage, only averments in the plaint are to be read as true; defenses in the written statement cannot be looked into.',
        mainArguments: [
          'Cause of action is a bundle of essential facts disclosed across paragraphs of the plaint; mere absence of hyper-technical terms does not warrant rejection.',
          'Limitation is a mixed question of law and fact requiring trial and cannot be determined on a demurrer application where continuous cause of action is pleaded.',
          'Opposing party cannot rely on evidentiary defenses at the threshold of maintainability.'
        ],
        proceduralSteps: [
          'Direct the Court to paragraphs 8 to 14 of the Plaint where continuous accrual is explicitly detailed.',
          'Cite Dahiben and Saleem Bhai on demurrer scope.'
        ],
        references: [
          {
            title: 'Dahiben v. Arvindbhai Kalyanji Bhanusali',
            citation: '(2020) 7 SCC 366',
            principle: 'Plaint must be read as a whole to determine whether cause of action is disclosed.'
          },
          {
            title: 'Saleem Bhai v. State of Maharashtra',
            citation: '(2003) 1 SCC 557',
            principle: 'For purposes of Order VII Rule 11, only the averments in the plaint are germane.'
          }
        ]
      }
    }
  ],
  'disc-8': [
    {
      id: 'msg-8-1',
      sender: 'user',
      timestamp: '12 Oct 2026',
      content:
        'The registry has flagged a deficit court fee issue on our valuation of relief. What are our procedural options and arguments under the Court Fees Act and CPC?'
    },
    {
      id: 'msg-8-2',
      sender: 'assistant',
      timestamp: '12 Oct 2026',
      structuredResponse: {
        intro:
          'Legal strategy for Court Fee valuation and curing defect under Court Fees Act, 1870 and Section 149 CPC:',
        keyPosition:
          'Apply under Section 149 CPC for enlargement of time to deposit any determined deficiency, preserving the original presentation date for limitation purposes.',
        mainArguments: [
          'Section 149 CPC gives the Court wide discretionary power to permit payment of deficit court fees, relating back to original date of institution.',
          'Valuation is governed by the primary relief claimed under the Suits Valuation Act, 1887 and consequential reliefs cannot be taxed independently when arising from the same cause.',
          'Court fee deficiency is a curable procedural irregularity between litigant and revenue, not a substantive bar extinguishing the suit.'
        ],
        proceduralSteps: [
          'File an application under Section 149 read with Section 151 CPC stating reasons for bona fide valuation calculation.',
          'Seek 14 days extension to pay any differential stamp duty as directed by the Taxing Officer/Court.'
        ],
        references: [
          {
            title: 'A. Nawab John v. V.N. Subramaniyam',
            citation: '(2012) 7 SCC 738',
            principle: 'Discretion under Section 149 CPC to condone delay in court fees deposit.'
          },
          {
            title: 'Suhrid Singh @ Sardool Singh v. Randhir Singh',
            citation: '(2010) 12 SCC 112',
            principle: 'Computation of court fees in suits for declaration with consequential relief.'
          },
          {
            title: 'Tara Devi v. Sri Thakur Radha Krishna Maharaj',
            citation: '(1987) 4 SCC 69',
            principle: 'Plaintiff has liberty to value suit unless demonstrably arbitrary.'
          }
        ]
      }
    }
  ]
};

const INITIAL_MESSAGES: ChatMessage[] = INITIAL_MESSAGES_BY_DISCUSSION['disc-1'];

interface NexoraAIProps {
  role?: 'advocate' | 'firm';
  initialUserName?: string;
  initialUserRole?: string;
  dashboardHref?: string;
}

export default function NexoraAI({
  role = 'advocate',
  initialUserName,
  initialUserRole,
  dashboardHref = '/advocate'
}: NexoraAIProps) {
  // Left lane visibility state (Hideable side lane)
  const [isLeftLaneVisible, setIsLeftLaneVisible] = useState(true);

  // Active Matter
  const [selectedMatterIndex, setSelectedMatterIndex] = useState(0);
  const currentMatter = MATTERS[selectedMatterIndex];

  // Discussions
  const [discussions, setDiscussions] = useState<DiscussionThread[]>(INITIAL_DISCUSSIONS);
  const [activeDiscussionId, setActiveDiscussionId] = useState('disc-1');
  const [searchDiscussion, setSearchDiscussion] = useState('');

  // Chat conversation by discussion thread
  const [threadsMessages, setThreadsMessages] = useState<Record<string, ChatMessage[]>>(INITIAL_MESSAGES_BY_DISCUSSION);
  const currentMessages = threadsMessages[activeDiscussionId] || [
    {
      id: `msg-welcome-${activeDiscussionId}`,
      sender: 'assistant',
      timestamp: 'Just now',
      content: `Ready to assist on ${discussions.find((d) => d.id === activeDiscussionId)?.title || 'case strategy'}. What specific procedural or statutory query would you like to examine regarding ${currentMatter.title}?`
    }
  ];
  const [inputPrompt, setInputPrompt] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, isTyping]);

  // AI Mode
  const [aiMode, setAiMode] = useState<'Standard Mode' | 'Deep Research Mode' | 'Drafting Mode' | 'Cross-Exam Mode'>('Standard Mode');
  const [isModeDropdownOpen, setIsModeDropdownOpen] = useState(false);

  // Mobile drawer states
  const [leftDrawerOpen, setLeftDrawerOpen] = useState(false);
  const [rightDrawerOpen, setRightDrawerOpen] = useState(false);

  // Switch to next matter
  const handleSwitchMatter = () => {
    setSelectedMatterIndex((prev) => (prev + 1) % MATTERS.length);
  };

  // Filter discussions
  const filteredDiscussions = discussions.filter((d) =>
    d.title.toLowerCase().includes(searchDiscussion.toLowerCase())
  );

  // Add new discussion
  const handleNewDiscussion = () => {
    const newId = `disc-${Date.now()}`;
    const newDisc: DiscussionThread = {
      id: newId,
      title: 'New Strategy Discussion',
      time: 'Just now',
      group: 'Today'
    };
    setDiscussions([newDisc, ...discussions]);
    setActiveDiscussionId(newId);
    setThreadsMessages((prev) => ({
      ...prev,
      [newId]: [
        {
          id: `msg-${Date.now()}`,
          sender: 'assistant',
          timestamp: 'Just now',
          content: `Analyzing records for ${currentMatter.title} (${currentMatter.caseNumber}). What would you like to explore regarding this matter? You can test litigation positions, query pleadings, or prepare rebuttal points.`
        }
      ]
    }));
  };

  // Submit query
  const handleSendMessage = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = inputPrompt.trim();
    if (!query || isTyping) return;

    const userMsg: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      sender: 'user',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      content: query
    };

    const targetDiscussionId = activeDiscussionId;

    // Optimistically update conversation for immediate user feedback
    setThreadsMessages((prev) => ({
      ...prev,
      [targetDiscussionId]: [...(prev[targetDiscussionId] || currentMessages), userMsg]
    }));
    setInputPrompt('');
    setIsTyping(true);

    const matterContext = `Matter: ${currentMatter.title} (${currentMatter.caseNumber}), Forum: ${currentMatter.court}, Category: ${currentMatter.category}. Recent Timeline: ${currentMatter.timeline.map((t) => `${t.date}: ${t.event}`).join('; ')}`;

    api.askNexoraAi({
      query,
      matterContext,
      aiMode,
      discussionId: targetDiscussionId
    }).then((res) => {
      setIsTyping(false);
      if (res.success && res.data) {
        const d = res.data;
        const hasStructured = Array.isArray(d.mainArguments) && d.mainArguments.length > 0;

        const aiResponse: ChatMessage = {
          id: `msg-${Date.now()}-ai`,
          sender: 'assistant',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          structuredResponse: hasStructured ? {
            intro: d.summary || `Strategic analysis for ${currentMatter.title}:`,
            keyPosition: d.keyPosition || 'Maintain jurisdictional and procedural grounds.',
            mainArguments: d.mainArguments,
            proceduralSteps: d.proceduralSteps || [],
            references: d.references || [],
            statutoryProvisions: d.statutoryProvisions || []
          } : undefined,
          content: !hasStructured ? (d.summary || (typeof d === 'string' ? d : JSON.stringify(d, null, 2))) : undefined
        };

        setThreadsMessages((prev) => ({
          ...prev,
          [targetDiscussionId]: [...(prev[targetDiscussionId] || []), aiResponse]
        }));
      } else {
        const errorText = res.error?.message || res.message || 'Unable to complete case consultation inquiry at this moment.';
        setThreadsMessages((prev) => ({
          ...prev,
          [targetDiscussionId]: [
            ...(prev[targetDiscussionId] || []),
            {
              id: `msg-${Date.now()}-err`,
              sender: 'assistant',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
              content: `NEXORA AI Notice: ${errorText}`
            }
          ]
        }));
      }
    }).catch((err) => {
      setIsTyping(false);
      setThreadsMessages((prev) => ({
        ...prev,
        [targetDiscussionId]: [
          ...(prev[targetDiscussionId] || []),
          {
            id: `msg-${Date.now()}-err`,
            sender: 'assistant',
            timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            content: `Connection notice: ${err.message || 'Failed to reach NEXORA AI.'}`
          }
        ]
      }));
    });
  };


  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-2px)] bg-[#FAF8F5] text-[#1E293B] overflow-hidden select-none">
      
      {/* Mobile Top Bar to Toggle Left & Right Drawers */}
      <div className="xl:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-[#EAE3D6] text-sm font-semibold">
        <button
          type="button"
          onClick={() => setLeftDrawerOpen(!leftDrawerOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] text-[#1E3A8A]"
        >
          <Folder className="w-4 h-4 text-[#C59B58]" />
          <span>Discussions</span>
        </button>
        <span className="font-bold text-base text-[#1E3A8A]">Nexora AI</span>
        <button
          type="button"
          onClick={() => setRightDrawerOpen(!rightDrawerOpen)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] text-[#1E3A8A]"
        >
          <FileText className="w-4 h-4 text-[#1E3A8A]" />
          <span>Case Context</span>
        </button>
      </div>

      {/* 3-Panel Workstation Layout */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* =================================================================== */}
        {/* PANEL 1 (LEFT): Current Matter Selector + Hideable Discussions Lane */}
        {/* =================================================================== */}
        {isLeftLaneVisible && (
          <aside
            className={`w-72 sm:w-84 border-r border-[#EAE3D6] bg-white flex flex-col z-30 transition-all duration-200 overflow-y-auto ${
              leftDrawerOpen
                ? 'fixed inset-y-0 left-0 shadow-2xl flex'
                : 'hidden xl:flex'
            }`}
          >
            {/* Top Box: Current Matter Card + Collapse Toggle */}
            <div className="p-4 sm:p-5 border-b border-[#EAE3D6] bg-[#FAF8F5]/60">
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4 text-[#C59B58]" />
                  <span className="font-bold text-sm text-[#1E293B]">Current Matter</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={handleSwitchMatter}
                    className="p-1.5 rounded-lg hover:bg-white text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title="Switch active matter"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsLeftLaneVisible(false)}
                    className="p-1.5 rounded-lg hover:bg-white text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer hidden xl:block"
                    title="Hide discussions lane"
                  >
                    <PanelLeftClose className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Matter Capsule Card */}
              <div
                onClick={handleSwitchMatter}
                className="p-3.5 bg-white border border-[#EAE3D6] rounded-xl flex items-center justify-between gap-3 cursor-pointer hover:border-[#1E3A8A]/40 transition group shadow-2xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-[#1E293B] truncate group-hover:text-[#1E3A8A]">
                      {currentMatter.title}
                    </p>
                    <p className="text-xs text-[#64748B] truncate mt-0.5">
                      {currentMatter.caseNumber} · {currentMatter.category}
                    </p>
                    <p className="text-xs text-[#8C7355] truncate mt-0.5">
                      {currentMatter.court}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
              </div>
            </div>

            {/* New Discussion Header + Search */}
            <div className="p-4 sm:p-5 border-b border-[#EAE3D6] space-y-3.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-[#1E293B]">New Discussion</span>
                <button
                  type="button"
                  onClick={handleNewDiscussion}
                  className="w-8 h-8 rounded-lg border border-[#DECDB8] bg-[#FAF8F5] hover:bg-[#EFE8DC] text-[#1E3A8A] flex items-center justify-center transition cursor-pointer shadow-2xs"
                  title="Start new discussion"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {/* Search Discussions Input */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchDiscussion}
                  onChange={(e) => setSearchDiscussion(e.target.value)}
                  placeholder="Search discussions..."
                  className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs sm:text-sm text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none focus:ring-1 focus:ring-[#1E3A8A]"
                />
              </div>
            </div>

            {/* Scrollable Discussion Threads List */}
            <div className="flex-1 overflow-y-auto p-3.5 space-y-4">
              {(['Today', 'Previous'] as const).map((group) => {
                const threads = filteredDiscussions.filter((d) => d.group === group);
                if (threads.length === 0) return null;

                return (
                  <div key={group} className="space-y-1.5">
                    <span className="text-xs font-bold tracking-wider text-[#8C7355] uppercase px-2.5">
                      {group}
                    </span>
                    <div className="space-y-1 mt-1">
                      {threads.map((thread) => {
                        const isActive = thread.id === activeDiscussionId;
                        return (
                          <div
                            key={thread.id}
                            onClick={() => {
                              setActiveDiscussionId(thread.id);
                              if (leftDrawerOpen) setLeftDrawerOpen(false);
                            }}
                            className={`w-full p-3 rounded-xl flex items-center justify-between gap-3 text-left cursor-pointer transition relative ${
                              isActive
                                ? 'bg-[#EEF4FF] border-l-4 border-l-[#1E3A8A] text-[#1E3A8A] font-bold shadow-2xs'
                                : 'text-[#475569] hover:bg-[#FAF8F5] hover:text-[#1E293B]'
                            }`}
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <MessageSquare
                                className={`w-4 h-4 flex-shrink-0 ${
                                  isActive ? 'text-[#1E3A8A]' : 'text-[#94A3B8]'
                                }`}
                              />
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm truncate font-medium">
                                  {thread.title}
                                </p>
                                <p className="text-xs text-[#94A3B8] mt-0.5">
                                  {thread.time}
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                alert('Discussion options');
                              }}
                              className="p-1 text-[#94A3B8] hover:text-[#1E293B] rounded-md hover:bg-white"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Mobile close button */}
            {leftDrawerOpen && (
              <div className="p-3.5 border-t border-[#EAE3D6] xl:hidden">
                <button
                  type="button"
                  onClick={() => setLeftDrawerOpen(false)}
                  className="w-full py-2.5 bg-[#FAF8F5] text-sm font-semibold text-[#1E293B] rounded-xl"
                >
                  Close Drawer
                </button>
              </div>
            )}
          </aside>
        )}

        {/* =================================================================== */}
        {/* PANEL 2 (CENTER): AI STRATEGY WORKSTATION (NON-SCROLLABLE CONTAINER)*/}
        {/* =================================================================== */}
        <main className="flex-1 flex flex-col justify-between h-full bg-[#FAF8F5] min-w-0 overflow-hidden relative">
          
          {/* Top Bar with Hideable Lane Button & Matter Badge */}
          <div className="px-5 sm:px-8 py-3.5 border-b border-[#EAE3D6] bg-white/70 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {!isLeftLaneVisible && (
                <button
                  type="button"
                  onClick={() => setIsLeftLaneVisible(true)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-[#DECDB8] bg-white text-xs sm:text-sm font-semibold text-[#1E3A8A] hover:bg-[#FAF5EB] transition shadow-2xs cursor-pointer"
                  title="Show discussions lane"
                >
                  <PanelLeftOpen className="w-4 h-4 text-[#1E3A8A]" />
                  <span>Discussions</span>
                </button>
              )}
              <div className="flex items-center gap-2">
                <Scale className="w-4 h-4 text-[#1E3A8A]" />
                <span className="font-bold text-sm sm:text-base text-[#1E293B]">
                  Case Intelligence Workstation
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs sm:text-sm text-[#64748B]">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="font-medium">{currentMatter.title} Active Context</span>
            </div>
          </div>

          {/* Main Messages Canvas — Scrollable and dynamic per active discussion */}
          <div className="flex-1 p-4 sm:p-6 md:p-8 overflow-y-auto space-y-6 max-w-4xl w-full mx-auto scroll-smooth">
            {currentMessages.map((msg) => {
              if (msg.sender === 'user') {
                return (
                  <div key={msg.id} className="flex items-start gap-3 justify-end">
                    <div className="max-w-2xl text-right">
                      <div className="bg-[#FAF5EB] border border-[#DECDB8] rounded-2xl rounded-tr-sm p-4 sm:p-5 text-sm sm:text-base text-[#1E293B] leading-relaxed shadow-2xs text-left whitespace-pre-wrap">
                        {msg.content}
                      </div>
                      <span className="text-xs text-[#94A3B8] mt-1 mr-1.5 block">
                        {msg.timestamp}
                      </span>
                    </div>
                    <div className="w-9 h-9 rounded-full bg-[#1E3A8A] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs">
                      {initialUserName ? initialUserName.charAt(0).toUpperCase() : 'S'}
                    </div>
                  </div>
                );
              }

              // Assistant message
              return (
                <div key={msg.id} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-full bg-[#EBF2FC] border border-[#BFDBFE] text-[#1E3A8A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                    <Scale className="w-4 h-4 text-[#1E3A8A]" />
                  </div>

                  <div className="flex-1 max-w-3xl space-y-4">
                    {msg.structuredResponse ? (
                      <>
                        {msg.structuredResponse.intro && (
                          <p className="text-sm sm:text-base font-medium text-[#334155] leading-relaxed">
                            {msg.structuredResponse.intro}
                          </p>
                        )}

                        {/* 1. Key Position */}
                        {msg.structuredResponse.keyPosition && (
                          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-2">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#1E293B]">
                              <Target className="w-4 h-4 text-[#C59B58]" />
                              <span>1. Key Position</span>
                            </div>
                            <p className="text-sm sm:text-base text-[#475569] leading-relaxed whitespace-pre-wrap">
                              {msg.structuredResponse.keyPosition}
                            </p>
                          </div>
                        )}

                        {/* 2. Main Arguments */}
                        {msg.structuredResponse.mainArguments && msg.structuredResponse.mainArguments.length > 0 && (
                          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#1E293B]">
                              <FileText className="w-4 h-4 text-[#1E3A8A]" />
                              <span>2. Main Arguments</span>
                            </div>

                            <div className="space-y-2.5">
                              {msg.structuredResponse.mainArguments.map((arg, idx) => (
                                <div key={idx} className="flex items-start gap-3 text-sm sm:text-base text-[#475569] leading-relaxed">
                                  <span className="w-5 h-5 rounded-full bg-[#FAF8F5] border border-[#DECDB8] text-xs font-bold text-[#1E293B] flex items-center justify-center flex-shrink-0 mt-0.5">
                                    {idx + 1}
                                  </span>
                                  <span>{arg}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 3. Procedural Steps */}
                        {msg.structuredResponse.proceduralSteps && msg.structuredResponse.proceduralSteps.length > 0 && (
                          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#1E293B]">
                              <Clock className="w-4 h-4 text-[#1E3A8A]" />
                              <span>3. Procedural Steps & Next Actions</span>
                            </div>

                            <div className="space-y-2">
                              {msg.structuredResponse.proceduralSteps.map((step, idx) => (
                                <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#475569]">
                                  <span className="w-1.5 h-1.5 rounded-full bg-[#1E3A8A] mt-2 flex-shrink-0" />
                                  <span>{step}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 4. Supporting Legal References */}
                        {msg.structuredResponse.references && msg.structuredResponse.references.length > 0 && (
                          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                            <div className="flex items-center justify-between pb-1">
                              <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#1E293B]">
                                <BookOpen className="w-4 h-4 text-[#8C7355]" />
                                <span>Supporting Legal References</span>
                              </div>
                              <Link
                                href={role === 'firm' ? '/firm/legal-library/judgments' : '/advocate/legal-library/judgments'}
                                className="text-xs sm:text-sm font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1 cursor-pointer"
                              >
                                <span>View in Library</span>
                                <ChevronRight className="w-4 h-4" />
                              </Link>
                            </div>

                            <div className="divide-y divide-[#EAE3D6]/70">
                              {msg.structuredResponse.references.map((ref, idx) => (
                                <div
                                  key={idx}
                                  className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-[#FAF8F5]/60 rounded-lg px-2 transition"
                                >
                                  <div>
                                    <p className="font-bold text-xs sm:text-sm text-[#1E293B]">
                                      {ref.title}
                                    </p>
                                    <p className="text-xs text-[#64748B]">
                                      {ref.citation}
                                    </p>
                                  </div>
                                  <div className="flex items-center gap-2 text-xs sm:text-sm text-[#475569]">
                                    <span className="leading-snug">{ref.principle}</span>
                                    <Link
                                      href={`${role === 'firm' ? '/firm/legal-library/judgments' : '/advocate/legal-library/judgments'}?query=${encodeURIComponent(ref.title)}`}
                                      className="p-1 text-[#64748B] hover:text-[#1E3A8A] cursor-pointer"
                                      title="Open citation in Legal Library"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* 5. Statutory Provisions */}
                        {msg.structuredResponse.statutoryProvisions && msg.structuredResponse.statutoryProvisions.length > 0 && (
                          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs space-y-3">
                            <div className="flex items-center gap-2 text-sm sm:text-base font-bold text-[#1E293B]">
                              <Scale className="w-4 h-4 text-[#1E3A8A]" />
                              <span>Statutory Provisions</span>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {msg.structuredResponse.statutoryProvisions.map((stat, idx) => (
                                <div key={idx} className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] text-xs">
                                  <span className="font-bold text-[#1E3A8A] block">{stat.act} - Section {stat.section}</span>
                                  {stat.description && <span className="text-[#64748B] text-[11px] mt-0.5 block">{stat.description}</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs text-sm sm:text-base text-[#1E293B] leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </div>
                    )}

                    <span className="text-xs text-[#94A3B8] block ml-1">
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}

            {/* Typing Indicator */}
            {isTyping && (
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 rounded-full bg-[#EBF2FC] border border-[#BFDBFE] text-[#1E3A8A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Scale className="w-4 h-4 text-[#1E3A8A]" />
                </div>
                <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 shadow-2xs flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#1E3A8A] animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#1E3A8A] animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[#1E3A8A] animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-[#64748B]">
                    NEXORA AI is formulating litigation strategy...
                  </span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Floating Bottom Input Bar */}
          <div className="p-4 sm:p-6 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent flex-shrink-0">
            <form
              onSubmit={handleSendMessage}
              className="max-w-4xl mx-auto bg-white border border-[#EAE3D6] rounded-2xl sm:rounded-full p-2.5 pl-4 sm:pl-5 shadow-md flex flex-wrap sm:flex-nowrap items-center gap-3 transition focus-within:ring-2 focus-within:ring-[#1E3A8A]/30 focus-within:border-[#1E3A8A]"
            >
              {/* Paperclip attachment */}
              <button
                type="button"
                onClick={() => alert(`Attach document to matter: ${currentMatter.title}`)}
                className="p-2 text-[#64748B] hover:text-[#1E3A8A] rounded-full hover:bg-[#FAF8F5] transition cursor-pointer"
                title="Attach case document"
              >
                <Paperclip className="w-4 h-4" />
              </button>

              {/* Text Input with Enter key handling */}
              <input
                type="text"
                value={inputPrompt}
                onChange={(e) => setInputPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a follow-up question or discuss your strategy..."
                className="flex-1 bg-transparent text-sm sm:text-base text-[#1E293B] placeholder:text-[#94A3B8] focus:outline-none min-w-[200px]"
              />

              {/* Mode Dropdown Selector */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsModeDropdownOpen(!isModeDropdownOpen)}
                  className="bg-[#EEF4FF] hover:bg-[#DBEAFE] text-[#1E3A8A] border border-[#BFDBFE] text-xs sm:text-sm font-semibold px-3.5 py-1.5 rounded-full flex items-center gap-1.5 transition cursor-pointer"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>{aiMode}</span>
                  <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />
                </button>

                {isModeDropdownOpen && (
                  <div className="absolute right-0 bottom-full mb-2 w-52 bg-white border border-[#EAE3D6] rounded-xl shadow-xl p-1 z-50 text-xs sm:text-sm">
                    {(
                      [
                        'Standard Mode',
                        'Deep Research Mode',
                        'Drafting Mode',
                        'Cross-Exam Mode'
                      ] as const
                    ).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          setAiMode(mode);
                          setIsModeDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg font-medium transition cursor-pointer ${
                          aiMode === mode
                            ? 'bg-[#1E3A8A] text-white font-bold'
                            : 'text-[#475569] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        {mode}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Royal Blue Send Button */}
              <button
                type="submit"
                onClick={() => handleSendMessage()}
                disabled={!inputPrompt.trim() || isTyping}
                className="w-10 h-10 rounded-full bg-[#1E3A8A] hover:bg-[#1D4ED8] disabled:opacity-40 text-white flex items-center justify-center flex-shrink-0 shadow-xs transition cursor-pointer"
                title="Send query"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            </form>
          </div>
        </main>

        {/* =================================================================== */}
        {/* PANEL 3 (RIGHT): Case Intelligence & Documents (Scrollable Lane)   */}
        {/* =================================================================== */}
        <aside
          className={`w-72 sm:w-84 border-l border-[#EAE3D6] bg-white flex flex-col z-30 transition-all duration-200 overflow-y-auto ${
            rightDrawerOpen
              ? 'fixed inset-y-0 right-0 shadow-2xl flex'
              : 'hidden lg:flex'
          }`}
        >
          {/* Card 1: Case Context */}
          <div className="p-4 sm:p-5 border-b border-[#EAE3D6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1E293B]">
                <Folder className="w-4 h-4 text-[#C59B58]" />
                <span>Case Context</span>
              </div>
              <button
                type="button"
                onClick={() => alert('View all case details')}
                className="text-xs sm:text-[13px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                <Folder className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="font-bold text-sm text-[#1E293B] truncate">
                  {currentMatter.title}
                </p>
                <p className="text-xs text-[#64748B] truncate mt-0.5">
                  {currentMatter.caseNumber} · {currentMatter.category}
                </p>
                <p className="text-xs text-[#8C7355] truncate mt-0.5">
                  {currentMatter.court}
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Key Documents (12) */}
          <div className="p-4 sm:p-5 border-b border-[#EAE3D6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1E293B]">
                <FileText className="w-4 h-4 text-[#1E3A8A]" />
                <span>Key Documents ({currentMatter.documentsCount})</span>
              </div>
              <button
                type="button"
                onClick={() => alert('View all case documents')}
                className="text-xs sm:text-[13px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2">
              {currentMatter.documents.map((doc, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl border border-[#EAE3D6]/70 hover:border-[#1E3A8A]/40 bg-[#FAF8F5]/50 flex items-center justify-between gap-2.5 transition cursor-pointer hover:bg-white"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-[10px] flex-shrink-0 ${
                        doc.type === 'pdf'
                          ? 'bg-rose-100 text-rose-700'
                          : 'bg-blue-100 text-blue-700'
                      }`}
                    >
                      {doc.type.toUpperCase()}
                    </span>
                    <div className="min-w-0">
                      <p className="font-semibold text-xs sm:text-sm text-[#1E293B] truncate">
                        {doc.name}
                      </p>
                      <p className="text-xs text-[#94A3B8] mt-0.5">{doc.date}</p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      alert(`Document options: ${doc.name}`);
                    }}
                    className="p-1 text-[#94A3B8] hover:text-[#1E293B] rounded-md"
                  >
                    <MoreVertical className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Card 3: Case Timeline */}
          <div className="p-4 sm:p-5 border-b border-[#EAE3D6] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1E293B]">
                <Clock className="w-4 h-4 text-[#B45309]" />
                <span>Case Timeline</span>
              </div>
              <button
                type="button"
                onClick={() => alert('View full milestone timeline')}
                className="text-xs sm:text-[13px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="relative pl-4 space-y-4 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-[1.5px] before:bg-[#EAE3D6]">
              {currentMatter.timeline.map((item, idx) => (
                <div key={idx} className="relative flex items-start gap-3 text-xs sm:text-sm">
                  <span
                    className={`w-3.5 h-3.5 rounded-full absolute -left-4 top-1 ring-2 ring-white flex-shrink-0 ${
                      item.active ? 'bg-[#D97706]' : 'bg-[#94A3B8]'
                    }`}
                  />
                  <div>
                    <span className="font-bold text-xs sm:text-sm text-[#1E293B] block leading-none">
                      {item.date}
                    </span>
                    <span className="text-xs sm:text-sm text-[#64748B] leading-tight block mt-1">
                      {item.event}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Card 4: Similar Judgments */}
          <div className="p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1E293B]">
                <Sparkles className="w-4 h-4 text-[#D97706]" />
                <span>Similar Judgments</span>
              </div>
              <button
                type="button"
                onClick={() => alert('View all cited judgments')}
                className="text-xs sm:text-[13px] font-semibold text-[#1E3A8A] hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>

            <div className="space-y-2.5">
              {currentMatter.judgments.map((j, idx) => (
                <div
                  key={idx}
                  onClick={() => alert(`View precedent: ${j.title}`)}
                  className="p-3 rounded-xl border border-[#EAE3D6] hover:border-[#1E3A8A]/40 bg-[#FAF8F5]/60 flex items-center justify-between gap-2.5 transition cursor-pointer hover:bg-white group"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <BookOpen className="w-4 h-4 text-[#8C7355] flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="font-bold text-xs sm:text-sm text-[#1E293B] truncate group-hover:text-[#1E3A8A]">
                        {j.title}
                      </p>
                      <p className="text-xs text-[#64748B] truncate mt-0.5">
                        {j.citation}
                      </p>
                    </div>
                  </div>
                  <ExternalLink className="w-4 h-4 text-[#94A3B8] flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Mobile close button */}
          {rightDrawerOpen && (
            <div className="p-3.5 border-t border-[#EAE3D6] lg:hidden">
              <button
                type="button"
                onClick={() => setRightDrawerOpen(false)}
                className="w-full py-2.5 bg-[#FAF8F5] text-sm font-semibold text-[#1E293B] rounded-xl"
              >
                Close Context
              </button>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
