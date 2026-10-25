'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Briefcase,
  FileText,
  Calendar,
  User,
  Users,
  Scale,
  Star,
  Copy,
  Check,
  Share2,
  MoreHorizontal,
  Plus,
  ArrowRight,
  Download,
  Clock,
  Building,
  CheckCircle2,
  FileCheck,
  Phone,
  Mail,
  X,
  Shield,
  UserCheck,
  GraduationCap,
  BookmarkCheck
} from 'lucide-react';

export type UserRoleType = 'advocate' | 'firm' | 'citizen' | 'student';
export type SearchTabType = 'cnr' | 'party' | 'case_num' | 'advanced';
export type CaseFilterType = 'all' | 'followed' | 'active' | 'disposed';
export type DetailsTabType = 'overview' | 'parties' | 'advocates' | 'related';

export interface CaseItem {
  id: string;
  cnr: string;
  title: string;
  court: string;
  caseType: string;
  filingNumber: string;
  filingDate: string;
  petitioner: string;
  respondent: string;
  statusBadge: {
    label: string;
    date: string;
    type: 'hearing' | 'order' | 'listed' | 'disposed';
  };
  isActive: boolean;
  isStarred: boolean;
  isFollowed: boolean;
  clientName?: string;
  subject: string;
  acts: string[];
  currentStatusText: string;
  currentStatusDesc: string;
  plainLanguageSummary: string;
  briefFacts: string;
  nextHearing: {
    date: string;
    dayTime: string;
    bench: string;
    courtRoom: string;
    itemNo: string;
  };
  timeline: Array<{
    date: string;
    title: string;
    desc: string;
    badge?: string;
    hasOrderButton?: boolean;
    orderId?: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
    date: string;
    size: string;
    type: 'pdf' | 'doc';
  }>;
  partiesList: Array<{
    name: string;
    role: string;
    advocate: string;
  }>;
}

