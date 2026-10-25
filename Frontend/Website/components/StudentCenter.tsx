'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ExamMootPrep from './ExamMootPrep';
import InternshipCareerHub from './InternshipCareerHub';
import CertificatesAchievements from './CertificatesAchievements';
import AILiveCourtroom from './AILiveCourtroom';
import {
  CheckCircle2,
  Download
} from 'lucide-react';

export type StudentCenterTab =
  | 'courtroom'
  | 'moot'
  | 'exam'
  | 'career'
  | 'certifications';

interface StudentCenterProps {
  initialTab?: StudentCenterTab | string;
  studentName?: string;
  dashboardHref?: string;
}

export default function StudentCenter({
  initialTab = 'courtroom',
  studentName = 'Saurabh',
  dashboardHref = '/student'
}: StudentCenterProps) {
  // Map any incoming slug string to valid tab
  const getSanitizedTab = (tabStr: string): StudentCenterTab => {
    const t = tabStr.toLowerCase();
    if (t.includes('courtroom') || t.includes('ai-courtroom')) return 'courtroom';
    if (t.includes('moot-memorial') || t.includes('moot') || t.includes('memorial')) return 'moot';
    if (t.includes('exam') || t.includes('prep')) return 'exam';
    if (t.includes('career') || t.includes('internship') || t.includes('hub')) return 'career';
    if (t.includes('cert') || t.includes('leaderboard')) return 'certifications';
    return 'courtroom';
  };

  const [activeTab, setActiveTab] = useState<StudentCenterTab>(getSanitizedTab(initialTab));

  // Sync state if initialTab changes
  useEffect(() => {
    setActiveTab(getSanitizedTab(initialTab));
  }, [initialTab]);



  // Tab 2: Moot Memorial Lab State
  const [memorialSide, setMemorialSide] = useState<'petitioner' | 'respondent'>('petitioner');
  const [activeSection, setActiveSection] = useState<'facts' | 'jurisdiction' | 'arguments' | 'prayer'>('arguments');


  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5] text-[#1E293B] font-sans antialiased">
      {/* Top Header Bar */}
      <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#EAE3D6] flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="flex items-center gap-2 text-xs sm:text-sm font-medium text-[#64748B]">
          <Link href="/student" className="hover:text-[#1E3A8A] transition">
            Student Dashboard
          </Link>
          <span>/</span>
          <span className="text-[#1E3A8A] font-bold">Student Center</span>
        </div>

        <div className="flex items-center gap-4 sm:gap-6 flex-shrink-0">
          <Link
            href="/student"
            className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-[#DECDB8] bg-[#FAF8F5] text-[#1E3A8A] hover:bg-[#1E3A8A] hover:text-white transition"
          >
            ← Return to Dashboard
          </Link>
          <div className="flex items-center gap-2.5 pl-3 border-l border-[#EAE3D6]">
            <div className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {studentName.charAt(0)}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="font-semibold text-xs text-[#1E293B]">{studentName}</span>
              <span className="text-[11px] text-[#64748B]">Law Student</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto flex flex-col gap-6">
        {/* TAB CONTENT AREAS */}

        {/* =================================================================== */}
        {/* 1. AI LIVE COURTROOM                                               */}
        {/* =================================================================== */}
        {activeTab === 'courtroom' && (
          <div className="animate-in fade-in duration-200">
            <AILiveCourtroom dashboardHref={dashboardHref} />
          </div>
        )}

        {/* =================================================================== */}
        {/* 2. MOOT MEMORIAL LAB                                               */}
        {/* =================================================================== */}
        {activeTab === 'moot' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start animate-in fade-in duration-200">
            <div className="lg:col-span-8 bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
                <div>
                  <h3 className="font-serif font-bold text-lg text-[#1E293B]">
                    National Moot Competition Memorial Formatter
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Standard Indian Law Institute (ILI) and Bluebook 21st Edition Citation Rules
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMemorialSide('petitioner')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      memorialSide === 'petitioner'
                        ? 'bg-blue-100 text-blue-900 border border-blue-200'
                        : 'text-[#64748B] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    Petitioner / Appellant
                  </button>
                  <button
                    type="button"
                    onClick={() => setMemorialSide('respondent')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                      memorialSide === 'respondent'
                        ? 'bg-amber-100 text-amber-900 border border-amber-200'
                        : 'text-[#64748B] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    Respondent / State
                  </button>
                </div>
              </div>

              {/* Section Tabs */}
              <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1">
                {(['facts', 'jurisdiction', 'arguments', 'prayer'] as const).map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => setActiveSection(sec)}
                    className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                      activeSection === sec
                        ? 'bg-[#1E3A8A] text-white'
                        : 'bg-[#FAF8F5] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    {sec === 'facts' ? 'Statement of Facts' : sec === 'jurisdiction' ? 'Statement of Jurisdiction' : sec === 'arguments' ? 'Arguments Advanced' : 'Prayer for Relief'}
                  </button>
                ))}
              </div>

              {/* Editable Draft Canvas */}
              <div className="p-5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl font-serif text-sm leading-relaxed space-y-4 text-[#1E293B]">
                <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#8C5320]">
                  {memorialSide === 'petitioner' ? 'MEMORIAL ON BEHALF OF THE PETITIONER' : 'MEMORIAL ON BEHALF OF THE RESPONDENT'}
                </h4>
                <p>
                  <strong>ISSUE 1:</strong> WHETHER THE WRIT PETITION MAINTAINABLE UNDER ARTICLE 32 OF THE CONSTITUTION OF INDIA NOTWITHSTANDING THE EXISTENCE OF AN ALTERNATIVE STATUTORY REMEDY?
                </p>
                <p className="text-[#475569]">
                  It is respectfully submitted that where fundamental rights under Part III of the Constitution are flagrantly infringed, the doctrine of exhaustion of alternative remedy does not operate as an absolute jurisdictional bar, as established by the Constitution Bench in <em>Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1</em>.
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748B]">Auto-formatted ILI footnotes: 14 authorities cited</span>
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export PDF Memorial</span>
                </button>
              </div>
            </div>

            <div className="lg:col-span-4 bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-xs space-y-4">
              <h4 className="font-serif font-bold text-sm text-[#1E293B]">Memorial Checklist</h4>
              <ul className="space-y-2.5 text-xs text-[#64748B]">
                <li className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Font: Times New Roman 12 pt, 1.5 line spacing</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>ILI Footnotes: 10 pt single spacing</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Blue cover page for Petitioner</span>
                </li>
                <li className="flex items-center gap-2 text-emerald-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Summary of Pleadings under 2 pages</span>
                </li>
              </ul>
            </div>
          </div>
        )}



        {/* =================================================================== */}
        {/* 4. EXAM & MOOT PREP                                                */}
        {/* =================================================================== */}
        {activeTab === 'exam' && (
          <div className="animate-in fade-in duration-200">
            <ExamMootPrep />
          </div>
        )}

        {/* =================================================================== */}
        {/* 5. INTERNSHIP & CAREER HUB                                         */}
        {/* =================================================================== */}
        {activeTab === 'career' && (
          <div className="animate-in fade-in duration-200">
            <InternshipCareerHub />
          </div>
        )}

        {/* =================================================================== */}
        {/* 6. CERTIFICATIONS & LEADERBOARDS                                    */}
        {/* =================================================================== */}
        {activeTab === 'certifications' && (
          <div className="animate-in fade-in duration-200">
            <CertificatesAchievements />
          </div>
        )}

      </main>
    </div>
  );
}
