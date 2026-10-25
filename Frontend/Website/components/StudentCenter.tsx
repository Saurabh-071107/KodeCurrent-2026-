'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import ExamMootPrep from './ExamMootPrep';
import InternshipCareerHub from './InternshipCareerHub';
import CertificatesAchievements from './CertificatesAchievements';
import AILiveCourtroom from './AILiveCourtroom';
import {
  CheckCircle2,
  Download,
  Sparkles,
  RefreshCw,
  FileText,
  Scale,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';

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
  const [mootTopic, setMootTopic] = useState('Maintainability of Article 32 Petition & Environmental Rights Violation');
  const [isGeneratingMoot, setIsGeneratingMoot] = useState(false);
  const [mootData, setMootData] = useState<any>(null);
  const [mootToast, setMootToast] = useState<string | null>(null);

  const handleGenerateMemorial = async () => {
    if (!mootTopic.trim() || isGeneratingMoot) return;
    setIsGeneratingMoot(true);
    setMootToast('BAR AI: Retrieving statutory provisions & precedents, NEXORA AI synthesizing grounds...');

    try {
      const res = await api.generateMootMemorial({
        topic: mootTopic.trim(),
        side: memorialSide,
        jurisdiction: 'Supreme Court of India'
      });

      if (res.success && res.data) {
        setMootData(res.data);
        setMootToast('NEXORA AI + BAR AI: Memorial grounds & statutory authorities formulated.');
      } else {
        setMootToast(`Notice: ${res.error?.message || 'Generated using offline legal standards.'}`);
      }
    } catch (err: any) {
      setMootToast(`Error: ${err.message || 'Failed to generate memorial.'}`);
    } finally {
      setIsGeneratingMoot(false);
      setTimeout(() => setMootToast(null), 4000);
    }
  };


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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto pb-1">
                  {(['facts', 'jurisdiction', 'arguments', 'prayer'] as const).map((sec) => (
                    <button
                      key={sec}
                      type="button"
                      onClick={() => setActiveSection(sec)}
                      className={`px-3 py-1.5 rounded-lg capitalize transition cursor-pointer ${
                        activeSection === sec
                          ? 'bg-[#1E3A8A] text-white shadow-xs'
                          : 'bg-[#FAF8F5] text-[#64748B] hover:text-[#1E293B]'
                      }`}
                    >
                      {sec === 'facts' ? 'Statement of Facts' : sec === 'jurisdiction' ? 'Statement of Jurisdiction' : sec === 'arguments' ? 'Arguments Advanced' : 'Prayer for Relief'}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={handleGenerateMemorial}
                  disabled={isGeneratingMoot}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FAF5EB] border border-[#DECDB8] hover:bg-[#EAE3D6] text-xs font-bold text-[#8C5320] transition cursor-pointer self-start sm:self-auto"
                >
                  {isGeneratingMoot ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Sparkles className="w-3.5 h-3.5 text-[#C59B58]" />
                  )}
                  <span>{isGeneratingMoot ? 'Synthesizing...' : 'Re-synthesize with NEXORA AI + BAR AI'}</span>
                </button>
              </div>

              {mootToast && (
                <div className="p-2.5 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 font-medium">
                  {mootToast}
                </div>
              )}

              {/* Editable Draft Canvas */}
              <div className="p-5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl font-serif text-sm leading-relaxed space-y-4 text-[#1E293B]">
                <div className="flex items-center justify-between border-b border-[#EAE3D6] pb-2">
                  <h4 className="font-sans font-bold text-xs uppercase tracking-wider text-[#8C5320]">
                    {mootData?.memorial?.title || (memorialSide === 'petitioner' ? 'MEMORIAL ON BEHALF OF THE PETITIONER' : 'MEMORIAL ON BEHALF OF THE RESPONDENT')}
                  </h4>
                  <span className="font-sans text-[11px] font-semibold text-[#64748B]">
                    Forum: {mootData?.memorial?.forum || 'Supreme Court of India'}
                  </span>
                </div>

                {activeSection === 'facts' && (
                  <div className="space-y-2 font-sans text-xs">
                    <p className="font-bold text-[#1E293B] font-serif text-sm">STATEMENT OF FACTS</p>
                    <p className="text-[#334155] leading-relaxed">
                      {mootData?.memorial?.statementOfFacts ||
                        '1. That the Petitioner is a registered public interest collective advocating for ecological balance and public health.\n2. That recent administrative actions have resulted in the encroachment and diversion of notified municipal green belts without environmental impact assessment.\n3. Aggrieved by the persistent inaction of municipal authorities despite repeated formal representations, the Petitioner approaches this Hon’ble Court.'}
                    </p>
                  </div>
                )}

                {activeSection === 'jurisdiction' && (
                  <div className="space-y-2 font-sans text-xs">
                    <p className="font-bold text-[#1E293B] font-serif text-sm">STATEMENT OF JURISDICTION</p>
                    <p className="text-[#334155] leading-relaxed">
                      {mootData?.memorial?.statementOfJurisdiction ||
                        'The Petitioner approaches this Hon’ble Court under Article 32 of the Constitution of India. This Court has extraordinary original jurisdiction to issue directions, orders, or writs, including writs in the nature of Mandamus, for the enforcement of fundamental rights guaranteed under Part III of the Constitution.'}
                    </p>
                  </div>
                )}

                {activeSection === 'arguments' && (
                  <div className="space-y-3">
                    {mootData?.memorial?.argumentsAdvanced ? (
                      mootData.memorial.argumentsAdvanced.map((arg: any, idx: number) => (
                        <div key={idx} className="space-y-1.5 pb-3 border-b border-[#EAE3D6]/60 last:border-0">
                          <p className="font-bold text-[#1E3A8A] font-serif text-xs">
                            {arg.issueTitle}
                          </p>
                          <p className="text-[#475569] font-sans text-xs leading-relaxed">
                            {arg.substantivePleadings}
                          </p>
                          {arg.statutoryAnchors && (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {arg.statutoryAnchors.map((st: string, sIdx: number) => (
                                <span key={sIdx} className="px-1.5 py-0.5 rounded bg-blue-50 border border-blue-200 text-[10px] font-mono text-blue-800">
                                  {st}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))
                    ) : (
                      <>
                        <p>
                          <strong>ISSUE 1:</strong> WHETHER THE WRIT PETITION IS MAINTAINABLE UNDER ARTICLE 32 OF THE CONSTITUTION OF INDIA NOTWITHSTANDING ALTERNATIVE STATUTORY REMEDIES?
                        </p>
                        <p className="text-[#475569] text-xs font-sans leading-relaxed">
                          It is respectfully submitted that where fundamental rights under Part III of the Constitution are flagrantly infringed, the doctrine of exhaustion of alternative remedy does not operate as an absolute jurisdictional bar, as established by the Constitution Bench in <em>Whirlpool Corporation v. Registrar of Trade Marks, (1998) 8 SCC 1</em>.
                        </p>
                        <p>
                          <strong>ISSUE 2:</strong> WHETHER DIVERSION OF DESIGNATED GREEN LUNG AREAS VIOLATES ARTICLE 21?
                        </p>
                        <p className="text-[#475569] text-xs font-sans leading-relaxed">
                          Under the Public Trust Doctrine codified in <em>M.C. Mehta v. Kamal Nath (1997) 1 SCC 388</em> and <em>Bangalore Medical Trust v. B.S. Muddappa (1991) 4 SCC 54</em>, public spaces and designated green zones are held by public bodies in solemn trust for the public and cannot be converted or alienated.
                        </p>
                      </>
                    )}
                  </div>
                )}

                {activeSection === 'prayer' && (
                  <div className="space-y-2 font-sans text-xs">
                    <p className="font-bold text-[#1E293B] font-serif text-sm">PRAYER FOR RELIEF</p>
                    <p className="text-[#334155] leading-relaxed italic">
                      {mootData?.memorial?.prayer ||
                        'Wherefore, in the light of the facts stated, issues raised, and authorities cited, the Petitioner respectfully prays that this Hon’ble Court may graciously be pleased to: (A) Issue a Writ of Mandamus or other appropriate direction commanding the Respondents to immediately remove all unlawful encroachments; (B) Direct the restoration and sanitization of the designated green belt; and (C) Pass any further order(s) as this Hon’ble Court may deem fit in the interest of justice, equity, and good conscience.'}
                    </p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-[#64748B]">
                  {mootData?.citations?.length ? `${mootData.citations.length} Verified Authorities Cited (BAR AI)` : 'Auto-formatted ILI footnotes: 14 authorities cited'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const text = `${mootData?.memorial?.title || 'MEMORIAL'}\n\n${mootData?.memorial?.statementOfJurisdiction || ''}\n\n${mootData?.memorial?.statementOfFacts || ''}\n\nPRAYER:\n${mootData?.memorial?.prayer || ''}`;
                    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `Moot_Memorial_${memorialSide.toUpperCase()}.txt`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Export Memorial Document</span>
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
