import { Template, Draft, CaseModel, Client, BareAct, AppSetting, LegalLibraryItem, NotificationModel } from '../models/AppModels';

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
    id: 'act-1',
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
        plainExplanation: 'No citizen can be deprived of life or liberty except according to procedure established by law. The Supreme Court has expanded this to include the right to privacy, clean environment, speedy trial, and human dignity.',
        ingredients: [
          'Deprivation of life or liberty must be sanctioned by a valid legislative Act.',
          'The law and procedure must be just, fair, and reasonable (Maneka Gandhi doctrine).'
        ],
        precedent: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248 · K.S. Puttaswamy v. Union of India (2017) 10 SCC 1'
      },
      {
        number: 'Article 32',
        title: 'Remedies for enforcement of Fundamental Rights',
        plainExplanation: 'Constitutional remedy empowering citizens to move the Supreme Court directly for the issuance of prerogative writs (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari).',
        ingredients: ['Infringement of a guaranteed Part III Fundamental Right.', 'Direct invocation of original Supreme Court jurisdiction.'],
        precedent: 'Fertilizer Corporation Kamagar Union v. Union of India (1981) 1 SCC 568'
      },
      {
        number: 'Article 226',
        title: 'Power of High Courts to issue certain writs',
        plainExplanation: 'Extraordinary prerogative writ jurisdiction of High Courts for enforcement of fundamental rights and for any other legal right.',
        ingredients: ['Violation of Part III right or any statutory/legal right.', 'Absence of an equally efficacious alternative remedy or violation of natural justice.'],
        precedent: 'Whirlpool Corporation v. Registrar of Trade Marks (1998) 8 SCC 1'
      }
    ]
  },
  {
    id: 'act-2',
    name: 'Indian Penal Code, 1860',
    category: 'Criminal',
    year: 1860,
    totalSections: '511 Sections',
    enactedDate: '1 January 1862',
    summary: 'The principal substantive criminal law of India defining offences and prescribing punishments. Cross-referenced with the newly enacted Bharatiya Nyaya Sanhita (BNS), 2023.',
    keySections: [
      {
        number: 'Section 302',
        title: 'Punishment for Murder',
        plainExplanation: 'Prescribes the statutory penalty for committing murder as defined in Section 300 IPC (death or imprisonment for life, and fine).',
        ingredients: [
          'Actus reus: Causing the death of a human being.',
          'Mens rea: Intention to cause death, or intention to cause bodily injury sufficient in ordinary course of nature to cause death.'
        ],
        precedent: 'Bachan Singh v. State of Punjab (1980) 2 SCC 684 (Rarest of Rare Doctrine)',
        newActEquivalent: 'Bharatiya Nyaya Sanhita (BNS) 2023, Section 103'
      },
      {
        number: 'Section 420',
        title: 'Cheating and dishonestly inducing delivery of property',
        plainExplanation: 'Whoever cheats and thereby dishonestly induces the deceived party to deliver any property, punishable with imprisonment up to 7 years and fine.',
        ingredients: ['Fraudulent or dishonest representation.', 'Inducement to deliver property or alter valuable security.'],
        precedent: 'Vesa Holdings P. Ltd. v. State of Kerala (2015) 8 SCC 293',
        newActEquivalent: 'Bharatiya Nyaya Sanhita (BNS) 2023, Section 318(4)'
      }
    ]
  },
  {
    id: 'act-3',
    name: 'Code of Criminal Procedure, 1973',
    category: 'Criminal',
    year: 1973,
    totalSections: '484 Sections',
    enactedDate: '1 April 1974',
    summary: 'Procedural machinery for investigation, arrest, bail, trial, and appeals in criminal offenses. Cross-referenced with Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023.',
    keySections: [
      {
        number: 'Section 145 & 146',
        title: 'Disputes concerning land or water likely to cause breach of peace',
        plainExplanation: 'Section 145 empowers Executive Magistrates to determine actual physical possession to avert violence. Section 146 empowers emergency attachment.',
        ingredients: ['Report of police showing dispute likely to breach peace.', 'Dispute concerns immovable property within local jurisdiction.'],
        precedent: 'Mathuralal v. Bhanwarlal (1979) 4 SCC 665',
        newActEquivalent: 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Sections 168 & 169'
      },
      {
        number: 'Section 438',
        title: 'Direction for grant of bail to person apprehending arrest (Anticipatory Bail)',
        plainExplanation: 'Pre-arrest bail protection granted by High Court or Court of Session in non-bailable offences.',
        ingredients: ['Reasonable belief of imminent arrest.', 'Non-bailable offence accusation.', 'Readiness to join investigation.'],
        precedent: 'Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1',
        newActEquivalent: 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Section 482'
      },
      {
        number: 'Section 482',
        title: 'Saving of inherent powers of High Court (Quashing of FIR)',
        plainExplanation: 'Inherent jurisdiction to prevent abuse of process of any court or secure the ends of justice.',
        ingredients: ['Abuse of criminal process.', 'Allegations taken at face value disclose no cognizable offence.'],
        precedent: 'State of Haryana v. Bhajan Lal (1992) Supp (1) SCC 335',
        newActEquivalent: 'Bharatiya Nagarik Suraksha Sanhita (BNSS) 2023, Section 528'
      }
    ]
  },
  {
    id: 'act-bns',
    name: 'Bharatiya Nyaya Sanhita (BNS), 2023',
    category: 'Criminal',
    year: 2023,
    totalSections: '358 Sections',
    enactedDate: '1 July 2024',
    summary: 'The principal substantive penal code of India replacing IPC 1860 with modern definitions of organized crime, terrorism, and community service punishments.',
    keySections: [
      {
        number: 'Section 103',
        title: 'Punishment for Murder & Mob Lynching',
        plainExplanation: 'Prescribes death or life imprisonment for murder. Subsection (2) mandates death or life imprisonment for murder committed by 5 or more persons acting in concert on grounds of race, caste, sex, or place of birth.',
        ingredients: ['Intentional act causing death of human being.', 'Concert of 5 or more persons for lynching under sub-section (2).'],
        precedent: 'State of Maharashtra v. Mohd. Sajid (2025) SCC Online SC 41',
        newActEquivalent: 'Replaces Section 302 IPC, 1860'
      },
      {
        number: 'Section 318',
        title: 'Cheating and Dishonestly Inducing Delivery of Property',
        plainExplanation: 'Substantive punishment for deceit and fraudulent misrepresentation inducing delivery of property.',
        ingredients: ['Deception of any person.', 'Fraudulent or dishonest inducement to deliver property.'],
        precedent: 'Vesa Holdings P. Ltd. v. State of Kerala (2015) 8 SCC 293',
        newActEquivalent: 'Replaces Section 420 IPC, 1860'
      }
    ]
  },
  {
    id: 'act-bnss',
    name: 'Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
    category: 'Criminal',
    year: 2023,
    totalSections: '531 Sections',
    enactedDate: '1 July 2024',
    summary: 'The procedural criminal justice code replacing CrPC 1973 with timelines for trial, electronic summons, zero FIR, and mandatory videography of search and seizure.',
    keySections: [
      {
        number: 'Section 482',
        title: 'Direction for grant of bail to person apprehending arrest (Anticipatory Bail)',
        plainExplanation: 'Codifies pre-arrest bail safeguards before Sessions and High Court, retaining parity principles and non-custodial protection.',
        ingredients: ['Reasonable apprehension of arrest in non-bailable case.', 'Conditions on travel and non-tampering of evidence.'],
        precedent: 'Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1',
        newActEquivalent: 'Replaces Section 438 CrPC, 1973'
      },
      {
        number: 'Section 528',
        title: 'Saving of inherent powers of High Court',
        plainExplanation: 'High Court inherent power to make such orders as may be necessary to give effect to any order under this Sanhita or prevent abuse of process.',
        ingredients: ['Non-cognizable or purely civil dispute masked as crime.', 'Absence of prima facie case in FIR.'],
        precedent: 'Neeharika Infrastructure v. State of Maharashtra (2021) 19 SCC 401',
        newActEquivalent: 'Replaces Section 482 CrPC, 1973'
      }
    ]
  },
  {
    id: 'act-4',
    name: 'Indian Evidence Act, 1872',
    category: 'Criminal',
    year: 1872,
    totalSections: '167 Sections',
    enactedDate: '1 September 1872',
    summary: 'The law of admissibility, relevancy, and burden of proof governing judicial trials. Cross-referenced with Bharatiya Sakshya Adhiniyam (BSA), 2023.',
    keySections: [
      {
        number: 'Section 65B',
        title: 'Admissibility of electronic records',
        plainExplanation: 'Mandates an authentic certificate signed by an authorized person in control of device to admit electronic printouts, emails, or call records.',
        ingredients: ['Certificate under Section 65B(4) is mandatory for secondary electronic evidence.'],
        precedent: 'Arjun Khotkar v. Kailash Kushanrao Gorantyal (2020) 7 SCC 1',
        newActEquivalent: 'Bharatiya Sakshya Adhiniyam (BSA) 2023, Section 63'
      }
    ]
  },
  {
    id: 'act-5',
    name: 'Code of Civil Procedure, 1908',
    category: 'Civil',
    year: 1908,
    totalSections: '158 Sections & 51 Orders',
    enactedDate: '1 January 1909',
    summary: 'The foundational procedural code regulating civil litigation, pleadings, injunctions, and execution of decrees in Indian courts.',
    keySections: [
      {
        number: 'Order XXXIX Rule 1 & 2',
        title: 'Temporary Injunctions and Interlocutory Orders',
        plainExplanation: 'Equitable interim remedy restraining a defendant from wasting, damaging, alienating, or creating third-party rights on the suit property pending final trial.',
        ingredients: ['Prima facie case.', 'Balance of convenience in favor of plaintiff.', 'Irreparable injury if injunction not granted.'],
        precedent: 'Gujarat Bottling Co. Ltd. v. Coca Cola Co. (1995) 5 SCC 545'
      },
      {
        number: 'Order XXXVII',
        title: 'Summary Procedure on Negotiable Instruments & Written Contracts',
        plainExplanation: 'Expedited decree procedure where defendant cannot defend unless court grants leave to defend upon showing substantial defence.',
        ingredients: ['Suit on bills of exchange, hundies, promissory notes or written contract debt.', 'Liquidated monetary demand.'],
        precedent: 'IDBI Trusteeship Services Ltd. v. Hubtown Ltd. (2017) 1 SCC 568'
      }
    ]
  },
  {
    id: 'act-6',
    name: 'Transfer of Property Act, 1882',
    category: 'Civil',
    year: 1882,
    totalSections: '137 Sections',
    enactedDate: '1 July 1882',
    summary: 'Statute governing inter vivos transfers of immovable property including sales, mortgages, leases, exchanges, and gifts.',
    keySections: [
      {
        number: 'Section 106',
        title: 'Duration of certain leases in absence of written contract (Notice to Quit)',
        plainExplanation: 'Mandates 15 days notice for monthly tenancy and 6 months notice for agricultural/manufacturing leases before institution of eviction suit.',
        ingredients: ['Notice in writing signed by or on behalf of lessor.', 'Tendered personally or sent by post.'],
        precedent: 'Payal Vision Ltd. v. Radhika Choudhary (2012) 11 SCC 405'
      },
      {
        number: 'Section 53A',
        title: 'Part Performance',
        plainExplanation: 'Equitable shield protecting a buyer who took possession under an agreement to sell against eviction by transferor.',
        ingredients: ['Signed written contract.', 'Transferee in possession in furtherance of contract.', 'Willingness to perform balance obligations.'],
        precedent: 'Shrimant Shamrao Suryavanshi v. Pralhad Bhairoba Suryavanshi (2002) 3 SCC 676'
      }
    ]
  },
  {
    id: 'act-7',
    name: 'Indian Contract Act, 1872',
    category: 'Civil',
    year: 1872,
    totalSections: '238 Sections',
    enactedDate: '1 September 1872',
    summary: 'Governs formation, performance, frustration, and breach of contracts, indemnity, guarantee, and agency in India.',
    keySections: [
      {
        number: 'Section 73 & 74',
        title: 'Compensation for breach and liquidated damages',
        plainExplanation: 'Section 73 provides unliquidated damages for natural loss. Section 74 governs pre-agreed reasonable liquidated damages without requiring proof of actual loss.',
        ingredients: ['Breach of valid contract.', 'Damage naturally arising in usual course.', 'Reasonable compensation up to stipulated penalty.'],
        precedent: 'Kailash Nath Associates v. DDA (2015) 4 SCC 136'
      }
    ]
  },
  {
    id: 'act-8',
    name: 'Specific Relief Act, 1963',
    category: 'Civil',
    year: 1963,
    totalSections: '44 Sections',
    enactedDate: '1 March 1964',
    summary: 'Provides equitable remedies including specific performance of contracts, rectification of instruments, and declaratory decrees post-2018 amendment.',
    keySections: [
      {
        number: 'Section 10',
        title: 'Specific performance in respect of contracts',
        plainExplanation: 'Post-2018 amendment, granting specific performance is mandatory for civil courts and no longer purely discretionary.',
        ingredients: ['Valid enforceable contract.', 'Subject only to limited exceptions in Sections 11(2), 14, and 16.'],
        precedent: 'B. Santoshamma v. D. Sarala (2020) 19 SCC 80'
      }
    ]
  },
  {
    id: 'act-9',
    name: 'Negotiable Instruments Act, 1881',
    category: 'Commercial',
    year: 1881,
    totalSections: '148 Sections',
    enactedDate: '1 March 1882',
    summary: 'Governs promissory notes, bills of exchange, and criminal dishonour of cheques under Section 138.',
    keySections: [
      {
        number: 'Section 138',
        title: 'Dishonour of cheque for insufficiency of funds in the accounts',
        plainExplanation: 'Statutory criminal offence for cheque dishonour with imprisonment up to 2 years or fine up to twice the cheque amount.',
        ingredients: ['Cheque issued towards legally enforceable debt or liability.', 'Presentation within validity period.', 'Statutory demand notice within 30 days of memo.', 'Failure to pay within 15 days of notice receipt.'],
        precedent: 'Dashrath Rupsingh Rathod v. State of Maharashtra (2014) 9 SCC 129'
      },
      {
        number: 'Section 139',
        title: 'Presumption in favour of holder',
        plainExplanation: 'Statutory rebuttable presumption that the cheque was received for discharge of a debt or liability.',
        ingredients: ['Proof of signature and issuance raises mandatory presumption.', 'Defendant must raise probable defence under preponderance of probabilities.'],
        precedent: 'Rangappa v. Sri Mohan (2010) 11 SCC 441'
      }
    ]
  },
  {
    id: 'act-10',
    name: 'Arbitration and Conciliation Act, 1996',
    category: 'Commercial',
    year: 1996,
    totalSections: '86 Sections',
    enactedDate: '22 August 1996',
    summary: 'Governs domestic and international commercial arbitration, interim measures, and challenge to arbitral awards.',
    keySections: [
      {
        number: 'Section 9',
        title: 'Interim measures by Court',
        plainExplanation: 'Party may apply to Court before, during, or after arbitral proceedings for preservation of goods, interim custody, or securing amount in dispute.',
        ingredients: ['Arbitration agreement exists.', 'Manifest intention to arbitrate within 90 days.'],
        precedent: 'Sundaram Finance Ltd. v. NEPC India Ltd. (1999) 2 SCC 479'
      },
      {
        number: 'Section 34',
        title: 'Application for setting aside arbitral award',
        plainExplanation: 'Extremely restricted grounds for judicial review of arbitral awards limited to patent illegality and public policy violations.',
        ingredients: ['Incapacity, invalid agreement, lack of notice or patent illegality.', 'Application within 3 months plus 30 days condonable delay.'],
        precedent: 'Associate Builders v. DDA (2015) 3 SCC 49 · Ssangyong Engg. v. NHAI (2019) 15 SCC 131'
      }
    ]
  },
  {
    id: 'act-11',
    name: 'Insolvency and Bankruptcy Code, 2016',
    category: 'Commercial',
    year: 2016,
    totalSections: '255 Sections',
    enactedDate: '28 May 2016',
    summary: 'Consolidated statutory framework for reorganization and insolvency resolution of corporate persons, partnership firms and individuals.',
    keySections: [
      {
        number: 'Section 7 & 9',
        title: 'Initiation of CIRP by Financial and Operational Creditors',
        plainExplanation: 'Enables financial and operational creditors to trigger corporate insolvency resolution upon default exceeding statutory threshold.',
        ingredients: ['Default of debt exceeding ₹ 1 Crore.', 'Adjudicating authority NCLT satisfied on existence of debt and default.'],
        precedent: 'Innoventive Industries Ltd. v. ICICI Bank (2018) 1 SCC 407'
      },
      {
        number: 'Section 14',
        title: 'Moratorium',
        plainExplanation: 'Prohibits institution or continuation of suits, execution of decrees, or recovery actions against the corporate debtor upon admission of CIRP.',
        ingredients: ['Binding on all courts and tribunals once CIRP admitted.'],
        precedent: 'P. Mohanraj v. Shah Brothers ISPAT Pvt. Ltd. (2021) 6 SCC 258'
      }
    ]
  },
  {
    id: 'act-12',
    name: 'Information Technology Act, 2000',
    category: 'Others',
    year: 2000,
    totalSections: '94 Sections',
    enactedDate: '17 October 2000',
    summary: 'Primary law dealing with cybercrime, electronic commerce, intermediary liability safe harbor, and digital signatures in India.',
    keySections: [
      {
        number: 'Section 79',
        title: 'Exemption from liability of intermediary in certain cases',
        plainExplanation: 'Safe harbor provision shielding digital platforms and intermediaries from third-party content provided they observe statutory due diligence.',
        ingredients: ['Platform acts merely as a conduit.', 'Complies with takedown order upon actual knowledge.'],
        precedent: 'Shreya Singhal v. Union of India (2015) 5 SCC 1'
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

    // Ensure all foundational bare acts are permanently populated / upserted in MongoDB
    console.log('[Seed] Ensuring comprehensive Indian Bare Acts are synced...');
    for (const act of SEED_BARE_ACTS) {
      await BareAct.findOneAndUpdate(
        { id: act.id },
        { $set: act },
        { upsert: true, returnDocument: 'after' }
      );
    }
    console.log(`[Seed] Bare Acts sync complete (${SEED_BARE_ACTS.length} statutes verified).`);

    // Ensure foundational legal library items (maxims, forms, precedents) are populated in MongoDB
    const libCount = await LegalLibraryItem.countDocuments();
    if (libCount === 0) {
      console.log('[Seed] Seeding foundational legal library items to MongoDB...');
      await LegalLibraryItem.insertMany([
        {
          id: 'term-audi',
          itemType: 'dictionaryTerm',
          category: 'Latin Maxim',
          titleOrTerm: 'Audi alteram partem',
          data: {
            letter: 'A',
            literalTranslation: 'Hear the other side',
            definition: 'No person should be condemned unheard. A fundamental rule of natural justice applicable to all judicial and administrative proceedings.',
            contextUsage: 'Cancellation of tender without show cause notice violates audi alteram partem.',
            landmarkCase: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248'
          }
        },
        {
          id: 'term-caveat',
          itemType: 'dictionaryTerm',
          category: 'Latin Maxim',
          titleOrTerm: 'Caveat emptor',
          data: {
            letter: 'C',
            literalTranslation: 'Let the buyer beware',
            definition: 'The principle that the buyer alone is responsible for checking the quality and suitability of goods before purchase.',
            contextUsage: 'Section 16 of Sale of Goods Act, 1930 codifies caveat emptor with implied condition exceptions.',
            landmarkCase: 'Ranbirsingh Shankarsingh Thakur v. Hindusthan General Insurance (1971)'
          }
        },
        {
          id: 'term-resjudicata',
          itemType: 'dictionaryTerm',
          category: 'Civil Procedure Maxim',
          titleOrTerm: 'Res Judicata',
          data: {
            letter: 'R',
            literalTranslation: 'A matter judged',
            definition: 'Bar to re-litigation of an issue or claim that has already been conclusively decided between the same parties by a court of competent jurisdiction.',
            contextUsage: 'Section 11 of the Code of Civil Procedure, 1908 incorporates the doctrine of res judicata.',
            landmarkCase: 'Satyadhyan Ghosal v. Deorajin Debi AIR 1960 SC 941'
          }
        },
        {
          id: 'form-bail',
          itemType: 'legalForm',
          category: 'Criminal Procedure',
          titleOrTerm: 'Application for Anticipatory Bail',
          data: {
            courtJurisdiction: 'High Court / Sessions Court',
            governingStatute: 'Section 482 of Bharatiya Nagarik Suraksha Sanhita, 2023',
            description: 'Standard statutory petition seeking pre-arrest protection with undertaking affidavit.',
            templateText: 'IN THE COURT OF SESSIONS JUDGE AT [CITY]\n\nIN THE MATTER OF:\n[Applicant Name] ... Applicant\nVERSUS\nState of [State] ... Respondent\n\nAPPLICATION UNDER SECTION 482 BNSS 2023...'
          }
        },
        {
          id: 'form-notice-138',
          itemType: 'legalForm',
          category: 'Commercial Debt',
          titleOrTerm: 'Statutory Demand Notice under Section 138 NI Act',
          data: {
            courtJurisdiction: 'Metropolitan Magistrate / Judicial Magistrate First Class',
            governingStatute: 'Section 138, Negotiable Instruments Act, 1881',
            description: 'Mandatory 15-day statutory demand notice served upon dishonour of cheque for insufficiency of funds.',
            templateText: 'LEGAL NOTICE UNDER SECTION 138 OF NEGOTIABLE INSTRUMENTS ACT, 1881\n\nTo,\n[Drawer Name]\n\nUnder instructions from our client...'
          }
        },
        {
          id: 'jdg-puttaswamy',
          itemType: 'judgment',
          category: 'Constitutional Law',
          titleOrTerm: 'Justice K.S. Puttaswamy (Retd.) v. Union of India',
          data: {
            citation: '(2017) 10 SCC 1',
            court: 'Supreme Court of India (9-Judge Bench)',
            benchStrength: '9 Judges',
            decisionDate: '24 Aug 2017',
            subject: 'Fundamental Right to Privacy',
            headnote: 'Right to privacy is an intrinsic part of the right to life and personal liberty under Article 21 and the freedom guarantees in Part III.',
            ratioDecidendi: 'Privacy is constitutionally protected under Article 21 and Part III of the Constitution of India.',
            keyStatutes: ['Article 21', 'Article 14', 'Article 19']
          }
        },
        {
          id: 'jdg-bhajanlal',
          itemType: 'judgment',
          category: 'Criminal Jurisprudence',
          titleOrTerm: 'State of Haryana v. Bhajan Lal',
          data: {
            citation: '1992 Supp (1) SCC 335',
            court: 'Supreme Court of India',
            benchStrength: '2 Judges',
            decisionDate: '21 Nov 1990',
            subject: 'Quashing of FIR and Inherent Powers',
            headnote: 'Lays down seven definitive illustrative categories wherein the High Court can exercise inherent powers under Section 482 CrPC / Section 528 BNSS to quash FIRs.',
            ratioDecidendi: 'Where allegations in FIR even if taken at face value do not prima facie constitute any offence, the proceeding may be quashed.',
            keyStatutes: ['Section 482 CrPC', 'Section 528 BNSS 2023']
          }
        },
        {
          id: 'glossary-subjudice',
          itemType: 'citizenGlossary',
          category: 'Judicial Terms',
          titleOrTerm: 'Sub-judice',
          data: {
            term: 'Sub-judice',
            meaning: 'A matter currently under trial or consideration by a court of law, so public debate or prejudicial actions might be restricted.'
          }
        },
        {
          id: 'glossary-caveat',
          itemType: 'citizenGlossary',
          category: 'Procedural Protection',
          titleOrTerm: 'Caveat',
          data: {
            term: 'Caveat',
            meaning: 'A formal notice filed by a party requesting the court not to pass any ex-parte order or grant relief without first serving notice on the caveator.'
          }
        },
        {
          id: 'glossary-affidavit',
          itemType: 'citizenGlossary',
          category: 'Evidentiary Documents',
          titleOrTerm: 'Affidavit',
          data: {
            term: 'Affidavit',
            meaning: 'A formal written statement of facts confirmed by oath or solemn affirmation, admissible as evidence before courts and statutory tribunals.'
          }
        }
      ]);
      console.log('[Seed] Legal library items seeded successfully.');
    }

    // Ensure default notification exists in MongoDB
    const notifCount = await NotificationModel.countDocuments();
    if (notifCount === 0) {
      await NotificationModel.create({
        id: 'notif-1',
        title: 'Cause List Notification',
        message: 'Your listed matters have been synchronized with court cause lists.',
        read: false,
        time: 'Today'
      });
      console.log('[Seed] Initial notification seeded successfully.');
    }
  } catch (err) {
    console.error('[Seed Error]:', err);
  }
}
