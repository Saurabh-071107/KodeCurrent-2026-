'use client';

import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { api } from '@/lib/api';
import {
  SquarePen,
  Search,
  MessageSquare,
  MoreVertical,
  BookOpen,
  FileText,
  Feather,
  Scale,
  Paperclip,
  ArrowUp,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Info,
  Check,
  Copy,
  X,
  Send
} from 'lucide-react';

export interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  content: string;
  timestamp: string;
  citations?: {
    title: string;
    court: string;
    year: string;
    citation: string;
  }[];
  statutes?: {
    act: string;
    section: string;
    description: string;
  }[];
}

export interface ConversationThread {
  id: string;
  title: string;
  time: string;
  group: 'Today' | 'Yesterday' | 'This Week';
  messages: ChatMessage[];
}

const INITIAL_CONVERSATIONS: ConversationThread[] = [
  {
    id: 'conv-1',
    title: 'Section 138 latest judgments',
    time: '10:42 AM',
    group: 'Today',
    messages: [
      {
        id: 'msg-1-1',
        sender: 'user',
        content: 'What are the latest Supreme Court rulings regarding interim compensation under Section 143A and presumption under Section 139 of the Negotiable Instruments Act, 1881?',
        timestamp: '10:40 AM'
      },
      {
        id: 'msg-1-2',
        sender: 'assistant',
        content: `Under Section 138 read with Section 139 and Section 143A of the Negotiable Instruments Act, 1881, the Supreme Court has laid down significant precedents regarding interim compensation and statutory presumptions:\n\n1. **Nature of Section 143A (Interim Compensation):**\nIn *Rakesh Ranjan Shrivastava v. State of Jharkhand (2024)*, the Hon'ble Supreme Court clarified that the power under Section 143A to grant interim compensation (up to 20% of the cheque amount) is **directory and not mandatory**. The trial court must exercise sound judicial discretion, considering whether a prima facie case exists, financial capacity, and merits of the defence.\n\n2. **Statutory Presumption under Section 139:**\nIn *Bir Singh v. Mukesh Kumar (2019)* and reiterated in *Kalamani Tex v. P. Balasubramanian (2021)*, once the execution of the cheque is admitted, the presumption under Section 139 operates against the drawer. The burden shifts to the accused to rebut this presumption on a preponderance of probabilities.\n\n3. **Notice & Cause of Action:**\nStatutory notice under proviso (b) to Section 138 must be dispatched within 30 days of dishonour memo receipt. Cause of action crystallises after expiry of 15 days from receipt of notice by the drawer.`,
        timestamp: '10:42 AM',
        citations: [
          { title: 'Rakesh Ranjan Shrivastava v. State of Jharkhand', court: 'Supreme Court of India', year: '2024', citation: '2024 INSC 211' },
          { title: 'Kalamani Tex & Anr. v. P. Balasubramanian', court: 'Supreme Court of India', year: '2021', citation: '(2021) 5 SCC 283' },
          { title: 'Bir Singh v. Mukesh Kumar', court: 'Supreme Court of India', year: '2019', citation: '(2019) 4 SCC 197' }
        ],
        statutes: [
          { act: 'Negotiable Instruments Act, 1881', section: 'Section 138', description: 'Dishonour of cheque for insufficiency, etc., of funds in the account' },
          { act: 'Negotiable Instruments Act, 1881', section: 'Section 139', description: 'Presumption in favour of holder in due course' },
          { act: 'Negotiable Instruments Act, 1881', section: 'Section 143A', description: 'Power to direct interim compensation' }
        ]
      }
    ]
  },
  {
    id: 'conv-2',
    title: 'Draft legal notice',
    time: '09:15 AM',
    group: 'Today',
    messages: [
      {
        id: 'msg-2-1',
        sender: 'user',
        content: 'Draft a legal notice for recovery of outstanding commercial dues with 18% per annum interest.',
        timestamp: '09:15 AM'
      }
    ]
  },
  {
    id: 'conv-3',
    title: 'Anticipatory bail conditions',
    time: '08:20 AM',
    group: 'Today',
    messages: [
      {
        id: 'msg-3-1',
        sender: 'user',
        content: 'What are the mandatory parameters for granting anticipatory bail under Section 438 CrPC / Section 482 BNSS in economic offences?',
        timestamp: '08:20 AM'
      }
    ]
  },
  {
    id: 'conv-4',
    title: 'Digital Personal Data Protection Act summary',
    time: '11:30 PM',
    group: 'Yesterday',
    messages: [
      {
        id: 'msg-4-1',
        sender: 'user',
        content: 'Summarise key compliance requirements for Significant Data Fiduciaries under the DPDP Act, 2023.',
        timestamp: '11:30 PM'
      }
    ]
  },
  {
    id: 'conv-5',
    title: 'Medical negligence cases',
    time: '06:14 PM',
    group: 'Yesterday',
    messages: [
      {
        id: 'msg-5-1',
        sender: 'user',
        content: 'Explain the application of the Bolam Test and Jacob Mathew guidelines in medical negligence litigation.',
        timestamp: '06:14 PM'
      }
    ]
  },
  {
    id: 'conv-6',
    title: 'RTI Act key provisions',
    time: '12 Oct 2026',
    group: 'This Week',
    messages: [
      {
        id: 'msg-6-1',
        sender: 'user',
        content: 'Exemption clauses under Section 8(1) of the Right to Information Act, 2005.',
        timestamp: '12 Oct 2026'
      }
    ]
  },
  {
    id: 'conv-7',
    title: 'Landlord tenant laws',
    time: '11 Oct 2026',
    group: 'This Week',
    messages: [
      {
        id: 'msg-7-1',
        sender: 'user',
        content: 'Grounds of eviction under Rent Control Acts and requirement of bona fide personal need.',
        timestamp: '11 Oct 2026'
      }
    ]
  },
  {
    id: 'conv-8',
    title: 'Compare Sec 302 and 304',
    time: '10 Oct 2026',
    group: 'This Week',
    messages: [
      {
        id: 'msg-8-1',
        sender: 'user',
        content: 'Distinction between Murder (Section 302 IPC / Section 103 BNS) and Culpable Homicide not amounting to murder (Section 304 IPC / Section 105 BNS).',
        timestamp: '10 Oct 2026'
      }
    ]
  }
];

