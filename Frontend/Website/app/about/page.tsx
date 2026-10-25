import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import Navbar from '@/components/Navbar';
import {
  Scale,
  BookOpen,
  FileText,
  Languages,
  Gavel,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Users,
  Compass
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'About Us — NEXORA Legal AI',
  description: 'Learn about NEXORA, an AI-powered legal platform designed to support legal education, legal research, document workflows, and interactive learning.',
};

interface TeamMember {
  name: string;
  department: string;
  initials: string;
}

const TEAM_MEMBERS: TeamMember[] = [
  {
    name: 'Saurabh Singh',
    department: 'Mathematics and Computing',
    initials: 'SS',
  },
  {
    name: 'Archit Dubey',
    department: 'Mathematics and Computing',
    initials: 'AD',
  },
  {
    name: 'Rishabh Parashar',
    department: 'Mathematics and Computing',
    initials: 'RP',
  },
  {
    name: 'Imon Kumar',
    department: 'Electronics',
    initials: 'IK',
  },
];

const PLATFORM_CAPABILITIES = [
  {
    title: 'AI Drafting Studio',
    desc: 'Structured legal drafting for notices, agreements, petitions, and corporate contracts with clause-level control, real-time citation analysis, and universal voice read-aloud.',
    icon: <FileText className="w-5 h-5 text-[#1E3A8A]" />,
  },
  {
    title: 'Document Translation',
    desc: 'Bilingual legal document translation across 13 recognized Indian languages, preserving statutory syntax, judicial phraseology, and legal meaning.',
    icon: <Languages className="w-5 h-5 text-[#1E3A8A]" />,
  },
  {
    title: 'Legal Research & Bare Acts',
    desc: 'Deep legal intelligence querying Indian Bare Acts, Constitutional provisions, Bharatiya Nyaya Sanhita (BNS), BNSS, and Supreme Court precedent.',
    icon: <BookOpen className="w-5 h-5 text-[#1E3A8A]" />,
  },
  {
    title: 'AI Live Courtroom',
    desc: 'Interactive moot court advocacy simulation providing real-time judicial questioning, cross-examination practice, and objective oral argument scoring.',
    icon: <Gavel className="w-5 h-5 text-[#1E3A8A]" />,
  },
  {
    title: 'Document Verification',
    desc: 'Automated citation verification, cross-reference validation, ambiguity detection, and risk analysis for legal submissions and contracts.',
    icon: <ShieldCheck className="w-5 h-5 text-[#1E3A8A]" />,
  },
  {
    title: 'Case Tracker & Management',
    desc: 'Centralized tracking of ongoing case proceedings, hearing schedules, legal documents, and matter history across judicial forums.',
    icon: <Scale className="w-5 h-5 text-[#1E3A8A]" />,
  },
];

