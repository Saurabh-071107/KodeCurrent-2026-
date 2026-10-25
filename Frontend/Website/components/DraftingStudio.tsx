'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { VoiceDictation } from './voice/VoiceDictation';
import {
  Search,
  Bell,
  ChevronDown,
  ChevronUp,
  FileText,
  Sparkles,
  Languages,
  Paperclip,
  ArrowUp,
  Mic,
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  List,
  ListOrdered,
  Link2,
  MoreHorizontal,
  Maximize2,
  Minimize2,
  ArrowRight,
  Pencil,
  Check,
  Scale,
  Users,
  GraduationCap,
  Briefcase,
  UserCheck,
  Plus,
  UploadCloud,
  Clock,
  ArrowLeft,
  X
} from 'lucide-react';

export type UserRoleType = 'advocate' | 'citizen' | 'firm' | 'student';
export type ViewMode = 'entry' | 'existing_list' | 'editor';

export interface TemplateDefinition {
  id: string;
  title: string;
  role: UserRoleType;
  category: string;
  skillName: string;
  skillDesc: string;
  formFields: Array<{
    id: string;
    label: string;
    placeholder: string;
    required?: boolean;
    defaultValue?: string;
  }>;
  heading: string;
  subject: string;
  toPlaceholder: string;
  bodyClauses: string[];
  ultimatum: string;
  signOffTitle: string;
}

export interface SavedDraftItem {
  id: string;
  title: string;
  category: string;
  role: UserRoleType;
  lastEdited: string;
  wordsCount: number;
  preview: string;
  templateId: string;
  heading: string;
  subject: string;
  toPlaceholder?: string;
  bodyClauses: string[];
  ultimatum: string;
  signOffTitle: string;
}

// Master templates registry
export const MASTER_TEMPLATES: TemplateDefinition[] = [
  // 1. Advocate Primary
  {
    id: 'legal-notice-rent',
    title: 'Legal Notice — Rent Default',
    role: 'advocate',
    category: 'Property & Tenancy',
    skillName: 'Legal Notice',
    skillDesc: 'Create a formal legal notice under Section 106 Transfer of Property Act',
    formFields: [
      { id: 'recipient', label: 'Recipient name', placeholder: 'Enter full name', required: true },
      { id: 'address', label: 'Property address', placeholder: 'Enter property address', required: true },
      { id: 'amount', label: 'Rent outstanding (₹)', placeholder: 'Enter amount' },
      { id: 'date', label: 'Agreement date', placeholder: 'DD / MM / YYYY' }
    ],
    heading: 'LEGAL NOTICE',
    subject: 'Notice regarding non-payment of rent',
    toPlaceholder: '[Recipient Name and Address]',
    bodyClauses: [
      'That my client is the lawful owner of the residential property bearing No. ____________ situated at ____________ (hereinafter referred to as the "said property").',
      'That you are presently occupying the said property as a tenant under a valid rent agreement dated [CONFIRM: rent agreement date].',
      'That despite repeated requests, you have failed to pay the outstanding rent amounting to ₹ ____________ for the period from ____________ to ____________.'
    ],
    ultimatum: 'You are hereby called upon to clear the entire outstanding amount within 15 (Fifteen) days from the date of receipt of this notice, failing which my client shall be constrained to take appropriate legal action without any further notice to you.',
    signOffTitle: '[Advocate Name]\nCounsel for the Client'
  },

  // 2. Citizen Primary: Refund of Security Deposit
  {
    id: 'citizen-security-deposit',
    title: 'Notice for Refund of Security Deposit',
    role: 'citizen',
    category: 'Citizen Rights & Tenancy',
    skillName: 'Deposit Refund Notice',
    skillDesc: 'Demand refund of tenant security deposit unlawfully withheld by landlord',
    formFields: [
      { id: 'landlord', label: 'Landlord full name', placeholder: 'e.g. Ramesh Chandra Verma', required: true },
      { id: 'flat', label: 'Rented premises address', placeholder: 'e.g. Flat 402, Sunshine Heights, Mumbai', required: true },
      { id: 'depositAmount', label: 'Deposit amount withheld (₹)', placeholder: 'e.g. 75,000', required: true },
      { id: 'vacateDate', label: 'Date vacated', placeholder: 'DD / MM / YYYY' }
    ],
    heading: 'FORMAL NOTICE FOR RETURN OF SECURITY DEPOSIT',
    subject: 'Immediate refund of interest-free security deposit of ₹ 75,000/-',
    toPlaceholder: '[Landlord Name and Residence Address]',
    bodyClauses: [
      'That I was the bona fide tenant of your flat situated at ____________ as per the lease agreement dated [CONFIRM: lease date].',
      'That I have peacefully vacated and handed over vacant possession along with keys of the said premises on [CONFIRM: vacate date] with zero utility arrears.',
      'That an interest-free security deposit amounting to ₹ ____________ remains unlawfully withheld by you despite multiple written reminders and WhatsApp intimations.'
    ],
    ultimatum: 'I hereby request and demand that you remit the complete deposit amount of ₹ ____________ to my bank account within 7 days, failing which I shall be compelled to initiate civil recovery and consumer grievance proceedings before the appropriate forum.',
    signOffTitle: '[Tenant Name]\nFormer Tenant & Verified Citizen'
  },

  // 3. Citizen: Consumer Complaint
  {
    id: 'citizen-consumer-complaint',
    title: 'Consumer Complaint Petition',
    role: 'citizen',
    category: 'Consumer Forum',
    skillName: 'Consumer Grievance Draft',
    skillDesc: 'Formal complaint for defective products, deficient service or unfair trade practice',
    formFields: [
      { id: 'companyName', label: 'Company / Seller name', placeholder: 'e.g. Apex Electronics Ltd.', required: true },
      { id: 'productName', label: 'Product or Service purchased', placeholder: 'e.g. Smart LED Television 55-inch', required: true },
      { id: 'invoiceAmount', label: 'Invoice Amount (₹)', placeholder: 'e.g. 48,000' },
      { id: 'purchaseDate', label: 'Purchase Date', placeholder: 'DD / MM / YYYY' }
    ],
    heading: 'BEFORE THE DISTRICT CONSUMER DISPUTES REDRESSAL COMMISSION',
    subject: 'Consumer Complaint under Section 35 of Consumer Protection Act, 2019',
    toPlaceholder: 'The Hon’ble District Commission, [District / City]',
    bodyClauses: [
      'That the Complainant purchased ____________ from the Opposite Party against valid Tax Invoice dated [CONFIRM: invoice date] for total consideration of ₹ ____________.',
      'That shortly after delivery, the product developed severe manufacturing defects rendering it completely unserviceable within the warranty period.',
      'That despite repeated service requests and lodging tickets, the Opposite Party has refused to replace the item or refund the consideration, constituting gross deficiency in service.'
    ],
    ultimatum: 'The Complainant respectfully prays that this Commission direct the Opposite Party to refund ₹ ____________ with 12% interest and grant damages of ₹ 25,000 for mental agony and litigation expenses.',
    signOffTitle: '[Complainant Name]\nComplainant in Person'
  },

  // 4. Law Firm: Commercial NDA
  {
    id: 'firm-mutual-nda',
    title: 'Mutual Non-Disclosure Agreement (NDA)',
    role: 'firm',
    category: 'Corporate & Contracts',
    skillName: 'Commercial NDA',
    skillDesc: 'Bilateral non-disclosure agreement protecting proprietary trade secrets and IP',
    formFields: [
      { id: 'partyA', label: 'Disclosing Party (Company A)', placeholder: 'e.g. Nexora Technologies Pvt. Ltd.', required: true },
      { id: 'partyB', label: 'Receiving Party (Company B)', placeholder: 'e.g. Zenith Global Ventures LLC', required: true },
      { id: 'purpose', label: 'Business Purpose', placeholder: 'e.g. Exploring joint AI venture and licensing' },
      { id: 'effectiveDate', label: 'Effective Date', placeholder: 'DD / MM / YYYY' }
    ],
    heading: 'MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT',
    subject: 'Protection of Proprietary Business & Technical Information',
    toPlaceholder: 'By and Between [Company A] and [Company B]',
    bodyClauses: [
      'WHEREAS, the Parties wish to explore a potential business collaboration regarding [CONFIRM: business purpose] ("Permitted Purpose");',
      'NOW THEREFORE, in consideration of the mutual covenants, each Party agrees to maintain all Technical Data, Source Code, and Client Records in strict confidence using no less than reasonable care;',
      'Non-Use & Non-Disclosure: Neither Party shall disclose, reproduce or reverse-engineer any Confidential Information without prior written consent of the Disclosing Party.'
    ],
    ultimatum: 'This Agreement shall be governed by the laws of India, and any disputes arising shall be subject to the exclusive jurisdiction of the Commercial Courts at New Delhi.',
    signOffTitle: 'For & on behalf of [Company A]\nAuthorized Signatory'
  },

  // 5. Law Student: Moot Court Memorial
  {
    id: 'student-moot-memorial',
    title: 'Moot Court Memorial — Petitioner',
    role: 'student',
    category: 'Moot Court & Academic',
    skillName: 'Memorial Drafter',
    skillDesc: 'Structured national moot court memorial with facts, issues, and summary of pleadings',
    formFields: [
      { id: 'mootTitle', label: 'Moot Competition Name', placeholder: 'e.g. 15th National Constitutional Moot Court', required: true },
      { id: 'caseTitle', label: 'Case Title', placeholder: 'e.g. Union of People v. Republic of Indica', required: true },
      { id: 'courtName', label: 'Bench / Court', placeholder: 'e.g. Supreme Court of Indica' },
      { id: 'teamCode', label: 'Team Code', placeholder: 'e.g. TC-42' }
    ],
    heading: 'MEMORIAL FOR THE PETITIONER',
    subject: 'Pleadings on behalf of the Petitioner under Article 32 of Constitution',
    toPlaceholder: 'IN THE HON’BLE SUPREME COURT OF INDICA',
    bodyClauses: [
      'STATEMENT OF JURISDICTION: The Petitioner approaches this Hon’ble Court under Article 32 of the Constitution challenging arbitrary surveillance regulations violating fundamental privacy rights.',
      'STATEMENT OF FACTS: The Government enacted data retention protocols compelling telecom providers to store biometric telemetry for 5 years without prior judicial warrant.',
      'ARGUMENT ADVANCED — ISSUE 1: The impugned circular fails the four-pronged proportionality test laid down in K.S. Puttaswamy (Privacy 9J) v. Union of India.'
    ],
    ultimatum: 'PRAYER: Wherefore, in the light of the facts stated and authorities cited, the Petitioner respectfully prays that this Hon’ble Court declare the impugned regulations ultra vires Articles 14, 19 and 21.',
    signOffTitle: 'Respectfully Submitted,\nCounsels for the Petitioner (Team [TC-42])'
  }
];