const QUICK_ACTIONS = [
  {
    id: 'action-1',
    title: 'Find latest judgments',
    example: 'E.g. Section 138 NI Act',
    prompt: 'Find the latest Supreme Court judgments interpreting Section 138 of the Negotiable Instruments Act, 1881 and its recent guidelines.',
    icon: BookOpen
  },
  {
    id: 'action-2',
    title: 'Explain a legal concept',
    example: 'E.g. Anticipatory bail',
    prompt: 'Explain the principles governing anticipatory bail under Indian criminal jurisprudence, including landmark judgments and test parameters.',
    icon: FileText
  },
  {
    id: 'action-3',
    title: 'Help with drafting',
    example: 'E.g. Legal notice, affidavit',
    prompt: 'Help me draft a formal legal notice for breach of contract and recovery of unpaid commercial debt with statutory interest.',
    icon: Feather
  },
  {
    id: 'action-4',
    title: 'Compare provisions',
    example: 'E.g. Section 302 vs 304',
    prompt: 'Provide a structured legal comparison between Culpable Homicide (Section 299/304 IPC; Sec 100/105 BNS) and Murder (Section 300/302 IPC; Sec 101/103 BNS).',
    icon: Scale
  }
];

const SEARCH_MODES = [
  { id: 'standard', name: 'Standard Mode', desc: 'Fast, balanced answers with verified legal rationale' },
  { id: 'deep', name: 'Deep Research', desc: 'Comprehensive case law citations and precedent analysis' },
  { id: 'statute', name: 'Statute Analysis', desc: 'Section-by-section breakdown with legislative intent' },
  { id: 'case-match', name: 'Case Law Match', desc: 'Matches facts to High Court & Supreme Court precedents' }
];

