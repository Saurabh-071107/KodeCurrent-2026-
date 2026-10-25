'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  School,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function StudentOnboardingPage() {
  const router = useRouter();
  const [collegeName, setCollegeName] = useState('');
  const [selectedYear, setSelectedYear] = useState('3rd Year');
  const [loading, setLoading] = useState(false);

  const years = [
    { id: '1st Year', label: '1st Year', note: 'Foundation & Basics' },
    { id: '2nd Year', label: '2nd Year', note: 'Core Subjects & Mooting' },
    { id: '3rd Year', label: '3rd Year', note: 'Procedural Law & Internships' },
    { id: '4th Year', label: '4th Year', note: 'Specializations & Drafting' },
    { id: '5th Year', label: '5th Year', note: 'Final Year & Bar Prep' },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.updateOnboarding({
        role: 'student',
        collegeName: collegeName.trim(),
        academicYear: selectedYear,
      });
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('draftmate_user');
        const userObj = stored ? JSON.parse(stored) : {};
        localStorage.setItem('draftmate_user', JSON.stringify({ ...userObj, role: 'student' }));
      }
    } catch (err) {
      console.error('Error saving student onboarding:', err);
    } finally {
      setLoading(false);
      router.push('/student');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* 1. Crystal Clear Background: Golden Courtyard of Justice */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/onboarding-bg.png"
          alt="Golden Courtyard of Justice"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
      </div>

      {/* 2. Top Header: Enlarged Logo & Name */}
      <header className="relative z-20 w-full pt-8 pb-4 px-8 md:px-14 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-4 group">
            <div className="relative w-[56px] h-[50px] overflow-hidden flex-shrink-0">
              <Image
                src="/assets/nexora-logo.png"
                alt="Nexora Crest Logo"
                width={200}
                height={200}
                priority
                className="absolute top-0 left-1/2 -translate-x-1/2 w-[64px] h-auto object-cover object-top max-w-none transform transition-transform group-hover:scale-105"
              />
            </div>
            <span className="font-brand text-3xl sm:text-[34px] font-bold tracking-[0.18em] text-[#0F172A] mt-0.5">
              NEXORA
            </span>
          </Link>
        </div>
      </header>

      {/* 3. Central Law Student Card (matching reference mockup) */}
      <main className="relative z-20 w-full max-w-[700px] mx-auto px-4 sm:px-6 py-6 md:py-10 flex-1 flex flex-col justify-center">
        <div className="bg-[#FAF7F2]/96 backdrop-blur-md rounded-[28px] p-8 sm:p-11 border border-[#EFE8DC] shadow-2xl">
          
          {/* Card Header without emoji, professional copy */}
          <div className="mb-7">
            <h1 className="font-serif-title text-3xl sm:text-[38px] font-bold text-[#0F172A] tracking-tight mb-2.5">
              Tell Us About Your <span className="gold-gradient-text">Legal Studies</span>
            </h1>
            <p className="text-[#475569] text-base sm:text-lg leading-relaxed font-normal">
              Please provide your{' '}
              <span className="font-semibold text-[#0F172A] underline decoration-[#C59B58] decoration-2 underline-offset-2">
                law school or college
              </span>{' '}
              and current{' '}
              <span className="font-semibold text-[#0F172A] underline decoration-[#C59B58] decoration-2 underline-offset-2">
                academic year
              </span>{' '}
              to customize your legal research tools and study resources.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* College Name Input */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2">
                I am in
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C7355]">
                  <School className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={collegeName}
                  onChange={(e) => setCollegeName(e.target.value)}
                  placeholder="Please type the name of your college here"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/85 border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Year Selector */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2.5">
                And I&apos;m in the year
              </label>
              
              <div className="space-y-2.5">
                {years.map((year) => {
                  const isSelected = selectedYear === year.id;
                  return (
                    <button
                      key={year.id}
                      type="button"
                      onClick={() => setSelectedYear(year.id)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DCCF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${
                            isSelected
                              ? 'border-[#C59B58] bg-[#C59B58]'
                              : 'border-[#CBD5E1] bg-white'
                          }`}
                        >
                          {isSelected && <span className="w-2 h-2 bg-white rounded-full" />}
                        </div>
                        <span className="text-base font-semibold text-[#0F172A]">
                          {year.label}
                        </span>
                      </div>
                      <span className="hidden sm:inline text-xs text-[#64748B] font-medium">
                        {year.note}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer */}
            <div className="pt-5 border-t border-[#EAE3D7] flex items-center justify-between gap-4">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 text-sm sm:text-[15px] font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>

              <button
                type="submit"
                disabled={loading}
                className="bg-[#0F172A] disabled:opacity-75 disabled:cursor-not-allowed text-white px-7 sm:px-9 py-3 rounded-xl text-sm sm:text-[15px] font-medium inline-flex items-center gap-2.5 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    Submit
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* Bottom padding spacing */}
      <div className="relative z-20 py-3" />
    </div>
  );
}
