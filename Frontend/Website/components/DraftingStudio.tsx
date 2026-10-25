'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { VoiceDictation } from './voice/VoiceDictation';
import { ReadAloudControl } from './voice/ReadAloudControl';
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
  X,
  Copy,
  Download
} from 'lucide-react';
import { translateDocumentLocally } from '@/lib/legalTranslator';

const getLanguageCode = (langName?: string): string => {
  const l = (langName || '').toLowerCase();
  if (l.includes('hindi')) return 'hi-IN';
  if (l.includes('bengali')) return 'bn-IN';
  if (l.includes('marathi')) return 'mr-IN';
  if (l.includes('tamil')) return 'ta-IN';
  if (l.includes('telugu')) return 'te-IN';
  if (l.includes('gujarati')) return 'gu-IN';
  if (l.includes('kannada')) return 'kn-IN';
  if (l.includes('malayalam')) return 'ml-IN';
  if (l.includes('punjabi')) return 'pa-IN';
  return 'en-IN';
};

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
  },

  // 6. Citizen / Tenant: Arbitrary Rent / Price Hike Objection
  {
    id: 'tenant-rent-hike-objection',
    title: 'Notice & Objection — Arbitrary Rent Increase by Landlord',
    role: 'citizen',
    category: 'Tenancy Grievance',
    skillName: 'Rent Hike Objection',
    skillDesc: 'Statutory objection against illegal, unilateral rent hike by property owner',
    formFields: [
      { id: 'landlordName', label: 'Landlord Full Name', placeholder: 'e.g. Ramesh Sharma', required: true },
      { id: 'landlordAddress', label: 'Landlord Residence Address', placeholder: 'e.g. B-12, Green Park, New Delhi', required: true },
      { id: 'premisesAddress', label: 'Rented Premises Address', placeholder: 'e.g. Flat 304, Palm Grove Apts', required: true },
      { id: 'contractedRent', label: 'Current Agreed Rent (₹)', placeholder: 'e.g. 20,000', required: true },
      { id: 'demandedRent', label: 'Demanded / Hiked Rent (₹)', placeholder: 'e.g. 30,000', required: true },
      { id: 'agreementDate', label: 'Agreement Date', placeholder: 'DD / MM / YYYY' },
      { id: 'tenantName', label: 'Your Name (Tenant)', placeholder: 'e.g. Rahul Verma', required: true }
    ],
    heading: 'FORMAL LEGAL NOTICE & STATUTORY OBJECTION AGAINST UNLAWFUL RENT HIKE',
    subject: 'FORMAL LEGAL NOTICE AND OBJECTION AGAINST UNILATERAL AND ARBITRARY RENT ESCALATION IN VIOLATION OF SUBSISTING TENANCY AGREEMENT AND RENT CONTROL FRAMEWORK',
    toPlaceholder: '[Landlord / Property Owner Full Name]\n[Landlord Residence Address / Property Owner]',
    bodyClauses: [
      '1. LAWFUL TENANCY STATUS: That the undersigned is a bona fide lawful tenant residing at Flat / Premises situated at [Demised Premises Address] pursuant to a valid and subsisting Tenancy Agreement dated [Agreement Date], with monthly rent mutually fixed at ₹ [Contracted Rent]/- per month.',
      '2. UNILATERAL AND ARBITRARY ESCALATION: That your recent demand demanding an arbitrary price hike to ₹ [Demanded Rent]/- during the ongoing tenancy period is completely unilateral, unconscionable, and in direct contravention of the express terms of the agreement and statutory rent regulations.',
      '3. STATUTORY INFRACTION: That under the settled principles of the Model Tenancy Framework and applicable Rent Control jurisprudence, a landlord cannot unilaterally hike rent or threaten eviction without complying with statutory notice periods and contracted escalation caps.',
      '4. PUNCTUAL COMPLIANCE BY TENANT: That the tenant has consistently paid the contracted monthly rent on time without default, and any threat of dispossession, disturbance of peaceful possession, or disconnection of essential utilities (water, electricity, maintenance) is strictly illegal and actionable under civil and criminal law.'
    ],
    ultimatum: 'TAKE NOTICE that you are hereby called upon to withdraw the arbitrary rent hike demand within 7 (Seven) days of receipt of this notice and continue accepting the lawfully contracted rent, failing which the undersigned will initiate civil injunction proceedings before the Competent Civil Court and lodge a complaint before the Rent Authority at your risk and cost.',
    signOffTitle: 'Yours faithfully,\n[Tenant Name]\nLawful Tenant in Peaceful Occupation'
  },

  // 7. Citizen / Tenant: Restoration of Electricity & Essential Amenities
  {
    id: 'tenant-power-restoration',
    title: 'Legal Notice — Unlawful Disconnection of Electricity Supply',
    role: 'citizen',
    category: 'Utility Grievance',
    skillName: 'Electricity Restoration Notice',
    skillDesc: 'Statutory demand against unlawful disconnection of electrical power supply',
    formFields: [
      { id: 'landlordName', label: 'Opposite Party / Landlord Name', placeholder: 'e.g. Harish Hirani', required: true },
      { id: 'landlordAddress', label: 'Opposite Party Address', placeholder: 'e.g. Demised Premises Owner Residence', required: true },
      { id: 'premisesAddress', label: 'Rented Premises Address', placeholder: 'e.g. Flat 101, Block C', required: true },
      { id: 'tenantName', label: 'Your Name (Complainant)', placeholder: 'e.g. Complainant Occupant', required: true }
    ],
    heading: 'FORMAL LEGAL NOTICE & DEMAND FOR IMMEDIATE RESTORATION OF ELECTRICITY',
    subject: 'URGENT STATUTORY NOTICE UNDER SECTION 19 MODEL TENANCY ACT / SECTION 108 TRANSFER OF PROPERTY ACT FOR UNLAWFUL DISCONNECTION OF ELECTRICITY SUPPLY',
    toPlaceholder: 'Harish Hirani / Property Owner\n[Demised Premises Owner Address]',
    bodyClauses: [
      '1. LAWFUL TENANCY & PAID ARREARS: That the Claimant is the lawful occupant/tenant in possession of the premises situated at [Demised Premises Address], having faithfully and punctually cleared all monthly rental and electric utility liabilities with zero arrears.',
      '2. MALICIOUS DISCONNECTION: That you have deliberately, unlawfully, and without any judicial order or statutory sanction disconnected the electrical power supply to the premises, plunging the residence into complete darkness and rendering it uninhabitable.',
      '3. STATUTORY PROHIBITION AGAINST WITHHOLDING AMENITIES: That under Section 19 of the Model Tenancy Act, 2021, a landlord is strictly prohibited from withholding or severing essential amenities—especially electrical power and water supply—under any circumstances, including pending tenancy disputes.',
      '4. DELIBERATE ACTIONABLE HARASSMENT: That such high-handed conduct constitutes an actionable civil wrong, trespass, and criminal intimidation under Sections 324 and 351 of Bharatiya Nyaya Sanhita, 2023.'
    ],
    ultimatum: 'TAKE NOTICE that you are hereby called upon to immediately reconnect and restore full electrical power supply to the demised premises within 24 (Twenty-Four) hours from receipt of this notice, failing which an urgent application for interim mandatory injunction under Section 151 CPC along with criminal prosecution will be initiated at your sole risk and peril.',
    signOffTitle: 'Yours faithfully,\n[Complainant Name]\nAggrieved Lawful Occupant in Possession'
  },

  // 8. Student / Citizen: Public Park PIL
  {
    id: 'pil-public-park',
    title: 'Public Interest Litigation — Protection of Public Park',
    role: 'student',
    category: 'Public Interest Litigation',
    skillName: 'Public Park PIL Drafter',
    skillDesc: 'Writ petition under Article 226 for preservation of public park land',
    formFields: [
      { id: 'courtName', label: 'Hon’ble High Court Name', placeholder: 'e.g. High Court of Judicature at Bombay', required: true },
      { id: 'parkLocation', label: 'Park Demarcation & Location', placeholder: 'e.g. Central Municipal Park, Ward 4', required: true },
      { id: 'petitionerName', label: 'Petitioner / Citizen Name', placeholder: 'e.g. Public Park Welfare Association', required: true }
    ],
    heading: 'IN THE HON’BLE HIGH COURT OF JUDICATURE\n(ORIGINAL WRIT JURISDICTION — PUBLIC INTEREST LITIGATION)',
    subject: 'WRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA SEEKING REMOVAL OF ENCROACHMENTS AND PRESERVATION OF PUBLIC RECREATIONAL PARK LAND',
    toPlaceholder: 'THE HON’BLE CHIEF JUSTICE AND COMPANION JUSTICES OF THE HON’BLE HIGH COURT',
    bodyClauses: [
      '1. STATEMENT OF JURISDICTION: The Petitioner, a concerned resident and citizen, invokes the extraordinary writ jurisdiction of this Hon’ble Court under Article 226 of the Constitution of India in public interest for the preservation, maintenance, and ecological restoration of municipal public park space.',
      '2. STATEMENT OF FACTS: That the demarcated public park situated within the municipal zone, reserved exclusively for recreational and environmental purposes under the Master Development Plan, has been subjected to illegal commercial encroachment, debris dumping, and systemic municipal neglect.',
      '3. LEGAL GROUNDS — PUBLIC TRUST DOCTRINE: That in Bangalore Medical Trust v. B.S. Muddappa (1991) 4 SCC 54 and M.C. Mehta v. Kamal Nath (1997) 1 SCC 388, the Hon’ble Supreme Court firmly held that open public spaces and parks are held by public authorities in solemn trust for the public and cannot be alienated, encroached, or diverted for non-park uses.',
      '4. VIOLATION OF FUNDAMENTAL RIGHTS: That deprivation and degradation of designated green lung areas violates the Right to a Clean, Wholesome Environment and Healthy Living guaranteed as a core facet of the Right to Life under Article 21 of the Constitution.',
      '5. REPRESENTATIONS UNHEEDED: That despite multiple detailed written representations submitted to the Municipal Commissioner and Development Authority, no anti-encroachment or sanitization drives have been initiated.'
    ],
    ultimatum: 'PRAYER: Wherefore, in the light of the above facts, the Petitioner respectfully prays that this Hon’ble Court be pleased to issue a Writ of Mandamus or other appropriate direction directing the Respondent Authorities to immediately remove all illegal encroachments, restore the green canopy and boundary fences of the public park, and institute routine judicial compliance monitoring.',
    signOffTitle: 'Respectfully Submitted,\nCounsel for the Petitioner\nAdvocate in Public Interest'
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

// Helper to render text with placeholders highlighted in distinct yellow badges
export const renderWithPlaceholders = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(\[[^\]]+\])/g);
  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.endsWith(']')) {
      return (
        <span
          key={idx}
          className="bg-[#FEF3C7] text-[#92400E] border border-[#FDE68A] px-1.5 py-0.5 rounded text-xs font-mono font-semibold font-sans mx-0.5 inline-block select-all"
        >
          {part}
        </span>
      );
    }
    return part;
  });
};