const SAMPLE_CASES: CaseItem[] = [
  {
    id: 'case-1',
    cnr: 'MHHC010123452023',
    title: 'Ramesh Kumar vs. State of Maharashtra',
    court: 'Bombay High Court',
    caseType: 'Writ Petition (Civil)',
    filingNumber: 'WP/12345/2023',
    filingDate: '14 Mar 2023',
    petitioner: 'Ramesh Kumar',
    respondent: 'State of Maharashtra',
    statusBadge: {
      label: 'Next Hearing',
      date: '28 Oct 2026',
      type: 'hearing'
    },
    isActive: true,
    isStarred: true,
    isFollowed: true,
    clientName: 'Ramesh Kumar (Citizen)',
    subject: 'Challenge to the demolition notice issued by the municipal corporation.',
    acts: ['Article 14', 'Article 21', 'Municipal Corporation Act, 1949'],
    currentStatusText: 'Pending for Hearing',
    currentStatusDesc: 'Matter listed on 28 Oct 2026 for further arguments.',
    plainLanguageSummary: 'The court has temporarily halted demolition work. Your advocate will present evidence on 28 Oct to show the municipal notice did not give sufficient notice.',
    briefFacts: 'The petitioner has challenged the demolition notice issued by the municipal corporation, alleging violation of natural justice and lack of proper hearing. The petitioner has resided in the subject property for over 22 years and holds municipal tax receipts and regularized electricity connections.',
    nextHearing: {
      date: '28 October 2026',
      dayTime: 'Wednesday · 10:30 AM',
      bench: "Hon'ble Justice R. S. Patil & Justice M. G. Deshmukh",
      courtRoom: 'Courtroom 4 (Main Building)',
      itemNo: 'Item No. 18'
    },
    timeline: [
      {
        date: '28 Oct 2026',
        title: 'Upcoming Hearing',
        desc: 'Further arguments on municipal demolition notice validity',
        badge: 'Upcoming'
      },
      {
        date: '12 Oct 2026',
        title: 'Last Hearing',
        desc: 'Interim stay order granted; status quo directed till next date',
        hasOrderButton: true,
        orderId: 'ord-1'
      },
      {
        date: '18 Sep 2026',
        title: 'Hearing',
        desc: 'Respondent filed counter affidavit; rejoinder granted 3 weeks'
      },
      {
        date: '05 Aug 2026',
        title: 'Hearing',
        desc: 'Notice issued to respondent municipal corporation'
      },
      {
        date: '14 Mar 2023',
        title: 'Case Filed',
        desc: 'Writ Petition filed with stay application'
      }
    ],
    documents: [
      { id: 'doc-1', title: 'Interim Order', date: '12 Oct 2026', size: '245 KB', type: 'pdf' },
      { id: 'doc-2', title: 'Counter Affidavit (Respondent)', date: '18 Sep 2026', size: '312 KB', type: 'pdf' },
      { id: 'doc-3', title: 'Writ Petition', date: '14 Mar 2023', size: '1.2 MB', type: 'doc' }
    ],
    partiesList: [
      { name: 'Ramesh Kumar', role: 'Petitioner (Individual)', advocate: 'Adv. Saurabh Sharma' },
      { name: 'State of Maharashtra', role: 'Respondent No. 1', advocate: 'Govt. Pleader Office' },
      { name: 'Brihanmumbai Municipal Corp.', role: 'Respondent No. 2', advocate: 'Adv. V. K. Iyer' }
    ]
  },
  {
    id: 'case-2',
    cnr: 'DLHC020987652024',
    title: 'Aarti Sharma vs. Union of India',
    court: 'Delhi High Court',
    caseType: 'Writ Petition (Civil)',
    filingNumber: 'WPC/8920/2024',
    filingDate: '22 Jan 2024',
    petitioner: 'Aarti Sharma',
    respondent: 'Union of India',
    statusBadge: {
      label: 'Order Uploaded',
      date: '12 Oct 2026',
      type: 'order'
    },
    isActive: true,
    isStarred: false,
    isFollowed: true,
    clientName: 'Aarti Sharma',
    subject: 'Service dispute regarding senior scale promotion entitlement.',
    acts: ['Article 309', 'Central Civil Services Rules, 1965'],
    currentStatusText: 'Order Reserved',
    currentStatusDesc: 'Final arguments concluded. Judgment reserved by the Division Bench.',
    plainLanguageSummary: 'Arguments concluded in the Delhi High Court. The judge has reserved the written verdict.',
    briefFacts: 'The petitioner contends that she was overlooked for promotion despite meeting all merit criteria and holding an exemplary appraisal record over the qualifying 5-year benchmark.',
    nextHearing: {
      date: '15 November 2026',
      dayTime: 'Monday · 02:15 PM',
      bench: "Hon'ble Chief Justice & Justice K. N. Sen",
      courtRoom: 'Courtroom 1',
      itemNo: 'Item No. 04'
    },
    timeline: [
      { date: '12 Oct 2026', title: 'Order Reserved', desc: 'Arguments concluded by both sides; written notes submitted', badge: 'Reserved', hasOrderButton: true },
      { date: '20 Sep 2026', title: 'Hearing', desc: 'Rejoinder arguments on behalf of petitioner' },
      { date: '22 Jan 2024', title: 'Case Filed', desc: 'Filing verified and registered' }
    ],
    documents: [
      { id: 'doc-4', title: 'Division Bench Daily Order', date: '12 Oct 2026', size: '180 KB', type: 'pdf' },
      { id: 'doc-5', title: 'Promotion Rules Compendium', date: '04 Mar 2024', size: '2.1 MB', type: 'pdf' }
    ],
    partiesList: [
      { name: 'Aarti Sharma', role: 'Petitioner', advocate: 'Adv. Saurabh Sharma' },
      { name: 'Union of India', role: 'Respondent', advocate: 'Addl. Solicitor General' }
    ]
  },
  {
    id: 'case-3',
    cnr: 'SUPC001234562024',
    title: 'XYZ Pvt. Ltd. vs. ABC Ltd.',
    court: 'Supreme Court of India',
    caseType: 'Civil Appeal',
    filingNumber: 'CA/4021/2024',
    filingDate: '10 May 2024',
    petitioner: 'XYZ Pvt. Ltd.',
    respondent: 'ABC Ltd.',
    statusBadge: {
      label: 'Listed',
      date: '10 Nov 2026',
      type: 'listed'
    },
    isActive: true,
    isStarred: true,
    isFollowed: true,
    clientName: 'XYZ Infrastructure Group',
    subject: 'Challenge against Arbitral Tribunal Award under Section 34 of Arbitration Act.',
    acts: ['Arbitration & Conciliation Act, 1996 - Sec 34', 'Commercial Courts Act'],
    currentStatusText: 'Listed on Board',
    currentStatusDesc: 'Scheduled for preliminary admission before Court No. 3.',
    plainLanguageSummary: 'The company appeal has been admitted by Supreme Court registry and is listed for hearing.',
    briefFacts: 'Dispute arising from commercial joint development agreement involving delayed EPC deliverables in Pune metro project.',
    nextHearing: {
      date: '10 November 2026',
      dayTime: 'Tuesday · 11:00 AM',
      bench: "Hon'ble Justice S. K. Kaul & Justice P. S. Narasimha",
      courtRoom: 'Courtroom 3 (Supreme Court)',
      itemNo: 'Item No. 27'
    },
    timeline: [
      { date: '10 Nov 2026', title: 'Admission Board', desc: 'Notice on stay application', badge: 'Listed' },
      { date: '10 May 2024', title: 'SLP / Appeal Lodged', desc: 'Caveat served on respondent counsel' }
    ],
    documents: [
      { id: 'doc-6', title: 'Special Leave Petition', date: '10 May 2024', size: '3.4 MB', type: 'pdf' },
      { id: 'doc-7', title: 'Commercial Contract Annexures', date: '12 May 2024', size: '5.8 MB', type: 'pdf' }
    ],
    partiesList: [
      { name: 'XYZ Pvt. Ltd.', role: 'Appellant', advocate: 'Senior Adv. C. A. Sundaram' },
      { name: 'ABC Ltd.', role: 'Respondent', advocate: 'Adv. Harish Salve chambers' }
    ]
  },
  {
    id: 'case-4',
    cnr: 'MHHC045678912025',
    title: 'Priya Desai vs. Municipal Corporation',
    court: 'Bombay High Court',
    caseType: 'Public Interest Litigation',
    filingNumber: 'PIL/104/2025',
    filingDate: '08 Feb 2025',
    petitioner: 'Priya Desai',
    respondent: 'Municipal Corporation',
    statusBadge: {
      label: 'Next Hearing',
      date: '05 Nov 2026',
      type: 'hearing'
    },
    isActive: true,
    isStarred: false,
    isFollowed: false,
    clientName: 'Citizens Clean Air Collective',
    subject: 'Inadequate solid waste management and roadside open burnings.',
    acts: ['Environment Protection Act, 1986', 'Solid Waste Management Rules, 2016'],
    currentStatusText: 'Status Report Awaited',
    currentStatusDesc: 'Corporation directed to submit satellite geotagged landfill report.',
    plainLanguageSummary: 'The High Court has ordered the municipal commissioner to file a progress report on waste cleanup.',
    briefFacts: 'Public interest litigation by local residents drawing attention to uncontrolled fires and toxic smoke plumes from urban dump grounds.',
    nextHearing: {
      date: '05 November 2026',
      dayTime: 'Thursday · 11:30 AM',
      bench: "Hon'ble Chief Justice Bench",
      courtRoom: 'Courtroom 1',
      itemNo: 'Item No. 12'
    },
    timeline: [
      { date: '05 Nov 2026', title: 'Upcoming Hearing', desc: 'Review of pollution control board compliance audit', badge: 'Upcoming' },
      { date: '14 Sep 2026', title: 'Notice Issued', desc: 'Court directed emergency containment of dump fires' }
    ],
    documents: [
      { id: 'doc-8', title: 'Air Quality Lab Analysis', date: '02 Feb 2025', size: '920 KB', type: 'pdf' }
    ],
    partiesList: [
      { name: 'Priya Desai & Ors.', role: 'Petitioners', advocate: 'Adv. Saurabh Sharma' },
      { name: 'State Pollution Board', role: 'Respondent', advocate: 'Govt. Pleader' }
    ]
  },
  {
    id: 'case-5',
    cnr: 'GJHC0123456782024',
    title: 'Vikas Patel vs. State of Gujarat',
    court: 'Gujarat High Court',
    caseType: 'Criminal Revision',
    filingNumber: 'CR/552/2024',
    filingDate: '12 Jan 2024',
    petitioner: 'Vikas Patel',
    respondent: 'State of Gujarat',
    statusBadge: {
      label: 'Disposed',
      date: '18 Sep 2026',
      type: 'disposed'
    },
    isActive: false,
    isStarred: false,
    isFollowed: false,
    clientName: 'Vikas Patel',
    subject: 'Quashing of charges under Section 420/406 of IPC.',
    acts: ['Code of Criminal Procedure - Sec 397', 'Indian Penal Code - Sec 420'],
    currentStatusText: 'Disposed / Allowed',
    currentStatusDesc: 'Criminal revision application allowed. Charges quashed as settled amicably.',
    plainLanguageSummary: 'Case closed and successfully quashed. Both parties amicably resolved the matter.',
    briefFacts: 'Commercial dispute between business partners mischaracterized as criminal breach of trust. Complainant filed withdrawal memo following mediated restitution.',
    nextHearing: {
      date: 'Case Disposed',
      dayTime: 'Final Order Passed',
      bench: "Hon'ble Justice B. V. Trivedi",
      courtRoom: 'Courtroom 7',
      itemNo: 'Final'
    },
    timeline: [
      { date: '18 Sep 2026', title: 'Final Order Passed', desc: 'FIR and consequential trial proceedings quashed', badge: 'Disposed', hasOrderButton: true },
      { date: '02 Aug 2026', title: 'Settlement Terms Recorded', desc: 'Mediation agreement signed by both sides' }
    ],
    documents: [
      { id: 'doc-9', title: 'Certified Judgment & Order', date: '18 Sep 2026', size: '420 KB', type: 'pdf' },
      { id: 'doc-10', title: 'Mediation Accord Document', date: '02 Aug 2026', size: '310 KB', type: 'pdf' }
    ],
    partiesList: [
      { name: 'Vikas Patel', role: 'Applicant', advocate: 'Adv. Saurabh Sharma' },
      { name: 'State of Gujarat', role: 'Respondent', advocate: 'Public Prosecutor' }
    ]
  }
];

interface CaseTrackerProps {
  initialUserName?: string;
  initialUserRole?: string;
  defaultRole?: UserRoleType;
}

