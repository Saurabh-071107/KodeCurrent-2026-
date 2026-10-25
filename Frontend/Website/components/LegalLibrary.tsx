'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import {
  BookOpen,
  Scale,
  FileText,
  Gavel,
  Search,
  ChevronRight,
  Copy,
  Check,
  X,
  Filter,
  CheckCircle2
} from 'lucide-react';

// =============================================================================
// DATA TYPES
// =============================================================================

export type LibraryTab = 'bare-acts' | 'dictionary' | 'forms' | 'judgments';

export interface BareActItem {
  id: string;
  name: string;
  category: 'Criminal' | 'Civil' | 'Constitutional' | 'Commercial';
  year: number;
  totalSections: string;
  enactedDate: string;
  summary: string;
  keySections: Array<{
    number: string;
    title: string;
    plainExplanation: string;
    ingredients: string[];
    precedent: string;
    newActEquivalent?: string;
  }>;
}

export interface DictionaryTerm {
  id: string;
  term: string;
  category: 'Latin Maxim' | 'Statutory Term' | 'Constitutional Doctrine' | 'Procedural Rule';
  letter: string;
  literalTranslation?: string;
  definition: string;
  contextUsage: string;
  landmarkCase?: string;
}

export interface LegalForm {
  id: string;
  title: string;
  category: 'Criminal' | 'Civil' | 'Writs' | 'Commercial' | 'Affidavits';
  courtJurisdiction: string;
  governingStatute: string;
  description: string;
  templateText: string;
}

export interface JudgmentItem {
  id: string;
  title: string;
  citation: string;
  court: string;
  benchStrength: string;
  decisionDate: string;
  subject: string;
  headnote: string;
  ratioDecidendi: string;
  keyStatutes: string[];
}

// =============================================================================
// SEED DATA
// =============================================================================

const BARE_ACTS: BareActItem[] = [
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
        newActEquivalent: 'Previously Section 302 IPC (with new sub-clause for mob lynching)'
      },
      {
        number: 'Section 111',
        title: 'Organised Crime Offence',
        plainExplanation: 'Creates a standalone statutory offence for continuing unlawful activity including kidnapping, extortion, land grabbing, and cyber-crimes committed by a syndicate.',
        ingredients: [
          'Continuing unlawful activity by an organised crime syndicate.',
          'Use of violence, threat of violence, intimidation, or coercion.',
          'Aim of gaining financial or material benefits.'
        ],
        precedent: 'Ranjitsing Brahmajeetsing Sharma v. State of Maharashtra (2005) 5 SCC 294',
        newActEquivalent: 'Newly codified standalone offence in central substantive law'
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
    summary: 'The comprehensive criminal procedure code of India governing investigations, FIR registrations, electronic summons, bail mandates, and speedy trial timelines.',
    keySections: [
      {
        number: 'Section 482',
        title: 'Direction for Grant of Bail to Person Apprehending Arrest (Anticipatory Bail)',
        plainExplanation: 'Empowers the High Court or Sessions Court to direct release on bail if a person has reasonable apprehension of being arrested on accusation of having committed a non-bailable offence.',
        ingredients: [
          'Applicant must demonstrate genuine apprehension of arrest on non-bailable charges.',
          'Court evaluates gravity of accusation, applicant antecedents, and likelihood of fleeing justice.',
          'Statutory conditions: Available for police interrogation, not inducing witnesses.'
        ],
        precedent: 'Sushila Aggarwal v. State (NCT of Delhi) (2020) 5 SCC 1',
        newActEquivalent: 'Previously Section 438 CrPC'
      },
      {
        number: 'Section 173',
        title: 'Information in Cognizable Cases (Zero FIR & Electronic Information)',
        plainExplanation: 'Mandates registration of Zero FIR irrespective of police station territorial jurisdiction, and permits lodging information electronically.',
        ingredients: [
          'Information relating to commission of a cognizable offence.',
          'Registration mandatory without territorial jurisdictional demur.',
          'Signature on electronic reporting within three days.'
        ],
        precedent: 'Lalita Kumari v. Govt. of U.P. (2014) 2 SCC 1',
        newActEquivalent: 'Previously Section 154 CrPC (with explicit Zero FIR recognition)'
      }
    ]
  },
  {
    id: 'act-const',
    name: 'Constitution of India, 1950',
    category: 'Constitutional',
    year: 1950,
    totalSections: '395 Articles (12 Schedules)',
    enactedDate: '26 January 1950',
    summary: 'The supreme organic law of India establishing the constitutional framework, fundamental rights, directive principles of state policy, and separation of powers.',
    keySections: [
      {
        number: 'Article 21',
        title: 'Protection of Life and Personal Liberty',
        plainExplanation: 'No person shall be deprived of their life or personal liberty except according to procedure established by law. The law must satisfy tests of reasonableness and fairness.',
        ingredients: [
          'Enacted statutory law sanctioning deprivation.',
          'Substantive and procedural fairness (Maneka Gandhi doctrine).',
          'Encompasses privacy, dignity, speedy trial, and clean environment.'
        ],
        precedent: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248 · K.S. Puttaswamy (2017) 10 SCC 1'
      },
      {
        number: 'Article 226',
        title: 'Power of High Courts to Issue Certain Writs',
        plainExplanation: 'Grants wide plenary jurisdiction to High Courts to issue directions, orders, or writs (Habeas Corpus, Mandamus, Prohibition, Quo Warranto, Certiorari) for enforcing Fundamental Rights or for any other purpose.',
        ingredients: [
          'Violation of a legal or constitutional right within court territorial jurisdiction.',
          'Non-existence or inadequacy of alternative efficacious remedy.',
          'Enforcement against any person, authority, or Government.'
        ],
        precedent: 'Whirlpool Corp. v. Registrar of Trade Marks (1998) 8 SCC 1'
      }
    ]
  },
  {
    id: 'act-cpc',
    name: 'Code of Civil Procedure (CPC), 1908',
    category: 'Civil',
    year: 1908,
    totalSections: '158 Sections (51 Orders)',
    enactedDate: '1 January 1909',
    summary: 'The procedural law governing the administration of civil litigation, suits, injunctions, appeals, executions, and pleadings in Indian civil courts.',
    keySections: [
      {
        number: 'Section 11',
        title: 'Doctrine of Res Judicata',
        plainExplanation: 'Bars any court from trying a suit or issue in which the matter directly and substantially in issue has been heard and finally decided by a competent court between the same parties.',
        ingredients: [
          'Identity of matter directly and substantially in issue.',
          'Identity of litigating parties or parties litigating under same title.',
          'Former suit heard and finally decided on merits by competent court.'
        ],
        precedent: 'Satyadhyan Ghosal v. Deorajin Debi (1960) 3 SCR 590'
      },
      {
        number: 'Order XXXIX Rule 1 & 2',
        title: 'Temporary Injunctions and Interlocutory Orders',
        plainExplanation: 'Empowers civil court to grant interim prohibitory injunction to restrain defendant from causing injury, waste, or alienation of suit property during pendency.',
        ingredients: [
          'Prima facie case demonstrated in favour of applicant.',
          'Balance of convenience tilting in favour of grant.',
          'Irreparable injury which cannot be monetarily compensated.'
        ],
        precedent: 'Dalpat Kumar v. Prahlad Singh (1992) 1 SCC 719'
      }
    ]
  },
  {
    id: 'act-contract',
    name: 'Indian Contract Act, 1872',
    category: 'Commercial',
    year: 1872,
    totalSections: '238 Sections',
    enactedDate: '1 September 1872',
    summary: 'The cornerstone statute governing agreements, consideration, breach of contract, liquidated damages, indemnity, and guarantee.',
    keySections: [
      {
        number: 'Section 73',
        title: 'Compensation for Loss or Damage Caused by Breach of Contract',
        plainExplanation: 'When a contract is broken, the party suffering breach is entitled to receive compensation for any loss or damage which naturally arose in usual course of things.',
        ingredients: [
          'Valid contract breached by one party.',
          'Direct and natural loss caused in ordinary course (Hadley v. Baxendale rule).',
          'Remote and indirect losses not recoverable.'
        ],
        precedent: 'ONGC v. Saw Pipes Ltd. (2003) 5 SCC 705'
      }
    ]
  }
];

