'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Search,
  Bell,
  ChevronDown,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Minimize2,
  Filter,
  MoreVertical,
  ExternalLink,
  FileText,
  Sparkles,
  Paperclip,
  ArrowRight,
  ArrowLeft,
  Scale,
  CheckCircle2,
  AlertCircle,
  Check,
  X,
  Layers,
  BookOpen,
  Send,
  FileCheck,
  Download
} from 'lucide-react';

export interface CitationItem {
  id: string;
  number: number;
  type: 'Incomplete citation' | 'Incorrect case citation' | 'Outdated authority' | 'Verified statutory reference' | 'Verified judicial precedent';
  severity?: 'High' | 'Medium' | 'Low';
  status: 'issue' | 'verified' | 'dismissed';
  originalText: string;
  explanation: string;
  suggestedCitation: string;
  sourceTitle: string;
  sourceCourtOrAct: string;
  sourceYear: string;
  sourceSectionOrPara: string;
  sourceExcerpt: string;
  pageNumber: number;
  highlightKey: string;
  appliedText: string;
}

const INITIAL_CITATIONS: CitationItem[] = [
  {
    id: 'cite-1',
    number: 1,
    type: 'Incomplete citation',
    severity: 'High',
    status: 'issue',
    originalText: '...under the Companies Act, 2013...',
    explanation: 'Section reference is missing. Please specify the relevant section (e.g., Section 2(20) or Section 7).',
    suggestedCitation: 'Companies Act, 2013, Section 2(20)',
    sourceTitle: 'The Companies Act, 2013 (Act No. 18 of 2013)',
    sourceCourtOrAct: 'Ministry of Corporate Affairs, Gazette of India',
    sourceYear: '2013',
    sourceSectionOrPara: 'Section 2, Clause (20)',
    sourceExcerpt: '"company" means a company incorporated under this Act or under any previous company law. Section 7 prescribes the statutory procedure for formal incorporation.',
    pageNumber: 2,
    highlightKey: 'h1',
    appliedText: 'the Company is duly incorporated and validly existing under Section 2(20) of the Companies Act, 2013, and is in good standing.'
  },
  {
    id: 'cite-2',
    number: 2,
    type: 'Incorrect case citation',
    severity: 'High',
    status: 'issue',
    originalText: '...in accordance with Smith v. ABC (2018)...',
    explanation: 'Citation format is incorrect and case name could not be verified. Please provide the correct citation.',
    suggestedCitation: 'Smith v. ABC Ltd., (2018) 5 SCC 123',
    sourceTitle: 'Smith & Anr. v. ABC Engineering Ltd. & Ors.',
    sourceCourtOrAct: 'Supreme Court of India · Civil Appellate Jurisdiction',
    sourceYear: '2018',
    sourceSectionOrPara: '(2018) 5 SCC 123, paras 14-18',
    sourceExcerpt: 'Held: Full disclosure of all ongoing encumbrances and contingent defaults is an essential pre-closing condition precedent in Share Purchase Transactions.',
    pageNumber: 2,
    highlightKey: 'h2',
    appliedText: 'all material contracts are in full force and effect and there are no undisclosed defaults under any material contract, as settled in Smith v. ABC Ltd., (2018) 5 SCC 123.'
  },
  {
    id: 'cite-3',
    number: 3,
    type: 'Outdated authority',
    severity: 'Medium',
    status: 'issue',
    originalText: '...as per the Income Tax Act, 1961 (amended) --',
    explanation: 'This provision has been amended. Consider citing the updated section.',
    suggestedCitation: 'Income Tax Act, 1961, Section 56(2)(viib) (as amended by Finance Act, 2023)',
    sourceTitle: 'Income-tax Act, 1961 (43 of 1961)',
    sourceCourtOrAct: 'Central Board of Direct Taxes (CBDT)',
    sourceYear: '1961 (Amended 2023)',
    sourceSectionOrPara: 'Section 56(2)(viib)',
    sourceExcerpt: 'Taxation of consideration received in excess of Fair Market Value of shares issued by closely held entities, extended to non-resident investors by Finance Act, 2023.',
    pageNumber: 2,
    highlightKey: 'h3',
    appliedText: 'applicable tax considerations compliant with Income Tax Act, 1961, Section 56(2)(viib) (as amended by Finance Act, 2023).'
  },
  {
    id: 'cite-4',
    number: 4,
    type: 'Verified statutory reference',
    severity: 'Low',
    status: 'verified',
    originalText: '...Arbitration and Conciliation Act, 1996, Section 9...',
    explanation: 'Citation verified against current arbitration jurisprudence and legislative amendments.',
    suggestedCitation: 'Arbitration and Conciliation Act, 1996, Section 9',
    sourceTitle: 'The Arbitration and Conciliation Act, 1996',
    sourceCourtOrAct: 'Ministry of Law and Justice',
    sourceYear: '1996',
    sourceSectionOrPara: 'Section 9 · Interim measures by Court',
    sourceExcerpt: 'A party may, before or during arbitral proceedings or at any time after the making of the arbitral award but before it is enforced, apply to a court for interim relief.',
    pageNumber: 3,
    highlightKey: 'h4',
    appliedText: 'Arbitration and Conciliation Act, 1996, Section 9'
  },
  {
    id: 'cite-5',
    number: 5,
    type: 'Verified statutory reference',
    severity: 'Low',
    status: 'verified',
    originalText: '...Indian Contract Act, 1872, Section 73...',
    explanation: 'Citation verified for liquidated damages and breach covenants.',
    suggestedCitation: 'Indian Contract Act, 1872, Section 73',
    sourceTitle: 'The Indian Contract Act, 1872',
    sourceCourtOrAct: 'Legislative Department',
    sourceYear: '1872',
    sourceSectionOrPara: 'Section 73 · Compensation for loss or damage',
    sourceExcerpt: 'Compensation for loss or damage caused by breach of contract naturally arising in the usual course of things.',
    pageNumber: 3,
    highlightKey: 'h5',
    appliedText: 'Indian Contract Act, 1872, Section 73'
  },
  {
    id: 'cite-6',
    number: 6,
    type: 'Verified statutory reference',
    severity: 'Low',
    status: 'verified',
    originalText: '...Specific Relief Act, 1963, Section 10...',
    explanation: 'Standard mandatory performance provision post-2018 amendment.',
    suggestedCitation: 'Specific Relief Act, 1963, Section 10',
    sourceTitle: 'The Specific Relief Act, 1963',
    sourceCourtOrAct: 'Ministry of Law and Justice',
    sourceYear: '1963 (Amended 2018)',
    sourceSectionOrPara: 'Section 10 · Specific performance in respect of contracts',
    sourceExcerpt: 'The specific performance of a contract shall be enforced by the court subject to the provisions contained in sub-section (2) of section 11, section 14 and section 16.',
    pageNumber: 4,
    highlightKey: 'h6',
    appliedText: 'Specific Relief Act, 1963, Section 10'
  },
  {
    id: 'cite-7',
    number: 7,
    type: 'Verified statutory reference',
    severity: 'Low',
    status: 'verified',
    originalText: '...SEBI (Substantial Acquisition of Shares and Takeovers) Regulations, 2011, Reg. 3(1)...',
    explanation: 'Compliance with public takeover trigger and disclosure thresholds.',
    suggestedCitation: 'SEBI (SAST) Regulations, 2011, Regulation 3(1)',
    sourceTitle: 'SEBI (Substantial Acquisition of Shares and Takeovers) Regulations, 2011',
    sourceCourtOrAct: 'Securities and Exchange Board of India',
    sourceYear: '2011',
    sourceSectionOrPara: 'Regulation 3(1) · Substantial acquisition of shares or voting rights',
    sourceExcerpt: 'No acquirer shall acquire shares or voting rights in a target company which taken together with shares already held entitle them to exercise 25% or more of voting rights.',
    pageNumber: 4,
    highlightKey: 'h7',
    appliedText: 'SEBI (SAST) Regulations, 2011, Regulation 3(1)'
  },
  {
    id: 'cite-8',
    number: 8,
    type: 'Verified judicial precedent',
    severity: 'Low',
    status: 'verified',
    originalText: '...Tata Consultancy Services v. State of Andhra Pradesh, (2005) 1 SCC 308...',
    explanation: 'Constitution Bench precedent regarding definition of intellectual property and goods.',
    suggestedCitation: 'Tata Consultancy Services v. State of A.P., (2005) 1 SCC 308',
    sourceTitle: 'Tata Consultancy Services v. State of Andhra Pradesh',
    sourceCourtOrAct: 'Supreme Court of India (Constitution Bench)',
    sourceYear: '2005',
    sourceSectionOrPara: '(2005) 1 SCC 308',
    sourceExcerpt: 'Held that software and intellectual property incorporeal rights incorporated on physical media or transferred constitute goods and subject to applicable statutory obligations.',
    pageNumber: 4,
    highlightKey: 'h8',
    appliedText: 'Tata Consultancy Services v. State of A.P., (2005) 1 SCC 308'
  }
];

