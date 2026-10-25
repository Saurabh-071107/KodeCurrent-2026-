'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Check,
  Download,
  X,
  ChevronRight
} from 'lucide-react';

export interface CertificateItem {
  id: string;
  title: string;
  issuer: string;
  date: string;
  credentialId: string;
  grade: string;
  score: string;
  category: string;
  skills: string[];
}

export interface RewardBadge {
  id: string;
  name: string;
  criteria: string;
  date?: string;
  unlocked: boolean;
}

const CERTIFICATES: CertificateItem[] = [
  {
    id: 'cert-moot',
    title: 'National Moot Court Advocacy Excellence',
    issuer: 'High Court Simulation Council',
    date: 'Oct 2026',
    credentialId: 'NX-MOOT-2026-882',
    grade: 'Grade O',
    score: '94 / 100',
    category: 'Oral Advocacy',
    skills: ['Appellate Pleadings', 'Precedent Distinguishing', 'Judicial Inquiries']
  },
  {
    id: 'cert-draft',
    title: 'Commercial Legal Drafting & Conveyancing',
    issuer: 'Drafting Verification Board',
    date: 'Sept 2026',
    credentialId: 'NX-DRAFT-2026-419',
    grade: 'Grade A+',
    score: '91 / 100',
    category: 'Procedural Drafting',
    skills: ['Articles 32 & 226 Writs', 'Order VIII CPC Written Statements', 'ILI Citations']
  },
  {
    id: 'cert-bns',
    title: 'Bharatiya Nyaya Sanhita (BNS) 2023 Mastery',
    issuer: 'Criminal Law Reform Council',
    date: 'Aug 2026',
    credentialId: 'NX-BNS-2026-102',
    grade: 'Grade O',
    score: '96 / 100',
    category: 'Criminal Codes',
    skills: ['Section 103 BNS Nuances', 'BNSS Section 482 Bail', 'BSA Digital Records']
  },
  {
    id: 'cert-jud',
    title: 'Judicial Services Preliminary Qualification',
    issuer: 'Judicial Assessment Wing',
    date: 'July 2026',
    credentialId: 'NX-JUD-2026-055',
    grade: '98.4th Percentile',
    score: '92 / 100',
    category: 'Judiciary',
    skills: ['Constitutional Law', 'Evidence & Limitation', 'Civil Injunctions']
  }
];

const REWARDS: RewardBadge[] = [
  {
    id: 'rew-1',
    name: 'Top 5% National Advocate',
    criteria: 'Merit score > 90 in 10+ bench sessions',
    date: 'Oct 2026',
    unlocked: true
  },
  {
    id: 'rew-2',
    name: 'Bench Rebuttal Virtuoso',
    criteria: '50+ citations confirmed by AI judges',
    date: 'Oct 2026',
    unlocked: true
  },
  {
    id: 'rew-3',
    name: 'Zero-Defect Memorialist',
    criteria: '100% ILI citation formatting compliance',
    date: 'Sept 2026',
    unlocked: true
  },
  {
    id: 'rew-4',
    name: 'New Criminal Codes Scholar',
    criteria: 'Score > 95% on BNS/BNSS statutory test',
    date: 'Aug 2026',
    unlocked: true
  },
  {
    id: 'rew-5',
    name: 'BCI Professional Ethics',
    criteria: '100% score on advocate standards test',
    date: 'July 2026',
    unlocked: true
  },
  {
    id: 'rew-6',
    name: 'Moot League Finalist',
    criteria: 'Reach Top 10 in national standings',
    unlocked: false
  }
];

const LEADERBOARD = [
  { rank: 1, name: 'Ananya Deshmukh', college: 'NLSIU Bengaluru', score: '98.5', wins: 28 },
  { rank: 2, name: 'Rohan Varma', college: 'NALSAR Hyderabad', score: '97.2', wins: 24 },
  { rank: 3, name: 'Siddharth Roy', college: 'WBNUJS Kolkata', score: '96.0', wins: 22 },
  { rank: 4, name: 'Meera Nambiar', college: 'NLU Delhi', score: '95.8', wins: 21 },
  { rank: 5, name: 'Aditya Kashyap', college: 'GNLU Gandhinagar', score: '95.4', wins: 20 },
  { rank: 12, name: 'Saurabh (You)', college: 'Faculty of Law, DU', score: '94.0', wins: 18, highlight: true }
];

