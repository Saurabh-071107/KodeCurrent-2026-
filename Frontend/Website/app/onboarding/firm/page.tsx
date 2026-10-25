'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  ArrowLeft, 
  ArrowRight, 
  Briefcase, 
  Scale,
  FileText,
  BookOpen,
  Users, 
  Check,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

interface PositionOption {
  label: string;
  badge: string;
  icon: React.ReactNode;
}

export default function FirmOnboardingPage() {
  const router = useRouter();
  const [firmName, setFirmName] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('Senior Associate');
  const [firmSize, setFirmSize] = useState('11-50 People');
  const [loading, setLoading] = useState(false);

  const positions: PositionOption[] = [
    { 
      label: 'Partner', 
      badge: 'Leadership & Strategy',
      icon: <Briefcase className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Senior Associate', 
      badge: 'Lead Counsel & Review',
      icon: <Scale className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Associate', 
      badge: 'Practice & Research',
      icon: <FileText className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Junior Associate', 
      badge: 'Drafting & Case Prep',
      icon: <BookOpen className="w-5 h-5 text-[#8C7355]" />
    },
    { 
      label: 'Legal Ops / Paralegal', 
      badge: 'Operations & Filings',
      icon: <Users className="w-5 h-5 text-[#8C7355]" />
    },
  ];

  const firmSizes = [
    { range: '1–10 People', tier: 'Boutique' },
    { range: '11–50 People', tier: 'Mid-Sized' },
    { range: '51–200 People', tier: 'Large Firm' },
    { range: '200+ People', tier: 'Enterprise' },
  ];

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    try {
      await api.updateOnboarding({
        role: 'firm_admin',
        firmName: firmName.trim(),
        firmPosition: selectedPosition,
        firmSize,
      });
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('draftmate_user');
        const userObj = stored ? JSON.parse(stored) : {};
        localStorage.setItem('draftmate_user', JSON.stringify({ ...userObj, role: 'firm' }));
      }
    } catch (err) {
      console.error('Error saving firm onboarding:', err);
    } finally {
      setLoading(false);
      router.push('/firm');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* 1. Background: Golden Courtyard of Justice */}
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

      {/* 2. Top Header: Logo & Brand Name */}
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

      {/* 3. Central Setup Card */}
      <main className="relative z-20 w-full max-w-[780px] mx-auto px-4 sm:px-6 py-4 md:py-8 flex-1 flex flex-col justify-center">
        <div className="bg-[#FAF7F2]/96 backdrop-blur-md rounded-[28px] p-8 sm:p-11 border border-[#EFE8DC] shadow-2xl">
          
          {/* Header without emoji, rewritten with professional phrasing */}
          <div className="mb-8 text-center sm:text-left">
            <h1 className="font-serif-title text-3xl sm:text-[40px] font-bold text-[#0F172A] tracking-tight leading-tight">
              Firm & Organization <span className="gold-gradient-text">Profile</span>
            </h1>
            <p className="text-[#475569] text-base sm:text-lg mt-2 leading-relaxed font-normal">
              Configure your law practice workspace to streamline team collaboration, research, and client matter management.
            </p>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Firm Name Field */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2">
                Firm / Organization Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C7355]">
                  <Building2 className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={firmName}
                  onChange={(e) => setFirmName(e.target.value)}
                  placeholder="e.g., Shardul Amarchand Mangaldas, AZB & Partners"
                  className="w-full pl-12 pr-4 py-3.5 bg-white/85 border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Your Position (Presented in Modern 2-Column Interactive Card Grid) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[15px] sm:text-[16px] font-semibold text-[#0F172A]">
                  Your Role in the Firm
                </label>
                <span className="text-xs text-[#8C7355] font-medium">
                  {selectedPosition}
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-3">
                {positions.map((pos) => {
                  const isSelected = selectedPosition === pos.label;
                  return (
                    <button
                      key={pos.label}
                      type="button"
                      onClick={() => setSelectedPosition(pos.label)}
                      className={`relative flex items-center justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DCCF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-white shadow-2xs' : 'bg-[#F8F4EC]'}`}>
                          {pos.icon}
                        </div>
                        <div>
                          <div className="text-[15px] font-bold text-[#0F172A] leading-tight">
                            {pos.label}
                          </div>
                          <div className="text-xs text-[#64748B] font-medium mt-0.5">
                            {pos.badge}
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

            {/* Firm Size (Presented as Segmented Cards with Tiers) */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2.5">
                Practice / Firm Size
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {firmSizes.map((size) => {
                  const isSelected = firmSize === size.range;
                  return (
                    <button
                      key={size.range}
                      type="button"
                      onClick={() => setFirmSize(size.range)}
                      className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DCCF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="text-[14px] sm:text-[15px] font-bold text-[#0F172A]">
                        {size.range}
                      </span>
                      <span className="text-[11px] text-[#64748B] font-medium mt-0.5">
                        {size.tier}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions Footer: Clean Back + Submit (without Skip for now) */}
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

      {/* Bottom padding spacing */}
      <div className="relative z-20 py-3" />
    </div>
  );
}