export default function AboutPage() {
  return (
    <div className="min-h-screen w-full relative flex flex-col justify-between overflow-x-hidden bg-[#FAF8F5] text-[#0F172A] selection:bg-[#C59B58]/20 selection:text-[#0F172A] font-sans">
      
      {/* 1. Atmospheric Ambient Background Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(135deg, #FAF8F5 0%, #FAF4EA 30%, #F7EBD8 60%, #FAF5EB 100%)',
          }}
        />
        <div
          className="absolute right-[5%] top-0 w-[65vw] max-w-[1200px] h-[75vh] opacity-80"
          style={{
            background: 'radial-gradient(circle at 60% 30%, rgba(255, 238, 204, 0.9) 0%, rgba(252, 226, 178, 0.5) 40%, transparent 75%)',
          }}
        />
        <div
          className="absolute left-[5%] bottom-10 w-[55vw] h-[50vh] opacity-60"
          style={{
            background: 'radial-gradient(circle at 30% 70%, rgba(250, 225, 175, 0.4) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* 2. Top Navigation Bar */}
      <Navbar />

      {/* 3. Main Content Container */}
      <main className="relative z-10 flex-1 max-w-[1320px] w-full mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-12 space-y-16 sm:space-y-24">
        
        {/* =================================================================== */}
        {/* HERO SECTION: About NEXORA                                         */}
        {/* =================================================================== */}
        <section className="text-center max-w-4xl mx-auto space-y-6 pt-4">
          
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#FAF0DE] border border-[#DECDB8] shadow-2xs">
            <Sparkles className="w-4 h-4 text-[#C59B58]" />
            <span className="text-xs sm:text-sm font-semibold tracking-wide text-[#8C7355] uppercase">
              AI-Powered Legal Education &amp; Drafting Studio
            </span>
          </div>

          <h1 className="font-serif-title text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[#0F172A] leading-[1.15]">
            Bridging Indian Law and Intelligent Technology
          </h1>

          <p className="text-base sm:text-xl text-[#475569] leading-relaxed max-w-3xl mx-auto font-normal">
            NEXORA is an AI-powered legal platform created to support legal education, legal research, document workflows, and interactive learning through responsible artificial intelligence.
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-white bg-[#0F172A] hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all"
            >
              <span>Explore Workspace</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl text-sm sm:text-base font-semibold text-[#0F172A] bg-white/80 border border-[#CBD5E1] hover:bg-white hover:border-[#94A3B8] shadow-2xs transition-all"
            >
              <span>Sign In</span>
            </Link>
          </div>
        </section>

        {/* =================================================================== */}
        {/* MISSION & VISION: Two-Column Warm Parchment Cards                   */}
        {/* =================================================================== */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          
          {/* Mission Card */}
          <div className="relative bg-white/90 backdrop-blur-xs border border-[#DECDB8] rounded-2xl sm:rounded-3xl p-7 sm:p-10 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center font-bold">
              <Compass className="w-6 h-6 text-[#1E3A8A]" />
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Our Mission
            </h2>
            <p className="text-[#475569] leading-relaxed text-sm sm:text-base font-normal">
              NEXORA aims to make legal learning and research more accessible through responsible AI, practical learning tools, and efficient legal workflows.
            </p>
            <p className="text-[#475569] leading-relaxed text-sm sm:text-base font-normal">
              By automating repetitive formatting and citation retrieval while keeping human judgment and ethical oversight strictly central, NEXORA equips students, advocates, and citizens with trustworthy legal tools tailored for the Indian legal framework.
            </p>
          </div>

          {/* Vision Card */}
          <div className="relative bg-white/90 backdrop-blur-xs border border-[#DECDB8] rounded-2xl sm:rounded-3xl p-7 sm:p-10 shadow-sm hover:shadow-md transition-shadow space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center font-bold">
              <Scale className="w-6 h-6 text-[#1E3A8A]" />
            </div>
            <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0F172A]">
              Our Vision
            </h2>
            <p className="text-[#475569] leading-relaxed text-sm sm:text-base font-normal">
              Our vision is to improve legal education and access to legal knowledge through responsible, practical, and reliable AI technology.
            </p>
            <p className="text-[#475569] leading-relaxed text-sm sm:text-base font-normal">
              We envision an ecosystem where law students master court advocacy through realistic simulations, practitioners draft verified pleadings without barriers, and citizens comprehend complex statutory rights in their native regional languages.
            </p>
          </div>

        </section>

        {/* =================================================================== */}
        {/* MEET THE TEAM: 4 Team Members Grid (Clean, Responsive, Accurate)   */}
        {/* =================================================================== */}
        <section className="space-y-8 sm:space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8C7355]">
              <Users className="w-4 h-4 text-[#C59B58]" />
              <span>Project Contributors</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0F172A]">
              Meet the Team
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              The dedicated student developers behind the design and implementation of NEXORA.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {TEAM_MEMBERS.map((member) => (
              <div
                key={member.name}
                className="bg-white border border-[#DECDB8] rounded-2xl p-6 sm:p-7 shadow-2xs hover:shadow-md hover:border-[#1E3A8A]/40 transition-all flex flex-col items-center text-center group"
              >
                {/* Tasteful Initials Crest Avatar */}
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#1E3A8A] to-[#0F172A] text-white flex items-center justify-center font-serif text-2xl font-bold tracking-wider shadow-sm group-hover:scale-105 transition-transform mb-5 border-2 border-[#C59B58]/40">
                  <span>{member.initials}</span>
                </div>

                {/* Member Name */}
                <h3 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                  {member.name}
                </h3>

                {/* Academic Department */}
                <div className="mt-2.5 px-3 py-1 bg-[#FAF5EB] border border-[#DECDB8] rounded-full text-xs font-semibold text-[#8C7355]">
                  {member.department}
                </div>
              </div>
            ))}
          </div>

        </section>

        {/* =================================================================== */}
        {/* OPERATIONAL CAPABILITIES: Implemented Platform Features             */}
        {/* =================================================================== */}
        <section className="space-y-8 sm:space-y-10">
          
          <div className="text-center max-w-2xl mx-auto space-y-3">
            <div className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold uppercase tracking-wider text-[#8C7355]">
              <GraduationCap className="w-4 h-4 text-[#C59B58]" />
              <span>Implemented Features</span>
            </div>
            <h2 className="font-serif-title text-3xl sm:text-4xl font-bold text-[#0F172A]">
              Platform Capabilities
            </h2>
            <p className="text-sm sm:text-base text-[#64748B]">
              Real, operational tools built to assist judicial preparation, legal research, and automated document workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
            {PLATFORM_CAPABILITIES.map((cap) => (
              <div
                key={cap.title}
                className="bg-white/90 border border-[#DECDB8] rounded-2xl p-6 shadow-2xs hover:shadow-sm transition-all space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center">
                  {cap.icon}
                </div>
                <h3 className="text-base sm:text-lg font-bold text-[#0F172A]">
                  {cap.title}
                </h3>
                <p className="text-xs sm:text-sm text-[#475569] leading-relaxed">
                  {cap.desc}
                </p>
              </div>
            ))}
          </div>

        </section>

        {/* =================================================================== */}
        {/* ARCHITECTURAL COMMITMENTS                                          */}
        {/* =================================================================== */}
        <section className="bg-[#F4ECE1] border border-[#DECDB8] rounded-2xl sm:rounded-3xl p-7 sm:p-10 shadow-2xs space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#DECDB8]">
            <div>
              <h2 className="font-serif-title text-2xl sm:text-3xl font-bold text-[#0F172A]">
                Our Architectural Commitments
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                Engineered for legal reliability, authenticity, and verified data.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block animate-pulse" />
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                Active &amp; Operational
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#DECDB8]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Real API &amp; Database Backed</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Zero hardcoded business responses or simulated mock records.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#DECDB8]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Universal Read Aloud</h4>
                <p className="text-xs text-[#64748B] mt-0.5">Synthesized text-to-speech across chats, drafts, translations, and explanations.</p>
              </div>
            </div>

            <div className="flex items-start gap-3 p-3 rounded-xl bg-white/70 border border-[#DECDB8]">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Multilingual Inclusivity</h4>
                <p className="text-xs text-[#64748B] mt-0.5">High-fidelity translation across 13 Indian regional languages.</p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* 4. Elegant Website Footer */}
      <footer className="relative z-10 w-full border-t border-[#DECDB8] bg-[#F4ECE1] text-[#0F172A] mt-16 sm:mt-24 py-10 px-6 sm:px-12 lg:px-16">
        <div className="max-w-[1320px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-left">
          
          <div className="flex items-center gap-3">
            <div className="relative w-9 h-9 overflow-hidden flex-shrink-0">
              <Image
                src="/assets/nexora-logo.png"
                alt="NEXORA Logo"
                width={72}
                height={72}
                className="w-full h-auto object-cover object-top"
              />
            </div>
            <div>
              <span className="font-brand text-xl font-bold tracking-[0.16em] text-[#0F172A]">
                NEXORA
              </span>
              <p className="text-xs text-[#64748B]">AI Legal Education &amp; Drafting Studio</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 text-xs sm:text-sm font-medium text-[#475569]">
            <Link href="/" className="hover:text-[#0F172A] transition-colors">Home</Link>
            <Link href="/about" className="font-bold text-[#0F172A]">About Us</Link>
            <Link href="/drafting-studio" className="hover:text-[#0F172A] transition-colors">Drafting Studio</Link>
            <Link href="/translation" className="hover:text-[#0F172A] transition-colors">Translation</Link>
            <Link href="/legal-research" className="hover:text-[#0F172A] transition-colors">Legal Research</Link>
            <Link href="/login" className="hover:text-[#0F172A] transition-colors">Sign In</Link>
          </div>

          <div className="text-xs text-[#64748B]">
            &copy; 2026 NEXORA. All rights reserved.
          </div>

        </div>
      </footer>

    </div>
  );
}
