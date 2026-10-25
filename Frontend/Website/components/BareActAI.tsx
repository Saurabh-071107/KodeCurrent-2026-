'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Sparkles,
  Paperclip,
  Mic,
  ArrowUp,
  FileText,
  Scale,
  Bookmark,
  CheckCircle2,
  X,
  Copy,
  Check,
  Lightbulb
} from 'lucide-react';

export interface BareActItem {
  id: string;
  name: string;
  category: 'Criminal' | 'Civil' | 'Constitutional' | 'Others';
  year: number;
  totalSections: number | string;
  enactedDate: string;
  summary: string;
  keySections: Array<{
    number: string;
    title: string;
    plainExplanation: string;
    ingredients: string[];
    precedent: string;
    newActEquivalent?: string;
  }>;
}

const BARE_ACTS_DATA: BareActItem[] = [
  {
    id: 'act-1',
    name: 'Constitution of India',
    category: 'Constitutional',
    year: 1950,
    totalSections: '395 Articles (12 Schedules)',
    enactedDate: '26 January 1950',
    summary: 'The supreme legal document of the Republic of India laying down fundamental rights, directive principles, and the framework of governance.',
    keySections: [
      {
        number: 'Article 21',
        title: 'Protection of Life and Personal Liberty',
        plainExplanation: 'No citizen can be deprived of their life or personal liberty except according to procedure established by law. The Supreme Court has expanded this to include the right to privacy, clean environment, speedy trial, and human dignity.',
        ingredients: [
          'Deprivation of life or liberty must be sanctioned by a valid legislative Act.',
          'The law and procedure must be just, fair, and reasonable (Maneka Gandhi doctrine).'
        ],
        precedent: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248 · K.S. Puttaswamy v. Union of India (2017) 10 SCC 1 (Right to Privacy)'
      },
      {
        number: 'Article 32',
        title: 'Remedies for enforcement of Fundamental Rights',
        plainExplanation: 'The constitutional heart and soul granting citizens the right to move the Supreme Court directly for the issuance of prerogative writs (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari).',
        ingredients: ['Infringement of a guaranteed Part III Fundamental Right.', 'Direct invocation of original Supreme Court jurisdiction.'],
        precedent: 'Fertilizer Corporation Kamagar Union v. Union of India (1981) 1 SCC 568'
      }
    ]
  },
  {
    id: 'act-2',
    name: 'Indian Penal Code, 1860',
    category: 'Criminal',
    year: 1860,
    totalSections: '511 Sections',
    enactedDate: '1 January 1862',
    summary: 'The principal substantive criminal law of India defining offences and prescribing punishments. Cross-referenced with the newly enacted Bharatiya Nyaya Sanhita (BNS), 2023.',
    keySections: [
      {
        number: 'Section 302',
        title: 'Punishment for Murder',
        plainExplanation: 'Prescribes the statutory penalty for committing murder as defined in Section 300 IPC. Punishable with death or imprisonment for life, and shall also be liable to fine.',
        ingredients: [
          'Actus reus: Causing the death of a human being.',
          'Mens rea: Intention to cause death, or intention to cause bodily injury sufficient in the ordinary course of nature to cause death.'
        ],
        precedent: 'Bachan Singh v. State of Punjab (1980) 2 SCC 684 (Rarest of Rare Doctrine)',
        newActEquivalent: 'Bharatiya Nyaya Sanhita (BNS) 2023, Section 103'
      },
      {
        number: 'Section 420',
        title: 'Cheating and dishonestly inducing delivery of property',
        plainExplanation: 'Whoever cheats and thereby dishonestly induces the deceived party to deliver any property, punishable with imprisonment up to 7 years and fine.',
        ingredients: ['Fraudulent or dishonest representation.', 'Inducement to deliver property or alter valuable security.'],
        precedent: 'Vesa Holdings P. Ltd. v. State of Kerala (2015) 8 SCC 293',
        newActEquivalent: 'Bharatiya Nyaya Sanhita (BNS) 2023, Section 318(4)'
      }
    ]
  },
  {
    id: 'act-3',
    name: 'Code of Criminal Procedure, 1973',
    category: 'Criminal',
    year: 1973,
    totalSections: '484 Sections',
    enactedDate: '1 April 1974',
    summary: 'Procedural machinery for investigation, arrest, bail, trial, and appeals in criminal offenses. Cross-referenced with Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.',
    keySections: [
      {
        number: 'Section 145 & 146',
        title: 'Disputes concerning land or water likely to cause breach of peace',
        plainExplanation: 'Section 145 empowers Executive Magistrates to determine actual physical possession on the date of preliminary order to avert violence. Section 146 empowers attachment of property in cases of emergency or indeterminable possession.',
        ingredients: [
          'Report of police or information showing dispute likely to breach peace.',
          'Dispute concerns immovable property within local jurisdiction.',
          'Emergency attachment under Section 146 until competent civil court adjudicates.'
        ],
        precedent: 'Mathuralal v. Bhanwarlal (1979) 4 SCC 665',
        newActEquivalent: 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Sections 168 & 169'
      },
      {
        number: 'Section 438',
        title: 'Direction for grant of bail to person apprehending arrest (Anticipatory Bail)',
        plainExplanation: 'Empowers the High Court and Court of Session to grant pre-arrest protection to an accused who has reasonable grounds to apprehend arrest in a non-bailable case.',
        ingredients: ['Reasonable belief of imminent arrest.', 'Non-bailable offense allegation.', 'Conditions imposed under Section 438(2).'],
        precedent: 'Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1',
        newActEquivalent: 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Section 482'
      }
    ]
  },
  {
    id: 'act-4',
    name: 'Indian Evidence Act, 1872',
    category: 'Criminal',
    year: 1872,
    totalSections: '167 Sections',
    enactedDate: '1 September 1872',
    summary: 'The law of admissibility, relevancy, and burden of proof governing judicial trials. Cross-referenced with Bharatiya Sakshya Adhiniyam (BSA), 2023.',
    keySections: [
      {
        number: 'Section 65B',
        title: 'Admissibility of electronic records',
        plainExplanation: 'Mandates an authentic certificate signed by an authorized person in control of the electronic device to admit electronic printouts, emails, or call records into evidence.',
        ingredients: ['Certificate under Section 65B(4) is mandatory.', 'Produced at the time of leading secondary electronic evidence.'],
        precedent: 'Arjun Khotkar v. Kailash Kushanrao Gorantyal (2020) 7 SCC 1',
        newActEquivalent: 'Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63'
      }
    ]
  },
  {
    id: 'act-5',
    name: 'Code of Civil Procedure, 1908',
    category: 'Civil',
    year: 1908,
    totalSections: '158 Sections & 51 Orders',
    enactedDate: '1 January 1909',
    summary: 'The foundational procedural code regulating civil litigation, pleadings, injunctions, and execution of decrees in Indian courts.',
    keySections: [
      {
        number: 'Order XXXIX Rule 1 & 2',
        title: 'Temporary Injunctions and Interlocutory Orders',
        plainExplanation: 'Equitable interim remedy restraining a defendant from wasting, damaging, alienating, or creating third-party rights on the suit property pending final trial.',
        ingredients: ['Prima facie case.', 'Balance of convenience in favor of plaintiff.', 'Irreparable injury if injunction not granted.'],
        precedent: 'Gujarat Bottling Co. Ltd. v. Coca Cola Co. (1995) 5 SCC 545'
      }
    ]
  },
  {
    id: 'act-6',
    name: 'Transfer of Property Act, 1882',
    category: 'Civil',
    year: 1882,
    totalSections: '137 Sections',
    enactedDate: '1 July 1882',
    summary: 'Statute governing inter vivos transfers of immovable property including sales, mortgages, leases, exchanges, and gifts.',
    keySections: [
      {
        number: 'Section 53A',
        title: 'Part Performance',
        plainExplanation: 'Equitable shield protecting a buyer who has paid consideration and taken possession under an unregistered agreement to sell against eviction by the transferor.',
        ingredients: ['Written and signed contract.', 'Transferee in possession in furtherance of contract.', 'Willingness to perform balance obligations.'],
        precedent: 'Shrimant Shamrao Suryavanshi v. Pralhad Bhairoba Suryavanshi (2002) 3 SCC 676'
      }
    ]
  },
  {
    id: 'act-7',
    name: 'Indian Contract Act, 1872',
    category: 'Civil',
    year: 1872,
    totalSections: '238 Sections',
    enactedDate: '1 September 1872',
    summary: 'Governs formation, performance, frustration, and breach of contracts, indemnity, guarantee, and agency in India.',
    keySections: [
      {
        number: 'Section 73 & 74',
        title: 'Compensation for breach and liquidated damages',
        plainExplanation: 'Section 73 provides unliquidated compensation for natural loss. Section 74 governs pre-agreed reasonable liquidated damages without requiring proof of actual loss.',
        ingredients: ['Breach of valid contract.', 'Damage naturally arising in the usual course.', 'Reasonable compensation up to stipulated penalty.'],
        precedent: 'Kailash Nath Associates v. DDA (2015) 4 SCC 136'
      }
    ]
  },
  {
    id: 'act-8',
    name: 'Specific Relief Act, 1963',
    category: 'Civil',
    year: 1963,
    totalSections: '44 Sections',
    enactedDate: '1 March 1964',
    summary: 'Provides equitable remedies including specific performance of contracts, rectification of instruments, and declaratory decrees post-2018 amendment.',
    keySections: [
      {
        number: 'Section 10',
        title: 'Specific performance in respect of contracts',
        plainExplanation: 'Post-2018 amendment, granting specific performance is mandatory for civil courts and no longer a purely discretionary relief.',
        ingredients: ['Valid enforceable contract.', 'Subject only to limited exceptions in Sections 11(2), 14, and 16.'],
        precedent: 'B. Santoshamma v. D. Sarala (2020) 19 SCC 80'
      }
    ]
  },
  {
    id: 'act-9',
    name: 'Right to Information Act, 2005',
    category: 'Others',
    year: 2005,
    totalSections: '31 Sections',
    enactedDate: '12 October 2005',
    summary: 'Mandates timely response to citizen requests for government data, records, and decisions to foster transparency and combat corruption.',
    keySections: [
      {
        number: 'Section 8',
        title: 'Exemption from disclosure of information',
        plainExplanation: 'Enumerates specific exemptions from disclosure including national sovereignty, cabinet papers, trade secrets, and personal privacy unless overridden by public interest.',
        ingredients: ['Prejudice to security or judicial proceedings.', 'Fiduciary capacity records unless larger public interest demands.'],
        precedent: 'Central Board of Secondary Education v. Aditya Bandopadhyay (2011) 8 SCC 497'
      }
    ]
  },
  {
    id: 'act-10',
    name: 'Motor Vehicles Act, 1988',
    category: 'Others',
    year: 1988,
    totalSections: '217 Sections',
    enactedDate: '1 July 1989',
    summary: 'Law relating to road transport vehicles, licensing, registration, third-party insurance, and accident claim tribunals (MACT).',
    keySections: [
      {
        number: 'Section 166',
        title: 'Application for compensation',
        plainExplanation: 'Permits victims of vehicular accidents or their legal heirs to apply before the Motor Accidents Claims Tribunal for just and fair compensation on fault or no-fault basis.',
        ingredients: ['Accident arising out of use of motor vehicle.', 'Filed by injured victim or legal representatives of deceased.'],
        precedent: 'National Insurance Co. Ltd. v. Pranay Sethi (2017) 16 SCC 680'
      }
    ]
  },
  {
    id: 'act-11',
    name: 'Information Technology Act, 2000',
    category: 'Others',
    year: 2000,
    totalSections: '94 Sections',
    enactedDate: '17 October 2000',
    summary: 'Primary law dealing with cybercrime, electronic commerce, intermediary liability safe harbor, and digital signatures in India.',
    keySections: [
      {
        number: 'Section 79',
        title: 'Exemption from liability of intermediary in certain cases',
        plainExplanation: 'Safe harbor provision shielding digital platforms and intermediaries from third-party content provided they observe statutory due diligence and remove unlawful content upon receiving actual court knowledge.',
        ingredients: ['Platform acts merely as a conduit.', 'Intermediary does not initiate or modify the transmission.', 'Complies with takedown order upon actual knowledge.'],
        precedent: 'Shreya Singhal v. Union of India (2015) 5 SCC 1'
      }
    ]
  }
];