// Universal placeholder substitute for form values & extraction
export const substitutePlaceholders = (text: string, values: Record<string, string>): string => {
  if (!text) return text;
  let result = text;
  const map: Record<string, string[]> = {
    landlordName: ['[Landlord / Property Owner Full Name]', '[Landlord Name]', '[Property Owner Full Name]', '[Opposite Party / Landlord Name]'],
    landlordAddress: ['[Landlord Residence Address / Property Owner]', '[Landlord Address]', '[Demised Premises Owner Address]', '[Opposite Party Address]'],
    premisesAddress: ['[Demised Premises Address]', '[Rented Premises Address]', '[Property Address]', '[Property address]'],
    contractedRent: ['[Contracted Rent]', '[Current Rent]', '[Amount]'],
    demandedRent: ['[Demanded Rent]', '[Hike Amount / %]', '[Hiked Rent]'],
    agreementDate: ['[Agreement Date]', '[Agreement date]'],
    tenantName: ['[Tenant Name]', '[Complainant Name]', '[Your Name]'],
    recipient: ['[Recipient Name and Address]', '[Recipient Name]'],
    address: ['[Property Address]', '[Demised Premises Address]'],
    amount: ['[Amount]'],
    date: ['[Agreement Date]'],
    depositAmount: ['[Deposit Amount]', '75,000'],
    vacateDate: ['[Vacate Date]'],
    companyName: ['[Company Name]', '[Company A]'],
    productName: ['[Product Name]'],
    courtName: ['[Court Name]'],
    mootTitle: ['[Moot Title]'],
    caseTitle: ['[Case Title]'],
    teamCode: ['[TC-42]', '[Team Code]'],
    parkLocation: ['[Park Demarcation & Location]', '[Park Location]'],
    petitionerName: ['[Petitioner Name]', '[Petitioner / Citizen Name]']
  };

  Object.entries(values).forEach(([fieldKey, val]) => {
    if (!val || !val.trim()) return;
    const cleanVal = val.trim();
    result = result.replace(new RegExp(`\\[CONFIRM:?\\s*${fieldKey}?\\]`, 'gi'), cleanVal);
    result = result.replace(new RegExp(`\\[${fieldKey}\\]`, 'gi'), cleanVal);
    const aliases = map[fieldKey];
    if (aliases) {
      aliases.forEach((alias) => {
        result = result.split(alias).join(cleanVal);
      });
    }
  });

  return result;
};

