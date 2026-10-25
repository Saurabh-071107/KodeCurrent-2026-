'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  ArrowRight, 
  UserCheck, 
  Briefcase, 
  Home, 
  Users, 
  ShieldAlert, 
  FileText,
  Check,
  Loader2 
} from 'lucide-react';
import { api } from '@/lib/api';

interface LegalNeed {
  label: string;
  tag: string;
  icon: React.ReactNode;
}

export default function NonLegalUserOnboardingPage() {
  const router = useRouter();
  const [selectedReason, setSelectedReason] = useState<string>('Personal Legal Matters');
  const [selectedIndustry, setSelectedIndustry] = useState<string>('Technology');
  const [loading, setLoading] = useState(false);

  const legalNeeds: LegalNeed[] = [
    { 
      label: 'Personal Legal Matters', 
      tag: 'Affidavits, wills & personal deeds',
      icon: <UserCheck className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Business Contracts', 
      tag: 'NDAs, vendor agreements & terms',
      icon: <Briefcase className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Property Documentation', 
      tag: 'Leases, rent deeds & registries',
      icon: <Home className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Family Disputes', 
      tag: 'Settlements, custody & partition',
      icon: <Users className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Consumer Complaints', 
      tag: 'Deficiencies, refunds & notices',
      icon: <ShieldAlert className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Employment Issues', 
      tag: 'Severance, offer terms & workplace',
      icon: <FileText className="w-5 h-5 text-[#8C7355]" />
    },
  ];

  const industries = [
    'Technology',
    'Healthcare',
    'Finance',
    'Real Estate',
    'Education',
    'E-commerce',
    'Manufacturing',
    'Other / General',
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.updateOnboarding({
        role: 'citizen',
        legalNeed: selectedReason,
        industry: selectedIndustry,
      });
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('draftmate_user');
        const userObj = stored ? JSON.parse(stored) : {};
        localStorage.setItem('draftmate_user', JSON.stringify({ ...userObj, role: 'citizen' }));
      }
    } catch (err) {
      console.error('Error saving citizen onboarding:', err);
    } finally {
      setLoading(false);
      router.push('/citizen');
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

      {/* 2. Top Header: Brand Crest Logo & Name */}
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

      {/* 3. Central Non-Legal Setup Card in Website Theme */}
      <main className="relative z-20 w-full max-w-[780px] mx-auto px-4 sm:px-6 py-4 md:py-8 flex-1 flex flex-col justify-center">
        <div className="bg-[#FAF7F2]/96 backdrop-blur-md rounded-[28px] p-8 sm:p-11 border border-[#EFE8DC] shadow-2xl">
          
          {/* Header in Website Theme (No emoji, no blue text) */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="font-serif-title text-3xl sm:text-[40px] font-bold text-[#0F172A] tracking-tight leading-tight">
              How Can Nexora <span className="gold-gradient-text">Assist You?</span>
            </h1>
            <p className="text-[#475569] text-base sm:text-lg mt-2 leading-relaxed font-normal">
              Select your primary legal need to receive plain-English document drafting, notice generation, and case assistance.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Primary Need (Presented in Modern 2-Column Interactive Card Grid) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[15px] sm:text-[16px] font-semibold text-[#0F172A]">
                  Primary Legal Concern
                </label>
                <span className="text-xs text-[#8C7355] font-medium">
                  {selectedReason}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {legalNeeds.map((need) => {
                  const isSelected = selectedReason === need.label;
                  return (
                    <button
                      key={need.label}
                      type="button"
                      onClick={() => setSelectedReason(need.label)}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DCCF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white shadow-2xs' : 'bg-[#F8F4EC]'}`}>
                          {need.icon}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-[#0F172A] leading-tight">
                            {need.label}
                          </div>
                          <div className="text-xs text-[#64748B] font-medium mt-0.5">
                            {need.tag}
                          </div>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#C59B58] text-white flex items-center justify-center flex-shrink-0">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border-2 border-[#CBD5E1] bg-white flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Section: Your Industry (4-Column Segmented Chips in Website Theme) */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2.5">
                Your Industry / Domain
              </label>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {industries.map((industry) => {
                  const isSelected = selectedIndustry === industry;
                  return (
                    <button
                      key={industry}
                      type="button"
                      onClick={() => setSelectedIndustry(industry)}
                      className={`py-3 px-3 rounded-xl border text-center text-xs sm:text-sm font-semibold transition-all duration-200 truncate ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DCCF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      {industry}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer in Theme (Dark Navy Slate CTA Button + Clean Back Link) */}
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
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </form>

        </div>
      </main>

      {/* Bottom spacing */}
      <div className="relative z-20 py-3" />
    </div>
  );
}
