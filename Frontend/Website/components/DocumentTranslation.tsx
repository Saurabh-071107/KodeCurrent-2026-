'use client';

import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import Image from 'next/image';
import {
  ChevronDown,
  FileText,
  Languages,
  Upload,
  Clock,
  Sparkles,
  ArrowRight,
  Download,
  X,
  FileCheck,
  Settings,
  Copy,
  Check,
  Eye,
  RefreshCw
} from 'lucide-react';

export type UserRoleType = 'advocate' | 'firm' | 'citizen' | 'student';

export interface TranslationJob {
  id: string;
  fileName: string;
  fileSize: string;
  sourceLang: string;
  targetLang: string;
  status: 'completed' | 'processing' | 'failed';
  date: string;
  wordCount: number;
  originalClauses: string[];
  translatedClauses: string[];
}

export const INDIAN_LANGUAGES = [
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'or', name: 'Odia', native: 'ଓଡ଼ିଆ' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
  { code: 'as', name: 'Assamese', native: 'অসমীয়া' }
];

const DEFAULT_RENT_AGREEMENT: TranslationJob = {
  id: 'job-sample-1',
  fileName: 'Rent_Agreement.pdf',
  fileSize: '245 KB',
  sourceLang: 'English',
  targetLang: 'Hindi',
  status: 'completed',
  date: 'Today · Just now',
  wordCount: 420,
  originalClauses: [
    'RESIDENTIAL LEASE AND TENANCY AGREEMENT',
    'This Residential Tenancy Agreement is executed on this 14th day of October, 2026 at Mumbai, Maharashtra, by and between the Landlord and the Tenant.',
    '1. DEMISED PREMISES: The Landlord hereby lets out and the Tenant hereby takes on lease the residential premises situated at Flat No. 402, Sunshine Heights, Mumbai (hereinafter referred to as the "Premises").',
    '2. DURATION & TENURE: The tenure of this tenancy shall be for an initial period of 11 (Eleven) consecutive months commencing from 1st November 2026.',
    '3. MONTHLY RENT: The Tenant agrees to pay a monthly rent of ₹ 35,000/- (Thirty Five Thousand Only), payable in advance on or before the 5th day of every calendar month.',
    '4. SECURITY DEPOSIT: The Tenant has deposited an interest-free refundable security deposit of ₹ 1,00,000/- (One Lakh Only), to be refunded within 7 days of peaceful handover of vacant possession.',
    '5. GOVERNING LAW: This agreement shall be governed and interpreted in accordance with the Transfer of Property Act, 1882 and Maharashtra Rent Control Act, 1999.'
  ],
  translatedClauses: [
    'आवासीय पट्टा एवं किरायेदारी अनुबन्ध',
    'यह आवासीय किरायेदारी अनुबन्ध आज दिनांक 14 अक्टूबर 2026 को मुम्बई, महाराष्ट्र में मकान मालिक तथा किरायेदार के मध्य निष्पादित किया गया है।',
    '1. पट्टे पर दी गई सम्पत्ति: मकान मालिक इसके द्वारा फ्लैट संख्या 402, सनशाइन हाइट्स, मुम्बई स्थित आवासीय परिसर (जिसे आगे "परिसर" कहा गया है) को किरायेदार को पट्टे पर देता है।',
    '2. अवधि एवं कार्यकाल: इस किरायेदारी की अवधि 1 नवम्बर 2026 से प्रारम्भ होकर प्रारम्भिक 11 (ग्यारह) निरन्तर महीनों के लिए होगी।',
    '3. मासिक किराया: किरायेदार प्रत्येक कलेण्डर माह की 5 तारीख को या उससे पूर्व ₹ 35,000/- (पैंतीस हजार रुपये मात्र) का मासिक किराया अग्रिम रूप से भुगतान करने हेतु सहमत है।',
    '4. प्रतिभूति धरोहर राशि: किरायेदार ने ₹ 1,00,000/- (एक लाख रुपये मात्र) की ब्याज-मुक्त प्रतिदेय धरोहर राशि जमा की है, जिसे रिक्त आधिपत्य के शान्तिपूर्ण हस्तान्तरण के 7 दिनों के भीतर वापस किया जाएगा।',
    '5. लागू विधि एवं क्षेत्राधिकार: यह अनुबन्ध सम्पत्ति अन्तरण अधिनियम, 1882 एवं महाराष्ट्र किराया नियन्त्रण अधिनियम, 1999 के प्रावधानों के अनुसार शासित एवं व्याख्यायित होगा।'
  ]
};