export default function CertificatesAchievements() {
  const [certificatesList, setCertificatesList] = useState<CertificateItem[]>(CERTIFICATES);
  const [rewardsList, setRewardsList] = useState<RewardBadge[]>(REWARDS);
  const [activeTab, setActiveTab] = useState<'certificates' | 'leaderboard'>('certificates');
  const [selectedCert, setSelectedCert] = useState<CertificateItem | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.getStudentAssets();
        if (res.success && res.data) {
          if (res.data.certificates && res.data.certificates.length > 0) {
            setCertificatesList(res.data.certificates);
          }
          if (res.data.rewards && res.data.rewards.length > 0) {
            setRewardsList(res.data.rewards);
          }
        }
      } catch (err) {
        console.error('Error fetching certificates & rewards:', err);
      }
    };
    fetchAssets();
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-[#1E293B] font-sans antialiased">
      {/* Minimal Header & Mode Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#EAE3D6]">
        <div>
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1E293B]">
            Certificates & Rewards
          </h2>
          <div className="flex items-center gap-3 text-xs text-[#64748B] mt-1">
            <span><strong>{certificatesList.length}</strong> Verified Certificates</span>
            <span>•</span>
            <span>Advocacy Score: <strong className="text-[#1E3A8A]">94 / 100</strong></span>
            <span>•</span>
            <span>National Rank: <strong className="text-[#8C5320]">#12</strong></span>
          </div>
        </div>

        {/* Minimal Tab Switcher */}
        <div className="flex items-center p-1 bg-white border border-[#DECDB8] rounded-xl self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setActiveTab('certificates')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'certificates'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E3A8A]'
            }`}
          >
            Certificates & Badges
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('leaderboard')}
            className={`px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'leaderboard'
                ? 'bg-[#1E3A8A] text-white shadow-xs'
                : 'text-[#64748B] hover:text-[#1E3A8A]'
            }`}
          >
            National Leaderboard
          </button>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 1. CERTIFICATES & REWARDS GRID                                      */}
      {/* =================================================================== */}
      {activeTab === 'certificates' && (
        <div className="space-y-8 animate-in fade-in duration-150">
          {/* Certificate Cards */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C5320]">
              Verified Credentials
            </span>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {certificatesList.map((cert) => (
                <div
                  key={cert.id}
                  onClick={() => setSelectedCert(cert)}
                  className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-xl p-5 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#8C5320]">{cert.category}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-bold text-[11px]">
                        {cert.grade} ({cert.score})
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-base text-[#1E293B] hover:text-[#1E3A8A] transition">
                      {cert.title}
                    </h3>

                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>{cert.issuer}</span>
                      <span>{cert.date}</span>
                    </div>

                    {/* Minimal Skills row */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {cert.skills.map((s, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DECDB8] text-[10px] text-[#475569]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-[#EAE3D6] text-xs">
                    <span className="font-mono text-[11px] text-[#64748B]">
                      {cert.credentialId}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => handleCopyId(cert.credentialId, e)}
                        className="px-2.5 py-1 rounded-lg border border-[#DECDB8] bg-[#FAF8F5] hover:bg-[#FAF5EB] text-[11px] font-semibold text-[#1E3A8A] transition cursor-pointer"
                      >
                        {copiedId === cert.credentialId ? 'Copied' : 'Copy ID'}
                      </button>
                      <span className="font-bold text-[#1E3A8A] text-xs flex items-center">
                        View Certificate <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Minimal Reward Badges */}
          <div className="space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-[#8C5320]">
              Milestone Rewards & Badges
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {rewardsList.map((rew) => (
                <div
                  key={rew.id}
                  className={`p-3.5 rounded-xl border transition flex flex-col justify-between gap-2 ${
                    rew.unlocked
                      ? 'bg-white border-[#DECDB8] shadow-2xs'
                      : 'bg-[#FAF8F5]/50 border-[#DECDB8]/50 opacity-50'
                  }`}
                >
                  <div className="flex items-center justify-between text-[10px]">
                    <span className="font-bold uppercase tracking-wider text-[#8C5320]">
                      {rew.unlocked ? rew.date : 'Locked'}
                    </span>
                    {rew.unlocked && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </div>

                  <div>
                    <h4 className="font-serif font-bold text-xs text-[#1E293B] leading-snug">
                      {rew.name}
                    </h4>
                    <p className="text-[10px] text-[#64748B] mt-1 leading-normal line-clamp-2">
                      {rew.criteria}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 2. MINIMAL NATIONAL LEADERBOARD                                     */}
      {/* =================================================================== */}
      {activeTab === 'leaderboard' && (
        <div className="bg-white border border-[#EAE3D6] rounded-xl p-5 shadow-xs space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between text-xs pb-2 border-b border-[#EAE3D6]">
            <span className="font-serif font-bold text-sm text-[#1E293B]">
              National Law Students League
            </span>
            <span className="text-[#64748B]">Updated Live · 240+ Law Faculties</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EAE3D6] text-[#8C5320] font-bold uppercase tracking-wider text-[11px]">
                  <th className="py-2.5 px-3">Rank</th>
                  <th className="py-2.5 px-3">Advocate</th>
                  <th className="py-2.5 px-3">Law School</th>
                  <th className="py-2.5 px-3 text-right">Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE3D6]">
                {LEADERBOARD.map((row) => (
                  <tr
                    key={row.rank}
                    className={
                      row.highlight
                        ? 'bg-[#FAF5EB] font-bold text-[#1E3A8A]'
                        : 'hover:bg-[#FAF8F5] text-[#334155]'
                    }
                  >
                    <td className="py-2.5 px-3">
                      #{row.rank} {row.highlight && <span className="text-[10px] bg-[#1E3A8A] text-white px-1.5 py-0.2 rounded ml-1">You</span>}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{row.name}</td>
                    <td className="py-2.5 px-3 text-[#64748B]">{row.college}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#8C5320]">{row.score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. MINIMAL LEGAL CERTIFICATE PARCHMENT MODAL                        */}
      {/* =================================================================== */}
      {selectedCert && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-[#FAF8F5] border-2 border-[#C59B58] rounded-2xl max-w-2xl w-full shadow-xl overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-4 bg-white border-b border-[#DECDB8] flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#8C5320]">
                Verified Legal Credential · {selectedCert.credentialId}
              </span>
              <button
                type="button"
                onClick={() => setSelectedCert(null)}
                className="w-7 h-7 rounded-lg border border-[#DECDB8] bg-white flex items-center justify-center text-[#64748B] hover:text-[#1E293B] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Parchment Certificate View */}
            <div className="p-6 sm:p-8 space-y-6 text-center">
              <div className="border border-[#DECDB8] p-6 rounded-xl bg-white shadow-2xs space-y-4">
                <span className="text-[10px] font-bold uppercase tracking-widest text-[#8C5320] block">
                  {selectedCert.issuer}
                </span>

                <h3 className="font-serif font-bold text-xl sm:text-2xl text-[#1E293B]">
                  {selectedCert.title}
                </h3>

                <div className="space-y-0.5">
                  <p className="text-xs text-[#64748B] italic">Conferred upon</p>
                  <h4 className="font-serif font-bold text-xl text-[#1E3A8A]">Saurabh</h4>
                  <p className="text-[11px] text-[#8C5320]">Faculty of Law, University of Delhi</p>
                </div>

                <div className="flex items-center justify-center gap-4 py-2 border-y border-[#EAE3D6] text-xs">
                  <span>Evaluation: <strong>{selectedCert.grade}</strong></span>
                  <span>•</span>
                  <span>Score: <strong>{selectedCert.score}</strong></span>
                  <span>•</span>
                  <span>Date: <strong>{selectedCert.date}</strong></span>
                </div>

                {/* Skills */}
                <div className="flex flex-wrap justify-center gap-1.5 pt-1">
                  {selectedCert.skills.map((s, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DECDB8] text-[10px] text-[#475569]">
                      {s}
                    </span>
                  ))}
                </div>

                <div className="pt-2 text-[10px] font-mono text-[#64748B] flex items-center justify-between">
                  <span>ID: {selectedCert.credentialId}</span>
                  <span className="text-emerald-700 font-bold">Status: Verified & Tamper-Proof</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => alert(`Downloading PDF for ${selectedCert.credentialId}...`)}
                  className="px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  <Download className="w-4 h-4 text-[#C59B58]" />
                  <span>Download PDF Certificate</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedCert(null)}
                  className="px-4 py-2 rounded-xl border border-[#DECDB8] bg-white text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