const DICTIONARY_TERMS: DictionaryTerm[] = [
  {
    id: 'dict-1',
    term: 'Audi Alteram Partem',
    category: 'Latin Maxim',
    letter: 'A',
    literalTranslation: 'Hear the other side',
    definition: 'A fundamental rule of natural justice requiring that no person shall be condemned or penalized unheard. Both parties must be afforded reasonable notice and fair opportunity to state their case.',
    contextUsage: 'In disciplinary proceedings or executive cancellations, an adverse order passed without prior show-cause notice is null and void for violating Audi Alteram Partem.',
    landmarkCase: 'Maneka Gandhi v. Union of India (1978) 1 SCC 248'
  },
  {
    id: 'dict-2',
    term: 'Actus Reus',
    category: 'Statutory Term',
    letter: 'A',
    literalTranslation: 'The guilty act',
    definition: 'The external element, voluntary physical act, or unlawful omission that constitutes the prohibited physical occurrence of a crime, distinct from the mental state (Mens Rea).',
    contextUsage: 'To establish criminal culpability under Section 103 BNS, prosecution must prove the physical actus reus causing death beyond reasonable doubt.',
    landmarkCase: 'Bachan Singh v. State of Punjab (1980) 2 SCC 684'
  },
  {
    id: 'dict-3',
    term: 'Bona Fide',
    category: 'Latin Maxim',
    letter: 'B',
    literalTranslation: 'In good faith',
    definition: 'Actions performed honestly, without fraud, collusion, deceit, or intentional malice. A standard protection granted to public officers and purchasers in civil conveyancing.',
    contextUsage: 'The defendant asserts title as a bona fide purchaser for valuable consideration without notice under Section 19 of the Specific Relief Act.',
    landmarkCase: 'Ram Niwas v. Bano (2000) 6 SCC 685'
  },
  {
    id: 'dict-4',
    term: 'Certiorari',
    category: 'Procedural Rule',
    letter: 'C',
    literalTranslation: 'To be certified / made certain',
    definition: 'A prerogative constitutional writ issued by the Supreme Court (Art 32) or High Courts (Art 226) to quash an order passed by an inferior court or quasi-judicial tribunal exceeding its jurisdiction or violating natural justice.',
    contextUsage: 'The writ petitioner seeks a Writ of Certiorari calling for the records and quashing the arbitrary demolition order dated 12.04.2026.',
    landmarkCase: 'Hari Vishnu Kamath v. Syed Ahmad Ishaque (1955) 1 SCR 1104'
  },
  {
    id: 'dict-5',
    term: 'De Facto vs De Jure',
    category: 'Latin Maxim',
    letter: 'D',
    literalTranslation: 'In fact vs In law',
    definition: 'De Facto describes a state of affairs existing in actual practice, whereas De Jure describes that which exists by legal right, formal decree, or statutory authority.',
    contextUsage: 'The interim committee acts as de facto administrator while the validity of the election remains sub judice de jure.',
    landmarkCase: 'Gokaraju Rangaraju v. State of A.P. (1981) 3 SCC 132'
  },
  {
    id: 'dict-6',
    term: 'Habeas Corpus',
    category: 'Constitutional Doctrine',
    letter: 'H',
    literalTranslation: 'You have the body',
    definition: 'A constitutional writ used to secure the release of an individual unlawfully or arbitrarily detained by the police, state authorities, or private individuals without statutory sanction.',
    contextUsage: 'Counsel moved an urgent midnight petition for Habeas Corpus when the detainee was held in custody without production before the nearest Magistrate within 24 hours.',
    landmarkCase: 'ADM Jabalpur v. Shivkant Shukla (1976) 2 SCC 521 (overruled by Puttaswamy 2017)'
  },
  {
    id: 'dict-7',
    term: 'Locus Standi',
    category: 'Procedural Rule',
    letter: 'L',
    literalTranslation: 'Place of standing',
    definition: 'The legal right of a party to initiate or appear in an action before a court of law. In Indian public interest litigation (PIL), the traditional locus standi rule is significantly relaxed to allow public-spirited citizens to espouse collective rights.',
    contextUsage: 'The preliminary objection on locus standi fails since the applicant represents an aggrieved class of contractual workers whose fundamental rights are infringed.',
    landmarkCase: 'S.P. Gupta v. Union of India (1981) Supp SCC 87'
  },
  {
    id: 'dict-8',
    term: 'Mens Rea',
    category: 'Statutory Term',
    letter: 'M',
    literalTranslation: 'Guilty mind',
    definition: 'The requisite culpable mental state (intention, knowledge, recklessness, or criminal negligence) that must accompany the actus reus to constitute criminal liability, unless excluded by express statutory language.',
    contextUsage: 'Absence of mens rea was clearly demonstrated as the transaction was undertaken under genuine bona fide commercial belief without fraudulent intent.',
    landmarkCase: 'State of Maharashtra v. Mayer Hans George (1965) 1 SCR 123'
  },
  {
    id: 'dict-9',
    term: 'Per Incuriam',
    category: 'Latin Maxim',
    letter: 'P',
    literalTranslation: 'Through lack of care / in ignorance',
    definition: 'A judicial decision rendered in ignorance or forgetfulness of a binding statutory enactment or a binding decision of a superior or coordinate bench. Decisions per incuriam do not constitute binding precedent under Article 141.',
    contextUsage: 'The single bench ruling cited by respondent is per incuriam as it failed to consider the 2023 amendment to Section 103 BNS.',
    landmarkCase: 'A.R. Antulay v. R.S. Nayak (1988) 2 SCC 602'
  },
  {
    id: 'dict-10',
    term: 'Proportionality Test',
    category: 'Constitutional Doctrine',
    letter: 'P',
    literalTranslation: 'Doctrine of reasonable balance',
    definition: 'A four-pronged constitutional standard to assess state infringement of fundamental rights: (1) Legitimate state goal, (2) Rational nexus, (3) Least restrictive necessity, and (4) Strict balancing between societal interest and individual harm.',
    contextUsage: 'The blanket internet prohibition failed the third prong of the proportionality test because less restrictive alternatives were not explored by the administration.',
    landmarkCase: 'K.S. Puttaswamy v. Union of India (2017) 10 SCC 1 · Anuradha Bhasin (2020) 3 SCC 637'
  },
  {
    id: 'dict-11',
    term: 'Res Judicata',
    category: 'Procedural Rule',
    letter: 'R',
    literalTranslation: 'A matter judged',
    definition: 'Codified under Section 11 of the CPC, this doctrine prevents parties from re-litigating an issue or claim that has already been adjudicated upon merits by a competent court in a prior proceeding.',
    contextUsage: 'The second partition suit is barred by constructive res judicata under Explanation IV to Section 11 CPC.',
    landmarkCase: 'Daryao v. State of U.P. (1962) 1 SCR 574'
  },
  {
    id: 'dict-12',
    term: 'Stare Decisis',
    category: 'Latin Maxim',
    letter: 'S',
    literalTranslation: 'To stand by things decided',
    definition: 'The doctrine of precedent mandating that courts abide by and follow earlier settled judicial rulings on similar questions of law, promoting certainty and stability in the legal system (Article 141).',
    contextUsage: 'The doctrine of stare decisis restrains coordinate benches from dissenting without referring the legal conflict to a larger bench.',
    landmarkCase: 'Bengal Immunity Co. v. State of Bihar (1955) 2 SCR 603'
  }
];

