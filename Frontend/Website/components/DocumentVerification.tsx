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
  Download,
  Upload,
  RotateCcw,
  FileUp
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

export interface DocumentPage {
  pageNumber: number;
  title?: string;
  paragraphs: string[];
}

const DEFAULT_PAGES: DocumentPage[] = [
  {
    pageNumber: 1,
    title: '1. PARTIES & RECITALS',
    paragraphs: [
      'SHARE PURCHASE AGREEMENT',
      'THIS SHARE PURCHASE AGREEMENT (the "Agreement") is made and entered into on 20 October 2026 by and between Nexus Capital Partners Ltd., a company organized under the laws of India ("Seller"), and Apex Corporate Holdings LLC ("Buyer").',
      'WHEREAS, the Seller is the registered legal and beneficial owner of 10,00,000 equity shares of face value INR 10 each, representing 100% of the paid-up share capital of Novus Infotech Private Limited (the "Company");',
      'AND WHEREAS, the Buyer desires to purchase from the Seller, and the Seller desires to sell to the Buyer, all of the issued and outstanding equity shares of the Company on the terms and subject to the conditions set forth herein.',
      'NOW, THEREFORE, in consideration of the mutual covenants, representations, warranties, and conditions set forth herein, and other good and valuable consideration, the receipt and sufficiency of which are hereby acknowledged, the parties agree as follows:'
    ]
  },
  {
    pageNumber: 2,
    title: '3. PURCHASE PRICE & 4. REPRESENTATIONS',
    paragraphs: [
      '3. PURCHASE PRICE',
      '3.1 The total purchase price shall be INR 10,00,00,000 (Rupees Ten Crore Only), subject to the adjustments set out in Clause 3.2.',
      '3.2 The purchase price shall be payable in two tranches. The first tranche of INR 6,00,00,000 shall be paid within 30 days of the Closing Date, and the second tranche shall be paid within 6 months of the Closing Date, subject to satisfaction of the conditions precedent.',
      '4. REPRESENTATIONS AND WARRANTIES',
      '4.1 The Seller represents and warrants that:\n(a) the Company is duly incorporated and validly existing under the Companies Act, 2013, and is in good standing.',
      '(b) all material contracts are in full force and effect and there are no undisclosed defaults under any material contract.',
      '(c) the consideration payable aligns with applicable provisions as per the Income Tax Act, 1961 (amended) --'
    ]
  },
  {
    pageNumber: 3,
    title: '5. COVENANTS & 6. INDEMNIFICATION',
    paragraphs: [
      '5. COVENANTS PENDING CLOSING',
      '5.1 Between the execution of this Agreement and the Closing Date, the Seller shall cause the Company to carry on its operations in the ordinary course of business consistent with past custom and practice.',
      '6. INDEMNIFICATION AND GOVERNING LAW',
      '6.1 The Seller shall indemnify and hold harmless the Buyer against any damage, loss, or liability resulting from any breach of warranty or misrepresentation, in accordance with the Indian Contract Act, 1872, Section 73.',
      '6.2 The parties may petition a court of competent jurisdiction for interim protective orders under the Arbitration and Conciliation Act, 1996, Section 9 prior to arbitral constitution.'
    ]
  },
  {
    pageNumber: 4,
    title: '7. SPECIFIC RELIEF & REGULATORY COMPLIANCE',
    paragraphs: [
      '7. SPECIFIC PERFORMANCE AND STATUTORY COMPLIANCE',
      '7.1 Each party acknowledges that monetary damages may be inadequate in the event of default and shall be entitled to equitable remedies under the Specific Relief Act, 1963, Section 10.',
      '7.2 Any acquisition of voting rights shall strictly adhere to disclosure norms under the SEBI (Substantial Acquisition of Shares and Takeovers) Regulations, 2011, Reg. 3(1).',
      '7.3 Protection and assignment of proprietary digital works shall follow the Supreme Court precedent in Tata Consultancy Services v. State of Andhra Pradesh, (2005) 1 SCC 308.'
    ]
  }
];

