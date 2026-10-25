import { Template, Draft, CaseModel, Client, BareAct, AppSetting } from '../models/AppModels';

export const SEED_TEMPLATES = [
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
    subject: 'Pleadings and Submissions on behalf of the Petitioner',
    toPlaceholder: '[Hon’ble Court / Bench Name]',
    bodyClauses: [
      'STATEMENT OF JURISDICTION: [Jurisdiction pleadings under applicable constitutional or statutory provisions will be synthesized based on your case details]',
      'STATEMENT OF FACTS: [Factual background, material dispute events, and impugned actions will be detailed here upon generation]',
      'ARGUMENTS ADVANCED: [Constitutional grounds, statutory sections, and legal submissions on framed issues will appear here]'
    ],
    ultimatum: 'PRAYER: [Specific relief, declarations, or directions sought from the Hon’ble Bench will be formulated here]',
    signOffTitle: 'Respectfully Submitted,\nCounsels for the Petitioner'
  }
];

export const SEED_DRAFTS = [
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
      'That the Applicant has been falsely implicated in FIR No. 204/2026 registered at P.S. Connaught Place under Section 420/406 IPC.',
      'That the entire dispute is purely civil and contractual in nature arising out of commercial supply defaults.',
      'That the Applicant is a respectable citizen with deep roots in society and is not a flight risk.'
    ],
    ultimatum: 'It is therefore most respectfully prayed that this Hon’ble Court may be pleased to release the Applicant on regular bail on terms deemed fit.',
    signOffTitle: 'Advocate for the Applicant'
  }
];

export const SEED_CASES = [
  {
    id: 'case-1',
    cnr: 'DLHC010048212024',
    title: 'Gupta Infotech Pvt. Ltd. v. Union of India & Ors.',
    court: 'High Court of Delhi',
    caseType: 'Writ Petition (Civil) · WP(C) 4821/2024',
    filingNumber: '4821/2024',
    filingDate: '12 Mar 2024',
    petitioner: 'Gupta Infotech Pvt. Ltd.',
    respondent: 'Union of India & Anr.',
    statusBadge: {
      label: 'Listed for Hearing',
      date: '04 Nov 2026',
      type: 'hearing'
    },
    isActive: true,
    isStarred: true,
    isFollowed: true,
    clientName: 'Aditya Gupta',
    subject: 'Arbitrary Cancellation of GeM Portal Vendor Registration',
    acts: ['Article 226 of the Constitution', 'Information Technology Act, 2000'],
    currentStatusText: 'Pending — Final Hearing',
    currentStatusDesc: 'Rejoinder affidavit filed. Division Bench to hear arguments on natural justice violation.',
    plainLanguageSummary: 'The company challenged the government department\'s decision to blacklist their vendor registration without giving prior notice or an opportunity to be heard.',
    briefFacts: 'Petitioner was an empanelled hardware vendor on the GeM portal whose registration was abruptly suspended citing alleged specification defaults without issuing a show-cause notice.',
    nextHearing: {
      date: '04 Nov 2026',
      dayTime: 'Wednesday at 02:15 PM',
      bench: 'Hon’ble Division Bench (Court 12)',
      courtRoom: 'Court Room 12',
      itemNo: 'Item No. 24'
    },
    timeline: [
      { date: '10 Oct 2026', title: 'Rejoinder Filed by Petitioner', desc: 'Rejoinder affidavit with supporting compliance reports submitted.' },
      { date: '14 Aug 2026', title: 'Interim Injunction Granted', desc: 'Operation of blacklisting order stayed subject to deposit of performance bank guarantee.', hasOrderButton: true, orderId: 'ord-882' }
    ],
    documents: [
      { id: 'doc-1', title: 'Writ Petition (Final).pdf', date: '12 Mar 2024', size: '4.2 MB', type: 'pdf' },
      { id: 'doc-2', title: 'Stay Order dated 14-08-2026.pdf', date: '14 Aug 2026', size: '420 KB', type: 'pdf' }
    ],
    partiesList: [
      { name: 'Gupta Infotech Pvt. Ltd.', role: 'Petitioner', advocate: 'Adv. Saurabh Sharma' },
      { name: 'Union of India through Secretary, MeitY', role: 'Respondent', advocate: 'CGSC Delhi' }
    ]
  },
  {
    id: 'case-2',
    cnr: 'MHCC020011922025',
    title: 'Sharma v. State of Maharashtra',
    court: 'City Civil & Sessions Court, Greater Mumbai',
    caseType: 'Criminal Appeal · Cr.A. 119/2025',
    filingNumber: '119/2025',
    filingDate: '18 Jan 2025',
    petitioner: 'Vikram Sharma',
    respondent: 'State of Maharashtra',
    statusBadge: {
      label: 'Hearing Today',
      date: '28 Oct 2026',
      type: 'hearing'
    },
    isActive: true,
    isStarred: true,
    isFollowed: true,
    clientName: 'Vikram Sharma',
    subject: 'Appeal Against Conviction under Section 138 NI Act',
    acts: ['Negotiable Instruments Act, 1881', 'BNSS 2023'],
    currentStatusText: 'Arguments Stage',
    currentStatusDesc: 'Final arguments on rebuttal of statutory presumption under Section 139.',
    plainLanguageSummary: 'Appeal filed against Magistrate judgment holding appellant liable for cheque dishonour.',
    briefFacts: 'Appellant asserts that the signed cheque leaf was issued purely as security for an unfulfilled business consignment.',
    nextHearing: {
      date: '28 Oct 2026',
      dayTime: 'Today at 10:30 AM',
      bench: 'Sessions Judge Court 4',
      courtRoom: 'Court Room 4',
      itemNo: 'Item No. 06'
    },
    timeline: [
      { date: '28 Oct 2026', title: 'Hearing Scheduled', desc: 'Oral arguments on defence witness credibility.' },
      { date: '15 Sep 2026', title: 'Trial Court Records Received', desc: 'Lower Court Record (LCR) paperbook prepared.' }
    ],
    documents: [
      { id: 'doc-3', title: 'Appeal Memo.pdf', date: '18 Jan 2025', size: '2.8 MB', type: 'pdf' }
    ],
    partiesList: [
      { name: 'Vikram Sharma', role: 'Appellant', advocate: 'Adv. Saurabh Sharma' },
      { name: 'State of Maharashtra', role: 'Respondent', advocate: 'Public Prosecutor' }
    ]
  }
];