// Initial default saved drafts
const DEFAULT_SAVED_DRAFTS: SavedDraftItem[] = [
  {
    id: 'draft-1',
    title: 'Legal Notice — Rent Default',
    category: 'Property & Tenancy',
    role: 'advocate',
    lastEdited: '2 hours ago',
    wordsCount: 158,
    preview: 'Notice to tenant under Section 106 Transfer of Property Act regarding outstanding arrears of rent.',
    templateId: 'legal-notice-rent',
    heading: 'LEGAL NOTICE',
    subject: 'Notice regarding non-payment of rent',
    bodyClauses: [
      'That my client is the lawful owner of the residential property bearing No. ____________ situated at ____________ (hereinafter referred to as the "said property").',
      'That you are presently occupying the said property as a tenant under a valid rent agreement dated [CONFIRM: rent agreement date].',
      'That despite repeated requests, you have failed to pay the outstanding rent amounting to ₹ ____________ for the period from ____________ to ____________.'
    ],
    ultimatum: 'You are hereby called upon to clear the entire outstanding amount within 15 (Fifteen) days from the date of receipt of this notice, failing which my client shall be constrained to take appropriate legal action without any further notice to you.',
    signOffTitle: '[Advocate Name]\nCounsel for the Client'
  },
  {
    id: 'draft-2',
    title: 'Bail Application — State v. Manish Verma',
    category: 'Criminal Law',
    role: 'advocate',
    lastEdited: 'Yesterday',
    wordsCount: 340,
    preview: 'Application for regular bail under Section 439 CrPC / Section 483 BNSS before the High Court of Delhi.',
    templateId: 'legal-notice-rent',
    heading: 'IN THE HIGH COURT OF DELHI AT NEW DELHI',
    subject: 'Bail Application under Section 439 Cr.P.C. in FIR No. 204/2026',
    bodyClauses: [
      'That the Applicant is an innocent and law-abiding citizen falsely implicated in FIR No. 204/2026 registered at P.S. Connaught Place.',
      'That the investigation in the matter is virtually complete and the custodial interrogation of the applicant is no longer required.',
      'That the applicant has deep roots in society and undertakes to comply with all conditions imposed by this Hon’ble Court.'
    ],
    ultimatum: 'It is therefore most respectfully prayed that this Hon’ble Court be pleased to enlarge the Applicant on regular bail during the pendency of the trial.',
    signOffTitle: 'Through Counsel,\n[Advocate Name], Advocate'
  },
  {
    id: 'draft-3',
    title: 'Notice for Refund of Security Deposit',
    category: 'Citizen Rights',
    role: 'citizen',
    lastEdited: '3 days ago',
    wordsCount: 210,
    preview: 'Formal demand notice to landlord requesting immediate refund of ₹ 75,000 security deposit.',
    templateId: 'citizen-security-deposit',
    heading: 'FORMAL NOTICE FOR RETURN OF SECURITY DEPOSIT',
    subject: 'Immediate refund of interest-free security deposit of ₹ 75,000/-',
    bodyClauses: [
      'That I was the bona fide tenant of your flat situated at ____________ as per the lease agreement dated [CONFIRM: lease date].',
      'That I have peacefully vacated and handed over vacant possession along with keys of the said premises on [CONFIRM: vacate date] with zero utility arrears.',
      'That an interest-free security deposit amounting to ₹ ____________ remains unlawfully withheld by you despite multiple written reminders.'
    ],
    ultimatum: 'I hereby request and demand that you remit the complete deposit amount within 7 days to avoid legal action.',
    signOffTitle: '[Tenant Name]\nFormer Tenant & Verified Citizen'
  },
  {
    id: 'draft-4',
    title: 'Mutual Non-Disclosure Agreement (NDA)',
    category: 'Corporate Contracts',
    role: 'firm',
    lastEdited: 'Oct 20, 2026',
    wordsCount: 490,
    preview: 'Bilateral confidentiality agreement protecting technical source code, trade secrets and proprietary data.',
    templateId: 'firm-mutual-nda',
    heading: 'MUTUAL NON-DISCLOSURE AND CONFIDENTIALITY AGREEMENT',
    subject: 'Protection of Proprietary Business & Technical Information',
    bodyClauses: [
      'WHEREAS, the Parties wish to explore a potential business collaboration regarding joint AI venture and licensing;',
      'NOW THEREFORE, each Party agrees to maintain all Technical Data, Source Code, and Client Records in strict confidence using reasonable care;',
      'Neither Party shall disclose or reverse-engineer any Confidential Information without prior written consent.'
    ],
    ultimatum: 'This Agreement shall be governed by the laws of India with exclusive jurisdiction of the Commercial Courts at New Delhi.',
    signOffTitle: 'For & on behalf of [Company A]\nAuthorized Signatory'
  }
];

interface DraftingStudioProps {
  initialUserName?: string;
  initialUserRole?: string;
  defaultRole?: UserRoleType;
}