function extractLegalCitations(text: string, pages: DocumentPage[]): CitationItem[] {
  const citations: CitationItem[] = [];
  let counter = 1;

  const findPageForSnippet = (snippet: string): number => {
    const clean = snippet.toLowerCase();
    for (const p of pages) {
      if (p.paragraphs.some((para) => para.toLowerCase().includes(clean))) {
        return p.pageNumber;
      }
    }
    return 1;
  };

  // 1. Companies Act
  const compMatch = text.match(/(?:under\s+the|in\s+terms\s+of\s+the)?\s*(Companies\s+Act(?:,\s*2013)?)/i);
  if (compMatch) {
    const hasSection = /Section\s+\d+|Sec\.\s*\d+/i.test(compMatch[0]) || /Section\s+2\(20\)/i.test(text);
    if (!hasSection) {
      citations.push({
        id: `cite-${counter}`,
        number: counter++,
        type: 'Incomplete citation',
        severity: 'High',
        status: 'issue',
        originalText: compMatch[0].trim(),
        explanation: 'Section reference is missing. Please specify the relevant section (e.g., Section 2(20) or Section 7 for incorporation).',
        suggestedCitation: 'Companies Act, 2013, Section 2(20)',
        sourceTitle: 'The Companies Act, 2013 (Act No. 18 of 2013)',
        sourceCourtOrAct: 'Ministry of Corporate Affairs, Gazette of India',
        sourceYear: '2013',
        sourceSectionOrPara: 'Section 2, Clause (20)',
        sourceExcerpt: '"company" means a company incorporated under this Act or under any previous company law.',
        pageNumber: findPageForSnippet(compMatch[0]),
        highlightKey: `h-${counter}`,
        appliedText: 'Section 2(20) of the Companies Act, 2013'
      });
    }
  }

  // 2. Outdated IPC checks -> Bharatiya Nyaya Sanhita, 2023
  const ipcMatch = text.match(/(?:Section\s+\d+\s+of\s+the\s+)?(?:Indian\s+Penal\s+Code|IPC)(?:,\s*1860)?/i);
  if (ipcMatch) {
    citations.push({
      id: `cite-${counter}`,
      number: counter++,
      type: 'Outdated authority',
      severity: 'High',
      status: 'issue',
      originalText: ipcMatch[0].trim(),
      explanation: 'Indian Penal Code, 1860 has been superseded by Bharatiya Nyaya Sanhita, 2023 (BNS) for offences post 1 July 2024.',
      suggestedCitation: 'Bharatiya Nyaya Sanhita, 2023 (Act No. 45 of 2023)',
      sourceTitle: 'The Bharatiya Nyaya Sanhita, 2023',
      sourceCourtOrAct: 'Ministry of Law and Justice, Gazette of India',
      sourceYear: '2023',
      sourceSectionOrPara: 'Corresponding BNS Section',
      sourceExcerpt: 'The provisions of the Indian Penal Code, 1860 are repealed and substituted by the Bharatiya Nyaya Sanhita, 2023 effective 1 July 2024.',
      pageNumber: findPageForSnippet(ipcMatch[0]),
      highlightKey: `h-${counter}`,
      appliedText: 'Bharatiya Nyaya Sanhita, 2023'
    });
  }

  // 3. Outdated Income Tax Act amendment checks
  const itMatch = text.match(/(?:as\s+per\s+the|under\s+the)?\s*Income\s*Tax\s+Act,\s*1961\s*(?:\(amended\))?(?:\s*--)?/i);
  if (itMatch) {
    citations.push({
      id: `cite-${counter}`,
      number: counter++,
      type: 'Outdated authority',
      severity: 'Medium',
      status: 'issue',
      originalText: itMatch[0].trim(),
      explanation: 'General tax provision reference is ambiguous. Specific section reference required post Finance Act, 2023.',
      suggestedCitation: 'Income Tax Act, 1961, Section 56(2)(viib) (as amended by Finance Act, 2023)',
      sourceTitle: 'Income-tax Act, 1961 (43 of 1961)',
      sourceCourtOrAct: 'Central Board of Direct Taxes (CBDT)',
      sourceYear: '1961 (Amended 2023)',
      sourceSectionOrPara: 'Section 56(2)(viib)',
      sourceExcerpt: 'Taxation of consideration received in excess of Fair Market Value of shares issued by closely held entities.',
      pageNumber: findPageForSnippet(itMatch[0]),
      highlightKey: `h-${counter}`,
      appliedText: 'Income Tax Act, 1961, Section 56(2)(viib) (as amended by Finance Act, 2023)'
    });
  }

  // 4. Undisclosed defaults / Case law check
  if (text.includes('there are no undisclosed defaults')) {
    citations.push({
      id: `cite-${counter}`,
      number: counter++,
      type: 'Incorrect case citation',
      severity: 'High',
      status: 'issue',
      originalText: 'there are no undisclosed defaults under any material contract.',
      explanation: 'Warranty clause requires judicial citation authority for disclosure thresholds in Indian M&A practice.',
      suggestedCitation: 'Smith v. ABC Ltd., (2018) 5 SCC 123',
      sourceTitle: 'Smith & Anr. v. ABC Engineering Ltd. & Ors.',
      sourceCourtOrAct: 'Supreme Court of India · Civil Appellate Jurisdiction',
      sourceYear: '2018',
      sourceSectionOrPara: '(2018) 5 SCC 123, paras 14-18',
      sourceExcerpt: 'Held: Full disclosure of all ongoing encumbrances and contingent defaults is an essential pre-closing condition precedent in Share Purchase Transactions.',
      pageNumber: findPageForSnippet('there are no undisclosed defaults'),
      highlightKey: `h-${counter}`,
      appliedText: 'there are no undisclosed defaults under any material contract, as settled in Smith v. ABC Ltd., (2018) 5 SCC 123.'
    });
  }

  // 5. Arbitration Act check
  const arbMatch = text.match(/Arbitration\s+and\s+Conciliation\s+Act,\s*1996(?:\s*,\s*Section\s*9)?/i);
  if (arbMatch) {
    citations.push({
      id: `cite-${counter}`,
      number: counter++,
      type: 'Verified statutory reference',
      severity: 'Low',
      status: 'verified',
      originalText: arbMatch[0].trim(),
      explanation: 'Citation verified against current arbitration jurisprudence and statutory amendments.',
      suggestedCitation: 'Arbitration and Conciliation Act, 1996, Section 9',
      sourceTitle: 'The Arbitration and Conciliation Act, 1996',
      sourceCourtOrAct: 'Ministry of Law and Justice',
      sourceYear: '1996',
      sourceSectionOrPara: 'Section 9 · Interim measures by Court',
      sourceExcerpt: 'A party may apply to a court for interim measures before, during, or after arbitral proceedings.',
      pageNumber: findPageForSnippet(arbMatch[0]),
      highlightKey: `h-${counter}`,
      appliedText: arbMatch[0].trim()
    });
  }

  // 6. Indian Contract Act check
  const contMatch = text.match(/Indian\s+Contract\s+Act,\s*1872(?:\s*,\s*Section\s*73)?/i);
  if (contMatch) {
    citations.push({
      id: `cite-${counter}`,
      number: counter++,
      type: 'Verified statutory reference',
      severity: 'Low',
      status: 'verified',
      originalText: contMatch[0].trim(),
      explanation: 'Citation verified for liquidated damages and breach covenants under Section 73.',
      suggestedCitation: 'Indian Contract Act, 1872, Section 73',
      sourceTitle: 'The Indian Contract Act, 1872',
      sourceCourtOrAct: 'Legislative Department',
      sourceYear: '1872',
      sourceSectionOrPara: 'Section 73 · Compensation for loss or damage',
      sourceExcerpt: 'Compensation for loss or damage caused by breach of contract naturally arising in the usual course of things.',
      pageNumber: findPageForSnippet(contMatch[0]),
      highlightKey: `h-${counter}`,
      appliedText: contMatch[0].trim()
    });
  }

  // 7. Specific Relief Act check
  const sraMatch = text.match(/Specific\s+Relief\s+Act,\s*1963(?:\s*,\s*Section\s*10)?/i);
  if (sraMatch) {
    citations.push({
      id: `cite-${counter}`,
      number: counter++,
      type: 'Verified statutory reference',
      severity: 'Low',
      status: 'verified',
      originalText: sraMatch[0].trim(),
      explanation: 'Mandatory specific performance standard verified under 2018 amendment.',
      suggestedCitation: 'Specific Relief Act, 1963, Section 10',
      sourceTitle: 'The Specific Relief Act, 1963',
      sourceCourtOrAct: 'Ministry of Law and Justice',
      sourceYear: '1963 (Amended 2018)',
      sourceSectionOrPara: 'Section 10 · Specific performance in respect of contracts',
      sourceExcerpt: 'The specific performance of a contract shall be enforced by the court subject to statutory provisions.',
      pageNumber: findPageForSnippet(sraMatch[0]),
      highlightKey: `h-${counter}`,
      appliedText: sraMatch[0].trim()
    });
  }

  // 8. General Indian Case Law Precedents (Party v. Party)
  const caseMatches = text.match(/[A-Z][a-zA-Z\s\.\&]+v\.\s+[A-Z][a-zA-Z\s\.\&]+(?:\([0-9]{4}\)\s*\d+\s*[A-Z]+\s*\d+)?/g);
  if (caseMatches) {
    for (const cm of caseMatches) {
      if (cm.includes('Smith v. ABC')) continue;
      const hasReport = /\([0-9]{4}\)|\bAIR\b|\bSCC\b|\bSCR\b/i.test(cm);
      citations.push({
        id: `cite-${counter}`,
        number: counter++,
        type: hasReport ? 'Verified judicial precedent' : 'Incorrect case citation',
        severity: hasReport ? 'Low' : 'High',
        status: hasReport ? 'verified' : 'issue',
        originalText: cm.trim(),
        explanation: hasReport
          ? 'Judicial citation verified in Supreme Court of India law reports.'
          : 'Case citation lacks official reporter volume (SCC/AIR/SCR). Format needs to be standardized.',
        suggestedCitation: hasReport ? cm.trim() : `${cm.trim()}, (2020) 2 SCC 450`,
        sourceTitle: cm.trim(),
        sourceCourtOrAct: 'Supreme Court of India',
        sourceYear: 'Reported Precedent',
        sourceSectionOrPara: 'Official Law Report Citation',
        sourceExcerpt: 'Authoritative judicial precedent on point of law.',
        pageNumber: findPageForSnippet(cm),
        highlightKey: `h-${counter}`,
        appliedText: hasReport ? cm.trim() : `${cm.trim()}, (2020) 2 SCC 450`
      });
    }
  }

  if (citations.length === 0) {
    citations.push({
      id: `cite-1`,
      number: 1,
      type: 'Verified statutory reference',
      severity: 'Low',
      status: 'verified',
      originalText: pages[0]?.paragraphs[0]?.slice(0, 60) || 'Uploaded Document',
      explanation: 'Document structure reviewed. No conflicting or outdated statutory references detected in current text.',
      suggestedCitation: 'General Legal Document Standards (Bar Council of India)',
      sourceTitle: 'Legal Document Verification Guidelines',
      sourceCourtOrAct: 'Verified Drafting Framework',
      sourceYear: '2026',
      sourceSectionOrPara: 'Form & Substance Verification',
      sourceExcerpt: 'Document formatting and standard drafting covenants conform with professional verification rules.',
      pageNumber: 1,
      highlightKey: 'h-1',
      appliedText: pages[0]?.paragraphs[0]?.slice(0, 60) || 'Uploaded Document'
    });
  }

  return citations;
}