const LEGAL_FORMS: LegalForm[] = [
  {
    id: 'form-bail',
    title: 'Regular Bail Application (Section 483 BNSS / 439 CrPC)',
    category: 'Criminal',
    courtJurisdiction: 'High Court / Court of Sessions',
    governingStatute: 'Section 483 Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023',
    description: 'Statutory application filed on behalf of an incarcerated accused seeking release on regular bail pending trial, demonstrating absence of flight risk, cooperation with investigating agencies, and parity.',
    templateText: `IN THE HIGH COURT OF JUDICATURE AT NEW DELHI
(CRIMINAL APPELLATE / EXTRAORDINARY JURISDICTION)

BAIL APPLICATION NO. ________ OF 2026

IN THE MATTER OF:
State (NCT of Delhi) ...Prosecution
VERSUS
[Accused Name], S/o [Father Name]
Presently lodged in Central Jail, Tihar ...Applicant / Accused

APPLICATION UNDER SECTION 483 OF THE BHARATIYA NAGARIK SURAKSHA SANHITA, 2023 READ WITH SECTION 439 CrPC FOR GRANT OF REGULAR BAIL

MOST RESPECTFULLY SHOWETH:
1. That the Applicant has been falsely implicated in FIR No. [____] dated [____] registered at P.S. [____] under Sections [103/111] of Bharatiya Nyaya Sanhita, 2023.
2. That the Applicant was arrested on [____] and has undergone custodial interrogation for [____] days. The charge-sheet has already been filed before the Ld. Trial Court, and custody of the applicant is no longer warranted for investigation purposes.
3. That the Applicant is a permanent resident of [Address], with roots in society, possessing clean antecedents, and undertakes to abide by all conditions imposed by this Hon'ble Court.

PRAYER:
Wherefore, it is most respectfully prayed that this Hon'ble Court may graciously be pleased to:
a) Admit the Applicant to regular bail on furnishing suitable surety to the satisfaction of the Ld. Trial Court;
b) Pass any other order deemed fit in the interest of justice.

ADVOCATE FOR THE APPLICANT
Date: ____________`
  },
  {
    id: 'form-writ-226',
    title: 'Writ Petition under Article 226 of the Constitution of India',
    category: 'Writs',
    courtJurisdiction: 'High Court',
    governingStatute: 'Article 226, Constitution of India, 1950',
    description: 'Comprehensive writ pleading seeking judicial review of administrative action, quashing illegal executive orders, and praying for issuance of Writs of Mandamus / Certiorari.',
    templateText: `IN THE HIGH COURT OF JUDICATURE AT [STATE]
EXTRAORDINARY WRIT JURISDICTION
WRIT PETITION (CIVIL) NO. ________ OF 2026

IN THE MATTER OF:
[Petitioner Name], Resident of [Address] ...Petitioner
VERSUS
1. Union of India / State Government, through its Principal Secretary
2. Statutory Authority / Municipal Corporation ...Respondents

WRIT PETITION UNDER ARTICLE 226 OF THE CONSTITUTION OF INDIA PRAYING FOR WRIT OF CERTIORARI AND MANDAMUS

MOST RESPECTFULLY SHOWETH:
1. That the Petitioner is a law-abiding citizen whose fundamental and statutory rights guaranteed under Articles 14, 19, and 21 of the Constitution of India have been infringed by impugned order dated [____].
2. STATEMENT OF FACTS:
   a) That on [Date], the Petitioner was granted statutory sanction...
   b) That without issuance of show cause notice or adhering to natural justice, Respondent No. 2 arbitrarily cancelled...
3. GROUNDS:
   I. Because the impugned order is violative of Audi Alteram Partem and the Maneka Gandhi doctrine.
   II. Because Respondent acted ultra vires its statutory powers under the Act.

PRAYER:
It is therefore respectfully prayed that this Hon'ble Court may be pleased to:
a) Issue a Writ of Certiorari quashing the impugned order dated [____];
b) Issue a Writ of Mandamus directing the Respondents to restore status quo ante.

COUNSEL FOR THE PETITIONER
New Delhi, Date: ____________`
  },
  {
    id: 'form-injunction',
    title: 'Application for Temporary Injunction under Order XXXIX Rules 1 & 2 CPC',
    category: 'Civil',
    courtJurisdiction: 'District Civil Court / Commercial Court',
    governingStatute: 'Order XXXIX Rules 1 & 2 read with Section 151 CPC, 1908',
    description: 'Interim application in civil suits restraining defendant from altering status of property, creating third-party rights, or dispossessing plaintiff pending final disposal of suit.',
    templateText: `IN THE COURT OF THE LEARNED SENIOR CIVIL JUDGE, [DISTRICT]
CIVIL SUIT NO. ________ OF 2026

[Plaintiff Name] ...Plaintiff
VERSUS
[Defendant Name] ...Defendant

APPLICATION UNDER ORDER XXXIX RULES 1 AND 2 READ WITH SECTION 151 OF THE CODE OF CIVIL PROCEDURE, 1908 FOR AD-INTERIM EX-PARTE TEMPORARY INJUNCTION

THE APPLICANT / PLAINTIFF RESPECTFULLY STATES:
1. That the Plaintiff has instituted the accompanying suit for declaration and permanent injunction.
2. That the Plaintiff has a strong prima facie case as evidenced by registered Sale Deed dated [____].
3. That the Defendant has threatened to create third-party interests and change the nature of the suit property.
4. That the balance of convenience lies entirely in favour of the Plaintiff, and irreparable loss which cannot be compensated in money will be caused if ad-interim protection is declined.

PRAYER:
The Plaintiff accordingly prays that an ad-interim ex-parte injunction be granted restraining the Defendant, their agents, and assigns from alienating, transferring, or creating any encumbrance on suit property bearing No. [____] till final disposal of the suit.

PLAINTIFF THROUGH ADVOCATE
Place: ____________
Date: ____________`
  },
  {
    id: 'form-ni-138',
    title: 'Statutory Demand Notice under Section 138 Negotiable Instruments Act',
    category: 'Commercial',
    courtJurisdiction: 'Legal Notice / Pre-Litigation',
    governingStatute: 'Section 138(b) Negotiable Instruments Act, 1881',
    description: 'Formal legal demand notice dispatched within 30 days of receipt of dishonour memo from bank, demanding payment of cheque amount within 15 days prior to filing criminal complaint.',
    templateText: `REGISTERED POST A.D. / SPEED POST
LEGAL DEMAND NOTICE UNDER SECTION 138 OF THE NEGOTIABLE INSTRUMENTS ACT, 1881

Date: [Date]
To,
[Drawer / Defaulter Name]
[Address]

UNDER INSTRUCTIONS AND ON BEHALF OF MY CLIENT: [Payee Name], I hereby serve upon you the following Statutory Notice:

1. That in discharge of your legally enforceable debt and liability towards my Client for supplies delivered under Invoice No. [____], you issued Cheque No. [____] dated [____] for an amount of Rs. [Amount]/- drawn on [Bank Name].
2. That on presentation for encashment, the said cheque was returned unpaid by your banker with the remark "Funds Insufficient" / "Account Closed" vide Return Memo dated [____], received by my Client on [Date].
3. That you have failed to maintain sufficient balance knowing fully well that the cheque would be dishonoured upon presentation.

I THEREFORE CALL UPON YOU to make the payment of the said cheque amount of Rs. [Amount]/- to my Client within 15 (FIFTEEN) DAYS of the receipt of this statutory notice, failing which my Client shall initiate criminal proceedings against you under Section 138 of the Negotiable Instruments Act, 1881 and Section 318 BNS 2023.

[Advocate Name, Enrolment No.]
Chamber Address & Contact`
  },
  {
    id: 'form-affidavit',
    title: 'General Verification Affidavit in Support of Pleadings',
    category: 'Affidavits',
    courtJurisdiction: 'Universal',
    governingStatute: 'Order VI Rule 15 CPC read with Section 297 CrPC',
    description: 'Standard solemn verification affidavit affirming that contents of the accompanying petition, plaint, or application are true to personal knowledge and legal advice.',
    templateText: `AFFIDAVIT IN SUPPORT OF APPLICATION / PETITION

BEFORE THE HON'BLE COURT AT [CITY]

IN THE MATTER OF:
[Petitioner / Plaintiff Name] ...Petitioner / Plaintiff
VERSUS
[Respondent / Defendant Name] ...Respondent / Defendant

AFFIDAVIT OF [Deponent Name], S/o [Father Name], aged about [____] years, residing at [Address].

I, the Deponent abovenamed, do hereby solemnly affirm and declare on oath as under:
1. That I am the Petitioner in the captioned matter and am fully conversant with the facts of the case, hence competent to swear this affidavit.
2. That the accompanying Petition has been drafted under my instructions and the contents of Paras 1 to [____] are true and correct to my personal knowledge, and contents of Paras [____] to [____] are based on legal advice received from counsel, which I believe to be true.
3. That no part of it is false and nothing material has been concealed therefrom.

DEPONENT

VERIFICATION:
Verified at [Place] on this [Date] day of [Month], 2026, that the contents of the above affidavit are true and correct to my knowledge. No part of it is false.

DEPONENT`
  }
];