export const SEED_CLIENTS = [
  {
    id: 'client-1',
    name: 'Rohan Sharma',
    type: 'Individual',
    initials: 'RS',
    phone: '+91 98200 12345',
    email: 'rohan.sharma@gmail.com',
    address: 'Flat 402, Sunshine Heights, Andheri West, Mumbai 400053',
    clientSince: 'Jan 2024',
    preferredLanguage: 'English / Hindi',
    notes: 'Primary contact for Sharma v. State tenancy & recovery proceedings.',
    lastActivity: '2 hours ago',
    matters: [
      {
        id: 'mat-1',
        title: 'Sharma v. Sunshine Builders Pvt. Ltd.',
        category: 'Property & Tenancy',
        court: 'Small Causes Court, Mumbai',
        status: 'Active',
        nextHearing: '28 Oct 2026',
        courtroom: 'Court 4',
        judge: 'Shri S.K. Kulkarni'
      }
    ],
    documents: [
      {
        id: 'cdoc-1',
        name: 'Registered Lease Deed.pdf',
        category: 'Tenancy',
        type: 'PDF',
        size: '2.4 MB',
        date: '14 Oct 2026',
        status: 'Verified'
      }
    ],
    hearings: [
      {
        id: 'hrg-1',
        date: '28 Oct 2026',
        time: '10:30 AM',
        title: 'Oral Arguments',
        matter: 'Sharma v. Sunshine Builders',
        court: 'Small Causes Court',
        courtroom: 'Room 4',
        status: 'Upcoming'
      }
    ],
    notesList: [
      { id: 'note-1', date: '24 Oct 2026', author: 'Adv. Saurabh', text: 'Client requested expedited notice draft under Sec 106.' }
    ],
    communications: [
      { id: 'comm-1', date: '24 Oct 2026', time: '04:30 PM', type: 'Phone Call', summary: 'Discussed hearing agenda for 28 Oct.', duration: '12 mins' }
    ]
  }
];

