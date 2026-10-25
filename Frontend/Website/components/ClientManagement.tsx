'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronRight,
  Filter,
  Plus,
  Users,
  Folder,
  Calendar,
  FileText,
  AlertCircle,
  Phone,
  Mail,
  MapPin,
  Pencil,
  MoreHorizontal,
  X,
  Clock,
  Download,
  MessageSquare,
  User
} from 'lucide-react';

export interface MatterItem {
  id: string;
  title: string;
  category: string;
  court: string;
  status: 'Active' | 'Drafting' | 'In Review' | 'Closed';
  nextHearing?: string;
  courtroom?: string;
  judge?: string;
}

export interface DocumentItem {
  id: string;
  name: string;
  category: string;
  type: 'PDF' | 'DOCX' | 'IMAGE';
  size: string;
  date: string;
  status: 'Verified' | 'Draft' | 'Approved' | 'Filed' | 'In Review';
}

export interface HearingItem {
  id: string;
  date: string;
  time: string;
  title: string;
  matter: string;
  court: string;
  courtroom: string;
  status: 'Scheduled' | 'Upcoming' | 'Completed';
}

export interface NoteItem {
  id: string;
  date: string;
  author: string;
  text: string;
}

export interface CommunicationItem {
  id: string;
  date: string;
  time: string;
  type: 'Phone Call' | 'Email' | 'In-Person Meeting' | 'WhatsApp';
  summary: string;
  duration?: string;
}

export interface ClientData {
  id: string;
  name: string;
  type: 'Individual' | 'Corporate';
  initials: string;
  phone: string;
  email: string;
  address: string;
  clientSince: string;
  preferredLanguage: string;
  notes: string;
  lastActivity: string;
  matters: MatterItem[];
  documents: DocumentItem[];
  hearings: HearingItem[];
  notesList: NoteItem[];
  communications: CommunicationItem[];
}