const JUDGMENTS: JudgmentItem[] = [
  {
    id: 'judg-1',
    title: 'K.S. Puttaswamy (Retd.) v. Union of India',
    citation: '(2017) 10 SCC 1',
    court: 'Supreme Court of India',
    benchStrength: '9-Judge Constitution Bench (Unanimous)',
    decisionDate: '24 August 2017',
    subject: 'Constitutional Law · Right to Privacy & Article 21',
    headnote: 'Re-examination of whether the right to privacy constitutes a guaranteed fundamental right under Part III of the Constitution. Overruled M.P. Sharma (1954) and Kharak Singh (1962) to the extent they held privacy was not constitutionally protected.',
    ratioDecidendi: 'Privacy is an intrinsic part of the right to life and personal liberty guaranteed under Article 21, and forms part of the freedom guaranteed by Part III of the Constitution. State invasion of privacy must satisfy the four prongs: legality, legitimate state aim, proportionality, and procedural safeguards.',
    keyStatutes: ['Constitution of India: Articles 14, 19, 21', 'Aadhaar Act, 2016']
  },
  {
    id: 'judg-2',
    title: 'Maneka Gandhi v. Union of India',
    citation: '(1978) 1 SCC 248',
    court: 'Supreme Court of India',
    benchStrength: '7-Judge Constitution Bench',
    decisionDate: '25 January 1978',
    subject: 'Constitutional Law · Golden Triangle (Arts 14, 19, 21)',
    headnote: 'Impugned impounding of passport under Section 10(3)(c) of the Passports Act without furnishing reasons or prior hearing. Overruled the narrow interpretation in A.K. Gopalan (1950).',
    ratioDecidendi: 'Procedure established by law under Article 21 cannot be arbitrary, oppressive, or fanciful; it must be just, fair, and reasonable. Articles 14, 19, and 21 do not operate as disjointed silos but form an interconnected "Golden Triangle" test of constitutional validity.',
    keyStatutes: ['Constitution of India: Articles 14, 19, 21', 'Passports Act, 1967: Section 10(3)(c)']
  },
  {
    id: 'judg-3',
    title: 'Sushila Aggarwal v. State (NCT of Delhi)',
    citation: '(2020) 5 SCC 1',
    court: 'Supreme Court of India',
    benchStrength: '5-Judge Constitution Bench',
    decisionDate: '29 January 2020',
    subject: 'Criminal Procedure · Anticipatory Bail Scope & Duration',
    headnote: 'Reference on whether protection granted under Section 438 CrPC (now Section 482 BNSS) should be limited to a fixed period till filing of charge-sheet or summon of court.',
    ratioDecidendi: 'Protection granted under Section 438 CrPC should not ordinarily be subjected to any fixed time limit and should continue till the conclusion of trial, unless special features or evidence justifying restriction are demonstrated by the prosecution.',
    keyStatutes: ['Code of Criminal Procedure: Section 438', 'Bharatiya Nagarik Suraksha Sanhita: Section 482']
  },
  {
    id: 'judg-4',
    title: 'Lalita Kumari v. Govt. of Uttar Pradesh',
    citation: '(2014) 2 SCC 1',
    court: 'Supreme Court of India',
    benchStrength: '5-Judge Constitution Bench',
    decisionDate: '12 November 2013',
    subject: 'Criminal Procedure · Mandatory Registration of FIR',
    headnote: 'Constitutional interpretation of whether a police officer is bound to register an FIR upon receiving information relating to commission of a cognizable offence.',
    ratioDecidendi: 'Registration of FIR is mandatory under Section 154 CrPC (now Section 173 BNSS) if the information discloses the commission of a cognizable offence. Preliminary inquiry is permissible only in exceptional cases (medical negligence, matrimonial disputes, commercial disputes) within a strict 7-day timeline.',
    keyStatutes: ['Code of Criminal Procedure: Section 154', 'Bharatiya Nagarik Suraksha Sanhita: Section 173']
  },
  {
    id: 'judg-5',
    title: 'Vidya Drolia v. Durga Trading Corporation',
    citation: '(2021) 2 SCC 1',
    court: 'Supreme Court of India',
    benchStrength: '3-Judge Bench',
    decisionDate: '14 December 2020',
    subject: 'Arbitration · Arbitrability of Disputes & Section 11',
    headnote: 'Settled the four-fold test for non-arbitrability of disputes and scope of judicial intervention at the referral stage under Section 11 of the Arbitration and Conciliation Act, 1996.',
    ratioDecidendi: 'A dispute is non-arbitrable when: (1) It relates to actions in rem, (2) Affects third-party rights, (3) Pertains to sovereign functions of the state, or (4) Expressly barred by statute. At the Section 11 stage, the court only conducts a prima facie review: "When in doubt, refer."',
    keyStatutes: ['Arbitration & Conciliation Act, 1996: Sections 8, 11', 'Transfer of Property Act, 1882']
  }
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================

export interface LegalLibraryProps {
  initialTab?: LibraryTab;
  view?: 'all' | LibraryTab;
  rolePrefix?: string;
}

export default function LegalLibrary({
  initialTab = 'bare-acts',
  view = 'all',
  rolePrefix
}: LegalLibraryProps = {}) {
  const [internalTab, setInternalTab] = useState<LibraryTab>(initialTab);
  const activeTab = view !== 'all' ? view : internalTab;
  const setActiveTab = setInternalTab;
  const [searchQuery, setSearchQuery] = useState('');

  // Dynamic Library Collections State
  const [bareActsList, setBareActsList] = useState<BareActItem[]>(BARE_ACTS);
  const [dictionaryList, setDictionaryList] = useState<DictionaryTerm[]>(DICTIONARY_TERMS);
  const [formsList, setFormsList] = useState<LegalForm[]>(LEGAL_FORMS);
  const [judgmentsList, setJudgmentsList] = useState<JudgmentItem[]>(JUDGMENTS);

  // Fetch dynamic library data from backend
  useEffect(() => {
    api.getLibraryData().then((res) => {
      if (res.success && res.data) {
        if (Array.isArray(res.data.bareActs) && res.data.bareActs.length > 0) setBareActsList(res.data.bareActs);
        if (Array.isArray(res.data.dictionaryTerms) && res.data.dictionaryTerms.length > 0) setDictionaryList(res.data.dictionaryTerms);
        if (Array.isArray(res.data.legalForms) && res.data.legalForms.length > 0) setFormsList(res.data.legalForms);
        if (Array.isArray(res.data.judgments) && res.data.judgments.length > 0) setJudgmentsList(res.data.judgments);
      }
    }).catch(() => {});
  }, []);

  const baseRoute = rolePrefix && rolePrefix !== '/dashboard' ? `${rolePrefix}/legal-library` : '/legal-library';

  // Sub-filters
  const [selectedActCategory, setSelectedActCategory] = useState<string>('All');
  const [selectedDictLetter, setSelectedDictLetter] = useState<string>('All');
  const [selectedFormCategory, setSelectedFormCategory] = useState<string>('All');
  const [selectedJudgmentCourt, setSelectedJudgmentCourt] = useState<string>('All');

  // Modals State
  const [selectedAct, setSelectedAct] = useState<BareActItem | null>(null);
  const [selectedActSectionIndex, setSelectedActSectionIndex] = useState(0);
  const [selectedTerm, setSelectedTerm] = useState<DictionaryTerm | null>(null);
  const [selectedForm, setSelectedForm] = useState<LegalForm | null>(null);
  const [selectedJudgment, setSelectedJudgment] = useState<JudgmentItem | null>(null);

  // Copy Feedback
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopyText = (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1800);
  };

  // Filtered Bare Acts
  const filteredActs = useMemo(() => {
    return bareActsList.filter((act) => {
      const matchCat = selectedActCategory === 'All' || act.category === selectedActCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchName = act.name.toLowerCase().includes(q);
      const matchSummary = act.summary.toLowerCase().includes(q);
      const matchSec = act.keySections.some(
        (s) => s.number.toLowerCase().includes(q) || s.title.toLowerCase().includes(q)
      );
      return matchCat && (matchName || matchSummary || matchSec);
    });
  }, [bareActsList, selectedActCategory, searchQuery]);

  // Filtered Dictionary Terms
  const filteredDictionary = useMemo(() => {
    return dictionaryList.filter((item) => {
      const matchLetter = selectedDictLetter === 'All' || item.letter === selectedDictLetter;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchLetter;
      const matchTerm = item.term.toLowerCase().includes(q);
      const matchDef = item.definition.toLowerCase().includes(q);
      const matchTrans = item.literalTranslation?.toLowerCase().includes(q);
      return matchLetter && (matchTerm || matchDef || matchTrans);
    });
  }, [dictionaryList, selectedDictLetter, searchQuery]);

  // Filtered Forms
  const filteredForms = useMemo(() => {
    return formsList.filter((form) => {
      const matchCat = selectedFormCategory === 'All' || form.category === selectedFormCategory;
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCat;
      const matchTitle = form.title.toLowerCase().includes(q);
      const matchDesc = form.description.toLowerCase().includes(q);
      const matchStatute = form.governingStatute.toLowerCase().includes(q);
      return matchCat && (matchTitle || matchDesc || matchStatute);
    });
  }, [formsList, selectedFormCategory, searchQuery]);

  // Filtered Judgments
  const filteredJudgments = useMemo(() => {
    return judgmentsList.filter((judg) => {
      const matchCourt = selectedJudgmentCourt === 'All' || judg.court.includes(selectedJudgmentCourt);
      const q = searchQuery.toLowerCase().trim();
      if (!q) return matchCourt;
      const matchTitle = judg.title.toLowerCase().includes(q);
      const matchCitation = judg.citation.toLowerCase().includes(q);
      const matchSubject = judg.subject.toLowerCase().includes(q);
      const matchRatio = judg.ratioDecidendi.toLowerCase().includes(q);
      return matchCourt && (matchTitle || matchCitation || matchSubject || matchRatio);
    });
  }, [judgmentsList, selectedJudgmentCourt, searchQuery]);

  // Letters available in dictionary
  const availableLetters = useMemo(() => {
    const letters = Array.from(new Set(dictionaryList.map((t) => t.letter))).sort();
    return ['All', ...letters];
  }, [dictionaryList]);

  return (
    <div className="w-full flex flex-col gap-6 text-[#1E293B] font-sans antialiased">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & HIGH-YIELD STATS                                     */}
      {/* =================================================================== */}
      <div className="bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B] tracking-tight">
            {activeTab === 'bare-acts' && view !== 'all'
              ? 'Bare Acts & Statutory Codes'
              : activeTab === 'dictionary' && view !== 'all'
              ? 'Legal Dictionary & Maxims'
              : activeTab === 'forms' && view !== 'all'
              ? 'Legal Forms & Procedural Templates'
              : activeTab === 'judgments' && view !== 'all'
              ? 'Judgment Library'
              : 'Legal Library'}
          </h1>
          <p className="text-xs sm:text-sm text-[#64748B] mt-1 max-w-2xl leading-relaxed">
            {activeTab === 'bare-acts' && view !== 'all'
              ? 'Authoritative repository of Indian statutes, criminal & civil codes, constitutional provisions, and commercial enactments with section-by-section analysis.'
              : activeTab === 'dictionary' && view !== 'all'
              ? 'Curated lexicon of Latin legal maxims, statutory terms, constitutional doctrines, and landmark interpretations.'
              : activeTab === 'forms' && view !== 'all'
              ? 'Standardized procedural pleadings, regular bail petitions, statutory notices, written statements, and affidavits with one-click copy.'
              : activeTab === 'judgments' && view !== 'all'
              ? 'Landmark Supreme Court and High Court precedents with concise judicial headnotes, key legal issues, and binding ratio decidendi.'
              : 'Central repository of statutory Bare Acts, Latin legal maxims & dictionary, procedural court forms, and authoritative landmark judicial authorities.'}
          </p>

          <div className="flex flex-wrap items-center gap-3 sm:gap-5 text-xs text-[#64748B] mt-3 pt-3 border-t border-[#FAF5EB]">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#C59B58]" />
              <strong>{BARE_ACTS.length}</strong> Key Bare Acts
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-[#1E3A8A]" />
              <strong>{DICTIONARY_TERMS.length}</strong> Legal Maxims & Terms
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-[#8C5320]" />
              <strong>{LEGAL_FORMS.length}</strong> Court Forms & Pleadings
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Gavel className="w-4 h-4 text-emerald-700" />
              <strong>{JUDGMENTS.length}</strong> Landmark Precedents
            </span>
          </div>
        </div>

        {/* Global Search Box */}
        <div className="w-full md:w-80 flex-shrink-0">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={`Search ${
                activeTab === 'bare-acts'
                  ? 'Acts & sections...'
                  : activeTab === 'dictionary'
                  ? 'Maxims & terms...'
                  : activeTab === 'forms'
                  ? 'Forms & templates...'
                  : 'Judgments & citations...'
              }`}
              className="w-full pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs sm:text-sm text-[#1E293B] placeholder-[#94A3B8] focus:outline-none focus:border-[#1E3A8A] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#1E293B]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: BARE ACTS REPOSITORY                                         */}
      {/* =================================================================== */}
      {activeTab === 'bare-acts' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Sub-Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Criminal', 'Civil', 'Constitutional', 'Commercial'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedActCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedActCategory === cat
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Acts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredActs.map((act) => (
              <div
                key={act.id}
                onClick={() => {
                  setSelectedAct(act);
                  setSelectedActSectionIndex(0);
                }}
                className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-5 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between gap-4 group"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#FAF5EB] border border-[#DECDB8] font-bold text-[#8C5320] text-[11px]">
                      {act.category}
                    </span>
                    <span className="text-[#64748B] font-mono text-[11px]">{act.totalSections}</span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] group-hover:text-[#1E3A8A] transition leading-snug">
                      {act.name}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-1.5 line-clamp-3 leading-relaxed">
                      {act.summary}
                    </p>
                  </div>

                  {/* High Yield Provisions */}
                  <div className="space-y-1.5 pt-2 border-t border-[#FAF5EB]">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                      High-Yield Provisions:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {act.keySections.map((sec, i) => (
                        <span
                          key={i}
                          className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DECDB8] text-[10px] font-semibold text-[#1E3A8A]"
                        >
                          {sec.number}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EAE3D6] text-xs font-bold text-[#1E3A8A]">
                  <span>Explore Provisions ({act.keySections.length})</span>
                  <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: LEGAL DICTIONARY & MAXIMS                                    */}
      {/* =================================================================== */}
      {activeTab === 'dictionary' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Alphabet Index Filter */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-white p-2.5 rounded-2xl border border-[#DECDB8]">
            <span className="text-xs font-bold text-[#8C5320] px-2 uppercase">Index:</span>
            {availableLetters.map((letter) => (
              <button
                key={letter}
                type="button"
                onClick={() => setSelectedDictLetter(letter)}
                className={`w-7 h-7 rounded-lg text-xs font-bold transition flex items-center justify-center cursor-pointer flex-shrink-0 ${
                  selectedDictLetter === letter
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#FAF8F5]'
                }`}
              >
                {letter}
              </button>
            ))}
          </div>

          {/* Dictionary Terms Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDictionary.map((term) => (
              <div
                key={term.id}
                onClick={() => setSelectedTerm(term)}
                className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-5 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between gap-3 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-serif italic font-bold text-base text-[#1E3A8A] group-hover:text-[#8C5320] transition">
                      {term.term}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-[#FAF5EB] border border-[#DECDB8] text-[10px] font-bold text-[#8C5320]">
                      {term.category}
                    </span>
                  </div>

                  {term.literalTranslation && (
                    <p className="text-xs text-[#8C5320] italic font-serif">
                      &ldquo;{term.literalTranslation}&rdquo;
                    </p>
                  )}

                  <p className="text-xs text-[#475569] line-clamp-3 leading-relaxed">
                    {term.definition}
                  </p>
                </div>

                <div className="pt-2.5 border-t border-[#FAF5EB] flex items-center justify-between text-xs">
                  <span className="text-[11px] text-[#64748B] truncate max-w-[200px]">
                    {term.landmarkCase || 'Indian Legal Doctrine'}
                  </span>
                  <span className="font-bold text-[#1E3A8A] text-xs flex items-center">
                    Read More <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: FORMS & PRECEDENTS REPOSITORY                                */}
      {/* =================================================================== */}
      {activeTab === 'forms' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Sub-Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Criminal', 'Civil', 'Writs', 'Commercial', 'Affidavits'].map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedFormCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedFormCategory === cat
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Forms List */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredForms.map((form) => (
              <div
                key={form.id}
                onClick={() => setSelectedForm(form)}
                className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-5 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="px-2.5 py-0.5 rounded-md bg-[#FAF5EB] border border-[#DECDB8] text-[#8C5320] font-bold text-[11px]">
                      {form.category} · {form.courtJurisdiction}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleCopyText(form.templateText, form.id, e)}
                      className="px-2 py-1 rounded-lg border border-[#DECDB8] bg-[#FAF8F5] hover:bg-[#FAF5EB] text-[11px] font-semibold text-[#1E3A8A] transition flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === form.id ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span>Copied!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Template</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] hover:text-[#1E3A8A] transition">
                    {form.title}
                  </h3>

                  <p className="text-xs text-[#64748B] line-clamp-2 leading-relaxed">
                    {form.description}
                  </p>

                  <div className="p-2.5 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] text-[11px] text-[#475569]">
                    <strong className="text-[#8C5320]">Governing Law: </strong>
                    {form.governingStatute}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EAE3D6] text-xs font-bold text-[#1E3A8A]">
                  <span>Preview Full Form Template</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 4: JUDGMENT LIBRARY                                             */}
      {/* =================================================================== */}
      {activeTab === 'judgments' && (
        <div className="space-y-4 animate-in fade-in duration-150">
          {/* Sub-Filters */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {['All', 'Supreme Court', 'Constitution Bench'].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setSelectedJudgmentCourt(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                  selectedJudgmentCourt === c
                    ? 'bg-[#1E3A8A] text-white shadow-2xs'
                    : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A]'
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          {/* Judgments Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredJudgments.map((judg) => (
              <div
                key={judg.id}
                onClick={() => setSelectedJudgment(judg)}
                className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-5 shadow-xs hover:shadow-sm transition cursor-pointer flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-[#8C5320] bg-[#FAF5EB] px-2.5 py-0.5 rounded-md border border-[#DECDB8]">
                      {judg.citation}
                    </span>
                    <span className="text-[11px] text-[#64748B]">{judg.decisionDate}</span>
                  </div>

                  <div>
                    <h3 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] hover:text-[#1E3A8A] transition">
                      {judg.title}
                    </h3>
                    <p className="text-xs text-[#64748B] mt-0.5">
                      {judg.court} · <strong className="text-[#1E3A8A]">{judg.benchStrength}</strong>
                    </p>
                  </div>

                  {/* Ratio Card snippet */}
                  <div className="p-3 rounded-xl bg-[#FAF8F5] border border-[#DECDB8] space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                      Ratio Decidendi:
                    </span>
                    <p className="text-xs text-[#334155] line-clamp-3 leading-relaxed">
                      {judg.ratioDecidendi}
                    </p>
                  </div>

                  {/* Statutes interpreted */}
                  <div className="flex flex-wrap gap-1.5">
                    {judg.keyStatutes.map((st, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-white border border-[#DECDB8] text-[10px] text-[#64748B]">
                        {st}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-[#EAE3D6] text-xs font-bold text-[#1E3A8A]">
                  <span>View Landmark Analysis</span>
                  <ChevronRight className="w-4 h-4" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 1: BARE ACT SECTION BROWSER                                   */}
      {/* =================================================================== */}
      {selectedAct && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col font-sans">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-3.5 border-b border-[#EAE3D6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320]">
                  {selectedAct.category} · {selectedAct.year}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-0.5">
                  {selectedAct.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedAct(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Section Switcher Tabs */}
            {selectedAct.keySections.length > 1 && (
              <div className="flex items-center gap-2 pt-3 pb-1 overflow-x-auto scrollbar-none">
                {selectedAct.keySections.map((sec, idx) => (
                  <button
                    key={sec.number}
                    type="button"
                    onClick={() => setSelectedActSectionIndex(idx)}
                    className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer flex-shrink-0 ${
                      selectedActSectionIndex === idx
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A]'
                    }`}
                  >
                    {sec.number}
                  </button>
                ))}
              </div>
            )}

            {/* Active Section Detail */}
            {selectedAct.keySections[selectedActSectionIndex] && (() => {
              const sec = selectedAct.keySections[selectedActSectionIndex];
              return (
                <div className="flex-1 overflow-y-auto py-3 space-y-3.5 pr-1">
                  <div className="bg-white border border-[#DECDB8] rounded-2xl p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#FAF5EB]">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs font-bold text-[#1E3A8A] bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                            {sec.number}
                          </span>
                          {sec.newActEquivalent && (
                            <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                              {sec.newActEquivalent}
                            </span>
                          )}
                        </div>
                        <h4 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] mt-1.5">
                          {sec.title}
                        </h4>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopyText(`${sec.number} - ${sec.title}: ${sec.plainExplanation}`, sec.number)}
                        className="px-2.5 py-1.5 rounded-lg border border-[#DECDB8] bg-[#FAF8F5] text-xs font-semibold text-[#1E3A8A] hover:bg-[#FAF5EB] transition cursor-pointer"
                      >
                        {copiedId === sec.number ? 'Copied' : 'Copy'}
                      </button>
                    </div>

                    {/* Plain Explanation */}
                    <div className="p-3.5 rounded-xl bg-[#FAF5EB] border-l-4 border-[#C59B58] space-y-1">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                        Plain Language Meaning:
                      </span>
                      <p className="text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                        {sec.plainExplanation}
                      </p>
                    </div>

                    {/* Essential Ingredients */}
                    {sec.ingredients && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] block">
                          Essential Legal Ingredients:
                        </span>
                        <div className="space-y-1.5">
                          {sec.ingredients.map((ing, idx) => (
                            <div key={idx} className="flex items-start gap-2 p-2 rounded-xl bg-[#FAF8F5] border border-[#EAE3D6] text-xs text-[#334155]">
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
                              <span>{ing}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Landmark Precedent */}
                    <div className="p-3 bg-white border border-[#DECDB8] rounded-xl space-y-1 shadow-2xs">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#8C5320] block">
                        Landmark Precedent & Authority:
                      </span>
                      <p className="text-xs text-[#1E293B]">
                        {sec.precedent}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between">
              <span className="text-xs text-[#64748B]">{selectedAct.totalSections}</span>
              <button
                type="button"
                onClick={() => setSelectedAct(null)}
                className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition cursor-pointer"
              >
                Close Act
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 2: DICTIONARY TERM VIEW                                       */}
      {/* =================================================================== */}
      {selectedTerm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-3xl max-w-xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[90vh] flex flex-col font-sans">
            <div className="flex items-start justify-between pb-3.5 border-b border-[#EAE3D6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320]">
                  {selectedTerm.category}
                </span>
                <h3 className="font-serif italic font-bold text-xl text-[#1E293B] mt-0.5">
                  {selectedTerm.term}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTerm(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto">
              {selectedTerm.literalTranslation && (
                <div className="p-3 bg-white border border-[#DECDB8] rounded-xl">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                    Literal English Translation:
                  </span>
                  <p className="font-serif italic text-sm text-[#1E3A8A] mt-0.5">
                    &ldquo;{selectedTerm.literalTranslation}&rdquo;
                  </p>
                </div>
              )}

              <div className="p-4 bg-white border border-[#DECDB8] rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                  Authoritative Definition:
                </span>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {selectedTerm.definition}
                </p>
              </div>

              <div className="p-4 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                  Practical Usage in Pleadings:
                </span>
                <p className="text-xs text-[#1E293B] italic leading-relaxed">
                  &ldquo;{selectedTerm.contextUsage}&rdquo;
                </p>
              </div>

              {selectedTerm.landmarkCase && (
                <div className="p-3 bg-white border border-[#DECDB8] rounded-xl text-xs">
                  <strong className="text-[#8C5320]">Landmark Ruling: </strong>
                  <span>{selectedTerm.landmarkCase}</span>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopyText(`${selectedTerm.term}: ${selectedTerm.definition}`, selectedTerm.id)}
                className="px-3.5 py-1.5 rounded-xl border border-[#DECDB8] bg-white text-xs font-semibold text-[#1E3A8A] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                {copiedId === selectedTerm.id ? 'Copied' : 'Copy Definition'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedTerm(null)}
                className="px-4 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 3: FULL FORM PREVIEW & COPY                                   */}
      {/* =================================================================== */}
      {selectedForm && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-3xl max-w-3xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col font-sans">
            <div className="flex items-start justify-between pb-3.5 border-b border-[#EAE3D6]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320]">
                  {selectedForm.category} · {selectedForm.courtJurisdiction}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-0.5">
                  {selectedForm.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedForm(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-3 space-y-3 overflow-y-auto pr-1">
              <div className="p-3 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl text-xs">
                <strong className="text-[#8C5320]">Statutory Compliance: </strong>
                <span>{selectedForm.governingStatute}</span>
              </div>

              <div className="bg-white border border-[#DECDB8] rounded-xl p-4 font-mono text-xs text-[#334155] whitespace-pre-wrap leading-relaxed overflow-x-auto shadow-2xs">
                {selectedForm.templateText}
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopyText(selectedForm.templateText, selectedForm.id)}
                className="px-4 py-2 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {copiedId === selectedForm.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copiedId === selectedForm.id ? 'Copied to Clipboard!' : 'Copy Full Template'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedForm(null)}
                className="px-4 py-2 rounded-xl border border-[#DECDB8] bg-white text-xs font-semibold text-[#64748B] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* MODAL 4: JUDGMENT ANALYSIS & RATIO                                  */}
      {/* =================================================================== */}
      {selectedJudgment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-150">
          <div className="bg-[#FAF8F5] border border-[#DECDB8] rounded-3xl max-w-2xl w-full p-5 sm:p-7 shadow-2xl relative max-h-[92vh] flex flex-col font-sans">
            <div className="flex items-start justify-between pb-3.5 border-b border-[#EAE3D6]">
              <div>
                <span className="font-mono text-xs font-bold text-[#8C5320] bg-[#FAF5EB] px-2 py-0.5 rounded border border-[#DECDB8]">
                  {selectedJudgment.citation}
                </span>
                <h3 className="font-serif font-bold text-lg text-[#1E293B] mt-1">
                  {selectedJudgment.title}
                </h3>
                <p className="text-xs text-[#64748B] mt-0.5">
                  {selectedJudgment.court} · {selectedJudgment.benchStrength} ({selectedJudgment.decisionDate})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedJudgment(null)}
                className="p-1.5 rounded-lg text-[#64748B] hover:text-[#1E293B] hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-4 overflow-y-auto">
              <div className="p-4 bg-white border border-[#DECDB8] rounded-xl space-y-1.5 shadow-2xs">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                  Concise Headnote:
                </span>
                <p className="text-xs sm:text-sm text-[#334155] leading-relaxed">
                  {selectedJudgment.headnote}
                </p>
              </div>

              <div className="p-4 bg-[#FAF5EB] border-l-4 border-[#C59B58] rounded-xl space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320] block">
                  Binding Ratio Decidendi:
                </span>
                <p className="font-serif text-xs sm:text-sm text-[#1E293B] leading-relaxed">
                  {selectedJudgment.ratioDecidendi}
                </p>
              </div>

              <div className="p-3 bg-white border border-[#DECDB8] rounded-xl space-y-1 text-xs">
                <span className="font-bold text-[#8C5320] block">Statutes Interpreted:</span>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedJudgment.keyStatutes.map((st, i) => (
                    <span key={i} className="px-2 py-0.5 rounded bg-[#FAF8F5] border border-[#DECDB8] text-[11px] text-[#475569]">
                      {st}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#EAE3D6] flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleCopyText(`${selectedJudgment.title} ${selectedJudgment.citation} — Ratio: ${selectedJudgment.ratioDecidendi}`, selectedJudgment.id)}
                className="px-3.5 py-1.5 rounded-xl border border-[#DECDB8] bg-white text-xs font-semibold text-[#1E3A8A] hover:bg-[#FAF8F5] transition cursor-pointer"
              >
                {copiedId === selectedJudgment.id ? 'Copied Citation!' : 'Copy Citation & Ratio'}
              </button>
              <button
                type="button"
                onClick={() => setSelectedJudgment(null)}
                className="px-4 py-1.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-semibold hover:bg-[#1E3A8A]/90 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