export default function DraftingStudio({
  initialUserName = 'Adv. Saurabh',
  initialUserRole = 'Advocate · saurabh@example.com',
  defaultRole = 'advocate'
}: DraftingStudioProps) {
  const router = useRouter();

  // View Mode: 'entry' (the 3 cards) | 'existing_list' (saved drafts list) | 'editor' (workspace)
  const [viewMode, setViewMode] = useState<ViewMode>('entry');

  // Active User Profile and Role State
  const [currentRole, setCurrentRole] = useState<UserRoleType>(defaultRole);
  const [userName, setUserName] = useState(initialUserName);
  const [userRoleText, setUserRoleText] = useState(initialUserRole);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleSwitcherOpen, setRoleSwitcherOpen] = useState(false);

  // Dynamic Templates & Saved Drafts List
  const [templatesList, setTemplatesList] = useState<TemplateDefinition[]>(MASTER_TEMPLATES);
  const [savedDrafts, setSavedDrafts] = useState<SavedDraftItem[]>(DEFAULT_SAVED_DRAFTS);
  const [draftSearchQuery, setDraftSearchQuery] = useState('');

  // Active Template / Document State
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition>(MASTER_TEMPLATES[0]);
  const [docTitle, setDocTitle] = useState(MASTER_TEMPLATES[0].title);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Saved');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Live Document Canvas State
  const [draftHeading, setDraftHeading] = useState(MASTER_TEMPLATES[0].heading);
  const [draftDate, setDraftDate] = useState('');
  const [draftTo, setDraftTo] = useState(MASTER_TEMPLATES[0].toPlaceholder);
  const [draftSubject, setDraftSubject] = useState(MASTER_TEMPLATES[0].subject);
  const [draftClauses, setDraftClauses] = useState<string[]>(MASTER_TEMPLATES[0].bodyClauses);
  const [draftUltimatum, setDraftUltimatum] = useState(MASTER_TEMPLATES[0].ultimatum);
  const [draftSignOff, setDraftSignOff] = useState(MASTER_TEMPLATES[0].signOffTitle);
  const [isGenerating, setIsGenerating] = useState(false);

  // New Draft Name Intake Modal State
  const [isNewDraftModalOpen, setIsNewDraftModalOpen] = useState(false);
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [newDraftTemplateId, setNewDraftTemplateId] = useState('');

  // Dynamic Questionnaire Form Values
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isDraftGenerated, setIsDraftGenerated] = useState(false);

  // Chat message & input
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'ai' | 'user'; text: string; time: string }>>([
    {
      id: '1',
      sender: 'ai',
      text: "Let's prepare your legal draft. I'll guide you with a few details to generate a professional, statutory-compliant document.",
      time: '10:24 AM'
    }
  ]);

  // Active Tab for AI Assistant
  const [aiTab, setAiTab] = useState<'Chat' | 'Details' | 'Reference' | 'Templates'>('Chat');
  
  // Mobile responsive view switcher: Document Canvas vs AI Assistant
  const [activeMobileView, setActiveMobileView] = useState<'canvas' | 'ai'>('canvas');

  // Load user profile & query params if present
  useEffect(() => {
    // Fetch live templates and drafts from backend
    api.getTemplates().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setTemplatesList(res.data);
      }
    }).catch(() => {});

    api.getDrafts().then((res) => {
      if (res.success && Array.isArray(res.data) && res.data.length > 0) {
        setSavedDrafts(res.data);
      }
    }).catch(() => {});

    if (typeof window !== 'undefined') {
      try {
        const storedDrafts = localStorage.getItem('draftmate_saved_drafts');
        if (storedDrafts) {
          const parsedDrafts = JSON.parse(storedDrafts);
          if (Array.isArray(parsedDrafts) && parsedDrafts.length > 0) {
            setSavedDrafts(parsedDrafts);
          }
        }

        const stored = localStorage.getItem('draftmate_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const r = (parsed.role || parsed.onboarding?.role) as UserRoleType;
          if (r && ['advocate', 'citizen', 'firm', 'student'].includes(r)) {
            setCurrentRole(r);
            const matched = templatesList.find((t) => t.role === r) || MASTER_TEMPLATES.find((t) => t.role === r);
            if (matched) {
              setSelectedTemplate(matched);
              setDocTitle(matched.title);
            }
          }
          if (parsed.name) {
            setUserName(parsed.name.startsWith('Adv.') ? parsed.name : parsed.name);
          }
          if (parsed.email) {
            setUserRoleText(`${parsed.role || 'User'} · ${parsed.email}`);
          }
        }

        // Check URL search params for template or role
        const urlParams = new URLSearchParams(window.location.search);
        const tmplParam = urlParams.get('template');
        const roleParam = urlParams.get('role') as UserRoleType;
        const modeParam = urlParams.get('mode') as ViewMode;

        if (roleParam && ['advocate', 'citizen', 'firm', 'student'].includes(roleParam)) {
          setCurrentRole(roleParam);
        }

        // If a template is explicitly specified, open directly into editor
        if (tmplParam) {
          const found = templatesList.find((t) => 
            t.title.toLowerCase().includes(tmplParam.toLowerCase()) || 
            t.skillName.toLowerCase().includes(tmplParam.toLowerCase())
          );
          if (found) {
            setSelectedTemplate(found);
            setDocTitle(found.title);
            setCurrentRole(found.role);
          }
          setViewMode('editor');
        } else if (modeParam && ['entry', 'existing_list', 'editor'].includes(modeParam)) {
          setViewMode(modeParam);
        }
      } catch (e) {
        console.error('Failed to load user info / template param', e);
      }
    }
  }, []);

  // Save drafts to backend API and localStorage
  const persistDrafts = (updated: SavedDraftItem[]) => {
    setSavedDrafts(updated);
    if (updated.length > 0) {
      api.saveDraft(updated[0]).catch(() => {});
    }
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('draftmate_saved_drafts', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save drafts to localStorage', e);
      }
    }
  };

  // Switch active template
  const handleSelectTemplate = (tmpl: TemplateDefinition) => {
    setSelectedTemplate(tmpl);
    setDocTitle(tmpl.title);
    setCurrentRole(tmpl.role);
    setFormValues({});
    setDraftHeading(tmpl.heading);
    setDraftSubject(tmpl.subject);
    setDraftTo(tmpl.toPlaceholder);
    setDraftClauses(tmpl.bodyClauses);
    setDraftUltimatum(tmpl.ultimatum);
    setDraftSignOff(tmpl.signOffTitle);
    setDraftDate('');
    setIsDraftGenerated(false);
    setSaveStatus('Draft loaded');
    setTemplatePickerOpen(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `Switched skill to "${tmpl.skillName}". Please provide the following details to generate your customized ${tmpl.title}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Option 1: Prompt for Draft Name Before Opening
  const handleCreateNewDraft = () => {
    const matched = templatesList.find((t) => t.role === currentRole) || templatesList[0] || MASTER_TEMPLATES[0];
    setNewDraftTitle('');
    setNewDraftTemplateId(matched.id);
    setIsNewDraftModalOpen(true);
  };

  // Confirm Creation with User-Entered Draft Name
  const handleConfirmCreateNewDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = newDraftTitle.trim();
    if (!trimmedTitle) return;

    const matched = templatesList.find((t) => t.id === newDraftTemplateId) || 
      templatesList.find((t) => t.role === currentRole) || 
      templatesList[0] || 
      MASTER_TEMPLATES[0];

    setSelectedTemplate(matched);
    setDocTitle(trimmedTitle);
    setCurrentRole(matched.role as UserRoleType);
    setFormValues({});
    setDraftHeading(matched.heading);
    setDraftSubject(matched.subject);
    setDraftTo(matched.toPlaceholder);
    setDraftClauses(matched.bodyClauses);
    setDraftUltimatum(matched.ultimatum);
    setDraftSignOff(matched.signOffTitle);
    setDraftDate('');
    setIsDraftGenerated(false);
    setSaveStatus('Draft created');
    setMessages([
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `New draft "${trimmedTitle}" created using skill "${matched.skillName}". Please complete the questionnaire or type instructions below to generate your clauses.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
    setIsNewDraftModalOpen(false);
    setViewMode('editor');
  };

  // Option 3: Work on Existing Document (Select Draft)
  const handleOpenExistingDraft = (draft: SavedDraftItem) => {
    const matchingTemplate: TemplateDefinition = {
      id: draft.templateId || draft.id,
      title: draft.title,
      role: draft.role,
      category: draft.category,
      skillName: draft.title.split('—')[0]?.trim() || 'Saved Draft',
      skillDesc: draft.preview,
      formFields: [
        { id: 'docTitle', label: 'Draft Title', placeholder: 'Enter title', defaultValue: draft.title }
      ],
      heading: draft.heading || draft.title.toUpperCase(),
      subject: draft.subject || draft.title,
      toPlaceholder: '[Recipient / Addressee]',
      bodyClauses: draft.bodyClauses || [draft.preview],
      ultimatum: draft.ultimatum || '',
      signOffTitle: draft.signOffTitle || '[Authorized Signatory]'
    };
    setSelectedTemplate(matchingTemplate);
    setDocTitle(draft.title);
    setCurrentRole(draft.role);
    setDraftHeading(draft.heading || draft.title.toUpperCase());
    setDraftSubject(draft.subject || draft.title);
    setDraftTo(draft.toPlaceholder || '[Recipient / Addressee]');
    setDraftClauses(draft.bodyClauses || [draft.preview]);
    setDraftUltimatum(draft.ultimatum || '');
    setDraftSignOff(draft.signOffTitle || '[Authorized Signatory]');
    setDraftDate(draft.lastEdited || new Date().toLocaleDateString('en-IN'));
    setIsDraftGenerated(true);
    setSaveStatus(`Opened from ${draft.lastEdited}`);
    setViewMode('editor');
  };

  // Simulate File Upload (.docx or .pdf)
  const handleSimulateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const headingName = file.name.toUpperCase().replace(/\.[^/.]+$/, "");
      const subjectName = `Document imported from ${file.name}`;
      const clauses = [
        `Paragraph 1: Content imported successfully from ${file.name}.`,
        'Paragraph 2: All clauses are fully editable in this collaborative canvas.'
      ];
      const ultimatum = 'The parties agree to the terms as transcribed above.';
      const signOff = '[Signatory Name]\nAuthorized Representative';

      const newDraft: SavedDraftItem = {
        id: `upload-${Date.now()}`,
        title: file.name.replace(/\.[^/.]+$/, ""),
        category: 'Uploaded Document',
        role: currentRole,
        lastEdited: 'Just now',
        wordsCount: 280,
        preview: `Imported from ${file.name}. Parsed paragraphs and formatted into Word-compatible editor.`,
        templateId: 'uploaded-doc',
        heading: headingName,
        subject: subjectName,
        bodyClauses: clauses,
        ultimatum: ultimatum,
        signOffTitle: signOff
      };
      const updated = [newDraft, ...savedDrafts];
      persistDrafts(updated);
      handleOpenExistingDraft(newDraft);
    }
  };

  // Switch Role
  const handleRoleChange = (newRole: UserRoleType) => {
    setCurrentRole(newRole);
    setRoleSwitcherOpen(false);
    const firstMatching = MASTER_TEMPLATES.find((t) => t.role === newRole) || MASTER_TEMPLATES[0];
    handleSelectTemplate(firstMatching);

    const roleLabels: Record<UserRoleType, string> = {
      advocate: 'Advocate · High Court',
      citizen: 'Citizen · Non-Legal User',
      firm: 'Sharma & Associates · Law Firm',
      student: 'Law Student · National Law University'
    };
    setUserRoleText(roleLabels[newRole]);

    // Route to role-scoped URL
    router.push(`/${newRole}/drafting-studio`);
  };

  // Handle Dynamic Questionnaire Input change
  const handleInputChange = (fieldId: string, val: string) => {
    setFormValues((prev) => ({ ...prev, [fieldId]: val }));
  };

  // Handle Generate Draft button click
  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setSaveStatus('Generating dynamic draft...');

    const todayDate = new Date().toLocaleDateString('en-IN');
    let generatedHeading = selectedTemplate.heading;
    let generatedSubject = selectedTemplate.subject;
    let generatedTo = selectedTemplate.toPlaceholder;
    let generatedClauses: string[] = [];
    let generatedUltimatum = selectedTemplate.ultimatum;
    let generatedSignOff = selectedTemplate.signOffTitle;

    // 1. Synthesize clauses tailored directly to formValues
    if (selectedTemplate.id === 'student-moot-memorial') {
      const moot = formValues.mootTitle || 'National Moot Court Competition';
      const cTitle = formValues.caseTitle || 'Union of People v. Republic of Indica';
      const court = formValues.courtName || 'Supreme Court of Indica';
      const tCode = formValues.teamCode || 'TC-42';

      generatedHeading = 'MEMORIAL FOR THE PETITIONER';
      generatedTo = `IN THE HON’BLE ${court.toUpperCase()}`;
      generatedSubject = `Pleadings on behalf of the Petitioner in "${cTitle}" under Article 32 of Constitution`;
      generatedClauses = [
        `STATEMENT OF JURISDICTION: The Petitioner approaches this Hon’ble ${court} under Article 32 of the Constitution of Indica, challenging arbitrary surveillance and telemetry directives promulgated in the context of ${moot}.`,
        `STATEMENT OF FACTS: Arising out of "${cTitle}", the Government enacted mandatory data retention protocols compelling telecom service providers to store biometric and telemetry records for 5 years without prior judicial warrant or statutory authorization.`,
        `ARGUMENT ADVANCED — ISSUE 1: The impugned executive circular fails the four-pronged proportionality test laid down in K.S. Puttaswamy (Privacy 9J) v. Union of India and Modern Dental College, lacking legitimate state purpose and least-intrusive alternative design.`,
        `ARGUMENT ADVANCED — ISSUE 2: The executive regulations infringe procedural due process under Articles 14 and 21, being manifestly arbitrary and devoid of independent supervisory safeguards.`
      ];
      generatedUltimatum = `PRAYER: Wherefore, in the light of the facts stated, authorities cited, and arguments advanced, the Petitioner (Team [${tCode}]) respectfully prays that this Hon’ble Court declare the impugned regulations ultra vires Articles 14, 19, and 21, and quash the enforcement circular.`;
      generatedSignOff = `Respectfully Submitted,\nCounsels for the Petitioner (Team [${tCode}])`;
    } else if (selectedTemplate.id === 'legal-notice-rent') {
      const recipient = formValues.recipient || '[Tenant Name]';
      const address = formValues.address || '[Property Address]';
      const amount = formValues.amount ? `₹ ${formValues.amount}/-` : '₹ [Amount]/-';
      const agDate = formValues.date || '[Agreement Date]';

      generatedHeading = 'LEGAL NOTICE';
      generatedTo = `${recipient}\nResiding at: ${address}`;
      generatedSubject = `Notice of Demand under Section 106 Transfer of Property Act regarding outstanding rent of ${amount}`;
      generatedClauses = [
        `1. That my client is the absolute lawful owner and landlord of the residential premises situated at ${address}.`,
        `2. That you were inducted as a tenant into the said premises under a valid rent agreement dated ${agDate}, covenanting to pay monthly rent regularly.`,
        `3. That you have persistently defaulted in payment of rent, and an aggregate sum of ${amount} is currently due, payable, and unlawfully withheld despite repeated demands.`,
        `4. That your continuing failure to remit arrears constitutes a material breach of tenancy covenants causing severe pecuniary loss to my client.`
      ];
      generatedUltimatum = `You are hereby called upon to pay the entire outstanding amount of ${amount} within 15 (Fifteen) days from the date of receipt of this notice, failing which my client shall be constrained to initiate formal recovery and eviction proceedings against you.`;
      generatedSignOff = `[Advocate Name]\nCounsel for the Landlord`;
    } else if (selectedTemplate.id === 'citizen-security-deposit') {
      const landlord = formValues.landlord || '[Landlord Name]';
      const flat = formValues.flat || '[Rented Premises Address]';
      const deposit = formValues.depositAmount ? `₹ ${formValues.depositAmount}/-` : '₹ 75,000/-';
      const vacate = formValues.vacateDate || '[Vacate Date]';

      generatedHeading = 'FORMAL NOTICE FOR RETURN OF SECURITY DEPOSIT';
      generatedTo = `${landlord}\nOwner / Lessor`;
      generatedSubject = `Urgent demand for immediate refund of interest-free security deposit of ${deposit}`;
      generatedClauses = [
        `1. That I was the bona fide tenant of your flat situated at ${flat}, having peacefully vacated and handed over vacant physical possession along with keys on ${vacate}.`,
        `2. That all utility bills, society maintenance charges, and rental obligations have been paid in full with zero pending arrears.`,
        `3. That despite joint physical inspection verifying the premises in good tenable condition, the interest-free security deposit amounting to ${deposit} remains unlawfully withheld without any justification.`
      ];
      generatedUltimatum = `I hereby request and demand that you remit the complete deposit amount of ${deposit} to my bank account within 7 days, failing which I shall be compelled to initiate civil recovery and consumer grievance proceedings before the appropriate forum.`;
      generatedSignOff = `[Tenant Name]\nFormer Tenant & Verified Citizen`;
    } else {
      // Default: replace placeholders with form values
      generatedClauses = selectedTemplate.bodyClauses.map((clause) => {
        let text = clause;
        Object.entries(formValues).forEach(([k, v]) => {
          if (v) text = text.replace(new RegExp(`\\[CONFIRM:?\\s*${k}?\\]`, 'gi'), v);
        });
        return text.replace(/\[CONFIRM:[^\]]+\]/g, 'Confirmed');
      });
    }

    // Call backend API if online
    try {
      const apiRes = await api.generateDraft({
        documentType: selectedTemplate.category,
        facts: formValues,
        templateId: selectedTemplate.id,
        customInstructions: selectedTemplate.title
      });
      if (apiRes.success && apiRes.data) {
        if (apiRes.data.heading) generatedHeading = apiRes.data.heading;
        if (apiRes.data.subject) generatedSubject = apiRes.data.subject;
        if (apiRes.data.toPlaceholder) generatedTo = apiRes.data.toPlaceholder;
        if (Array.isArray(apiRes.data.bodyClauses) && apiRes.data.bodyClauses.length > 0) {
          generatedClauses = apiRes.data.bodyClauses;
        }
        if (apiRes.data.ultimatum) generatedUltimatum = apiRes.data.ultimatum;
        if (apiRes.data.signOffTitle) generatedSignOff = apiRes.data.signOffTitle;
      }
    } catch (err) {
      console.warn('API draft generation fallback to local synthesis', err);
    }

    // Update live Canvas State
    setDraftHeading(generatedHeading);
    setDraftSubject(generatedSubject);
    setDraftTo(generatedTo);
    setDraftClauses(generatedClauses);
    setDraftUltimatum(generatedUltimatum);
    setDraftSignOff(generatedSignOff);
    setDraftDate(todayDate);
    setIsDraftGenerated(true);
    setIsGenerating(false);
    setSaveStatus('Draft generated just now');

    // Save in saved drafts
    const existingIndex = savedDrafts.findIndex((d) => d.title === docTitle);
    const updatedDraft: SavedDraftItem = {
      id: existingIndex >= 0 ? savedDrafts[existingIndex].id : `draft-${Date.now()}`,
      title: docTitle,
      category: selectedTemplate.category,
      role: currentRole,
      lastEdited: 'Just now',
      wordsCount: [generatedHeading, generatedSubject, ...generatedClauses, generatedUltimatum].join(' ').split(/\s+/).filter(Boolean).length,
      preview: `${generatedSubject} for ${Object.values(formValues)[0] || 'Client'}`,
      templateId: selectedTemplate.id,
      heading: generatedHeading,
      subject: generatedSubject,
      bodyClauses: generatedClauses,
      ultimatum: generatedUltimatum,
      signOffTitle: generatedSignOff
    };

    let newDraftsList: SavedDraftItem[];
    if (existingIndex >= 0) {
      newDraftsList = [...savedDrafts];
      newDraftsList[existingIndex] = updatedDraft;
    } else {
      newDraftsList = [updatedDraft, ...savedDrafts];
    }
    persistDrafts(newDraftsList);

    const newMsg = {
      id: Date.now().toString(),
      sender: 'ai' as const,
      text: `Draft successfully generated for ${selectedTemplate.title}. Verified statutory clauses and terms have been inserted into the canvas with your specified details.`,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, newMsg]);
    setActiveMobileView('canvas');
  };

  // Handle bottom prompt submission
  const handleSendPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const promptText = chatInput.trim();
    if (!promptText) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user' as const,
      text: promptText,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setSaveStatus('DraftMate is thinking...');

    const pLower = promptText.toLowerCase();

    // Check if user is asking to draft something specific (e.g. "draft me petetion for public park", "write a complaint about price hike from landlord")
    const isPriceHike = pLower.includes('hike') || pLower.includes('hick') || pLower.includes('price') || pLower.includes('escalat') || pLower.includes('increase rent') || pLower.includes('illegal rent') || (pLower.includes('complaint') && (pLower.includes('landlord') || pLower.includes('rent')));
    const isPark = pLower.includes('park') || pLower.includes('public park') || pLower.includes('environment') || pLower.includes('encroachment');

    if (isPriceHike) {
      // Generate Landlord Rent / Price Hike Complaint & Legal Notice
      const newTitle = 'Notice & Objection — Arbitrary Rent Increase by Landlord';
      const newHeading = 'FORMAL LEGAL NOTICE & STATUTORY OBJECTION AGAINST UNLAWFUL RENT HIKE';
      const newTo = 'TO,\n[Landlord / Property Owner Full Name]\n[Landlord Residence Address / Property Owner]';
      const newSubject = 'FORMAL LEGAL NOTICE AND OBJECTION AGAINST UNILATERAL AND ARBITRARY RENT ESCALATION IN VIOLATION OF SUBSISTING TENANCY AGREEMENT AND RENT CONTROL FRAMEWORK';
      const newClauses = [
        '1. LAWFUL TENANCY STATUS: That the undersigned is a bona fide lawful tenant residing at Flat / Premises situated at [Demised Premises Address] pursuant to a valid and subsisting Tenancy Agreement dated [Agreement Date], with monthly rent mutually fixed at ₹ [Contracted Rent]/- per month.',
        '2. UNILATERAL AND ARBITRARY ESCALATION: That your recent demand demanding an arbitrary price hike and rent escalation during the ongoing tenancy period is completely unilateral, unconscionable, and in direct contravention of the express terms of the agreement and statutory rent regulations.',
        '3. STATUTORY INFRACTION: That under the settled principles of the Model Tenancy Framework and applicable Rent Control jurisprudence, a landlord cannot unilaterally hike rent or threaten eviction without complying with statutory notice periods and contracted escalation caps.',
        '4. PUNCTUAL COMPLIANCE BY TENANT: That the tenant has consistently paid the contracted monthly rent on time without default, and any threat of dispossession, disturbance of peaceful possession, or disconnection of essential utilities (water, electricity, maintenance) is strictly illegal and actionable under civil and criminal law.'
      ];
      const newUltimatum = 'TAKE NOTICE that you are hereby called upon to withdraw the arbitrary rent hike demand within 7 (Seven) days of receipt of this notice and continue accepting the lawfully contracted rent, failing which the undersigned will initiate civil injunction proceedings before the Competent Civil Court and lodge a complaint before the Rent Authority at your risk and cost.';
      const newSignOff = 'Yours faithfully,\n[Tenant Name]\nLawful Tenant in Peaceful Occupation';

      setDocTitle(newTitle);
      setDraftHeading(newHeading);
      setDraftTo(newTo);
      setDraftSubject(newSubject);
      setDraftClauses(newClauses);
      setDraftUltimatum(newUltimatum);
      setDraftSignOff(newSignOff);
      setDraftDate(new Date().toLocaleDateString('en-IN'));
      setIsDraftGenerated(true);
      setSaveStatus('Rent Hike Objection Generated');

      api.saveDraft({
        id: `draft-${Date.now()}`,
        title: newTitle,
        category: 'Tenancy Grievance',
        role: currentRole,
        heading: newHeading,
        subject: newSubject,
        bodyClauses: newClauses,
        ultimatum: newUltimatum,
        signOffTitle: newSignOff
      }).catch(() => {});

      setTimeout(() => {
        const aiReply = {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          text: 'I have generated a formal Statutory Legal Notice & Objection against the arbitrary price/rent hike from your landlord. The draft invokes statutory protections under the Model Tenancy framework, protects against coercive eviction, and places your formal refusal on record. The document canvas on the left has been updated with the full legal notice.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
        setActiveMobileView('canvas');
      }, 400);

    } else if (isPark) {
      // Generate Public Park PIL
      const newTitle = 'Public Interest Litigation — Protection of Public Park';
      const newHeading = 'IN THE HON’BLE HIGH COURT OF JUDICATURE\n(ORIGINAL WRIT JURISDICTION — PUBLIC INTEREST LITIGATION)';
      const newTo = 'TO,\nTHE HON’BLE CHIEF JUSTICE AND COMPANION JUSTICES OF THE HON’BLE HIGH COURT';
      const newSubject = 'WRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA SEEKING REMOVAL OF ENCROACHMENTS AND PRESERVATION OF PUBLIC RECREATIONAL PARK LAND';
      const newClauses = [
        '1. STATEMENT OF JURISDICTION: The Petitioner, a concerned resident and citizen, invokes the extraordinary writ jurisdiction of this Hon’ble Court under Article 226 of the Constitution of India in public interest for the preservation, maintenance, and ecological restoration of municipal public park space.',
        '2. STATEMENT OF FACTS: That the demarcated public park situated within the municipal zone, reserved exclusively for recreational and environmental purposes under the Master Development Plan, has been subjected to illegal commercial encroachment, debris dumping, and systemic municipal neglect.',
        '3. LEGAL GROUNDS — PUBLIC TRUST DOCTRINE: That in Bangalore Medical Trust v. B.S. Muddappa (1991) 4 SCC 54 and M.C. Mehta v. Kamal Nath (1997) 1 SCC 388, the Hon’ble Supreme Court firmly held that open public spaces and parks are held by public authorities in solemn trust for the public and cannot be alienated, encroached, or diverted for non-park uses.',
        '4. VIOLATION OF FUNDAMENTAL RIGHTS: That deprivation and degradation of designated green lung areas violates the Right to a Clean, Wholesome Environment and Healthy Living guaranteed as a core facet of the Right to Life under Article 21 of the Constitution.',
        '5. REPRESENTATIONS UNHEEDED: That despite multiple detailed written representations submitted to the Municipal Commissioner and Development Authority, no anti-encroachment or sanitization drives have been initiated.'
      ];
      const newUltimatum = 'PRAYER: Wherefore, in the light of the above facts, the Petitioner respectfully prays that this Hon’ble Court be pleased to issue a Writ of Mandamus or other appropriate direction directing the Respondent Authorities to immediately remove all illegal encroachments, restore the green canopy and boundary fences of the public park, and institute routine judicial compliance monitoring.';
      const newSignOff = 'Respectfully Submitted,\nCounsel for the Petitioner\nAdvocate in Public Interest';

      setDocTitle(newTitle);
      setDraftHeading(newHeading);
      setDraftTo(newTo);
      setDraftSubject(newSubject);
      setDraftClauses(newClauses);
      setDraftUltimatum(newUltimatum);
      setDraftSignOff(newSignOff);
      setDraftDate(new Date().toLocaleDateString('en-IN'));
      setIsDraftGenerated(true);
      setSaveStatus('Public Park Petition Generated');

      api.saveDraft({
        id: `draft-${Date.now()}`,
        title: newTitle,
        category: 'Public Interest Litigation',
        role: currentRole,
        heading: newHeading,
        subject: newSubject,
        bodyClauses: newClauses,
        ultimatum: newUltimatum,
        signOffTitle: newSignOff
      }).catch(() => {});

      setTimeout(() => {
        const aiReply = {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          text: 'I have drafted a comprehensive Public Interest Litigation (PIL) under Article 226 of the Constitution of India for the protection and removal of encroachments from the public park. The draft invokes the Public Trust Doctrine (citing Bangalore Medical Trust v. B.S. Muddappa and M.C. Mehta) and fundamental rights under Article 21. The document canvas on the left has been updated with the complete pleading and prayer.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
        setActiveMobileView('canvas');
      }, 400);

    } else if (pLower.startsWith('add clause') || pLower.startsWith('add a clause') || pLower.includes('add clause')) {
      const clauseText = promptText.replace(/add\s+(a\s+)?clause\s*(:|-)?\s*/i, '').trim();
      const newClauses = [...draftClauses, `CLAUSE ${draftClauses.length + 1}: ${clauseText}`];
      setDraftClauses(newClauses);
      setSaveStatus('Clause added');

      setTimeout(() => {
        const aiReply = {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          text: `Added new clause to the draft: "${clauseText}". The canvas has been updated.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
      }, 400);

    } else {
      // Dynamic General Drafting / Revision Handler
      try {
        const draftRes = await api.generateDraft({
          customInstructions: promptText,
          documentType: selectedTemplate.category,
          facts: formValues
        });

        if (draftRes.success && draftRes.data) {
          const draftData = draftRes.data.draft || draftRes.data;
          const updatedHeading = draftData.heading || draftHeading;
          const updatedSubject = draftData.subject || `Pleadings regarding ${promptText.slice(0, 50)}`;
          const updatedClauses = Array.isArray(draftData.bodyClauses) && draftData.bodyClauses.length > 0 
            ? draftData.bodyClauses 
            : [
                `1. That the Claimant hereby places on record the material facts and statutory grounds concerning ${promptText}.`,
                `2. That the applicable statutory provisions under Indian law have been duly reviewed, and the opposite party is bound to comply with the relevant contractual and legal covenants.`,
                `3. That the Claimant reserves all statutory rights to initiate formal legal proceedings before the competent court of law.`
              ];
          const updatedUltimatum = draftData.ultimatum || draftUltimatum;
          const updatedSignOff = draftData.signOffTitle || draftSignOff;

          setDraftHeading(updatedHeading);
          setDraftSubject(updatedSubject);
          setDraftClauses(updatedClauses);
          setDraftUltimatum(updatedUltimatum);
          setDraftSignOff(updatedSignOff);
          setDraftDate(new Date().toLocaleDateString('en-IN'));
          setIsDraftGenerated(true);
          setSaveStatus('Canvas updated with AI draft');

          const aiReply = {
            id: (Date.now() + 1).toString(),
            sender: 'ai' as const,
            text: `I have processed your instruction: "${promptText}". The document canvas on the left has been updated with the relevant legal provisions, customized clauses, and statutory notice terms.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, aiReply]);
          setActiveMobileView('canvas');
        } else {
          // Dynamic client-side synthesis fallback
          const newTopic = promptText.length > 50 ? `${promptText.slice(0, 50)}...` : promptText;
          const synthesizedClauses = [
            `1. That this notice is formally addressed regarding "${promptText}", setting forth the material facts and legal claims of the aggrieved party.`,
            `2. That your ongoing actions constitute a direct infraction of contractual good faith and applicable statutory protections.`,
            `3. That you are strictly called upon to cease and desist from unlawful conduct and remedy the grievances within 15 days.`
          ];
          setDraftSubject(`Formal Legal Notice regarding ${newTopic}`);
          setDraftClauses(synthesizedClauses);
          setDraftDate(new Date().toLocaleDateString('en-IN'));
          setIsDraftGenerated(true);
          setSaveStatus('Canvas updated');

          const aiReply = {
            id: (Date.now() + 1).toString(),
            sender: 'ai' as const,
            text: `Understood your instruction: "${promptText}". I have drafted customized clauses and refreshed the document canvas on the left to reflect this topic.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, aiReply]);
          setActiveMobileView('canvas');
        }
      } catch (err) {
        const synthesizedClauses = [
          `1. That this formal communication concerns "${promptText}", placing on record the grievance of the Claimant.`,
          `2. That the opposite party's conduct is without legal justification and violates subsisting covenants.`,
          `3. That immediate compliance is demanded within 15 days, failing which legal proceedings shall ensue.`
        ];
        setDraftSubject(`Notice regarding ${promptText.slice(0, 40)}`);
        setDraftClauses(synthesizedClauses);
        setDraftDate(new Date().toLocaleDateString('en-IN'));
        setIsDraftGenerated(true);
        setSaveStatus('Canvas updated');

        const aiReply = {
          id: (Date.now() + 1).toString(),
          sender: 'ai' as const,
          text: `Understood. I have drafted custom clauses for "${promptText}" and updated the document canvas on the left.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
        setActiveMobileView('canvas');
      }
    }
  };

  return (
    <div className={`flex-1 flex flex-col min-h-screen bg-[#FAF8F5] text-[#0F172A] relative select-text ${isFullscreen ? 'fixed inset-0 z-50 overflow-y-auto' : ''}`}>
      
      {/* ----------------------------------------------------------------------- */}
      {/* 1. TOP HEADER BAR WITH ROLE SELECTOR                                     */}
      {/* ----------------------------------------------------------------------- */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/95 backdrop-blur-md border-b border-[#EAE3D6] px-4 sm:px-8 py-2.5 flex items-center justify-between gap-4">
        
        {/* Centered Search Bar with Shortcut '/' */}
        <div className="flex-1 max-w-xl mx-auto">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-[#8C7355] absolute left-3.5 pointer-events-none" />
            <input
              id="drafting-search-input"
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
              <div className="absolute right-0 mt-2 w-56 bg-white border border-[#DECDB8] rounded-2xl shadow-xl py-2 z-50 text-xs">
                <div className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-b border-slate-100">
                  Select User Perspective
                </div>
                {[
                  { r: 'advocate' as const, label: 'Advocate (Litigation & High Court)', icon: <Briefcase className="w-4 h-4" /> },
                  { r: 'citizen' as const, label: 'Citizen (Plain Language Drafts)', icon: <UserCheck className="w-4 h-4" /> },
                  { r: 'firm' as const, label: 'Law Firm (Corporate Contracts)', icon: <Users className="w-4 h-4" /> },
                  { r: 'student' as const, label: 'Law Student (Moot & Academics)', icon: <GraduationCap className="w-4 h-4" /> },
                ].map((item) => (
                  <button
                    key={item.r}
                    type="button"
                    onClick={() => handleRoleChange(item.r)}
                    className={`w-full text-left px-3.5 py-2 flex items-center gap-2.5 hover:bg-[#FAF5EB] transition-colors cursor-pointer ${
                      currentRole === item.r ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                    }`}
                  >
                    <span className={currentRole === item.r ? 'text-[#1E3A8A]' : 'text-slate-500'}>
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
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
                  <span className="text-xs font-bold text-[#0F172A]">Drafting Notifications</span>
                  <span className="text-[10px] bg-[#EBF2FC] text-[#1E3A8A] font-semibold px-2 py-0.5 rounded-full">New</span>
                </div>
                <div className="py-2.5 text-xs">
                  <p className="font-semibold text-[#0F172A]">Draftmate AI Ready</p>
                  <p className="text-[#64748B] text-[11px] mt-0.5">Use the prompt bar or questionnaire to generate clauses effortlessly.</p>
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
              <span className="text-[10px] text-[#64748B]">{userRoleText}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:inline" />
          </div>
        </div>
      </header>

      {/* ----------------------------------------------------------------------- */}
      {/* 2. DRAFTING STUDIO MAIN CANVAS                                          */}
      {/* ----------------------------------------------------------------------- */}
      <main className="p-3 sm:p-5 md:p-6 lg:p-7 space-y-5 max-w-[1700px] w-full mx-auto flex-1 flex flex-col">
        
        {/* ===================================================================== */}
        {/* 2A. TOP BANNER: Title, Subtitle, Justinian Quote & Supreme Court Dome */}
        {/* ===================================================================== */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 sm:p-6 lg:px-8 lg:py-6 bg-[#F4ECE1] border border-[#DECDB8] rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          
          {/* Left: Title + Tagline */}
          <div className="z-10">
            {/* Title */}
            <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-[42px] font-bold text-[#0F172A] tracking-tight leading-none">
              Drafting Studio
            </h1>

            {/* Gold Underline Accent + Subtitle */}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="w-10 h-[2.5px] bg-[#C59B58] rounded-full inline-block" />
              <p className="text-xs sm:text-sm text-[#475569] font-normal">
                Prepare, review and refine legal documents with AI assistance.
              </p>
            </div>
          </div>

          {/* Right: Justinian Legal Quote & Supreme Court Dome Illustration */}
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

            {/* Supreme Court Dome Graphic - Seamlessly Integrated as Part of the Box */}
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
        {/* ===================================================================== */}
        {/* VIEW 1: TWO CARDS STARTER INTAKE SCREEN (When viewMode === 'entry')   */}
        {/* ===================================================================== */}
        {viewMode === 'entry' && (
          <div className="space-y-6 pt-4 animate-in fade-in duration-200">
            
            <div className="text-left">
              <h2 className="text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                How would you like to start?
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                Choose between guided AI generation or continuing existing work.
              </p>
            </div>

            {/* The 2 Primary Starter Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
              
              {/* Card 1: Create New Draft (AI-POWERED) */}
              <div 
                onClick={handleCreateNewDraft}
                className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-[#1E3A8A]/40 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center font-bold shadow-2xs group-hover:scale-105 transition-transform">
                      <Plus className="w-5 h-5 stroke-[2.5]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-[#2563EB] bg-[#EFF6FF] border border-[#BFDBFE] px-2.5 py-1 rounded-full uppercase">
                      AI-POWERED
                    </span>
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-[#0F172A] mt-5 group-hover:text-[#1E3A8A] transition-colors">
                    Create New Draft
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed">
                    Start a fresh document with interactive AI generation or select multi-document synthesis.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] group-hover:translate-x-1 transition-transform">
                  <span>Start with AI</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* Card 2: Work on Existing Document (WORD COMPATIBLE) */}
              <div 
                onClick={() => setViewMode('existing_list')}
                className="bg-white rounded-2xl sm:rounded-3xl border border-[#E2E8F0] p-6 sm:p-7 shadow-xs hover:shadow-md hover:border-[#059669]/40 transition-all cursor-pointer flex flex-col justify-between min-h-[220px] group"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <div className="w-11 h-11 rounded-xl bg-[#ECFDF5] border border-[#A7F3D0] text-[#059669] flex items-center justify-center shadow-2xs group-hover:scale-105 transition-transform">
                      <UploadCloud className="w-5 h-5 stroke-[2]" />
                    </div>
                    <span className="text-[10px] font-bold tracking-wider text-[#059669] bg-[#ECFDF5] border border-[#A7F3D0] px-2.5 py-1 rounded-full uppercase">
                      WORD COMPATIBLE
                    </span>
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-[#0F172A] mt-5 group-hover:text-[#059669] transition-colors">
                    Work on Existing Document
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed">
                    Upload a `.docx` or `.pdf` file to seamlessly continue your work in a fully collaborative, Word-compatible editor.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#059669] group-hover:translate-x-1 transition-transform">
                  <span>Browse {savedDrafts.length} Saved Drafts &amp; Upload</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>

            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 2: EXISTING DRAFTS MANAGER (When viewMode === 'existing_list')   */}
        {/* ===================================================================== */}
        {viewMode === 'existing_list' && (
          <div className="space-y-5 pt-2 animate-in fade-in duration-200">
            
            {/* Header with Back Button */}
            <div className="flex flex-wrap items-center justify-between gap-3 pb-2 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setViewMode('entry')}
                  className="p-2 rounded-xl bg-white border border-[#DECDB8] text-slate-600 hover:text-slate-900 hover:bg-[#FAF5EB] transition-colors cursor-pointer shadow-2xs"
                  title="Back to starter options"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold font-serif-title text-[#0F172A]">
                    Existing Documents & Created Drafts
                  </h2>
                  <p className="text-xs text-[#64748B]">
                    Select any saved draft to resume editing or upload an external document.
                  </p>
                </div>
              </div>

              {/* Action Buttons: New or Upload */}
              <div className="flex items-center gap-2.5">
                <label className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-[#0F172A] rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer">
                  <UploadCloud className="w-4 h-4 text-[#059669]" />
                  <span>Upload .docx / .pdf</span>
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf"
                    onChange={handleSimulateUpload}
                    className="hidden"
                  />
                </label>

                <button
                  type="button"
                  onClick={handleCreateNewDraft}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white rounded-xl text-xs font-semibold shadow-sm transition-colors cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Draft</span>
                </button>
              </div>
            </div>

            {/* Search Filter for Drafts */}
            <div className="relative max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={draftSearchQuery}
                onChange={(e) => setDraftSearchQuery(e.target.value)}
                placeholder="Filter saved drafts by title or keyword..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#DECDB8] rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A]"
              />
            </div>

            {/* List of Existing Drafts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {savedDrafts
                .filter((d) => 
                  d.title.toLowerCase().includes(draftSearchQuery.toLowerCase()) ||
                  d.category.toLowerCase().includes(draftSearchQuery.toLowerCase()) ||
                  d.preview.toLowerCase().includes(draftSearchQuery.toLowerCase())
                )
                .map((draft) => (
                  <div
                    key={draft.id}
                    className="bg-white rounded-2xl border border-[#DECDB8] hover:border-[#1E3A8A]/50 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-sm sm:text-base text-[#0F172A] group-hover:text-[#1E3A8A] transition-colors">
                              {draft.title}
                            </h3>
                            <span className="text-[10px] font-semibold text-[#8C7355] bg-[#FAF5EB] px-2 py-0.5 rounded-md inline-block mt-0.5">
                              {draft.category} · {draft.role}
                            </span>
                          </div>
                        </div>

                        <span className="text-[11px] text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{draft.lastEdited}</span>
                        </span>
                      </div>

                      <p className="text-xs text-[#64748B] mt-3 leading-relaxed line-clamp-2">
                        {draft.preview}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#F1EAE0] flex items-center justify-between">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {draft.wordsCount} words
                      </span>
                      <button
                        type="button"
                        onClick={() => handleOpenExistingDraft(draft)}
                        className="px-4 py-1.5 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs font-semibold rounded-lg shadow-2xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <span>Open &amp; Edit</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>

            {/* Upload Box Dropzone */}
            <div className="border-2 border-dashed border-[#DECDB8] rounded-2xl p-7 text-center bg-white flex flex-col items-center justify-center">
              <UploadCloud className="w-9 h-9 text-[#8C7355] mb-2 opacity-80" />
              <h4 className="text-sm font-bold text-[#0F172A]">Need to work on a Word file from your computer?</h4>
              <p className="text-xs text-[#64748B] mt-1 max-w-md">
                Upload `.docx`, `.doc`, or `.pdf` to convert into an interactive draft with AI revision tools.
              </p>
              <label className="mt-3.5 px-4 py-2 bg-[#FAF8F5] border border-[#DECDB8] hover:border-[#1E3A8A] text-[#1E3A8A] text-xs font-semibold rounded-xl cursor-pointer transition-colors shadow-2xs">
                <span>Select file from device</span>
                <input
                  type="file"
                  accept=".docx,.doc,.pdf"
                  onChange={handleSimulateUpload}
                  className="hidden"
                />
              </label>
            </div>

          </div>
        )}

        {/* ===================================================================== */}
        {/* VIEW 3: THE ACTIVE DRAFTING STUDIO (When viewMode === 'editor')        */}
        {/* ===================================================================== */}
        {viewMode === 'editor' && (
          <div className="space-y-4 animate-in fade-in duration-200 flex-1 flex flex-col">
            
            {/* ----------------------------------------------------------------- */}
            {/* DOCUMENT ACTIONS TOOLBAR STRIP                                    */}
            {/* ----------------------------------------------------------------- */}
            <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:px-4 bg-[#F4ECE1] border border-[#DECDB8] rounded-2xl shadow-2xs">
              
              {/* Left Group: Back to Drafts + Amber Icon + Title + Template/Type Pill + Saved Status */}
              <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
                
                {/* Back to Drafts Selector Button */}
                <button
                  type="button"
                  onClick={() => setViewMode('entry')}
                  className="p-1.5 px-2 bg-white border border-[#DECDB8] rounded-xl text-xs font-medium text-slate-700 hover:bg-[#FAF5EB] transition-colors flex items-center gap-1.5 shadow-2xs cursor-pointer"
                  title="Back to document selector"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">All Drafts</span>
                </button>

                {/* Amber File Icon */}
                <div className="w-8 h-8 rounded-lg bg-[#FEF3C7] border border-[#FDE68A] flex items-center justify-center text-[#D97706] shadow-2xs">
                  <FileText className="w-4 h-4" />
                </div>

                {/* Document Title (Editable) */}
                <div className="flex items-center gap-1.5">
                  {isEditingTitle ? (
                    <div className="flex items-center gap-1">
                      <input
                        type="text"
                        value={docTitle}
                        onChange={(e) => setDocTitle(e.target.value)}
                        className="text-sm sm:text-base font-bold text-[#0F172A] bg-white border border-[#CBD5E1] rounded-lg px-2 py-0.5 focus:outline-none focus:border-[#1E3A8A]"
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={() => setIsEditingTitle(false)}
                        className="p-1 text-emerald-600 hover:text-emerald-700 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5 group">
                      <h2 className="text-sm sm:text-base font-bold text-[#0F172A]">
                        {docTitle}
                      </h2>
                      <button
                        type="button"
                        onClick={() => setIsEditingTitle(true)}
                        className="text-slate-400 hover:text-slate-700 p-0.5 rounded cursor-pointer transition-colors"
                        title="Edit Title"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Document Type / Template Dropdown Pill */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setTemplatePickerOpen(!templatePickerOpen)}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-[#DECDB8] rounded-xl text-xs font-medium text-[#0F172A] shadow-2xs hover:bg-[#FAF8F5] transition-all cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5 text-[#1E3A8A]" />
                    <span>{selectedTemplate.skillName}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {templatePickerOpen && (
                    <div className="absolute left-0 mt-1.5 w-72 bg-white border border-[#DECDB8] rounded-2xl shadow-xl py-2 z-40 text-xs max-h-80 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Switch Document Template
                      </div>
                      {MASTER_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tmpl)}
                          className={`w-full text-left px-3.5 py-2 hover:bg-[#FAF5EB] transition-colors flex items-center justify-between cursor-pointer ${
                            selectedTemplate.id === tmpl.id ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{tmpl.title}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{tmpl.category} · {tmpl.role}</p>
                          </div>
                          {selectedTemplate.id === tmpl.id && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Right Group: Language Translation */}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Translate to Regional Language"
                >
                  <Languages className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Translate</span>
                </button>
              </div>

            </div>

            {/* ----------------------------------------------------------------- */}
            {/* MOBILE SCREEN SWITCHER TABS (Responsive < 1024px)                 */}
            {/* ----------------------------------------------------------------- */}
            <div className="lg:hidden flex items-center bg-white p-1 rounded-xl border border-[#DECDB8] shadow-2xs">
              <button
                type="button"
                onClick={() => setActiveMobileView('canvas')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMobileView === 'canvas' ? 'bg-[#1E3A8A] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Document Canvas
              </button>
              <button
                type="button"
                onClick={() => setActiveMobileView('ai')}
                className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                  activeMobileView === 'ai' ? 'bg-[#1E3A8A] text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Assistant
              </button>
            </div>

            {/* ----------------------------------------------------------------- */}
            {/* 2-COLUMN WORKSPACE: EXPANDED CANVAS (LEFT) + AI ASSISTANT (RIGHT) */}
            {/* ----------------------------------------------------------------- */}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start">
              
              {/* Central Document Canvas (Left & Center: 8 cols on desktop) */}
              <div className={`lg:col-span-7 xl:col-span-8 bg-white rounded-2xl border border-[#EAE3D6] shadow-2xs flex flex-col overflow-hidden h-[820px] ${
                activeMobileView === 'canvas' ? 'block' : 'hidden lg:flex'
              }`}>
                
                {/* Document Formatting Ribbon Toolbar */}
                <div className="px-4 py-2 border-b border-[#F0E9DF] flex items-center justify-between gap-1 text-slate-700 overflow-x-auto select-none bg-white">
                  
                  {/* Style Dropdown & Basic Styling */}
                  <div className="flex items-center gap-1.5">
                    {/* Normal Text Dropdown */}
                    <button
                      type="button"
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium hover:bg-slate-50 transition-colors"
                    >
                      <span>Normal Text</span>
                      <ChevronDown className="w-3 h-3 text-slate-400" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Bold, Italic, Underline */}
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Bold">
                      <Bold className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Italic">
                      <Italic className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Underline">
                      <Underline className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Text Alignment */}
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Align Left">
                      <AlignLeft className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Align Center">
                      <AlignCenter className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Align Right">
                      <AlignRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1" />

                    {/* Lists & Link */}
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Bullet List">
                      <List className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Numbered List">
                      <ListOrdered className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="Insert Link">
                      <Link2 className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" className="p-1 hover:bg-slate-100 rounded text-slate-700 cursor-pointer" title="More Options">
                      <MoreHorizontal className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* Fullscreen Expand Button */}
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(!isFullscreen)}
                    className="p-1 text-slate-400 hover:text-slate-700 rounded transition-colors cursor-pointer"
                    title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
                  >
                    {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
                  </button>
                </div>

                {/* Document Paper Container (Realistic Parchment View - Expanded Width) */}
                <div className="p-4 sm:p-6 md:p-8 bg-[#F5F2EA] flex-1 overflow-y-auto flex justify-center">
                  
                  {/* The White A4 Paper Sheet (Generously Sized max-w-[860px]) */}
                  <div className="w-full max-w-[860px] bg-white rounded-xl shadow-md border border-[#E5E0D5] p-6 sm:p-10 md:p-12 relative text-slate-900 text-sm sm:text-[14.5px] leading-relaxed font-serif min-h-[720px] flex flex-col justify-between select-text">
                    
                    {/* Paper Content */}
                    <div>
                      {/* Centered Document Title */}
                      <h3 className="font-serif-title text-center text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#0F172A] mb-8 uppercase whitespace-pre-line">
                        {draftHeading}
                      </h3>

                      {/* Date & Addressee */}
                      <div className="space-y-3.5 mb-6 font-sans">
                        <p className="text-slate-700">
                          <span className="font-semibold">Date:</span>{' '}
                          <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2.5 py-0.5 rounded text-xs font-mono font-semibold">
                            {draftDate || (isDraftGenerated ? new Date().toLocaleDateString('en-IN') : '[MISSING]')}
                          </span>
                        </p>

                        <div className="text-slate-700">
                          <p>To,</p>
                          <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2.5 py-0.5 rounded text-xs font-mono font-semibold inline-block mt-0.5 whitespace-pre-line">
                            {draftTo}
                          </span>
                        </div>

                        <p className="pt-1.5">
                          <span className="font-bold text-[#0F172A] text-base">Subject: {draftSubject}</span>
                        </p>
                      </div>

                      {/* Body Clauses */}
                      <div className="space-y-4 text-slate-800 leading-relaxed font-serif">
                        <ol className="list-decimal pl-6 space-y-3 text-justify">
                          {draftClauses.map((clause, idx) => (
                            <li key={idx} className="leading-relaxed">
                              {clause.split('[CONFIRM:').map((chunk, cIdx) => {
                                if (cIdx === 0) return chunk;
                                const [placeholder, rest] = chunk.split(']');
                                return (
                                  <React.Fragment key={cIdx}>
                                    <span className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-2 py-0.5 rounded text-xs font-mono font-semibold font-sans">
                                      {isDraftGenerated ? 'Confirmed' : `[CONFIRM:${placeholder}]`}
                                    </span>
                                    {rest}
                                  </React.Fragment>
                                );
                              })}
                            </li>
                          ))}
                        </ol>

                        {draftUltimatum && (
                          <p className="text-justify pt-2 font-serif leading-relaxed">
                            {draftUltimatum}
                          </p>
                        )}

                        {/* Sign-off */}
                        <div className="pt-6 font-sans space-y-1">
                          <p className="text-slate-700">Yours faithfully,</p>
                          <p className="font-bold text-[#0F172A] pt-3 text-base whitespace-pre-line">
                            {draftSignOff}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Supreme Court Watermark Inside Paper (Bottom-Right) */}
                    <div className="absolute right-6 bottom-12 w-32 h-32 opacity-10 pointer-events-none select-none mix-blend-multiply">
                      <Image
                        src="/assets/supreme-court-engraving.png"
                        alt="Emblem watermark"
                        fill
                        className="object-contain"
                      />
                    </div>

                    {/* Paper Status Footer */}
                    <div className="mt-8 pt-4 border-t border-[#F0EBE0] flex flex-wrap items-center justify-between text-xs text-slate-500 font-sans">
                      <span>Words: {[draftHeading, draftSubject, draftTo, ...draftClauses, draftUltimatum, draftSignOff].join(' ').split(/\s+/).filter(Boolean).length} · Characters: {[draftHeading, draftSubject, draftTo, ...draftClauses, draftUltimatum, draftSignOff].join(' ').length.toLocaleString()}</span>
                      <span className="italic text-slate-400">
                        {isDraftGenerated ? 'Draft prepared for statutory review' : 'Draft for review · Not yet finalised'}
                      </span>
                    </div>

                  </div>

                </div>

              </div>


              {/* AI Assistant (Right Side: 4 cols on desktop) */}
              <div className={`lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#EAE3D6] shadow-2xs flex flex-col overflow-hidden h-[820px] ${
                activeMobileView === 'ai' ? 'block' : 'hidden lg:flex'
              }`}>
                
                {/* Header */}
                <div className="px-4 py-3 border-b border-[#F0E9DF] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-xs font-bold tracking-wider text-[#0F172A] uppercase">
                      AI ASSISTANT
                    </span>
                  </div>
                  <button type="button" className="text-slate-400 hover:text-slate-600 cursor-pointer">
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>

                {/* Tabs */}
                <div className="px-4 flex items-center gap-4 border-b border-[#F0E9DF] text-xs font-medium select-none">
                  {(['Chat', 'Details', 'Reference', 'Templates'] as const).map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => setAiTab(tab)}
                      className={`py-2.5 transition-all relative cursor-pointer ${
                        aiTab === tab
                          ? 'text-[#1E3A8A] font-bold border-b-2 border-[#1E3A8A] -mb-px'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>

                {/* Tab: Templates View */}
                {aiTab === 'Templates' ? (
                  <div className="p-4 space-y-3 flex-1 overflow-y-auto text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <h4 className="font-bold text-slate-900">Legal Document Templates</h4>
                      <span className="text-[10px] text-slate-400">{MASTER_TEMPLATES.length} available</span>
                    </div>
                    <div className="space-y-2">
                      {MASTER_TEMPLATES.map((tmpl) => (
                        <div
                          key={tmpl.id}
                          onClick={() => {
                            handleSelectTemplate(tmpl);
                            setAiTab('Chat');
                          }}
                          className={`p-3 rounded-xl border transition-all cursor-pointer ${
                            selectedTemplate.id === tmpl.id
                              ? 'bg-[#EBF2FC] border-[#1E3A8A]/40'
                              : 'bg-[#FAF8F5] border-[#DECDB8] hover:border-[#1E3A8A]/40'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#0F172A]">{tmpl.title}</span>
                            <span className="text-[9px] uppercase font-bold px-2 py-0.5 rounded-full bg-white text-[#8C7355] border border-[#DECDB8]">
                              {tmpl.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-500 mt-1">{tmpl.skillDesc}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  /* Chat Body (Scrollable) */
                  <div className="p-4 space-y-3.5 flex-1 overflow-y-auto text-xs">
                    
                    {/* Message 1 from AI */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FAF5EB] border border-[#DECDB8] flex items-center justify-center text-[#8C7355] flex-shrink-0 mt-0.5">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl rounded-tl-sm p-3 text-slate-800 shadow-2xs">
                        <p className="leading-relaxed">
                          Let&apos;s prepare your <strong>{selectedTemplate.title}</strong>. I&apos;ll guide you with a few details to generate a professional draft.
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1.5">10:24 AM</span>
                      </div>
                    </div>

                    {/* Selected Skill Selector Card */}
                    <div className="pl-9 space-y-1">
                      <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                        Selected Skill
                      </label>
                      <div 
                        onClick={() => setTemplatePickerOpen(true)}
                        className="bg-[#F8FAFC] border border-[#CBD5E1] rounded-xl p-2.5 flex items-center justify-between hover:border-[#1E3A8A]/50 cursor-pointer transition-all"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-7 h-7 rounded-lg bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center flex-shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-[#0F172A] leading-tight">{selectedTemplate.skillName}</h4>
                            <p className="text-[11px] text-slate-500 leading-tight">{selectedTemplate.skillDesc}</p>
                          </div>
                        </div>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </div>
                    </div>

                    {/* Message 2 from AI: Prompt for details */}
                    <div className="flex items-start gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#FAF5EB] border border-[#DECDB8] flex items-center justify-center text-[#8C7355] flex-shrink-0 mt-0.5">
                        <Scale className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl rounded-tl-sm p-3 text-slate-800 shadow-2xs">
                        <p className="leading-relaxed font-medium text-[#0F172A]">
                          Please provide the following details:
                        </p>
                        <span className="text-[10px] text-slate-400 block mt-1">10:24 AM</span>
                      </div>
                    </div>

                    {/* Dynamic Interactive Questionnaire Card */}
                    <form onSubmit={handleGenerateDraft} className="pl-9 space-y-2.5">
                      {selectedTemplate.formFields.map((field, idx) => (
                        <div key={field.id} className="space-y-1">
                          <label className="flex items-center gap-1.5 text-xs font-semibold text-[#0F172A]">
                            <span className="w-4 h-4 rounded-full bg-[#F1F5F9] text-slate-600 text-[10px] font-bold flex items-center justify-center">
                              {idx + 1}
                            </span>
                            <span>{field.label}</span>
                            {field.required && <span className="text-red-500">*</span>}
                          </label>
                          <input
                            type="text"
                            value={formValues[field.id] || ''}
                            onChange={(e) => handleInputChange(field.id, e.target.value)}
                            placeholder={field.placeholder}
                            className="w-full px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] transition-all"
                          />
                        </div>
                      ))}

                      {/* Generate Draft Button */}
                      <button
                        type="submit"
                        disabled={isGenerating}
                        className="w-full py-2.5 mt-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-60"
                      >
                        {isGenerating ? (
                          <>
                            <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Generating Tailored Draft...</span>
                          </>
                        ) : (
                          <>
                            <span>Generate Draft</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </form>

                    {/* Dynamic Follow-up Messages */}
                    {messages.slice(1).map((msg) => (
                      <div key={msg.id} className={`flex items-start gap-2.5 ${msg.sender === 'user' ? 'justify-end' : ''}`}>
                        {msg.sender === 'ai' && (
                          <div className="w-7 h-7 rounded-full bg-[#FAF5EB] border border-[#DECDB8] flex items-center justify-center text-[#8C7355] flex-shrink-0 mt-0.5">
                            <Scale className="w-3.5 h-3.5" />
                          </div>
                        )}
                        <div className={`max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-[#1E3A8A] text-white rounded-tr-sm'
                            : 'bg-[#F8FAFC] border border-[#E2E8F0] text-slate-800 rounded-tl-sm shadow-2xs'
                        }`}>
                          <p>{msg.text}</p>
                          <span className={`text-[10px] block mt-1 ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                            {msg.time}
                          </span>
                        </div>
                      </div>
                    ))}

                  </div>
                )}

                {/* Bottom Input Prompt Bar */}
                <form onSubmit={handleSendPrompt} className="p-3 border-t border-[#F0E9DF] bg-[#FAF8F5]/50 flex items-center gap-2">
                  <button
                    type="button"
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
                    title="Attach Document"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask DraftMate to revise, add clauses..."
                    className="flex-1 px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-full text-xs placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim()}
                    className="w-7 h-7 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs flex-shrink-0"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <VoiceDictation
                    onTranscript={(dictated) => setChatInput((prev) => prev + dictated)}
                    buttonLabel="Voice"
                  />
                </form>

              </div>

            </div>

          </div>
        )}

      </main>

      {/* ===================================================================== */}
      {/* MODAL: ENTER DRAFT NAME BEFORE OPENING EDITABLE FILE                 */}
      {/* ===================================================================== */}
      {isNewDraftModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-lg w-full p-6 sm:p-7 relative animate-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setIsNewDraftModalOpen(false)}
              className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Modal Header */}
            <div className="flex items-center gap-3.5 mb-5">
              <div className="w-11 h-11 rounded-2xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center flex-shrink-0 shadow-2xs">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif-title text-xl font-bold text-[#0F172A] tracking-tight">
                  Name Your New Draft
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Enter a title to begin your customized legal document.
                </p>
              </div>
            </div>

            {/* Form */}
            <form onSubmit={handleConfirmCreateNewDraft} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#0F172A] mb-1.5">
                  Draft Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={newDraftTitle}
                  onChange={(e) => setNewDraftTitle(e.target.value)}
                  placeholder="e.g., Legal Notice for Recovery of Dues"
                  className="w-full px-4 py-2.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-sm font-semibold text-[#0F172A] placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] focus:bg-white focus:ring-2 focus:ring-[#1E3A8A]/10 transition-all"
                  autoFocus
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-[#F0E9DF] flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsNewDraftModalOpen(false)}
                  className="px-4 py-2 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!newDraftTitle.trim()}
                  className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                >
                  <span>Create &amp; Start Drafting</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