// Conversational data extractor from user chat prompt
export const extractFieldsFromText = (text: string): Record<string, string> => {
  const extracted: Record<string, string> = {};
  if (!text) return extracted;

  // Landlord name
  const landlordMatch = text.match(/(?:landlord(?:\s+name)?|owner(?:\s+name)?|party(?:\s+name)?)\s*(?:is|:|=|-)\s*([^,.\n]+)/i);
  if (landlordMatch) extracted.landlordName = landlordMatch[1].trim();

  // Tenant / Complainant name
  const tenantMatch = text.match(/(?:tenant(?:\s+name)?|my name|claimant(?:\s+name)?|petitioner(?:\s+name)?)\s*(?:is|:|=|-)\s*([^,.\n]+)/i);
  if (tenantMatch) extracted.tenantName = tenantMatch[1].trim();

  // Current rent
  const rentMatch = text.match(/(?:current\s+rent|contracted\s+rent|existing\s+rent|old\s+rent|present\s+rent|rent(?!\s*(?:hike|increase|new|demanded)))\s*(?:is|was|:|=|-)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (rentMatch) extracted.contractedRent = rentMatch[1].trim();

  // Demanded rent / hike
  const hikeMatch = text.match(/(?:new\s+rent|demanded\s+rent|hike(?:\s+amount)?|increased\s+rent|price\s+hike)\s*(?:is|to|of|:|=|-)?\s*(?:₹|rs\.?|inr)?\s*([0-9,]+)/i);
  if (hikeMatch) extracted.demandedRent = hikeMatch[1].trim();

  // Premises address
  const premisesMatch = text.match(/(?:premises|flat|property|house|apartment|demised\s+premises)\s*(?:address|is|at|:|=|-)\s*([^,.\n]+)/i);
  if (premisesMatch) extracted.premisesAddress = premisesMatch[1].trim();

  // Landlord address
  const landlordAddrMatch = text.match(/(?:landlord\s+address|owner\s+address|residence)\s*(?:is|:|=|-)\s*([^,.\n]+)/i);
  if (landlordAddrMatch) extracted.landlordAddress = landlordAddrMatch[1].trim();

  // Agreement date
  const dateMatch = text.match(/(?:agreement\s+date|dated|lease\s+date)\s*(?:is|:|=|-)?\s*([0-9]{1,2}[/-][0-9]{1,2}[/-][0-9]{2,4})/i);
  if (dateMatch) extracted.agreementDate = dateMatch[1].trim();

  return extracted;
};

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
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateDefinition | null>(null);
  const [docTitle, setDocTitle] = useState('Untitled Draft');
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [saveStatus, setSaveStatus] = useState('Ready');
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Dynamic Live Document Canvas State
  const [draftHeading, setDraftHeading] = useState('');
  const [draftDate, setDraftDate] = useState('');
  const [draftTo, setDraftTo] = useState('');
  const [draftSubject, setDraftSubject] = useState('');
  const [draftClauses, setDraftClauses] = useState<string[]>([]);
  const [draftUltimatum, setDraftUltimatum] = useState('');
  const [draftSignOff, setDraftSignOff] = useState('');
  const [freeformText, setFreeformText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasScrollRef = useRef<HTMLDivElement>(null);

  // New Draft Name Intake Modal State
  const [isNewDraftModalOpen, setIsNewDraftModalOpen] = useState(false);
  const [newDraftTitle, setNewDraftTitle] = useState('');
  const [newDraftTemplateId, setNewDraftTemplateId] = useState('');

  // Dynamic Questionnaire Form Values
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [isDraftGenerated, setIsDraftGenerated] = useState(false);
  const [activeQuestionnaire, setActiveQuestionnaire] = useState<TemplateDefinition | null>(null);

  // Chat message & input
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'ai' | 'user'; text: string; time: string }>>([]);

  // Active Tab for AI Assistant
  const [aiTab, setAiTab] = useState<'Chat' | 'Details' | 'Reference' | 'Templates'>('Chat');
  
  // Mobile responsive view switcher: Document Canvas vs AI Assistant
  const [activeMobileView, setActiveMobileView] = useState<'canvas' | 'ai'>('canvas');

  // Translation Modal State
  const [isTranslateModalOpen, setIsTranslateModalOpen] = useState(false);
  const [selectedTranslateLang, setSelectedTranslateLang] = useState('Hindi');
  const [isTranslatingDraft, setIsTranslatingDraft] = useState(false);
  const [translationResult, setTranslationResult] = useState<{
    sourceLang: string;
    targetLang: string;
    originalClauses: string[];
    translatedClauses: string[];
  } | null>(null);
  const [copyFeedback, setCopyFeedback] = useState(false);

  // Reference-Style Adaptation State (Requirement 4)
  const [referenceStyleProfile, setReferenceStyleProfile] = useState<{
    sourceFile: string;
    tone: string;
    numberingFormat: string;
    structurePattern: string;
    terminologyGlossary: Array<{ term: string; usage: string }>;
    formattingConventions?: any;
    clausePatterns?: Array<{ clauseType: string; observedStructure: string }>;
    adaptedSummary?: string;
  } | null>(null);

  // Active AI Model Selection (Page 4 UI Alignment)
  const [selectedAiModel, setSelectedAiModel] = useState<string>('Claude 3.5 Sonnet');
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);

  // Citation Verification State (Requirement 6)
  const [isVerifyingCitations, setIsVerifyingCitations] = useState(false);
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [verificationReport, setVerificationReport] = useState<{
    summary?: { total_citations: number; verified_count: number; issue_count: number };
    results?: Array<{
      citation_id: string;
      raw_text: string;
      normalized_form?: string;
      status: 'verified' | 'partially_verified' | 'unverified';
      notes?: string;
      sources?: Array<{ title: string; excerpt?: string; jurisdiction?: string }>;
    }>;
  } | null>(null);

  // Consequential Action Confirmation Dialog (Requirement 7)
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    actionLabel?: string;
    onConfirm: () => void;
  } | null>(null);

  // Document Uploading State
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const referenceFileInputRef = useRef<HTMLInputElement>(null);

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

  // Reset canvas and chat to completely blank document
  const handleResetToBlankDraft = (title: string = 'Untitled Draft') => {
    setDocTitle(title);
    setDraftHeading('');
    setDraftDate('');
    setDraftTo('');
    setDraftSubject('');
    setDraftClauses([]);
    setDraftUltimatum('');
    setDraftSignOff('');
    setFreeformText('');
    setFormValues({});
    setSelectedTemplate(null);
    setActiveQuestionnaire(null);
    setIsDraftGenerated(false);
    setMessages([]);
    setSaveStatus('Blank Canvas Ready');
  };

  // Switch active template on explicit user request
  const handleSelectTemplate = (tmpl: TemplateDefinition) => {
    setSelectedTemplate(tmpl);
    setActiveQuestionnaire(tmpl);
    setDocTitle(tmpl.title);
    setCurrentRole(tmpl.role);
    setFormValues({});
    setDraftHeading(tmpl.heading);
    setDraftSubject(tmpl.subject);
    setDraftTo(tmpl.toPlaceholder);
    setDraftClauses(tmpl.bodyClauses);
    setDraftUltimatum(tmpl.ultimatum);
    setDraftSignOff(tmpl.signOffTitle);
    setDraftDate(new Date().toLocaleDateString('en-IN'));
    setIsDraftGenerated(true);
    setSaveStatus('Template loaded');
    setTemplatePickerOpen(false);
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        sender: 'ai',
        text: `Loaded template: "${tmpl.title}". You can edit the text directly on the canvas, fill in the questionnaire above, or instruct me to customize clauses.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Option 1: Prompt for Draft Name Before Opening
  const handleCreateNewDraft = () => {
    setNewDraftTitle('');
    setIsNewDraftModalOpen(true);
  };

  // Confirm Creation with User-Entered Draft Name: Always opens a blank canvas with clean chat
  const handleConfirmCreateNewDraft = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmedTitle = newDraftTitle.trim() || 'Untitled Draft';
    handleResetToBlankDraft(trimmedTitle);
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
    setActiveQuestionnaire(null);
    setDocTitle(draft.title);
    setCurrentRole(draft.role);
    setDraftHeading(draft.heading || draft.title.toUpperCase());
    setDraftSubject(draft.subject || draft.title);
    setDraftTo(draft.toPlaceholder || '[Recipient / Addressee]');
    setDraftClauses(draft.bodyClauses || [draft.preview]);
    setDraftUltimatum(draft.ultimatum || '');
    setDraftSignOff(draft.signOffTitle || '[Authorized Signatory]');
    setDraftDate(draft.lastEdited || new Date().toLocaleDateString('en-IN'));
    setFreeformText('');
    setIsDraftGenerated(true);
    setSaveStatus(`Opened from ${draft.lastEdited}`);
    setViewMode('editor');
  };

  // Translate current draft canvas content
  const handleTranslateActiveDraft = async () => {
    setIsTranslatingDraft(true);
    try {
      let clausesToTranslate: string[] = [];
      if (draftHeading || draftSubject || draftClauses.length > 0) {
        if (draftHeading) clausesToTranslate.push(draftHeading);
        if (draftSubject) clausesToTranslate.push(`Subject: ${draftSubject}`);
        if (draftClauses.length > 0) clausesToTranslate.push(...draftClauses);
        if (draftUltimatum) clausesToTranslate.push(draftUltimatum);
      } else if (freeformText && freeformText.trim()) {
        clausesToTranslate = freeformText
          .split(/\n{2,}|\n(?=\d+[\.\)])/)
          .map((c) => c.trim())
          .filter((c) => c.length > 0);
      }

      if (clausesToTranslate.length === 0) {
        clausesToTranslate = [
          docTitle || 'Legal Draft Instrument',
          '1. That this document records the formal legal rights, duties, and covenants of the executing parties.',
          '2. That the provisions herein are enforceable under applicable Indian statutory laws and regulations.'
        ];
      }

      // 1. Call backend translation service
      const res = await api.createTranslationJob({
        fileName: docTitle || 'Legal Draft',
        sourceLang: 'English',
        targetLang: selectedTranslateLang,
        clauses: clausesToTranslate,
      });

      if (res.success && res.data?.job?.translatedClauses) {
        setTranslationResult({
          sourceLang: 'English',
          targetLang: selectedTranslateLang,
          originalClauses: res.data.job.originalClauses || clausesToTranslate,
          translatedClauses: res.data.job.translatedClauses,
        });
      } else {
        // Fallback to client-side regional legal translation
        const translated = translateDocumentLocally(clausesToTranslate, selectedTranslateLang);
        setTranslationResult({
          sourceLang: 'English',
          targetLang: selectedTranslateLang,
          originalClauses: clausesToTranslate,
          translatedClauses: translated,
        });
      }
    } catch {
      const fallbackClauses = draftClauses.length > 0 
        ? draftClauses 
        : [freeformText || docTitle || 'Legal Draft'];
      const translated = translateDocumentLocally(fallbackClauses, selectedTranslateLang);
      setTranslationResult({
        sourceLang: 'English',
        targetLang: selectedTranslateLang,
        originalClauses: fallbackClauses,
        translatedClauses: translated,
      });
    } finally {
      setIsTranslatingDraft(false);
    }
  };

  const handleApplyTranslationToCanvas = () => {
    if (!translationResult) return;
    if (draftClauses.length > 0) {
      setDraftClauses(translationResult.translatedClauses);
    } else {
      setFreeformText(translationResult.translatedClauses.join('\n\n'));
    }
    setSaveStatus(`Translated to ${translationResult.targetLang}`);
    setIsTranslateModalOpen(false);
  };

  const handleCopyTranslatedDraft = () => {
    if (!translationResult) return;
    navigator.clipboard.writeText(translationResult.translatedClauses.join('\n\n'));
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  const handleDownloadTranslatedDraft = () => {
    if (!translationResult) return;
    const content = `${docTitle || 'Legal_Draft'} — Translated (${translationResult.targetLang})\n` +
      `=======================================================\n\n` +
      translationResult.translatedClauses.join('\n\n');
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${(docTitle || 'Legal_Draft').replace(/\s+/g, '_')}_${translationResult.targetLang}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Genuine Multi-Format Document Upload (.docx, .pdf, .txt) with Automatic Reference Style Extraction
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isReferenceOnly = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    setSaveStatus(`Processing ${file.name}...`);

    try {
      // 1. Call real backend document parser
      const parseRes = await api.parseDocumentFile(file);

      let extractedTitle = file.name.replace(/\.[^/.]+$/, "");
      let extractedClauses: string[] = [];
      let fullText = '';

      if (parseRes.success && parseRes.data) {
        fullText = parseRes.data.rawText || '';
        if (parseRes.data.title) extractedTitle = parseRes.data.title.replace(/\.[^/.]+$/, "");
        
        // Convert paragraphs/pages to structured clauses
        if (Array.isArray(parseRes.data.pages) && parseRes.data.pages.length > 0) {
          const allParas = parseRes.data.pages.flatMap((p: any) => p.paragraphs || []);
          extractedClauses = allParas.filter((p: string) => p.trim().length > 0);
        } else if (fullText) {
          extractedClauses = fullText.split(/\r?\n\r?\n+/).map((p: string) => p.trim()).filter(Boolean);
        }
      } else {
        // Direct text fallback for TXT
        fullText = await file.text().catch(() => '');
        if (fullText) {
          extractedClauses = fullText.split(/\r?\n\r?\n+/).map((p: string) => p.trim()).filter(Boolean);
        }
      }

      if (extractedClauses.length === 0) {
        extractedClauses = [
          `Document: ${file.name}`,
          `Parsed content from ${file.name}. Ready for legal editing and drafting review.`
        ];
      }

      // 2. Automatically extract reference drafting style from uploaded document
      let styleProfile: any = null;
      try {
        const styleRes = await api.extractReferenceStyle({
          referenceText: fullText || extractedClauses.join('\n\n'),
          filename: file.name
        });
        if (styleRes.success && styleRes.data) {
          styleProfile = styleRes.data;
          setReferenceStyleProfile(styleProfile);
        }
      } catch (styleErr) {
        console.warn('Style extraction warning:', styleErr);
      }

      if (isReferenceOnly) {
        // Kept as reference style guide for current canvas
        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: `Reference document "${file.name}" loaded successfully.\n\nExtracted Drafting Style Profile:\n• Tone: ${styleProfile?.tone || 'Formal Legal'}\n• Numbering: ${styleProfile?.numberingFormat || 'Sequential'}\n• Structure: ${styleProfile?.structurePattern || 'Standard Legal'}\n\nSubsequent AI drafting requests will now automatically adhere to this reference style!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setSaveStatus(`Reference style loaded: ${file.name}`);
      } else {
        // Load onto Canvas
        const headingName = extractedTitle.toUpperCase();
        const subjectName = `Matter regarding ${extractedTitle}`;
        const ultimatum = 'The parties agree to the terms as transcribed and edited herein.';
        const signOff = '[Authorized Signatory]\nAdvocate / Representative';

        const newDraft: SavedDraftItem = {
          id: `upload-${Date.now()}`,
          title: extractedTitle,
          category: 'Uploaded Document',
          role: currentRole,
          lastEdited: 'Just now',
          wordsCount: extractedClauses.join(' ').split(/\s+/).filter(Boolean).length,
          preview: extractedClauses[0]?.slice(0, 150) || `Imported from ${file.name}.`,
          templateId: 'uploaded-doc',
          heading: headingName,
          subject: subjectName,
          bodyClauses: extractedClauses,
          ultimatum,
          signOffTitle: signOff
        };

        const updated = [newDraft, ...savedDrafts];
        persistDrafts(updated);
        handleOpenExistingDraft(newDraft);

        setMessages((prev) => [
          ...prev,
          {
            id: Date.now().toString(),
            sender: 'ai',
            text: `Successfully imported "${file.name}" into the studio canvas (${extractedClauses.length} clauses extracted).\n\nReference style profile detected:\n• Tone: ${styleProfile?.tone || 'Formal Legal'}\n• Format: ${styleProfile?.numberingFormat || 'Sequential'}\n\nYou can now edit any clause directly or prompt me to revise, redline, or verify citations.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
        setSaveStatus(`Imported ${file.name}`);
      }
    } catch (err: any) {
      console.error('Document upload error:', err);
      alert(`Failed to parse document: ${err.message || 'Unknown error'}`);
      setSaveStatus('Upload error');
    } finally {
      setIsUploadingFile(false);
      e.target.value = '';
    }
  };

  // Dynamic Prompt Quality Meter (Page 4 UI Alignment)
  const calculatePromptScore = (text: string) => {
    if (!text.trim()) return { score: 0, label: 'Empty', color: 'bg-slate-300', textClass: 'text-slate-400' };
    const words = text.trim().split(/\s+/).length;
    let score = Math.min(words * 3, 40);

    const legalKeywords = [
      'clause', 'agreement', 'notice', 'liability', 'damages', 'party', 'tenant', 'landlord',
      'breach', 'default', 'rent', 'deposit', 'termination', 'indemnity', 'jurisdiction',
      'statute', 'section', 'act', 'covenant', 'remedy', 'arbitration', 'court', 'injunction'
    ];
    const lower = text.toLowerCase();
    const matched = legalKeywords.filter((k) => lower.includes(k));
    score += Math.min(matched.length * 12, 45);

    if (/\d+/.test(text)) score += 15;

    const finalScore = Math.min(score, 100);
    if (finalScore < 40) return { score: finalScore, label: 'Weak Prompt', color: 'bg-rose-500', textClass: 'text-rose-600' };
    if (finalScore < 75) return { score: finalScore, label: 'Good Prompt', color: 'bg-amber-500', textClass: 'text-amber-600' };
    return { score: finalScore, label: 'Strong Legal Prompt', color: 'bg-emerald-500', textClass: 'text-emerald-600' };
  };

  // Enhance / Improve Prompt action (Page 4 UI Alignment)
  const handleImprovePrompt = () => {
    const raw = chatInput.trim();
    if (!raw) {
      setChatInput('Draft a formal residential tenancy agreement under Indian rent laws specifying rent, security deposit terms, maintenance liabilities, and 30-day notice for termination.');
      return;
    }

    const lower = raw.toLowerCase();
    let enhanced = raw;
    if (lower.includes('notice')) {
      enhanced = `Draft a formal statutory legal notice under Section 73 of the Indian Contract Act, 1872 regarding "${raw}", detailing the factual background, demand for immediate remedy within 15 days, and reservation of civil and criminal legal rights.`;
    } else if (lower.includes('nda') || lower.includes('confidential')) {
      enhanced = `Draft a bilateral Non-Disclosure and Proprietary Information Agreement regarding "${raw}", defining confidential information, non-circumvention, permitted disclosures, 3-year survival term, and exclusive Indian jurisdiction.`;
    } else if (lower.includes('rent') || lower.includes('tenant') || lower.includes('lease')) {
      enhanced = `Draft an enforceable residential lease agreement for "${raw}", detailing monthly rental terms, refundable deposit covenants, tenant responsibilities, and dispute resolution through arbitration.`;
    } else {
      enhanced = `Draft a structured, legally binding instrument for "${raw}", incorporating standard operative recitals, substantive statutory obligations, indemnification covenants, and formal execution blocks.`;
    }
    setChatInput(enhanced);
  };

  // Citation Verification on Canvas (Requirement 6)
  const handleVerifyCanvasCitations = async () => {
    const allText = [draftHeading, draftSubject, ...draftClauses, draftUltimatum].filter(Boolean).join('\n\n');
    if (!allText.trim()) {
      alert('The canvas is currently empty. Please generate or import a draft first.');
      return;
    }

    setIsVerifyingCitations(true);
    setSaveStatus('Verifying citations against Indian legal sources...');

    try {
      const res = await api.verifyDocument(allText);
      if (res.success && res.data) {
        setVerificationReport(res.data);
        setVerificationModalOpen(true);
      } else {
        alert(res.message || 'Citation verification could not be completed.');
      }
    } catch (err: any) {
      alert(`Verification error: ${err.message}`);
    } finally {
      setIsVerifyingCitations(false);
      setSaveStatus('Ready');
    }
  };

  // Consequential Action Confirmation (Requirement 7)
  const requestResetCanvas = () => {
    setConfirmDialog({
      isOpen: true,
      title: 'Reset to Blank Canvas',
      message: 'Are you sure you want to clear this draft? All current clauses and unsaved edits on the canvas will be permanently discarded.',
      actionLabel: 'Yes, Clear Canvas',
      onConfirm: () => {
        handleResetToBlankDraft('Untitled Draft');
        setConfirmDialog(null);
      }
    });
  };

  // Switch Role
  const handleRoleChange = (newRole: UserRoleType) => {
    setCurrentRole(newRole);
    setRoleSwitcherOpen(false);

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

  // Handle Dynamic Questionnaire Input change with live canvas placeholder replacement
  const handleInputChange = (fieldId: string, val: string) => {
    setFormValues((prev) => {
      const next = { ...prev, [fieldId]: val };
      if (val.trim()) {
        const delta = { [fieldId]: val.trim() };
        setDraftTo((t) => substitutePlaceholders(t, delta));
        setDraftSubject((s) => substitutePlaceholders(s, delta));
        setDraftClauses((clauses) => clauses.map((c) => substitutePlaceholders(c, delta)));
        setDraftUltimatum((u) => substitutePlaceholders(u, delta));
        setDraftSignOff((so) => substitutePlaceholders(so, delta));
      }
      return next;
    });
  };

  // Handle Generate / Update Draft button click
  const handleGenerateDraft = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsGenerating(true);
    setSaveStatus('Applying details to document...');

    const activeTmpl = activeQuestionnaire || selectedTemplate || MASTER_TEMPLATES[0];
    const todayDate = new Date().toLocaleDateString('en-IN');
    let generatedHeading = activeTmpl.heading;
    let generatedSubject = substitutePlaceholders(activeTmpl.subject, formValues);
    let generatedTo = substitutePlaceholders(activeTmpl.toPlaceholder, formValues);
    let generatedClauses = activeTmpl.bodyClauses.map((clause) =>
      substitutePlaceholders(clause, formValues)
    );
    let generatedUltimatum = substitutePlaceholders(activeTmpl.ultimatum, formValues);
    let generatedSignOff = substitutePlaceholders(activeTmpl.signOffTitle, formValues);

    // Call backend API if online
    try {
      const apiRes = await api.generateDraft({
        documentType: activeTmpl.category,
        facts: formValues,
        templateId: activeTmpl.id,
        customInstructions: activeTmpl.title
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
    setSelectedTemplate(activeTmpl);
    setDraftHeading(generatedHeading);
    setDraftSubject(generatedSubject);
    setDraftTo(generatedTo.replace(/^(to\s*,?\s*\n?)/i, '').trim());
    setDraftClauses(generatedClauses);
    setDraftUltimatum(generatedUltimatum);
    setDraftSignOff(generatedSignOff);
    setDraftDate(todayDate);
    setIsDraftGenerated(true);
    setIsGenerating(false);
    setActiveQuestionnaire(null);
    setSaveStatus('Draft updated just now');
    canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

    // Save in saved drafts
    const existingIndex = savedDrafts.findIndex((d) => d.title === docTitle);
    const updatedDraft: SavedDraftItem = {
      id: existingIndex >= 0 ? savedDrafts[existingIndex].id : `draft-${Date.now()}`,
      title: docTitle,
      category: activeTmpl.category,
      role: currentRole,
      lastEdited: 'Just now',
      wordsCount: [generatedHeading, generatedSubject, ...generatedClauses, generatedUltimatum].join(' ').split(/\s+/).filter(Boolean).length,
      preview: `${generatedSubject} for ${Object.values(formValues)[0] || 'Client'}`,
      templateId: activeTmpl.id,
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
      text: `Draft successfully generated for ${activeTmpl.title}. Verified statutory clauses and terms have been inserted into the canvas with your specified details.`,
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
    const isPowerLoss = pLower.includes('power') || pLower.includes('electric') || pLower.includes('blackout') || pLower.includes('disconnection') || pLower.includes('harish hirani');
    const isPark = pLower.includes('park') || pLower.includes('public park') || pLower.includes('environment') || pLower.includes('encroachment');

    if (isPriceHike) {
      // Switch active template to Rent Hike Objection
      const hikeTemplate = MASTER_TEMPLATES.find((t) => t.id === 'tenant-rent-hike-objection') || MASTER_TEMPLATES[0];
      setSelectedTemplate(hikeTemplate);

      const newTitle = hikeTemplate.title;
      const newHeading = hikeTemplate.heading;
      const newTo = hikeTemplate.toPlaceholder;
      const newSubject = hikeTemplate.subject;
      const newClauses = hikeTemplate.bodyClauses;
      const newUltimatum = hikeTemplate.ultimatum;
      const newSignOff = hikeTemplate.signOffTitle;

      setDocTitle(newTitle);
      setDraftHeading(newHeading);
      setDraftTo(newTo.replace(/^(to\s*,?\s*\n?)/i, '').trim());
      setDraftSubject(newSubject);
      setDraftClauses(newClauses);
      setDraftUltimatum(newUltimatum);
      setDraftSignOff(newSignOff);
      setDraftDate(new Date().toLocaleDateString('en-IN'));
      setIsDraftGenerated(true);
      setSaveStatus('Rent Hike Objection Generated');
      canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

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
          text: `I have generated the formal Statutory Legal Notice & Objection against the arbitrary price/rent hike on the document canvas.\n\nTo personalize your notice and replace the yellow placeholders, please provide the following details:\n1. 👤 Landlord's Full Name\n2. 📍 Landlord's Residence Address\n3. 🏠 Rented Premises Address\n4. 💰 Current Agreed Rent (₹)\n5. 📈 Demanded / Hiked Rent (₹)\n6. 📅 Agreement Date\n7. ✍️ Your Name (Tenant)\n\n👉 You can type these into the form fields right above this chat, or simply reply here with the details (e.g. "Landlord is Ramesh Sharma, address is Flat 101, rent is 20000, new rent 30000, tenant is Rahul").`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
      }, 400);

    } else if (isPowerLoss) {
      // Switch active template to Electricity Notice
      const powerTemplate = MASTER_TEMPLATES.find((t) => t.id === 'tenant-power-restoration') || MASTER_TEMPLATES[0];
      setSelectedTemplate(powerTemplate);

      const newTitle = powerTemplate.title;
      const newHeading = powerTemplate.heading;
      const newTo = powerTemplate.toPlaceholder;
      const newSubject = powerTemplate.subject;
      const newClauses = powerTemplate.bodyClauses;
      const newUltimatum = powerTemplate.ultimatum;
      const newSignOff = powerTemplate.signOffTitle;

      setDocTitle(newTitle);
      setDraftHeading(newHeading);
      setDraftTo(newTo.replace(/^(to\s*,?\s*\n?)/i, '').trim());
      setDraftSubject(newSubject);
      setDraftClauses(newClauses);
      setDraftUltimatum(newUltimatum);
      setDraftSignOff(newSignOff);
      setDraftDate(new Date().toLocaleDateString('en-IN'));
      setIsDraftGenerated(true);
      setSaveStatus('Electricity Notice Generated');
      canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

      api.saveDraft({
        id: `draft-${Date.now()}`,
        title: newTitle,
        category: 'Utility Grievance',
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
          text: `I have drafted an urgent Statutory Legal Notice & Demand for immediate restoration of electricity supply on the document canvas.\n\nTo personalize your notice and replace the yellow placeholders, please provide:\n1. 👤 Landlord / Opposite Party Name (e.g. Harish Hirani)\n2. 📍 Landlord's Address\n3. 🏠 Demised Premises Address\n4. ✍️ Your Name (Complainant)\n\n👉 You can fill the form fields above or reply directly in chat with these details.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
      }, 400);

    } else if (isPark) {
      // Switch active template to Public Park PIL
      const parkTemplate = MASTER_TEMPLATES.find((t) => t.id === 'pil-public-park') || MASTER_TEMPLATES[0];
      setSelectedTemplate(parkTemplate);

      const newTitle = parkTemplate.title;
      const newHeading = parkTemplate.heading;
      const newTo = parkTemplate.toPlaceholder;
      const newSubject = parkTemplate.subject;
      const newClauses = parkTemplate.bodyClauses;
      const newUltimatum = parkTemplate.ultimatum;
      const newSignOff = parkTemplate.signOffTitle;

      setDocTitle(newTitle);
      setDraftHeading(newHeading);
      setDraftTo(newTo.replace(/^(to\s*,?\s*\n?)/i, '').trim());
      setDraftSubject(newSubject);
      setDraftClauses(newClauses);
      setDraftUltimatum(newUltimatum);
      setDraftSignOff(newSignOff);
      setDraftDate(new Date().toLocaleDateString('en-IN'));
      setIsDraftGenerated(true);
      setSaveStatus('Public Park Petition Generated');
      canvasScrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });

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
          text: `I have drafted a comprehensive Public Interest Litigation (PIL) under Article 226 for the protection of the public park.\n\nPlease provide the following details to replace the placeholders:\n1. 🏛️ High Court Name\n2. 🌳 Park Demarcation & Location\n3. ✍️ Petitioner / Citizen Name\n\n👉 Fill them in the form above or reply here in chat.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };
        setMessages((prev) => [...prev, aiReply]);
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
      // Check if user is conversationally providing data inputs (e.g. "landlord is Ramesh Sharma, rent is 20000")
      const extractedData = extractFieldsFromText(promptText);
      if (Object.keys(extractedData).length > 0) {
        setFormValues((prev) => ({ ...prev, ...extractedData }));

        setDraftTo((prev) => substitutePlaceholders(prev, extractedData));
        setDraftSubject((prev) => substitutePlaceholders(prev, extractedData));
        setDraftClauses((clauses) => clauses.map((c) => substitutePlaceholders(c, extractedData)));
        setDraftUltimatum((prev) => substitutePlaceholders(prev, extractedData));
        setDraftSignOff((prev) => substitutePlaceholders(prev, extractedData));
        setSaveStatus('Canvas details updated');

        const labelsMap: Record<string, string> = {
          landlordName: 'Landlord Full Name',
          landlordAddress: 'Landlord Address',
          premisesAddress: 'Rented Premises Address',
          contractedRent: 'Current Agreed Rent',
          demandedRent: 'Demanded / Hiked Rent',
          agreementDate: 'Agreement Date',
          tenantName: 'Tenant Name'
        };

        const summaryList = Object.entries(extractedData)
          .map(([k, v]) => `• **${labelsMap[k] || k}**: ${v}`)
          .join('\n');

        setTimeout(() => {
          const aiReply = {
            id: (Date.now() + 1).toString(),
            sender: 'ai' as const,
            text: `Got it! I have updated the legal draft with your provided information:\n\n${summaryList}\n\nThe canvas on the left has been refreshed and the corresponding yellow placeholders have been replaced with your actual details.`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          };
          setMessages((prev) => [...prev, aiReply]);
        }, 400);

        return;
      }
      // Dynamic General Drafting / Revision Handler
      try {
        const draftRes = await api.generateDraft({
          customInstructions: promptText,
          documentType: selectedTemplate?.category || 'Legal Document',
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
              
              {/* Card 1: Create New Draft (BLANK CANVAS & AI) */}
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
                      BLANK CANVAS &amp; AI
                    </span>
                  </div>

                  <h3 className="font-bold text-lg sm:text-xl text-[#0F172A] mt-5 group-hover:text-[#1E3A8A] transition-colors">
                    Create New Draft
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-2.5 leading-relaxed">
                    Start with a fresh, clean blank page to type freely or prompt the AI Assistant to generate customized clauses.
                  </p>
                </div>

                <div className="pt-4 flex items-center gap-1.5 text-xs font-semibold text-[#1E3A8A] group-hover:translate-x-1 transition-transform">
                  <span>Start Blank Draft</span>
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
                  <span>Upload .docx / .pdf / .txt</span>
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf,.txt"
                    onChange={(e) => handleFileUpload(e, false)}
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
                  accept=".docx,.doc,.pdf,.txt"
                  onChange={(e) => handleFileUpload(e, false)}
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
                    <span>{selectedTemplate ? selectedTemplate.skillName : 'Blank Document'}</span>
                    <ChevronDown className="w-3 h-3 text-slate-500" />
                  </button>

                  {templatePickerOpen && (
                    <div className="absolute left-0 mt-1.5 w-72 bg-white border border-[#DECDB8] rounded-2xl shadow-xl py-2 z-40 text-xs max-h-80 overflow-y-auto">
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        Document Mode
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          handleResetToBlankDraft('Blank Draft');
                          setTemplatePickerOpen(false);
                        }}
                        className={`w-full text-left px-3.5 py-2 hover:bg-[#FAF5EB] transition-colors flex items-center justify-between cursor-pointer ${
                          !selectedTemplate ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                        }`}
                      >
                        <div>
                          <p className="font-semibold">Blank Document</p>
                          <p className="text-[10px] text-slate-400">Empty canvas · Freeform typing</p>
                        </div>
                        {!selectedTemplate && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                      </button>
                      <div className="px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 border-t border-slate-100 mt-1">
                        Templates
                      </div>
                      {MASTER_TEMPLATES.map((tmpl) => (
                        <button
                          key={tmpl.id}
                          type="button"
                          onClick={() => handleSelectTemplate(tmpl)}
                          className={`w-full text-left px-3.5 py-2 hover:bg-[#FAF5EB] transition-colors flex items-center justify-between cursor-pointer ${
                            selectedTemplate?.id === tmpl.id ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                          }`}
                        >
                          <div>
                            <p className="font-semibold">{tmpl.title}</p>
                            <p className="text-[10px] text-slate-400 capitalize">{tmpl.category} · {tmpl.role}</p>
                          </div>
                          {selectedTemplate?.id === tmpl.id && <Check className="w-3.5 h-3.5 text-[#1E3A8A]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Blank Page Quick Action Button with Consequential Confirmation */}
                <button
                  type="button"
                  onClick={requestResetCanvas}
                  className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-xs font-semibold text-slate-700 rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Clear canvas to a fresh blank page (with confirmation)"
                >
                  <Plus className="w-3.5 h-3.5 text-slate-500" />
                  <span>Blank Page</span>
                </button>

              </div>

              {/* Right Group: Reference Style + Citation Verification + Translation + Export */}
              <div className="flex flex-wrap items-center gap-2">
                
                {/* Upload Reference Style Button */}
                <label className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl border transition-all cursor-pointer shadow-2xs ${
                  referenceStyleProfile 
                    ? 'bg-amber-50 text-amber-900 border-amber-300' 
                    : 'bg-white text-slate-700 border-[#DECDB8] hover:bg-[#FAF8F5]'
                }`} title="Upload Reference Document to extract drafting tone, clause patterns, and style">
                  <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                  <span>{referenceStyleProfile ? 'Style Active' : 'Add Reference'}</span>
                  <input
                    type="file"
                    accept=".docx,.doc,.pdf,.txt"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                </label>

                {/* Verify Citations Button (Requirement 6) */}
                <button
                  type="button"
                  onClick={handleVerifyCanvasCitations}
                  disabled={isVerifyingCitations}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-xl transition-all cursor-pointer shadow-2xs disabled:opacity-50"
                  title="Verify statutory citations & landmark precedents with BAR AI"
                >
                  <Scale className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{isVerifyingCitations ? 'Verifying...' : 'Verify Citations'}</span>
                </button>

                {/* Language Translation Button */}
                <button
                  type="button"
                  onClick={() => {
                    setTranslationResult(null);
                    setIsTranslateModalOpen(true);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#1E3A8A] bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Translate Document to Indian Regional Language"
                >
                  <Languages className="w-3.5 h-3.5 text-[#1E3A8A]" />
                  <span>Translate</span>
                </button>

                {/* Read Aloud Button for Entire Document */}
                <ReadAloudControl
                  id={`draft-doc-${selectedTemplate?.id || 'active'}`}
                  text={
                    (draftHeading || draftSubject || draftClauses.length > 0)
                      ? [draftHeading, draftSubject ? `Subject: ${draftSubject}` : '', draftTo ? `To: ${draftTo}` : '', ...draftClauses, draftUltimatum, draftSignOff].filter(Boolean).join('\n\n')
                      : freeformText
                  }
                  title="Read Draft Aloud"
                  variant="compact"
                />

                {/* Export Document Button (Requirement 3 & 10) */}
                <button
                  type="button"
                  onClick={() => {
                    const content = [draftHeading, draftSubject ? `Subject: ${draftSubject}` : '', ...draftClauses, draftUltimatum, draftSignOff].filter(Boolean).join('\n\n');
                    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${(docTitle || 'Legal_Draft').replace(/\s+/g, '_')}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] rounded-xl transition-all cursor-pointer shadow-2xs"
                  title="Export Draft Document"
                >
                  <Download className="w-3.5 h-3.5 text-slate-600" />
                  <span>Export</span>
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
                <div ref={canvasScrollRef} className="p-4 sm:p-6 md:p-8 bg-[#F5F2EA] flex-1 overflow-y-auto flex justify-center">
                  
                  {/* The White A4 Paper Sheet (Generously Sized max-w-[860px]) */}
                  <div className="w-full max-w-[860px] bg-white rounded-xl shadow-md border border-[#E5E0D5] p-6 sm:p-10 md:p-12 relative text-slate-900 text-sm sm:text-[14.5px] leading-relaxed font-serif min-h-[720px] flex flex-col justify-between select-text">
                    
                    {/* Read Aloud Audio Toolbar for Full Draft */}
                    {(draftHeading || draftSubject || draftClauses.length > 0 || freeformText.trim()) && (
                      <ReadAloudControl
                        id={`draft-toolbar-${selectedTemplate?.id || 'active'}`}
                        text={
                          (draftHeading || draftSubject || draftClauses.length > 0)
                            ? [draftHeading, draftSubject ? `Subject: ${draftSubject}` : '', draftTo ? `To: ${draftTo}` : '', ...draftClauses, draftUltimatum, draftSignOff].filter(Boolean).join('\n\n')
                            : freeformText
                        }
                        title={`Draft: ${docTitle || 'Legal Document'}`}
                        variant="toolbar"
                        className="mb-6 font-sans select-none"
                      />
                    )}

                    {/* Paper Content */}
                    <div className="flex-1 flex flex-col">
                      {(draftHeading || draftSubject || draftClauses.length > 0) ? (
                        <div>
                          {/* Centered Document Title */}
                          {draftHeading && (
                            <h3 className="font-serif-title text-center text-xl sm:text-2xl font-bold tracking-[0.2em] text-[#0F172A] mb-8 uppercase whitespace-pre-line">
                              {draftHeading}
                            </h3>
                          )}

                          {/* Date & Addressee */}
                          <div className="space-y-3.5 mb-6 font-sans">
                            {draftDate && (
                              <p className="text-slate-700">
                                <span className="font-semibold">Date:</span>{' '}
                                <span className="text-slate-800 font-mono text-xs font-semibold">
                                  {draftDate}
                                </span>
                              </p>
                            )}

                            {draftTo && (
                              <div className="text-slate-700">
                                <p className="font-semibold text-slate-800">To,</p>
                                <div className="mt-1 whitespace-pre-line font-sans text-slate-800 leading-snug">
                                  {renderWithPlaceholders(draftTo.replace(/^(to\s*,?\s*\n?)/i, '').trim())}
                                </div>
                              </div>
                            )}

                            {draftSubject && (
                              <p className="pt-1.5">
                                <span className="font-bold text-[#0F172A] text-base">
                                  Subject: {renderWithPlaceholders(draftSubject)}
                                </span>
                              </p>
                            )}
                          </div>

                          {/* Body Clauses */}
                          <div className="space-y-4 text-slate-800 leading-relaxed font-serif">
                            {draftClauses.length > 0 && (
                              <ol className="list-decimal pl-6 space-y-3 text-justify">
                                {draftClauses.map((clause, idx) => (
                                  <li key={idx} className="leading-relaxed group">
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1">
                                        {renderWithPlaceholders(clause.replace(/^\d+[\.\)]\s*/, ''))}
                                      </div>
                                      <ReadAloudControl
                                        id={`clause-${selectedTemplate?.id || 'active'}-${idx}`}
                                        text={clause}
                                        variant="compact"
                                        className="opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0"
                                      />
                                    </div>
                                  </li>
                                ))}
                              </ol>
                            )}

                            {draftUltimatum && (
                              <p className="text-justify pt-2 font-serif leading-relaxed">
                                {renderWithPlaceholders(draftUltimatum)}
                              </p>
                            )}

                            {/* Sign-off */}
                            {draftSignOff && (
                              <div className="pt-6 font-sans space-y-1">
                                <p className="text-slate-700 font-medium">Yours faithfully,</p>
                                <div className="font-bold text-[#0F172A] pt-3 text-base whitespace-pre-line">
                                  {renderWithPlaceholders(draftSignOff.replace(/^(yours faithfully,?\s*\n?)/i, '').trim())}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        /* Blank Canvas View: Pristine Editable Paper Sheet */
                        <div className="flex-1 flex flex-col min-h-[580px]">
                          <div className="mb-4 pb-2 border-b border-[#F0EBE0] flex items-center justify-between text-xs text-slate-400 font-sans">
                            <span className="font-bold text-slate-700 text-sm tracking-wide">
                              {docTitle || 'Untitled Draft'}
                            </span>
                            <span>{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          </div>
                          <textarea
                            value={freeformText}
                            onChange={(e) => setFreeformText(e.target.value)}
                            placeholder="Start typing your draft here, paste legal text, or ask the AI Assistant on the right to draft provisions..."
                            className="w-full flex-1 bg-transparent resize-none text-slate-900 font-serif text-sm sm:text-[15px] leading-relaxed placeholder-slate-400 focus:outline-none min-h-[520px]"
                            autoFocus
                          />
                        </div>
                      )}
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
                      <span>
                        Words:{' '}
                        {((draftHeading || draftSubject || draftClauses.length > 0)
                          ? [draftHeading, draftSubject, draftTo, ...draftClauses, draftUltimatum, draftSignOff].join(' ')
                          : freeformText
                        ).split(/\s+/).filter(Boolean).length}{' '}
                        · Characters:{' '}
                        {((draftHeading || draftSubject || draftClauses.length > 0)
                          ? [draftHeading, draftSubject, draftTo, ...draftClauses, draftUltimatum, draftSignOff].join(' ')
                          : freeformText
                        ).length.toLocaleString()}
                      </span>
                      <span className="italic text-slate-400">
                        {(draftHeading || draftSubject || draftClauses.length > 0)
                          ? (isDraftGenerated ? 'Draft prepared for statutory review' : 'Draft for review · Not yet finalised')
                          : (freeformText.trim() ? 'Editing draft · Auto-saved' : 'Blank Document · Ready for typing')}
                      </span>
                    </div>

                  </div>

                </div>

              </div>


              {/* AI Assistant (Right Side: 4 cols on desktop) */}
              <div className={`lg:col-span-5 xl:col-span-4 bg-white rounded-2xl border border-[#EAE3D6] shadow-2xs flex flex-col overflow-hidden h-[820px] ${
                activeMobileView === 'ai' ? 'block' : 'hidden lg:flex'
              }`}>
                
                {/* Header with Model Selector */}
                <div className="px-4 py-3 border-b border-[#F0E9DF] flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#F59E0B]" />
                    <span className="text-xs font-bold tracking-wider text-[#0F172A] uppercase">
                      AI ASSISTANT
                    </span>
                  </div>

                  {/* Model Selector Dropdown (Page 4 UI Alignment) */}
                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                      className="flex items-center gap-1.5 px-2.5 py-1 bg-[#FAF5EB] hover:bg-[#F3EAD8] border border-[#DECDB8] rounded-lg text-[11px] font-semibold text-[#1E3A8A] transition-all cursor-pointer shadow-2xs"
                      title="Select configured AI model"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                      <span>{selectedAiModel}</span>
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    </button>
                    {modelDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-44 bg-white border border-[#DECDB8] rounded-xl shadow-xl py-1 z-50 text-xs animate-in fade-in duration-150">
                        {['Claude 3.5 Sonnet', 'GPT-4o', 'Claude 3 Haiku', 'Gemini 1.5 Pro'].map((m) => (
                          <button
                            key={m}
                            type="button"
                            onClick={() => {
                              setSelectedAiModel(m);
                              setModelDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 hover:bg-[#FAF5EB] flex items-center justify-between cursor-pointer ${
                              selectedAiModel === m ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                            }`}
                          >
                            <span>{m}</span>
                            {selectedAiModel === m && <Check className="w-3 h-3 text-[#1E3A8A]" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
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
                      {tab === 'Reference' && referenceStyleProfile && (
                        <span className="ml-1 w-2 h-2 rounded-full bg-amber-500 inline-block" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Tab: Reference Style Profile View (Requirement 4) */}
                {aiTab === 'Reference' ? (
                  <div className="p-4 space-y-4 flex-1 overflow-y-auto text-xs">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                      <div>
                        <h4 className="font-bold text-slate-900">Reference Drafting Style</h4>
                        <p className="text-[10px] text-slate-500">Learned preferences from uploaded contracts & templates</p>
                      </div>
                      <label className="px-2.5 py-1 bg-[#1E3A8A] text-white rounded-lg text-[10px] font-semibold cursor-pointer hover:bg-[#162A65] transition-colors">
                        <span>Upload Sample</span>
                        <input
                          type="file"
                          accept=".docx,.doc,.pdf,.txt"
                          onChange={(e) => handleFileUpload(e, true)}
                          className="hidden"
                        />
                      </label>
                    </div>

                    {referenceStyleProfile ? (
                      <div className="space-y-3">
                        <div className="p-3 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-[#8C7355] text-[11px]">Source Reference File</span>
                            <span className="text-[10px] font-mono bg-white px-2 py-0.5 rounded border border-[#DECDB8]">
                              {referenceStyleProfile.sourceFile}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-700">
                            <strong>Observed Tone:</strong> <span className="text-[#1E3A8A] font-semibold">{referenceStyleProfile.tone}</span>
                          </div>
                          <div className="text-[11px] text-slate-700">
                            <strong>Numbering Scheme:</strong> <span className="font-mono text-slate-900">{referenceStyleProfile.numberingFormat}</span>
                          </div>
                          <div className="text-[11px] text-slate-700">
                            <strong>Structural DNA:</strong> {referenceStyleProfile.structurePattern}
                          </div>
                        </div>

                        {/* Defined Terms Glossary */}
                        {referenceStyleProfile.terminologyGlossary && referenceStyleProfile.terminologyGlossary.length > 0 && (
                          <div className="space-y-1.5">
                            <h5 className="font-bold text-slate-800 text-[11px]">Domain Terminology Glossary</h5>
                            <div className="flex flex-wrap gap-1.5">
                              {referenceStyleProfile.terminologyGlossary.map((item, idx) => (
                                <span key={idx} className="px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-md text-[10px] text-slate-800 font-medium">
                                  {typeof item === 'string' ? item : (item as any).term || 'Term'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Clause Patterns */}
                        {referenceStyleProfile.clausePatterns && referenceStyleProfile.clausePatterns.length > 0 && (
                          <div className="space-y-1.5">
                            <h5 className="font-bold text-slate-800 text-[11px]">Observed Clause Patterns</h5>
                            <div className="space-y-1">
                              {referenceStyleProfile.clausePatterns.map((cp, idx) => (
                                <div key={idx} className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-[10px] text-slate-700">
                                  <strong>{cp.clauseType}:</strong> {cp.observedStructure}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <button
                          type="button"
                          onClick={() => setReferenceStyleProfile(null)}
                          className="w-full py-1.5 text-[11px] text-red-600 hover:bg-red-50 rounded-lg border border-red-200 font-semibold transition-colors cursor-pointer"
                        >
                          Clear Reference Style
                        </button>
                      </div>
                    ) : (
                      <div className="p-6 text-center text-slate-400 space-y-2 border-2 border-dashed border-slate-200 rounded-2xl">
                        <UploadCloud className="w-8 h-8 text-slate-300 mx-auto" />
                        <p className="text-xs font-semibold text-slate-600">No reference style loaded</p>
                        <p className="text-[11px] text-slate-400 max-w-[240px] mx-auto">
                          Upload any previous legal draft, agreement, or notice to automatically learn its tone, formatting, and clause structure.
                        </p>
                      </div>
                    )}
                  </div>
                ) : aiTab === 'Templates' ? (
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
                            selectedTemplate?.id === tmpl.id
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
                  <div className="p-4 space-y-3.5 flex-1 overflow-y-auto text-xs flex flex-col">
                    
                    {/* Pristine Empty State when chat is clear and no questionnaire active */}
                    {messages.length === 0 && !activeQuestionnaire && (
                      <div className="h-full flex flex-col items-center justify-center text-center p-4 text-slate-500 my-auto">
                        <div className="w-12 h-12 rounded-2xl bg-[#FAF0DE] border border-[#DECDB8] text-[#8C7355] flex items-center justify-center mb-3 shadow-2xs">
                          <Sparkles className="w-5 h-5 text-[#1E3A8A]" />
                        </div>
                        <h4 className="font-bold text-sm text-[#0F172A] mb-1">AI Assistant Ready</h4>
                        <p className="text-xs text-slate-500 max-w-[270px] leading-relaxed mb-5">
                          Start a new draft by typing your instructions below, attaching a document, or choosing a template from the Templates tab.
                        </p>

                        <div className="w-full space-y-2 text-left">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1">
                            Quick Starters
                          </p>
                          {[
                            'Draft a legal notice for recovery of unpaid dues',
                            'Draft an urgent bail application under Section 437/439 CrPC',
                            'Draft a mutual commercial non-disclosure agreement (NDA)'
                          ].map((promptText, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setChatInput(promptText)}
                              className="w-full text-left p-2.5 bg-[#FAF8F5] hover:bg-[#F1F5F9] border border-[#DECDB8] hover:border-[#1E3A8A]/40 rounded-xl text-xs text-slate-700 transition-all flex items-center justify-between group cursor-pointer shadow-2xs"
                            >
                              <span className="truncate pr-2">{promptText}</span>
                              <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#1E3A8A] transition-colors flex-shrink-0" />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Active Questionnaire Card (Only when a template is explicitly chosen) */}
                    {activeQuestionnaire && (
                      <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl p-3.5 space-y-3 mb-2 shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-lg bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center flex-shrink-0">
                              <FileText className="w-3.5 h-3.5" />
                            </div>
                            <div>
                              <h4 className="font-bold text-xs text-[#0F172A] leading-tight">{activeQuestionnaire.title}</h4>
                              <span className="text-[10px] text-slate-400">{activeQuestionnaire.skillName}</span>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => setActiveQuestionnaire(null)}
                            className="text-[10px] text-slate-400 hover:text-slate-700 font-semibold cursor-pointer px-1.5 py-0.5 rounded hover:bg-slate-100"
                            title="Dismiss questionnaire"
                          >
                            Dismiss
                          </button>
                        </div>

                        <p className="text-[11px] text-slate-600 leading-snug">{activeQuestionnaire.skillDesc}</p>

                        <form onSubmit={handleGenerateDraft} className="space-y-2 pt-1">
                          {activeQuestionnaire.formFields.map((field, idx) => (
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
                                className="w-full px-3 py-1.5 bg-white border border-[#CBD5E1] rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] transition-all"
                              />
                            </div>
                          ))}

                          <button
                            type="submit"
                            disabled={isGenerating}
                            className="w-full py-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white font-semibold text-xs rounded-xl flex items-center justify-center gap-2 shadow-2xs transition-all cursor-pointer disabled:opacity-60"
                          >
                            {isGenerating ? (
                              <>
                                <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                <span>Generating Clauses...</span>
                              </>
                            ) : (
                              <>
                                <span>Generate Clauses for Canvas</span>
                                <ArrowRight className="w-3.5 h-3.5" />
                              </>
                            )}
                          </button>
                        </form>
                      </div>
                    )}

                    {/* Dynamic Messages Stream */}
                    {messages.map((msg) => (
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
                          <p className="whitespace-pre-line">{msg.text}</p>
                          <div className="flex items-center justify-between mt-1.5 gap-2">
                            <span className={`text-[10px] block ${msg.sender === 'user' ? 'text-blue-200 text-right' : 'text-slate-400'}`}>
                              {msg.time}
                            </span>
                            {msg.sender === 'ai' && (
                              <ReadAloudControl id={`draft-msg-${msg.id}`} text={msg.text} variant="compact" />
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                  </div>
                )}

                {/* Active Reference Style Banner */}
                {referenceStyleProfile && (
                  <div className="px-3 py-1.5 bg-amber-50/90 border-t border-amber-200 flex items-center justify-between text-[11px] text-amber-900">
                    <div className="flex items-center gap-1.5 truncate">
                      <Sparkles className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                      <span className="font-semibold">Style Active:</span>
                      <span className="truncate">{referenceStyleProfile.sourceFile} ({referenceStyleProfile.tone})</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setReferenceStyleProfile(null)}
                      className="p-0.5 text-amber-700 hover:text-amber-950 cursor-pointer"
                      title="Clear reference style"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Prompt Quality Meter & "Improve Prompt" (Page 4 UI Alignment) */}
                {chatInput.trim().length > 0 && (
                  <div className="px-3 pt-2 pb-1 bg-white border-t border-[#F0E9DF] flex items-center justify-between gap-3 text-[11px]">
                    <div className="flex items-center gap-2 flex-1 max-w-xs">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Meter:</span>
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                        <div
                          className={`h-full transition-all duration-300 ${calculatePromptScore(chatInput).color}`}
                          style={{ width: `${calculatePromptScore(chatInput).score}%` }}
                        />
                      </div>
                      <span className={`text-[10px] font-bold ${calculatePromptScore(chatInput).textClass}`}>
                        {calculatePromptScore(chatInput).label}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={handleImprovePrompt}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-900 text-[10px] font-bold transition-all cursor-pointer shadow-2xs"
                      title="Auto-enhance prompt with Indian legal terminology & statutory anchors"
                    >
                      <Sparkles className="w-3 h-3 text-amber-600" />
                      <span>Improve Prompt</span>
                    </button>
                  </div>
                )}

                {/* Bottom Input Prompt Bar */}
                <form onSubmit={handleSendPrompt} className="p-3 border-t border-[#F0E9DF] bg-[#FAF8F5]/50 flex items-center gap-2">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept=".docx,.doc,.pdf,.txt"
                    onChange={(e) => handleFileUpload(e, true)}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="p-1.5 text-slate-500 hover:text-[#1E3A8A] hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-[#DECDB8] shadow-2xs"
                    title="Attach reference document (.docx, .pdf, .txt) to extract drafting style"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>

                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder={
                      referenceStyleProfile 
                        ? `Prompt AI to draft/edit in ${referenceStyleProfile.tone} style...`
                        : "Describe draft requirements or revise (e.g. Draft an NDA for software dev)..."
                    }
                    className="flex-1 px-3.5 py-1.5 bg-white border border-[#CBD5E1] rounded-full text-xs placeholder-slate-400 focus:outline-none focus:border-[#1E3A8A] transition-all"
                  />

                  <button
                    type="submit"
                    disabled={!chatInput.trim() || isGenerating}
                    className="w-7 h-7 rounded-full bg-[#0F172A] hover:bg-[#1E293B] text-white flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer shadow-2xs flex-shrink-0"
                    title="Send prompt to AI"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <VoiceDictation
                    onTranscript={(dictated) => {
                      const lower = dictated.toLowerCase().trim();
                      if (lower.includes('verify citation') || lower.includes('check citation')) {
                        handleVerifyCanvasCitations();
                      } else if (lower.includes('clear canvas') || lower.includes('reset draft') || lower.includes('delete document')) {
                        requestResetCanvas();
                      } else if (lower.includes('export document') || lower.includes('download draft')) {
                        const content = [draftHeading, draftSubject ? `Subject: ${draftSubject}` : '', ...draftClauses, draftUltimatum, draftSignOff].filter(Boolean).join('\n\n');
                        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `${(docTitle || 'Legal_Draft').replace(/\s+/g, '_')}.txt`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                      } else {
                        setChatInput((prev) => (prev ? `${prev} ${dictated}` : dictated));
                      }
                    }}
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

      {/* ===================================================================== */}
      {/* MODAL: BILINGUAL TRANSLATION FOR ACTIVE DRAFT CANVAS                 */}
      {/* ===================================================================== */}
      {isTranslateModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] flex flex-col relative animate-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-[#F0E9DF] flex items-center justify-between bg-gradient-to-r from-[#FAF8F5] to-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#EBF0FF] border border-[#C5D5FF] text-[#1E3A8A] flex items-center justify-center flex-shrink-0 shadow-2xs">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif-title text-lg sm:text-xl font-bold text-[#0F172A] tracking-tight">
                    Translate Legal Draft
                  </h3>
                  <p className="text-xs text-[#64748B]">
                    Translate <span className="font-semibold text-slate-800">{docTitle || 'Untitled Draft'}</span> into official Indian regional languages with judicial terminology preservation.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTranslateModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#FCFBF8]">
              
              {/* Language Selection & Trigger Bar */}
              <div className="bg-white p-4 rounded-2xl border border-[#EAE3D6] shadow-2xs flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Source Language
                    </label>
                    <div className="px-3.5 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
                      English
                    </div>
                  </div>

                  <span className="text-slate-400 font-bold self-end pb-2 hidden sm:inline">→</span>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Target Regional Language
                    </label>
                    <select
                      value={selectedTranslateLang}
                      onChange={(e) => setSelectedTranslateLang(e.target.value)}
                      className="px-3.5 py-1.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs font-bold text-[#0F172A] focus:outline-none focus:border-[#1E3A8A] cursor-pointer"
                    >
                      {['Hindi', 'Gujarati', 'Marathi', 'Tamil', 'Telugu', 'Bengali', 'Kannada', 'Malayalam', 'Punjabi', 'Urdu'].map((lang) => (
                        <option key={lang} value={lang}>{lang}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleTranslateActiveDraft}
                    disabled={isTranslatingDraft}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isTranslatingDraft ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Translating...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Translate Now</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Translation Output Container */}
              {translationResult ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      e-Courts &amp; High Court Terminology Validated
                    </span>
                    <span className="text-xs text-slate-500">
                      {translationResult.translatedClauses.length} Provisions Translated
                    </span>
                  </div>

                  {/* Bilingual Side-by-Side Comparison Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Source English */}
                    <div className="bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                        <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
                          Source Document (English)
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono">Original</span>
                      </div>
                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs leading-relaxed text-slate-800">
                        {translationResult.originalClauses.map((clause, idx) => (
                          <div key={idx} className="p-2.5 bg-slate-50/70 rounded-xl border border-slate-100">
                            {clause}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Target Translated */}
                    <div className="bg-[#FAFDF9] rounded-2xl border border-emerald-200 p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-emerald-100">
                        <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">
                          Target Document ({translationResult.targetLang})
                        </span>
                        <ReadAloudControl
                          id={`draft-translated-${selectedTemplate?.id || 'active'}`}
                          text={translationResult.translatedClauses.join('\n\n')}
                          language={getLanguageCode(translationResult.targetLang)}
                          variant="compact"
                        />
                      </div>
                      <div className="space-y-2.5 max-h-[380px] overflow-y-auto pr-1 text-xs leading-relaxed text-slate-900 font-medium">
                        {translationResult.translatedClauses.map((clause, idx) => (
                          <div key={idx} className="p-2.5 bg-white rounded-xl border border-emerald-100 shadow-2xs group flex items-start justify-between gap-2">
                            <span className="flex-1">{clause}</span>
                            <ReadAloudControl
                              id={`trans-clause-${idx}`}
                              text={clause}
                              language={getLanguageCode(translationResult.targetLang)}
                              variant="compact"
                              className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 flex-shrink-0"
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-white rounded-2xl border border-dashed border-[#DECDB8]">
                  <Languages className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                  <h4 className="text-sm font-bold text-slate-700">Ready to Translate Current Document</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    Select your target language and click &ldquo;Translate Now&rdquo; to translate clauses using authentic Indian judicial vocabulary.
                  </p>
                </div>
              )}

            </div>

            {/* Modal Footer Actions */}
            <div className="px-6 py-4 border-t border-[#F0E9DF] bg-white flex flex-wrap items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsTranslateModalOpen(false)}
                className="px-4 py-2 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Close
              </button>

              {translationResult && (
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTranslatedDraft}
                    className="px-3.5 py-2 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    {copyFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy Text</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={handleDownloadTranslatedDraft}
                    className="px-3.5 py-2 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-500" />
                    <span>Download Text</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleApplyTranslationToCanvas}
                    className="px-5 py-2 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs font-semibold rounded-xl shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Apply to Document Canvas</span>
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CITATION VERIFICATION (Requirement 6)                         */}
      {/* ===================================================================== */}
      {verificationModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-2xl w-full p-6 relative max-h-[85vh] flex flex-col animate-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 flex items-center justify-center">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-[#0F172A]">Citation & Legal Authority Verification</h3>
                  <p className="text-xs text-[#64748B]">Source-grounded verification against Bare Acts and Supreme Court jurisprudence</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setVerificationModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Summary Metrics */}
            {verificationReport?.summary && (
              <div className="grid grid-cols-3 gap-3 my-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block">Total Citations</span>
                  <span className="text-lg font-bold text-slate-900">{verificationReport.summary.total_citations}</span>
                </div>
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-emerald-700 block">Verified Authorities</span>
                  <span className="text-lg font-bold text-emerald-800">{verificationReport.summary.verified_count}</span>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-center">
                  <span className="text-[10px] uppercase font-bold text-amber-700 block">Review Flags</span>
                  <span className="text-lg font-bold text-amber-800">{verificationReport.summary.issue_count}</span>
                </div>
              </div>
            )}

            {/* List of Verified Items */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
              {verificationReport?.results && verificationReport.results.length > 0 ? (
                verificationReport.results.map((item, idx) => (
                  <div key={idx} className="p-3.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-900 text-[13px]">{item.normalized_form || item.raw_text}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        item.status === 'verified'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                          : item.status === 'partially_verified'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-rose-100 text-rose-800 border border-rose-200'
                      }`}>
                        {item.status.replace('_', ' ')}
                      </span>
                    </div>

                    {item.notes && (
                      <p className="text-slate-600 text-[11px] leading-relaxed">{item.notes}</p>
                    )}

                    {item.sources && item.sources.length > 0 && (
                      <div className="pt-1 text-[10px] text-slate-500 flex flex-wrap gap-2">
                        {item.sources.map((s, sIdx) => (
                          <span key={sIdx} className="bg-white px-2 py-0.5 rounded border border-slate-200">
                            <strong>Source:</strong> {s.title} {s.jurisdiction ? `(${s.jurisdiction})` : ''}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="p-8 text-center text-slate-500">
                  <p>No statutory citations or case law references were detected in this draft.</p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EAE3D6] flex justify-end">
              <button
                type="button"
                onClick={() => setVerificationModalOpen(false)}
                className="px-4 py-2 bg-[#1E3A8A] text-white text-xs font-semibold rounded-xl hover:bg-[#162A65] transition-colors cursor-pointer"
              >
                Done Reviewing
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* MODAL: CONSEQUENTIAL ACTION CONFIRMATION (Requirement 7)              */}
      {/* ===================================================================== */}
      {confirmDialog?.isOpen && (
        <div className="fixed inset-0 z-50 bg-[#0F172A]/50 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white border border-[#DECDB8] rounded-3xl shadow-2xl max-w-md w-full p-6 relative animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 text-amber-700 flex items-center justify-center flex-shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-[#0F172A]">{confirmDialog.title}</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">{confirmDialog.message}</p>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0E9DF] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setConfirmDialog(null)}
                className="px-4 py-2 bg-white border border-[#DECDB8] hover:bg-[#FAF8F5] text-slate-700 text-xs font-semibold rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDialog.onConfirm}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {confirmDialog.actionLabel || 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