export const SEED_BARE_ACTS = [
  {
    id: 'act-bns',
    name: 'Bharatiya Nyaya Sanhita (BNS), 2023',
    category: 'Criminal',
    year: 2023,
    totalSections: '358 Sections',
    enactedDate: '1 July 2024',
    summary: 'The principal substantive penal code of India replacing the Indian Penal Code, 1860 with modern definitions of organized crime, terrorism, and community service punishments.',
    keySections: [
      {
        number: 'Section 103',
        title: 'Punishment for Murder & Mob Lynching',
        plainExplanation: 'Defines statutory punishment for murder (death or life imprisonment). Subsection (2) specifically introduces mandatory death or life imprisonment for murder committed by 5 or more persons acting in concert on grounds of race, caste, or community.',
        ingredients: [
          'Actus reus: Causing intentional death of a human being.',
          'Mens rea: Clear intention or knowledge that act is sufficient in ordinary course of nature to cause death.',
          'Sub-clause (2): Concert of 5 or more persons acting together on grounds of identity.'
        ],
        precedent: 'State of Maharashtra v. Mohd. Sajid (2025) SCC Online SC 41',
        newActEquivalent: 'Replaces Section 302 IPC, 1860'
      },
      {
        number: 'Section 318',
        title: 'Cheating and Dishonestly Inducing Delivery of Property',
        plainExplanation: 'Substantive punishment for deceit and fraudulent misrepresentation inducing delivery of property or alteration of valuable securities.',
        ingredients: [
          'Deception of any person.',
          'Fraudulently or dishonestly inducing the person so deceived to deliver property.'
        ],
        precedent: 'Vesa Holdings P. Ltd. v. State of Kerala (2015) 8 SCC 293',
        newActEquivalent: 'Replaces Section 420 IPC, 1860'
      }
    ]
  },
  {
    id: 'act-constitution',
    name: 'Constitution of India',
    category: 'Constitutional',
    year: 1950,
    totalSections: '395 Articles (12 Schedules)',
    enactedDate: '26 January 1950',
    summary: 'The supreme legal document of the Republic of India laying down fundamental rights, directive principles, and the framework of governance.',
    keySections: [
      {
        number: 'Article 21',
        title: 'Protection of Life and Personal Liberty',
        plainExplanation: 'No citizen can be deprived of life or liberty except according to procedure established by law.',
        ingredients: ['Procedure must be just, fair and reasonable (Maneka Gandhi doctrine).'],
        precedent: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248'
      },
      {
        number: 'Article 32',
        title: 'Remedies for enforcement of Fundamental Rights',
        plainExplanation: 'Grants citizens right to move Supreme Court directly for issuance of prerogative writs.',
        ingredients: ['Infringement of Part III Fundamental Rights.'],
        precedent: 'Fertilizer Corporation Kamagar Union v. Union of India (1981) 1 SCC 568'
      }
    ]
  }
];

export async function seedInitialDatabase() {
  try {
    const templateCount = await Template.countDocuments();
    if (templateCount === 0) {
      console.log('[Seed] Seeding default templates...');
      await Template.insertMany(SEED_TEMPLATES);
    }

    const draftCount = await Draft.countDocuments();
    if (draftCount === 0) {
      console.log('[Seed] Seeding default drafts...');
      await Draft.insertMany(SEED_DRAFTS);
    }

    const caseCount = await CaseModel.countDocuments();
    if (caseCount === 0) {
      console.log('[Seed] Seeding default cases...');
      await CaseModel.insertMany(SEED_CASES);
    }

    const clientCount = await Client.countDocuments();
    if (clientCount === 0) {
      console.log('[Seed] Seeding default clients...');
      await Client.insertMany(SEED_CLIENTS);
    }

    const bareActCount = await BareAct.countDocuments();
    if (bareActCount === 0) {
      console.log('[Seed] Seeding default bare acts...');
      await BareAct.insertMany(SEED_BARE_ACTS);
    }
  } catch (err) {
    console.error('[Seed Error]:', err);
  }
}
