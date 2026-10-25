'use client';

import React, { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import {
  Sparkles,
  MapPin,
  CheckCircle2,
  Clock,
  Search,
  Filter,
  Send,
  X,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';

export interface InternshipListing {
  id: string;
  organization: string;
  type: 'firm' | 'chamber' | 'clerkship' | 'policy';
  typeLabel: string;
  practiceArea: string;
  location: string;
  stipend: string;
  duration: string;
  deadline: string;
  batchEligibility: string;
  summary: string;
  responsibilities: string[];
  qualifications: string[];
  openingsCount: number;
}

const INTERNSHIP_LISTINGS: InternshipListing[] = [
  {
    id: 'khaitan-corp',
    organization: 'Khaitan & Co',
    type: 'firm',
    typeLabel: 'Tier-1 Law Firm',
    practiceArea: 'Corporate & M&A / Private Equity',
    location: 'Mumbai & New Delhi',
    stipend: 'INR 15,000 / month',
    duration: '4 Weeks (Winter / Spring 2026)',
    deadline: '15 Nov 2026',
    batchEligibility: '4th & 5th Year (5-yr) / 3rd Year (3-yr) LL.B',
    summary: 'Join the premier corporate transactions practice assisting partners on cross-border acquisitions, regulatory filings with SEBI & CCI, and legal due diligence.',
    responsibilities: [
      'Conduct statutory legal due diligence across company registries and MCA filings',
      'Assist in drafting Share Purchase Agreements (SPA) and Shareholders Agreements (SHA)',
      'Prepare regulatory compliance research notes on FDI policy and FEMA regulations',
      'Summarize board resolutions and cross-border merger notifications'
    ],
    qualifications: [
      'Demonstrated academic excellence in Company Law and Corporate Finance',
      'Prior experience in corporate law research or law review editorial board',
      'Proficiency in corporate database research (MCA21, SEBI, Manupatra)'
    ],
    openingsCount: 4
  },
  {
    id: 'datar-chambers',
    organization: 'Chambers of Senior Adv. Arvind Datar',
    type: 'chamber',
    typeLabel: 'Senior Advocate Chamber',
    practiceArea: 'Constitutional, Corporate & Tax Litigation',
    location: 'Supreme Court of India (New Delhi)',
    stipend: 'Stipendiary (Merit-based)',
    duration: '6 Weeks (Appellate Term)',
    deadline: '20 Nov 2026',
    batchEligibility: '3rd to 5th Year LL.B',
    summary: 'Chamber internship focused on high-stakes appellate litigation before the Supreme Court of India and High Courts, dealing with complex constitutional and fiscal statutes.',
    responsibilities: [
      'Prepare comprehensive case briefs and statutory comparative charts for Senior Counsel',
      'Research judicial precedents and ratio decidendi under Article 141 of the Constitution',
      'Draft Special Leave Petitions (SLPs) and Writ Petitions under Articles 32 and 226',
      'Attend daily court hearings and maintain court observation notes'
    ],
    qualifications: [
      'Deep grasp of Constitutional Interpretation, Tax Law, and Appellate Procedure',
      'Strong moot court advocacy record or drafting credentials',
      'Ability to synthesize voluminous appeal records under strict court deadlines'
    ],
    openingsCount: 2
  },
  {
    id: 'sam-dispute',
    organization: 'Shardul Amarchand Mangaldas & Co',
    type: 'firm',
    typeLabel: 'Tier-1 Law Firm',
    practiceArea: 'Dispute Resolution & Commercial Arbitration',
    location: 'New Delhi (Barakhamba Road)',
    stipend: 'INR 18,000 / month',
    duration: '4 Weeks',
    deadline: '25 Nov 2026',
    batchEligibility: '4th & 5th Year LL.B',
    summary: 'Work with the dispute resolution team handling international and domestic commercial arbitrations under SIAC, ICC, and Indian Arbitration Act 1996.',
    responsibilities: [
      'Draft statements of claim, defense pleadings, and section 9 / 11 interim applications',
      'Research landmark rulings on arbitrator bias, patent illegality, and public policy',
      'Assemble arbitration document bundles and evidentiary exhibits'
    ],
    qualifications: [
      'Top tier academic standing in Law of Arbitration and Civil Procedure',
      'Prior moot memorial drafting experience in commercial disputes',
      'Excellent legal writing and citation accuracy (ILI / Bluebook standard)'
    ],
    openingsCount: 3
  },
  {
    id: 'sci-clerkship',
    organization: 'Supreme Court of India',
    type: 'clerkship',
    typeLabel: 'Judicial Clerkship',
    practiceArea: 'Constitutional Benches & Appellate Jurisdiction',
    location: 'Tilak Marg, New Delhi',
    stipend: 'INR 80,000 / month',
    duration: '1 Year Full-Time (Annual Assignment)',
    deadline: '30 Nov 2026',
    batchEligibility: 'Final Year Students / Fresh Law Graduates',
    summary: 'Prestigious Law Clerk-cum-Research Assistantship directly assisting Hon\'ble Supreme Court Judges in bench research, analyzing SLPs, and drafting judicial bench memorandums.',
    responsibilities: [
      'Prepare bench memorandums detailing factual matrix and disputed legal propositions',
      'Cross-reference comparative foreign jurisprudence (UK, US, Canada, South Africa)',
      'Proofread and cite-check draft judicial pronouncements',
      'Conduct emergency research during ongoing Constitution Bench hearings'
    ],
    qualifications: [
      'Graduating law student or advocate enrolled with Bar Council',
      'High aggregate GPA from recognized National Law University or Faculty of Law',
      'Exemplary analytical acumen and highest standards of judicial confidentiality'
    ],
    openingsCount: 8
  },
  {
    id: 'trilegal-banking',
    organization: 'Trilegal',
    type: 'firm',
    typeLabel: 'Tier-1 Law Firm',
    practiceArea: 'Banking, Finance & Restructuring (IBC)',
    location: 'Bengaluru / Mumbai',
    stipend: 'INR 15,000 / month',
    duration: '4 Weeks',
    deadline: '05 Dec 2026',
    batchEligibility: '3rd to 5th Year LL.B',
    summary: 'Engage in structured debt financings, syndicated facilities, project finance in green energy, and corporate insolvency resolution processes before NCLT.',
    responsibilities: [
      'Review loan facility agreements, debenture trust deeds, and hypothecation deeds',
      'Analyze CIRP claims and resolution applicant plans under Insolvency and Bankruptcy Code',
      'Prepare summary notes on recent RBI regulatory circulars and Master Directions'
    ],
    qualifications: [
      'Strong understanding of Banking Law, Insolvency & Bankruptcy Code, and Security Creation',
      'Meticulous eye for detail in contractual cross-references'
    ],
    openingsCount: 3
  },
  {
    id: 'vidhi-policy',
    organization: 'Vidhi Centre for Legal Policy',
    type: 'policy',
    typeLabel: 'Legal Policy Think Tank',
    practiceArea: 'Legislative Drafting & Judicial System Reforms',
    location: 'New Delhi (Hybrid Available)',
    stipend: 'INR 25,000 / month',
    duration: '8 Weeks',
    deadline: '10 Dec 2026',
    batchEligibility: '3rd to 5th Year LL.B / LL.M',
    summary: 'Work alongside leading legal researchers and policy counsels assisting Central and State Governments on draft legislation, criminal law reforms, and justice delivery indices.',
    responsibilities: [
      'Conduct empirical legal research on court pendency and procedural delays',
      'Draft policy white papers analyzing newly enacted criminal codes (BNS, BNSS, BSA)',
      'Prepare comparative legislative tables on data privacy and AI regulations'
    ],
    qualifications: [
      'Passion for public policy, law reform, and empirical research methodologies',
      'Demonstrated writing samples in peer-reviewed legal journals or reputable law blogs'
    ],
    openingsCount: 2
  }
];

export default function InternshipCareerHub() {
  const [internshipsList, setInternshipsList] = useState<InternshipListing[]>(INTERNSHIP_LISTINGS);
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Fetch dynamic listings from backend
  useEffect(() => {
    const fetchAssets = async () => {
      try {
        const res = await api.getStudentAssets();
        if (res.success && res.data?.internships && res.data.internships.length > 0) {
          setInternshipsList(res.data.internships);
        }
      } catch (err) {
        console.error('Error fetching internships:', err);
      }
    };
    fetchAssets();
  }, []);

  // Selected Internship for Modal
  const [selectedInternship, setSelectedInternship] = useState<InternshipListing | null>(null);
  const [appliedListings, setAppliedListings] = useState<Set<string>>(new Set(['sam-dispute']));
  const [isApplying, setIsApplying] = useState<boolean>(false);
  const [applicationSuccess, setApplicationSuccess] = useState<boolean>(false);

  // Filter listings
  const filteredListings = internshipsList.filter((item) => {
    const matchesType = selectedTypeFilter === 'all' || item.type === selectedTypeFilter;
    const matchesSearch =
      item.organization.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.practiceArea.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.location.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesType && matchesSearch;
  });

  const handleApplyNow = (item: InternshipListing) => {
    setSelectedInternship(item);
    setApplicationSuccess(false);
  };

  const handleConfirmApplication = () => {
    if (!selectedInternship) return;
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setApplicationSuccess(true);
      setAppliedListings((prev) => new Set(prev).add(selectedInternship.id));
      setTimeout(() => {
        setSelectedInternship(null);
        setApplicationSuccess(false);
      }, 1600);
    }, 1000);
  };

  return (
    <div className="w-full flex flex-col gap-6 text-[#1E293B] font-sans antialiased">
      {/* Top Banner */}
      <div className="bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div className="max-w-2xl">
          <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B] tracking-tight">
            Verified Legal Internships & Chambers Placement
          </h2>
          <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
            Directly apply to verified openings at Tier-1 law firms, Senior Advocate chambers, and Supreme Court clerkships with your verified Nexora profile.
          </p>
        </div>
      </div>

      {/* VERIFIED OPENINGS & CHAMBERS LISTINGS */}
      <div className="space-y-6">
          {/* Search Bar & Category Filters */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Filter Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
              {[
                { id: 'all', label: 'All Opportunities' },
                { id: 'firm', label: 'Tier-1 Law Firms' },
                { id: 'chamber', label: 'Senior Advocate Chambers' },
                { id: 'clerkship', label: 'Judicial Clerkships' },
                { id: 'policy', label: 'Legal Policy & Research' }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setSelectedTypeFilter(f.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                    selectedTypeFilter === f.id
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#FAF8F5]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search firm, chamber, or city..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#DECDB8] rounded-xl text-xs font-medium text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>
          </div>

          {/* Listings Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredListings.map((item) => {
              const isApplied = appliedListings.has(item.id);
              return (
                <div
                  key={item.id}
                  className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between gap-4 relative group"
                >
                  <div>
                    {/* Header Badges */}
                    <div className="flex items-center justify-between gap-2 mb-2.5">
                      <span className="px-2.5 py-1 rounded-md bg-[#FAF5EB] border border-[#DECDB8] text-[10px] font-bold text-[#8C5320] uppercase tracking-wider">
                        {item.typeLabel}
                      </span>
                      <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                        {item.stipend}
                      </span>
                    </div>

                    <h3 className="font-serif font-bold text-lg text-[#1E293B] group-hover:text-[#1E3A8A] transition">
                      {item.organization}
                    </h3>
                    <p className="text-xs font-semibold text-[#8C5320] mt-0.5">
                      {item.practiceArea}
                    </p>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[#64748B] mt-2.5">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-[#C59B58]" />
                        <span>{item.location}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-[#C59B58]" />
                        <span>{item.duration}</span>
                      </span>
                    </div>

                    <p className="text-xs text-[#64748B] mt-3 line-clamp-2 leading-relaxed">
                      {item.summary}
                    </p>

                    <div className="mt-3 p-2.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-[11px] text-[#475569] space-y-1">
                      <span className="font-bold text-[#1E293B] block">Batch Eligibility:</span>
                      <p>{item.batchEligibility}</p>
                    </div>
                  </div>

                  {/* Card Bottom / CTA */}
                  <div className="space-y-3 pt-3 border-t border-[#EAE3D6]">
                    <div className="flex items-center justify-between text-xs text-[#64748B]">
                      <span>{item.openingsCount} Verified Openings</span>
                      <span className="text-[#8C5320] font-semibold">Apply by {item.deadline}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleApplyNow(item)}
                        className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer ${
                          isApplied
                            ? 'bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white'
                        }`}
                      >
                        {isApplied ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Application Submitted</span>
                          </>
                        ) : (
                          <>
                            <Send className="w-4 h-4 text-[#C59B58]" />
                            <span>View Details & Apply</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredListings.length === 0 && (
            <div className="p-8 text-center bg-white border border-[#DECDB8] rounded-2xl text-xs text-[#64748B] space-y-2">
              <Search className="w-8 h-8 text-[#C59B58] mx-auto opacity-70" />
              <p className="font-bold text-sm text-[#1E293B]">No openings found matching your criteria</p>
              <p>Try clearing your search query or selecting &quot;All Opportunities&quot;.</p>
            </div>
          )}
        </div>

      {/* =================================================================== */}
      {/* 3. INTERNSHIP DETAIL & DIRECT APPLICATION MODAL                     */}
      {/* =================================================================== */}
      {selectedInternship && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-2xl w-full shadow-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 bg-[#FAF8F5] border-b border-[#EAE3D6] flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-[#FAF5EB] border border-[#DECDB8] text-[10px] font-bold text-[#8C5320] uppercase tracking-wider">
                    {selectedInternship.typeLabel}
                  </span>
                  <span className="text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {selectedInternship.stipend}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-1">
                  {selectedInternship.organization}
                </h3>
                <p className="text-xs text-[#8C5320] font-semibold">{selectedInternship.practiceArea}</p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedInternship(null)}
                className="w-8 h-8 rounded-xl border border-[#DECDB8] bg-white flex items-center justify-center text-[#64748B] hover:text-[#1E293B] transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-[#1E293B] leading-relaxed">
              {/* Meta Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 p-3.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs">
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Location</span>
                  <span className="font-semibold text-[#1E293B]">{selectedInternship.location}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Duration</span>
                  <span className="font-semibold text-[#1E293B]">{selectedInternship.duration}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Deadline</span>
                  <span className="font-semibold text-[#8C5320]">{selectedInternship.deadline}</span>
                </div>
              </div>

              {/* Responsibilities */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#1E293B]">Key Practice Responsibilities</h4>
                <ul className="space-y-1.5 text-[#475569]">
                  {selectedInternship.responsibilities.map((r, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <ChevronRight className="w-3.5 h-3.5 text-[#C59B58] flex-shrink-0 mt-0.5" />
                      <span>{r}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Qualifications */}
              <div className="space-y-2">
                <h4 className="font-serif font-bold text-sm text-[#1E293B]">Candidate Eligibility & Pre-requisites</h4>
                <ul className="space-y-1.5 text-[#475569]">
                  {selectedInternship.qualifications.map((q, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Verified Profile Attachment Note */}
              <div className="p-3.5 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-[#C59B58] flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-[#1E293B] block">Nexora Verified Profile Auto-Attached</span>
                  <p className="text-[11px] text-[#64748B] mt-0.5">
                    Your verified Advocacy Score (94/100), Moot League Rank (#12), and Drafting Studio verification badge will be submitted alongside your application.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#EAE3D6] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setSelectedInternship(null)}
                className="px-4 py-2 rounded-xl border border-[#DECDB8] bg-white text-xs font-bold text-[#64748B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                disabled={isApplying || applicationSuccess || appliedListings.has(selectedInternship.id)}
                onClick={handleConfirmApplication}
                className="px-6 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition flex items-center gap-2 shadow-xs disabled:opacity-60 cursor-pointer"
              >
                {isApplying ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin text-[#C59B58]" />
                    <span>Submitting Application...</span>
                  </>
                ) : applicationSuccess || appliedListings.has(selectedInternship.id) ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>Application Submitted Successfully</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-[#C59B58]" />
                    <span>Submit Verified Application</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