interface BareActAIProps {
  role?: 'student' | 'advocate' | 'firm' | 'citizen';
  initialUserName?: string;
  initialUserRole?: string;
  dashboardHref?: string;
}

export default function BareActAI({
  role = 'student',
  initialUserName,
  initialUserRole,
  dashboardHref = '/student'
}: BareActAIProps) {
  const userName = initialUserName || (role === 'advocate' ? 'Adv. Saurabh' : role === 'firm' ? 'Khaitan & Co' : role === 'citizen' ? 'Priya Patel' : 'Adv. Saurabh');
  const userSubtitle = initialUserRole || (role === 'advocate' ? 'Advocate · High Court' : role === 'student' ? 'Law Student' : 'Citizen');

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<'All' | 'Criminal' | 'Civil' | 'Constitutional' | 'Others'>('All');
  const [activeTab, setActiveTab] = useState<'browse' | 'recent' | 'bookmarks'>('browse');

  // Dynamic Acts State
  const [actsList, setActsList] = useState<BareActItem[]>(BARE_ACTS_DATA);

  // Fetch dynamic bare acts from backend API
  useEffect(() => {
    api.getBareActs().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setActsList(res.data);
      }
    }).catch(() => {});
  }, []);

  // Bookmarked Acts
  const [bookmarkedActIds, setBookmarkedActIds] = useState<string[]>(['act-1', 'act-2']);

  // Selected Act for Detailed View Modal
  const [selectedAct, setSelectedAct] = useState<BareActItem | null>(null);
  const [activeSectionIndex, setActiveSectionIndex] = useState(0);
  const [isCopied, setIsCopied] = useState(false);

  // Floating prompt input inside hero
  const [heroPrompt, setHeroPrompt] = useState('');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const handleCopyShortNote = (sec: any) => {
    const noteText = `NEXORA LAW DIGEST — REVISION SHORT NOTE
Act: ${selectedAct?.name} (${selectedAct?.year})
Provision: ${sec.number} — ${sec.title}
${sec.newActEquivalent ? `New Sanhita: ${sec.newActEquivalent}\n` : ''}
CORE PRINCIPLE:
${sec.plainExplanation}

ESSENTIAL INGREDIENTS:
${sec.ingredients ? sec.ingredients.map((ing: string, i: number) => `${i + 1}. ${ing}`).join('\n') : ''}

LANDMARK PRECEDENT:
${sec.precedent}
`;

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(noteText);
      setIsCopied(true);
      setToastMessage(`Copied Short Note for ${sec.number} to clipboard!`);
      setTimeout(() => {
        setIsCopied(false);
        setToastMessage(null);
      }, 3000);
    }
  };

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const q = heroPrompt.trim();
    if (!q) return;

    // Search through acts
    const matched = actsList.find(
      (a) =>
        a.name.toLowerCase().includes(q.toLowerCase()) ||
        a.keySections.some((s) => s.title.toLowerCase().includes(q.toLowerCase()) || s.number.toLowerCase().includes(q.toLowerCase()))
    );

    if (matched) {
      setSelectedAct(matched);
      setToastMessage(`Found relevant provisions in ${matched.name}.`);
    } else {
      setSelectedAct(actsList[0] || BARE_ACTS_DATA[1]);
      setToastMessage(`Analyzing "${q}" across statutory enactments and landmark case precedents.`);
    }
    setTimeout(() => setToastMessage(null), 4000);
  };

  const toggleBookmark = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setBookmarkedActIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Filtered list of Bare Acts
  const displayedActs = actsList.filter((act) => {
    // Tab filter
    if (activeTab === 'bookmarks' && !bookmarkedActIds.includes(act.id)) return false;
    if (activeTab === 'recent' && act.id !== 'act-2' && act.id !== 'act-3' && act.id !== 'act-1') return false;

    // Category filter
    if (activeCategory !== 'All' && act.category !== activeCategory) return false;

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = act.name.toLowerCase().includes(q);
      const matchSummary = act.summary.toLowerCase().includes(q);
      const matchSections = act.keySections.some(
        (s) => s.number.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
      );
      if (!matchName && !matchSummary && !matchSections) return false;
    }

    return true;
  });

  return (
    <div className="flex-1 flex flex-col h-full min-w-0 bg-[#FAF8F5] text-[#1E293B] font-sans antialiased overflow-hidden">
      {/* Top Header Bar */}
      <header className="h-14 sm:h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#EAE3D6] flex items-center justify-between gap-4 flex-shrink-0 z-30">
        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search for cases, laws, drafts, or ask AI..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-full text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition"
          />
        </div>

        {/* Right Action Icons: Notification & Profile */}
        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <button
            type="button"
            className="relative p-2 rounded-full text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#FAF8F5] transition cursor-pointer"
            title="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white"></span>
          </button>

          <div className="flex items-center gap-3 pl-3 border-l border-[#EAE3D6]">
            <div className="w-9 h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {userName.charAt(0)}
            </div>
            <div className="hidden md:flex flex-col text-left">
              <span className="font-semibold text-sm text-[#1E293B] leading-tight">{userName}</span>
              <span className="text-xs text-[#64748B] truncate max-w-[180px]">{userSubtitle}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] hidden sm:block" />
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 p-3 sm:p-4 lg:p-5 max-w-[1720px] w-full mx-auto flex flex-col gap-3 min-h-0 overflow-hidden">
        
        {/* Complete Header Banner (Expanded from small box) */}
        <div className="bg-[#FAF5EB] border border-[#DECDB8] rounded-2xl px-5 py-3 sm:px-6 sm:py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 text-xs text-[#8C5320] mb-0.5 font-medium">
              <Link href={dashboardHref} className="hover:text-[#1E3A8A] transition">
                Workspace
              </Link>
              <span>/</span>
              <span className="text-[#1E3A8A] font-semibold">Bare Act AI</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-serif font-bold text-[#1E293B] tracking-tight">
              Bare Act AI
            </h1>
            <p className="text-xs sm:text-sm text-[#64748B]">
              Ask questions, search, and understand Bare Acts with simple explanations.
            </p>
          </div>

          <div className="flex items-center gap-3.5 self-end sm:self-auto flex-shrink-0">
            <div className="flex flex-col text-right">
              <span className="font-serif italic text-xs sm:text-sm text-[#8C5320] leading-snug">
                &ldquo;Complex provisions, made simple.&rdquo;
              </span>
              <div className="w-8 h-[2px] bg-[#C59B58] self-end mt-1"></div>
            </div>
            <div className="relative w-14 h-10 flex-shrink-0 overflow-hidden rounded-lg border border-[#DECDB8]/60 bg-white/60 shadow-2xs">
              <Image
                src="/assets/supreme-court-gardens.png"
                alt="Supreme Court of India"
                fill
                className="object-cover mix-blend-multiply opacity-90"
              />
            </div>
          </div>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div className="bg-[#FAF5EB] border border-[#DECDB8] text-[#8C5320] px-3.5 py-2 rounded-xl flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-200 flex-shrink-0">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C59B58] flex-shrink-0" />
              <span>{toastMessage}</span>
            </div>
            <button
              type="button"
              onClick={() => setToastMessage(null)}
              className="text-[#8C5320] hover:text-[#1E293B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-Column Workstation Grid: Left Hero & Examples / Right Browse Acts */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch min-h-0 overflow-hidden">
          
          {/* =================================================================== */}
          {/* LEFT 8 COLUMNS: HERO BANNER, SEARCH, EXAMPLES & FEATURE PILLARS     */}
          {/* =================================================================== */}
          <div className="lg:col-span-8 flex flex-col h-full min-h-0">
            
            {/* 1. HERO BANNER WITH REQUESTED ASSET */}
            <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#DECDB8] shadow-sm bg-[#FAF5EB] h-full flex flex-col justify-between p-4 sm:p-6 lg:p-7 min-h-0">
              {/* Requested Asset Background: Indian Justice Symbolism with Books and Scales */}
              <div className="absolute inset-0 pointer-events-none select-none z-0">
                <Image
                  src="/assets/indian-justice-symbolism.png"
                  alt="Indian Justice Symbolism with Books and Scales"
                  fill
                  priority
                  className="object-cover object-left md:object-center mix-blend-multiply opacity-85"
                />
                {/* Soft warm gradient overlay from right to left to guarantee crystal-clear text readability */}
                <div className="absolute inset-0 bg-gradient-to-l from-[#FAF5EB]/95 via-[#FAF5EB]/80 to-transparent"></div>
              </div>

              {/* Top Row: Hero Title in Right Corner */}
              <div className="relative z-10 flex justify-end">
                <div className="max-w-md text-right">
                  <h2 className="text-base sm:text-lg font-serif text-[#1E293B] font-medium leading-tight">
                    Your AI Guide to
                  </h2>
                  <h3 className="text-2xl sm:text-3xl lg:text-4xl font-serif font-bold text-[#8C5320] tracking-tight mt-0.5">
                    Bare Acts
                  </h3>
                  <p className="text-xs sm:text-sm text-[#475569] mt-1 font-medium leading-relaxed">
                    Get clear answers, section-wise explanations, comparisons, and real examples.
                  </p>
                </div>
              </div>

              {/* Bottom Row: Centered Floating Search & Action Pills */}
              <div className="relative z-10 mt-auto pt-3 max-w-2xl mx-auto w-full">
                {/* Floating Search Prompt Card */}
                <form
                  onSubmit={handlePromptSubmit}
                  className="bg-white/95 backdrop-blur-md border border-[#DECDB8] rounded-2xl p-2 sm:p-2.5 shadow-lg flex items-center gap-2 transition focus-within:ring-2 focus-within:ring-[#1E3A8A]/20 focus-within:border-[#1E3A8A]"
                >
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-[#1E3A8A] flex-shrink-0 ml-1.5" />
                  <input
                    type="text"
                    value={heroPrompt}
                    onChange={(e) => setHeroPrompt(e.target.value)}
                    placeholder="Ask anything about a Bare Act..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none"
                  />

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#FAF8F5] transition cursor-pointer"
                    title="Attach reference"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#FAF8F5] transition cursor-pointer"
                    title="Voice input"
                  >
                    <Mic className="w-4 h-4" />
                  </button>

                  <button
                    type="submit"
                    className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center hover:bg-[#1E3A8A]/90 transition shadow-xs flex-shrink-0 cursor-pointer"
                    title="Search & Explain"
                  >
                    <ArrowUp className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  </button>
                </form>
              </div>
            </div>

          </div>

          {/* =================================================================== */}
          {/* RIGHT 4 COLUMNS: BROWSE ACTS PANEL                                  */}
          {/* =================================================================== */}
          <div className="lg:col-span-4 bg-white border border-[#EAE3D6] rounded-2xl p-3.5 sm:p-4 shadow-xs flex flex-col gap-2.5 h-full min-h-0 overflow-hidden">
            
            {/* Tabs Row: Browse Acts / Recent / Bookmarks */}
            <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-1 flex-shrink-0">
              {[
                { id: 'browse', label: 'Browse Acts' },
                { id: 'recent', label: 'Recent' },
                { id: 'bookmarks', label: 'Bookmarks' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-2 px-2 text-xs sm:text-sm font-bold transition cursor-pointer relative ${
                    activeTab === tab.id
                      ? 'text-[#1E3A8A]'
                      : 'text-[#64748B] hover:text-[#1E293B]'
                  }`}
                >
                  {tab.label}
                  {activeTab === tab.id && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A8A] rounded-full"></span>
                  )}
                </button>
              ))}
            </div>

            {/* Search Input for Acts */}
            <div className="relative flex-shrink-0">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for a Bare Act..."
                className="w-full pl-8 pr-3 py-1.5 sm:py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A8A] transition"
              />
            </div>

            {/* Category Filter Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none flex-shrink-0">
              {(['All', 'Criminal', 'Civil', 'Constitutional', 'Others'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-lg text-[10px] sm:text-[11px] font-semibold whitespace-nowrap transition cursor-pointer ${
                    activeCategory === cat
                      ? 'bg-[#1E3A8A] text-white shadow-2xs'
                      : 'bg-[#FAF8F5] text-[#64748B] hover:bg-[#EAE3D6] border border-[#DECDB8]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* List of Acts */}
            <div className="flex-1 divide-y divide-[#FAF5EB] overflow-y-auto pr-1 min-h-0">
              {displayedActs.length === 0 ? (
                <div className="py-8 text-center text-xs text-[#64748B]">
                  No Bare Acts found matching your filter.
                </div>
              ) : (
                displayedActs.map((act) => {
                  const isBookmarked = bookmarkedActIds.includes(act.id);
                  return (
                    <div
                      key={act.id}
                      onClick={() => setSelectedAct(act)}
                      className="py-2.5 px-2 rounded-xl hover:bg-[#FAF8F5] flex items-center justify-between gap-2 transition cursor-pointer group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] border border-[#DECDB8] flex items-center justify-center text-[#8C5320] flex-shrink-0 group-hover:bg-[#1E3A8A] group-hover:text-white transition">
                          <BookOpen className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs sm:text-sm font-semibold text-[#1E293B] group-hover:text-[#1E3A8A] truncate transition">
                            {act.name}
                          </h4>
                          <span className="text-[10px] text-[#94A3B8] block truncate">
                            {act.totalSections} • {act.category}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={(e) => toggleBookmark(act.id, e)}
                          className={`p-1 rounded transition ${
                            isBookmarked
                              ? 'text-[#C59B58]'
                              : 'text-[#CBD5E1] hover:text-[#64748B]'
                          }`}
                          title={isBookmarked ? 'Remove Bookmark' : 'Add Bookmark'}
                        >
                          <Bookmark className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-current' : ''}`} />
                        </button>
                        <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#1E3A8A] group-hover:translate-x-0.5 transition" />
                      </div>
                    </div>
                  );
                })
              )}
            </div>

          </div>

        </div>
      </main>

      {/* ===================================================================== */}
      {/* REVISION SHORT NOTE MODAL                                            */}
      {/* ===================================================================== */}
      {selectedAct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col font-sans">
            
            {/* Short Note Header Bar */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] border border-[#DECDB8] flex items-center justify-center text-[#8C5320] shadow-2xs">
                  <FileText className="w-5 h-5 text-[#C59B58]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF5EB] text-[#8C5320] border border-[#DECDB8] uppercase tracking-wider">
                      Legal Short Note · Revision Card
                    </span>
                    <span className="text-xs text-[#64748B] font-medium">{selectedAct.category}</span>
                  </div>
                  <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-0.5">
                    {selectedAct.name} ({selectedAct.year})
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAct(null)}
                  className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
                  title="Close Short Note"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Quick Section Selector Strip */}
            {selectedAct.keySections && selectedAct.keySections.length > 1 && (
              <div className="flex items-center gap-2 pt-3 pb-1 overflow-x-auto scrollbar-none">
                <span className="text-[11px] font-bold text-[#8C7355] uppercase tracking-wider flex-shrink-0">
                  Select Note:
                </span>
                {selectedAct.keySections.map((sec, idx) => (
                  <button
                    key={sec.number}
                    type="button"
                    onClick={() => setActiveSectionIndex(idx)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all cursor-pointer flex-shrink-0 ${
                      activeSectionIndex === idx
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A]'
                    }`}
                  >
                    {sec.number}
                  </button>
                ))}
              </div>
            )}

            {/* Current Active Section Short Note Content */}
            {selectedAct.keySections && selectedAct.keySections[activeSectionIndex] && (() => {
              const sec = selectedAct.keySections[activeSectionIndex];
              return (
                <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
                  
                  {/* Note Sheet Card */}
                  <div className="bg-white border border-[#DECDB8] rounded-2xl p-5 shadow-xs space-y-4">
                    
                    {/* Top Row: Section Number & Quick Copy */}
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#FAF5EB]">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1E3A8A] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                            {sec.number}
                          </span>
                          {sec.newActEquivalent && (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              {sec.newActEquivalent}
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] mt-1.5">
                          {sec.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyShortNote(sec)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] text-xs font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition shadow-2xs cursor-pointer flex-shrink-0"
                      >
                        {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{isCopied ? 'Copied!' : 'Copy Note'}</span>
                      </button>
                    </div>

                    {/* 1. Core Principle (Gist) */}
                    <div className="p-3.5 rounded-xl bg-[#FAF5EB] border-l-4 border-[#C59B58] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                        Core Principle / High-Yield Gist
                      </span>
                      <p className="font-serif text-xs sm:text-sm text-[#1E293B] font-medium leading-relaxed">
                        &ldquo;{sec.plainExplanation}&rdquo;
                      </p>
                    </div>

                    {/* 2. Essential Ingredients Checklist */}
                    {sec.ingredients && sec.ingredients.length > 0 && (
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Essential Legal Ingredients:
                        </span>
                        <div className="space-y-1.5">
                          {sec.ingredients.map((ing, k) => (
                            <div
                              key={k}
                              className="flex items-start gap-2.5 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] text-xs text-[#334155]"
                            >
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span className="leading-snug">{ing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* 3. Landmark Judicial Authorities */}
                    <div className="p-3.5 bg-white border border-[#DECDB8] rounded-xl space-y-1 shadow-2xs">
                      <div className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8C5320]">
                        <Scale className="w-3.5 h-3.5 text-[#C59B58]" />
                        <span>Landmark Case Precedent & Ratio:</span>
                      </div>
                      <p className="text-xs text-[#1E293B] font-medium leading-relaxed pl-5">
                        {sec.precedent}
                      </p>
                    </div>

                    {/* 4. Quick Exam / Practical Takeaway */}
                    <div className="flex items-start gap-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900">
                      <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <strong>Exam & Litigation Takeaway: </strong>
                        Always read {sec.number} in conjunction with constitutional validity tests and statutory procedural timelines.
                      </div>
                    </div>

                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between">
              <span className="text-xs text-[#64748B]">
                Total: {selectedAct.totalSections}
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedAct(null)}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition cursor-pointer"
                >
                  Close Short Note
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

