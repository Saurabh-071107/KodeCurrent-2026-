'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import {
  Home,
  Briefcase,
  Languages,
  Search,
  Bell,
  ChevronDown,
  ArrowRight,
  Calendar,
  FileText,
  Scale,
  Sparkles,
  BookOpen,
  Sliders,
  Users,
  X
} from 'lucide-react';

export default function AdvocateDashboardPage() {
  // Navigation State
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // User State
  const [advocateName, setAdvocateName] = useState('Adv. Saurabh');
  const [advocateRole, setAdvocateRole] = useState('Advocate · High Court');

  // Interactive Modals / Drawers
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [researchModalOpen, setResearchModalOpen] = useState(false);
  const [draftModalOpen, setDraftModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Dashboard Stats State
  const [dashboardData, setDashboardData] = useState<any>({
    activeMatters: 12,
    upcomingHearings: 3,
    recentDrafts: 5,
    hearings: [
      { id: 'h-1', day: '28', month: 'OCT', title: 'Sharma v. State', court: 'Civil Court · Court Room 4 · 10:30 AM', stage: 'Arguments', color: 'blue' },
      { id: 'h-2', day: '30', month: 'OCT', title: 'Patel v. Mehta', court: 'District Court · Court Room 2 · 11:00 AM', stage: 'Framing Issues', color: 'amber' },
      { id: 'h-3', day: '04', month: 'NOV', title: 'Gupta Infotech v. Union of India', court: 'High Court of Delhi · Court 12 · 02:15 PM', stage: 'Final Hearing', color: 'emerald' },
    ],
    recentDraftsList: [
      { id: 'd-1', title: 'Legal Notice — Rent Default', caseTitle: 'Under Section 106 Transfer of Property Act · Last edited recently', status: 'Drafting' },
      { id: 'd-2', title: 'Bail Application under Section 439 CrPC', caseTitle: 'State of NCT Delhi v. Manish Verma · Yesterday', status: 'Review Ready' },
      { id: 'd-3', title: 'Commercial Software License Agreement', caseTitle: 'TechVentures Pvt Ltd · 24 Oct', status: 'Ready for Dispatch' }
    ],
    notifications: [
      { id: 'n-1', title: 'Hearing in 45 Minutes', desc: 'Sharma v. State is listed at Court Room 4, Civil Court at 10:30 AM.', time: 'Urgent · Today' },
      { id: 'n-2', title: 'High Court Cause List Published', desc: 'SLP (Crl) 4821/2024 listed for preliminary arguments on 14 Nov 2026.', time: '1 hour ago' },
      { id: 'n-3', title: 'Client Review Received', desc: 'Legal Notice for Rent Default approved by client for dispatch.', time: 'Yesterday' }
    ],
    quote: {
      text: 'Justice is the constant and perpetual will to render to each his due.',
      author: 'Justinian'
    }
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await api.getDashboardStats('advocate');
        if (res.success && res.data) {
          setDashboardData(res.data);
        }
      } catch (e) {
        console.error('Error fetching advocate dashboard stats:', e);
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
          if (parsed.name) {
            setAdvocateName(parsed.name.startsWith('Adv.') ? parsed.name : `Adv. ${parsed.name}`);
          }
          if (parsed.onboarding?.enrollmentId) {
            setAdvocateRole(`Advocate · ${parsed.onboarding.enrollmentId}`);
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
        const searchInput = document.getElementById('advocate-search-input');
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

  // Sidebar items matching official Nexora layout
  const navItems = [
    { name: 'Dashboard', icon: <Home className="w-5 h-5" />, href: '/advocate' },
    { name: 'Nexora AI', icon: <Sparkles className="w-5 h-5" />, href: '/advocate/nexora-ai' },
    { name: 'Drafting Studio', icon: <FileText className="w-5 h-5" />, href: '/advocate/drafting-studio' },
    { name: 'Case Tracker', icon: <Briefcase className="w-5 h-5" />, href: '/advocate/case-tracker' },
    { name: 'Client Management', icon: <Users className="w-5 h-5" />, href: '/advocate/client-management' },
    { name: 'Legal Research', icon: <BookOpen className="w-5 h-5" />, href: '/advocate/legal-research' },
    { name: 'Translation', icon: <Languages className="w-5 h-5" />, href: '/advocate/translation' },
  ];

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
      {/* 1. LEFT SIDEBAR NAVIGATION                                                */}
      {/* ========================================================================= */}
      <aside className="w-full xl:w-[268px] xl:h-screen bg-[#FAF8F5] border-r border-[#EAE3D6] flex flex-col justify-between p-4 sm:p-5 xl:fixed xl:inset-y-0 xl:left-0 z-40 select-none overflow-y-auto scrollbar-none">
        <div>
          {/* Logo Brand Header: User's Official Nexora Logo */}
          <div className="flex items-center justify-between pb-5 pt-1 px-2 border-b border-[#EAE3D6]">
            <Link href="/advocate" className="flex items-center gap-3.5 group">
              <div className="relative w-11 h-10 overflow-hidden flex-shrink-0">
                <Image
                  src="/assets/nexora-logo.png"
                  alt="Nexora Logo"
                  width={160}
                  height={160}
                  priority
                  className="absolute top-0 left-1/2 -translate-x-1/2 w-13 h-auto object-cover object-top max-w-none transform transition-transform group-hover:scale-105"
                />
              </div>
              <div className="flex flex-col">
                <span className="font-brand text-2xl font-bold tracking-[0.16em] text-[#0F172A] leading-none">
                  NEXORA
                </span>
                <span className="text-[10px] tracking-[0.2em] font-medium text-[#8C7355] uppercase mt-1 leading-none">
                  LAW MADE SIMPLE
                </span>
              </div>
            </Link>

            {/* Mobile Hamburger Button */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="xl:hidden p-1.5 rounded-lg text-slate-700 hover:bg-[#EFE8DC]"
              aria-label="Toggle menu"
            >
              <Sliders className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Links with larger text and icons */}
          <nav className={`mt-5 space-y-1 ${mobileMenuOpen ? 'block' : 'hidden xl:block'}`}>
            {navItems.map((item) => {
              const isActive = activeNav === item.name;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    setActiveNav(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[14px] font-semibold transition-all relative text-left ${
                    isActive
                      ? 'bg-[#EBF2FC] text-[#1E3A8A] font-bold shadow-2xs'
                      : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F2ECE1]/70'
                  }`}
                >
                  {/* Left Active Indicator Bar (Signature Blue Pill) */}
                  {isActive && (
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#1E3A8A] rounded-r-md" />
                  )}
                  <span className={`${isActive ? 'text-[#1E3A8A]' : 'text-[#64748B]'}`}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar Bottom: Supreme Court Engraving (Enlarged) */}
        <div className="hidden xl:flex flex-col items-center text-center pt-3 pb-2 px-1 border-t border-[#EAE3D6]/70 mt-auto">
          <div className="relative w-full h-36 sm:h-44 md:h-48 opacity-95">
            <Image
              src="/assets/supreme-court-engraving.png"
              alt="Supreme Court of India"
              fill
              className="object-contain object-bottom mix-blend-multiply"
            />
          </div>
          <span className="text-[10px] tracking-[0.25em] font-serif font-bold text-[#8C7355] uppercase mt-2">
            CONSTITUTION OF INDIA
          </span>
        </div>
      </aside>

      {/* ========================================================================= */}
      {/* 2. MAIN CONTENT AREA                                                      */}
      {/* ========================================================================= */}
      <div className="flex-1 xl:ml-[268px] flex flex-col min-h-screen relative z-10">
        
        {/* ----------------------------------------------------------------------- */}
        {/* SECTION 1A: TOP BAR: Search, Notifications, Advocate Profile            */}
        {/* ----------------------------------------------------------------------- */}
        <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D6] px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
          
          {/* Centered Search Bar with Shortcut '/' */}
          <div className="flex-1 max-w-xl mx-auto">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-[#8C7355] absolute left-3.5 pointer-events-none" />
              <input
                id="advocate-search-input"
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
                      <h4 className="text-sm font-bold text-[#0F172A]">Practice Notifications</h4>
                    </div>
                    <span className="text-[11px] font-semibold text-[#8C7355] bg-[#F7EFE1] px-2 py-0.5 rounded-full">
                      {dashboardData.notifications?.length || 0} Alerts
                    </span>
                  </div>
                  
                  <div className="divide-y divide-[#F1EAE0] max-h-72 overflow-y-auto mt-2">
                    {dashboardData.notifications?.map((n: any) => (
                      <div key={n.id} className="py-2.5 text-xs">
                        <p className="font-semibold text-[#0F172A]">{n.title}</p>
                        <p className="text-[#64748B] mt-0.5">{n.desc}</p>
                        <span className="text-[10px] text-[#94A3B8] mt-1 inline-block">{n.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Advocate Profile */}
            <div className="flex items-center gap-2.5 pl-2 cursor-pointer">
              <div 
                className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
                title={`${advocateName} (${advocateRole})`}
              >
                {advocateName.replace('Adv. ', '').charAt(0).toUpperCase()}
              </div>
              <div className="hidden sm:flex flex-col text-left leading-tight">
                <span className="text-xs font-bold text-[#0F172A]">{advocateName}</span>
                <span className="text-[10px] text-[#64748B]">{advocateRole}</span>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
            </div>

          </div>
        </header>

        {/* ----------------------------------------------------------------------- */}
        {/* MAIN DASHBOARD CONTENT CANVAS                                            */}
        {/* ----------------------------------------------------------------------- */}
        <main className="p-4 sm:p-6 md:p-8 space-y-7 max-w-[1500px] w-full mx-auto">
          
          {/* ===================================================================== */}
          {/* SECTION 1: WELCOME HEADER BANNER                                      */}
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

            {/* Left Content: Legal Wisdom Pill + Greeting + Title + Tagline */}
            <div className="relative z-10 max-w-xl">
              
              {/* Justinian Legal Wisdom Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/80 border border-[#DECDB8] text-[11px] sm:text-xs font-medium text-[#785E3A] mb-3 shadow-2xs backdrop-blur-xs">
                <Scale className="w-3.5 h-3.5 text-[#C59B58]" />
                <span className="italic">&ldquo;{dashboardData.quote?.text || 'Justice is the constant and perpetual will to render to each his due.'}&rdquo;</span>
                <span className="font-bold text-[#8C7355] uppercase text-[10px] tracking-wider">— {dashboardData.quote?.author || 'Justinian'}</span>
              </div>

              {/* Greeting */}
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold tracking-[0.16em] uppercase text-[#8C7355]">
                <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                <span>{getGreeting()}</span>
              </div>

              {/* Advocate Title */}
              <h1 className="font-serif-title text-3xl sm:text-4xl md:text-[46px] font-bold text-[#0F172A] tracking-tight leading-tight mt-1 mb-1.5">
                Good morning, Advocate
              </h1>
              
              {/* Subtitle */}
              <p className="text-[#475569] text-base sm:text-lg font-normal">
                Here&apos;s your practice at a glance.
              </p>

              {/* Signature Gold Underline Accent */}
              <div className="w-14 h-[2.5px] bg-gradient-to-r from-[#C59B58] to-[#DECDB8] rounded-full mt-3.5" />

            </div>

          </div>

          {/* ===================================================================== */}
          {/* SECTION 2: THREE COMPACT STATS CARDS                                  */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            
            {/* Stat 1: Active Matters */}
            <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-serif-title text-[#0F172A] block leading-none">
                  {dashboardData.activeMatters < 10 ? `0${dashboardData.activeMatters}` : dashboardData.activeMatters}
                </span>
                <h3 className="text-sm font-bold text-[#0F172A] mt-2">Active Matters</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">High Court & District Courts</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center flex-shrink-0">
                <Briefcase className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 2: Upcoming Hearings */}
            <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-serif-title text-[#B45309] block leading-none">
                  {dashboardData.upcomingHearings < 10 ? `0${dashboardData.upcomingHearings}` : dashboardData.upcomingHearings}
                </span>
                <h3 className="text-sm font-bold text-[#0F172A] mt-2">Upcoming Hearings</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">Next hearing on 28 Oct</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center flex-shrink-0">
                <Calendar className="w-6 h-6" />
              </div>
            </div>

            {/* Stat 3: Recent Drafts */}
            <div className="bg-white rounded-2xl border border-[#E8E2D5] p-5 shadow-2xs hover:shadow-md transition-all flex items-center justify-between">
              <div>
                <span className="text-3xl sm:text-4xl font-bold font-serif-title text-[#1E3A8A] block leading-none">
                  {dashboardData.recentDrafts < 10 ? `0${dashboardData.recentDrafts}` : dashboardData.recentDrafts}
                </span>
                <h3 className="text-sm font-bold text-[#0F172A] mt-2">Recent Drafts</h3>
                <p className="text-[11px] text-[#64748B] mt-0.5">2 pending client review</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-[#EFF6FF] text-[#1D4ED8] flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* ===================================================================== */}
          {/* SECTION 3: QUICK ACTIONS (START A TASK)                                */}
          {/* ===================================================================== */}
          <div className="space-y-3.5">
            <div>
              <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">Quick Actions</h2>
              <p className="text-xs text-[#64748B]">Start a task</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* Quick Action 1: Draft a Document */}
              <Link 
                href="/advocate/drafting-studio"
                className="relative overflow-hidden rounded-2xl bg-[#F0F7FF] border border-[#D8E8FC] p-5 sm:p-6 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[160px] group block"
              >
                {/* Courthouse Line Art Watermark */}
                <div className="absolute right-0 bottom-0 w-44 h-32 pointer-events-none opacity-80 overflow-hidden">
                  <Image
                    src="/assets/pale-blue-courthouse.png"
                    alt="Courthouse art"
                    fill
                    className="object-contain object-bottom-right mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center shadow-2xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white text-[#1D4ED8] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="relative z-10 mt-4">
                  <h3 className="font-serif-title font-bold text-lg text-[#1E3A8A]">Draft a Document</h3>
                  <p className="text-xs text-[#3B82F6] mt-1 font-medium leading-relaxed max-w-sm">
                    Notices, petitions, agreements & applications with guided AI statutory assistance.
                  </p>
                </div>
              </Link>

              {/* Quick Action 2: Legal Research */}
              <div 
                onClick={() => setResearchModalOpen(true)}
                className="relative overflow-hidden rounded-2xl bg-[#FFF9F0] border border-[#FBE8CE] p-5 sm:p-6 transition-all duration-200 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[160px] group"
              >
                {/* Sepia Courthouse Facade Watermark */}
                <div className="absolute right-0 bottom-0 w-44 h-32 pointer-events-none opacity-80 overflow-hidden">
                  <Image
                    src="/assets/sepia-courthouse-facade.png"
                    alt="Courthouse facade art"
                    fill
                    className="object-contain object-bottom-right mix-blend-multiply"
                  />
                </div>

                <div className="relative z-10 flex items-start justify-between">
                  <div className="w-11 h-11 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center shadow-2xs">
                    <Search className="w-6 h-6" />
                  </div>
                  <div className="w-8 h-8 rounded-full bg-white text-[#B45309] flex items-center justify-center shadow-2xs group-hover:translate-x-0.5 transition-transform">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>

                <div className="relative z-10 mt-4">
                  <h3 className="font-serif-title font-bold text-lg text-[#78350F]">Legal Research</h3>
                  <p className="text-xs text-[#92400E] mt-1 font-medium leading-relaxed max-w-sm">
                    Find judgments, ratio decidendi, statutory sections and authorities across Indian courts.
                  </p>
                </div>
              </div>

            </div>
          </div>

          {/* ===================================================================== */}
          {/* SECTION 4 & 5: TWO-COLUMN WORKSPACE (HEARINGS & RECENT DRAFTS)        */}
          {/* ===================================================================== */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            
            {/* ------------------------------------------------------------------- */}
            {/* SECTION 4: UPCOMING HEARINGS (SHOW NEXT TWO OR THREE CASES)         */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E8E2D5] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAE3D6]/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF5EB] text-[#8C7355] flex items-center justify-center">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Upcoming Hearings</h3>
                      <p className="text-xs text-[#64748B]">Next listed matters before courts</p>
                    </div>
                  </div>
                  <Link href="#hearings" className="text-xs font-semibold text-[#8C7355] hover:text-[#0F172A] flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {dashboardData.hearings?.map((h: any) => (
                    <div key={h.id} className={`flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] border-l-4 hover:bg-white transition-colors shadow-2xs ${
                      h.color === 'blue' ? 'border-l-blue-600' : h.color === 'amber' ? 'border-l-amber-500' : 'border-l-emerald-600'
                    }`}>
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="flex flex-col items-center justify-center bg-white border border-[#E2D9C8] rounded-xl w-12 h-12 flex-shrink-0 shadow-2xs">
                          <span className="text-[14px] font-bold text-[#0F172A] leading-none">{h.day}</span>
                          <span className="text-[9px] font-bold uppercase text-[#8C7355] mt-0.5">{h.month}</span>
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#0F172A] truncate">{h.title}</h4>
                          <p className="text-xs text-[#64748B] mt-0.5">{h.court}</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md hidden sm:inline-block">
                        {h.stage}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ------------------------------------------------------------------- */}
            {/* SECTION 5: RECENT DRAFTS (SHOW LAST TWO OR THREE DOCUMENTS)         */}
            {/* ------------------------------------------------------------------- */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-[#E8E2D5] p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#EAE3D6]/80">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#FAF5EB] text-[#8C7355] flex items-center justify-center">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-[#0F172A]">Recent Drafts</h3>
                      <p className="text-xs text-[#64748B]">Active pleadings and legal notices</p>
                    </div>
                  </div>
                  <Link href="#drafts" className="text-xs font-semibold text-[#8C7355] hover:text-[#0F172A] flex items-center gap-1">
                    View all <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>

                <div className="space-y-3">
                  {dashboardData.recentDraftsList?.map((d: any) => (
                    <Link 
                      key={d.id}
                      href="/advocate/drafting-studio" 
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] hover:bg-white hover:border-[#1E3A8A]/30 transition-colors shadow-2xs block"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center flex-shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-sm font-bold text-[#0F172A] truncate">
                            {d.title}
                          </h4>
                          <p className="text-xs text-[#64748B] mt-0.5">
                            {d.caseTitle || d.date}
                          </p>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 border border-blue-200 px-2.5 py-1 rounded-md whitespace-nowrap">
                        {d.status}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

          </div>

        </main>
      </div>

      {/* ========================================================================= */}
      {/* MODAL: DRAFT A DOCUMENT                                                   */}
      {/* ========================================================================= */}
      {draftModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#EAE3D6] rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#DBEAFE] text-[#1D4ED8] flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-xl font-bold text-[#0F172A]">Draft a New Document</h3>
                  <p className="text-xs text-[#64748B]">Create legal notices, petitions, and commercial deeds</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-4 text-xs sm:text-sm text-[#475569]">
              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Document Type:
                </label>
                <select className="w-full p-3 bg-white rounded-xl border border-[#E2D9C8] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#C59B58]">
                  <option>Legal Notice (Section 138 NI Act / Section 106 TPA)</option>
                  <option>Criminal Bail Application (Sec 437/439 CrPC)</option>
                  <option>Civil Injunction Application (Order 39 Rules 1 & 2 CPC)</option>
                  <option>Special Leave Petition (Civil / Criminal)</option>
                  <option>Commercial Agreement / Lease Deed</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0F172A] mb-1.5">
                  Matter Title / Client Name:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Legal Notice against Acme Corp for Non-Payment"
                  className="w-full p-3 bg-white rounded-xl border border-[#E2D9C8] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#C59B58]"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE3D6]">
              <button
                type="button"
                onClick={() => setDraftModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Opening AI Drafting Studio...');
                  setDraftModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] shadow-sm flex items-center gap-2"
              >
                Launch Drafting Studio
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: LEGAL RESEARCH                                                     */}
      {/* ========================================================================= */}
      {researchModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FAF7F2] border border-[#EAE3D6] rounded-[28px] max-w-xl w-full p-6 sm:p-8 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center">
                  <Search className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-xl font-bold text-[#0F172A]">AI Legal Research</h3>
                  <p className="text-xs text-[#64748B]">Search precedents, statutory sections, and landmark ratios</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setResearchModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-5 space-y-3">
              <label className="block text-xs font-semibold text-[#0F172A]">
                Research Query or Proposition:
              </label>
              <textarea
                rows={4}
                placeholder="e.g. Can criminal proceedings under Section 420 IPC be quashed if a dispute is purely of civil nature involving breach of contract?"
                className="w-full p-3.5 bg-white rounded-xl border border-[#E2D9C8] text-xs sm:text-sm text-[#0F172A] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#EAE3D6]">
              <button
                type="button"
                onClick={() => setResearchModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-[#64748B]"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  alert('Searching legal precedents and Supreme Court ratios...');
                  setResearchModalOpen(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] shadow-sm flex items-center gap-2"
              >
                Find Precedents
                <Search className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