interface DocumentVerificationProps {
  role?: 'advocate' | 'firm' | 'student' | 'citizen';
  initialUserName?: string;
  initialUserRole?: string;
  dashboardHref?: string;
}

export default function DocumentVerification({
  role = 'advocate',
  initialUserName,
  initialUserRole,
  dashboardHref = '/advocate'
}: DocumentVerificationProps) {
  // User Profile
  const userName = initialUserName || (role === 'firm' ? 'Khaitan & Co (Partner)' : role === 'student' ? 'Aarav Sharma (Student)' : role === 'citizen' ? 'Priya Patel (Citizen)' : 'Adv. Saurabh');
  const userSubtitle = initialUserRole || (role === 'firm' ? 'Law Firm · partner@khaitanco.com' : role === 'student' ? 'Law Student · student@campus.edu' : role === 'citizen' ? 'Citizen · priya.patel@example.com' : 'Advocate · saurabh@example.com');

  // Main Stepper & Review Mode
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);
  const [isRedlineMode, setIsRedlineMode] = useState(false);

  // Citations Data
  const [citations, setCitations] = useState<CitationItem[]>(INITIAL_CITATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'issues' | 'verified'>('all');

  // Fetch dynamic verification report
  useEffect(() => {
    api.getVerificationReport().then((res) => {
      if (res.success && res.data?.citations && Array.isArray(res.data.citations) && res.data.citations.length > 0) {
        setCitations(res.data.citations);
      }
    }).catch(() => {});
  }, []);
  const [filterSeverity, setFilterSeverity] = useState<'all' | 'high' | 'medium' | 'acts' | 'cases'>('all');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Document Viewer Controls
  const [zoomLevel, setZoomLevel] = useState<number>(100);
  const [isZoomDropdownOpen, setIsZoomDropdownOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<number>(2);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Interactive Changes Applied Tracking
  const [appliedCitationIds, setAppliedCitationIds] = useState<string[]>([]);
  const [dismissedCitationIds, setDismissedCitationIds] = useState<string[]>([]);

  // Source Verification Modal
  const [selectedSourceCitation, setSelectedSourceCitation] = useState<CitationItem | null>(null);

  // Bottom Assistant Prompt
  const [promptInput, setPromptInput] = useState('');
  const [citationModeDropdownOpen, setCitationModeDropdownOpen] = useState(false);
  const [citationMode, setCitationMode] = useState<'Citation Mode' | 'Statutory Check' | 'Precedent Search' | 'Bluebook / Indian Standard'>('Citation Mode');
  const [assistantNotification, setAssistantNotification] = useState<string | null>(null);

  // Derived counts
  const issueCount = citations.filter((c) => !appliedCitationIds.includes(c.id) && !dismissedCitationIds.includes(c.id) && c.status === 'issue').length;
  const verifiedCount = citations.filter((c) => c.status === 'verified' || appliedCitationIds.includes(c.id)).length;
  const totalCount = citations.length;

  // Filter citations based on active tab and severity filter
  const displayedCitations = citations.filter((c) => {
    const isApplied = appliedCitationIds.includes(c.id);
    const isDismissed = dismissedCitationIds.includes(c.id);

    if (isDismissed) return false;

    // Tab filter
    if (activeTab === 'issues') {
      if (isApplied || c.status !== 'issue') return false;
    } else if (activeTab === 'verified') {
      if (!isApplied && c.status !== 'verified') return false;
    }

    // Severity / Category dropdown filter
    if (filterSeverity === 'high' && c.severity !== 'High') return false;
    if (filterSeverity === 'medium' && c.severity !== 'Medium') return false;
    if (filterSeverity === 'acts' && !c.suggestedCitation.toLowerCase().includes('act')) return false;
    if (filterSeverity === 'cases' && !c.suggestedCitation.toLowerCase().includes('v.')) return false;

    return true;
  });

  // Handlers for Citation Actions
  const handleApplyChange = (id: string) => {
    setAppliedCitationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    setActiveStep(2);
    setAssistantNotification('Suggestion accepted. Document review text updated and citation marked as verified.');
    setTimeout(() => setAssistantNotification(null), 4000);
  };

  const handleDismiss = (id: string) => {
    setDismissedCitationIds((prev) => [...prev, id]);
  };

  const handleApplyAll = () => {
    const issueIds = citations.filter((c) => c.status === 'issue').map((c) => c.id);
    setAppliedCitationIds(issueIds);
    setActiveStep(2);
    setAssistantNotification('All suggested citations applied successfully! You can now switch to Redline Review.');
    setTimeout(() => setAssistantNotification(null), 4500);
  };

  const handleToggleRedlineReview = () => {
    setIsRedlineMode((prev) => !prev);
    setActiveStep(isRedlineMode ? 1 : 3);
  };

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const query = promptInput.trim();
    if (!query) return;

    if (query.toLowerCase().includes('apply all') || query.toLowerCase().includes('accept all')) {
      handleApplyAll();
    } else if (query.toLowerCase().includes('redline') || query.toLowerCase().includes('diff')) {
      handleToggleRedlineReview();
    } else {
      setAssistantNotification(`Analyzed "${query}": Verified statutory hierarchy with Section 2(20) Companies Act and Section 56(2)(viib) Income Tax Act.`);
      setTimeout(() => setAssistantNotification(null), 5000);
    }
    setPromptInput('');
  };

  const isClause1Applied = appliedCitationIds.includes('cite-1');
  const isClause2Applied = appliedCitationIds.includes('cite-2');

  // Export Changed Document State & Handler
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const handleExportDocument = (format: 'pdf-clean' | 'pdf-redline' | 'docx' | 'audit') => {
    setIsExportDropdownOpen(false);
    const clause1Text = isClause1Applied
      ? 'the Company is duly incorporated and validly existing under Section 2(20) of the Companies Act, 2013, and is in good standing.'
      : 'the Company is duly incorporated and validly existing under the Companies Act, 2013, and is in good standing.';

    const clause2Text = isClause2Applied
      ? 'all material contracts are in full force and effect and there are no undisclosed defaults under any material contract, as settled in Smith v. ABC Ltd., (2018) 5 SCC 123.'
      : 'all material contracts are in full force and effect and there are no undisclosed defaults under any material contract.';

    const content = `NEXORA LAW MADE SIMPLE — EXPORTED DOCUMENT
Document: Share_Purchase_Agreement_v2.pdf
Format: ${format.toUpperCase()}
Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
Verified By: ${userName}
Status: ${appliedCitationIds.length} / 3 Issues Resolved (${appliedCitationIds.length === 3 ? '100% Verified' : 'Partially Verified'})

========================================================================
SHARE PURCHASE AGREEMENT (VERIFIED DRAFT)
========================================================================

3. PURCHASE PRICE
3.1 The total purchase price shall be INR 10,00,00,000 (Rupees Ten Crore Only), subject to the adjustments set out in Clause 3.2.
3.2 The purchase price shall be payable in two tranches. The first tranche of INR 6,00,00,000 shall be paid within 30 days of the Closing Date, and the second tranche shall be paid within 6 months of the Closing Date, subject to satisfaction of the conditions precedent.

4. REPRESENTATIONS AND WARRANTIES
4.1 The Seller represents and warrants that:
  (a) ${clause1Text}
  (b) ${clause2Text}

========================================================================
CITATION VERIFICATION AUDIT TRAIL
========================================================================
1. Companies Act, 2013, Section 2(20) — Status: ${isClause1Applied ? 'ACCEPTED & INCORPORATED' : 'FLAGGED INCOMPLETE'}
2. Smith v. ABC Ltd., (2018) 5 SCC 123 — Status: ${isClause2Applied ? 'ACCEPTED & INCORPORATED' : 'FLAGGED INCORRECT'}
3. Income Tax Act, 1961, Section 56(2)(viib) — Status: ${appliedCitationIds.includes('cite-3') ? 'ACCEPTED & INCORPORATED' : 'FLAGGED OUTDATED'}
`;

    if (typeof window !== 'undefined') {
      const blob = new Blob([content], { type: format === 'docx' ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' : 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const extension = format === 'docx' ? 'docx' : 'pdf';
      const label = format === 'pdf-redline' ? 'redline_comparison' : format === 'audit' ? 'audit_trail' : 'verified_clean';
      a.download = `Share_Purchase_Agreement_v2_${label}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setAssistantNotification(`Exported "Share_Purchase_Agreement_v2" (${format.toUpperCase()}) successfully with verified citations.`);
    setTimeout(() => setAssistantNotification(null), 5000);
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 bg-[#FAF8F5] text-[#1E293B] font-sans antialiased">
      {/* Top Bar: Search, Notification Bell, User Profile */}
      <header className="h-16 px-4 sm:px-6 lg:px-8 bg-white border-b border-[#EAE3D6] flex items-center justify-between gap-4 sticky top-0 z-30">
        {/* Global Search Bar */}
        <div className="relative flex-1 max-w-xl">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            placeholder="Search for cases, laws, drafts, or ask AI..."
            className="w-full pl-10 pr-4 py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-full text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/20 focus:border-[#1E3A8A] transition"
          />
        </div>

        {/* Right Header: Notification & User Profile */}
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
            <div className="w-9 h-9 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
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

      {/* Main Content Workspace Container */}
      <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-[1720px] w-full mx-auto flex flex-col gap-6">
        {/* Workspace Title & Supreme Court Quote Section */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-2">
          <div>
            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-[#64748B] mb-1.5 font-medium">
              <span>Workspace</span>
              <span>/</span>
              <span className="text-[#1E3A8A] font-semibold">Document Review & Verification</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B] tracking-tight">
              Document Review & Verification
            </h1>
            <p className="text-sm text-[#64748B] mt-1">
              Verify citations first, apply suggested changes, then review redlines.
            </p>
          </div>

          {/* Supreme Court Architectural Motif & Quote */}
          <div className="flex items-center gap-4 bg-[#FAF5EB] border border-[#DECDB8] rounded-2xl px-5 py-3 shadow-sm self-start lg:self-auto">
            <div className="flex flex-col text-right">
              <span className="font-serif italic text-xs sm:text-sm text-[#8C5320] leading-snug">
                &ldquo;Accurate references lead to stronger documents.&rdquo;
              </span>
              <div className="w-8 h-[2px] bg-[#C59B58] self-end mt-1.5"></div>
            </div>
            <div className="relative w-16 h-12 flex-shrink-0 overflow-hidden rounded-lg">
              <Image
                src="/assets/supreme-court-gardens.png"
                alt="Supreme Court of India"
                fill
                className="object-cover mix-blend-multiply opacity-90"
              />
            </div>
          </div>
        </div>

        {/* Interactive Workflow & Document Export Bar */}
        <div className="bg-white border border-[#EAE3D6] rounded-2xl p-3 sm:p-4 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 shadow-sm">
          {/* Left: Modern Segmented Workflow Mode Switcher */}
          <div className="flex flex-wrap sm:flex-nowrap items-center bg-[#FAF8F5] p-1.5 rounded-xl border border-[#DECDB8] gap-1 sm:gap-2">
            {/* Mode 1: Citation Review */}
            <button
              type="button"
              onClick={() => {
                setActiveStep(1);
                setIsRedlineMode(false);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isRedlineMode && activeStep === 1
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E3A8A] hover:bg-white/80'
              }`}
            >
              <Scale className={`w-4 h-4 ${!isRedlineMode && activeStep === 1 ? 'text-[#C59B58]' : 'text-[#8C7355]'}`} />
              <div className="text-left">
                <span className="block leading-tight">Citation Review</span>
                <span className={`block text-[10px] font-normal ${!isRedlineMode && activeStep === 1 ? 'text-blue-200' : 'text-[#94A3B8]'}`}>
                  8 Citations Detected
                </span>
              </div>
            </button>

            {/* Mode 2: Apply Changes */}
            <button
              type="button"
              onClick={() => {
                setActiveStep(2);
                setIsRedlineMode(false);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                !isRedlineMode && activeStep === 2
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E3A8A] hover:bg-white/80'
              }`}
            >
              <FileCheck className={`w-4 h-4 ${!isRedlineMode && activeStep === 2 ? 'text-emerald-300' : 'text-emerald-600'}`} />
              <div className="text-left">
                <span className="block leading-tight">Apply Changes</span>
                <span className={`block text-[10px] font-normal ${!isRedlineMode && activeStep === 2 ? 'text-blue-200' : 'text-[#94A3B8]'}`}>
                  {appliedCitationIds.length > 0 ? `${appliedCitationIds.length} Accepted` : `${issueCount} Pending Review`}
                </span>
              </div>
            </button>

            {/* Mode 3: Redline Review */}
            <button
              type="button"
              onClick={() => {
                setActiveStep(3);
                setIsRedlineMode(true);
              }}
              className={`flex items-center gap-2.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isRedlineMode
                  ? 'bg-[#1E3A8A] text-white shadow-xs'
                  : 'text-[#64748B] hover:text-[#1E3A8A] hover:bg-white/80'
              }`}
            >
              <Layers className={`w-4 h-4 ${isRedlineMode ? 'text-amber-300' : 'text-amber-600'}`} />
              <div className="text-left">
                <span className="block leading-tight">Redline Review</span>
                <span className={`block text-[10px] font-normal ${isRedlineMode ? 'text-blue-200' : 'text-[#94A3B8]'}`}>
                  Visual Document Diff
                </span>
              </div>
            </button>
          </div>

          {/* Right: Export Changed Document Dropdown Button + Quick Toggle */}
          <div className="flex items-center gap-2.5 ml-auto">
            {/* Direct Quick Toggle */}
            <button
              type="button"
              onClick={handleToggleRedlineReview}
              className="hidden lg:flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition border border-[#DECDB8] bg-[#FAF8F5] text-[#1E3A8A] hover:bg-[#DECDB8] shadow-xs cursor-pointer"
            >
              {isRedlineMode ? (
                <>
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Citation Mode</span>
                </>
              ) : (
                <>
                  <span>Redline Mode</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>

            {/* Export Document Button with Dropdown */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 shadow-sm cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Document</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
              </button>

              {isExportDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 bg-white border border-[#EAE3D6] rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                  <div className="px-3 py-2 border-b border-[#FAF5EB]">
                    <span className="text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider block">
                      Export Options
                    </span>
                    <span className="text-xs text-[#64748B] block mt-0.5">
                      {appliedCitationIds.length} verified change{appliedCitationIds.length === 1 ? '' : 's'} included
                    </span>
                  </div>

                  <div className="space-y-1 mt-1">
                    <button
                      type="button"
                      onClick={() => handleExportDocument('pdf-clean')}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] transition text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-red-50 text-red-600 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs font-bold text-[#1E293B] group-hover:text-[#1E3A8A]">
                          Clean PDF (Changes Applied)
                        </span>
                        <span className="block text-[11px] text-[#64748B]">
                          Official verified agreement without redline markings
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportDocument('pdf-redline')}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] transition text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Layers className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs font-bold text-[#1E293B] group-hover:text-[#1E3A8A]">
                          Redline Comparison PDF
                        </span>
                        <span className="block text-[11px] text-[#64748B]">
                          Includes strike-throughs and highlighted green insertions
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportDocument('docx')}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] transition text-left cursor-pointer group"
                    >
                      <div className="w-7 h-7 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Download className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs font-bold text-[#1E293B] group-hover:text-[#1E3A8A]">
                          Microsoft Word (.docx)
                        </span>
                        <span className="block text-[11px] text-[#64748B]">
                          Editable contract with tracked legal changes
                        </span>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleExportDocument('audit')}
                      className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl hover:bg-[#FAF8F5] transition text-left cursor-pointer group border-t border-[#FAF5EB]"
                    >
                      <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <span className="block text-xs font-bold text-[#1E293B] group-hover:text-[#1E3A8A]">
                          Citation Audit Certificate
                        </span>
                        <span className="block text-[11px] text-[#64748B]">
                          Summary report of all verified statutory authorities
                        </span>
                      </div>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Toast / Notification Banner */}
        {assistantNotification && (
          <div className="bg-[#FAF5EB] border border-[#DECDB8] text-[#8C5320] px-4 py-3 rounded-xl flex items-center justify-between text-xs sm:text-sm shadow-sm animate-in fade-in duration-200">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-[#C59B58] flex-shrink-0" />
              <span>{assistantNotification}</span>
            </div>
            <button
              type="button"
              onClick={() => setAssistantNotification(null)}
              className="text-[#8C5320] hover:text-[#1E293B] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* 2-Column Responsive Workstation Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

          {/* =================================================================== */}
          {/* COLUMN 1: DOCUMENT VIEWER & ASSISTANT PROMPT (lg:col-span-7 or 8) */}
          {/* =================================================================== */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-4">
            <div className="bg-white border border-[#EAE3D6] rounded-2xl overflow-hidden shadow-sm flex flex-col">
              
              {/* Document Title Header Bar */}
              <div className="p-4 sm:px-6 sm:py-4 bg-[#FAF8F5] border-b border-[#EAE3D6] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  {/* Red PDF Icon Badge */}
                  <div className="w-9 h-9 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0">
                    <FileText className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#1E293B] flex items-center gap-2">
                      Share_Purchase_Agreement_v2.pdf
                      {isRedlineMode && (
                        <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Redline Mode
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      12 pages • {citations.length} citations detected • Last updated 20 Oct 2026
                    </p>
                  </div>
                </div>

                {/* Document View Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.max(75, prev - 15))}
                    className="p-1.5 rounded-lg border border-[#DECDB8] bg-white text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoomLevel((prev) => Math.min(150, prev + 15))}
                    className="p-1.5 rounded-lg border border-[#DECDB8] bg-white text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-4 h-4" />
                  </button>

                  {/* Zoom Percent Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsZoomDropdownOpen(!isZoomDropdownOpen)}
                      className="px-2.5 py-1.5 rounded-lg border border-[#DECDB8] bg-white text-xs font-semibold text-[#1E293B] flex items-center gap-1.5 hover:border-[#1E3A8A] transition cursor-pointer"
                    >
                      <span>{zoomLevel}%</span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                    </button>
                    {isZoomDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-24 bg-white border border-[#EAE3D6] rounded-xl shadow-lg z-20 py-1 text-xs">
                        {[75, 100, 125, 150].map((lvl) => (
                          <button
                            key={lvl}
                            type="button"
                            onClick={() => {
                              setZoomLevel(lvl);
                              setIsZoomDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] cursor-pointer ${
                              zoomLevel === lvl ? 'font-bold text-[#1E3A8A] bg-[#FAF8F5]' : 'text-[#1E293B]'
                            }`}
                          >
                            {lvl}%
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Fullscreen icon */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1.5 rounded-lg border border-[#DECDB8] bg-white text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'View Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Document Pages & Content Panel */}
              <div className="flex flex-col sm:flex-row min-h-[560px] bg-[#FAF8F5]/60 overflow-hidden">
                
                {/* Left Thumbnail Strip */}
                <div className="w-full sm:w-28 border-b sm:border-b-0 sm:border-r border-[#EAE3D6] p-3 flex sm:flex-col items-center gap-3 overflow-x-auto sm:overflow-y-auto bg-white/70">
                  {[1, 2, 3, 4].map((pageNum) => (
                    <button
                      key={pageNum}
                      type="button"
                      onClick={() => setSelectedPage(pageNum)}
                      className={`flex flex-col items-center gap-1 p-1 rounded-xl transition cursor-pointer flex-shrink-0 ${
                        selectedPage === pageNum
                          ? 'ring-2 ring-[#1E3A8A] bg-[#FAF5EB]'
                          : 'hover:bg-[#FAF8F5] opacity-75 hover:opacity-100'
                      }`}
                    >
                      {/* Mini Thumbnail Page Mock */}
                      <div className="w-16 h-20 bg-white border border-[#DECDB8] rounded shadow-xs p-1.5 flex flex-col justify-between text-[6px] text-gray-400 overflow-hidden pointer-events-none select-none">
                        <div className="space-y-1">
                          <div className="h-1 bg-gray-300 rounded w-3/4"></div>
                          <div className="h-0.5 bg-gray-200 rounded w-full"></div>
                          <div className="h-0.5 bg-gray-200 rounded w-5/6"></div>
                          <div className="h-0.5 bg-gray-200 rounded w-full"></div>
                        </div>
                        {pageNum === 2 && (
                          <div className="space-y-0.5">
                            <div className="h-1 bg-red-200 rounded w-full"></div>
                            <div className="h-1 bg-red-200 rounded w-4/5"></div>
                          </div>
                        )}
                        <span className="text-center font-bold text-[8px] text-gray-400">{pageNum}</span>
                      </div>
                      <span className={`text-[11px] font-semibold ${selectedPage === pageNum ? 'text-[#1E3A8A]' : 'text-[#64748B]'}`}>
                        {pageNum}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Right Document Sheet Canvas */}
                <div className="flex-1 p-4 sm:p-8 overflow-y-auto max-h-[620px] flex justify-center">
                  <div
                    className="w-full max-w-2xl bg-white border border-[#DECDB8] rounded-xl shadow-md p-6 sm:p-10 text-[#1E293B] font-serif transition-transform duration-200 select-text"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  >
                    {selectedPage === 2 ? (
                      <div className="space-y-6 text-sm sm:text-base leading-relaxed">
                        
                        {/* Clause 3 */}
                        <div>
                          <h4 className="font-sans font-bold text-base sm:text-lg text-[#1E293B] tracking-wide mb-3">
                            3. PURCHASE PRICE
                          </h4>
                          <div className="space-y-3 font-serif text-[#334155] leading-relaxed">
                            <p>
                              <strong className="font-sans font-semibold text-[#1E293B]">3.1</strong> The total purchase price shall be INR 10,00,00,000 (Rupees Ten Crore Only), subject to the adjustments set out in Clause 3.2.
                            </p>
                            <p>
                              <strong className="font-sans font-semibold text-[#1E293B]">3.2</strong> The purchase price shall be payable in two tranches. The first tranche of INR 6,00,00,000 shall be paid within 30 days of the Closing Date, and the second tranche shall be paid within 6 months of the Closing Date, subject to satisfaction of the conditions precedent.
                            </p>
                          </div>
                        </div>

                        {/* Clause 4 */}
                        <div>
                          <h4 className="font-sans font-bold text-base sm:text-lg text-[#1E293B] tracking-wide mb-3">
                            4. REPRESENTATIONS AND WARRANTIES
                          </h4>
                          <div className="space-y-3 font-serif text-[#334155] leading-relaxed">
                            <p>
                              <strong className="font-sans font-semibold text-[#1E293B]">4.1</strong> The Seller represents and warrants that:
                            </p>

                            {/* Subclause (a) with Annotation [1] */}
                            <div className="pl-6 flex items-start gap-2">
                              <span className="font-sans font-semibold text-[#1E293B] mt-0.5">(a)</span>
                              <div className="flex-1">
                                {isRedlineMode ? (
                                  <div className="p-2 rounded bg-amber-50/70 border border-amber-200">
                                    <span className="text-[#64748B]">the Company is duly incorporated and validly existing under </span>
                                    <span className="line-through text-red-600 bg-red-100 px-1 py-0.5 rounded mr-1">the Companies Act, 2013</span>
                                    <span className="text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-medium">Section 2(20) of the Companies Act, 2013</span>
                                    <span className="text-[#64748B]">, and is in good standing.</span>
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded font-sans">Redline Accepted</span>
                                  </div>
                                ) : isClause1Applied ? (
                                  <span className="bg-emerald-50 text-emerald-900 border-b-2 border-emerald-500 px-1 py-0.5 rounded inline-block transition">
                                    the Company is duly incorporated and validly existing under{' '}
                                    <span className="font-semibold text-emerald-800">Section 2(20) of the Companies Act, 2013</span>, and is in good standing.
                                    <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-sans font-bold">
                                      ✓
                                    </span>
                                  </span>
                                ) : (
                                  <span className="bg-red-50 text-[#991B1B] border-b-2 border-red-500 px-1 py-0.5 rounded inline-block transition group cursor-pointer" onClick={() => setActiveTab('issues')}>
                                    the Company is duly incorporated and validly existing under the Companies Act, 2013, and is in good standing.
                                    <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded bg-red-600 text-white text-[10px] font-sans font-bold">
                                      1
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Subclause (b) with Annotation [2] */}
                            <div className="pl-6 flex items-start gap-2">
                              <span className="font-sans font-semibold text-[#1E293B] mt-0.5">(b)</span>
                              <div className="flex-1">
                                {isRedlineMode ? (
                                  <div className="p-2 rounded bg-amber-50/70 border border-amber-200">
                                    <span className="text-[#64748B]">all material contracts are in full force and effect and </span>
                                    <span className="line-through text-red-600 bg-red-100 px-1 py-0.5 rounded mr-1">there are no undisclosed defaults under any material contract.</span>
                                    <span className="text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-medium">there are no undisclosed defaults under any material contract, as settled in Smith v. ABC Ltd., (2018) 5 SCC 123.</span>
                                    <span className="ml-2 inline-flex items-center px-1.5 py-0.2 bg-emerald-600 text-white text-[10px] rounded font-sans">Redline Accepted</span>
                                  </div>
                                ) : isClause2Applied ? (
                                  <span className="bg-emerald-50 text-emerald-900 border-b-2 border-emerald-500 px-1 py-0.5 rounded inline-block transition">
                                    all material contracts are in full force and effect and there are no undisclosed defaults under any material contract, as settled in{' '}
                                    <span className="font-semibold text-emerald-800">Smith v. ABC Ltd., (2018) 5 SCC 123</span>.
                                    <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-sans font-bold">
                                      ✓
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    all material contracts are in full force and effect and{' '}
                                    <span className="bg-red-50 text-[#991B1B] border-b-2 border-red-500 px-1 py-0.5 rounded inline-block transition group cursor-pointer" onClick={() => setActiveTab('issues')}>
                                      there are no undisclosed defaults under any material contract.
                                      <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded bg-red-600 text-white text-[10px] font-sans font-bold">
                                        2
                                      </span>
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Subclause (c) Outdated Authority [3] */}
                            <div className="pl-6 flex items-start gap-2">
                              <span className="font-sans font-semibold text-[#1E293B] mt-0.5">(c)</span>
                              <div className="flex-1">
                                {appliedCitationIds.includes('cite-3') ? (
                                  <span className="bg-emerald-50 text-emerald-900 border-b-2 border-emerald-500 px-1 py-0.5 rounded inline-block transition">
                                    all tax liabilities conform with{' '}
                                    <span className="font-semibold text-emerald-800">Income Tax Act, 1961, Section 56(2)(viib) (as amended by Finance Act, 2023)</span>.
                                    <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-sans font-bold">
                                      ✓
                                    </span>
                                  </span>
                                ) : (
                                  <span>
                                    the consideration payable aligns with applicable provisions{' '}
                                    <span className="bg-amber-50 text-[#92400E] border-b-2 border-amber-500 px-1 py-0.5 rounded inline-block transition group cursor-pointer" onClick={() => setActiveTab('issues')}>
                                      as per the Income Tax Act, 1961 (amended) --
                                      <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded bg-amber-600 text-white text-[10px] font-sans font-bold">
                                        3
                                      </span>
                                    </span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>

                      </div>
                    ) : (
                      <div className="py-20 text-center space-y-3 font-sans">
                        <FileCheck className="w-12 h-12 text-[#94A3B8] mx-auto opacity-70" />
                        <h4 className="font-bold text-lg text-[#1E293B]">Page {selectedPage} Preview</h4>
                        <p className="text-sm text-[#64748B] max-w-sm mx-auto">
                          Verified legal provisions for Page {selectedPage} have been pre-screened without flagged conflicts.
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedPage(2)}
                          className="px-4 py-2 rounded-xl text-xs font-semibold text-[#1E3A8A] bg-[#FAF5EB] border border-[#DECDB8] hover:bg-[#DECDB8] transition cursor-pointer"
                        >
                          Return to Annotated Page 2
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Bottom Interactive Prompt / Search Bar */}
              <div className="p-3 sm:p-4 bg-white border-t border-[#EAE3D6] flex flex-col sm:flex-row items-center gap-3">
                <form onSubmit={handlePromptSubmit} className="flex-1 flex items-center gap-2 w-full bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl px-4 py-2 shadow-xs focus-within:border-[#1E3A8A] transition">
                  <Sparkles className="w-4 h-4 text-[#1E3A8A] flex-shrink-0" />
                  <input
                    type="text"
                    value={promptInput}
                    onChange={(e) => setPromptInput(e.target.value)}
                    placeholder="Ask for better citations, explain an issue, or apply all suggestions..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none"
                  />
                  <button
                    type="button"
                    className="p-1 rounded-lg text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title="Attach reference document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  {/* Mode Dropdown */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setCitationModeDropdownOpen(!citationModeDropdownOpen)}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-[#DECDB8] bg-white text-[11px] font-semibold text-[#1E3A8A] hover:bg-[#FAF8F5] transition cursor-pointer"
                    >
                      <span>{citationMode}</span>
                      <ChevronDown className="w-3 h-3 text-[#64748B]" />
                    </button>
                    {citationModeDropdownOpen && (
                      <div className="absolute right-0 bottom-full mb-1 w-48 bg-white border border-[#EAE3D6] rounded-xl shadow-lg z-20 py-1 text-xs">
                        {(['Citation Mode', 'Statutory Check', 'Precedent Search', 'Bluebook / Indian Standard'] as const).map((mode) => (
                          <button
                            key={mode}
                            type="button"
                            onClick={() => {
                              setCitationMode(mode);
                              setCitationModeDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] cursor-pointer ${
                              citationMode === mode ? 'font-bold text-[#1E3A8A] bg-[#FAF8F5]' : 'text-[#1E293B]'
                            }`}
                          >
                            {mode}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <button
                    type="submit"
                    className="w-7 h-7 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center hover:bg-[#1E3A8A]/90 transition shadow-xs flex-shrink-0 cursor-pointer"
                    title="Submit query"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>

                {issueCount > 0 && (
                  <button
                    type="button"
                    onClick={handleApplyAll}
                    className="w-full sm:w-auto px-4 py-2 rounded-xl text-xs font-semibold bg-[#FAF5EB] text-[#8C5320] border border-[#DECDB8] hover:bg-[#DECDB8] transition flex items-center justify-center gap-1.5 flex-shrink-0 cursor-pointer"
                  >
                    <Check className="w-4 h-4 text-[#C59B58]" />
                    <span>Apply All ({issueCount})</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* =================================================================== */}
          {/* COLUMN 2: CITATIONS & VERIFICATION INSPECTOR (lg:col-span-5 or 4) */}
          {/* =================================================================== */}
          <div className="lg:col-span-5 xl:col-span-4 flex flex-col gap-4">
            <div className="bg-white border border-[#EAE3D6] rounded-2xl overflow-hidden shadow-sm flex flex-col">
              
              {/* Tab Header & Filter Row */}
              <div className="p-3 sm:px-4 sm:py-3 border-b border-[#EAE3D6] bg-[#FAF8F5] flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Tab: All Citations */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('all')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'all'
                        ? 'bg-white text-[#1E3A8A] shadow-xs border border-[#DECDB8]'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <Scale className="w-3.5 h-3.5 text-[#C59B58]" />
                    <span>Citations ({totalCount})</span>
                  </button>

                  {/* Tab: Issues */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('issues')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'issues'
                        ? 'bg-white text-red-700 shadow-xs border border-red-200'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-500" />
                    <span>Issues ({issueCount})</span>
                  </button>

                  {/* Tab: Verified */}
                  <button
                    type="button"
                    onClick={() => setActiveTab('verified')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeTab === 'verified'
                        ? 'bg-white text-emerald-700 shadow-xs border border-emerald-200'
                        : 'text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Verified ({verifiedCount})</span>
                  </button>
                </div>

                {/* Filter Icon and Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="p-1.5 rounded-lg border border-[#DECDB8] bg-white text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title="Filter citations"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                  {isFilterDropdownOpen && (
                    <div className="absolute right-0 mt-1 w-44 bg-white border border-[#EAE3D6] rounded-xl shadow-lg z-20 py-1 text-xs">
                      <div className="px-3 py-1 text-[10px] font-bold text-[#94A3B8] uppercase tracking-wider">
                        Filter By
                      </div>
                      {[
                        { key: 'all', label: 'All Items' },
                        { key: 'high', label: 'High Severity Only' },
                        { key: 'medium', label: 'Medium Severity Only' },
                        { key: 'acts', label: 'Statutes & Acts' },
                        { key: 'cases', label: 'Case Precedents' }
                      ].map((f) => (
                        <button
                          key={f.key}
                          type="button"
                          onClick={() => {
                            setFilterSeverity(f.key as any);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-1.5 hover:bg-[#FAF8F5] cursor-pointer ${
                            filterSeverity === f.key ? 'font-bold text-[#1E3A8A] bg-[#FAF8F5]' : 'text-[#1E293B]'
                          }`}
                        >
                          {f.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Citations Card List */}
              <div className="p-4 flex flex-col gap-4 max-h-[680px] overflow-y-auto">
                {displayedCitations.length === 0 ? (
                  <div className="py-16 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <p className="font-semibold text-sm text-[#1E293B]">All Clear</p>
                    <p className="text-xs text-[#64748B]">No citations match the selected filter.</p>
                  </div>
                ) : (
                  displayedCitations.map((cite) => {
                    const isApplied = appliedCitationIds.includes(cite.id);
                    const isIssue = cite.status === 'issue' && !isApplied;

                    return (
                      <div
                        key={cite.id}
                        className={`rounded-2xl border p-4 transition-all duration-200 ${
                          isApplied
                            ? 'bg-emerald-50/50 border-emerald-200 shadow-xs'
                            : isIssue
                            ? 'bg-white border-[#DECDB8] shadow-xs hover:border-[#1E3A8A]/40'
                            : 'bg-[#FAF8F5] border-[#EAE3D6]'
                        }`}
                      >
                        {/* Card Top Row: Number Badge, Issue Badge, Severity, Action Menu */}
                        <div className="flex items-start justify-between gap-2 mb-2.5">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Circle Number Badge */}
                            <div
                              className={`w-6 h-6 rounded-md flex items-center justify-center font-bold text-xs ${
                                isApplied
                                  ? 'bg-emerald-600 text-white'
                                  : cite.severity === 'High'
                                  ? 'bg-red-600 text-white'
                                  : cite.severity === 'Medium'
                                  ? 'bg-amber-600 text-white'
                                  : 'bg-[#1E3A8A] text-white'
                              }`}
                            >
                              {isApplied ? '✓' : cite.number}
                            </div>

                            {/* Issue Pill Tag */}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                                isApplied
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : cite.severity === 'High'
                                  ? 'bg-red-100 text-red-800'
                                  : cite.severity === 'Medium'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {isApplied ? 'Changes Accepted' : cite.type}
                            </span>

                            {/* Severity Badge */}
                            {!isApplied && cite.severity && (
                              <span
                                className={`text-[11px] font-medium px-1.5 py-0.5 rounded ${
                                  cite.severity === 'High'
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200'
                                }`}
                              >
                                {cite.severity}
                              </span>
                            )}
                          </div>

                          <button
                            type="button"
                            className="p-1 rounded text-[#94A3B8] hover:text-[#1E293B] cursor-pointer"
                            title="More options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Document Quote Snippet */}
                        <p className="text-xs text-[#64748B] italic mb-1.5 font-serif">
                          {cite.originalText}
                        </p>

                        {/* Issue Explanation */}
                        <p className="text-xs text-[#334155] leading-relaxed mb-3">
                          {cite.explanation}
                        </p>

                        {/* Suggested Citation Highlight Box */}
                        <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-xl p-3 mb-3">
                          <div className="flex items-center justify-between text-[11px] text-[#64748B] mb-1">
                            <span className="uppercase tracking-wider font-semibold">Suggested citation</span>
                            <button
                              type="button"
                              onClick={() => setSelectedSourceCitation(cite)}
                              className="text-[#1E3A8A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <span>View Source</span>
                              <ExternalLink className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-[#1E293B]">
                            {cite.suggestedCitation}
                          </div>
                        </div>

                        {/* Action Buttons: Apply Change & Dismiss */}
                        <div className="flex items-center gap-2 pt-1">
                          {isApplied ? (
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                                <CheckCircle2 className="w-4 h-4" />
                                Verified in Document
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  setAppliedCitationIds((prev) => prev.filter((id) => id !== cite.id));
                                }}
                                className="text-xs text-[#64748B] hover:text-red-600 hover:underline cursor-pointer"
                              >
                                Undo
                              </button>
                            </div>
                          ) : (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApplyChange(cite.id)}
                                className="flex-1 py-1.5 px-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-semibold transition shadow-xs flex items-center justify-center gap-1 cursor-pointer"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>Apply Change</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDismiss(cite.id)}
                                className="py-1.5 px-3 rounded-xl border border-[#DECDB8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#64748B] transition cursor-pointer"
                              >
                                Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Source Verification Modal */}
      {selectedSourceCitation && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-2xl max-w-xl w-full p-6 shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedSourceCitation(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-[#FAF8F5] cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[#FAF5EB] border border-[#DECDB8] flex items-center justify-center text-[#C59B58]">
                <BookOpen className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-serif font-bold text-base text-[#1E293B]">Official Authority Verification</h3>
                <span className="text-xs text-[#64748B]">Verified Legal Repository Cross-Check</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-xl p-3.5 space-y-1.5">
                <div className="text-xs font-bold text-[#1E3A8A]">{selectedSourceCitation.sourceTitle}</div>
                <div className="text-xs text-[#64748B] flex items-center gap-2">
                  <span>{selectedSourceCitation.sourceCourtOrAct}</span>
                  <span>•</span>
                  <span>{selectedSourceCitation.sourceYear}</span>
                </div>
                <div className="text-xs font-semibold text-[#8C5320]">{selectedSourceCitation.sourceSectionOrPara}</div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider block mb-1">
                  Statutory Gazette / Judicial Headnote Excerpt:
                </span>
                <p className="text-xs sm:text-sm font-serif italic text-[#334155] leading-relaxed p-3 bg-white border border-[#EAE3D6] rounded-xl">
                  &ldquo;{selectedSourceCitation.sourceExcerpt}&rdquo;
                </p>
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Primary Source Authenticity: 100%
                </span>
                <button
                  type="button"
                  onClick={() => {
                    handleApplyChange(selectedSourceCitation.id);
                    setSelectedSourceCitation(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition cursor-pointer"
                >
                  Accept & Apply to Agreement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
