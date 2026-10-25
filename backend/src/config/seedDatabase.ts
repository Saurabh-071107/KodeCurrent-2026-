import { LegalLibraryItem, NotificationModel, Template, BareAct } from '../models/AppModels';

export const seedDatabaseIfEmpty = async (): Promise<void> => {
  try {
    // 1. Seed Legal Library Items if empty
    const libCount = await LegalLibraryItem.countDocuments();
    if (libCount === 0) {
      console.log('[DB Seeder] Seeding authoritative legal library repository to MongoDB...');
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
      console.log('[DB Seeder] Legal library items seeded successfully.');
    }
  } catch (err: any) {
    console.warn('[DB Seeder] Seeding warning:', err.message);
  }
};