export default function CaseTracker({
  initialUserName,
  initialUserRole,
  defaultRole = 'advocate'
}: CaseTrackerProps = {}) {
  const router = useRouter();

  // Role switcher state (advocate, firm, citizen, student)
  const [currentRole, setCurrentRole] = useState<UserRoleType>(defaultRole);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [userName, setUserName] = useState(
    initialUserName || (
      defaultRole === 'student' ? 'Saurabh (Student)' :
      defaultRole === 'firm' ? 'Sharma & Associates' :
      defaultRole === 'citizen' ? 'Ramesh Kumar' : 'Adv. Saurabh'
    )
  );
  const [userRoleText, setUserRoleText] = useState(
    initialUserRole || (
      defaultRole === 'student' ? 'Student · NLU Law School' :
      defaultRole === 'firm' ? 'Law Firm · team@sharma-law.com' :
      defaultRole === 'citizen' ? 'Citizen · ramesh.kumar@example.com' : 'Advocate · saurabh@example.com'
    )
  );

  // Search & Filter state
  const [searchTab, setSearchTab] = useState<SearchTabType>('cnr');
  const [searchQuery, setSearchQuery] = useState('');
  const [caseFilter, setCaseFilter] = useState<CaseFilterType>('all');
  const [sortBy, setSortBy] = useState<'updated' | 'hearing' | 'filing'>('updated');
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);

  // Cases data state
  const [cases, setCases] = useState<CaseItem[]>(SAMPLE_CASES);
  const [selectedCaseId, setSelectedCaseId] = useState<string>(defaultRole === 'citizen' ? 'case-1' : 'case-1');
  const [detailsTab, setDetailsTab] = useState<DetailsTabType>('overview');
  const [isFactsExpanded, setIsFactsExpanded] = useState(false);
  const [copiedCNR, setCopiedCNR] = useState(false);

  // Modals state
  const [isAddCaseModalOpen, setIsAddCaseModalOpen] = useState(false);
  const [isCauseListModalOpen, setIsCauseListModalOpen] = useState(false);
  const [orderModalData, setOrderModalData] = useState<{ title: string; date: string; content: string } | null>(null);

  // Add Case Form state
  const [newCnr, setNewCnr] = useState('');
  const [newCaseTitle, setNewCaseTitle] = useState('');
  const [newCourt, setNewCourt] = useState('Bombay High Court');
  const [newCaseType, setNewCaseType] = useState('Writ Petition (Civil)');

  // Mobile view switcher tabs: 'list' | 'details' | 'timeline'
  const [mobileActiveView, setMobileActiveView] = useState<'list' | 'details' | 'timeline'>('details');

  // Load user profile & live cases on mount
  useEffect(() => {
    // Fetch live cases from backend API
    api.getCases().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setCases(res.data);
        setSelectedCaseId(res.data[0].id);
      }
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('draftmate_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (parsed.name && !initialUserName) {
            setUserName(parsed.name.startsWith('Adv.') ? parsed.name : parsed.name);
          }
          if (parsed.email && !initialUserRole) {
            setUserRoleText(`${parsed.role || 'User'} · ${parsed.email}`);
          }
        }
      } catch (e) {
        console.error('Error loading stored user profile:', e);
      }
    }
  }, [initialUserName, initialUserRole]);

  // Update role and adapt user details + route to role URL
  const handleRoleChange = (r: UserRoleType) => {
    setCurrentRole(r);
    setRoleSwitcherOpen(false);
    const roleLabels: Record<UserRoleType, { name: string; role: string }> = {
      advocate: { name: 'Adv. Saurabh', role: 'Advocate · saurabh@example.com' },
      firm: { name: 'Sharma & Associates', role: 'Law Firm · team@sharma-law.com' },
      citizen: { name: 'Ramesh Kumar', role: 'Citizen · ramesh.kumar@example.com' },
      student: { name: 'Saurabh (Student)', role: 'Student · NLU Law School' }
    };
    setUserName(roleLabels[r].name);
    setUserRoleText(roleLabels[r].role);

    // If Citizen mode is selected, default active selected case to Ramesh Kumar's case
    if (r === 'citizen') {
      setSelectedCaseId('case-1');
    }

    // Navigate to role-scoped URL
    router.push(`/${r}/case-tracker`);
  };

  // Filter cases depending on Role:
  // - Firm / Advocate: Sees all client cases across Indian courts
  // - Citizen: Sees ONLY their personal case ('Ramesh Kumar vs. State of Maharashtra')
  const visibleCases = cases.filter((c) => {
    // Role filter
    if (currentRole === 'citizen') {
      // Citizen only sees their personal case
      if (c.id !== 'case-1') return false;
    }

    // Status filter
    if (caseFilter === 'followed' && !c.isFollowed) return false;
    if (caseFilter === 'active' && !c.isActive) return false;
    if (caseFilter === 'disposed' && c.isActive) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchCNR = c.cnr.toLowerCase().includes(q);
      const matchTitle = c.title.toLowerCase().includes(q);
      const matchCourt = c.court.toLowerCase().includes(q);
      const matchClient = c.clientName?.toLowerCase().includes(q);
      if (!matchCNR && !matchTitle && !matchCourt && !matchClient) return false;
    }

    return true;
  });

  // Selected active case item
  const selectedCase = cases.find((c) => c.id === selectedCaseId) || cases[0];

  // Toggle favorite / star
  const handleToggleStar = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isStarred: !c.isStarred } : c))
    );
  };

  // Toggle follow status
  const handleToggleFollow = (id: string) => {
    setCases((prev) =>
      prev.map((c) => (c.id === id ? { ...c, isFollowed: !c.isFollowed } : c))
    );
  };

  // Copy CNR with visual toast
  const handleCopyCNR = (cnr: string) => {
    navigator.clipboard.writeText(cnr);
    setCopiedCNR(true);
    setTimeout(() => setCopiedCNR(false), 2000);
  };

  // Handle Add Case submit
  const handleAddCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCaseTitle.trim() || !newCnr.trim()) return;

    const newCase: CaseItem = {
      id: `case-${Date.now()}`,
      cnr: newCnr.toUpperCase(),
      title: newCaseTitle,
      court: newCourt,
      caseType: newCaseType,
      filingNumber: `REG/${Math.floor(1000 + Math.random() * 9000)}/2026`,
      filingDate: 'Today',
      petitioner: newCaseTitle.split('vs.')[0]?.trim() || 'Petitioner',
      respondent: newCaseTitle.split('vs.')[1]?.trim() || 'Respondent',
      statusBadge: {
        label: 'Listed',
        date: 'Upcoming',
        type: 'listed'
      },
      isActive: true,
      isStarred: true,
      isFollowed: true,
      clientName: 'New Client',
      subject: `Fresh matter registered under ${newCourt}.`,
      acts: ['Constitution of India', 'Civil Procedure Code'],
      currentStatusText: 'Admission Hearing Scheduled',
      currentStatusDesc: 'Case verified and placed on the automated e-Courts tracking radar.',
      plainLanguageSummary: 'Your new case has been added to your tracking watchlist. Next hearing dates will update automatically from official cause lists.',
      briefFacts: 'Newly added legal proceeding to watch. All cause lists and orders will be synchronized in real-time.',
      nextHearing: {
        date: 'Notice Pending',
        dayTime: 'Will update after first listing',
        bench: 'Regular Bench Assigned',
        courtRoom: 'Courtroom 2',
        itemNo: 'TBD'
      },
      timeline: [
        { date: 'Today', title: 'Added to Tracker', desc: 'Case added to watch-list with automated e-Courts sync', badge: 'Active' }
      ],
      documents: [
        { id: `doc-new`, title: 'Registration Memo', date: 'Today', size: '120 KB', type: 'pdf' }
      ],
      partiesList: [
        { name: newCaseTitle.split('vs.')[0]?.trim() || 'Petitioner', role: 'Petitioner', advocate: 'Adv. Saurabh Sharma' },
        { name: newCaseTitle.split('vs.')[1]?.trim() || 'Respondent', role: 'Respondent', advocate: 'Opposing Counsel' }
      ]
    };

    setCases([newCase, ...cases]);
    setSelectedCaseId(newCase.id);
    setIsAddCaseModalOpen(false);
    setNewCnr('');
    setNewCaseTitle('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] text-[#0F172A] relative select-text font-sans pb-16">
      
      {/* ----------------------------------------------------------------------- */}
      {/* 1. TOP HEADER NAVIGATION BAR                                            */}
      {/* ----------------------------------------------------------------------- */}
      <header className="h-16 border-b border-[#DECDB8] bg-[#FAF8F5]/90 backdrop-blur-md sticky top-0 z-30 px-3 sm:px-6 flex items-center justify-between gap-3 select-none">
        
        {/* Search Bar matching Nexora Signature */}
        <div className="flex-1 max-w-xl">
          <div className="relative">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for cases, laws, drafts, or ask AI..."
              className="w-full pl-9 pr-8 py-2 bg-white border border-[#DECDB8] rounded-full text-xs sm:text-sm text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-1 focus:ring-[#C59B58]/30 transition-all shadow-2xs"
            />
            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#94A3B8] font-mono select-none">
              /
            </span>
          </div>
        </div>

        {/* Right Header Action Items: Role Selector + Notifications + Profile */}
        <div className="flex items-center gap-2.5 sm:gap-4 select-none">
          
          {/* Universal Role Switcher Pill */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setRoleSwitcherOpen(!roleSwitcherOpen)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DECDB8] rounded-xl text-xs font-semibold text-[#1E3A8A] hover:bg-[#FAF5EB] transition-colors shadow-2xs cursor-pointer"
              title="Switch user perspective"
            >
              <Users className="w-3.5 h-3.5 text-[#C59B58]" />
              <span className="capitalize">{currentRole} View</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {roleSwitcherOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white border border-[#DECDB8] rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select User Perspective
                </div>
                {[
                  { r: 'advocate' as const, label: 'Advocate (All Client Cases)', desc: 'Full litigation tracking & filings', icon: <Briefcase className="w-4 h-4" /> },
                  { r: 'firm' as const, label: 'Law Firm (Multi-Advocate Roster)', desc: 'Track all firm & client matters', icon: <Building className="w-4 h-4" /> },
                  { r: 'citizen' as const, label: 'Citizen (Only My Personal Case)', desc: 'Simplified plain-language updates', icon: <UserCheck className="w-4 h-4" /> },
                  { r: 'student' as const, label: 'Law Student (Followed Matters)', desc: 'Moot & benchmark case tracking', icon: <GraduationCap className="w-4 h-4" /> },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => handleRoleChange(item.r)}
                    className={`w-full text-left px-3.5 py-2.5 flex items-start gap-2.5 hover:bg-[#FAF5EB] transition-colors cursor-pointer ${
                      currentRole === item.r ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                    }`}
                  >
                    <span className={`mt-0.5 ${currentRole === item.r ? 'text-[#1E3A8A]' : 'text-slate-500'}`}>
                      {item.icon}
                    </span>
                    <div>
                      <p className="font-semibold text-xs leading-tight">{item.label}</p>
                      <p className="text-[10px] text-slate-400 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Notifications Bell */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setNotificationsOpen(!notificationsOpen)}
              className="relative p-2 rounded-full hover:bg-white text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              title="Notifications"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>

            {notificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#E2D9C8] rounded-2xl shadow-xl p-4 z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D6]">
                  <span className="text-xs font-bold text-[#0F172A]">Hearing Alerts</span>
                  <span className="text-[10px] bg-[#EBF2FC] text-[#1E3A8A] font-semibold px-2 py-0.5 rounded-full">Live</span>
                </div>
                <div className="py-2.5 space-y-2 text-xs">
                  <div className="p-2 bg-[#FAF8F5] rounded-xl border border-[#F0E9DF]">
                    <p className="font-bold text-[#0F172A]">Bombay High Court — Court 4</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Ramesh Kumar vs. State listed as Item #18 for 28 Oct 2026.</p>
                  </div>
                  <div className="p-2 bg-[#FAF8F5] rounded-xl border border-[#F0E9DF]">
                    <p className="font-bold text-[#0F172A]">Order Certified Uploaded</p>
                    <p className="text-[11px] text-[#64748B] mt-0.5">Aarti Sharma interim order is now accessible.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Info */}
          <div className="flex items-center gap-2.5 pl-1 cursor-pointer">
            <div 
              className="w-8 h-8 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-xs shadow-2xs"
              title={`${userName} (${userRoleText})`}
            >
              {userName.replace('Adv. ', '').charAt(0).toUpperCase()}
            </div>
            <div className="hidden sm:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#0F172A]">{userName}</span>
              <span className="text-[10px] text-[#64748B] truncate max-w-[140px]">{userRoleText}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
          </div>

        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* 2. CASE TRACKER MAIN BODY                                               */}
      {/* ----------------------------------------------------------------------- */}
      <main className="p-3 sm:p-5 md:p-6 lg:p-7 space-y-5 max-w-[1750px] w-full mx-auto flex-1 flex flex-col">
        
        {/* ===================================================================== */}
        {/* 2A. TOP BANNER: Title, Tagline, Justinian Quote & Dome Graphic        */}
        {/* ===================================================================== */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 lg:px-8 lg:py-6 bg-[#F4ECE1] border border-[#DECDB8] rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          
          {/* Left: Title + Tagline */}
          <div className="z-10">
            {/* Title */}
            <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0F172A] tracking-tight leading-none">
              Case Tracker
            </h1>

            {/* Gold Underline Accent + Subtitle */}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="w-10 h-[2.5px] bg-[#C59B58] rounded-full inline-block" />
              <p className="text-xs sm:text-sm text-[#475569] font-normal">
                {currentRole === 'citizen'
                  ? 'Track and monitor your personal case status and upcoming court hearings.'
                  : 'Search, track and manage your cases across Indian courts.'}
              </p>
            </div>
          </div>

          {/* Right: Justinian Legal Quote & Supreme Court Dome Graphic */}
          <div className="flex items-center justify-end gap-3 sm:gap-6 self-end md:self-center z-10">
            {/* Justinian Quote */}
            <div className="text-right max-w-[280px] sm:max-w-xs md:max-w-md">
              <p className="italic font-serif text-xs sm:text-sm md:text-base text-[#334155] leading-snug">
                &ldquo;Justice is the constant and perpetual will to render to each his due.&rdquo;
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#8C7355] uppercase mt-1">
                — JUSTINIAN
              </p>
            </div>

            {/* Supreme Court Dome Graphic - Seamlessly Integrated into Box */}
            <div className="relative w-44 sm:w-56 md:w-72 lg:w-88 xl:w-[410px] h-24 sm:h-28 md:h-34 lg:h-[136px] -my-5 sm:-my-6 lg:-my-6 -mr-5 sm:-mr-6 lg:-mr-8 shrink-0 pointer-events-none select-none">
              <Image
                src="/assets/supreme-court-gardens.png"
                alt="Supreme Court Dome"
                fill
                className="object-contain object-right-bottom mix-blend-multiply"
                priority
              />
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* 2B. SEARCH STRIP (Full Width Clean Container)                         */}
        {/* ===================================================================== */}
        <div className="w-full bg-white border border-[#DECDB8] rounded-2xl p-4 sm:p-5 shadow-2xs">
          
          {/* Search Tabs */}
          <div className="flex items-center gap-3 sm:gap-6 border-b border-[#F0E9DF] pb-2 text-xs overflow-x-auto scrollbar-none">
            {[
              { id: 'cnr' as const, label: 'Search by CNR', icon: <Search className="w-3.5 h-3.5" /> },
              { id: 'party' as const, label: 'Search by Party Name', icon: <User className="w-3.5 h-3.5" /> },
              { id: 'case_num' as const, label: 'Search by Case Number', icon: <FileText className="w-3.5 h-3.5" /> },
              { id: 'advanced' as const, label: 'Advanced Search', icon: <Scale className="w-3.5 h-3.5" /> },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSearchTab(tab.id)}
                className={`flex items-center gap-1.5 pb-2 transition-all font-semibold whitespace-nowrap cursor-pointer relative ${
                  searchTab === tab.id
                    ? 'text-[#1E3A8A]'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
                {searchTab === tab.id && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A8A] rounded-full" />
                )}
              </button>
            ))}
          </div>

          {/* Search Input Bar with Button */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 mt-3.5">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  searchTab === 'cnr'
                    ? 'Enter 16-digit CNR number (e.g., MHHC010123452023)'
                    : searchTab === 'party'
                    ? 'Enter Petitioner or Respondent name (e.g. Ramesh Kumar)'
                    : searchTab === 'case_num'
                    ? 'Enter Case Number (e.g., WP/12345/2023)'
                    : 'Enter Court, Year, Judge or Act keywords...'
                }
                className="w-full pl-9 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs sm:text-sm text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:bg-white transition-all shadow-2xs"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (searchQuery.trim()) {
                  const match = cases.find((c) =>
                    c.cnr.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    c.title.toLowerCase().includes(searchQuery.toLowerCase())
                  );
                  if (match) setSelectedCaseId(match.id);
                }
              }}
              className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
            >
              <span>Search Case</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* CITIZEN MODE BANNER: ASSIGNED ADVOCATE & PLAIN LANGUAGE SUMMARY       */}
        {/* ===================================================================== */}
        {currentRole === 'citizen' && (
          <div className="bg-[#EFF6FF] border border-[#BFDBFE] rounded-2xl p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-200 shadow-2xs">
            <div className="flex items-center gap-3.5">
              <div className="w-11 h-11 rounded-full bg-[#1E3A8A] text-white flex items-center justify-center font-bold text-sm shadow-sm">
                SS
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#1E3A8A] bg-[#DBEAFE] px-2 py-0.5 rounded-md uppercase tracking-wider">
                    Assigned Legal Counsel
                  </span>
                  <span className="text-xs text-slate-500 font-medium">Sharma &amp; Associates</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-[#0F172A] mt-0.5">
                  Adv. Saurabh Sharma (High Court Advocate on Record)
                </h4>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end md:self-center">
              <a
                href="tel:+919876543210"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#CBD5E1] rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600" />
                <span>Call Chamber</span>
              </a>
              <a
                href="mailto:advocate@nexora-law.com"
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-[#1E3A8A] text-white rounded-xl text-xs font-semibold hover:bg-[#162A65] transition-colors shadow-2xs cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Send Query</span>
              </a>
            </div>
          </div>
        )}

        {/* ===================================================================== */}
        {/* MOBILE VIEW SWITCHER TABS (< 1024px)                                  */}
        {/* ===================================================================== */}
        <div className="lg:hidden flex items-center bg-white p-1 rounded-xl border border-[#DECDB8] shadow-2xs">
          {[
            { id: 'list' as const, label: `Cases (${visibleCases.length})` },
            { id: 'details' as const, label: 'Case Details' },
            { id: 'timeline' as const, label: 'Timeline & Orders' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setMobileActiveView(tab.id)}
              className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                mobileActiveView === tab.id
                  ? 'bg-[#1E3A8A] text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ===================================================================== */}
        {/* 2C. 3-COLUMN MAIN WORKSPACE (My Cases | Case Details | Timeline)      */}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          {/* ------------------------------------------------------------------- */}
          {/* COLUMN 1: MY CASES LIST (3 cols on desktop)                         */}
          {/* ------------------------------------------------------------------- */}
          <div className={`lg:col-span-3 space-y-3.5 ${
            mobileActiveView === 'list' ? 'block' : 'hidden lg:block'
          }`}>
            
            {/* Header: Title + Add Button + Sort Dropdown */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-base text-[#0F172A] tracking-tight">
                  {currentRole === 'citizen' ? 'My Case' : 'My Cases'}
                </h2>
                {currentRole !== 'citizen' && (
                  <button
                    type="button"
                    onClick={() => setIsAddCaseModalOpen(true)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-[#1E3A8A] bg-[#EBF2FC] hover:bg-[#DBEAFE] px-2 py-0.5 rounded-md border border-[#BFDBFE] transition-colors cursor-pointer"
                    title="Add new case to tracker"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                )}
              </div>

              {/* Sort By Dropdown */}
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSortDropdownOpen(!sortDropdownOpen)}
                  className="flex items-center gap-1 text-xs font-semibold text-[#64748B] hover:text-[#0F172A] cursor-pointer"
                >
                  <span>
                    {sortBy === 'updated' ? 'Last Updated' : sortBy === 'hearing' ? 'Hearing Date' : 'Filing Date'}
                  </span>
                  <ChevronDown className="w-3 h-3" />
                </button>

                {sortDropdownOpen && (
                  <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#DECDB8] rounded-xl shadow-lg py-1 z-30 text-xs">
                    {[
                      { id: 'updated' as const, label: 'Last Updated' },
                      { id: 'hearing' as const, label: 'Hearing Date' },
                      { id: 'filing' as const, label: 'Filing Date' },
                    ].map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => {
                          setSortBy(s.id);
                          setSortDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-1.5 hover:bg-[#FAF5EB] transition-colors ${
                          sortBy === s.id ? 'font-bold text-[#1E3A8A]' : 'text-slate-700'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Filter Pills: All, Followed, Active, Disposed */}
            {currentRole !== 'citizen' && (
              <div className="flex items-center gap-1.5 border-b border-[#F0E9DF] pb-2 text-xs overflow-x-auto scrollbar-none">
                {[
                  { id: 'all' as const, label: `All (${cases.length})` },
                  { id: 'followed' as const, label: `Followed (${cases.filter(c => c.isFollowed).length})` },
                  { id: 'active' as const, label: `Active (${cases.filter(c => c.isActive).length})` },
                  { id: 'disposed' as const, label: `Disposed (${cases.filter(c => !c.isActive).length})` },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setCaseFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors cursor-pointer whitespace-nowrap ${
                      caseFilter === f.id
                        ? 'bg-[#EBF2FC] text-[#1E3A8A] font-bold'
                        : 'text-slate-600 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            )}

            {/* Cases Scrollable Card List */}
            <div className="space-y-2.5 max-h-[820px] overflow-y-auto pr-0.5">
              {visibleCases.map((c) => {
                const isSelected = c.id === selectedCase.id;
                return (
                  <div
                    key={c.id}
                    onClick={() => {
                      setSelectedCaseId(c.id);
                      setMobileActiveView('details');
                    }}
                    className={`p-3.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2.5 group relative ${
                      isSelected
                        ? 'bg-white border-[#1E3A8A] shadow-md ring-1 ring-[#1E3A8A]/20'
                        : 'bg-white border-[#DECDB8] hover:border-[#1E3A8A]/50 hover:shadow-xs'
                    }`}
                  >
                    {/* CNR + Star + Chevron */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0">
                        <button
                          type="button"
                          onClick={(e) => handleToggleStar(c.id, e)}
                          className="p-0.5 text-slate-300 hover:text-amber-500 transition-colors cursor-pointer"
                          title={c.isStarred ? 'Unstar' : 'Star Case'}
                        >
                          <Star className={`w-3.5 h-3.5 ${c.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                        <span className="font-mono text-[10px] text-slate-400 truncate">
                          CNR: {c.cnr}
                        </span>
                      </div>

                      <ChevronRight className={`w-4 h-4 transition-transform flex-shrink-0 ${
                        isSelected ? 'text-[#1E3A8A] translate-x-0.5' : 'text-slate-300 group-hover:text-slate-600'
                      }`} />
                    </div>

                    {/* Case Title */}
                    <div>
                      <h3 className={`font-bold text-xs sm:text-sm leading-snug line-clamp-2 transition-colors ${
                        isSelected ? 'text-[#1E3A8A]' : 'text-[#0F172A] group-hover:text-[#1E3A8A]'
                      }`}>
                        {c.title}
                      </h3>
                      <p className="text-[11px] text-[#64748B] mt-1 truncate">
                        {c.court} · {c.caseType}
                      </p>
                    </div>

                    {/* Status Badge Box */}
                    <div className="pt-2 border-t border-[#F1EAE0] flex items-center justify-between">
                      <div className="flex items-center gap-1 text-[11px] text-slate-500">
                        {c.clientName && currentRole !== 'citizen' && (
                          <span className="text-[10px] bg-[#FAF5EB] text-[#8C7355] font-semibold px-1.5 py-0.5 rounded">
                            {c.clientName.split(' ')[0]}
                          </span>
                        )}
                      </div>

                      {/* Status pill badge with specific color schemes matching mockup */}
                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold text-right leading-tight ${
                        c.statusBadge.type === 'hearing'
                          ? 'bg-[#ECFDF5] text-[#059669]'
                          : c.statusBadge.type === 'order'
                          ? 'bg-[#FEF3C7] text-[#D97706]'
                          : c.statusBadge.type === 'listed'
                          ? 'bg-[#EFF6FF] text-[#2563EB]'
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        <div className="uppercase tracking-wider">{c.statusBadge.label}</div>
                        <div className="font-semibold text-[9px] opacity-90">{c.statusBadge.date}</div>
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

          </div>

          {/* ------------------------------------------------------------------- */}
          {/* COLUMN 2: CASE DETAILS (5 cols on desktop)                          */}
          {/* ------------------------------------------------------------------- */}
          <div className={`lg:col-span-5 bg-white border border-[#EAE3D6] rounded-2xl p-5 sm:p-6 shadow-2xs relative overflow-hidden flex flex-col justify-between min-h-[820px] ${
            mobileActiveView === 'details' ? 'block' : 'hidden lg:flex'
          }`}>
            
            {/* Background Architectural Engraving Watermark (Asset from User) */}
            <div 
              className="absolute right-0 bottom-0 w-72 h-72 pointer-events-none opacity-20 select-none overflow-hidden"
              style={{
                maskImage: 'linear-gradient(to top left, black 30%, transparent 85%)',
                WebkitMaskImage: 'linear-gradient(to top left, black 30%, transparent 85%)',
              }}
            >
              <Image
                src="/assets/case-tracker-graphic.png"
                alt="High Court Dome Architectural Engraving"
                fill
                className="object-contain object-bottom-right mix-blend-multiply"
                priority
              />
            </div>

            {/* Inner Content Stack */}
            <div className="relative z-10 space-y-5">
              
              {/* Top Action Bar: Follow, Star, Share, Menu */}
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DF]">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-[#64748B] uppercase tracking-wider">Case Details</span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Star Toggle */}
                  <button
                    type="button"
                    onClick={(e) => handleToggleStar(selectedCase.id, e)}
                    className="p-1.5 rounded-lg border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-400 hover:text-amber-500 transition-colors cursor-pointer"
                    title={selectedCase.isStarred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-3.5 h-3.5 ${selectedCase.isStarred ? 'text-amber-400 fill-amber-400' : ''}`} />
                  </button>

                  {/* Follow Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleFollow(selectedCase.id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-2xs ${
                      selectedCase.isFollowed
                        ? 'bg-[#FAF5EB] border-[#DECDB8] text-[#8C7355]'
                        : 'bg-white border-[#DECDB8] text-slate-700 hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <BookmarkCheck className={`w-3.5 h-3.5 ${selectedCase.isFollowed ? 'text-[#8C7355]' : 'text-slate-400'}`} />
                    <span>{selectedCase.isFollowed ? 'Following' : 'Follow'}</span>
                  </button>

                  {/* Share Button */}
                  <button
                    type="button"
                    onClick={() => alert(`Share link for ${selectedCase.title} copied to clipboard.`)}
                    className="p-1.5 rounded-lg border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Share Case"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                  </button>

                  {/* More Options */}
                  <button
                    type="button"
                    onClick={() => alert(`CNR: ${selectedCase.cnr}\nFiling: ${selectedCase.filingNumber}`)}
                    className="p-1.5 rounded-lg border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="More Options"
                  >
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Title & Active Badge */}
              <div>
                <div className="flex flex-wrap items-center gap-2.5">
                  <h2 className="font-bold text-xl sm:text-2xl text-[#0F172A] tracking-tight">
                    {selectedCase.title}
                  </h2>
                  <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                    selectedCase.isActive ? 'bg-[#ECFDF5] text-[#059669]' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {selectedCase.isActive ? 'Active' : 'Disposed'}
                  </span>
                </div>

                {/* CNR copyable strip */}
                <div className="flex items-center gap-2 mt-1.5 text-xs text-[#64748B]">
                  <span className="font-mono font-medium">CNR: {selectedCase.cnr}</span>
                  <button
                    type="button"
                    onClick={() => handleCopyCNR(selectedCase.cnr)}
                    className="p-1 text-slate-400 hover:text-[#1E3A8A] transition-colors cursor-pointer"
                    title="Copy CNR"
                  >
                    {copiedCNR ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  {copiedCNR && (
                    <span className="text-[10px] text-emerald-600 font-semibold animate-in fade-in">
                      Copied!
                    </span>
                  )}
                </div>
              </div>

              {/* 6 Metadata Tiles Grid Matching User Mockup */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {/* 1. Court */}
                <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-start gap-2.5">
                  <Building className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Court</p>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{selectedCase.court}</p>
                  </div>
                </div>

                {/* 2. Case Type */}
                <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-start gap-2.5">
                  <FileText className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Case Type</p>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{selectedCase.caseType}</p>
                  </div>
                </div>

                {/* 3. Filing Number */}
                <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-start gap-2.5">
                  <FileCheck className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Filing Number</p>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{selectedCase.filingNumber}</p>
                  </div>
                </div>

                {/* 4. Filing Date */}
                <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-start gap-2.5">
                  <Calendar className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Filing Date</p>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{selectedCase.filingDate}</p>
                  </div>
                </div>

                {/* 5. Petitioner */}
                <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-start gap-2.5">
                  <User className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Petitioner</p>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{selectedCase.petitioner}</p>
                  </div>
                </div>

                {/* 6. Respondent */}
                <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-start gap-2.5">
                  <Scale className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5" />
                  <div className="min-w-0">
                    <p className="text-[10px] text-slate-500 font-medium">Respondent</p>
                    <p className="text-xs font-bold text-[#0F172A] truncate mt-0.5">{selectedCase.respondent}</p>
                  </div>
                </div>
              </div>

              {/* 4 Tabs: Case Overview, Parties, Advocates, Related Cases */}
              <div className="flex items-center gap-4 border-b border-[#F0E9DF] pb-2 text-xs font-semibold overflow-x-auto scrollbar-none">
                {[
                  { id: 'overview' as const, label: 'Case Overview' },
                  { id: 'parties' as const, label: `Parties (${selectedCase.partiesList.length})` },
                  { id: 'advocates' as const, label: 'Advocates' },
                  { id: 'related' as const, label: 'Related Cases' },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDetailsTab(t.id)}
                    className={`pb-2 relative cursor-pointer whitespace-nowrap transition-colors ${
                      detailsTab === t.id
                        ? 'text-[#1E3A8A] font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{t.label}</span>
                    {detailsTab === t.id && (
                      <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#1E3A8A] rounded-full" />
                    )}
                  </button>
                ))}
              </div>

              {/* Tab 1: Case Overview Content */}
              {detailsTab === 'overview' && (
                <div className="space-y-4 text-xs">
                  
                  {/* Case Title Row */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF0DE] text-[#8C7355] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Case Title</span>
                      <p className="font-bold text-[#0F172A] text-sm mt-0.5">{selectedCase.title}</p>
                    </div>
                  </div>

                  {/* Subject Row */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                      <Scale className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Subject</span>
                      <p className="text-[#334155] leading-relaxed mt-0.5">{selectedCase.subject}</p>
                    </div>
                  </div>

                  {/* Acts / Provisions Involved */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#FAF5EB] text-[#8C7355] flex items-center justify-center shrink-0 mt-0.5">
                      <Shield className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block mb-1">
                        Acts / Provisions Involved
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedCase.acts.map((act) => (
                          <span
                            key={act}
                            className="px-2.5 py-1 bg-[#F1EAE0] text-[#0F172A] rounded-md text-[11px] font-semibold border border-[#DECDB8]"
                          >
                            {act}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Current Status Box (Light Blue Banner matching mockup) */}
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-lg bg-[#EFF6FF] text-[#1E3A8A] flex items-center justify-center shrink-0 mt-0.5">
                      <Clock className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Current Status</span>
                      <div className="mt-1 p-3 bg-[#EBF2FC] border border-[#BFDBFE] rounded-xl flex items-start gap-2.5">
                        <Clock className="w-4 h-4 text-[#1E3A8A] shrink-0 mt-0.5 animate-pulse" />
                        <div>
                          <p className="font-bold text-[#1E3A8A] text-xs">{selectedCase.currentStatusText}</p>
                          <p className="text-[11px] text-[#475569] mt-0.5">{selectedCase.currentStatusDesc}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Plain Language Guidance for Citizens */}
                  {currentRole === 'citizen' && (
                    <div className="p-3 bg-[#FAF5EB] border border-[#ECD9BC] rounded-xl flex items-start gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-[#8C7355] shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] font-bold text-[#8C7355] uppercase tracking-wider">
                          What this means in plain words:
                        </span>
                        <p className="text-[11px] text-[#334155] mt-0.5 leading-relaxed">
                          {selectedCase.plainLanguageSummary}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Brief Facts with Read More */}
                  <div className="flex items-start gap-3 pt-1">
                    <div className="w-7 h-7 rounded-lg bg-[#F5F2EA] text-[#64748B] flex items-center justify-center shrink-0 mt-0.5">
                      <FileCheck className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider block">Brief Facts</span>
                      <p className="text-[#475569] leading-relaxed mt-0.5">
                        {isFactsExpanded ? selectedCase.briefFacts : `${selectedCase.briefFacts.slice(0, 150)}...`}
                        <button
                          type="button"
                          onClick={() => setIsFactsExpanded(!isFactsExpanded)}
                          className="ml-1.5 text-[#1E3A8A] font-bold hover:underline cursor-pointer"
                        >
                          {isFactsExpanded ? 'Show less' : 'Read more'}
                        </button>
                      </p>
                    </div>
                  </div>

                </div>
              )}

              {/* Tab 2: Parties */}
              {detailsTab === 'parties' && (
                <div className="space-y-2.5 text-xs">
                  {selectedCase.partiesList.map((p, idx) => (
                    <div key={idx} className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl flex items-center justify-between gap-3">
                      <div>
                        <p className="font-bold text-[#0F172A]">{p.name}</p>
                        <p className="text-[11px] text-slate-500 mt-0.5">{p.role}</p>
                      </div>
                      <span className="text-[11px] text-[#1E3A8A] font-semibold bg-[#EBF2FC] px-2 py-0.5 rounded">
                        Advocate: {p.advocate}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Advocates */}
              {detailsTab === 'advocates' && (
                <div className="space-y-3 text-xs">
                  <div className="p-3.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl">
                    <span className="text-[10px] font-bold text-[#8C7355] uppercase tracking-wider">Advocate for Petitioner</span>
                    <p className="font-bold text-sm text-[#0F172A] mt-1">Adv. Saurabh Sharma</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Bar Enrollment: MAH/1029/2012 · High Court Roll #452</p>
                  </div>
                  <div className="p-3.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Advocate for Respondent</span>
                    <p className="font-bold text-sm text-[#0F172A] mt-1">Government Pleader / Legal Cell</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Municipal Law Chambers, Fort, Mumbai</p>
                  </div>
                </div>
              )}

              {/* Tab 4: Related Cases */}
              {detailsTab === 'related' && (
                <div className="space-y-2.5 text-xs">
                  <div className="p-3 bg-[#FAF8F5] border border-[#F0E9DF] rounded-xl">
                    <p className="font-bold text-[#0F172A]">WP/9812/2021 — Municipal Land Regularization Review</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">Bombay High Court · Connected precedence cited by petitioner</p>
                  </div>
                </div>
              )}

            </div>

          </div>

          {/* ------------------------------------------------------------------- */}
          {/* COLUMN 3: NEXT HEARING & TIMELINE (4 cols on desktop)               */}
          {/* ------------------------------------------------------------------- */}
          <div className={`lg:col-span-4 space-y-4 ${
            mobileActiveView === 'timeline' ? 'block' : 'hidden lg:block'
          }`}>
            
            {/* 1. Next Hearing Card */}
            <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center flex-shrink-0">
                    <Calendar className="w-5 h-5 stroke-[2]" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Next Hearing</span>
                    <h3 className="font-bold text-base sm:text-lg text-[#0F172A] leading-tight">
                      {selectedCase.nextHearing.date}
                    </h3>
                    <p className="text-[11px] text-slate-500 mt-0.5">{selectedCase.nextHearing.dayTime}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setIsCauseListModalOpen(true)}
                  className="px-3 py-1.5 bg-[#FAF8F5] border border-[#DECDB8] hover:bg-white text-xs font-semibold text-[#0F172A] rounded-xl transition-all shadow-2xs cursor-pointer whitespace-nowrap"
                >
                  View Cause List
                </button>
              </div>
            </div>

            {/* 2. Hearing Timeline Stepper Card */}
            <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DF]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">Hearing Timeline</h3>
                <button
                  type="button"
                  onClick={() => alert(`Showing all ${selectedCase.timeline.length} proceedings for ${selectedCase.title}`)}
                  className="text-xs text-[#1E3A8A] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Vertical Stepper */}
              <div className="mt-4 relative pl-5 space-y-4 before:content-[''] before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#E2D9C8]">
                {selectedCase.timeline.map((step, idx) => (
                  <div key={idx} className="relative group">
                    {/* Circle Bullet */}
                    <span className={`absolute -left-5 top-1 w-3 h-3 rounded-full border-2 bg-white ${
                      idx === 0 ? 'border-[#2563EB] bg-[#2563EB]' : 'border-[#8C7355]'
                    }`} />

                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 font-semibold">{step.date}</span>
                        <h4 className="font-bold text-xs text-[#0F172A] mt-0.5">{step.title}</h4>
                        <p className="text-[11px] text-[#64748B] mt-0.5 leading-relaxed">{step.desc}</p>
                      </div>

                      {step.badge && (
                        <span className="text-[9px] font-bold text-[#1E3A8A] bg-[#EFF6FF] px-2 py-0.5 rounded-full border border-[#BFDBFE] uppercase">
                          {step.badge}
                        </span>
                      )}

                      {step.hasOrderButton && (
                        <button
                          type="button"
                          onClick={() => setOrderModalData({
                            title: `Order dated ${step.date}`,
                            date: step.date,
                            content: `IN THE HIGH COURT OF JUDICATURE AT BOMBAY\nWRIT PETITION NO. 12345 OF 2023\n\nCORAM: HON'BLE JUSTICE R. S. PATIL\n\nORDER:\nIssue notice to the respondents returnable on 28.10.2026. In the meantime, status quo with respect to the possession of the subject premises shall be maintained.`
                          })}
                          className="px-2.5 py-1 bg-[#FAF5EB] hover:bg-[#F3EAD9] border border-[#ECD9BC] text-[#8C7355] text-[10px] font-bold rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                        >
                          View Order
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Recent Orders & Documents Card */}
            <div className="bg-white border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#F0E9DF]">
                <h3 className="font-bold text-xs uppercase tracking-wider text-[#0F172A]">Recent Orders &amp; Documents</h3>
                <button
                  type="button"
                  onClick={() => alert(`Opening document vault for ${selectedCase.title}`)}
                  className="text-xs text-[#1E3A8A] font-semibold hover:underline flex items-center gap-0.5 cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Document Items List */}
              <div className="mt-3 space-y-2">
                {selectedCase.documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#F0E9DF] hover:border-[#DECDB8] flex items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                        doc.type === 'pdf' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-blue-50 text-blue-600 border border-blue-100'
                      }`}>
                        {doc.type.toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="font-bold text-xs text-[#0F172A] truncate group-hover:text-[#1E3A8A]">
                          {doc.title}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          {doc.date} · {doc.size}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => setOrderModalData({
                          title: doc.title,
                          date: doc.date,
                          content: `[VERIFIED E-COURTS REPOSITORY DOCUMENT]\nDocument: ${doc.title}\nCertified Filing ID: ${selectedCase.cnr}\nDate Recorded: ${doc.date}\nFile Size: ${doc.size}\n\nContents verified against the High Court registry database.`
                        })}
                        className="px-2.5 py-1 bg-white border border-[#CBD5E1] hover:border-[#1E3A8A] text-slate-700 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer"
                      >
                        View
                      </button>
                      <button
                        type="button"
                        onClick={() => alert(`Downloading ${doc.title} (${doc.size})...`)}
                        className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                        title="Download"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </main>

      {/* ===================================================================== */}
      {/* MODAL 1: ADD CASE TO WATCHLIST                                        */}
      {/* ===================================================================== */}
      {isAddCaseModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsAddCaseModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-xl font-bold text-[#0F172A]">Track New Case</h3>
                <p className="text-xs text-[#64748B] mt-0.5">Enter case credentials to sync real-time e-Court proceedings.</p>
              </div>
            </div>

            <form onSubmit={handleAddCaseSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  16-Digit CNR Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCnr}
                  onChange={(e) => setNewCnr(e.target.value)}
                  placeholder="e.g. MHHC010123452023"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs font-mono font-semibold uppercase text-[#0F172A] focus:outline-none focus:border-[#1E3A8A] focus:bg-white"
                  autoFocus
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1">
                  Case Title / Parties <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newCaseTitle}
                  onChange={(e) => setNewCaseTitle(e.target.value)}
                  placeholder="e.g. Anand Sharma vs. State of Delhi"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs font-semibold text-[#0F172A] focus:outline-none focus:border-[#1E3A8A] focus:bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Court</label>
                  <select
                    value={newCourt}
                    onChange={(e) => setNewCourt(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="Supreme Court of India">Supreme Court of India</option>
                    <option value="Bombay High Court">Bombay High Court</option>
                    <option value="Delhi High Court">Delhi High Court</option>
                    <option value="Gujarat High Court">Gujarat High Court</option>
                    <option value="Calcutta High Court">Calcutta High Court</option>
                    <option value="Madras High Court">Madras High Court</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-[#0F172A] mb-1">Case Type</label>
                  <select
                    value={newCaseType}
                    onChange={(e) => setNewCaseType(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="Writ Petition (Civil)">Writ Petition (Civil)</option>
                    <option value="Civil Appeal">Civil Appeal</option>
                    <option value="Criminal Revision">Criminal Revision</option>
                    <option value="Special Leave Petition">Special Leave Petition</option>
                    <option value="Arbitration Petition">Arbitration Petition</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-[#F0E9DF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsAddCaseModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#DECDB8] text-slate-700 text-xs font-semibold rounded-xl hover:bg-[#FAF8F5]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs font-semibold rounded-xl shadow-sm flex items-center gap-1.5"
                >
                  <span>Add to Watchlist</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 2: CAUSE LIST PREVIEW                                           */}
      {/* ===================================================================== */}
      {isCauseListModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setIsCauseListModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <Calendar className="w-6 h-6 text-[#1E3A8A]" />
              <div>
                <h3 className="font-serif-title text-lg font-bold text-[#0F172A]">Official Cause List</h3>
                <p className="text-xs text-[#64748B]">{selectedCase.court} · {selectedCase.nextHearing.date}</p>
              </div>
            </div>

            <div className="space-y-3 text-xs bg-[#FAF8F5] p-4 rounded-2xl border border-[#DECDB8]">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Bench:</span>
                <span className="font-bold text-[#0F172A] text-right">{selectedCase.nextHearing.bench}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Courtroom:</span>
                <span className="font-bold text-[#0F172A]">{selectedCase.nextHearing.courtRoom}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Item Number:</span>
                <span className="font-bold text-[#1E3A8A] text-sm">{selectedCase.nextHearing.itemNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Scheduled Time:</span>
                <span className="font-bold text-[#059669]">{selectedCase.nextHearing.dayTime}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => setIsCauseListModalOpen(false)}
                className="px-5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl hover:bg-[#162A65]"
              >
                Close Cause List
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL 3: ORDER PREVIEW VIEWER                                         */}
      {/* ===================================================================== */}
      {orderModalData && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-xl w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-150">
            <button
              type="button"
              onClick={() => setOrderModalData(null)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <FileText className="w-6 h-6 text-[#8C7355]" />
              <div>
                <h3 className="font-serif-title text-lg font-bold text-[#0F172A]">{orderModalData.title}</h3>
                <p className="text-xs text-[#64748B]">Date: {orderModalData.date} · Certified Record</p>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl font-mono text-xs text-slate-800 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto select-text">
              {orderModalData.content}
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className="text-[11px] text-slate-400 font-sans">Digitally signed &amp; verified by High Court Registrar</span>
              <button
                type="button"
                onClick={() => setOrderModalData(null)}
                className="px-5 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl hover:bg-[#162A65]"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
