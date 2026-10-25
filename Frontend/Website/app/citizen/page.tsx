'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import {
  Sparkles,
  Briefcase,
  Layers,
  Languages,
  Search,
  Bell,
  ArrowRight,
  Clock,
  Calendar,
  FileText,
  Scale,
  HelpCircle,
  UploadCloud,
  ChevronRight,
  X,
  Send,
  BookOpen,
  FileCheck
} from 'lucide-react';

export default function CitizenDashboardPage() {
  // Navigation State
  const [activeNav, setActiveNav] = useState('Dashboard');

  // User State
  const [userName, setUserName] = useState('Priya Sharma');
  const [userRole, setUserRole] = useState('Citizen · Non-Legal User');

  // Input & Modal States
  const [legalQuestion, setLegalQuestion] = useState('');
  const [aiAnswerModal, setAiAnswerModal] = useState(false);
  const [aiAnswerLoading, setAiAnswerLoading] = useState(false);
  const [aiAnswerContent, setAiAnswerContent] = useState<any>(null);

  const [noticeModalOpen, setNoticeModalOpen] = useState(false);
  const [caseModalOpen, setCaseModalOpen] = useState(false);
  const [docModalOpen, setDocModalOpen] = useState(false);
  const [translateModalOpen, setTranslateModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [termModalOpen, setTermModalOpen] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample Legal Terms glossary
  const legalTerms = [
    { term: 'Sub-judice', meaning: 'A matter currently under trial or consideration by a judge, so public debate might be restricted.' },
    { term: 'Caveat', meaning: 'A formal notice requesting the court not to pass any order without first informing you.' },
    { term: 'Affidavit', meaning: 'A written statement confirmed by oath or affirmation, for use as evidence in court.' },
    { term: 'Injunction', meaning: 'An official court order preventing someone from doing a particular act (like vacating or demolishing).' },
    { term: 'Cognizable Offence', meaning: 'A category of crime where police can arrest someone without an arrest warrant.' },
  ];

  // Dynamic state for glossary & dashboard
  const [glossaryList, setGlossaryList] = useState(legalTerms);
  const [notificationsList, setNotificationsList] = useState<any[]>([
    { id: 'notif-1', title: 'Upcoming Hearing Date', message: 'Sharma v. Rental Authority hearing is scheduled for Nov 04, 2026 at 10:30 AM.', time: 'Today' },
    { id: 'notif-2', title: 'Notice Reply Deadline', message: 'Apex Finlease demand notice requires reply in 4 days.', time: 'Urgent' }
  ]);
  const [quoteData, setQuoteData] = useState({
    text: 'In matters of truth and justice, there is no difference between large and small problems.',
    author: 'Albert Einstein'
  });

  // Fetch dynamic citizen data from backend
  useEffect(() => {
    const fetchCitizenData = async () => {
      try {
        const [glossaryRes, statsRes] = await Promise.all([
          api.getCitizenGlossary(),
          api.getDashboardStats('citizen')
        ]);
        if (glossaryRes.success && glossaryRes.data?.length > 0) {
          setGlossaryList(glossaryRes.data);
        }
        if (statsRes.success && statsRes.data) {
          if (statsRes.data.notifications && statsRes.data.notifications.length > 0) {
            setNotificationsList(statsRes.data.notifications);
          }
          if (statsRes.data.quote) {
            setQuoteData({
              text: statsRes.data.quote.quote || statsRes.data.quote.text,
              author: statsRes.data.quote.author
            });
          }
        }
      } catch (err) {
        console.error('Error fetching citizen dashboard data:', err);
      }
    };
    fetchCitizenData();
  }, []);

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('draftmate_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name) setUserName(parsed.name);
          if (parsed.role) setUserRole('Citizen · ' + (parsed.city || 'Verified Citizen'));
        }
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
  }, []);

  // Keyboard shortcut for search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) &&
          document.activeElement?.tagName !== 'INPUT' &&
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('citizen-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  // Quick prompt questions
  const samplePrompts = [
    'My landlord has not returned my security deposit',
    'Received legal notice for cheque bounce under Sec 138',
    'How do I file a consumer complaint for defective phone?',
    'What are my rights in an ancestral property inheritance?'
  ];

  const handleAskQuestion = async (queryText?: string) => {
    const q = queryText || legalQuestion;
    if (!q.trim()) return;
    setAiAnswerLoading(true);
    setAiAnswerModal(true);

    try {
      const res = await api.askCitizenQuestion(q);
      if (res.success && res.data) {
        setAiAnswerContent(res.data);
      } else {
        setAiAnswerContent({
          question: q,
          summary: 'Your landlord cannot withhold the deposit without providing documented damages or agreed deductions according to the Model Tenancy Act.',
          steps: [
            'Send a formal Demand Notice requesting refund within 15 days via registered post or email.',
            'Compile rent payment receipts, lease agreement, and flat handover confirmation.',
            'If no resolution occurs, file a claim before the Rent Controller / Small Causes Court or Consumer Forum.'
          ],
          relevantLaw: 'Section 13, Model Tenancy Act / Indian Contract Act (Section 73)',
          recommendedAction: 'Generate a Demand Notice template directly from your dashboard.'
        });
      }
    } catch (err) {
      console.error('Error asking citizen question:', err);
      setAiAnswerContent({
        question: q,
        summary: 'Your landlord cannot withhold the deposit without providing documented damages or agreed deductions according to the Model Tenancy Act.',
        steps: [
          'Send a formal Demand Notice requesting refund within 15 days via registered post or email.',
          'Compile rent payment receipts, lease agreement, and flat handover confirmation.',
          'If no resolution occurs, file a claim before the Rent Controller / Small Causes Court or Consumer Forum.'
        ],
        relevantLaw: 'Section 13, Model Tenancy Act / Indian Contract Act (Section 73)',
        recommendedAction: 'Generate a Demand Notice template directly from your dashboard.'
      });
    } finally {
      setAiAnswerLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] flex flex-col xl:flex-row font-sans antialiased selection:bg-[#C59B58]/20 relative">
      <Sidebar activeNav="Dashboard" dashboardHref="/citizen" rolePrefix="/citizen" />

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 xl:ml-[268px] flex flex-col min-h-screen relative z-10 w-full min-w-0">
        
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D6] px-5 sm:px-8 py-3.5 flex items-center justify-between gap-4">
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8C7355] absolute left-3.5 pointer-events-none" />
              <input
                id="citizen-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search cases, legal guides, notices, or ask a question..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#DECDB8] rounded-full text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 transition-all shadow-2xs"
              />
              <span className="absolute right-3.5 text-xs text-[#94A3B8] font-mono select-none">
                /
              </span>
            </div>
          </div>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-3 sm:gap-4 select-none">
            {/* Language Switcher Badge */}
            <button
              onClick={() => setTranslateModalOpen(true)}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#DECDB8] text-xs font-semibold text-[#1E3A8A] hover:bg-[#F8FAFC] transition-colors shadow-2xs"
            >
              <Languages className="w-3.5 h-3.5 text-[#C59B58]" />
              <span>English / हिन्दी / ગુજરાતી</span>
            </button>

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                title="Notifications & Reminders"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-88 bg-white rounded-2xl shadow-xl border border-[#DECDB8] p-4 z-50 animate-in fade-in-50 zoom-in-95">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                    <span className="text-sm font-bold text-slate-900">Notifications & Reminders</span>
                    <button onClick={() => setNotificationsOpen(false)} className="text-xs text-slate-400 hover:text-slate-600">
                      Close
                    </button>
                  </div>
                  <div className="mt-3 space-y-2.5 text-xs">
                    {notificationsList.map((n: any, idx: number) => (
                      <div key={n.id || idx} className="p-2.5 rounded-xl bg-[#F0F7FF] border border-[#DBEAFE] flex items-start gap-2.5">
                        <Calendar className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-[#1E3A8A]">{n.title}</p>
                          <p className="text-slate-600 mt-0.5">{n.message || n.desc}</p>
                          {n.time && <span className="text-[10px] text-[#94A3B8] mt-0.5 block">{n.time}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Profile Avatar */}
            <div className="flex items-center gap-2.5 pl-2 border-l border-[#DECDB8]">
              <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs shadow-2xs">
                {userName.charAt(0)}
              </div>
              <div className="hidden lg:flex flex-col text-left">
                <span className="text-xs font-bold text-[#0F172A] leading-tight">{userName}</span>
                <span className="text-[10px] text-[#8C7355] font-medium leading-none">Citizen</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Main Container */}
        <main className="p-5 sm:p-8 max-w-7xl mx-auto w-full space-y-7">

          {/* ===================================================================== */}
          {/* ===================================================================== */}
          {/* 1. HERO BANNER: SUPREME COURT OF INDIA (WITH LUSH GARDENS)            */}
          {/* ===================================================================== */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl border border-[#DECDB8] bg-white shadow-xs p-7 sm:p-9 md:p-10 flex flex-col justify-between min-h-[200px] sm:min-h-[225px]">
            
            {/* Supreme Court Garden Landscape Graphic — Seamless Mask Fade */}
            <div 
              className="absolute right-0 top-0 bottom-0 w-full sm:w-3/4 md:w-2/3 pointer-events-none overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.9) 60%, black 100%)',
                WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 20%, rgba(0,0,0,0.9) 60%, black 100%)',
              }}
            >
              <Image
                src="/assets/supreme-court-gardens.png"
                alt="Supreme Court of India with lush gardens"
                fill
                priority
                className="object-cover object-right-bottom"
              />
            </div>

            {/* Left Content: Legal Wisdom Pill + Greeting + Name + Tagline */}
            <div className="relative z-10 max-w-xl">
              
              {/* Legal Wisdom Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#DECDB8] text-[11px] sm:text-xs font-medium text-[#785E3A] mb-3 shadow-2xs backdrop-blur-xs">
                <Scale className="w-3.5 h-3.5 text-[#C59B58]" />
                <span className="italic">&ldquo;{quoteData.text}&rdquo;</span>
                <span className="font-bold text-[#8C7355] uppercase text-[10px] tracking-wider">— {quoteData.author}</span>
              </div>

              {/* Time-based greeting label */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase text-[#8C7355]">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                <span>{getGreeting()}</span>
              </div>

              {/* Citizen Title Typography with Warm Accent */}
              <h1 className="font-serif-title text-3xl sm:text-4xl md:text-[46px] font-bold text-[#0F172A] tracking-tight leading-tight mt-1 mb-1.5">
                Hello, {userName}
              </h1>
              
              {/* Tagline */}
              <p className="text-[#475569] text-base sm:text-lg font-normal">
                How can we help you today?
              </p>

              {/* Signature Gold Underline Accent */}
              <div className="w-14 h-[2.5px] bg-gradient-to-r from-[#C59B58] to-[#DECDB8] rounded-full mt-3.5" />

            </div>

          </div>

          {/* ===================================================================== */}
          {/* 2. ASK A LEGAL QUESTION (SIMPLE LANGUAGE PROMPT BOX)                  */}
          {/* ===================================================================== */}
          <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DECDB8] p-6 sm:p-7 shadow-xs">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-8 h-8 rounded-xl bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
              <h2 className="font-serif-title text-lg sm:text-xl font-bold text-[#0F172A]">
                What legal help do you need?
              </h2>
            </div>
            <p className="text-sm text-[#64748B] mb-4">
              Describe your issue in your own words. We will help you understand the next steps in simple, plain language.
            </p>

            {/* Question Input Box */}
            <div className="relative">
              <textarea
                rows={3}
                value={legalQuestion}
                onChange={(e) => setLegalQuestion(e.target.value)}
                placeholder="e.g. My landlord has not returned my security deposit after I vacated the flat 2 months ago..."
                className="w-full p-4 pr-32 bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl text-sm sm:text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 transition-all resize-none"
              />
              <div className="absolute right-3.5 bottom-3.5">
                <button
                  type="button"
                  onClick={() => handleAskQuestion()}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white hover:bg-[#172554] text-xs sm:text-sm font-semibold flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Ask DraftMate</span>
                </button>
              </div>
            </div>

            {/* Sample Prompts Pills */}
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold text-[#8C7355] flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                Popular topics:
              </span>
              {samplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setLegalQuestion(prompt);
                    handleAskQuestion(prompt);
                  }}
                  className="px-3 py-1 rounded-full bg-[#F5F2EB] hover:bg-[#EAE3D6] text-xs font-medium text-[#475569] hover:text-[#0F172A] transition-colors border border-[#E2D5C3]/60"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>

          {/* ===================================================================== */}
          {/* 3. QUICK ACTIONS (4 WATERMARK ENGRAVING ARTWORK CARDS)                 */}
          {/* ===================================================================== */}
          <div>
            <div className="flex items-center justify-between mb-3.5">
              <h2 className="font-serif-title text-xl font-bold text-[#0F172A]">
                Quick Actions
              </h2>
              <span className="text-xs font-semibold text-[#8C7355]">
                Tap any tool to start
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              
              {/* Card 1: Explain a Notice */}
              <div 
                onClick={() => setNoticeModalOpen(true)}
                className="relative overflow-hidden rounded-2xl bg-[#F0F7FF] border border-[#D8E8FC] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[155px] group"
              >
                <div className="absolute right-0 bottom-0 w-36 h-28 pointer-events-none opacity-75 overflow-hidden">
                  <Image
                    src="/assets/pale-blue-courthouse.png"
                    alt="Courthouse art"
                    fill
                    className="object-contain object-bottom-right mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shadow-2xs">
                    <FileCheck className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#1D4ED8] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="font-serif-title font-bold text-[16px] text-[#1E3A8A]">
                    Explain a Notice
                  </h3>
                  <p className="text-[12px] text-[#2563EB] mt-0.5 font-medium leading-snug">
                    Understand legal documents
                  </p>
                  <p className="text-[11px] text-[#475569] mt-1 line-clamp-1">
                    Upload notices & get plain-language answers.
                  </p>
                </div>
              </div>

              {/* Card 2: Check Case Status */}
              <div 
                onClick={() => setCaseModalOpen(true)}
                className="relative overflow-hidden rounded-2xl bg-[#FFF9F0] border border-[#FBE8CE] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[155px] group"
              >
                <div className="absolute right-0 bottom-0 w-36 h-28 pointer-events-none opacity-75 overflow-hidden">
                  <Image
                    src="/assets/sepia-courthouse-facade.png"
                    alt="Courthouse facade art"
                    fill
                    className="object-contain object-bottom-right mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shadow-2xs">
                    <Scale className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#B45309] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="font-serif-title font-bold text-[16px] text-[#78350F]">
                    Check Case Status
                  </h3>
                  <p className="text-[12px] text-[#B45309] mt-0.5 font-medium leading-snug">
                    View case progress
                  </p>
                  <p className="text-[11px] text-[#475569] mt-1 line-clamp-1">
                    Track hearing dates and court orders.
                  </p>
                </div>
              </div>

              {/* Card 3: Create a Document */}
              <div 
                onClick={() => setDocModalOpen(true)}
                className="relative overflow-hidden rounded-2xl bg-[#F6F3FF] border border-[#E8DEFD] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[155px] group"
              >
                <div className="absolute right-0 bottom-0 w-36 h-28 pointer-events-none opacity-75 overflow-hidden">
                  <Image
                    src="/assets/lavender-law-books.png"
                    alt="Law books art"
                    fill
                    className="object-contain object-bottom-right mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] text-[#6D28D9] flex items-center justify-center shadow-2xs">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#6D28D9] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="font-serif-title font-bold text-[16px] text-[#581C87]">
                    Create a Document
                  </h3>
                  <p className="text-[12px] text-[#6D28D9] mt-0.5 font-medium leading-snug">
                    Use guided templates
                  </p>
                  <p className="text-[11px] text-[#475569] mt-1 line-clamp-1">
                    Rental agreements, notices, affidavits.
                  </p>
                </div>
              </div>

              {/* Card 4: Translate a Document */}
              <div 
                onClick={() => setTranslateModalOpen(true)}
                className="relative overflow-hidden rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[155px] group"
              >
                <div className="absolute right-0 bottom-0 w-36 h-28 pointer-events-none opacity-75 overflow-hidden">
                  <Image
                    src="/assets/mint-translation-book.png"
                    alt="Translation art"
                    fill
                    className="object-contain object-bottom-right mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-10 h-10 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center shadow-2xs">
                    <Languages className="w-5 h-5" />
                  </div>
                  <div className="w-7 h-7 rounded-full bg-white text-[#15803D] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-3.5 h-3.5" />
                  </div>
                </div>

                <div className="relative z-10 mt-3">
                  <h3 className="font-serif-title font-bold text-[16px] text-[#14532D]">
                    Translate a Document
                  </h3>
                  <p className="text-[12px] text-[#16A34A] mt-0.5 font-medium leading-snug">
                    Understand it in your language
                  </p>
                  <p className="text-[11px] text-[#475569] mt-1 line-clamp-1">
                    English, Hindi, and Gujarati support.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ===================================================================== */}
          {/* 4. MAIN CONTENT TWO-COLUMN GRID                                       */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">

            {/* LEFT COLUMN (7 COLS): MY CASES & UNDERSTAND NOTICE                     */}
            <div className="lg:col-span-7 space-y-7">

              {/* MY CASES SECTION */}
              <div id="my-cases" className="rounded-2xl sm:rounded-3xl bg-white border border-[#DECDB8] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D6]/70 mb-5">
                  <div>
                    <h2 className="font-serif-title text-xl font-bold text-[#0F172A]">
                      My Cases
                    </h2>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      Your tracked cases appear here
                    </p>
                  </div>
                  <button 
                    onClick={() => setCaseModalOpen(true)}
                    className="text-xs font-bold text-[#1E3A8A] hover:text-[#C59B58] transition-colors flex items-center gap-1"
                  >
                    <span>View all</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Tracked Case 1 */}
                <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#DECDB8] mb-3 hover:border-[#C59B58]/60 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-[#EBF2FC] text-[#1E3A8A] text-[10px] font-bold uppercase tracking-wider">
                          Civil Dispute
                        </span>
                        <span className="text-xs text-slate-400 font-mono">CNR: DLCT01-002891-2026</span>
                      </div>
                      <h4 className="font-serif-title font-bold text-base text-[#0F172A] mt-1">
                        Priya Sharma v. Apex Realty & Maintenance
                      </h4>
                      <p className="text-xs text-[#64748B] mt-0.5">
                        Senior Civil Judge Court, Saket · Security deposit recovery suit
                      </p>
                    </div>
                    <span className="px-2.5 py-1 rounded-full bg-[#FEF3C7] text-[#92400E] text-xs font-semibold shrink-0">
                      Hearing Soon
                    </span>
                  </div>

                  <div className="mt-3.5 pt-3 border-t border-[#EAE3D6] flex flex-wrap items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-2 text-[#475569]">
                      <Calendar className="w-3.5 h-3.5 text-[#C59B58]" />
                      <span>Next Hearing: <strong className="text-[#0F172A]">04 Nov 2026 (10:30 AM)</strong></span>
                    </div>
                    <button 
                      onClick={() => setCaseModalOpen(true)}
                      className="text-xs font-semibold text-[#1E3A8A] hover:underline flex items-center gap-1"
                    >
                      <span>Check Details</span>
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Empty State / Add Case Guidance Box */}
                <div className="p-5 rounded-2xl border border-dashed border-[#DECDB8] bg-[#FDFBF7] text-center flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-[#F5ECE0] text-[#785E3A] flex items-center justify-center mb-2">
                    <Briefcase className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">
                    Add a case to receive relevant updates
                  </h4>
                  <p className="text-xs text-[#64748B] max-w-sm mt-1">
                    Enter your CNR number, case number, or party names to get automated hearing alerts.
                  </p>
                  <button
                    onClick={() => setCaseModalOpen(true)}
                    className="mt-3 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white hover:bg-[#172554] text-xs font-semibold shadow-2xs transition-colors"
                  >
                    Track New Case
                  </button>
                </div>
              </div>

              {/* UNDERSTAND A LEGAL NOTICE EXPLORER */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DECDB8] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE3D6]/70 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                      <FileCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif-title text-lg font-bold text-[#0F172A]">
                        Understand a Legal Notice
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Receive a plain-language explanation and action plan
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setNoticeModalOpen(true)}
                    className="px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#172554] transition-colors"
                  >
                    Upload Notice
                  </button>
                </div>

                {/* Notice Card Example */}
                <div className="p-4 rounded-2xl bg-[#F8FAFC] border border-[#E2E8F0]">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F1F5F9] text-slate-700 flex items-center justify-center font-bold">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900">Notice from Landlord (Vacate Premise)</h4>
                        <span className="text-[11px] text-slate-500">Uploaded 3 days ago · Analyzed in English & Hindi</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-[#DCFCE7] text-[#15803D] text-[11px] font-bold">
                      Explained
                    </span>
                  </div>

                  <div className="mt-3 p-3 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 space-y-1.5">
                    <p><strong className="text-slate-900">What it says:</strong> The owner claims rental arrears for August and demands surrender of keys within 15 days.</p>
                    <p><strong className="text-slate-900">What you should do:</strong> Provide proof of online bank transfer for August rent; draft a formal response refuting the claim.</p>
                  </div>
                </div>
              </div>

              {/* EXPLAIN LEGAL TERMS (USEFUL ADDITIONAL FEATURE) */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DECDB8] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE3D6]/70 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-serif-title text-lg font-bold text-[#0F172A]">
                        Explain Legal Terms
                      </h3>
                      <p className="text-xs text-[#64748B]">
                        Simplify unfamiliar legal terminology into everyday words
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {glossaryList.map((item, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setSelectedTerm(item);
                        setTermModalOpen(true);
                      }}
                      className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] hover:border-[#C59B58] cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1E3A8A] font-serif-title">
                          {item.term}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      </div>
                      <p className="text-[11px] text-[#475569] mt-1 line-clamp-2">
                        {item.meaning}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN (5 COLS): UPCOMING DATES, MY DOCUMENTS, FIND HELP       */}
            <div className="lg:col-span-5 space-y-7">

              {/* UPCOMING DATES & DEADLINES */}
              <div className="rounded-2xl sm:rounded-3xl bg-white border border-[#DECDB8] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE3D6]/70 mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#C59B58]" />
                    <h3 className="font-serif-title text-lg font-bold text-[#0F172A]">
                      Upcoming Dates
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-[#8C7355]">
                    2 deadlines
                  </span>
                </div>

                <div className="space-y-3">
                  {/* Date 1 */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8]">
                    <div className="w-12 h-12 rounded-xl bg-[#EBF2FC] text-[#1E3A8A] border border-[#BFDBFE] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold uppercase leading-none">NOV</span>
                      <span className="text-base font-extrabold leading-none mt-0.5">04</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0F172A] truncate">
                        Saket Court Hearing
                      </h4>
                      <p className="text-[11px] text-[#64748B] truncate">
                        Priya Sharma v. Apex Realty
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#1E3A8A]">
                        Courtroom 302 · 10:30 AM
                      </span>
                    </div>
                  </div>

                  {/* Date 2 */}
                  <div className="flex items-center gap-3.5 p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8]">
                    <div className="w-12 h-12 rounded-xl bg-[#FFF9F0] text-[#B45309] border border-[#FDE68A] flex flex-col items-center justify-center shrink-0">
                      <span className="text-[10px] font-bold uppercase leading-none">NOV</span>
                      <span className="text-base font-extrabold leading-none mt-0.5">12</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-[#0F172A] truncate">
                        Reply to Landlord Notice
                      </h4>
                      <p className="text-[11px] text-[#64748B] truncate">
                        Last date to dispatch response
                      </p>
                      <span className="inline-block mt-0.5 text-[10px] font-semibold text-[#B45309]">
                        Draft completed in My Documents
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* MY DOCUMENTS & GUIDED TEMPLATES */}
              <div id="my-documents" className="rounded-2xl sm:rounded-3xl bg-white border border-[#DECDB8] p-6 sm:p-7 shadow-xs">
                <div className="flex items-center justify-between pb-3.5 border-b border-[#EAE3D6]/70 mb-4">
                  <div>
                    <h3 className="font-serif-title text-lg font-bold text-[#0F172A]">
                      My Documents
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      Notices, drafts & saved files
                    </p>
                  </div>
                  <button 
                    onClick={() => setDocModalOpen(true)}
                    className="text-xs font-bold text-[#1E3A8A] hover:underline"
                  >
                    New Document
                  </button>
                </div>

                <div className="space-y-2.5">
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileText className="w-4 h-4 text-[#1E3A8A] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">Notice_Reply_Landlord.docx</p>
                        <p className="text-[10px] text-[#64748B]">Created yesterday · Guided Draft</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#15803D] bg-[#DCFCE7] px-2 py-0.5 rounded-full">
                      Ready
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <FileCheck className="w-4 h-4 text-[#8C7355] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">Lease_Agreement_2025.pdf</p>
                        <p className="text-[10px] text-[#64748B]">Uploaded 5 days ago · 1.4 MB</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#1E3A8A] bg-[#EBF2FC] px-2 py-0.5 rounded-full">
                      Saved
                    </span>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] flex items-center justify-between">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Languages className="w-4 h-4 text-[#16A34A] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#0F172A] truncate">Notice_Summary_Hindi.pdf</p>
                        <p className="text-[10px] text-[#64748B]">Hindi translation · Verified</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-[#78350F] bg-[#FEF3C7] px-2 py-0.5 rounded-full">
                      Translated
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => setDocModalOpen(true)}
                  className="w-full mt-4 py-2.5 rounded-xl border border-[#DECDB8] bg-[#FDFBF7] hover:bg-[#F5ECE0] text-xs font-semibold text-[#785E3A] transition-colors flex items-center justify-center gap-1.5"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Browse 40+ Citizen Legal Templates</span>
                </button>
              </div>

            </div>

          </div>

          {/* ===================================================================== */}
          {/* 5. RECENT ACTIVITY & FOOTER NOTE                                      */}
          {/* ===================================================================== */}
          <div className="rounded-2xl bg-white border border-[#DECDB8] p-5 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs text-[#64748B]">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#C59B58]" />
              <span>
                <strong>Recent Activity:</strong> Analyzed rental notice · Checked status of Saket Court matter · Generated reply template
              </span>
            </div>
            <span className="italic text-[11px] text-[#8C7355]">
              Illustrative wireframe; case information and statuses are placeholders.
            </span>
          </div>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* 3. INTERACTIVE MODALS                                                     */}
      {/* ========================================================================= */}

      {/* AI Answer Modal */}
      {aiAnswerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#DECDB8] shadow-2xl p-6 sm:p-7 relative animate-in fade-in-50 zoom-in-95">
            <button
              onClick={() => setAiAnswerModal(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#0F172A]">DraftMate AI Legal Explanation</h3>
                <span className="text-xs text-[#8C7355] font-semibold">Plain Language Legal Guidance</span>
              </div>
            </div>

            {aiAnswerLoading ? (
              <div className="py-12 flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 border-3 border-[#1E3A8A] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs text-slate-500 font-medium">Analyzing legal provisions and preparing plain-language advice...</p>
              </div>
            ) : aiAnswerContent ? (
              <div className="space-y-4 text-xs sm:text-sm">
                <div className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DECDB8]">
                  <span className="text-[11px] font-bold text-[#8C7355] uppercase tracking-wider block mb-1">Your Question</span>
                  <p className="text-slate-900 font-medium">{aiAnswerContent.question}</p>
                </div>

                <div className="p-3.5 rounded-2xl bg-[#F0F7FF] border border-[#BFDBFE]">
                  <span className="text-[11px] font-bold text-[#1E3A8A] uppercase tracking-wider block mb-1">Simple Explanation</span>
                  <p className="text-slate-800 leading-relaxed">{aiAnswerContent.summary}</p>
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-900 uppercase tracking-wider block mb-2">Recommended Next Steps:</span>
                  <ul className="space-y-1.5 pl-4 list-disc text-slate-700">
                    {aiAnswerContent.steps.map((st: string, idx: number) => (
                      <li key={idx}>{st}</li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500">Applicable: <strong>{aiAnswerContent.relevantLaw}</strong></span>
                  <button
                    onClick={() => {
                      setAiAnswerModal(false);
                      setDocModalOpen(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white font-semibold hover:bg-[#172554] transition-colors"
                  >
                    Draft Notice Now
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      )}

      {/* Notice Upload Modal */}
      {noticeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#DECDB8] shadow-2xl p-6 sm:p-7 relative">
            <button
              onClick={() => setNoticeModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#0F172A]">Understand a Legal Notice</h3>
                <p className="text-xs text-[#64748B]">Upload PDF or image to get simple points and deadlines</p>
              </div>
            </div>

            <div className="border-2 border-dashed border-[#DECDB8] rounded-2xl p-8 text-center bg-[#FAF8F5] flex flex-col items-center justify-center">
              <UploadCloud className="w-10 h-10 text-[#8C7355] mb-2" />
              <p className="text-sm font-bold text-[#0F172A]">Drop notice PDF or photo here</p>
              <p className="text-xs text-slate-500 mt-1">Supports PDF, JPG, PNG up to 15MB</p>
              <button 
                onClick={() => {
                  alert('Sample notice analyzed. Summary added to My Documents.');
                  setNoticeModalOpen(false);
                }}
                className="mt-4 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#172554] transition-colors"
              >
                Select File from Device
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Case Status Modal */}
      {caseModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-[#DECDB8] shadow-2xl p-6 sm:p-7 relative">
            <button
              onClick={() => setCaseModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#FFF9F0] text-[#B45309] flex items-center justify-center">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#0F172A]">Check Case Status</h3>
                <p className="text-xs text-[#64748B]">Track court proceedings and next hearing date</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">Enter 16-Digit CNR Number or Case Number</label>
                <input
                  type="text"
                  placeholder="e.g. DLCT01-002891-2026"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] text-xs font-mono focus:outline-none focus:border-[#C59B58]"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#0F172A] block mb-1">Court Establishment</label>
                <select className="w-full px-3.5 py-2.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] text-xs text-[#0F172A] focus:outline-none focus:border-[#C59B58]">
                  <option>District & Sessions Court, Delhi</option>
                  <option>High Court of Delhi</option>
                  <option>Supreme Court of India</option>
                  <option>National Consumer Disputes Redressal Commission</option>
                </select>
              </div>
              <button
                onClick={() => {
                  alert('Case linked successfully! Updates will appear in My Cases.');
                  setCaseModalOpen(false);
                }}
                className="w-full mt-2 py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#172554] transition-colors"
              >
                Track Case Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Guided Document Modal */}
      {docModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full border border-[#DECDB8] shadow-2xl p-6 sm:p-7 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setDocModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#F6F3FF] text-[#6D28D9] flex items-center justify-center">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#0F172A]">Create a Guided Legal Document</h3>
                <p className="text-xs text-[#64748B]">Fill out step-by-step questions without complex legal jargon</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-3 mb-1">
              <span className="text-xs font-semibold text-[#8C7355]">Select a template to start drafting:</span>
              <Link
                href="/citizen/drafting-studio"
                className="text-xs font-bold text-[#1E3A8A] hover:underline flex items-center gap-1"
              >
                <span>Open Drafting Studio</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
              {[
                { title: 'Notice for Security Deposit', desc: 'Formal demand notice to landlord to refund deposit.' },
                { title: 'Consumer Forum Complaint', desc: 'Petition for defective goods or deficiency in services.' },
                { title: 'Residential Rent Agreement', desc: '11-month lease agreement with security deposit clauses.' },
                { title: 'Cheque Bounce Reply', desc: 'Section 138 legal notice reply refuting unlawful claim.' },
                { title: 'RTI Application Form', desc: 'Information request under Right to Information Act 2005.' },
                { title: 'General Affidavit', desc: 'Name correction, address proof, or sworn statement.' },
              ].map((tmpl, idx) => (
                <Link
                  key={idx}
                  href={`/citizen/drafting-studio?template=${encodeURIComponent(tmpl.title)}`}
                  onClick={() => setDocModalOpen(false)}
                  className="p-3.5 rounded-2xl bg-[#FAF8F5] border border-[#DECDB8] hover:border-[#1E3A8A] cursor-pointer transition-all hover:shadow-xs block"
                >
                  <h4 className="text-xs font-bold text-[#1E3A8A] font-serif-title">{tmpl.title}</h4>
                  <p className="text-[11px] text-[#475569] mt-1">{tmpl.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Translation Modal */}
      {translateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#DECDB8] shadow-2xl p-6 relative">
            <button
              onClick={() => setTranslateModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-9 h-9 rounded-xl bg-[#DCFCE7] text-[#15803D] flex items-center justify-center">
                <Languages className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title font-bold text-lg text-[#0F172A]">Translate Document</h3>
                <p className="text-xs text-[#64748B]">Understand legal language in your mother tongue</p>
              </div>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-[#0F172A] block mb-1">Target Language</label>
                <div className="grid grid-cols-3 gap-2">
                  <button className="py-2 rounded-xl bg-[#1E3A8A] text-white font-semibold">English</button>
                  <button className="py-2 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] text-[#0F172A] font-semibold hover:bg-white">हिन्दी</button>
                  <button className="py-2 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] text-[#0F172A] font-semibold hover:bg-white">ગુજરાતી</button>
                </div>
              </div>
              <button
                onClick={() => {
                  alert('Language preference saved.');
                  setTranslateModalOpen(false);
                }}
                className="w-full mt-3 py-2.5 rounded-xl bg-[#1E3A8A] text-white font-bold hover:bg-[#172554] transition-colors"
              >
                Apply Language
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Term Explanation Popover Modal */}
      {termModalOpen && selectedTerm && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full border border-[#DECDB8] shadow-2xl p-6 relative">
            <button
              onClick={() => setTermModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-600"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2.5 mb-3">
              <BookOpen className="w-5 h-5 text-[#C59B58]" />
              <h3 className="font-serif-title font-bold text-lg text-[#1E3A8A]">{selectedTerm.term}</h3>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed bg-[#FAF8F5] p-4 rounded-2xl border border-[#DECDB8]">
              {selectedTerm.meaning}
            </p>
            <button
              onClick={() => setTermModalOpen(false)}
              className="w-full mt-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#172554] transition-colors"
            >
              Got it
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
