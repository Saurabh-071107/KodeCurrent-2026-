'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import {
  FileText,
  Languages,
  Calendar,
  Briefcase,
  Scale,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Clock,
  MoreVertical,
  Mail,
  FileCheck,
  X,
  Gavel,
  GraduationCap
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';

export default function StudentDashboardPage() {
  // Navigation State
  const [activeNav, setActiveNav] = useState('Home');

  // User State
  const [studentName, setStudentName] = useState('Saurabh');
  const [studentRole, setStudentRole] = useState('Law Student');

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  };

  // Interactive Modals / Drawers
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [summarizeModalOpen, setSummarizeModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Dashboard Stats State
  const [dashboardData, setDashboardData] = useState<any>({
    notifications: [
      { id: 'notif-1', title: 'Moot Memorial Draft Reviewed', desc: 'Your coach AI reviewed your bail application memo with 94% citation score.', time: '10 mins ago' },
      { id: 'notif-2', title: 'Supreme Court Judgment Added', desc: 'Landmark 3-judge ruling on Section 438 CrPC anticipatory bail is now indexed.', time: '2 hours ago' },
      { id: 'notif-3', title: 'Upcoming Moot Court Deadline', desc: 'National Moot Memorial submission due on 28th October at 11:59 PM.', time: 'Yesterday' }
    ],
    upcomingDates: [
      { day: '28', month: 'OCT', title: 'National Moot Memorial Submission', time: '11:59 PM · Online Portal', color: 'border-l-blue-600' },
      { day: '05', month: 'NOV', title: 'Hearing: Property Partition Case', time: '10:30 AM · High Court Room 4', color: 'border-l-amber-500' },
      { day: '12', month: 'NOV', title: 'Constitutional Law Mid-Term Exam', time: '02:00 PM · Law Faculty Hall', color: 'border-l-purple-600' },
      { day: '18', month: 'NOV', title: 'BCI Advocate Internship Milestone', time: 'Submission of 10 Court Diary Entries', color: 'border-l-emerald-600' },
    ],
    followedCases: [
      { id: 'fc-1', cnr: 'SLP (Crl) 4821/2024', status: 'Listed', title: 'State of Maharashtra v. Vikram & Ors.', court: 'Supreme Court of India · Criminal Law' }
    ]
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getDashboardStats('student');
        if (res.success && res.data) {
          setDashboardData((prev: any) => ({
            ...prev,
            ...res.data,
            notifications: res.data.notifications || prev.notifications,
            upcomingDates: res.data.upcomingHearings?.map((h: any, idx: number) => {
              const parts = (h.hearingDate || '28 Oct').split(' ');
              const colors = ['border-l-blue-600', 'border-l-amber-500', 'border-l-purple-600', 'border-l-emerald-600'];
              return {
                day: parts[0] || '28',
                month: (parts[1] || 'OCT').toUpperCase(),
                title: h.title,
                time: `${h.time || '10:30 AM'} · ${h.court}`,
                color: colors[idx % colors.length]
              };
            }) || prev.upcomingDates
          }));
        }
      } catch (e) {
        console.error('Error fetching student dashboard stats:', e);
      }
    };
    fetchStats();
  }, []);

  // Load user data from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('draftmate_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name) setStudentName(parsed.name);
          if (parsed.role) {
            setStudentRole(parsed.role === 'student' ? 'Law Student' : parsed.role);
          }
        }
      } catch (e) {
        console.error('Failed to parse user profile', e);
      }
    }
  }, []);

  // Keyboard shortcut listener for slash (/) or Ctrl+K
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && 
          document.activeElement?.tagName !== 'INPUT' && 
          document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        const searchInput = document.getElementById('main-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] font-sans flex flex-col xl:flex-row antialiased relative">
      
      {/* Background Classical Courthouse Columns Watermark (Right Margin) */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-80 pointer-events-none opacity-20 overflow-hidden z-0 hidden lg:block select-none"
        style={{
          maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
        }}
      >
        <Image
          src="/assets/pale-blue-courthouse.png"
          alt="Courthouse columns watermark"
          fill
          className="object-cover object-right-top mix-blend-multiply"
        />
      </div>

      {/* ========================================================================= */}
      {/* 1. LEFT SIDEBAR NAVIGATION (Unified Sidebar with Student Center dropdown)   */}
      {/* ========================================================================= */}
      <Sidebar activeNav={activeNav} onSelectNav={setActiveNav} dashboardHref="/student" rolePrefix="/student" />

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 xl:ml-[268px] flex flex-col min-h-screen relative z-10">
        
        {/* ----------------------------------------------------------------------- */}
        {/* TOP BAR: Centered Search Bar, Notifications, User Profile               */}
        {/* ----------------------------------------------------------------------- */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D6] px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Centered Search Bar with Shortcut '/' */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8C7355] absolute left-3.5 pointer-events-none" />
              <input
                id="main-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for cases, laws, drafts, or ask AI..."
                className="w-full pl-9 pr-8 py-2 bg-white border border-[#DECDB8] rounded-full text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 transition-all shadow-2xs"
              />
              <span className="absolute right-3.5 text-xs text-[#94A3B8] font-mono select-none">
                /
              </span>
            </div>
          </div>

          {/* Right Header Action Items */}
          <div className="flex items-center gap-3 sm:gap-4 select-none">

            {/* Notifications Bell */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 rounded-full hover:bg-white text-slate-600 hover:text-slate-900 transition-colors"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>

              {/* Notifications Popover */}
              {notificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-[#E2D9C8] rounded-2xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
                    <div className="flex items-center gap-2">
                      <Bell className="w-4 h-4 text-[#8C7355]" />
                      <h4 className="text-sm font-bold text-[#0F172A]">Notifications & Updates</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8C7355] bg-[#F7EFE1] px-2 py-0.5 rounded-full">
                      3 New
                    </span>
                  </div>
                  
                  <div className="divide-y divide-[#F1EAE0] max-h-72 overflow-y-auto mt-2">
                    {dashboardData.notifications?.map((n: any) => (
                      <div key={n.id} className="py-2.5 text-xs">
                        <p className="font-semibold text-[#0F172A]">{n.title}</p>
                        <p className="text-[#64748B] mt-0.5">{n.message || n.desc}</p>
                        <span className="text-[10px] text-[#94A3B8] mt-1 inline-block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Student Profile (Avatar + Name + Subtitle + Chevron) */}
            <div className="flex items-center gap-2.5 pl-2 cursor-pointer">
              <div 
                className="w-8 h-8 rounded-full bg-[#A67C52] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                title={`${studentName} (${studentRole})`}
              >
                {studentName.charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-[#0F172A]">{studentName}</span>
                <span className="text-[10px] text-[#64748B]">{studentRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
            </div>

          </div>
        </header>

        {/* ----------------------------------------------------------------------- */}
        {/* MAIN DASHBOARD CONTENT SCROLLABLE CANVAS                                 */}
        {/* ----------------------------------------------------------------------- */}
        <main className="p-4 sm:p-6 md:p-7 space-y-6 max-w-[1500px] w-full mx-auto">
          
          {/* ===================================================================== */}
          {/* HERO BANNER — GREETING HEADER                                         */}
          {/* ===================================================================== */}
          <div className="relative overflow-hidden rounded-[26px] bg-[#FAF5EB] border border-[#E7DEC8] p-6 sm:p-9 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-6 min-h-[170px]">
            
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

            {/* Left Content: Legal Wisdom Pill + Greeting + Student Name + Tagline */}
            <div className="relative z-10 max-w-xl">
              
              {/* Aristotle Legal Wisdom Pill (Clear, elegant, does not obstruct court dome) */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#DECDB8] text-[11px] sm:text-xs font-medium text-[#785E3A] mb-3 shadow-2xs backdrop-blur-xs">
                <Scale className="w-3.5 h-3.5 text-[#C59B58]" />
                <span className="italic">&ldquo;The law is reason, free from passion.&rdquo;</span>
                <span className="font-bold text-[#8C7355] uppercase text-[10px] tracking-wider">— Aristotle</span>
              </div>

              {/* Time-based greeting label */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase text-[#8C7355]">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                <span>{getGreeting()}</span>
              </div>

              {/* Elevated Student Name Typography with Warm Accent */}
              <h1 className="font-serif-title text-3xl sm:text-4xl md:text-[50px] font-bold text-[#0F172A] tracking-tight leading-tight mt-1 mb-1.5">
                {studentName}
              </h1>
              
              {/* Refined AI Tagline */}
              <p className="text-[#475569] text-sm sm:text-base font-normal">
                Practice smarter with <span className="font-semibold text-[#0F172A]">Nexora AI</span>.
              </p>

              {/* Signature Gold Underline Accent */}
              <div className="w-14 h-[2.5px] bg-gradient-to-r from-[#C59B58] to-[#DECDB8] rounded-full mt-3.5" />

            </div>

          </div>

          {/* ===================================================================== */}
          {/* 4 TOP ACTION CARDS (WITH WATERMARK ENGRAVING ARTWORK)                  */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: Practise Drafting */}
            <Link 
              href="/student/drafting-studio"
              className="relative overflow-hidden rounded-2xl bg-[#F0F7FF] border border-[#D8E8FC] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px] group block"
            >
              {/* Courthouse Line Art Watermark */}
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
                  <FileText className="w-5 h-5" />
                </div>
                <div className="w-7 h-7 rounded-full bg-white text-[#1D4ED8] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <h3 className="font-serif-title font-bold text-[16px] text-[#1E3A8A]">Practise Drafting</h3>
                <p className="text-[11px] text-[#3B82F6] mt-0.5 font-medium leading-snug">
                  Bail, notices, petitions & deeds with live guided feedback.
                </p>
              </div>
            </Link>

            {/* Card 2: AI Live Courtroom */}
            <Link 
              href="/student/courtroom"
              className="relative overflow-hidden rounded-2xl bg-[#FFF9F0] border border-[#FBE8CE] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px] group block"
            >
              {/* Sepia Courthouse Facade Watermark */}
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
                  <Gavel className="w-5 h-5" />
                </div>
                <div className="w-7 h-7 rounded-full bg-white text-[#B45309] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <h3 className="font-serif-title font-bold text-[16px] text-[#78350F]">AI Live Courtroom</h3>
                <p className="text-[11px] text-[#92400E] mt-0.5 font-medium leading-snug">
                  Argue before an AI judge or opposing counsel with rebuttal drill.
                </p>
              </div>
            </Link>

            {/* Card 3: Exam & Moot Practice */}
            <Link 
              href="/student/exam-prep"
              className="relative overflow-hidden rounded-2xl bg-[#F6F3FF] border border-[#E8DEFD] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px] group block"
            >
              {/* Lavender Law Books Watermark */}
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
                  <GraduationCap className="w-5 h-5" />
                </div>
                <div className="w-7 h-7 rounded-full bg-white text-[#6D28D9] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <h3 className="font-serif-title font-bold text-[16px] text-[#4C1D95]">Exam & Moot Practice</h3>
                <p className="text-[11px] text-[#6D28D9] mt-0.5 font-medium leading-snug">
                  Judiciary prep, bar exam questions & scored feedback.
                </p>
              </div>
            </Link>

            {/* Card 4: Translate Document */}
            <Link 
              href="/student/translation"
              className="relative overflow-hidden rounded-2xl bg-[#F0FAF5] border border-[#D5EFE3] p-4.5 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[145px] group block"
            >
              {/* Mint Translation Book Watermark */}
              <div className="absolute right-0 bottom-0 w-36 h-28 pointer-events-none opacity-75 overflow-hidden">
                <Image
                  src="/assets/mint-translation-book.png"
                  alt="Translation book art"
                  fill
                  className="object-contain object-bottom-right mix-blend-multiply"
                />
              </div>

              <div className="relative z-10 flex items-start justify-between">
                <div className="w-10 h-10 rounded-xl bg-[#D1FAE5] text-[#047857] flex items-center justify-center shadow-2xs">
                  <Languages className="w-5 h-5" />
                </div>
                <div className="w-7 h-7 rounded-full bg-white text-[#047857] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              <div className="relative z-10 mt-3">
                <h3 className="font-serif-title font-bold text-[16px] text-[#064E3B]">Translate Document</h3>
                <p className="text-[11px] text-[#047857] mt-0.5 font-medium leading-snug">
                  Accurate legal translation: English → Hindi → Gujarati.
                </p>
              </div>
            </Link>

          </div>

          {/* ===================================================================== */}
          {/* SECTION: TWO-COLUMN WORKSPACE GRID                                   */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ------------------------------------------------------------------- */}
            {/* LEFT / CENTER COLUMN (8 COLS): Documents, Practice Planner          */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* ITEM 1: CONTINUE WHERE YOU LEFT OFF */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-[#FAF5EB] text-[#8C7355] border border-[#DECDB8] flex items-center justify-center flex-shrink-0">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-[#0F172A]">Continue Where You Left Off</h2>
                      <p className="text-[11px] text-[#64748B]">Resume your active legal draft</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-medium text-[#785E3A] bg-[#FAF5EB] border border-[#DECDB8] px-2.5 py-0.5 rounded-md">
                    Last edited 2h ago
                  </span>
                </div>

                <div className="p-4 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center flex-shrink-0 mt-0.5">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] leading-snug">
                        Special Leave Petition (Criminal) — State of Maharashtra v. Rajesh Kumar
                      </h4>
                      <p className="text-[11px] text-[#64748B] mt-1">
                        Drafting grounds of appeal challenging High Court order under Section 439 CrPC.
                      </p>
                      
                      {/* Progress bar */}
                      <div className="flex items-center gap-3 mt-3 max-w-sm">
                        <div className="flex-1 h-2 bg-[#E2D9C8] rounded-full overflow-hidden">
                          <div className="h-full bg-[#1E3A8A] rounded-full" style={{ width: '75%' }} />
                        </div>
                        <span className="text-[10px] font-bold text-[#1E3A8A] whitespace-nowrap">75% Completed</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex sm:flex-col items-center sm:items-end justify-between gap-2 flex-shrink-0">
                    <button type="button" className="text-[#94A3B8] hover:text-[#0F172A] p-1" title="More options">
                      <MoreVertical className="w-4 h-4" />
                    </button>
                    <Link
                      href="/student/drafting-studio"
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#1E3A8A] hover:bg-[#172554] text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                    >
                      <span>Resume Drafting</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* ITEM 2: SUMMARISE A JUDGMENT & RESEARCH PLANNER */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-1 border-b border-[#EAE3D6]/70">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C59B58]" />
                    <div>
                      <h2 className="text-sm font-bold text-[#0F172A]">Summarise a Judgment & Research Planner</h2>
                      <p className="text-[11px] text-[#64748B]">Extract Ratio Decidendi, Obiter Dicta, and stage procedures</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSummarizeModalOpen(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DECDB8] bg-[#FAF5EB] hover:bg-white text-xs font-semibold text-[#785E3A] transition-colors shadow-2xs"
                  >
                    <span>Paste Judgment Text</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>

                {/* Procedure Planner Stepper */}
                <div className="p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6]">
                  <span className="text-[10px] font-bold text-[#8C7355] uppercase tracking-wider block mb-2.5">
                    CIVIL SUIT PROCEDURE MAP (SECTION 26 & ORDER 7 CPC)
                  </span>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 items-center">
                    
                    {/* Step 1 */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#EAE3D6] text-left">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E3A8A]">
                        <FileText className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>1. Plaint Filing</span>
                      </div>
                      <span className="block text-[10px] text-emerald-600 font-medium mt-0.5">Court fee paid</span>
                    </div>

                    {/* Step 2 */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#EAE3D6] text-left">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E3A8A]">
                        <Mail className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>2. Summons</span>
                      </div>
                      <span className="block text-[10px] text-[#64748B] font-medium mt-0.5">Order 5 CPC</span>
                    </div>

                    {/* Step 3 */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#EAE3D6] text-left">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E3A8A]">
                        <FileCheck className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>3. Written Statement</span>
                      </div>
                      <span className="block text-[10px] text-amber-600 font-medium mt-0.5">30-day clock</span>
                    </div>

                    {/* Step 4 */}
                    <div className="p-2.5 bg-white rounded-xl border border-[#EAE3D6] text-left">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-[#1E3A8A]">
                        <Scale className="w-3.5 h-3.5 text-[#1D4ED8]" />
                        <span>4. Framing Issues</span>
                      </div>
                      <span className="block text-[10px] text-[#64748B] font-medium mt-0.5">Order 14 CPC</span>
                    </div>

                  </div>
                </div>
              </div>

            </div>

            {/* ------------------------------------------------------------------- */}
            {/* RIGHT COLUMN (4 COLS): Upcoming Dates & Followed Cases              */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* ITEM 1: UPCOMING DATES */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EAE3D6]/70">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#8C7355]" />
                    <h3 className="text-sm font-bold text-[#0F172A]">Upcoming Dates</h3>
                  </div>
                  <Link href="#calendar" className="text-xs font-semibold text-[#8C7355] hover:text-[#0F172A] flex items-center gap-1">
                    View All <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>

                <div className="space-y-2.5">
                  {dashboardData.upcomingDates?.map((item: any, idx: number) => (
                    <div 
                      key={idx} 
                      className={`flex items-center justify-between gap-3 p-2.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] border-l-4 ${item.color} hover:bg-white transition-colors`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="flex flex-col items-center justify-center bg-white border border-[#E2D9C8] rounded-lg w-10 h-10 flex-shrink-0 shadow-2xs">
                          <span className="text-[13px] font-bold text-[#0F172A] leading-none">{item.day}</span>
                          <span className="text-[9px] font-bold uppercase text-[#8C7355]">{item.month}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-[#0F172A] truncate">{item.title}</h4>
                          <p className="text-[11px] text-[#64748B] truncate mt-0.5">{item.time}</p>
                        </div>
                      </div>

                      <button 
                        type="button" 
                        className="w-6 h-6 rounded-full border border-[#DECDB8] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] flex-shrink-0"
                        title="View details"
                      >
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* ITEM 2: FOLLOWED CASES */}
              <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs">
                <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#EAE3D6]/70">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-[#8C7355]" />
                    <h3 className="text-sm font-bold text-[#0F172A]">Followed Cases</h3>
                  </div>
                  <span className="text-xs font-semibold text-[#8C7355]">3 Active</span>
                </div>

                <div className="space-y-3">
                  {dashboardData.followedCases?.map((c: any) => (
                    <div key={c.id} className="p-3.5 bg-[#FAF8F5] rounded-xl border border-[#EAE3D6] space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-[#1E3A8A] bg-[#EBF2FC] px-2 py-0.5 rounded border border-[#BFDBFE]">
                          {c.cnr}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                            {c.status}
                          </span>
                          <button type="button" className="text-[#94A3B8] hover:text-[#0F172A]">
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <h4 className="text-xs font-bold text-[#0F172A] pt-1">{c.title}</h4>
                      <p className="text-[11px] text-[#64748B]">{c.court}</p>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL 2: SUMMARISE A JUDGMENT                                             */}
      {/* ========================================================================= */}
      {summarizeModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#EAE3D6] rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-xl font-bold text-[#0F172A]">Summarise a Judgment</h3>
                  <p className="text-xs text-[#64748B]">Extract Ratio, Obiter & Headnotes instantly</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSummarizeModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-3">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Paste Judgment Text, Citation or Case Law Excerpt:
              </label>
              <textarea
                rows={5}
                placeholder="Paste judicial ruling or citation here (e.g. (2024) INSC 150)..."
                className="w-full p-3.5 bg-white rounded-xl border border-[#E2D9C8] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE3D6]">
              <button
                type="button"
                onClick={() => setSummarizeModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#64748B]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Extracting Ratio Decidendi and Key Takeaways...');
                  setSummarizeModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] shadow-sm flex items-center gap-2"
              >
                Generate Legal Summary
                <Sparkles className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