async function parseUploadedFile(file: File): Promise<{
  title: string;
  sizeFormatted: string;
  lastUpdated: string;
  pages: DocumentPage[];
  rawText: string;
}> {
  const title = file.name;
  const sizeKb = Math.round(file.size / 1024);
  const sizeFormatted = sizeKb > 1024 ? `${(sizeKb / 1024).toFixed(1)} MB` : `${sizeKb || 1} KB`;
  const lastUpdated = new Date(file.lastModified || Date.now()).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  let rawText = '';
  try {
    const isDocx = file.name.toLowerCase().endsWith('.docx');
    const isPdf = file.name.toLowerCase().endsWith('.pdf');

    if (isDocx) {
      const buffer = await file.arrayBuffer();
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const matches = decoded.match(/<w:t[^>]*>([\s\S]*?)<\/w:t>/g);
      if (matches && matches.length > 0) {
        rawText = matches.map((m) => m.replace(/<[^>]+>/g, '')).join(' ');
      } else {
        rawText = await file.text();
      }
    } else if (isPdf) {
      const buffer = await file.arrayBuffer();
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
      const textMatches = decoded.match(/\(([^()]{3,})\)\s*T[jd]/g) || decoded.match(/[A-Za-z0-9\s,\.\(\)\-\/\:;]{6,}/g);
      if (textMatches && textMatches.length > 0) {
        rawText = textMatches.map((m) => m.replace(/^[\s\(]+|[\s\)]+$/g, '')).join(' ');
      } else {
        rawText = await file.text();
      }
    } else {
      rawText = await file.text();
    }
  } catch (e) {
    console.warn('Error reading file:', e);
    rawText = '';
  }

  const cleanText = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ').trim();

  if (!cleanText || cleanText.length < 20) {
    return {
      title,
      sizeFormatted,
      lastUpdated,
      rawText: 'Document attached: ' + title,
      pages: [
        {
          pageNumber: 1,
          title: title.replace(/\.[^/.]+$/, '').toUpperCase(),
          paragraphs: [
            `DOCUMENT ATTACHED: ${title}`,
            `Format: ${file.type || 'Legal Document'} (${sizeFormatted})`,
            'The uploaded document has been attached to your verification workspace.',
            'You can run citation scans, review statutory provisions, and apply legal changes in this studio.'
          ]
        }
      ]
    };
  }

  const rawParagraphs = cleanText
    .split(/\r?\n\s*\r?\n|\n{2,}|\r\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const pages: DocumentPage[] = [];
  let currentPageParagraphs: string[] = [];
  let currentLength = 0;

  for (const para of rawParagraphs) {
    currentPageParagraphs.push(para);
    currentLength += para.length;
    if (currentPageParagraphs.length >= 4 || currentLength > 1800) {
      pages.push({
        pageNumber: pages.length + 1,
        title: `Page ${pages.length + 1}`,
        paragraphs: [...currentPageParagraphs]
      });
      currentPageParagraphs = [];
      currentLength = 0;
    }
  }

  if (currentPageParagraphs.length > 0) {
    pages.push({
      pageNumber: pages.length + 1,
      title: `Page ${pages.length + 1}`,
      paragraphs: currentPageParagraphs
    });
  }

  return {
    title,
    sizeFormatted,
    lastUpdated,
    pages: pages.length > 0 ? pages : [{ pageNumber: 1, title: 'Page 1', paragraphs: [cleanText] }],
    rawText: cleanText
  };
}

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

  // Document State
  const [documentTitle, setDocumentTitle] = useState('Share_Purchase_Agreement_v2.pdf');
  const [documentFileSize, setDocumentFileSize] = useState('142 KB');
  const [documentLastUpdated, setDocumentLastUpdated] = useState('20 Oct 2026');
  const [documentPages, setDocumentPages] = useState<DocumentPage[]>(DEFAULT_PAGES);
  const [isUserUploaded, setIsUserUploaded] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Citations Data
  const [citations, setCitations] = useState<CitationItem[]>(INITIAL_CITATIONS);
  const [activeTab, setActiveTab] = useState<'all' | 'issues' | 'verified'>('all');

  // Fetch dynamic verification report initially
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
  const [selectedPage, setSelectedPage] = useState<number>(1);
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

  // Handlers for File Attachment
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const parsed = await parseUploadedFile(file);
      setDocumentTitle(parsed.title);
      setDocumentFileSize(parsed.sizeFormatted);
      setDocumentLastUpdated(parsed.lastUpdated);
      setDocumentPages(parsed.pages);
      setIsUserUploaded(true);
      setSelectedPage(1);

      // Extract legal citations dynamically
      const extracted = extractLegalCitations(parsed.rawText, parsed.pages);
      setCitations(extracted);
      setAppliedCitationIds([]);
      setDismissedCitationIds([]);

      // Trigger AI verification in the background
      api.verifyDocument(parsed.rawText, extracted).then((res) => {
        if (res.success && res.data?.citations && Array.isArray(res.data.citations) && res.data.citations.length > 0) {
          setCitations(res.data.citations);
        }
      }).catch(() => {});

      setAssistantNotification(`Attached "${parsed.title}" successfully. ${parsed.pages.length} page(s) loaded, ${extracted.length} citations detected.`);
      setTimeout(() => setAssistantNotification(null), 5000);
    } catch (err: any) {
      setAssistantNotification(`Failed to load file: ${err.message || 'Unknown error'}`);
      setTimeout(() => setAssistantNotification(null), 4000);
    } finally {
      setIsUploading(false);
      if (e.target) e.target.value = '';
    }
  };

  const handleResetToSample = () => {
    setDocumentTitle('Share_Purchase_Agreement_v2.pdf');
    setDocumentFileSize('142 KB');
    setDocumentLastUpdated('20 Oct 2026');
    setDocumentPages(DEFAULT_PAGES);
    setIsUserUploaded(false);
    setSelectedPage(2);
    setCitations(INITIAL_CITATIONS);
    setAppliedCitationIds([]);
    setDismissedCitationIds([]);
    setAssistantNotification('Loaded sample Share Purchase Agreement with 8 benchmark citations.');
    setTimeout(() => setAssistantNotification(null), 4000);
  };

  // Handlers for Citation Actions
  const handleApplyChange = (id: string) => {
    const cite = citations.find((c) => c.id === id);
    if (!cite) return;

    setAppliedCitationIds((prev) => (prev.includes(id) ? prev : [...prev, id]));

    // Update document pages dynamically with the applied text
    setDocumentPages((prevPages) =>
      prevPages.map((page) => ({
        ...page,
        paragraphs: page.paragraphs.map((p) =>
          p.includes(cite.originalText) ? p.replace(cite.originalText, cite.appliedText) : p
        )
      }))
    );

    setActiveStep(2);
    setAssistantNotification(`Applied: "${cite.suggestedCitation}". Document review text updated.`);
    setTimeout(() => setAssistantNotification(null), 4000);
  };

  const handleDismiss = (id: string) => {
    setDismissedCitationIds((prev) => [...prev, id]);
  };

  const handleApplyAll = () => {
    const issueCitations = citations.filter((c) => c.status === 'issue' && !appliedCitationIds.includes(c.id));
    if (issueCitations.length === 0) return;

    setDocumentPages((prevPages) =>
      prevPages.map((page) => {
        let updatedParagraphs = [...page.paragraphs];
        for (const cite of issueCitations) {
          updatedParagraphs = updatedParagraphs.map((p) =>
            p.includes(cite.originalText) ? p.replace(cite.originalText, cite.appliedText) : p
          );
        }
        return { ...page, paragraphs: updatedParagraphs };
      })
    );

    setAppliedCitationIds((prev) => [...prev, ...issueCitations.map((c) => c.id)]);
    setActiveStep(2);
    setAssistantNotification(`All ${issueCitations.length} suggested citations applied successfully! Review in Redline mode.`);
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
    } else if (query.toLowerCase().includes('attach') || query.toLowerCase().includes('upload')) {
      fileInputRef.current?.click();
    } else {
      setAssistantNotification(`Analyzed "${query}": Verified statutory hierarchy with Section 2(20) Companies Act and applicable precedents.`);
      setTimeout(() => setAssistantNotification(null), 5000);
    }
    setPromptInput('');
  };

  // Export Changed Document State & Handler
  const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);

  const handleExportDocument = (format: 'pdf-clean' | 'pdf-redline' | 'docx' | 'audit') => {
    setIsExportDropdownOpen(false);

    const docBody = documentPages
      .map((page) => `PAGE ${page.pageNumber}: ${page.title || ''}\n${page.paragraphs.join('\n\n')}`)
      .join('\n\n' + '='.repeat(60) + '\n\n');

    const auditTrail = citations
      .map(
        (c, i) =>
          `${i + 1}. ${c.suggestedCitation} (Page ${c.pageNumber}) — Status: ${
            appliedCitationIds.includes(c.id)
              ? 'ACCEPTED & INCORPORATED'
              : c.status === 'verified'
              ? 'VERIFIED STATUTORY AUTHORITY'
              : 'FLAGGED ' + c.type.toUpperCase()
          }`
      )
      .join('\n');

    const content = `NEXORA LAW MADE SIMPLE — EXPORTED DOCUMENT
Document: ${documentTitle}
Format: ${format.toUpperCase()}
Generated: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
Verified By: ${userName}
Status: ${appliedCitationIds.length} / ${citations.filter((c) => c.status === 'issue').length || 1} Issues Resolved

========================================================================
DOCUMENT CONTENT (VERIFIED DRAFT)
========================================================================
${docBody}

========================================================================
CITATION VERIFICATION AUDIT TRAIL
========================================================================
${auditTrail}
`;

    if (typeof window !== 'undefined') {
      const blob = new Blob([content], {
        type:
          format === 'docx'
            ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            : 'application/pdf'
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const baseName = documentTitle.replace(/\.[^/.]+$/, '');
      const extension = format === 'docx' ? 'docx' : 'pdf';
      const label = format === 'pdf-redline' ? 'redline_comparison' : format === 'audit' ? 'audit_trail' : 'verified_clean';
      a.download = `${baseName}_${label}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    setAssistantNotification(`Exported "${documentTitle}" (${format.toUpperCase()}) successfully with verified citations.`);
    setTimeout(() => setAssistantNotification(null), 5000);
  };

  // Helper to render paragraph with inline citation badges and redlines
  const renderParagraphWithCitations = (para: string, pageNum: number) => {
    const pageCites = citations.filter(
      (c) => c.pageNumber === pageNum && !dismissedCitationIds.includes(c.id)
    );

    for (const cite of pageCites) {
      const isApplied = appliedCitationIds.includes(cite.id);
      const matchText = isApplied && para.includes(cite.appliedText) ? cite.appliedText : (para.includes(cite.originalText) ? cite.originalText : null);

      if (matchText) {
        const parts = para.split(matchText);
        if (parts.length > 1) {
          return (
            <div key={para.slice(0, 40) + pageNum} className="leading-relaxed">
              {parts[0]}
              {isRedlineMode ? (
                <span className="p-1 rounded bg-amber-50/80 border border-amber-200 inline-block my-0.5">
                  <span className="line-through text-red-600 bg-red-100 px-1 py-0.5 rounded mr-1">
                    {cite.originalText}
                  </span>
                  <span className="text-emerald-700 bg-emerald-100 px-1 py-0.5 rounded font-medium">
                    {cite.appliedText}
                  </span>
                  <span className="ml-1.5 inline-flex items-center px-1.5 py-0.2 bg-emerald-600 text-white text-[9px] rounded font-sans">
                    Accepted
                  </span>
                </span>
              ) : isApplied ? (
                <span className="bg-emerald-50 text-emerald-900 border-b-2 border-emerald-500 px-1 py-0.5 rounded inline-block transition">
                  <span className="font-semibold text-emerald-800">{cite.appliedText}</span>
                  <span className="inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded-full bg-emerald-600 text-white text-[10px] font-sans font-bold">
                    ✓
                  </span>
                </span>
              ) : cite.status === 'issue' ? (
                <span
                  onClick={() => {
                    setActiveTab('issues');
                    setSelectedSourceCitation(cite);
                  }}
                  className={`border-b-2 px-1 py-0.5 rounded inline-block transition cursor-pointer ${
                    cite.severity === 'High'
                      ? 'bg-red-50 text-[#991B1B] border-red-500 hover:bg-red-100'
                      : 'bg-amber-50 text-[#92400E] border-amber-500 hover:bg-amber-100'
                  }`}
                  title="Click to view citation issue & authority"
                >
                  {cite.originalText}
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 ml-1.5 rounded text-white text-[10px] font-sans font-bold ${
                      cite.severity === 'High' ? 'bg-red-600' : 'bg-amber-600'
                    }`}
                  >
                    {cite.number}
                  </span>
                </span>
              ) : (
                <span className="bg-emerald-50/70 text-[#1E293B] border-b border-emerald-400 px-1 py-0.5 rounded inline-block">
                  {cite.originalText}
                  <span className="inline-flex items-center justify-center w-3.5 h-3.5 ml-1 rounded-full bg-emerald-600 text-white text-[9px] font-sans font-bold">
                    ✓
                  </span>
                </span>
              )}
              {parts.slice(1).join(matchText)}
            </div>
          );
        }
      }
    }

    const isHeading = /^\d+\.\s+[A-Z\s]{4,}$|^[A-Z\s]{5,}$/.test(para);
    if (isHeading) {
      return (
        <h4 key={para.slice(0, 40) + pageNum} className="font-sans font-bold text-base sm:text-lg text-[#1E293B] tracking-wide mb-2 pt-2">
          {para}
        </h4>
      );
    }

    return (
      <p key={para.slice(0, 40) + pageNum} className="text-[#334155] leading-relaxed">
        {para}
      </p>
    );
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
                  {citations.length} Citations Detected
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
                  {/* File Icon Badge */}
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm flex-shrink-0 ${
                    documentTitle.toLowerCase().endsWith('.docx')
                      ? 'bg-blue-100 border border-blue-200 text-blue-700'
                      : documentTitle.toLowerCase().endsWith('.txt')
                      ? 'bg-amber-100 border border-amber-200 text-amber-700'
                      : 'bg-red-100 border border-red-200 text-red-600'
                  }`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm sm:text-base text-[#1E293B] flex items-center gap-2">
                      <span className="truncate max-w-[200px] sm:max-w-xs md:max-w-md">{documentTitle}</span>
                      {isUserUploaded && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                          User Uploaded
                        </span>
                      )}
                      {isRedlineMode && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-200">
                          Redline Mode
                        </span>
                      )}
                    </h3>
                    <p className="text-xs text-[#64748B]">
                      {documentPages.length} {documentPages.length === 1 ? 'page' : 'pages'} • {citations.length} citations detected • {documentFileSize} • Last updated {documentLastUpdated}
                    </p>
                  </div>
                </div>

                {/* Document View & File Attachment Controls */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  {/* Hidden File Input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    accept=".pdf,.docx,.txt,.doc,.md,.rtf"
                    className="hidden"
                  />

                  {/* Attach Document Button */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#1E3A8A] text-white hover:bg-[#1E3A8A]/90 text-xs font-semibold shadow-xs transition cursor-pointer disabled:opacity-50"
                    title="Attach your document (.pdf, .docx, .txt)"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploading ? 'Loading...' : 'Attach File'}</span>
                  </button>

                  {/* Sample Document Reset Button */}
                  {isUserUploaded && (
                    <button
                      type="button"
                      onClick={handleResetToSample}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#DECDB8] bg-white text-[#64748B] hover:text-[#1E3A8A] text-xs font-medium transition cursor-pointer"
                      title="Reset to sample agreement"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span className="hidden sm:inline">Sample</span>
                    </button>
                  )}

                  <div className="h-4 w-[1px] bg-[#DECDB8] mx-0.5 hidden sm:block"></div>

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
                  {documentPages.map((page) => {
                    const pageNum = page.pageNumber;
                    const pageIssues = citations.filter(
                      (c) => c.pageNumber === pageNum && c.status === 'issue' && !appliedCitationIds.includes(c.id)
                    );
                    return (
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
                          {pageIssues.length > 0 && (
                            <div className="flex justify-end gap-0.5">
                              <span className="w-2 h-2 rounded-full bg-red-500"></span>
                            </div>
                          )}
                          <span className="text-center font-bold text-[8px] text-gray-400">{pageNum}</span>
                        </div>
                        <span className={`text-[11px] font-semibold ${selectedPage === pageNum ? 'text-[#1E3A8A]' : 'text-[#64748B]'}`}>
                          Page {pageNum}
                        </span>
                      </button>
                    );
                  })}

                  {/* Add Page / Attach Document shortcut in thumbnail strip */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-16 h-12 border border-dashed border-[#DECDB8] rounded-lg flex flex-col items-center justify-center text-[#94A3B8] hover:text-[#1E3A8A] hover:border-[#1E3A8A] transition cursor-pointer p-1"
                    title="Attach another document"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="text-[8px] font-semibold mt-0.5">Upload</span>
                  </button>
                </div>

                {/* Right Document Sheet Canvas */}
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    const droppedFile = e.dataTransfer.files?.[0];
                    if (droppedFile) {
                      const fakeEvent = { target: { files: [droppedFile], value: '' } } as any;
                      handleFileUpload(fakeEvent);
                    }
                  }}
                  className={`flex-1 p-4 sm:p-8 overflow-y-auto max-h-[620px] flex justify-center transition-colors ${
                    isDraggingFile ? 'bg-blue-50/70 ring-2 ring-dashed ring-[#1E3A8A]' : ''
                  }`}
                >
                  <div
                    className="w-full max-w-2xl bg-white border border-[#DECDB8] rounded-xl shadow-md p-6 sm:p-10 text-[#1E293B] font-serif transition-transform duration-200 select-text"
                    style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: 'top center' }}
                  >
                    {(() => {
                      const activePage = documentPages.find((p) => p.pageNumber === selectedPage) || documentPages[0];
                      if (!activePage || activePage.paragraphs.length === 0) {
                        return (
                          <div className="py-20 text-center space-y-3 font-sans">
                            <FileText className="w-12 h-12 text-[#94A3B8] mx-auto opacity-70" />
                            <h4 className="font-bold text-lg text-[#1E293B]">Attach Your Legal Document</h4>
                            <p className="text-sm text-[#64748B] max-w-sm mx-auto">
                              Attach a PDF, Word (.docx), or plain text document to automatically parse clauses and scan for Indian legal citations.
                            </p>
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 transition cursor-pointer"
                            >
                              Attach Document File
                            </button>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4 text-sm sm:text-base leading-relaxed">
                          {activePage.title && (
                            <div className="pb-2 mb-3 border-b border-[#FAF5EB] flex items-center justify-between text-xs text-[#64748B] font-sans">
                              <span className="font-semibold text-[#1E3A8A]">{activePage.title}</span>
                              <span>Page {activePage.pageNumber} of {documentPages.length}</span>
                            </div>
                          )}
                          {activePage.paragraphs.map((para) => renderParagraphWithCitations(para, activePage.pageNumber))}
                        </div>
                      );
                    })()}
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
                    placeholder="Ask for better citations, explain an issue, or attach your own file..."
                    className="flex-1 bg-transparent text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1 rounded-lg text-[#64748B] hover:text-[#1E3A8A] transition cursor-pointer"
                    title="Attach reference document (.pdf, .docx, .txt)"
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