interface LegalResearchProps {
  initialUserName?: string;
  initialUserRole?: string;
  defaultRole?: string;
}

export default function LegalResearch({
  initialUserName = 'Adv. Saurabh',
  initialUserRole = 'Advocate · High Court',
  defaultRole = 'advocate'
}: LegalResearchProps = {}) {
  // Conversation History State
  const [conversations, setConversations] = useState<ConversationThread[]>(INITIAL_CONVERSATIONS);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Chat Input State
  const [inputMessage, setInputMessage] = useState('');
  const [selectedMode, setSelectedMode] = useState('Standard Mode');
  const [modeDropdownOpen, setModeDropdownOpen] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeConversation = conversations.find(c => c.id === activeConvId);

  // Fetch dynamic research threads from backend
  useEffect(() => {
    api.getResearchThreads().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setConversations(res.data);
      }
    }).catch(() => {});
  }, []);

  // Auto-scroll on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages, isTyping]);

  // Start a new conversation
  const handleNewConversation = () => {
    setActiveConvId(null);
    setInputMessage('');
    if (inputRef.current) inputRef.current.focus();
    setMobileDrawerOpen(false);
  };

  // Submit a query
  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputMessage).trim();
    if (!query) return;

    if (!activeConvId) {
      // Create new conversation
      const newId = `conv-${Date.now()}`;
      const newThread: ConversationThread = {
        id: newId,
        title: query.length > 36 ? query.slice(0, 36) + '...' : query,
        time: 'Just now',
        group: 'Today',
        messages: [
          {
            id: `msg-${Date.now()}-user`,
            sender: 'user',
            content: query,
            timestamp: 'Just now'
          }
        ]
      };

      setConversations([newThread, ...conversations]);
      setActiveConvId(newId);
      setInputMessage('');
      simulateAIResponse(newId, query);
    } else {
      // Append to active conversation
      const userMsg: ChatMessage = {
        id: `msg-${Date.now()}-user`,
        sender: 'user',
        content: query,
        timestamp: 'Just now'
      };

      setConversations(prev =>
        prev.map(c => {
          if (c.id === activeConvId) {
            return {
              ...c,
              messages: [...c.messages, userMsg]
            };
          }
          return c;
        })
      );

      setInputMessage('');
      simulateAIResponse(activeConvId, query);
    }
  };

  // Simulated AI Legal Research Response
  const simulateAIResponse = (threadId: string, userQuery: string) => {
    setIsTyping(true);

    setTimeout(() => {
      let responseContent = '';
      let citations: ChatMessage['citations'] = [];
      let statutes: ChatMessage['statutes'] = [];

      if (userQuery.toLowerCase().includes('138') || userQuery.toLowerCase().includes('cheque')) {
        responseContent = `Under Section 138 of the Negotiable Instruments Act, 1881, the criminal offence of cheque bounce requires the satisfaction of strict statutory ingredients:\n\n1. **Drawing of Cheque & Legal Liability:** The cheque must have been issued in discharge, in whole or in part, of any legally enforceable debt or other liability.\n\n2. **Bank Dishonour:** The cheque must be presented within its validity period (3 months) and returned unpaid due to insufficiency of funds or account closed.\n\n3. **Statutory Demand Notice:** The payee must make a demand for payment in writing within 30 days of receiving the memo of dishonour.\n\n4. **15-Day Grace Period:** The drawer is afforded 15 days from notice receipt to pay. Failure to pay creates the cause of action.\n\n5. **Recent Precedent:** In *Sunil Todi v. State of Gujarat (2022)*, the Supreme Court ruled that a cheque issued as "security" can also attract Section 138 if a debt existed on the date of presentation.`;
        citations = [
          { title: 'Sunil Todi & Ors. v. State of Gujarat & Anr.', court: 'Supreme Court of India', year: '2022', citation: '(2022) 16 SCC 760' },
          { title: 'Dashrath Rupsingh Rathod v. State of Maharashtra', court: 'Supreme Court of India', year: '2014', citation: '(2014) 9 SCC 129' }
        ];
        statutes = [
          { act: 'Negotiable Instruments Act, 1881', section: 'Section 138', description: 'Dishonour of cheque for insufficiency of funds' },
          { act: 'Negotiable Instruments Act, 1881', section: 'Section 142', description: 'Cognizance of offences' }
        ];
      } else if (userQuery.toLowerCase().includes('bail')) {
        responseContent = `The grant of anticipatory bail is governed by equitable principles balancing personal liberty under Article 21 and the integrity of criminal investigation:\n\n1. **Parameters Established in *Sushila Aggarwal (2020)*:**\n- Anticipatory bail need not be for a limited duration and normally continues until trial.\n- Considerations include nature and gravity of accusation, role attributed, criminal antecedents, and flight risk.\n\n2. **Cooperation with Investigation:**\nThe accused must make themselves available for interrogation as required under Section 438(2) CrPC / Section 482(2) BNSS and not tamper with evidence or witness testimony.`;
        citations = [
          { title: 'Sushila Aggarwal & Ors. v. State (NCT of Delhi)', court: 'Supreme Court of India (Constitution Bench)', year: '2020', citation: '(2020) 5 SCC 1' },
          { title: 'Gurbaksh Singh Sibbia v. State of Punjab', court: 'Supreme Court of India', year: '1980', citation: '(1980) 2 SCC 565' }
        ];
      } else {
        responseContent = `Based on Indian legal principles and statutory provisions, here is the legal analysis for your research query:\n\n1. **Statutory Framework:**\nThe matter is primarily governed by codified statutory provisions and established judicial doctrine under the Constitution of India and relevant procedural codes.\n\n2. **Ratio Decidendi & Standard of Proof:**\nThe courts apply the doctrine of judicial precedent (*stare decisis*). In civil matters, the standard of proof is on a preponderance of probabilities, whereas criminal culpability requires proof beyond reasonable doubt.\n\n3. **Practical Strategy:**\nIt is advisable to verify statutory limitations, jurisdictional prerequisites, and procedural compliances before instituting formal pleadings.`;
        citations = [
          { title: 'Kesavananda Bharati v. State of Kerala', court: 'Supreme Court of India', year: '1973', citation: '(1973) 4 SCC 225' },
          { title: 'Maneka Gandhi v. Union of India', court: 'Supreme Court of India', year: '1978', citation: '(1978) 1 SCC 248' }
        ];
      }

      const aiMsg: ChatMessage = {
        id: `msg-${Date.now()}-ai`,
        sender: 'assistant',
        content: responseContent,
        timestamp: 'Just now',
        citations,
        statutes
      };

      setConversations(prev =>
        prev.map(c => {
          if (c.id === threadId) {
            return {
              ...c,
              messages: [...c.messages, aiMsg]
            };
          }
          return c;
        })
      );

      setIsTyping(false);
    }, 1200);
  };

  // Copy message text
  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMsgId(id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  // Filter conversations based on search
  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups: ('Today' | 'Yesterday' | 'This Week')[] = ['Today', 'Yesterday', 'This Week'];

  return (
    <div className="flex-1 flex h-[calc(100vh-4rem)] xl:h-screen bg-[#FAF8F5] text-[#0F172A] font-sans antialiased overflow-hidden relative">
      
      {/* ======================================================================= */}
      {/* 1. LEFT CONVERSATIONS PANEL (Exact Mockup Match)                         */}
      {/* ======================================================================= */}
      <aside
        className={`fixed xl:static inset-y-0 left-0 z-40 w-72 sm:w-80 bg-white xl:bg-[#FAF8F5]/60 border-r border-[#EAE3D6] flex flex-col justify-between transition-transform duration-300 xl:translate-x-0 ${
          mobileDrawerOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full overflow-hidden">
          
          {/* Header: Title + New Conversation Button */}
          <div className="p-4 sm:p-5 pb-3 flex items-center justify-between border-b border-[#EAE3D6]/60">
            <h2 className="text-base sm:text-[17px] font-bold text-[#0F172A] tracking-tight">
              Conversations
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleNewConversation}
                className="p-1.5 text-[#475569] hover:text-[#0F172A] hover:bg-[#F4ECE1] rounded-lg transition-colors cursor-pointer"
                title="New conversation"
                aria-label="New conversation"
              >
                <SquarePen className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setMobileDrawerOpen(false)}
                className="xl:hidden p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                aria-label="Close drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Search Conversations Input */}
          <div className="px-4 py-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="w-full pl-9 pr-3.5 py-2 bg-white border border-[#EAE3D6] rounded-xl text-xs sm:text-[13px] text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:border-[#1E3A8A] transition-colors shadow-2xs"
              />
            </div>
          </div>

          {/* Grouped Threads List */}
          <div className="flex-1 overflow-y-auto px-3 py-2 space-y-4 scrollbar-thin">
            {groups.map(group => {
              const groupConvs = filteredConversations.filter(c => c.group === group);
              if (groupConvs.length === 0) return null;

              return (
                <div key={group} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold tracking-wider text-[#64748B] uppercase">
                    {group}
                  </div>
                  
                  {groupConvs.map(conv => {
                    const isActive = activeConvId === conv.id;
                    return (
                      <div
                        key={conv.id}
                        onClick={() => {
                          setActiveConvId(conv.id);
                          setMobileDrawerOpen(false);
                        }}
                        className={`group relative flex items-center justify-between px-3 py-2.5 rounded-xl text-left cursor-pointer transition-all ${
                          isActive
                            ? 'bg-[#EBF2FC] text-[#1E3A8A] shadow-2xs font-semibold'
                            : 'text-[#334155] hover:bg-[#F2ECE1]/70'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0 pr-2">
                          <MessageSquare
                            className={`w-4 h-4 mt-0.5 shrink-0 transition-colors ${
                              isActive ? 'text-[#1E3A8A]' : 'text-[#94A3B8] group-hover:text-[#475569]'
                            }`}
                          />
                          <div className="min-w-0">
                            <p className="text-xs sm:text-[13px] font-medium truncate leading-snug">
                              {conv.title}
                            </p>
                            <span className="text-[10px] text-[#8C7355] block mt-0.5">
                              {conv.time}
                            </span>
                          </div>
                        </div>

                        {/* 3-dots Menu Button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                          }}
                          className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded transition-colors opacity-70 group-hover:opacity-100"
                          aria-label="More options"
                        >
                          <MoreVertical className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}

            {filteredConversations.length === 0 && (
              <div className="text-center py-8 text-xs text-[#94A3B8]">
                No conversations found
              </div>
            )}
          </div>

        </div>
      </aside>

      {/* Backdrop for Mobile Drawer */}
      {mobileDrawerOpen && (
        <div
          onClick={() => setMobileDrawerOpen(false)}
          className="fixed inset-0 bg-black/30 backdrop-blur-xs z-30 xl:hidden"
        />
      )}

      {/* ======================================================================= */}
      {/* 2. RIGHT / MAIN AREA: Legal Research Assistant                           */}
      {/* ======================================================================= */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        
        {/* Top Mobile Bar to toggle conversations drawer */}
        <div className="xl:hidden flex items-center justify-between px-4 py-2.5 bg-white border-b border-[#EAE3D6] z-10 shrink-0">
          <button
            type="button"
            onClick={() => setMobileDrawerOpen(true)}
            className="flex items-center gap-2 text-xs font-semibold text-[#1E3A8A] px-2.5 py-1.5 rounded-lg border border-[#EAE3D6] bg-[#FAF8F5]"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Conversations</span>
          </button>
          <button
            type="button"
            onClick={handleNewConversation}
            className="p-1.5 text-[#1E3A8A] rounded-lg border border-[#EAE3D6] bg-[#FAF8F5]"
            title="New conversation"
          >
            <SquarePen className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic Content: Welcome Screen OR Chat Messages */}
        <div className="flex-1 overflow-y-auto relative flex flex-col justify-between">
          
          {!activeConversation ? (
            /* =============================================================== */
            /* WELCOME SCREEN (Exact Match to Mockup with Watercolour Monument)  */
            /* =============================================================== */
            <div className="relative flex-1 flex flex-col justify-center items-center px-4 sm:px-6 md:px-10 py-8 max-w-4xl mx-auto w-full">
              
              {/* TOP RIGHT WATERCOLOUR MONUMENT WATERMARK */}
              <div 
                className="absolute top-0 right-0 w-72 sm:w-96 md:w-[480px] lg:w-[560px] h-60 sm:h-72 md:h-84 lg:h-96 pointer-events-none select-none z-0 overflow-hidden"
                style={{
                  maskImage: 'radial-gradient(ellipse at 80% 20%, black 45%, transparent 75%)',
                  WebkitMaskImage: 'radial-gradient(ellipse at 80% 20%, black 45%, transparent 75%)',
                }}
              >
                <Image
                  src="/assets/supreme-court-watercolour.png"
                  alt="Supreme Court Watercolour Monument"
                  fill
                  className="object-contain object-top-right mix-blend-multiply opacity-90"
                  priority
                />
              </div>

              {/* CENTER HEADLINE & BRANDING */}
              <div className="relative z-10 text-center max-w-2xl mx-auto pt-6 sm:pt-10">
                {/* Spaced Small Caps Tag */}
                <span className="text-[11px] sm:text-xs font-semibold tracking-[0.25em] text-[#8C7355] uppercase block mb-3 font-serif">
                  N E X O R A &nbsp; A I
                </span>

                {/* Main Headline */}
                <h1 className="font-serif-title text-4xl sm:text-5xl md:text-[54px] lg:text-[60px] font-bold text-[#0F172A] tracking-tight leading-[1.08] select-none">
                  Your Legal<br />
                  Research Assistant
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-[#475569] font-normal leading-relaxed mt-4 max-w-lg mx-auto">
                  Ask questions, find relevant cases and laws, understand legal concepts, or get help with drafting and research.
                </p>
              </div>

              {/* 4 PROMPT CARDS (2x2 Grid) */}
              <div className="relative z-10 grid grid-cols-1 sm:grid-cols-2 gap-3.5 sm:gap-4 w-full max-w-2xl mt-8 sm:mt-10 mb-8">
                {QUICK_ACTIONS.map(action => {
                  const Icon = action.icon;
                  return (
                    <div
                      key={action.id}
                      onClick={() => handleSendMessage(action.prompt)}
                      className="group bg-white/90 hover:bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-4 sm:p-4.5 flex items-center justify-between transition-all hover:shadow-xs cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#C59B58] flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-[#0F172A] leading-snug">
                            {action.title}
                          </h3>
                          <p className="text-xs text-[#64748B] mt-0.5 truncate">
                            {action.example}
                          </p>
                        </div>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#94A3B8] group-hover:text-[#0F172A] group-hover:translate-x-0.5 transition-all shrink-0 ml-2" />
                    </div>
                  );
                })}
              </div>

            </div>
          ) : (
            /* =============================================================== */
            /* ACTIVE CHAT VIEW (Live Q&A with Legal Citations)                 */
            /* =============================================================== */
            <div className="flex-1 px-4 sm:px-6 md:px-12 py-6 max-w-4xl mx-auto w-full space-y-6">
              
              {/* Active Conversation Title Header */}
              <div className="pb-4 border-b border-[#EAE3D6] flex items-center justify-between">
                <div>
                  <h2 className="font-serif-title text-xl sm:text-2xl font-bold text-[#0F172A]">
                    {activeConversation.title}
                  </h2>
                  <span className="text-xs text-[#8C7355] mt-0.5 block">
                    Thread started {activeConversation.time}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleNewConversation}
                  className="flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] bg-[#EBF2FC] hover:bg-[#BFDBFE]/60 px-3 py-1.5 rounded-lg border border-[#BFDBFE] transition-colors"
                >
                  <SquarePen className="w-3.5 h-3.5" />
                  <span>New Query</span>
                </button>
              </div>

              {/* Message Feed */}
              {activeConversation.messages.map(msg => (
                <div
                  key={msg.id}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-2xl sm:max-w-3xl rounded-2xl p-4 sm:p-5 shadow-2xs ${
                      msg.sender === 'user'
                        ? 'bg-[#1E3A8A] text-white rounded-br-xs'
                        : 'bg-white border border-[#DECDB8] text-[#0F172A] rounded-bl-xs'
                    }`}
                  >
                    {/* Assistant Header Tag */}
                    {msg.sender === 'assistant' && (
                      <div className="flex items-center justify-between pb-3 mb-3 border-b border-[#F0E9DF]">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-md bg-[#FAF0DE] border border-[#ECD9BC] text-[#C59B58] flex items-center justify-center font-bold text-xs">
                            <Sparkles className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs font-bold text-[#0F172A]">
                            Nexora Legal Research
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleCopy(msg.id, msg.content)}
                            className="p-1 text-[#64748B] hover:text-[#0F172A] rounded hover:bg-[#FAF8F5] transition-colors"
                            title="Copy response"
                          >
                            {copiedMsgId === msg.id ? (
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Message Body */}
                    <div className="text-xs sm:text-[13.5px] leading-relaxed whitespace-pre-line font-normal">
                      {msg.content}
                    </div>

                    {/* Legal Citations Card (if available) */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-[#F0E9DF] space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C7355]">
                          <BookOpen className="w-3.5 h-3.5" />
                          <span>Judicial Precedents & Citations</span>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1.5">
                          {msg.citations.map((cite, idx) => (
                            <div
                              key={idx}
                              className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] text-left hover:border-[#1E3A8A]/40 transition-colors"
                            >
                              <p className="text-xs font-bold text-[#0F172A] truncate">
                                {cite.title}
                              </p>
                              <p className="text-[11px] text-[#64748B] mt-0.5">
                                {cite.court} · {cite.year}
                              </p>
                              <span className="inline-block mt-1 text-[10px] font-bold text-[#1E3A8A] bg-[#EBF2FC] px-1.5 py-0.5 rounded border border-[#BFDBFE]">
                                {cite.citation}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Statutory References Card (if available) */}
                    {msg.statutes && msg.statutes.length > 0 && (
                      <div className="mt-3 pt-2.5 border-t border-[#F0E9DF] space-y-1.5">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-[#8C7355]">
                          <Scale className="w-3.5 h-3.5" />
                          <span>Relevant Statutory Provisions</span>
                        </div>
                        <div className="space-y-1.5 mt-1">
                          {msg.statutes.map((stat, idx) => (
                            <div
                              key={idx}
                              className="p-2 rounded-lg bg-[#FAF8F5] border border-[#DECDB8] flex items-center justify-between text-xs"
                            >
                              <div>
                                <span className="font-bold text-[#0F172A]">{stat.section}: </span>
                                <span className="text-[#475569]">{stat.description}</span>
                              </div>
                              <span className="text-[10px] font-semibold text-[#8C7355] shrink-0 ml-2">
                                {stat.act}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <span
                      className={`text-[10px] mt-2 block ${
                        msg.sender === 'user' ? 'text-white/70 text-right' : 'text-[#94A3B8]'
                      }`}
                    >
                      {msg.timestamp}
                    </span>
                  </div>
                </div>
              ))}

              {/* Typing Animation */}
              {isTyping && (
                <div className="flex items-center gap-2 p-3 bg-white border border-[#DECDB8] rounded-2xl w-fit shadow-2xs">
                  <div className="w-5 h-5 rounded-md bg-[#FAF0DE] border border-[#ECD9BC] text-[#C59B58] flex items-center justify-center animate-spin">
                    <Sparkles className="w-3 h-3" />
                  </div>
                  <span className="text-xs text-[#64748B] font-medium">
                    Searching Indian case laws & statutes...
                  </span>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}

          {/* =============================================================== */}
          {/* FLOATING BOTTOM INPUT BAR (Exact Match to Mockup)                */}
          {/* =============================================================== */}
          <div className="relative z-20 px-4 sm:px-6 md:px-10 pb-5 pt-3 bg-gradient-to-t from-[#FAF8F5] via-[#FAF8F5] to-transparent">
            <div className="max-w-3xl w-full mx-auto">
              
              {/* Rounded Capsule Input Bar */}
              <div className="bg-white border border-[#DECDB8] rounded-full p-2 pl-3.5 sm:pl-5 pr-2.5 flex items-center gap-2 sm:gap-3 shadow-lg shadow-black/4 focus-within:border-[#1E3A8A]/50 focus-within:ring-2 focus-within:ring-[#1E3A8A]/10 transition-all">
                
                {/* Paperclip Attachment Button */}
                <button
                  type="button"
                  className="p-1.5 text-[#64748B] hover:text-[#0F172A] rounded-full hover:bg-[#FAF8F5] transition-colors cursor-pointer shrink-0"
                  title="Attach legal document or citation"
                  aria-label="Attach file"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {/* Question Input */}
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={e => setInputMessage(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Ask a legal question..."
                  className="flex-1 bg-transparent border-none outline-none text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] font-normal"
                />

                {/* Search Mode Dropdown Selector */}
                <div className="relative shrink-0">
                  <button
                    type="button"
                    onClick={() => setModeDropdownOpen(!modeDropdownOpen)}
                    className="bg-[#F4ECE1]/80 hover:bg-[#F4ECE1] border border-[#DECDB8] px-2.5 sm:px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-[#0F172A] cursor-pointer transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span className="hidden sm:inline">{selectedMode}</span>
                    <span className="sm:hidden">{selectedMode.replace(' Mode', '')}</span>
                    <ChevronDown className="w-3 h-3 text-[#64748B]" />
                  </button>

                  {/* Mode Dropdown Menu */}
                  {modeDropdownOpen && (
                    <div className="absolute right-0 bottom-full mb-2 w-64 bg-white border border-[#DECDB8] rounded-2xl shadow-xl p-2 z-50">
                      <div className="text-[10px] font-bold uppercase tracking-wider text-[#8C7355] px-2.5 py-1">
                        Research Engine
                      </div>
                      {SEARCH_MODES.map(mode => (
                        <button
                          key={mode.id}
                          type="button"
                          onClick={() => {
                            setSelectedMode(mode.name);
                            setModeDropdownOpen(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-xl hover:bg-[#FAF8F5] transition-colors flex flex-col ${
                            selectedMode === mode.name ? 'bg-[#EBF2FC] text-[#1E3A8A]' : 'text-[#0F172A]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold">{mode.name}</span>
                            {selectedMode === mode.name && (
                              <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />
                            )}
                          </div>
                          <span className="text-[10px] text-[#64748B] mt-0.5">
                            {mode.desc}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Dark Navy Circular Send Button */}
                <button
                  type="button"
                  onClick={() => handleSendMessage()}
                  disabled={!inputMessage.trim()}
                  className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    inputMessage.trim()
                      ? 'bg-[#0F172A] hover:bg-[#1E293B] text-white shadow-xs cursor-pointer hover:scale-105 active:scale-95'
                      : 'bg-[#0F172A] text-white opacity-90 cursor-pointer'
                  }`}
                  aria-label="Send query"
                >
                  <ArrowUp className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2.5]" />
                </button>

              </div>

              {/* Disclaimer */}
              <p className="text-[11px] text-[#64748B] text-center mt-2.5 flex items-center justify-center gap-1.5 select-none">
                <Info className="w-3.5 h-3.5 shrink-0 text-[#94A3B8]" />
                <span>AI can make mistakes. Always verify information from official legal sources.</span>
              </p>

            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
