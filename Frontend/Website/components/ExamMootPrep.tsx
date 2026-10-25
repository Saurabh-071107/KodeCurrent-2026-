'use client';

import React, { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import {
  FileText,
  Sparkles,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Upload,
  Play,
  Award,
  BookOpen,
  Sliders,
  ChevronRight,
  ChevronLeft,
  Bookmark,
  Check,
  HelpCircle,
  ArrowRight,
  Filter,
  FileCheck2,
  Trash2
} from 'lucide-react';

export interface Question {
  id: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  statuteRef: string;
  topic?: string;
}

export interface MockTest {
  id: string;
  title: string;
  category: 'judiciary' | 'aibe' | 'clat' | 'moot' | 'custom';
  categoryLabel: string;
  subject: string;
  description: string;
  questionsCount: number;
  durationMinutes: number;
  difficulty: 'Foundation' | 'Preliminary' | 'Mains / Advanced';
  questions: Question[];
}

const PREMADE_TESTS: MockTest[] = [
  {
    id: 'djs-prelims-1',
    title: 'Delhi Judicial Service (Preliminary) Drill',
    category: 'judiciary',
    categoryLabel: 'Judicial Services',
    subject: 'Constitutional Law & BNSS 2023',
    description: 'High-yield objective test covering constitutional writs, bail provisions under BNSS, and landmark judicial pronouncements.',
    questionsCount: 5,
    durationMinutes: 10,
    difficulty: 'Preliminary',
    questions: [
      {
        id: 1,
        question: 'Under which provision of the Bharatiya Nagarik Suraksha Sanhita (BNSS), 2023 has the grant of anticipatory bail been codified, replacing Section 438 of the Code of Criminal Procedure, 1973?',
        options: [
          'Section 480 BNSS',
          'Section 482 BNSS',
          'Section 484 BNSS',
          'Section 490 BNSS'
        ],
        correctIndex: 1,
        statuteRef: 'Section 482 BNSS 2023 (Corresponds to Sec 438 CrPC)',
        explanation: 'Section 482 of BNSS, 2023 retains the power of the High Court and Court of Session to issue directions granting bail to persons apprehending arrest, previously codified under Section 438 CrPC.',
        topic: 'BNSS / Criminal Procedure'
      },
      {
        id: 2,
        question: 'In which landmark judgment did a 7-judge Constitution Bench establish that the "procedure established by law" under Article 21 must be just, fair, and reasonable, overruling A.K. Gopalan?',
        options: [
          'K.S. Puttaswamy v. Union of India (2017)',
          'Maneka Gandhi v. Union of India (1978)',
          'Minerva Mills v. Union of India (1980)',
          'Sunil Batra v. Delhi Administration (1978)'
        ],
        correctIndex: 1,
        statuteRef: 'Article 21, Constitution of India',
        explanation: 'In Maneka Gandhi v. Union of India (1978) 1 SCC 248, Justice P.N. Bhagwati held that procedure deprived of liberty cannot be arbitrary or oppressive, effectively reading American procedural due process into Article 21.',
        topic: 'Constitutional Law'
      },
      {
        id: 3,
        question: 'Under Section 103(2) of the Bharatiya Nyaya Sanhita (BNS), 2023, when murder is committed by a group of five or more persons on grounds of race, caste, or community, what is the mandatory punishment?',
        options: [
          'Rigorous imprisonment up to 10 years only',
          'Imprisonment for life or death, along with fine',
          'Simple imprisonment not less than 7 years',
          'Detention under administrative bond'
        ],
        correctIndex: 1,
        statuteRef: 'Section 103(2), Bharatiya Nyaya Sanhita 2023',
        explanation: 'Section 103(2) BNS explicitly penalizes mob lynching when five or more persons act together on discriminatory grounds, prescribing death or imprisonment for life, and liability to fine.',
        topic: 'Bharatiya Nyaya Sanhita (BNS)'
      },
      {
        id: 4,
        question: 'Which prerogative writ is issued by the High Court under Article 226 to command a public authority to perform a statutory duty that it has unlawfully neglected to execute?',
        options: [
          'Writ of Habeas Corpus',
          'Writ of Quo Warranto',
          'Writ of Mandamus',
          'Writ of Certiorari'
        ],
        correctIndex: 2,
        statuteRef: 'Articles 32 & 226, Constitution of India',
        explanation: 'Mandamus ("we command") is a judicial order commanding an inferior tribunal, corporation, or public official to perform a specified public legal duty.',
        topic: 'Administrative & Constitutional Law'
      },
      {
        id: 5,
        question: 'Under the Bharatiya Sakshya Adhiniyam (BSA), 2023, what is the status of electronic and digital records regarding their admissibility in criminal trials?',
        options: [
          'They are inadmissible without prior physical print verification',
          'They have the same legal effect, validity, and enforceability as paper records under Section 61',
          'They are exclusively secondary evidence requiring magistrate attestation',
          'Only audio recordings are considered substantive evidence'
        ],
        correctIndex: 1,
        statuteRef: 'Sections 61 & 63, Bharatiya Sakshya Adhiniyam 2023',
        explanation: 'Section 61 BSA gives electronic records equal status to paper documents, establishing seamless digital admissibility alongside certificate provisions in Section 63 (formerly Sec 65B IEA).',
        topic: 'Law of Evidence'
      }
    ]
  },
  {
    id: 'aibe-mock-1',
    title: 'All India Bar Examination (AIBE XIX) Qualifier',
    category: 'aibe',
    categoryLabel: 'Bar Examination',
    subject: 'Advocacy Ethics, CPC & Criminal Laws',
    description: 'Essential mock test adhering to the Bar Council of India (BCI) syllabus for law graduates and advocates.',
    questionsCount: 5,
    durationMinutes: 10,
    difficulty: 'Foundation',
    questions: [
      {
        id: 1,
        question: 'Under the Bar Council of India Rules, an advocate is prohibited from accepting an engagement in which they have reason to believe they will be:',
        options: [
          'Appearing before a judge related to them by blood or marriage',
          'Appearing for a party who cannot pay fees immediately',
          'Handling a matter in a city outside their state bar roll',
          'Appearing before an arbitral tribunal without senior counsel'
        ],
        correctIndex: 0,
        statuteRef: 'Rule 6, Chapter II, Part VI, BCI Rules',
        explanation: 'Rule 6 of the BCI Standards of Professional Conduct strictly prohibits an advocate from appearing or practicing before a judicial officer who is related as father, grandfather, son, grandson, brother, husband, wife, or daughter.',
        topic: 'Professional Ethics'
      },
      {
        id: 2,
        question: 'What is the statutory limitation period for filing a Written Statement under Order VIII Rule 1 of the Code of Civil Procedure (CPC), 1908 from the date of service of summons?',
        options: [
          '15 days, extendable to 30 days',
          '30 days, extendable up to 90 days for reasons recorded in writing',
          '60 days without extension',
          '120 days by mutual consent of counsel'
        ],
        correctIndex: 1,
        statuteRef: 'Order VIII Rule 1 CPC 1908 (Commercial Courts proviso alters this to 120 days)',
        explanation: 'Under Order VIII Rule 1, the defendant shall present a written statement within 30 days. The court may extend up to 90 days for exceptional reasons recorded in writing.',
        topic: 'Civil Procedure Code'
      },
      {
        id: 3,
        question: 'Under Section 10 of the Indian Contract Act, 1872, which of the following is NOT an essential element of a valid contract?',
        options: [
          'Free consent of parties competent to contract',
          'Lawful consideration and lawful object',
          'Not expressly declared to be void',
          'Registration with a public notary in all instances'
        ],
        correctIndex: 3,
        statuteRef: 'Section 10, Indian Contract Act 1872',
        explanation: 'Notarization or registration is not mandatory for all contracts under Section 10; only specific agreements mandated by statute (e.g. transfer of immovable property under Registration Act) require formal recording.',
        topic: 'Contract Law'
      },
      {
        id: 4,
        question: 'The doctrine of Res Sub-Judice is codified in which section of the Code of Civil Procedure, 1908?',
        options: [
          'Section 9',
          'Section 10',
          'Section 11',
          'Section 12'
        ],
        correctIndex: 1,
        statuteRef: 'Section 10 CPC (Stay of Suit)',
        explanation: 'Section 10 bars the trial of any suit in which the matter in issue is also directly and substantially in issue in a previously instituted suit between the same parties.',
        topic: 'Civil Procedure Code'
      },
      {
        id: 5,
        question: 'Can an advocate enter into a contingent fee agreement where remuneration is contingent on the success of the litigation in India?',
        options: [
          'Yes, if approved in writing by the client',
          'Yes, provided it does not exceed 15% of the decree value',
          'No, Rule 20 of BCI Rules explicitly prohibits contingency fees as contrary to public policy',
          'Yes, only in commercial arbitration disputes'
        ],
        correctIndex: 2,
        statuteRef: 'Rule 20, BCI Rules & Section 23 Contract Act',
        explanation: 'Rule 20 BCI Rules prohibits advocates from stipulating a fee contingent on litigation success. The Supreme Court in In Re: G., Senior Advocate reaffirmed that contingency contracts compromise judicial independence.',
        topic: 'Professional Ethics'
      }
    ]
  },
  {
    id: 'clat-moot-1',
    title: 'National Moot & CLAT PG Advanced Bench Drill',
    category: 'moot',
    categoryLabel: 'Moot & CLAT PG',
    subject: 'Jurisprudence & Constitutional Interpretation',
    description: 'Complex problem-scenario questions crafted to test bench composure, statutory construction, and precedent distinguishing.',
    questionsCount: 5,
    durationMinutes: 12,
    difficulty: 'Mains / Advanced',
    questions: [
      {
        id: 1,
        question: 'In a constitutional challenge asserting violation of Article 19(1)(a), the State invokes Article 19(2). What standard of review must the Court apply under the Modern Proportionality Test as formulated in K.S. Puttaswamy (2017)?',
        options: [
          'Subjective satisfaction of the Executive officer',
          'Four-pronged test: Legitimate goal, rational connection, necessity (least restrictive measure), and balancing of competing rights',
          'Pure Wednesbury unreasonableness standard only',
          'Presumption of unconstitutionality shifting entire burden permanently to the citizen'
        ],
        correctIndex: 1,
        statuteRef: 'Articles 19(1)(a) & 19(2); Puttaswamy v. Union of India (2017)',
        explanation: 'The modern proportionality test requires: (1) Legitimate State aim; (2) Rational nexus; (3) Least intrusive means; and (4) Proportionality stricto sensu (fair balance).',
        topic: 'Constitutional Jurisprudence'
      },
      {
        id: 2,
        question: 'Counsel appearing for the Petitioner in a Moot Court wants to distinguish an adverse Supreme Court 3-judge bench precedent. Which ground provides the most legally tenable argument before a High Court bench?',
        options: [
          'The precedent is older than 15 years and automatically loses binding force',
          'The holding in the earlier case is per incuriam for failing to consider an applicable statutory amendment or prior Constitution Bench ratio',
          'The earlier judgment was rendered during a court vacation',
          'The High Court has inherent jurisdiction to overrule Supreme Court decisions on equity'
        ],
        correctIndex: 1,
        statuteRef: 'Article 141; Doctrine of Per Incuriam & Stare Decisis',
        explanation: 'Under Article 141, SC judgments bind all courts. A bench can only distinguish an authority if factual matrix diverges or if the judgment is per incuriam (rendered in ignorance of binding statute or larger bench authority).',
        topic: 'Moot Advocacy / Precedent'
      },
      {
        id: 3,
        question: 'Under the doctrine of "Basic Structure", which of the following features has NOT been recognized by the Supreme Court as part of the unamendable core of the Indian Constitution?',
        options: [
          'Judicial review under Articles 32 and 226 (L. Chandra Kumar)',
          'Secular character of the State (S.R. Bommai)',
          'Absolute immunity of the Prime Minister from criminal proceedings (Raj Narain)',
          'Free and fair democratic elections (Indira Gandhi v. Raj Narain)'
        ],
        correctIndex: 2,
        statuteRef: 'Article 368; Indira Gandhi v. Raj Narain (1975)',
        explanation: 'The 39th Amendment attempted to grant absolute immunity to the Prime Minister and Speaker. In Indira Gandhi v. Raj Narain (1975), the SC struck down Clause (4) of Article 329A as violative of equality and basic structure.',
        topic: 'Constitutional Law'
      },
      {
        id: 4,
        question: 'When an act or transaction is partially void for violating a statutory provision, the Court will preserve the lawful portions if they are distinct and independent. This is governed by:',
        options: [
          'Doctrine of Pith and Substance',
          'Doctrine of Severability (Article 13(1))',
          'Doctrine of Territorial Nexus',
          'Doctrine of Colorable Legislation'
        ],
        correctIndex: 1,
        statuteRef: 'Article 13(1) Constitution & Section 57 Contract Act',
        explanation: 'The Doctrine of Severability holds that if valid provisions can survive independently after striking out unconstitutional clauses, the remaining law remains valid (A.K. Gopalan & R.M.D.C. v. Union of India).',
        topic: 'Statutory Interpretation'
      },
      {
        id: 5,
        question: 'Under Section 91 of the Bharatiya Sakshya Adhiniyam, 2023 (formerly Section 91 IEA), when terms of a contract or grant have been reduced to writing, no evidence shall be given in proof thereof EXCEPT:',
        options: [
          'The document itself, or secondary evidence where admissible',
          'Oral confirmation by any independent witness present at the time',
          'Unregistered informal draft notes exchanged between parties',
          'Affidavit filed by the drafting advocate'
        ],
        correctIndex: 0,
        statuteRef: 'Section 91, Bharatiya Sakshya Adhiniyam 2023',
        explanation: 'The best evidence rule dictates that when contract terms are reduced to a formal document, the document itself must be produced, excluding oral parole evidence.',
        topic: 'Law of Evidence'
      }
    ]
  }
];

const SAMPLE_NOTES = [
  {
    title: 'Article 21 & Procedural Due Process',
    subject: 'Constitutional Law',
    text: `Article 21: Protection of Life and Personal Liberty.
- No person shall be deprived of his life or personal liberty except according to procedure established by law.
- In A.K. Gopalan (1950), the Supreme Court adopted a literal interpretation, holding that "procedure established by law" meant any enacted law by Parliament, regardless of its fairness.
- Overruled in Maneka Gandhi v. Union of India (1978): The procedure must be "right, just and fair" and not arbitrary, fanciful, or oppressive. Articles 14, 19, and 21 form the Golden Triangle.
- Right to Privacy established as a Fundamental Right under Article 21 by a 9-judge bench in K.S. Puttaswamy v. Union of India (2017). Proportionality test applies to State restrictions: Legitimate goal, rational connection, least intrusive necessity, and fair balance.`
  },
  {
    title: 'Bharatiya Nyaya Sanhita (BNS) Murder vs Culpable Homicide',
    subject: 'Criminal Law (BNS 2023)',
    text: `Sections 100, 101, 103 Bharatiya Nyaya Sanhita (BNS) 2023:
- Section 100 BNS defines Culpable Homicide (replaces Section 299 IPC).
- Section 101 BNS defines Murder (replaces Section 300 IPC) with the 5 recognized exceptions.
- Section 103 BNS provides Punishment for Murder (replaces Section 302 IPC):
  (1) Murder is punishable with death or imprisonment for life, and shall also be liable to fine.
  (2) Mob Lynching provision: When five or more persons act in concert to commit murder on grounds of race, caste, community, sex, place of birth, language, or personal belief, each member is punishable with death or imprisonment for life, and fine.
- Organised Crime (Section 111 BNS) and Terrorist Acts (Section 113 BNS) introduced as standalone statutory offences.`
  },
  {
    title: 'Specific Relief Act & Mandatory Injunctions',
    subject: 'Civil & Commercial Law',
    text: `Specific Relief Act, 1963 (amended in 2018):
- Specific performance is now a mandatory statutory remedy under Section 10, no longer purely discretionary for the court, except under conditions mentioned in Section 11(2), 14, and 16.
- Section 14A allows engagement of third-party experts to assist the court on specific issues.
- Section 20A prohibits grant of injunctions in infrastructure projects where an injunction would cause impediment or delay in project completion.
- Section 38 governs perpetual injunctions; Section 39 governs mandatory injunctions to prevent breach of an obligation and compel performance of necessary acts.`
  }
];

export default function ExamMootPrep() {
  // Navigation & Mode State
  const [activeTab, setActiveTab] = useState<'premade' | 'generator'>('premade');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [testsList, setTestsList] = useState<MockTest[]>(PREMADE_TESTS);

  // Fetch dynamic mock tests from backend
  useEffect(() => {
    api.getStudentAssets().then((res) => {
      if (res.success && res.data?.mockTests && Array.isArray(res.data.mockTests) && res.data.mockTests.length > 0) {
        setTestsList(res.data.mockTests);
      }
    }).catch(() => {});
  }, []);

  // Generator & File Upload State
  const [uploadedFile, setUploadedFile] = useState<{
    name: string;
    size: string;
    type: string;
    pages?: number;
    extractedPoints?: string[];
  } | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [notesInput, setNotesInput] = useState<string>('');
  const [notesSubject, setNotesSubject] = useState<string>('Constitutional Law');
  const [questionCount, setQuestionCount] = useState<number>(5);
  const [difficultyLevel, setDifficultyLevel] = useState<'Foundation' | 'Preliminary' | 'Mains / Advanced'>('Preliminary');
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [generationProgress, setGenerationProgress] = useState<number>(0);

  const handleFileUpload = (file: File) => {
    const isBns = file.name.toLowerCase().includes('bns') || file.name.toLowerCase().includes('murder') || file.name.toLowerCase().includes('criminal');
    const isSra = file.name.toLowerCase().includes('sra') || file.name.toLowerCase().includes('contract') || file.name.toLowerCase().includes('relief');

    let textContent = SAMPLE_NOTES[0].text;
    let subject = 'Constitutional Law';
    let detectedPoints = [
      'Article 21: Protection of Life & Personal Liberty',
      'Maneka Gandhi (1978) Just, Fair & Reasonable Doctrine',
      'Puttaswamy (2017) Four-Pronged Proportionality Standard'
    ];

    if (isBns) {
      textContent = SAMPLE_NOTES[1].text;
      subject = 'Criminal Law (BNS 2023)';
      detectedPoints = [
        'Section 103(2) BNS Mob Lynching Mandate',
        'Section 101 BNS Murder vs Section 100 Culpable Homicide',
        'Organised Crime & Terrorism Standalone Codification'
      ];
    } else if (isSra) {
      textContent = SAMPLE_NOTES[2].text;
      subject = 'Civil Procedure & Specific Relief';
      detectedPoints = [
        'Mandatory Specific Performance under Section 10 SRA',
        'Section 20A Infrastructure Project Injunction Bar',
        'Section 14A Court-Appointed Independent Experts'
      ];
    }

    setUploadedFile({
      name: file.name,
      size: file.size / (1024 * 1024) > 0.1 ? (file.size / (1024 * 1024)).toFixed(1) + ' MB' : (file.size / 1024).toFixed(0) + ' KB',
      type: file.type || 'application/pdf',
      pages: Math.max(2, Math.min(18, Math.round(file.size / 45000) || 5)),
      extractedPoints: detectedPoints
    });

    setNotesInput(textContent);
    setNotesSubject(subject);
  };

  const handleRemoveFile = () => {
    setUploadedFile(null);
    setNotesInput('');
  };

  // Active Test State
  const [activeTest, setActiveTest] = useState<MockTest | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [userAnswers, setUserAnswers] = useState<Record<number, number>>({});
  const [flaggedQuestions, setFlaggedQuestions] = useState<Set<number>>(new Set());
  const [remainingSeconds, setRemainingSeconds] = useState<number>(600);
  const [isTestSubmitted, setIsTestSubmitted] = useState<boolean>(false);
  const [showSubmitModal, setShowSubmitModal] = useState<boolean>(false);
  const [filterResult, setFilterResult] = useState<'all' | 'incorrect' | 'flagged'>('all');

  // Timer Ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Countdown effect during active test
  useEffect(() => {
    if (activeTest && !isTestSubmitted) {
      timerRef.current = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [activeTest, isTestSubmitted]);

  const handleAutoSubmit = () => {
    setIsTestSubmitted(true);
    setShowSubmitModal(false);
  };

  const handleStartTest = (test: MockTest) => {
    setActiveTest(test);
    setCurrentQuestionIndex(0);
    setUserAnswers({});
    setFlaggedQuestions(new Set());
    setRemainingSeconds(test.durationMinutes * 60);
    setIsTestSubmitted(false);
    setShowSubmitModal(false);
  };

  const handleSelectOption = (questionId: number, optionIdx: number) => {
    if (isTestSubmitted) return;
    setUserAnswers((prev) => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleToggleFlag = (questionId: number) => {
    setFlaggedQuestions((prev) => {
      const next = new Set(prev);
      if (next.has(questionId)) {
        next.delete(questionId);
      } else {
        next.add(questionId);
      }
      return next;
    });
  };

  const handleClearAnswer = (questionId: number) => {
    setUserAnswers((prev) => {
      const next = { ...prev };
      delete next[questionId];
      return next;
    });
  };

  // Generate Test from Notes Simulation
  const handleGenerateFromNotes = () => {
    if (!notesInput.trim()) return;

    setIsGenerating(true);
    setGenerationProgress(15);

    const interval = setInterval(() => {
      setGenerationProgress((p) => {
        if (p >= 90) {
          clearInterval(interval);
          return 90;
        }
        return p + 25;
      });
    }, 300);

    setTimeout(() => {
      clearInterval(interval);
      setGenerationProgress(100);

      // Construct a generated mock test from notes
      const isBns = notesInput.toLowerCase().includes('bns') || notesInput.toLowerCase().includes('murder');
      const isSra = notesInput.toLowerCase().includes('specific relief') || notesInput.toLowerCase().includes('contract');

      let generatedQuestions: Question[] = [];

      if (isBns) {
        generatedQuestions = [
          {
            id: 1,
            question: 'According to your notes on Section 103(2) BNS 2023, what is the prerequisite numerical requirement of actors to constitute the offence of mob lynching?',
            options: [
              'Two or more persons',
              'Three or more persons',
              'Five or more persons acting in concert',
              'Ten or more persons with a common intention'
            ],
            correctIndex: 2,
            statuteRef: 'Section 103(2) Bharatiya Nyaya Sanhita 2023',
            explanation: 'Your notes explicitly outline that Section 103(2) applies when murder is committed by a group of five or more persons on protected identity grounds.',
            topic: notesSubject
          },
          {
            id: 2,
            question: 'Under the Bharatiya Nyaya Sanhita, 2023, which provision replaces Section 300 of the Indian Penal Code, 1860 for defining Murder?',
            options: [
              'Section 100 BNS',
              'Section 101 BNS',
              'Section 103 BNS',
              'Section 107 BNS'
            ],
            correctIndex: 1,
            statuteRef: 'Section 101 BNS 2023',
            explanation: 'Section 101 BNS sets out the definition of murder and preserves the five general exceptions, while Section 100 defines culpable homicide.',
            topic: notesSubject
          },
          {
            id: 3,
            question: 'Which new standalone offence categories have been codified under Sections 111 and 113 of the BNS 2023 as documented in your notes?',
            options: [
              'Corporate Frauds and Tax Evasion',
              'Organised Crime and Terrorist Acts',
              'Cyber Defamation and Electronic Espionage',
              'Contempt of Subordinate Courts'
            ],
            correctIndex: 1,
            statuteRef: 'Sections 111 & 113 BNS 2023',
            explanation: 'Sections 111 and 113 introduce substantive definitions and severe punishments for Organised Crime and Terrorist Acts under the general penal code.',
            topic: notesSubject
          },
          {
            id: 4,
            question: 'What is the statutory penalty prescribed under Section 103(1) of the BNS 2023 for the offence of murder?',
            options: [
              'Death or imprisonment for life, and liability to fine',
              'Imprisonment not exceeding 14 years',
              'Rigorous imprisonment for 20 years without remission',
              'Life imprisonment only, with death penalty eliminated'
            ],
            correctIndex: 0,
            statuteRef: 'Section 103(1) BNS 2023',
            explanation: 'The sentence options remain death or imprisonment for life, with fine being mandatory.',
            topic: notesSubject
          },
          {
            id: 5,
            question: 'In the distinction between Culpable Homicide (Section 100 BNS) and Murder (Section 101 BNS), what is the key determinative factor in mens rea?',
            options: [
              'The financial motive of the accused',
              'The degree of probability of causing death (knowledge vs imminent dangerous certainty)',
              'Whether the weapon was purchased within 24 hours',
              'The presence of a medical doctor at the scene'
            ],
            correctIndex: 1,
            statuteRef: 'Sections 100 & 101 BNS 2023',
            explanation: 'As settled in Reg v. Govinda and preserved in BNS, the difference hinges on the degree of certainty of consequence.',
            topic: notesSubject
          }
        ];
      } else if (isSra) {
        generatedQuestions = [
          {
            id: 1,
            question: 'Post the 2018 amendment to the Specific Relief Act 1963, what is the character of specific performance under Section 10?',
            options: [
              'Entirely discretionary based on judge equity',
              'Mandatory statutory remedy subject only to limited exceptions in Sections 11(2), 14, and 16',
              'Restricted only to contracts involving government entities',
              'Available only after damages are proven inadequate in arbitration'
            ],
            correctIndex: 1,
            statuteRef: 'Section 10 Specific Relief Act 1963',
            explanation: 'The 2018 Amendment transformed specific performance from a discretionary remedy into a mandatory statutory entitlement.',
            topic: notesSubject
          },
          {
            id: 2,
            question: 'Under Section 20A of the Specific Relief Act 1963, what statutory restriction is placed on courts regarding infrastructure projects?',
            options: [
              'Courts cannot award damages exceeding 1 Crore',
              'No injunction shall be granted if it causes impediment or delay in project progress',
              'Only the Supreme Court has original jurisdiction',
              'Injunctions can only be granted ex-parte without notice'
            ],
            correctIndex: 1,
            statuteRef: 'Section 20A Specific Relief Act 1963',
            explanation: 'Section 20A bars courts from issuing injunctions that impede or delay infrastructure projects listed in the Schedule.',
            topic: notesSubject
          },
          {
            id: 3,
            question: 'Under Section 14A of the Specific Relief Act, what specific power is conferred upon the Court during adjudication?',
            options: [
              'Power to engage independent technical experts to assist the Court',
              'Power to confiscate contractor equipment',
              'Power to unilaterally reform the agreed contract price',
              'Power to substitute arbitration without consent'
            ],
            correctIndex: 0,
            statuteRef: 'Section 14A Specific Relief Act 1963',
            explanation: 'Section 14A allows the court to engage one or more experts to report on specific issues requiring technical proficiency.',
            topic: notesSubject
          },
          {
            id: 4,
            question: 'Under Section 39 of the Specific Relief Act 1963, what condition must be satisfied to obtain a mandatory injunction?',
            options: [
              'Prevention of the breach of an obligation where the court is capable of enforcing the required performance',
              'Absence of any written contract between the disputing parties',
              'Registration of criminal complaint with local police',
              'Deposit of 50% security amount in court registry'
            ],
            correctIndex: 0,
            statuteRef: 'Section 39 Specific Relief Act 1963',
            explanation: 'Mandatory injunctions compel the performance of necessary acts to prevent breach of obligations.',
            topic: notesSubject
          },
          {
            id: 5,
            question: 'Which section of the Specific Relief Act defines contracts not specifically enforceable?',
            options: [
              'Section 12',
              'Section 14',
              'Section 19',
              'Section 24'
            ],
            correctIndex: 1,
            statuteRef: 'Section 14 Specific Relief Act 1963',
            explanation: 'Section 14 enumerates contracts that cannot be specifically enforced (e.g. personal service, determinable contracts).',
            topic: notesSubject
          }
        ];
      } else {
        // Default Constitutional Law Notes
        generatedQuestions = [
          {
            id: 1,
            question: 'Based on your lecture notes, which landmark decision overruled A.K. Gopalan (1950) by reading substantive fairness into "procedure established by law"?',
            options: [
              'K.S. Puttaswamy v. Union of India (2017)',
              'Maneka Gandhi v. Union of India (1978)',
              'Minerva Mills v. Union of India (1980)',
              'Shankari Prasad v. Union of India (1951)'
            ],
            correctIndex: 1,
            statuteRef: 'Article 21; Maneka Gandhi (1978) 1 SCC 248',
            explanation: 'Your notes note that Maneka Gandhi established that procedures depriving personal liberty must be just, fair, and reasonable, establishing the Golden Triangle.',
            topic: notesSubject
          },
          {
            id: 2,
            question: 'Which articles of the Indian Constitution comprise the celebrated "Golden Triangle" recognized in fundamental rights jurisprudence?',
            options: [
              'Articles 12, 13, and 14',
              'Articles 14, 19, and 21',
              'Articles 21, 22, and 23',
              'Articles 32, 226, and 136'
            ],
            correctIndex: 1,
            statuteRef: 'Articles 14, 19, and 21',
            explanation: 'Articles 14 (Equality), 19 (Freedoms), and 21 (Life & Liberty) must be read inter-connectedly, so that a law restricting liberty must satisfy tests under all three.',
            topic: notesSubject
          },
          {
            id: 3,
            question: 'In K.S. Puttaswamy v. Union of India (2017), how many judges on the Constitution Bench unanimously affirmed the Right to Privacy as a fundamental right?',
            options: [
              '5 Judges',
              '7 Judges',
              '9 Judges',
              '11 Judges'
            ],
            correctIndex: 2,
            statuteRef: 'Puttaswamy (2017) 10 SCC 1; Article 21',
            explanation: 'A 9-judge Constitution Bench unanimously affirmed that privacy is an intrinsic part of life and personal liberty under Article 21.',
            topic: notesSubject
          },
          {
            id: 4,
            question: 'Under the Proportionality Test established in your notes, what are the four mandatory prongs for state action restricting Article 21?',
            options: [
              'Legitimate goal, rational connection, least intrusive necessity, and fair balance',
              'Police complaint, magistrate summons, bail rejection, and chargesheet',
              'Cabinet approval, parliamentary debate, gazette notification, and judicial nod',
              'Public interest, financial compensation, statutory limitation, and administrative review'
            ],
            correctIndex: 0,
            statuteRef: 'Article 21 & Modern Proportionality Doctrine',
            explanation: 'The four-pronged proportionality test requires: (1) Legality & legitimate goal, (2) Rational nexus, (3) Necessity/least intrusive, (4) Proportionality in strict sense.',
            topic: notesSubject
          },
          {
            id: 5,
            question: 'Under Article 21, can a citizen be deprived of their life or personal liberty by an administrative executive order without backing of an enacted statute?',
            options: [
              'Yes, under executive discretion during emergencies',
              'No, "procedure established by law" strictly mandates a valid, enacted legislative act',
              'Yes, if approved by the District Magistrate',
              'Yes, in preliminary investigation stages'
            ],
            correctIndex: 1,
            statuteRef: 'Article 21 & Bishan Das v. State of Punjab',
            explanation: 'Deprivation of liberty requires an enacted valid law; executive circulars or orders without statutory backing fail the threshold of Article 21.',
            topic: notesSubject
          }
        ];
      }

      const newTest: MockTest = {
        id: `custom-notes-${Date.now()}`,
        title: `AI Custom Drill: ${notesSubject}`,
        category: 'custom',
        categoryLabel: 'Custom AI Drill',
        subject: notesSubject,
        description: `Dynamically generated from your personalized revision notes containing ${generatedQuestions.length} conceptual and application-oriented questions.`,
        questionsCount: generatedQuestions.length,
        durationMinutes: 10,
        difficulty: difficultyLevel,
        questions: generatedQuestions.slice(0, questionCount)
      };

      setIsGenerating(false);
      handleStartTest(newTest);
    }, 1500);
  };

  // Score calculations
  const calculateScore = () => {
    if (!activeTest) return { score: 0, total: 0, percentage: 0 };
    let correctCount = 0;
    activeTest.questions.forEach((q) => {
      if (userAnswers[q.id] === q.correctIndex) {
        correctCount += 1;
      }
    });
    const total = activeTest.questions.length;
    const percentage = Math.round((correctCount / total) * 100);
    return { score: correctCount, total, percentage };
  };

  const scoreData = calculateScore();

  // Filter questions for review
  const getFilteredQuestions = () => {
    if (!activeTest) return [];
    if (filterResult === 'all') return activeTest.questions;
    if (filterResult === 'incorrect') {
      return activeTest.questions.filter((q) => userAnswers[q.id] !== q.correctIndex);
    }
    if (filterResult === 'flagged') {
      return activeTest.questions.filter((q) => flaggedQuestions.has(q.id));
    }
    return activeTest.questions;
  };

  const filteredQuestions = getFilteredQuestions();

  // Format time mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Filtered Premade tests
  const displayedPremadeTests = testsList.filter((t) => {
    if (selectedCategory === 'all') return true;
    return t.category === selectedCategory;
  });

  return (
    <div className="w-full flex flex-col gap-6 text-[#1E293B] font-sans antialiased">
      {/* =================================================================== */}
      {/* 1. TOP HERO & MODE SWITCHER                                         */}
      {/* =================================================================== */}
      {!activeTest && (
        <>
          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="max-w-2xl">
              <h2 className="text-2xl sm:text-3xl font-serif font-bold text-[#1E293B] tracking-tight">
                Master Legal Examinations & Bench Qualifying Drills
              </h2>
              <p className="text-xs sm:text-sm text-[#64748B] mt-2 leading-relaxed">
                Choose from our verified examination question banks or paste your personal lecture & bare act notes to instantly generate an AI-powered custom test.
              </p>
            </div>

            {/* Segmented Dual Mode Switcher */}
            <div className="flex items-center p-1.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl shadow-2xs self-start md:self-auto">
              <button
                type="button"
                onClick={() => setActiveTab('premade')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'premade'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E3A8A]'
                }`}
              >
                <BookOpen className="w-4 h-4 text-[#C59B58]" />
                <span>Premade Mock Tests</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('generator')}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer ${
                  activeTab === 'generator'
                    ? 'bg-[#1E3A8A] text-white shadow-xs'
                    : 'text-[#64748B] hover:text-[#1E3A8A]'
                }`}
              >
                <Upload className="w-4 h-4 text-[#C59B58]" />
                <span>Upload Notes & Create Test</span>
              </button>
            </div>
          </div>

          {/* ================================================================= */}
          {/* TAB 1: PREMADE MOCK TESTS LIBRARY                                 */}
          {/* ================================================================= */}
          {activeTab === 'premade' && (
            <div className="space-y-6">
              {/* Category Filter Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                {[
                  { id: 'all', label: 'All Exam Drills' },
                  { id: 'judiciary', label: 'Judicial Services (DJS / PCS-J)' },
                  { id: 'aibe', label: 'All India Bar Exam (AIBE)' },
                  { id: 'moot', label: 'CLAT PG & National Moot' }
                ].map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                      selectedCategory === cat.id
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#FAF8F5]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>

              {/* Premade Test Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {displayedPremadeTests.map((test) => (
                  <div
                    key={test.id}
                    className="bg-white border border-[#EAE3D6] hover:border-[#DECDB8] rounded-2xl p-5 shadow-xs hover:shadow-sm transition flex flex-col justify-between gap-5 relative group"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2 mb-2.5">
                        <span className="px-2.5 py-1 rounded-md bg-[#FAF5EB] border border-[#DECDB8] text-[11px] font-bold text-[#8C5320]">
                          {test.categoryLabel}
                        </span>
                        <span className="text-[11px] font-semibold text-[#64748B] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-[#C59B58]" />
                          <span>{test.durationMinutes} Mins</span>
                        </span>
                      </div>

                      <h3 className="font-serif font-bold text-base text-[#1E293B] group-hover:text-[#1E3A8A] transition">
                        {test.title}
                      </h3>
                      <p className="text-xs font-semibold text-[#8C5320] mt-1">
                        {test.subject}
                      </p>
                      <p className="text-xs text-[#64748B] mt-2 line-clamp-2 leading-relaxed">
                        {test.description}
                      </p>
                    </div>

                    <div className="space-y-3 pt-3 border-t border-[#EAE3D6]">
                      <div className="flex items-center justify-between text-xs text-[#64748B]">
                        <span>{test.questionsCount} Standard MCQs</span>
                        <span className="px-2 py-0.5 rounded-md bg-[#FAF8F5] border border-[#DECDB8] text-[10px] font-bold text-[#1E3A8A]">
                          {test.difficulty}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleStartTest(test)}
                        className="w-full py-2.5 px-4 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                      >
                        <Play className="w-4 h-4 text-[#C59B58]" />
                        <span>Start Mock Drill</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ================================================================= */}
          {/* TAB 2: AI TEST GENERATOR FROM NOTES                               */}
          {/* ================================================================= */}
          {activeTab === 'generator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left 8 Cols: File Upload & Notes Input */}
              <div className="lg:col-span-8 bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs space-y-5">
                {/* Header */}
                <div className="pb-3 border-b border-[#EAE3D6]">
                  <h3 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] flex items-center gap-2">
                    <Upload className="w-5 h-5 text-[#C59B58]" />
                    <span>Upload Legal Notes & Generate Mock Test</span>
                  </h3>
                  <p className="text-xs text-[#64748B] mt-0.5">
                    Upload your lecture notes, bare acts PDF, or case summaries. Nexora AI extracts key doctrines and generates targeted mock questions.
                  </p>
                </div>

                {/* HIDDEN FILE INPUT */}
                <input
                  type="file"
                  ref={fileInputRef}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt"
                  onChange={(e) => {
                    if (e.target.files?.[0]) {
                      handleFileUpload(e.target.files[0]);
                    }
                  }}
                />

                {/* FILE UPLOAD DROPZONE */}
                <div className="space-y-4">
                  {!uploadedFile ? (
                    <>
                      {/* Drag and Drop Box */}
                      <div
                        onDragOver={(e) => {
                          e.preventDefault();
                          setIsDragging(true);
                        }}
                        onDragLeave={() => setIsDragging(false)}
                        onDrop={(e) => {
                          e.preventDefault();
                          setIsDragging(false);
                          if (e.dataTransfer.files?.[0]) {
                            handleFileUpload(e.dataTransfer.files[0]);
                          }
                        }}
                        onClick={() => fileInputRef.current?.click()}
                        className={`p-8 sm:p-10 border-2 border-dashed rounded-2xl text-center transition cursor-pointer flex flex-col items-center justify-center gap-3 ${
                          isDragging
                            ? 'border-[#1E3A8A] bg-[#FAF5EB]'
                            : 'border-[#DECDB8] bg-[#FAF8F5]/80 hover:bg-[#FAF5EB] hover:border-[#C59B58]'
                        }`}
                      >
                        <div className="w-14 h-14 rounded-2xl bg-white border border-[#DECDB8] flex items-center justify-center text-[#1E3A8A] shadow-xs">
                          <Upload className="w-7 h-7 text-[#C59B58]" />
                        </div>

                        <div className="space-y-1">
                          <h4 className="font-serif font-bold text-base text-[#1E293B]">
                            Drag & Drop your legal notes document here
                          </h4>
                          <p className="text-xs text-[#64748B]">
                            Supports <strong className="text-[#1E293B]">PDF (.pdf)</strong>, <strong className="text-[#1E293B]">Word (.docx)</strong>, or <strong className="text-[#1E293B]">Text (.txt)</strong> up to 25 MB
                          </p>
                        </div>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            fileInputRef.current?.click();
                          }}
                          className="mt-2 px-5 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          Browse Files from Device
                        </button>
                      </div>
                    </>
                  ) : (
                      <>
                        {/* Uploaded File Details Card */}
                        <div className="p-4 bg-[#FAF5EB] border border-[#DECDB8] rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex items-center gap-3.5">
                            <div className="w-12 h-12 rounded-xl bg-white border border-[#DECDB8] flex items-center justify-center font-bold text-xs shadow-xs text-[#1E3A8A]">
                              <FileText className="w-6 h-6 text-[#C59B58]" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-serif font-bold text-sm text-[#1E293B]">
                                  {uploadedFile.name}
                                </span>
                                <span className="px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-[10px] font-bold flex items-center gap-1">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>Parsed & Ready</span>
                                </span>
                              </div>
                              <p className="text-xs text-[#64748B] mt-0.5">
                                {uploadedFile.size} · {uploadedFile.pages} Pages Document · Detected Subject: <strong className="text-[#1E3A8A]">{notesSubject}</strong>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-start sm:self-auto">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="px-3 py-1.5 rounded-lg border border-[#DECDB8] bg-white hover:bg-[#FAF8F5] text-xs font-semibold text-[#1E3A8A] transition cursor-pointer"
                            >
                              Replace File
                            </button>
                            <button
                              type="button"
                              onClick={handleRemoveFile}
                              className="p-1.5 rounded-lg border border-[#DECDB8] bg-white hover:bg-rose-50 text-rose-700 transition cursor-pointer"
                              title="Remove File"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {/* Extracted Legal Concepts Preview */}
                        {uploadedFile.extractedPoints && (
                          <div className="p-4 bg-white border border-[#DECDB8] rounded-xl space-y-2 text-xs">
                            <span className="font-bold text-[#8C5320] block uppercase tracking-wider text-[11px]">
                              Extracted Legal Ratios & Doctrines:
                            </span>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#334155]">
                              {uploadedFile.extractedPoints.map((pt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  <span>{pt}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>

                {/* Bottom Action Bar */}
                <div className="flex items-center justify-end pt-3 border-t border-[#EAE3D6]">
                  <button
                    type="button"
                    disabled={!notesInput.trim() || isGenerating}
                    onClick={handleGenerateFromNotes}
                    className="w-full sm:w-auto px-6 py-3 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-xs disabled:opacity-50 cursor-pointer"
                  >
                    {isGenerating ? (
                      <>
                        <Sparkles className="w-4 h-4 animate-spin text-[#C59B58]" />
                        <span>Generating Mock Test ({generationProgress}%)...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#C59B58]" />
                        <span>Generate AI Test from {uploadedFile ? 'Document' : 'Notes'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right 4 Cols: Configuration Parameters */}
              <div className="lg:col-span-4 bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs space-y-5">
                <h4 className="font-serif font-bold text-sm text-[#1E293B] flex items-center gap-2 pb-2 border-b border-[#EAE3D6]">
                  <Sliders className="w-4 h-4 text-[#C59B58]" />
                  <span>Test Parameters & Configuration</span>
                </h4>

                {/* Subject Domain */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#475569] block">Legal Subject / Domain</label>
                  <select
                    value={notesSubject}
                    onChange={(e) => setNotesSubject(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs font-semibold text-[#1E293B] focus:outline-none focus:border-[#1E3A8A]"
                  >
                    <option value="Constitutional Law">Constitutional Law & Writs</option>
                    <option value="Criminal Law (BNS 2023)">Criminal Law (BNS & BNSS 2023)</option>
                    <option value="Civil Procedure & Specific Relief">Civil Procedure & Specific Relief</option>
                    <option value="Evidence Law (BSA 2023)">Law of Evidence (BSA 2023)</option>
                    <option value="Corporate & Contract Law">Corporate & Contract Law</option>
                    <option value="Professional Ethics">Advocate Professional Ethics</option>
                  </select>
                </div>

                {/* Number of Questions */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#475569] block">Number of Questions</label>
                  <div className="grid grid-cols-3 gap-2">
                    {[5, 10, 15].map((cnt) => (
                      <button
                        key={cnt}
                        type="button"
                        onClick={() => setQuestionCount(cnt)}
                        className={`py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
                          questionCount === cnt
                            ? 'bg-[#1E3A8A] text-white border-[#1E3A8A] shadow-xs'
                            : 'bg-[#FAF8F5] border-[#DECDB8] text-[#64748B] hover:text-[#1E293B]'
                        }`}
                      >
                        {cnt} Questions
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Standard */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#475569] block">Difficulty Level</label>
                  <div className="grid grid-cols-1 gap-2">
                    {(['Foundation', 'Preliminary', 'Mains / Advanced'] as const).map((diff) => (
                      <button
                        key={diff}
                        type="button"
                        onClick={() => setDifficultyLevel(diff)}
                        className={`p-2.5 rounded-xl text-xs font-bold text-left transition cursor-pointer border flex items-center justify-between ${
                          difficultyLevel === diff
                            ? 'bg-[#FAF5EB] border-[#DECDB8] text-[#8C5320] shadow-xs'
                            : 'bg-white border-[#EAE3D6] text-[#64748B] hover:bg-[#FAF8F5]'
                        }`}
                      >
                        <span>{diff} Standard</span>
                        {difficultyLevel === diff && <Check className="w-4 h-4 text-[#8C5320]" />}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* =================================================================== */}
      {/* 2. ACTIVE TEST RUNNER INTERFACE                                     */}
      {/* =================================================================== */}
      {activeTest && !isTestSubmitted && (
        <div className="bg-white border border-[#EAE3D6] rounded-2xl shadow-xs overflow-hidden flex flex-col">
          {/* Test Runner Top Control Bar */}
          <div className="p-4 sm:p-5 bg-[#FAF8F5] border-b border-[#EAE3D6] flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#1E3A8A] text-white flex items-center justify-center font-bold shadow-xs">
                <FileText className="w-5 h-5 text-[#C59B58]" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#FAF5EB] border border-[#DECDB8] text-[#8C5320]">
                    {activeTest.categoryLabel}
                  </span>
                  <span className="text-xs text-[#64748B] font-semibold">
                    {activeTest.subject}
                  </span>
                </div>
                <h3 className="font-serif font-bold text-base sm:text-lg text-[#1E293B] mt-0.5">
                  {activeTest.title}
                </h3>
              </div>
            </div>

            {/* Timer and Action Controls */}
            <div className="flex items-center gap-3">
              {/* Countdown Timer */}
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs sm:text-sm font-bold shadow-2xs ${
                remainingSeconds < 120
                  ? 'bg-rose-50 border-rose-300 text-rose-800 animate-pulse'
                  : 'bg-white border-[#DECDB8] text-[#1E3A8A]'
              }`}>
                <Clock className="w-4 h-4 text-[#C59B58]" />
                <span>Time Remaining: {formatTime(remainingSeconds)}</span>
              </div>

              {/* Submit Button */}
              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition shadow-xs cursor-pointer flex items-center gap-1.5"
              >
                <FileCheck2 className="w-4 h-4" />
                <span>Submit Test</span>
              </button>
            </div>
          </div>

          {/* Test Body: Question Content (Left) & Question Palette (Right) */}
          <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Left 8 Cols: Question Display & Options */}
            <div className="lg:col-span-8 flex flex-col gap-5">
              {/* Progress and Question Meta */}
              <div className="flex items-center justify-between pb-3 border-b border-[#EAE3D6]">
                <span className="text-xs font-bold text-[#1E3A8A]">
                  Question {currentQuestionIndex + 1} of {activeTest.questions.length}
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleToggleFlag(activeTest.questions[currentQuestionIndex].id)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer border ${
                      flaggedQuestions.has(activeTest.questions[currentQuestionIndex].id)
                        ? 'bg-amber-100 border-amber-300 text-amber-900'
                        : 'bg-[#FAF8F5] border-[#DECDB8] text-[#64748B] hover:text-[#1E293B]'
                    }`}
                  >
                    <Bookmark className="w-3.5 h-3.5" />
                    <span>
                      {flaggedQuestions.has(activeTest.questions[currentQuestionIndex].id)
                        ? 'Flagged for Review'
                        : 'Flag for Review'}
                    </span>
                  </button>

                  {userAnswers[activeTest.questions[currentQuestionIndex].id] !== undefined && (
                    <button
                      type="button"
                      onClick={() => handleClearAnswer(activeTest.questions[currentQuestionIndex].id)}
                      className="px-2.5 py-1.5 rounded-lg text-xs font-semibold text-[#64748B] hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>

              {/* Question Text */}
              <div className="p-4 sm:p-5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8C5320]">
                    {activeTest.questions[currentQuestionIndex].topic || activeTest.subject}
                  </span>
                </div>
                <h4 className="font-serif text-base sm:text-lg text-[#1E293B] leading-relaxed font-medium">
                  {activeTest.questions[currentQuestionIndex].question}
                </h4>
              </div>

              {/* Options List */}
              <div className="space-y-3">
                {activeTest.questions[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = userAnswers[activeTest.questions[currentQuestionIndex].id] === idx;
                  const optionLetters = ['A', 'B', 'C', 'D'];
                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSelectOption(activeTest.questions[currentQuestionIndex].id, idx)}
                      className={`w-full p-4 rounded-xl border text-left transition flex items-start gap-3 cursor-pointer ${
                        isSelected
                          ? 'bg-[#FAF5EB] border-[#1E3A8A] text-[#1E293B] shadow-2xs'
                          : 'bg-white border-[#DECDB8] text-[#475569] hover:bg-[#FAF8F5]'
                      }`}
                    >
                      <div
                        className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0 transition ${
                          isSelected
                            ? 'bg-[#1E3A8A] text-white'
                            : 'bg-[#FAF8F5] border border-[#DECDB8] text-[#64748B]'
                        }`}
                      >
                        {optionLetters[idx]}
                      </div>
                      <span className="text-xs sm:text-sm font-medium leading-relaxed pt-0.5">
                        {option}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Bottom Nav: Previous / Next */}
              <div className="flex items-center justify-between pt-4 border-t border-[#EAE3D6]">
                <button
                  type="button"
                  disabled={currentQuestionIndex === 0}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))}
                  className="px-4 py-2 rounded-xl border border-[#DECDB8] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#475569] transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="text-xs text-[#64748B]">
                  {Object.keys(userAnswers).length} of {activeTest.questions.length} Answered
                </div>

                <button
                  type="button"
                  disabled={currentQuestionIndex === activeTest.questions.length - 1}
                  onClick={() => setCurrentQuestionIndex((prev) => Math.min(activeTest.questions.length - 1, prev + 1))}
                  className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition disabled:opacity-40 flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <span>Next</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Right 4 Cols: Question Palette & Legend */}
            <div className="lg:col-span-4 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl p-5 space-y-5">
              <div>
                <h4 className="font-serif font-bold text-sm text-[#1E293B]">
                  Question Palette
                </h4>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Click any number to jump directly to that question.
                </p>
              </div>

              {/* Question Circles Grid */}
              <div className="grid grid-cols-5 gap-2.5">
                {activeTest.questions.map((q, idx) => {
                  const isAnswered = userAnswers[q.id] !== undefined;
                  const isFlagged = flaggedQuestions.has(q.id);
                  const isCurrent = currentQuestionIndex === idx;

                  let badgeStyle = 'bg-white border-[#DECDB8] text-[#64748B]';
                  if (isCurrent) {
                    badgeStyle = 'ring-2 ring-[#1E3A8A] font-bold';
                  }
                  if (isAnswered) {
                    badgeStyle = 'bg-emerald-600 text-white border-emerald-600 font-bold';
                  } else if (isFlagged) {
                    badgeStyle = 'bg-amber-400 text-amber-950 border-amber-500 font-bold';
                  }

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={`h-9 rounded-xl border text-xs flex items-center justify-center transition cursor-pointer shadow-2xs ${badgeStyle}`}
                    >
                      {idx + 1}
                    </button>
                  );
                })}
              </div>

              {/* Status Legend */}
              <div className="pt-3 border-t border-[#DECDB8] space-y-2 text-xs text-[#64748B]">
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-emerald-600 inline-block"></span>
                  <span>Answered ({Object.keys(userAnswers).length})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-amber-400 inline-block"></span>
                  <span>Flagged for Review ({flaggedQuestions.size})</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded bg-white border border-[#DECDB8] inline-block"></span>
                  <span>Unvisited ({activeTest.questions.length - Object.keys(userAnswers).length})</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowSubmitModal(true)}
                className="w-full py-2.5 rounded-xl bg-[#1E3A8A] text-white text-xs font-bold hover:bg-[#1E3A8A]/90 transition shadow-xs cursor-pointer"
              >
                Finish & View Results
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. CONFIRM SUBMISSION MODAL                                         */}
      {/* =================================================================== */}
      {showSubmitModal && activeTest && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-[#DECDB8] rounded-2xl p-6 max-w-md w-full shadow-lg space-y-4 animate-in fade-in duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FAF5EB] border border-[#DECDB8] text-[#8C5320] flex items-center justify-center">
                <FileCheck2 className="w-5 h-5 text-[#C59B58]" />
              </div>
              <div>
                <h4 className="font-serif font-bold text-base text-[#1E293B]">Submit Mock Examination?</h4>
                <p className="text-xs text-[#64748B]">Review your progress before final evaluation.</p>
              </div>
            </div>

            <div className="p-3.5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-[#64748B]">
                <span>Total Questions:</span>
                <span className="font-bold text-[#1E293B]">{activeTest.questions.length}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Answered:</span>
                <span className="font-bold text-emerald-700">{Object.keys(userAnswers).length}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Marked for Review:</span>
                <span className="font-bold text-amber-700">{flaggedQuestions.size}</span>
              </div>
              <div className="flex justify-between text-[#64748B]">
                <span>Unattempted:</span>
                <span className="font-bold text-rose-700">
                  {activeTest.questions.length - Object.keys(userAnswers).length}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowSubmitModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-[#DECDB8] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#64748B] transition cursor-pointer"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={handleAutoSubmit}
                className="flex-1 py-2.5 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition shadow-xs cursor-pointer"
              >
                Yes, Submit Evaluation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. RESULTS & PERFORMANCE SCORECARD                                  */}
      {/* =================================================================== */}
      {activeTest && isTestSubmitted && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Scorecard Summary Banner */}
          <div className="bg-white border border-[#EAE3D6] rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#FAF5EB] border border-[#DECDB8] text-xs font-bold text-[#8C5320]">
                <Award className="w-4 h-4 text-[#C59B58]" />
                <span>Assessment Completed</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-[#1E293B]">
                Performance Scorecard: {activeTest.title}
              </h2>
              <p className="text-xs text-[#64748B]">
                Detailed question analysis with statutory provisions, judicial holdings, and rationale.
              </p>
            </div>

            {/* Metrics Row */}
            <div className="flex items-center gap-4 bg-[#FAF8F5] border border-[#DECDB8] rounded-2xl p-4 shadow-2xs">
              <div className="text-center px-3 border-r border-[#DECDB8]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Score</span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#1E3A8A]">
                  {scoreData.score} / {scoreData.total}
                </span>
              </div>
              <div className="text-center px-3 border-r border-[#DECDB8]">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Accuracy</span>
                <span className={`font-serif text-xl sm:text-2xl font-bold ${
                  scoreData.percentage >= 70 ? 'text-emerald-700' : 'text-amber-700'
                }`}>
                  {scoreData.percentage}%
                </span>
              </div>
              <div className="text-center px-3">
                <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider block">Est. Rank</span>
                <span className="font-serif text-xl sm:text-2xl font-bold text-[#8C5320]">
                  {scoreData.percentage >= 80 ? 'Top 5%' : scoreData.percentage >= 60 ? 'Top 25%' : 'Needs Revision'}
                </span>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              {[
                { id: 'all', label: `All Questions (${activeTest.questions.length})` },
                { id: 'incorrect', label: `Incorrect (${scoreData.total - scoreData.score})` },
                { id: 'flagged', label: `Flagged (${flaggedQuestions.size})` }
              ].map((f) => (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setFilterResult(f.id as any)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterResult === f.id
                      ? 'bg-[#1E3A8A] text-white shadow-xs'
                      : 'bg-white border border-[#DECDB8] text-[#64748B] hover:text-[#1E3A8A]'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => handleStartTest(activeTest)}
                className="px-4 py-2 rounded-xl border border-[#DECDB8] bg-white hover:bg-[#FAF8F5] text-xs font-bold text-[#1E3A8A] transition flex items-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Drill</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTest(null);
                  setActiveTab('premade');
                }}
                className="px-4 py-2 rounded-xl bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <span>Back to Exam Library</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#C59B58]" />
              </button>
            </div>
          </div>

          {/* Question Breakdown Cards */}
          <div className="space-y-4">
            {filteredQuestions.map((q, qIndex) => {
              const userAnswerIdx = userAnswers[q.id];
              const isCorrect = userAnswerIdx === q.correctIndex;
              const isUnattempted = userAnswerIdx === undefined;
              const optionLetters = ['A', 'B', 'C', 'D'];

              return (
                <div
                  key={q.id}
                  className={`bg-white border rounded-2xl p-5 shadow-xs space-y-4 ${
                    isCorrect
                      ? 'border-emerald-200'
                      : isUnattempted
                      ? 'border-amber-200'
                      : 'border-rose-200'
                  }`}
                >
                  {/* Question Header */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-[#EAE3D6]">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-[#1E3A8A]">
                        Question {qIndex + 1}
                      </span>
                      <span className="text-xs text-[#64748B]">· {q.topic || activeTest.subject}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCorrect ? (
                        <span className="px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Correct (+2 Marks)</span>
                        </span>
                      ) : isUnattempted ? (
                        <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold flex items-center gap-1">
                          <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                          <span>Unattempted (0 Marks)</span>
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-md bg-rose-50 border border-rose-300 text-rose-800 text-xs font-bold flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5 text-rose-600" />
                          <span>Incorrect (-0.5 Marks)</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Question Text */}
                  <p className="font-serif text-sm sm:text-base text-[#1E293B] font-medium leading-relaxed">
                    {q.question}
                  </p>

                  {/* Options Evaluation */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {q.options.map((opt, optIdx) => {
                      const isThisCorrect = optIdx === q.correctIndex;
                      const isThisSelected = userAnswerIdx === optIdx;

                      let optStyle = 'bg-[#FAF8F5] border-[#DECDB8] text-[#475569]';
                      if (isThisCorrect) {
                        optStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-semibold ring-1 ring-emerald-400';
                      } else if (isThisSelected && !isThisCorrect) {
                        optStyle = 'bg-rose-50 border-rose-300 text-rose-950 font-semibold';
                      }

                      return (
                        <div
                          key={optIdx}
                          className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 leading-relaxed ${optStyle}`}
                        >
                          <span className={`w-5 h-5 rounded-md flex items-center justify-center font-bold text-[11px] flex-shrink-0 ${
                            isThisCorrect
                              ? 'bg-emerald-600 text-white'
                              : isThisSelected
                              ? 'bg-rose-600 text-white'
                              : 'bg-white border border-[#DECDB8] text-[#64748B]'
                          }`}>
                            {optionLetters[optIdx]}
                          </span>
                          <span className="pt-0.5">{opt}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Authoritative Ratio & Explanation */}
                  <div className="p-4 bg-[#FAF5EB] border border-[#DECDB8] rounded-xl space-y-1.5 text-xs text-[#1E293B]">
                    <div className="flex items-center gap-1.5 text-[#8C5320] font-bold">
                      <BookOpen className="w-4 h-4 text-[#C59B58]" />
                      <span>Statutory Ratio Decidendi & Authority:</span>
                    </div>
                    <p className="text-[#64748B] leading-relaxed">
                      {q.explanation}
                    </p>
                    <div className="pt-1 text-[11px] font-semibold text-[#8C5320]">
                      Statutory Reference: {q.statuteRef}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
