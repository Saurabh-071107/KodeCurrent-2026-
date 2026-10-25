'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Scale, 
  Briefcase, 
  Users, 
  Home, 
  Coins, 
  Lightbulb, 
  Landmark, 
  Gavel, 
  ArrowLeft, 
  ArrowRight,
  Check,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function PracticeOnboardingPage() {
  const router = useRouter();
  const [enrollmentId, setEnrollmentId] = useState('');
  const [selectedPractices, setSelectedPractices] = useState<string[]>(['Criminal Law']);
  const [experience, setExperience] = useState('3–5 Years');
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    setLoading(true);
    try {
      await api.updateOnboarding({
        role: 'advocate',
        enrollmentId: enrollmentId.trim(),
        practiceAreas: selectedPractices,
        experience,
      });
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('draftmate_user');
        const userObj = stored ? JSON.parse(stored) : {};
        localStorage.setItem('draftmate_user', JSON.stringify({ ...userObj, role: 'advocate' }));
      }
    } catch (e) {
      console.error('Error saving practice onboarding:', e);
    } finally {
      setLoading(false);
      router.push('/advocate');
    }
  };

  const practiceAreas = [
    { name: 'Criminal Law', icon: <Gavel className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Civil Law', icon: <Scale className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Corporate Law', icon: <Briefcase className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Family Law', icon: <Users className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Property Law', icon: <Home className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Tax Law', icon: <Coins className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Intellectual Property', icon: <Lightbulb className="w-5 h-5 text-[#8C7355]" /> },
    { name: 'Constitutional Law', icon: <Landmark className="w-5 h-5 text-[#8C7355]" /> },
  ];

  const experienceTiers = [
    { label: '0–2 Years', level: 'Junior Advocate' },
    { label: '3–5 Years', level: 'Associate' },
    { label: '6–10 Years', level: 'Senior Counsel' },
    { label: '10+ Years', level: 'Lead / Partner' },
  ];

  const togglePractice = (name: string) => {
    if (selectedPractices.includes(name)) {
      if (selectedPractices.length > 1) {
        setSelectedPractices(selectedPractices.filter((p) => p !== name));
      }
    } else {
      setSelectedPractices([...selectedPractices, name]);
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

      {/* 2. Top Header: Enlarged Logo & Name (Circled Skip for now removed) */}
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

      {/* 3. Central Practice Details Card in Enhanced Modern Format */}
      <main className="relative z-20 w-full max-w-[780px] mx-auto px-4 sm:px-6 py-4 md:py-8 flex-1 flex flex-col justify-center">
        <div className="bg-[#FAF7F2]/96 backdrop-blur-md rounded-[28px] p-8 sm:p-11 border border-[#EFE8DC] shadow-2xl">
          
          {/* Heading (Circled Step 3 of 4 removed, text increased) */}
          <div className="text-center mb-8">
            <h1 className="font-serif-title text-4xl sm:text-[44px] font-bold text-[#0F172A] tracking-tight leading-tight">
              Your Legal <span className="gold-gradient-text">Practice</span>
            </h1>
            <p className="text-[#475569] text-base sm:text-lg mt-2 font-normal">
              Tell us a little about your practice to tailor your studio workspace.
            </p>
          </div>

          {/* Form Fields Container */}
          <div className="space-y-6">
            
            {/* Enrollment Number Field */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2">
                Bar Council ID / Enrollment Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C7355]">
                  <Landmark className="w-5 h-5" />
                </div>
                <input
                  type="text"
                  value={enrollmentId}
                  onChange={(e) => setEnrollmentId(e.target.value)}
                  placeholder="e.g., MH/12345/2020 or D/9876/2018"
                  className="w-full pl-12 pr-4 py-3 bg-white/85 border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition-all shadow-2xs"
                />
              </div>
            </div>

            {/* Primary Practice Areas (Enhanced Grid Tile Format) */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-[15px] sm:text-[16px] font-semibold text-[#0F172A]">
                  Primary Practice Areas
                </label>
                <span className="text-xs text-[#8C7355] font-medium">
                  {selectedPractices.length} selected
                </span>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
                {practiceAreas.map((area) => {
                  const isSelected = selectedPractices.includes(area.name);
                  return (
                    <button
                      key={area.name}
                      type="button"
                      onClick={() => togglePractice(area.name)}
                      className={`relative flex flex-col justify-between p-3.5 rounded-xl border text-left transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DC CF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full mb-2">
                        <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-white shadow-2xs' : 'bg-[#F8F4EC]'}`}>
                          {area.icon}
                        </div>
                        {isSelected && (
                          <div className="w-4 h-4 rounded-full bg-[#C59B58] text-white flex items-center justify-center">
                            <Check className="w-2.5 h-2.5 stroke-[3]" />
                          </div>
                        )}
                      </div>
                      <span className="text-[13px] sm:text-[14px] font-semibold leading-snug">
                        {area.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Years of Experience (New Sleek Segmented Pill Rail Format) */}
            <div>
              <label className="block text-[15px] sm:text-[16px] font-semibold text-[#0F172A] mb-2.5">
                Years of Legal Experience
              </label>
              
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {experienceTiers.map((tier) => {
                  const isSelected = experience === tier.label;
                  return (
                    <button
                      key={tier.label}
                      type="button"
                      onClick={() => setExperience(tier.label)}
                      className={`flex flex-col items-center justify-center p-3.5 rounded-xl border text-center transition-all duration-200 ${
                        isSelected
                          ? 'border-[#C59B58] bg-[#F7EFE1] text-[#0F172A] shadow-xs ring-2 ring-[#C59B58]/20'
                          : 'border-[#E2DCCF] bg-white/75 text-[#334155] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      <span className="text-[16px] sm:text-[17px] font-bold tracking-tight">
                        {tier.label}
                      </span>
                      <span className="text-[11px] sm:text-xs text-[#64748B] mt-0.5 font-medium">
                        {tier.level}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-5 border-t border-[#EAE3D7] flex items-center justify-between gap-4">
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-1.5 text-sm sm:text-[15px] font-medium text-[#475569] hover:text-[#0F172A] transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Link>

              <button
                type="button"
                onClick={handleContinue}
                disabled={loading}
                className="bg-[#0F172A] disabled:opacity-75 disabled:cursor-not-allowed text-white px-7 sm:px-9 py-3 rounded-xl text-sm sm:text-[15px] font-medium inline-flex items-center gap-2.5 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Profile...
                  </>
                ) : (
                  <>
                    Continue to Dashboard
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

          </div>

        </div>
      </main>

      {/* Bottom padding spacing */}
      <div className="relative z-20 py-3" />
    </div>
  );
}