const INITIAL_CLIENTS: ClientData[] = [
  {
    id: 'client-1',
    name: 'Rohan Sharma',
    type: 'Individual',
    initials: 'RS',
    phone: '+91 98765 43210',
    email: 'rohan.sharma@example.com',
    address: 'Bandra West, Mumbai, Maharashtra',
    clientSince: '14 Aug 2025',
    preferredLanguage: 'English',
    notes: 'Prefers email communication.',
    lastActivity: '24 Oct 2026',
    matters: [
      {
        id: 'm-1',
        title: 'Sharma vs Mehta',
        category: 'Civil Suit',
        court: 'Bombay High Court',
        status: 'Active',
        nextHearing: '28 Oct 2026, 10:30 AM',
        courtroom: 'Courtroom No. 3',
        judge: 'Hon\'ble Justice K. R. Shinde'
      },
      {
        id: 'm-2',
        title: 'Property Dispute',
        category: 'Civil Matter',
        court: 'City Civil Court',
        status: 'Active',
        nextHearing: '14 Nov 2026, 11:00 AM',
        courtroom: 'Courtroom No. 12',
        judge: 'Hon\'ble Judge V. Deshmukh'
      },
      {
        id: 'm-3',
        title: 'Will & Succession',
        category: 'Advisory',
        court: 'Private',
        status: 'Drafting',
        nextHearing: 'Draft in Review'
      }
    ],
    documents: [
      { id: 'd-1', name: 'Vakalatnama_Signed_RohanSharma.pdf', category: 'Signed Vakalatnama', type: 'PDF', size: '2.4 MB', date: '15 Aug 2025', status: 'Verified' },
      { id: 'd-2', name: 'Plaint_Sharma_vs_Mehta_v3.docx', category: 'Civil Plaint Petition', type: 'DOCX', size: '4.8 MB', date: '22 Oct 2026', status: 'Draft' },
      { id: 'd-3', name: 'Sale_Deed_Bandra_Property_1998.pdf', category: 'Title Document / Evidence', type: 'PDF', size: '12.1 MB', date: '18 Aug 2025', status: 'Approved' },
      { id: 'd-4', name: 'Affidavit_in_Reply_Notice.pdf', category: 'Affidavit', type: 'PDF', size: '1.8 MB', date: '10 Oct 2026', status: 'Filed' },
      { id: 'd-5', name: 'Draft_Will_Testament_v2.docx', category: 'Will & Testament', type: 'DOCX', size: '1.2 MB', date: '24 Oct 2026', status: 'In Review' },
      { id: 'd-6', name: 'Encumbrance_Certificate_2024.pdf', category: 'Sub-Registrar Certificate', type: 'PDF', size: '3.1 MB', date: '02 Sep 2025', status: 'Verified' }
    ],
    hearings: [
      { id: 'h-1', date: '28 Oct 2026', time: '10:30 AM', title: 'Interim Injunction Hearing', matter: 'Sharma vs Mehta', court: 'Bombay High Court', courtroom: 'Courtroom No. 3', status: 'Scheduled' },
      { id: 'h-2', date: '14 Nov 2026', time: '11:00 AM', title: 'Cross-Examination of Witness #1', matter: 'Property Dispute', court: 'City Civil Court', courtroom: 'Courtroom No. 12', status: 'Upcoming' },
      { id: 'h-3', date: '12 Sep 2026', time: '02:30 PM', title: 'Framing of Issues', matter: 'Sharma vs Mehta', court: 'Bombay High Court', courtroom: 'Courtroom No. 3', status: 'Completed' },
      { id: 'h-4', date: '25 Jul 2026', time: '11:15 AM', title: 'Admission & Denial of Documents', matter: 'Property Dispute', court: 'City Civil Court', courtroom: 'Courtroom No. 5', status: 'Completed' },
      { id: 'h-5', date: '19 May 2026', time: '10:45 AM', title: 'Preliminary Hearing & Notice Return', matter: 'Sharma vs Mehta', court: 'Bombay High Court', courtroom: 'Courtroom No. 3', status: 'Completed' }
    ],
    notesList: [
      { id: 'n-1', date: '24 Oct 2026, 04:15 PM', author: 'Adv. Saurabh', text: 'Reviewed rejoinder draft with Rohan. Client confirmed receipt of certified bank statements for property transaction.' },
      { id: 'n-2', date: '18 Oct 2026, 11:30 AM', author: 'Adv. Saurabh', text: 'Advised client on succession planning options. Draft will version 2 prepared for testamentary distribution of Bandra duplex.' },
      { id: 'n-3', date: '02 Oct 2026, 03:00 PM', author: 'Legal Associate', text: 'Court notice served on respondent Mehta via speed post and email acknowledgment recorded in registry.' },
      { id: 'n-4', date: '14 Aug 2025, 05:00 PM', author: 'Adv. Saurabh', text: 'Initial onboarding and retainer fee confirmation. Vakalatnama signed and filed.' }
    ],
    communications: [
      { id: 'c-1', date: '24 Oct 2026', time: '03:45 PM', type: 'Phone Call', summary: 'Call with client regarding rejoinder filing deadline and witness testimony.', duration: '18 mins' },
      { id: 'c-2', date: '22 Oct 2026', time: '10:15 AM', type: 'Email', summary: 'Sent drafted rejoinder petition for client review and approval.', duration: 'Sent' },
      { id: 'c-3', date: '15 Oct 2026', time: '02:00 PM', type: 'In-Person Meeting', summary: 'Office consultation discussing settlement offer from respondent Mehta. Client rejected offer.', duration: '45 mins' },
      { id: 'c-4', date: '08 Oct 2026', time: '11:00 AM', type: 'WhatsApp', summary: 'Shared court order copy of previous hearing date with client.', duration: 'Delivered' }
    ]
  },
  {
    id: 'client-2',
    name: 'Priya Kulkarni',
    type: 'Individual',
    initials: 'PK',
    phone: '+91 97654 32109',
    email: 'priya.kulkarni@example.com',
    address: 'Shivaji Nagar, Pune, Maharashtra',
    clientSince: '20 Jan 2026',
    preferredLanguage: 'Marathi / English',
    notes: 'Prefers evening consultations after 5 PM.',
    lastActivity: '22 Oct 2026',
    matters: [
      { id: 'm-4', title: 'Kulkarni vs State of Maharashtra', category: 'Writ Petition', court: 'Bombay High Court', status: 'Active', nextHearing: '04 Nov 2026, 02:00 PM', courtroom: 'Courtroom No. 7' },
      { id: 'm-5', title: 'Consumer Forum Redressal', category: 'Consumer Dispute', court: 'District Consumer Commission', status: 'Active', nextHearing: '19 Nov 2026, 11:30 AM', courtroom: 'Bench 2' }
    ],
    documents: [
      { id: 'd-7', name: 'Writ_Petition_Kulkarni.pdf', category: 'Writ Petition', type: 'PDF', size: '5.2 MB', date: '22 Jan 2026', status: 'Filed' },
      { id: 'd-8', name: 'Consumer_Complaint_Annexures.pdf', category: 'Consumer Complaint', type: 'PDF', size: '3.7 MB', date: '15 Feb 2026', status: 'Verified' }
    ],
    hearings: [
      { id: 'h-6', date: '04 Nov 2026', time: '02:00 PM', title: 'Writ Hearing on Maintainability', matter: 'Kulkarni vs State', court: 'Bombay High Court', courtroom: 'Courtroom No. 7', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-5', date: '22 Oct 2026, 05:30 PM', author: 'Adv. Saurabh', text: 'Detailed phone consultation regarding state government affidavit in reply.' }
    ],
    communications: [
      { id: 'c-5', date: '22 Oct 2026', time: '05:30 PM', type: 'Phone Call', summary: 'Discussion regarding respondent submission delay.', duration: '25 mins' }
    ]
  },
  {
    id: 'client-3',
    name: 'Madhav Traders Pvt. Ltd.',
    type: 'Corporate',
    initials: 'MT',
    phone: '+91 22 2847 9900',
    email: 'legal@madhavtraders.in',
    address: 'Nariman Point, Mumbai, Maharashtra',
    clientSince: '10 Nov 2024',
    preferredLanguage: 'English',
    notes: 'Corporate retainer account. Director: Mr. R. K. Singhania.',
    lastActivity: '20 Oct 2026',
    matters: [
      { id: 'm-6', title: 'Madhav Traders vs Apex Logistics', category: 'Commercial Arbitration', court: 'Arbitral Tribunal', status: 'Active', nextHearing: '30 Oct 2026, 03:00 PM', courtroom: 'Chamber 4' },
      { id: 'm-7', title: 'GST Tribunal Appeal 2026', category: 'Tax Appeal', court: 'CESTAT Mumbai', status: 'Active', nextHearing: '08 Dec 2026, 10:30 AM', courtroom: 'Court 1' },
      { id: 'm-8', title: 'Vendor Supply Agreement Review', category: 'Corporate Advisory', court: 'Private', status: 'Drafting' },
      { id: 'm-9', title: 'Trademark Opposition (Class 35)', category: 'IPR Opposition', court: 'Trademark Registry', status: 'Active', nextHearing: '12 Jan 2027, 02:00 PM' },
      { id: 'm-10', title: 'Labour Compliance Review', category: 'Regulatory Audit', court: 'Internal', status: 'Closed' }
    ],
    documents: [
      { id: 'd-9', name: 'Board_Resolution_Retainer_2024.pdf', category: 'Board Resolution', type: 'PDF', size: '1.1 MB', date: '10 Nov 2024', status: 'Verified' },
      { id: 'd-10', name: 'Statement_of_Claim_Apex_Logistics.pdf', category: 'Arbitration Claim', type: 'PDF', size: '8.4 MB', date: '12 Sep 2026', status: 'Filed' }
    ],
    hearings: [
      { id: 'h-7', date: '30 Oct 2026', time: '03:00 PM', title: 'Arbitration Preliminary Meeting', matter: 'Madhav Traders vs Apex', court: 'Arbitral Tribunal', courtroom: 'Chamber 4', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-6', date: '20 Oct 2026, 02:00 PM', author: 'Partner', text: 'Reviewed quarterly retainer deliverables and arbitration claims bundle.' }
    ],
    communications: [
      { id: 'c-6', date: '20 Oct 2026', time: '02:00 PM', type: 'In-Person Meeting', summary: 'Quarterly review with CFO and Legal Counsel.', duration: '60 mins' }
    ]
  },
  {
    id: 'client-4',
    name: 'Anita Singh',
    type: 'Individual',
    initials: 'AS',
    phone: '+91 98201 11223',
    email: 'anita.singh@example.com',
    address: 'Koregaon Park, Pune',
    clientSince: '05 Mar 2026',
    preferredLanguage: 'Hindi / English',
    notes: 'Urgent maintenance and child custody advisory.',
    lastActivity: '18 Oct 2026',
    matters: [
      { id: 'm-11', title: 'Singh Custody & Maintenance', category: 'Family Dispute', court: 'Family Court Pune', status: 'Active', nextHearing: '06 Nov 2026, 11:00 AM', courtroom: 'Courtroom 2' }
    ],
    documents: [
      { id: 'd-11', name: 'Maintenance_Petition_Anita.pdf', category: 'Petition', type: 'PDF', size: '2.9 MB', date: '10 Mar 2026', status: 'Filed' }
    ],
    hearings: [
      { id: 'h-8', date: '06 Nov 2026', time: '11:00 AM', title: 'Interim Maintenance Argument', matter: 'Singh Custody', court: 'Family Court Pune', courtroom: 'Courtroom 2', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-7', date: '18 Oct 2026, 11:15 AM', author: 'Adv. Saurabh', text: 'Drafted counter reply to respondent financial disclosure affidavit.' }
    ],
    communications: [
      { id: 'c-7', date: '18 Oct 2026', time: '11:00 AM', type: 'Phone Call', summary: 'Explained interim maintenance calculation norms to client.', duration: '15 mins' }
    ]
  },
  {
    id: 'client-5',
    name: 'Desai & Khanna LLP',
    type: 'Corporate',
    initials: 'DK',
    phone: '+91 22 4001 8800',
    email: 'partners@desaikhanna.com',
    address: 'BKC, Mumbai, Maharashtra',
    clientSince: '12 Feb 2025',
    preferredLanguage: 'English',
    notes: 'Institutional referral client. Cross-border mergers advisory.',
    lastActivity: '15 Oct 2026',
    matters: [
      { id: 'm-12', title: 'Cross-Border Asset Transfer', category: 'Corporate M&A', court: 'NCLT Mumbai', status: 'Active', nextHearing: '18 Nov 2026, 11:00 AM', courtroom: 'Court 1' },
      { id: 'm-13', title: 'Antitrust Due Diligence Review', category: 'CCI Advisory', court: 'CCI New Delhi', status: 'Active' },
      { id: 'm-14', title: 'Employment Restructuring Advisory', category: 'Labour Laws', court: 'Private', status: 'Closed' },
      { id: 'm-15', title: 'Shareholders Agreement Drafting', category: 'Corporate Agreements', court: 'Private', status: 'Drafting' }
    ],
    documents: [
      { id: 'd-12', name: 'Merger_Scheme_NCLT.pdf', category: 'Scheme Petition', type: 'PDF', size: '14.2 MB', date: '15 Sep 2026', status: 'Filed' }
    ],
    hearings: [
      { id: 'h-9', date: '18 Nov 2026', time: '11:00 AM', title: 'Scheme Approval Hearing', matter: 'Asset Transfer', court: 'NCLT Mumbai', courtroom: 'Court 1', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-8', date: '15 Oct 2026, 04:00 PM', author: 'Managing Partner', text: 'Regulatory clearance confirmation received from RoC.' }
    ],
    communications: [
      { id: 'c-8', date: '15 Oct 2026', time: '03:30 PM', type: 'Email', summary: 'Shared RoC report with Desai & Khanna partner team.', duration: 'Sent' }
    ]
  },
  {
    id: 'client-6',
    name: 'Vikram Patil',
    type: 'Individual',
    initials: 'VP',
    phone: '+91 99300 44556',
    email: 'vikram.patil@example.com',
    address: 'Thane West, Maharashtra',
    clientSince: '18 Sep 2025',
    preferredLanguage: 'Marathi',
    notes: 'Tenancy eviction defense.',
    lastActivity: '12 Oct 2026',
    matters: [
      { id: 'm-16', title: 'Patil Tenancy Eviction Defense', category: 'Tenancy Dispute', court: 'Small Causes Court', status: 'Active', nextHearing: '21 Nov 2026, 12:00 PM', courtroom: 'Room 8' },
      { id: 'm-17', title: 'Municipality Demolition Notice Stay', category: 'Municipal Law', court: 'Thane Civil Court', status: 'Active' }
    ],
    documents: [
      { id: 'd-13', name: 'Rent_Receipts_1995_2024.pdf', category: 'Evidence Bundle', type: 'PDF', size: '18.0 MB', date: '20 Sep 2025', status: 'Verified' }
    ],
    hearings: [
      { id: 'h-10', date: '21 Nov 2026', time: '12:00 PM', title: 'Application for Stay Hearing', matter: 'Patil Eviction', court: 'Small Causes Court', courtroom: 'Room 8', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-9', date: '12 Oct 2026, 01:00 PM', author: 'Adv. Saurabh', text: 'Obtained certified extract of municipal property tax records.' }
    ],
    communications: [
      { id: 'c-9', date: '12 Oct 2026', time: '12:45 PM', type: 'Phone Call', summary: 'Briefed client on stay petition readiness.', duration: '10 mins' }
    ]
  },
  {
    id: 'client-7',
    name: 'Shree Ganesh Constructions',
    type: 'Corporate',
    initials: 'SG',
    phone: '+91 22 2567 1234',
    email: 'admin@sgconstructions.in',
    address: 'Vashi, Navi Mumbai',
    clientSince: '02 Jan 2025',
    preferredLanguage: 'English',
    notes: 'RERA disputes and subcontractor arbitrations.',
    lastActivity: '10 Oct 2026',
    matters: [
      { id: 'm-18', title: 'MahaRERA Project Extension Hearing', category: 'RERA Regulatory', court: 'MahaRERA Head Office', status: 'Active', nextHearing: '02 Dec 2026, 03:30 PM', courtroom: 'Bench 1' },
      { id: 'm-19', title: 'Subcontractor Payment Recovery', category: 'Recovery Suit', court: 'Thane District Court', status: 'Active' },
      { id: 'm-20', title: 'Standard Allotment Agreement 2026', category: 'Contract Drafting', court: 'Private', status: 'Drafting' }
    ],
    documents: [
      { id: 'd-14', name: 'MahaRERA_Registration_Cert.pdf', category: 'Statutory License', type: 'PDF', size: '3.4 MB', date: '04 Jan 2025', status: 'Verified' }
    ],
    hearings: [
      { id: 'h-11', date: '02 Dec 2026', time: '03:30 PM', title: 'Extension Hearing on Completion Phase', matter: 'MahaRERA Project', court: 'MahaRERA', courtroom: 'Bench 1', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-10', date: '10 Oct 2026, 05:00 PM', author: 'Partner', text: 'Finalized architect progress report submission.' }
    ],
    communications: [
      { id: 'c-10', date: '10 Oct 2026', time: '04:15 PM', type: 'Email', summary: 'Sent architect compliance schedule to managing director.', duration: 'Sent' }
    ]
  },
  {
    id: 'client-8',
    name: 'Neha Lodha',
    type: 'Individual',
    initials: 'NL',
    phone: '+91 98190 77889',
    email: 'neha.lodha@example.com',
    address: 'Andheri East, Mumbai',
    clientSince: '15 Jun 2026',
    preferredLanguage: 'English',
    notes: 'Cyber defamation and online harassment complaint.',
    lastActivity: '08 Oct 2026',
    matters: [
      { id: 'm-21', title: 'Lodha Cyber Defamation Complaint', category: 'Cyber Crime / IT Act', court: 'Cyber Crime Cell Mumbai', status: 'Active', nextHearing: '11 Nov 2026, 11:30 AM', courtroom: 'Cyber Police Station BKC' }
    ],
    documents: [
      { id: 'd-15', name: 'Digital_Forensics_Hash_Report.pdf', category: 'Electronic Evidence', type: 'PDF', size: '6.7 MB', date: '20 Jun 2026', status: 'Approved' }
    ],
    hearings: [
      { id: 'h-12', date: '11 Nov 2026', time: '11:30 AM', title: 'Statement Recording with Investigating Officer', matter: 'Lodha Cyber Defamation', court: 'Cyber Police Cell BKC', courtroom: 'Investigation Wing', status: 'Scheduled' }
    ],
    notesList: [
      { id: 'n-11', date: '08 Oct 2026, 10:00 AM', author: 'Adv. Saurabh', text: 'Preserved metadata logs under Section 65B Indian Evidence Act certificate.' }
    ],
    communications: [
      { id: 'c-11', date: '08 Oct 2026', time: '09:45 AM', type: 'WhatsApp', summary: 'Confirmed appointment with Cyber Cell investigating officer.', duration: 'Delivered' }
    ]
  }
];

interface ClientManagementProps {
  role?: 'advocate' | 'firm';
  initialUserName?: string;
  initialUserRole?: string;
  dashboardHref?: string;
}

export default function ClientManagement({
  role = 'advocate',
  initialUserName,
  initialUserRole,
  dashboardHref = '/advocate'
}: ClientManagementProps) {
  // User profile
  const userName = initialUserName || (role === 'firm' ? 'Sharma & Associates' : 'Adv. Saurabh');
  const userRole = initialUserRole || (role === 'firm' ? 'Law Firm · team@sharma-law.com' : 'Advocate · saurabh@example.com');
  const userInitial = userName.replace('Adv. ', '').charAt(0) || 'S';

  // Client list state
  const [clients, setClients] = useState<ClientData[]>(INITIAL_CLIENTS);
  const [selectedClientId, setSelectedClientId] = useState<string>('client-1');

  // Fetch live clients from backend
  useEffect(() => {
    api.getClients().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setClients(res.data);
        setSelectedClientId(res.data[0].id);
      }
    }).catch(() => {});
  }, []);

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'All' | 'Individual' | 'Corporate'>('All');
  const [isFilterDropdownOpen, setIsFilterDropdownOpen] = useState(false);

  // Active Tab
  type TabType = 'overview' | 'matters' | 'documents' | 'hearings' | 'notes' | 'communication';
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Modals state
  const [isAddClientModalOpen, setIsAddClientModalOpen] = useState(false);
  const [isEditClientModalOpen, setIsEditClientModalOpen] = useState(false);
  const [isAddMatterModalOpen, setIsAddMatterModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Quick Note text input
  const [quickNoteText, setQuickNoteText] = useState('');

  // Selected client
  const selectedClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0];
  }, [clients, selectedClientId]);

  // Filtered clients list
  const filteredClients = useMemo(() => {
    return clients.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.matters.some((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesType =
        typeFilter === 'All' ? true : c.type.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesType;
    });
  }, [clients, searchQuery, typeFilter]);

  // Aggregate Stats
  const totalClientsCount = clients.length;
  const activeMattersCount = clients.reduce(
    (acc, c) => acc + c.matters.filter((m) => m.status === 'Active').length,
    0
  );
  const upcomingHearingsCount = clients.reduce(
    (acc, c) => acc + c.hearings.filter((h) => h.status !== 'Completed').length,
    0
  );
  const pendingDocsCount = clients.reduce(
    (acc, c) => acc + c.documents.filter((d) => d.status === 'Draft' || d.status === 'In Review').length,
    0
  );

  // Add Client Form state
  const [newClientName, setNewClientName] = useState('');
  const [newClientType, setNewClientType] = useState<'Individual' | 'Corporate'>('Individual');
  const [newClientPhone, setNewClientPhone] = useState('');
  const [newClientEmail, setNewClientEmail] = useState('');
  const [newClientAddress, setNewClientAddress] = useState('');
  const [newClientLanguage, setNewClientLanguage] = useState('English');
  const [newClientNotes, setNewClientNotes] = useState('');

  // Edit Client Form state
  const [editClientName, setEditClientName] = useState('');
  const [editClientType, setEditClientType] = useState<'Individual' | 'Corporate'>('Individual');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editClientEmail, setEditClientEmail] = useState('');
  const [editClientAddress, setEditClientAddress] = useState('');
  const [editClientLanguage, setEditClientLanguage] = useState('English');
  const [editClientNotes, setEditClientNotes] = useState('');

  // Matter Form state
  const [newMatterTitle, setNewMatterTitle] = useState('');
  const [newMatterCategory, setNewMatterCategory] = useState('Civil Suit');
  const [newMatterCourt, setNewMatterCourt] = useState('Bombay High Court');
  const [newMatterStatus, setNewMatterStatus] = useState<'Active' | 'Drafting'>('Active');
  const [newMatterHearing, setNewMatterHearing] = useState('');

  const handleOpenEditModal = () => {
    if (!selectedClient) return;
    setEditClientName(selectedClient.name);
    setEditClientType(selectedClient.type);
    setEditClientPhone(selectedClient.phone);
    setEditClientEmail(selectedClient.email);
    setEditClientAddress(selectedClient.address);
    setEditClientLanguage(selectedClient.preferredLanguage);
    setEditClientNotes(selectedClient.notes);
    setIsEditClientModalOpen(true);
  };

  const handleSaveEditClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClient.id
          ? {
              ...c,
              name: editClientName || c.name,
              type: editClientType,
              phone: editClientPhone || c.phone,
              email: editClientEmail || c.email,
              address: editClientAddress || c.address,
              preferredLanguage: editClientLanguage || c.preferredLanguage,
              notes: editClientNotes || c.notes,
              lastActivity: 'Just now'
            }
          : c
      )
    );
    setIsEditClientModalOpen(false);
  };

  const handleCreateClient = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClientName.trim()) return;

    const initials = newClientName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((n) => n[0].toUpperCase())
      .join('');

    const newClient: ClientData = {
      id: `client-${Date.now()}`,
      name: newClientName,
      type: newClientType,
      initials: initials || 'CL',
      phone: newClientPhone || '+91 90000 00000',
      email: newClientEmail || `${newClientName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      address: newClientAddress || 'Mumbai, Maharashtra',
      clientSince: 'Today',
      preferredLanguage: newClientLanguage,
      notes: newClientNotes || 'Newly onboarded client.',
      lastActivity: 'Today',
      matters: [],
      documents: [],
      hearings: [],
      notesList: [
        {
          id: `note-${Date.now()}`,
          date: 'Today',
          author: userName,
          text: 'Client file opened and registered in Nexora Client Management.'
        }
      ],
      communications: [
        {
          id: `comm-${Date.now()}`,
          date: 'Today',
          time: 'Just now',
          type: 'In-Person Meeting',
          summary: 'Onboarding consultation and case intake.'
        }
      ]
    };

    setClients([newClient, ...clients]);
    setSelectedClientId(newClient.id);
    setIsAddClientModalOpen(false);

    // Reset fields
    setNewClientName('');
    setNewClientPhone('');
    setNewClientEmail('');
    setNewClientAddress('');
    setNewClientNotes('');
  };

  const handleCreateMatter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMatterTitle.trim() || !selectedClient) return;

    const newMatter: MatterItem = {
      id: `matter-${Date.now()}`,
      title: newMatterTitle,
      category: newMatterCategory,
      court: newMatterCourt,
      status: newMatterStatus,
      nextHearing: newMatterHearing || 'To be scheduled'
    };

    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClient.id
          ? {
              ...c,
              matters: [newMatter, ...c.matters],
              lastActivity: 'Today'
            }
          : c
      )
    );

    setIsAddMatterModalOpen(false);
    setNewMatterTitle('');
    setNewMatterHearing('');
  };

  const handleAddQuickNote = () => {
    if (!quickNoteText.trim() || !selectedClient) return;
    const newNote: NoteItem = {
      id: `note-${Date.now()}`,
      date: 'Just now',
      author: userName,
      text: quickNoteText.trim()
    };

    setClients((prev) =>
      prev.map((c) =>
        c.id === selectedClient.id
          ? {
              ...c,
              notesList: [newNote, ...c.notesList],
              lastActivity: 'Just now'
            }
          : c
      )
    );
    setQuickNoteText('');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] text-[#0F172A] relative">
      {/* ------------------------------------------------------------------- */}
      {/* 1. TOP BAR: Breadcrumb, Global Search, Notifications, Profile       */}
      {/* ------------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D6] px-5 sm:px-8 py-3 flex items-center justify-between gap-4">
        {/* Global Search Pill Input */}
        <div className="flex-1 max-w-xl relative">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#94A3B8] absolute left-3.5 pointer-events-none" />
            <input
              type="text"
              placeholder="Search for cases, laws, drafts, or ask AI..."
              className="w-full pl-10 pr-4 py-2 bg-white border border-[#EAE3D6] rounded-full text-xs sm:text-sm text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition shadow-2xs"
            />
          </div>
        </div>

        {/* Right Header: Notification Bell & Profile Dropdown */}
        <div className="flex items-center gap-4 flex-shrink-0">
          {/* Notifications Button */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative p-2 rounded-full hover:bg-[#EFE8DC] text-[#64748B] hover:text-[#0F172A] transition"
              aria-label="Notifications"
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-[#FAF8F5]" />
            </button>

            {/* Notifications Dropdown Drawer */}
            {isNotificationsOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-[#EAE3D6] rounded-2xl shadow-xl p-4 z-50 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-[#EAE3D6]">
                  <span className="font-bold text-sm text-[#0F172A]">Notifications</span>
                  <span className="text-[10px] text-[#2563EB] font-semibold cursor-pointer">Mark all as read</span>
                </div>
                <div className="divide-y divide-[#EAE3D6] max-h-64 overflow-y-auto mt-2">
                  <div className="py-2.5">
                    <p className="font-semibold text-[#0F172A]">Upcoming Hearing Tomorrow</p>
                    <p className="text-[#64748B] mt-0.5">Sharma vs Mehta at Bombay High Court, Courtroom No. 3.</p>
                    <span className="text-[10px] text-[#94A3B8] mt-1 block">10 mins ago</span>
                  </div>
                  <div className="py-2.5">
                    <p className="font-semibold text-[#0F172A]">Draft Document Ready</p>
                    <p className="text-[#64748B] mt-0.5">Will & Succession draft review pending client feedback.</p>
                    <span className="text-[10px] text-[#94A3B8] mt-1 block">2 hours ago</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile Capsule */}
          <Link
            href={dashboardHref}
            className="flex items-center gap-3 pl-2 pr-1 py-1 rounded-full hover:bg-[#EFE8DC]/60 transition group cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white font-bold text-sm flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition">
              {userInitial}
            </div>
            <div className="hidden md:flex flex-col text-left leading-tight">
              <span className="text-xs font-bold text-[#0F172A] group-hover:text-[#1E3A8A]">
                {userName}
              </span>
              <span className="text-[10px] text-[#64748B] truncate max-w-[170px]">
                {userRole}
              </span>
            </div>
            <ChevronDown className="w-4 h-4 text-[#94A3B8] hidden md:block" />
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------- */}
      {/* 2. PAGE HEADER: Title, Breadcrumbs, Bar Council Quote & Artwork     */}
      {/* ------------------------------------------------------------------- */}
      <div className="px-5 sm:px-8 pt-6 pb-4">
        {/* Breadcrumb */}
        <div className="flex items-center gap-1.5 text-xs text-[#8C7355] font-medium mb-1">
          <Link href={dashboardHref} className="hover:underline">Workspace</Link>
          <span>/</span>
          <span className="text-[#0F172A] font-semibold">Client Management</span>
        </div>

        {/* Title + Quote Banner with Integrated Supreme Court Dome Artwork */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 lg:px-8 lg:py-6 bg-[#F4ECE1] border border-[#DECDB8] rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          
          {/* Left: Title + Tagline */}
          <div className="z-10 max-w-xl">
            <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0F172A] tracking-tight leading-none">
              Client Management
            </h1>
            <div className="flex items-center gap-3 mt-2.5">
              <span className="w-10 h-[2.5px] bg-[#C59B58] rounded-full inline-block" />
              <p className="text-xs sm:text-sm text-[#475569] font-normal">
                Manage your clients, matters, documents and communications in one place.
              </p>
            </div>
          </div>

          {/* Right: Bar Council Quote & Supreme Court Dome Illustration */}
          <div className="flex items-center justify-end gap-3 sm:gap-6 self-end md:self-center z-10">
            {/* Quote */}
            <div className="text-right max-w-[280px] sm:max-w-xs md:max-w-md">
              <p className="italic font-serif text-xs sm:text-sm md:text-base text-[#334155] leading-snug">
                &ldquo;A lawyer&apos;s first duty is to his client.&rdquo;
              </p>
              <p className="text-[10px] sm:text-[11px] font-bold tracking-[0.2em] text-[#8C7355] uppercase mt-1">
                — BAR COUNCIL OF INDIA
              </p>
            </div>

            {/* Supreme Court Dome Graphic - Seamlessly Integrated as Part of the Box */}
            <div className="relative w-44 sm:w-56 md:w-72 lg:w-88 xl:w-[410px] h-24 sm:h-28 md:h-34 lg:h-[136px] -my-5 sm:-my-6 lg:-my-6 -mr-5 sm:-mr-6 lg:-mr-8 shrink-0 pointer-events-none select-none">
              <Image
                src="/assets/supreme-court-gardens.png"
                alt="Supreme Court of India"
                fill
                className="object-contain object-right-bottom mix-blend-multiply"
                priority
              />
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 3. KPI STATS CARDS (4 Cards Grid)                                 */}
        {/* ----------------------------------------------------------------- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-5">
          {/* Card 1: Total Clients */}
          <div className="bg-white/95 border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B]">Total Clients</span>
              <div className="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">
                {totalClientsCount}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>↑ 12% this month</span>
              </div>
            </div>
          </div>

          {/* Card 2: Active Matters */}
          <div className="bg-white/95 border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Folder className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B]">Active Matters</span>
              <div className="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">
                {activeMattersCount}
              </div>
              <div className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1 mt-0.5">
                <span>↑ 8% this month</span>
              </div>
            </div>
          </div>

          {/* Card 3: Upcoming Hearings */}
          <div className="bg-white/95 border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B]">Upcoming Hearings</span>
              <div className="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">
                {upcomingHearingsCount}
              </div>
              <div className="text-[11px] font-medium text-[#64748B] mt-0.5">
                Next: 28 Oct 2026
              </div>
            </div>
          </div>

          {/* Card 4: Pending Documents */}
          <div className="bg-white/95 border border-[#EAE3D6] rounded-2xl p-4 sm:p-5 shadow-2xs flex items-center gap-4 hover:shadow-xs transition">
            <div className="w-12 h-12 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0 shadow-2xs">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs font-semibold text-[#64748B]">Pending Documents</span>
              <div className="text-2xl font-bold text-[#0F172A] tracking-tight mt-0.5">
                {pendingDocsCount}
              </div>
              <div className="text-[11px] font-medium text-red-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3" />
                <span>Requires attention</span>
              </div>
            </div>
          </div>
        </div>

        {/* ----------------------------------------------------------------- */}
        {/* 4. MAIN BODY SPLIT-VIEW: Left Directory & Right Detail Panel      */}
        {/* ----------------------------------------------------------------- */}
        <div className="mt-6 flex flex-col xl:flex-row gap-5 items-start">
          {/* =============================================================== */}
          {/* LEFT COLUMN: CLIENT DIRECTORY LIST                              */}
          {/* =============================================================== */}
          <div className="w-full xl:w-[410px] flex-shrink-0 bg-white border border-[#EAE3D6] rounded-2xl shadow-xs overflow-hidden flex flex-col">
            {/* Search, Filter & Add Header */}
            <div className="p-3.5 border-b border-[#EAE3D6] space-y-2.5">
              <div className="flex items-center gap-2">
                {/* Search Clients Input */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search clients by name, phone, email or matter..."
                    className="w-full pl-9 pr-3 py-2 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] placeholder:text-[#94A3B8] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 focus:border-[#1E3A8A] transition"
                  />
                  {searchQuery && (
                    <button
                      type="button"
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Icon Button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="p-2 rounded-xl border border-[#EAE3D6] bg-[#FAF8F5] text-[#64748B] hover:text-[#0F172A] hover:bg-[#EFE8DC] transition"
                    title="Filter clients"
                  >
                    <Filter className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown for Type Filter */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsFilterDropdownOpen(!isFilterDropdownOpen)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-[#EAE3D6] bg-[#FAF8F5] text-xs font-semibold text-[#0F172A] hover:bg-[#EFE8DC] transition"
                  >
                    <span>{typeFilter === 'All' ? 'All Clients' : typeFilter}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#64748B]" />
                  </button>

                  {isFilterDropdownOpen && (
                    <div className="absolute right-0 mt-1.5 w-36 bg-white border border-[#EAE3D6] rounded-xl shadow-lg p-1 z-40 text-xs">
                      {(['All', 'Individual', 'Corporate'] as const).map((filter) => (
                        <button
                          key={filter}
                          type="button"
                          onClick={() => {
                            setTypeFilter(filter);
                            setIsFilterDropdownOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 rounded-lg font-medium transition ${
                            typeFilter === filter
                              ? 'bg-[#1E3A8A] text-white font-bold'
                              : 'text-[#475569] hover:bg-[#FAF8F5]'
                          }`}
                        >
                          {filter === 'All' ? 'All Clients' : filter}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Action row with Add Client Button */}
              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-[#64748B] font-medium">
                  Showing {filteredClients.length} of {clients.length} clients
                </span>
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(true)}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#1E3A8A] hover:bg-[#0F172A] text-white font-semibold text-xs transition shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Client</span>
                </button>
              </div>
            </div>

            {/* Scrollable Client Items List */}
            <div className="divide-y divide-[#EAE3D6]/70 max-h-[640px] overflow-y-auto select-none">
              {filteredClients.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#64748B]">
                  No clients found matching your query.
                </div>
              ) : (
                filteredClients.map((client) => {
                  const isSelected = client.id === selectedClientId;
                  return (
                    <div
                      key={client.id}
                      onClick={() => setSelectedClientId(client.id)}
                      className={`p-3.5 sm:p-4 flex items-center justify-between gap-3 cursor-pointer transition relative ${
                        isSelected
                          ? 'bg-[#EEF4FF] border-l-4 border-l-[#1E3A8A]'
                          : 'hover:bg-[#FAF8F5]'
                      }`}
                    >
                      {/* Left: Avatar + Names */}
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-xs flex-shrink-0 ${
                            isSelected
                              ? 'bg-[#1E3A8A] text-white shadow-xs'
                              : 'bg-[#E2E8F0] text-[#334155]'
                          }`}
                        >
                          {client.initials}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-sm text-[#0F172A] truncate">
                            {client.name}
                          </p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="text-xs text-[#64748B]">{client.type}</span>
                            <span className="text-xs font-medium text-[#2563EB]">
                              {client.matters.length} matter{client.matters.length === 1 ? '' : 's'}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Right: Last Activity & More */}
                      <div className="text-right flex-shrink-0 flex items-center gap-2">
                        <div>
                          <p className="text-[10px] text-[#94A3B8]">Last activity</p>
                          <p className="text-xs font-medium text-[#475569]">
                            {client.lastActivity}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedClientId(client.id);
                            handleOpenEditModal();
                          }}
                          className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-md hover:bg-white/60"
                          title="Client options"
                        >
                          <MoreHorizontal className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* =============================================================== */}
          {/* RIGHT COLUMN: SELECTED CLIENT DETAIL VIEW                       */}
          {/* =============================================================== */}
          <div className="flex-1 w-full bg-white border border-[#EAE3D6] rounded-2xl shadow-xs overflow-hidden flex flex-col">
            {/* Top Detail Header Banner */}
            <div className="p-5 sm:p-6 border-b border-[#EAE3D6] flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-white via-white to-[#FAF8F5]">
              {/* Left Profile Identity */}
              <div className="flex items-start sm:items-center gap-4">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-[#E2E8F0] text-[#0F172A] font-bold text-xl sm:text-2xl flex items-center justify-center flex-shrink-0 shadow-xs border border-[#CBD5E1]">
                  {selectedClient.initials}
                </div>
                <div>
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="font-bold text-xl sm:text-2xl text-[#0F172A]">
                      {selectedClient.name}
                    </h2>
                    <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {selectedClient.type}
                    </span>
                  </div>

                  {/* Contact Info Row */}
                  <div className="flex flex-wrap items-center gap-y-1 gap-x-4 text-xs text-[#64748B] mt-2">
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>{selectedClient.phone}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>{selectedClient.email}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-[#94A3B8]" />
                      <span>{selectedClient.address}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Action Buttons */}
              <div className="flex items-center gap-2 flex-shrink-0 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="p-2 rounded-xl border border-[#EAE3D6] bg-[#FAF8F5] text-[#475569] hover:text-[#0F172A] hover:bg-[#EFE8DC] transition"
                  title="More actions"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={handleOpenEditModal}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Edit Client</span>
                </button>
              </div>
            </div>

            {/* Navigation Tabs Bar */}
            <div className="flex items-center gap-1 sm:gap-6 px-5 sm:px-6 border-b border-[#EAE3D6] overflow-x-auto scrollbar-none text-xs font-semibold bg-[#FAF8F5]/60">
              <button
                type="button"
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'overview'
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Overview
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('matters')}
                className={`py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'matters'
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Matters ({selectedClient.matters.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'documents'
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Documents ({selectedClient.documents.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('hearings')}
                className={`py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'hearings'
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Hearings ({selectedClient.hearings.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('notes')}
                className={`py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'notes'
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Notes ({selectedClient.notesList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('communication')}
                className={`py-3 px-2 border-b-2 transition whitespace-nowrap cursor-pointer ${
                  activeTab === 'communication'
                    ? 'border-[#1E3A8A] text-[#1E3A8A] font-bold'
                    : 'border-transparent text-[#64748B] hover:text-[#0F172A]'
                }`}
              >
                Communication
              </button>
            </div>

            {/* Tab Contents Container */}
            <div className="p-5 sm:p-6 bg-[#FAF8F5]/30 flex-1">
              {/* =========================================================== */}
              {/* TAB 1: OVERVIEW (Matches Screenshot Layout)                 */}
              {/* =========================================================== */}
              {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
                  {/* Left Box: Client Information */}
                  <div className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-2xs">
                    <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]/70 mb-4">
                      <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                        <User className="w-4 h-4 text-[#D97706]" />
                        <span>Client Information</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleOpenEditModal}
                        className="text-[#64748B] hover:text-[#0F172A] p-1 transition cursor-pointer"
                        title="Edit information"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Full Name</span>
                        <span className="col-span-2 font-semibold text-[#0F172A]">{selectedClient.name}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Type</span>
                        <span className="col-span-2 font-semibold text-[#0F172A]">{selectedClient.type}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Phone</span>
                        <span className="col-span-2 font-semibold text-[#0F172A]">{selectedClient.phone}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Email</span>
                        <span className="col-span-2 font-semibold text-[#0F172A] break-all">{selectedClient.email}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Address</span>
                        <span className="col-span-2 font-semibold text-[#0F172A] leading-relaxed">{selectedClient.address}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Client Since</span>
                        <span className="col-span-2 font-semibold text-[#0F172A]">{selectedClient.clientSince}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Preferred Language</span>
                        <span className="col-span-2 font-semibold text-[#0F172A]">{selectedClient.preferredLanguage}</span>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <span className="text-[#64748B] font-medium">Notes</span>
                        <span className="col-span-2 text-[#475569] italic">{selectedClient.notes}</span>
                      </div>
                    </div>
                  </div>

                  {/* Right Box: Matters & Upcoming Hearing */}
                  <div className="space-y-4">
                    {/* Matters List Card */}
                    <div className="bg-white border border-[#EAE3D6] rounded-2xl p-5 shadow-2xs">
                      <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]/70 mb-3">
                        <div className="flex items-center gap-2 text-sm font-bold text-[#0F172A]">
                          <Folder className="w-4 h-4 text-[#1E3A8A]" />
                          <span>Matters</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsAddMatterModalOpen(true)}
                          className="text-xs font-semibold text-[#2563EB] hover:text-[#1D4ED8] flex items-center gap-1 transition cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Matter</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {selectedClient.matters.length === 0 ? (
                          <p className="text-xs text-[#64748B] py-3 text-center">No matters assigned yet.</p>
                        ) : (
                          selectedClient.matters.map((matter) => (
                            <div
                              key={matter.id}
                              className="p-3 rounded-xl border border-[#EAE3D6] hover:border-[#CBD5E1] bg-[#FAF8F5]/50 flex items-center justify-between gap-3 transition cursor-pointer hover:bg-white"
                              onClick={() => setActiveTab('matters')}
                            >
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                                  <Folder className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <p className="font-bold text-xs text-[#0F172A] truncate">
                                    {matter.title}
                                  </p>
                                  <p className="text-[11px] text-[#64748B] truncate">
                                    {matter.category} · {matter.court}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                    matter.status === 'Active'
                                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                      : matter.status === 'Drafting'
                                      ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                      : 'bg-slate-100 text-slate-700'
                                  }`}
                                >
                                  {matter.status}
                                </span>
                                <ChevronRight className="w-4 h-4 text-[#94A3B8]" />
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {/* Upcoming Hearing Card matching screenshot */}
                    <div className="bg-[#FFFBEB] border border-[#FDE68A] rounded-2xl p-4 shadow-2xs flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#B45309] flex items-center justify-center flex-shrink-0 border border-[#FDE68A]">
                          <Calendar className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase font-bold tracking-wider text-[#8C7355]">
                            Upcoming Hearing
                          </p>
                          <p className="text-xs font-bold text-[#0F172A]">
                            28 Oct 2026, 10:30 AM
                          </p>
                          <p className="text-xs font-semibold text-[#1E3A8A] truncate mt-0.5">
                            Sharma vs Mehta
                          </p>
                          <p className="text-[11px] text-[#64748B] truncate">
                            Bombay High Court · Courtroom No. 3
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-[#94A3B8] flex-shrink-0" />
                    </div>
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 2: MATTERS FULL VIEW                                   */}
              {/* =========================================================== */}
              {activeTab === 'matters' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0F172A]">All Matters for {selectedClient.name}</h3>
                    <button
                      type="button"
                      onClick={() => setIsAddMatterModalOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#0F172A] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add New Matter</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedClient.matters.map((matter) => (
                      <div key={matter.id} className="bg-white border border-[#EAE3D6] rounded-xl p-4 shadow-2xs space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-sm text-[#0F172A]">{matter.title}</span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              matter.status === 'Active'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : 'bg-amber-50 text-amber-700 border border-amber-200'
                            }`}
                          >
                            {matter.status}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B]">{matter.category} · {matter.court}</p>
                        {matter.courtroom && <p className="text-[11px] text-[#475569]">Venue: {matter.courtroom}</p>}
                        {matter.judge && <p className="text-[11px] text-[#475569]">Presiding: {matter.judge}</p>}
                        {matter.nextHearing && (
                          <div className="pt-2 border-t border-[#EAE3D6] text-xs font-semibold text-[#1E3A8A] flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Hearing: {matter.nextHearing}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 3: DOCUMENTS REPOSITORY                                */}
              {/* =========================================================== */}
              {activeTab === 'documents' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0F172A]">Document Vault</h3>
                    <button
                      type="button"
                      onClick={() => alert('Document upload modal')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold hover:bg-[#1E293B] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Upload Document</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedClient.documents.map((doc) => (
                      <div key={doc.id} className="bg-white border border-[#EAE3D6] rounded-xl p-3.5 flex items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-9 h-9 rounded-lg bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center font-bold text-xs flex-shrink-0">
                            {doc.type}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-xs text-[#0F172A] truncate">{doc.name}</p>
                            <p className="text-[11px] text-[#64748B]">{doc.category} · {doc.size}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {doc.status}
                          </span>
                          <button type="button" className="p-1 text-[#64748B] hover:text-[#0F172A] cursor-pointer" title="Download">
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 4: HEARINGS SCHEDULE                                   */}
              {/* =========================================================== */}
              {activeTab === 'hearings' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0F172A]">Hearings Schedule</h3>
                    <button
                      type="button"
                      onClick={() => alert('New hearing scheduling')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#0F172A] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Schedule Hearing</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedClient.hearings.map((h) => (
                      <div key={h.id} className="bg-white border border-[#EAE3D6] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] text-[#0F172A] flex flex-col items-center justify-center font-bold text-xs flex-shrink-0">
                            <span className="text-[10px] text-[#8C7355] leading-none">{h.date.split(' ')[1]}</span>
                            <span className="leading-tight">{h.date.split(' ')[0]}</span>
                          </div>
                          <div>
                            <p className="font-bold text-xs text-[#0F172A]">{h.title}</p>
                            <p className="text-[11px] text-[#64748B]">{h.matter} · {h.court} ({h.courtroom})</p>
                            <span className="text-[10px] text-[#1E3A8A] font-semibold mt-0.5 block">{h.time}</span>
                          </div>
                        </div>
                        <span
                          className={`self-start sm:self-center text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                            h.status === 'Scheduled'
                              ? 'bg-blue-50 text-blue-700 border border-blue-200'
                              : h.status === 'Completed'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-emerald-50 text-emerald-700'
                          }`}
                        >
                          {h.status}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 5: NOTES                                               */}
              {/* =========================================================== */}
              {activeTab === 'notes' && (
                <div className="space-y-4">
                  {/* Quick Add Note Box */}
                  <div className="bg-white border border-[#EAE3D6] rounded-xl p-3.5 shadow-2xs">
                    <textarea
                      rows={2}
                      value={quickNoteText}
                      onChange={(e) => setQuickNoteText(e.target.value)}
                      placeholder="Add an internal confidential note regarding this client..."
                      className="w-full text-xs p-2 bg-[#FAF8F5] border border-[#EAE3D6] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30 text-[#0F172A]"
                    />
                    <div className="flex justify-end mt-2">
                      <button
                        type="button"
                        onClick={handleAddQuickNote}
                        disabled={!quickNoteText.trim()}
                        className="px-3.5 py-1.5 rounded-lg bg-[#0F172A] hover:bg-[#1E293B] disabled:opacity-50 text-white font-semibold text-xs transition cursor-pointer"
                      >
                        Save Note
                      </button>
                    </div>
                  </div>

                  {/* Notes Feed */}
                  <div className="space-y-3">
                    {selectedClient.notesList.map((n) => (
                      <div key={n.id} className="bg-white border border-[#EAE3D6] rounded-xl p-3.5 shadow-2xs">
                        <div className="flex items-center justify-between pb-1.5 border-b border-[#EAE3D6]/70 mb-2">
                          <span className="font-bold text-xs text-[#0F172A]">{n.author}</span>
                          <span className="text-[10px] text-[#94A3B8]">{n.date}</span>
                        </div>
                        <p className="text-xs text-[#475569] leading-relaxed">{n.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* =========================================================== */}
              {/* TAB 6: COMMUNICATION LOG                                   */}
              {/* =========================================================== */}
              {activeTab === 'communication' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-[#0F172A]">Interaction History</h3>
                    <button
                      type="button"
                      onClick={() => alert('Log Communication modal')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#0F172A] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Log Communication</span>
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {selectedClient.communications.map((comm) => (
                      <div key={comm.id} className="bg-white border border-[#EAE3D6] rounded-xl p-3.5 flex items-start gap-3 shadow-2xs">
                        <div className="w-8 h-8 rounded-lg bg-[#FAF8F5] border border-[#EAE3D6] text-[#1E3A8A] flex items-center justify-center flex-shrink-0 mt-0.5">
                          <MessageSquare className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-xs text-[#0F172A]">{comm.type}</span>
                            <span className="text-[10px] text-[#94A3B8]">{comm.date} · {comm.time}</span>
                          </div>
                          <p className="text-xs text-[#475569] mt-1">{comm.summary}</p>
                          {comm.duration && (
                            <span className="text-[10px] text-[#8C7355] font-semibold mt-1 inline-block">
                              Status / Duration: {comm.duration}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* 5. MODALS: Add Client, Edit Client, Add Matter                      */}
      {/* =================================================================== */}

      {/* MODAL 1: ADD NEW CLIENT */}
      {isAddClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#EAE3D6] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE3D6] bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="font-bold text-base text-[#0F172A]">New Client Registration</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateClient} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Full Name / Entity Name *</label>
                <input
                  type="text"
                  required
                  value={newClientName}
                  onChange={(e) => setNewClientName(e.target.value)}
                  placeholder="e.g. Anand Mahindra or Apex FinTech Ltd."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Client Type</label>
                  <select
                    value={newClientType}
                    onChange={(e) => setNewClientType(e.target.value as 'Individual' | 'Corporate')}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Preferred Language</label>
                  <input
                    type="text"
                    value={newClientLanguage}
                    onChange={(e) => setNewClientLanguage(e.target.value)}
                    placeholder="e.g. English, Hindi, Marathi"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={newClientPhone}
                    onChange={(e) => setNewClientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={newClientEmail}
                    onChange={(e) => setNewClientEmail(e.target.value)}
                    placeholder="client@domain.com"
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Address / Jurisdiction</label>
                <input
                  type="text"
                  value={newClientAddress}
                  onChange={(e) => setNewClientAddress(e.target.value)}
                  placeholder="e.g. Bandra West, Mumbai, Maharashtra"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Initial Notes / Retainer Terms</label>
                <textarea
                  rows={2}
                  value={newClientNotes}
                  onChange={(e) => setNewClientNotes(e.target.value)}
                  placeholder="e.g. Client onboarded for civil property advisory."
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE3D6]">
                <button
                  type="button"
                  onClick={() => setIsAddClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3D6] text-[#475569] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Save Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: EDIT CLIENT */}
      {isEditClientModalOpen && selectedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#EAE3D6] rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE3D6] bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Pencil className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="font-bold text-base text-[#0F172A]">Edit Client Profile</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditClientModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClient} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={editClientName}
                  onChange={(e) => setEditClientName(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Client Type</label>
                  <select
                    value={editClientType}
                    onChange={(e) => setEditClientType(e.target.value as 'Individual' | 'Corporate')}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  >
                    <option value="Individual">Individual</option>
                    <option value="Corporate">Corporate</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Preferred Language</label>
                  <input
                    type="text"
                    value={editClientLanguage}
                    onChange={(e) => setEditClientLanguage(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Phone Number</label>
                  <input
                    type="text"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Email Address</label>
                  <input
                    type="email"
                    value={editClientEmail}
                    onChange={(e) => setEditClientEmail(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Address</label>
                <input
                  type="text"
                  value={editClientAddress}
                  onChange={(e) => setEditClientAddress(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Internal Notes</label>
                <textarea
                  rows={2}
                  value={editClientNotes}
                  onChange={(e) => setEditClientNotes(e.target.value)}
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE3D6]">
                <button
                  type="button"
                  onClick={() => setIsEditClientModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3D6] text-[#475569] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#0F172A] hover:bg-[#1E293B] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Update Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW MATTER */}
      {isAddMatterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs">
          <div className="bg-white border border-[#EAE3D6] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-[#EAE3D6] bg-[#FAF8F5]">
              <div className="flex items-center gap-2">
                <Folder className="w-5 h-5 text-[#1E3A8A]" />
                <h3 className="font-bold text-base text-[#0F172A]">Add New Matter</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddMatterModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMatter} className="p-5 space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Matter / Case Title *</label>
                <input
                  type="text"
                  required
                  value={newMatterTitle}
                  onChange={(e) => setNewMatterTitle(e.target.value)}
                  placeholder="e.g. Sharma vs Union of India"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Matter Category</label>
                  <select
                    value={newMatterCategory}
                    onChange={(e) => setNewMatterCategory(e.target.value)}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  >
                    <option value="Civil Suit">Civil Suit</option>
                    <option value="Criminal Defense">Criminal Defense</option>
                    <option value="Writ Petition">Writ Petition</option>
                    <option value="Commercial Arbitration">Commercial Arbitration</option>
                    <option value="Corporate Advisory">Corporate Advisory</option>
                    <option value="Family Dispute">Family Dispute</option>
                    <option value="RERA Dispute">RERA Dispute</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#0F172A] mb-1">Status</label>
                  <select
                    value={newMatterStatus}
                    onChange={(e) => setNewMatterStatus(e.target.value as 'Active' | 'Drafting')}
                    className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                  >
                    <option value="Active">Active</option>
                    <option value="Drafting">Drafting</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Court / Forum</label>
                <input
                  type="text"
                  value={newMatterCourt}
                  onChange={(e) => setNewMatterCourt(e.target.value)}
                  placeholder="e.g. Bombay High Court"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#0F172A] mb-1">Next Hearing Date & Courtroom</label>
                <input
                  type="text"
                  value={newMatterHearing}
                  onChange={(e) => setNewMatterHearing(e.target.value)}
                  placeholder="e.g. 15 Nov 2026, 10:30 AM · Courtroom No. 4"
                  className="w-full p-2.5 bg-[#FAF8F5] border border-[#EAE3D6] rounded-xl text-xs text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#1E3A8A]/30"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#EAE3D6]">
                <button
                  type="button"
                  onClick={() => setIsAddMatterModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#EAE3D6] text-[#475569] hover:bg-[#FAF8F5] font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#0F172A] text-white font-bold transition shadow-xs cursor-pointer"
                >
                  Create Matter
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