interface DocumentTranslationProps {
  initialUserName?: string;
  initialUserRole?: string;
  defaultRole?: UserRoleType;
}

export default function DocumentTranslation({
  initialUserName = 'Adv. Saurabh',
  initialUserRole = 'Advocate · High Court',
  defaultRole = 'advocate'
}: DocumentTranslationProps = {}) {
  // Uploaded Document State
  const [activeFile, setActiveFile] = useState<{ name: string; size: string; raw?: File } | null>({
    name: 'Rent_Agreement.pdf',
    size: '245 KB'
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Language Selection
  const [sourceLang, setSourceLang] = useState('English');
  const [targetLang, setTargetLang] = useState('Hindi');
  const [sourcePickerOpen, setSourcePickerOpen] = useState(false);
  const [targetPickerOpen, setTargetPickerOpen] = useState(false);

  // Languages list state & default agreement
  const [languagesList, setLanguagesList] = useState(INDIAN_LANGUAGES);
  const [defaultAgreement, setDefaultAgreement] = useState<TranslationJob>(DEFAULT_RENT_AGREEMENT);

  // Translation Workflow Progress (Stages 1-4)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translationProgress, setTranslationProgress] = useState<{
    upload: 'completed' | 'waiting';
    processing: 'completed' | 'in_progress' | 'pending';
    translation: 'completed' | 'in_progress' | 'pending';
    rebuild: 'completed' | 'in_progress' | 'pending';
  }>({
    upload: 'waiting',
    processing: 'pending',
    translation: 'pending',
    rebuild: 'pending'
  });

  // Translation Jobs List
  const [jobs, setJobs] = useState<TranslationJob[]>([DEFAULT_RENT_AGREEMENT]);
  const [jobFilter, setJobFilter] = useState<'all' | 'completed' | 'processing'>('all');
  const [jobFilterOpen, setJobFilterOpen] = useState(false);

  // Review & Comparison Modal
  const [activeReviewJob, setActiveReviewJob] = useState<TranslationJob | null>(null);
  const [isCopied, setIsCopied] = useState(false);

  // Fetch dynamic translation data from backend
  useEffect(() => {
    const fetchTranslationData = async () => {
      try {
        const res = await api.getTranslationData();
        if (res.success && res.data) {
          if (res.data.languages && res.data.languages.length > 0) {
            setLanguagesList(res.data.languages);
          }
          if (res.data.defaultJob) {
            setDefaultAgreement(res.data.defaultJob);
            setJobs([res.data.defaultJob]);
          }
        }
      } catch (err) {
        console.error('Error fetching translation data:', err);
      }
    };
    fetchTranslationData();
  }, []);

  // File Upload Handlers
  const handleFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      setActiveFile({ name: file.name, size: sizeStr, raw: file });
      setCurrentStep(1);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const sizeStr = file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${Math.round(file.size / 1024)} KB`;
      setActiveFile({ name: file.name, size: sizeStr, raw: file });
      setCurrentStep(1);
    }
  };

  const handleRemoveFile = () => {
    setActiveFile(null);
    setCurrentStep(1);
    setTranslationProgress({
      upload: 'waiting',
      processing: 'pending',
      translation: 'pending',
      rebuild: 'pending'
    });
  };

  // Start Translation Simulation
  const handleStartTranslation = () => {
    if (!activeFile) return;

    setIsTranslating(true);
    setCurrentStep(2);
    setTranslationProgress({
      upload: 'completed',
      processing: 'in_progress',
      translation: 'pending',
      rebuild: 'pending'
    });

    // Step 2: Processing (Doc parsing & legal entity tokenization)
    setTimeout(() => {
      setTranslationProgress((prev) => ({
        ...prev,
        processing: 'completed',
        translation: 'in_progress'
      }));

      // Step 3: Neural Legal Translation
      setTimeout(() => {
        setTranslationProgress((prev) => ({
          ...prev,
          translation: 'completed',
          rebuild: 'in_progress'
        }));

        // Step 4: Formatting Rebuild
        setTimeout(() => {
          setTranslationProgress({
            upload: 'completed',
            processing: 'completed',
            translation: 'completed',
            rebuild: 'completed'
          });
          setIsTranslating(false);
          setCurrentStep(3);

          const newJob: TranslationJob = {
            id: `job-${Date.now()}`,
            fileName: activeFile.name,
            fileSize: activeFile.size,
            sourceLang,
            targetLang,
            status: 'completed',
            date: 'Today · Just now',
            wordCount: activeFile.name.toLowerCase().includes('rent') ? 420 : 350,
            originalClauses: defaultAgreement.originalClauses,
            translatedClauses: targetLang === 'Hindi' 
              ? defaultAgreement.translatedClauses 
              : defaultAgreement.translatedClauses.map(c => `[${targetLang} Legal Translation] ${c}`)
          };

          setJobs((prev) => [newJob, ...prev]);
        }, 900);
      }, 1100);
    }, 900);
  };

  // Quick Action: Download simulated file
  const handleDownload = (format: 'pdf' | 'docx', job?: TranslationJob) => {
    const jobTarget = job || (jobs.length > 0 ? jobs[0] : defaultAgreement);
    const content = jobTarget.translatedClauses.join('\n\n');
    const blob = new Blob([content], { type: format === 'pdf' ? 'application/pdf' : 'application/msword' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${jobTarget.fileName.replace(/\.[^/.]+$/, "")}_${jobTarget.targetLang}.${format}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredJobs = jobs.filter(job => {
    if (jobFilter === 'all') return true;
    return job.status === jobFilter;
  });

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-[#FAF8F5] text-[#0F172A] relative select-text font-sans pb-16">
      
      {/* ----------------------------------------------------------------------- */}
      {/* MAIN CONTAINER (Centered max width matching case tracker / drafting)     */}
      {/* ----------------------------------------------------------------------- */}
      <main className="p-3 sm:p-5 md:p-6 lg:p-7 space-y-5 sm:space-y-6 max-w-[1700px] w-full mx-auto flex-1 flex flex-col">
        
        {/* ===================================================================== */}
        {/* 1. TOP HEADER BANNER (Soft Warm Brown Card Matching Case Tracker)     */}
        {/* ===================================================================== */}
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6 p-5 sm:p-6 lg:px-8 lg:py-6 bg-[#F4ECE1] border border-[#DECDB8] rounded-2xl sm:rounded-3xl shadow-2xs overflow-hidden">
          
          {/* Left: Title + Tagline */}
          <div className="z-10 min-w-0 flex-1">
            {/* Title */}
            <h1 className="font-serif-title text-3xl sm:text-4xl lg:text-[44px] font-bold text-[#0F172A] tracking-tight leading-tight">
              Document Translation
            </h1>

            {/* Gold Underline Accent + Subtitle */}
            <div className="flex items-center gap-3 mt-2.5">
              <span className="w-10 h-[2.5px] bg-[#C59B58] rounded-full inline-block shrink-0" />
              <p className="text-sm sm:text-base text-[#475569] font-normal leading-relaxed">
                Translate legal documents with accuracy and context. Preserve legal meaning across languages.
              </p>
            </div>
          </div>

          {/* Right: Constitution of India Quote & Indian Courthouse Engraving */}
          <div className="flex items-center justify-end gap-4 sm:gap-6 self-end md:self-center shrink-0">
            {/* Quote */}
            <div className="text-right max-w-[260px] sm:max-w-xs md:max-w-sm">
              <p className="italic font-serif text-sm sm:text-base md:text-[17px] text-[#334155] leading-snug">
                &ldquo;Access to justice is strengthened when the law speaks every language.&rdquo;
              </p>
              <p className="text-xs font-bold tracking-[0.2em] text-[#8C7355] uppercase mt-1.5">
                — CONSTITUTION OF INDIA
              </p>
            </div>

            {/* Indian Courthouse Sepia Engraving Graphic (Properly proportioned) */}
            <div className="relative w-36 sm:w-48 md:w-56 lg:w-64 h-20 sm:h-24 md:h-28 shrink-0 pointer-events-none select-none">
              <Image
                src="/assets/courthouse-sepia-engraving.png"
                alt="Indian Courthouse Sepia Engraving"
                fill
                className="object-contain object-right mix-blend-multiply"
                priority
              />
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* 2. STEPPER WORKFLOW STRIP (1. Upload -> 2. Translate -> 3. Review ...) */}
        {/* ===================================================================== */}
        <div className="w-full bg-white border border-[#DECDB8] rounded-2xl p-4 sm:p-5 shadow-2xs">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 items-center">
            
            {/* Step 1: Upload */}
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                activeFile 
                  ? 'bg-[#1E3A8A] text-white shadow-xs' 
                  : 'bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355]'
              }`}>
                <Upload className="w-5 h-5" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#0F172A] truncate">1. Upload</p>
                <p className="text-xs sm:text-[13px] text-[#64748B] truncate mt-0.5">Choose your document</p>
              </div>
            </div>

            {/* Step 2: Translate */}
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                currentStep >= 2 
                  ? 'bg-[#1E3A8A] text-white shadow-xs' 
                  : 'bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355]'
              }`}>
                <Languages className="w-5 h-5" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#0F172A] truncate">2. Translate</p>
                <p className="text-xs sm:text-[13px] text-[#64748B] truncate mt-0.5">Processing and translation</p>
              </div>
            </div>

            {/* Step 3: Review */}
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                currentStep >= 3 
                  ? 'bg-[#1E3A8A] text-white shadow-xs' 
                  : 'bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355]'
              }`}>
                <FileCheck className="w-5 h-5" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#0F172A] truncate">3. Review</p>
                <p className="text-xs sm:text-[13px] text-[#64748B] truncate mt-0.5">Check and edit translation</p>
              </div>
            </div>

            {/* Step 4: Download */}
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 font-bold transition-all ${
                currentStep >= 4 
                  ? 'bg-[#1E3A8A] text-white shadow-xs' 
                  : 'bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355]'
              }`}>
                <Download className="w-5 h-5" />
              </div>
              <div className="leading-tight min-w-0">
                <p className="font-bold text-sm sm:text-base text-[#0F172A] truncate">4. Download</p>
                <p className="text-xs sm:text-[13px] text-[#64748B] truncate mt-0.5">Export final document</p>
              </div>
            </div>

          </div>
        </div>

        {/* ===================================================================== */}
        {/* 3. MAIN INTERACTION GRID: 1. Upload Document | 2. Translation Settings*/}
        {/* ===================================================================== */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6 items-stretch">
          
          {/* ------------------------------------------------------------------- */}
          {/* CARD 1: UPLOAD DOCUMENT                                             */}
          {/* ------------------------------------------------------------------- */}
          <div className="bg-white border border-[#DECDB8] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Card Title & Icon */}
              <div className="flex items-start gap-3.5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl text-[#0F172A] leading-tight">
                    1. Upload Document
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                    Upload a PDF, DOCX, or HTML file to translate.
                  </p>
                </div>
              </div>

              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleFileDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`mt-2 border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center transition-all cursor-pointer flex flex-col items-center justify-center min-h-[200px] ${
                  isDragging 
                    ? 'border-[#1E3A8A] bg-[#EFF6FF]' 
                    : 'border-[#CBD5E1] bg-[#FAF8F5] hover:bg-[#F8FAFC] hover:border-[#94A3B8]'
                }`}
              >
                {/* Upload icon circle */}
                <div className="w-13 h-13 rounded-2xl bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center font-bold mb-3 shadow-2xs">
                  <Upload className="w-6 h-6 stroke-[2.5]" />
                </div>

                <p className="font-bold text-base sm:text-lg text-[#0F172A]">
                  Drag and drop your document here
                </p>
                <p className="text-xs sm:text-sm text-slate-400 my-1">or</p>

                {/* Choose File Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    fileInputRef.current?.click();
                  }}
                  className="px-6 py-2.5 bg-[#1E3A8A] hover:bg-[#162A65] text-white text-xs sm:text-sm font-bold rounded-xl shadow-xs transition-colors flex items-center gap-2 cursor-pointer mt-1"
                >
                  <Upload className="w-4 h-4" />
                  <span>Choose File</span>
                </button>

                {/* Formats Note */}
                <p className="text-xs sm:text-[13px] text-slate-500 mt-4">
                  Supported formats: PDF, DOCX, HTML &nbsp;|&nbsp; Max size: 50 MB
                </p>

                {/* Hidden Native File Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.doc,.html,.txt"
                  onChange={handleFileInputChange}
                  className="hidden"
                />
              </div>
            </div>

            {/* Active Selected File Card (Matches Mockup with red PDF badge) */}
            {activeFile && (
              <div className="mt-4 pt-3.5 border-t border-[#F0E9DF] flex items-center justify-between gap-3 bg-[#FAF8F5] p-3.5 rounded-xl border border-[#DECDB8]">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Red PDF Icon badge */}
                  <div className="w-9 h-9 rounded-lg bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                      {activeFile.name}
                    </p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {activeFile.size}
                    </p>
                  </div>
                </div>

                {/* Remove button */}
                <button
                  type="button"
                  onClick={handleRemoveFile}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md transition-colors cursor-pointer"
                  title="Remove selected document"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* ------------------------------------------------------------------- */}
          {/* CARD 2: TRANSLATION SETTINGS & PROGRESS                             */}
          {/* ------------------------------------------------------------------- */}
          <div className="bg-white border border-[#DECDB8] rounded-2xl p-5 sm:p-6 shadow-2xs flex flex-col justify-between">
            <div>
              {/* Card Title & Icon */}
              <div className="flex items-start gap-3.5 pb-4">
                <div className="w-10 h-10 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center font-bold shadow-2xs shrink-0">
                  <Settings className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg md:text-xl text-[#0F172A] leading-tight">
                    2. Translation Settings
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                    Select source and target language and start translation.
                  </p>
                </div>
              </div>

              {/* Source & Target Language Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-2">
                
                {/* Source Language Picker */}
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Source Language
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setSourcePickerOpen(!sourcePickerOpen);
                      setTargetPickerOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-sm sm:text-base font-semibold text-[#0F172A] hover:bg-white transition-all shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Languages className="w-4 h-4 text-[#1E3A8A]" />
                      <span>{sourceLang}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {sourcePickerOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#DECDB8] rounded-2xl shadow-xl py-2 z-40 max-h-56 overflow-y-auto text-sm">
                      <div className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Choose Source Language
                      </div>
                      {languagesList.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setSourceLang(lang.name);
                            setSourcePickerOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[#FAF5EB] transition-colors cursor-pointer ${
                            sourceLang === lang.name ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                          }`}
                        >
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-xs text-slate-400">{lang.native}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Target Language Picker */}
                <div className="relative">
                  <label className="block text-xs sm:text-sm font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                    Target Language
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetPickerOpen(!targetPickerOpen);
                      setSourcePickerOpen(false);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-sm sm:text-base font-semibold text-[#0F172A] hover:bg-white transition-all shadow-2xs cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Languages className="w-4 h-4 text-[#C59B58]" />
                      <span>{targetLang}</span>
                    </div>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {targetPickerOpen && (
                    <div className="absolute left-0 right-0 mt-1.5 bg-white border border-[#DECDB8] rounded-2xl shadow-xl py-2 z-40 max-h-56 overflow-y-auto text-sm">
                      <div className="px-3.5 py-1 text-xs font-bold uppercase tracking-wider text-slate-400">
                        Choose Target Language
                      </div>
                      {languagesList.map((lang) => (
                        <button
                          key={lang.code}
                          type="button"
                          onClick={() => {
                            setTargetLang(lang.name);
                            setTargetPickerOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center justify-between hover:bg-[#FAF5EB] transition-colors cursor-pointer ${
                            targetLang === lang.name ? 'font-bold text-[#1E3A8A] bg-[#EBF2FC]' : 'text-slate-700'
                          }`}
                        >
                          <span className="font-medium">{lang.name}</span>
                          <span className="text-xs text-slate-400">{lang.native}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>

              {/* Translation Progress Stepper (Upload -> Processing -> Translation -> Rebuild) */}
              <div className="mt-6 pt-4 border-t border-[#F0E9DF]">
                <h4 className="text-xs sm:text-sm font-bold text-[#0F172A] tracking-tight mb-3">
                  Translation Progress
                </h4>

                <div className="relative flex items-center justify-between">
                  {/* Background connecting bar */}
                  <div className="absolute top-4 left-4 right-4 h-0.5 bg-[#E2E8F0] -z-0" />

                  {/* Stage 1: Upload */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      translationProgress.upload === 'completed'
                        ? 'bg-[#1E3A8A] text-white shadow-xs'
                        : 'bg-[#FAF8F5] border border-[#CBD5E1] text-slate-600'
                    }`}>
                      {translationProgress.upload === 'completed' ? <Check className="w-4 h-4" /> : '1'}
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] mt-1.5">Upload</span>
                    <span className="text-[10px] sm:text-xs text-slate-500 capitalize">
                      {translationProgress.upload}
                    </span>
                  </div>

                  {/* Stage 2: Processing */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      translationProgress.processing === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : translationProgress.processing === 'in_progress'
                        ? 'bg-[#1E3A8A] text-white animate-pulse'
                        : 'bg-[#FAF8F5] border border-[#CBD5E1] text-slate-400'
                    }`}>
                      {translationProgress.processing === 'completed' ? <Check className="w-4 h-4" /> : '2'}
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] mt-1.5">Processing</span>
                    <span className="text-[10px] sm:text-xs text-slate-500 capitalize">
                      {translationProgress.processing.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stage 3: Translation */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      translationProgress.translation === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : translationProgress.translation === 'in_progress'
                        ? 'bg-[#1E3A8A] text-white animate-pulse'
                        : 'bg-[#FAF8F5] border border-[#CBD5E1] text-slate-400'
                    }`}>
                      {translationProgress.translation === 'completed' ? <Check className="w-4 h-4" /> : '3'}
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] mt-1.5">Translation</span>
                    <span className="text-[10px] sm:text-xs text-slate-500 capitalize">
                      {translationProgress.translation.replace('_', ' ')}
                    </span>
                  </div>

                  {/* Stage 4: Rebuild */}
                  <div className="flex flex-col items-center text-center relative z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-colors ${
                      translationProgress.rebuild === 'completed'
                        ? 'bg-emerald-600 text-white'
                        : translationProgress.rebuild === 'in_progress'
                        ? 'bg-[#1E3A8A] text-white animate-pulse'
                        : 'bg-[#FAF8F5] border border-[#CBD5E1] text-slate-400'
                    }`}>
                      {translationProgress.rebuild === 'completed' ? <Check className="w-4 h-4" /> : '4'}
                    </div>
                    <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] mt-1.5">Rebuild</span>
                    <span className="text-[10px] sm:text-xs text-slate-500 capitalize">
                      {translationProgress.rebuild.replace('_', ' ')}
                    </span>
                  </div>

                </div>
              </div>
            </div>

            {/* Start Translation Button */}
            <div className="mt-6 pt-2">
              <button
                type="button"
                onClick={handleStartTranslation}
                disabled={!activeFile || isTranslating}
                className="w-full py-3.5 sm:py-4 px-6 bg-[#1E3A8A] hover:bg-[#162A65] disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm sm:text-base font-bold rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer"
              >
                {isTranslating ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Translating Legal Clauses...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-[#FDE68A]" />
                    <span>Start Translation</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* ===================================================================== */}
        {/* 4. TRANSLATION JOBS SECTION (Empty State with Antique Books Engraving) */}
        {/* ===================================================================== */}
        <div className="bg-white border border-[#DECDB8] rounded-2xl p-5 sm:p-6 shadow-2xs">
          
          {/* Header Strip with Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E9DF]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#FAF0DE] border border-[#ECD9BC] text-[#8C7355] flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-[#0F172A] leading-tight">
                  Translation Jobs ({jobs.length})
                </h3>
                <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                  Track the status of your translation jobs.
                </p>
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="relative self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setJobFilterOpen(!jobFilterOpen)}
                className="flex items-center gap-2 px-3.5 py-2 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl text-xs sm:text-sm font-semibold text-[#0F172A] hover:bg-white transition-colors cursor-pointer shadow-2xs"
              >
                <span>{jobFilter === 'all' ? 'All Jobs' : jobFilter === 'completed' ? 'Completed' : 'Processing'}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {jobFilterOpen && (
                <div className="absolute right-0 mt-1 w-40 bg-white border border-[#DECDB8] rounded-xl shadow-lg py-1.5 z-30 text-xs sm:text-sm">
                  {[
                    { id: 'all' as const, label: 'All Jobs' },
                    { id: 'completed' as const, label: 'Completed' },
                    { id: 'processing' as const, label: 'Processing' },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => {
                        setJobFilter(f.id);
                        setJobFilterOpen(false);
                      }}
                      className={`w-full text-left px-3.5 py-2 hover:bg-[#FAF5EB] transition-colors ${
                        jobFilter === f.id ? 'font-bold text-[#1E3A8A]' : 'text-slate-700'
                      }`}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Jobs List OR Empty State with Mockup Engraving */}
          {filteredJobs.length === 0 ? (
            /* EMPTY STATE: Matches user mockup with Constitution of India books */
            <div className="py-10 sm:py-14 flex flex-col md:flex-row items-center justify-center gap-6 text-center md:text-left">
              
              {/* Antique Books Engraving Illustration (Enlarged) */}
              <div className="relative w-56 sm:w-72 md:w-80 lg:w-96 h-36 sm:h-44 md:h-52 shrink-0 pointer-events-none select-none">
                <Image
                  src="/assets/antique-books-engraving.png"
                  alt="Constitution of India Antique Books Engraving"
                  fill
                  className="object-contain mix-blend-multiply"
                  priority
                />
              </div>

              {/* Empty Copy */}
              <div className="max-w-md">
                <h4 className="font-bold text-base sm:text-lg text-[#0F172A]">
                  No translation jobs yet
                </h4>
                <p className="text-sm text-[#64748B] mt-1.5 leading-relaxed">
                  Upload a document to get started. Your translation history will appear here with status and download options.
                </p>
              </div>

            </div>
          ) : (
            /* TRANSLATION JOBS TABLE / CARDS */
            <div className="mt-4 space-y-3">
              {filteredJobs.map((job) => (
                <div
                  key={job.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 p-4 sm:p-5 bg-[#FAF8F5] border border-[#DECDB8] rounded-xl hover:border-[#1E3A8A]/40 transition-colors shadow-2xs"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-red-100 border border-red-200 text-red-600 flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-sm sm:text-base font-bold text-[#0F172A] truncate">
                        {job.fileName}
                      </h4>
                      <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                        {job.sourceLang} → <span className="font-semibold text-[#1E3A8A]">{job.targetLang}</span> · {job.wordCount} words · {job.date}
                      </p>
                    </div>
                  </div>

                  {/* Actions & Status */}
                  <div className="flex items-center gap-2.5 self-end sm:self-center">
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-md uppercase">
                      {job.status}
                    </span>

                    <button
                      type="button"
                      onClick={() => setActiveReviewJob(job)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-[#CBD5E1] rounded-xl text-xs sm:text-sm font-semibold text-[#1E3A8A] hover:bg-[#EBF2FC] transition-colors shadow-2xs cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>Review</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDownload('pdf', job)}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#162A65] transition-colors shadow-2xs cursor-pointer"
                    >
                      <Download className="w-4 h-4" />
                      <span>PDF</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </main>

      {/* ======================================================================= */}
      {/* 5. REVIEW & BILINGUAL COMPARISON MODAL (Side-by-Side Legal Verification) */}
      {/* ======================================================================= */}
      {activeReviewJob && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white border border-[#DECDB8] rounded-2xl sm:rounded-3xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-[#F0E9DF] flex items-center justify-between bg-[#FAF8F5]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-[#EBF2FC] text-[#1E3A8A] flex items-center justify-center font-bold">
                  <Languages className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg text-[#0F172A] leading-tight">
                    Bilingual Legal Comparison: {activeReviewJob.fileName}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
                    {activeReviewJob.sourceLang} vs {activeReviewJob.targetLang} (Legal Meaning Preserved)
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => handleDownload('pdf', activeReviewJob)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#1E3A8A] text-white rounded-xl text-xs sm:text-sm font-semibold hover:bg-[#162A65] transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveReviewJob(null)}
                  className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Split Screen Document Body */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 bg-[#FAF8F5]/50">
              
              {/* Left Column: Source Language Document */}
              <div className="bg-white rounded-2xl border border-[#DECDB8] p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                    Source Document ({activeReviewJob.sourceLang})
                  </span>
                  <span className="text-[11px] bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full font-mono">
                    Original
                  </span>
                </div>
                <div className="space-y-3.5 text-sm sm:text-base text-[#334155] leading-relaxed font-serif">
                  {activeReviewJob.originalClauses.map((clause, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#FAF8F5] border border-slate-100">
                      {clause}
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Column: Target Translated Document */}
              <div className="bg-white rounded-2xl border border-[#DECDB8] p-4 sm:p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#1E3A8A]">
                    Target Document ({activeReviewJob.targetLang})
                  </span>
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2.5 py-0.5 rounded-full font-semibold">
                    ✓ Verified Legal Context
                  </span>
                </div>
                <div className="space-y-3.5 text-sm sm:text-base text-[#0F172A] leading-relaxed font-serif">
                  {activeReviewJob.translatedClauses.map((clause, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-[#FAF5EB] border border-[#DECDB8]/60">
                      {clause}
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-5 py-3 border-t border-[#F0E9DF] bg-[#FAF8F5] flex items-center justify-between text-xs sm:text-sm text-slate-500">
              <span>All Indian High Courts &amp; e-Courts terminology validated.</span>
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(activeReviewJob.translatedClauses.join('\n\n'));
                  setIsCopied(true);
                  setTimeout(() => setIsCopied(false), 2000);
                }}
                className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-[#DECDB8] rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer font-medium"
              >
                {isCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                <span>{isCopied ? 'Copied' : 'Copy All Text'}</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
