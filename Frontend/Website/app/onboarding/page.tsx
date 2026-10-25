'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  GraduationCap, 
  ArrowRight, 
  Check, 
  FileText 
} from 'lucide-react';
import { api } from '@/lib/api';

interface ProfileRole {
  id: 'student' | 'advocate' | 'firm_admin' | 'citizen';
  title: string;
  description: string;
  icon: React.ReactNode;
}

export default function OnboardingProfilePage() {
  const router = useRouter();
  const [selectedRole, setSelectedRole] = useState<string>('advocate');

  const roles: ProfileRole[] = [
    {
      id: 'student',
      title: 'Law Student',
      description: 'Learn, research and draft with ease.',
      icon: <GraduationCap className="w-10 h-10 text-[#1E293B] stroke-[1.6]" />,
    },
    {
      id: 'advocate',
      title: 'Advocate / Legal Pro',
      description: 'Draft, review and manage your practice.',
      icon: (
        <svg 
          className="w-10 h-10 text-[#1E293B]" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
          <path d="M10 15l2 3 2-3" />
        </svg>
      ),
    },
    {
      id: 'firm_admin',
      title: 'Law Firm Member',
      description: 'Collaborate and streamline workflows.',
      icon: (
        <svg 
          className="w-10 h-10 text-[#1E293B]" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.6" 
          strokeLinecap="round" 
          strokeLinejoin="round"
        >
          <path d="M3 21h18" />
          <path d="M5 21V10" />
          <path d="M9 21V10" />
          <path d="M15 21V10" />
          <path d="M19 21V10" />
          <path d="M2 10l10-6 10 6H2z" />
          <circle cx="12" cy="14" r="1.5" />
        </svg>
      ),
    },
    {
      id: 'citizen',
      title: 'Non-Legal User',
      description: 'Get legal help in simple language.',
      icon: <FileText className="w-10 h-10 text-[#1E293B] stroke-[1.6]" />,
    },
  ];

  const handleSelectRole = (roleId: string) => {
    setSelectedRole(roleId);
    api.updateOnboarding({ role: roleId }).catch(() => {});
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('draftmate_user');
      const userObj = stored ? JSON.parse(stored) : {};
      localStorage.setItem('draftmate_user', JSON.stringify({ ...userObj, role: roleId }));
    }
    if (roleId === 'advocate') {
      router.push('/onboarding/practice');
    } else if (roleId === 'student') {
      router.push('/onboarding/student');
    } else if (roleId === 'firm_admin') {
      router.push('/onboarding/firm');
    } else if (roleId === 'citizen') {
      router.push('/onboarding/citizen');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <div className="relative min-h-screen w-full flex flex-col justify-between overflow-x-hidden font-sans">
      
      {/* 1. Crystal Clear Background: Golden Courtyard of Justice (1:1 with reference) */}
      <div className="fixed inset-0 z-0">
        <Image
          src="/assets/onboarding-bg.png"
          alt="Supreme Court Courtyard of Justice"
          fill
          priority
          quality={100}
          className="object-cover object-center"
        />
      </div>

      {/* 2. Top Header: Prominent Brand Logo & Name (Circled buttons removed) */}
      <header className="relative z-20 w-full pt-8 pb-4 px-8 md:px-14 lg:px-20">
        <div className="max-w-[1440px] mx-auto flex items-center justify-between">
          
          {/* Brand Logo with Increased Size for Crest & Name */}
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

      {/* 3. Main Onboarding Body */}
      <main className="relative z-20 w-full max-w-[1440px] mx-auto px-6 md:px-12 lg:px-16 py-6 md:py-10 flex-1 flex flex-col justify-center">
        
        {/* Eyebrow & Title Banner */}
        <div className="text-center max-w-2xl mx-auto mb-10 md:mb-14">
          
          {/* Eyebrow */}
          <div className="flex items-center justify-center gap-3 mb-3.5">
            <span className="w-8 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
            <span className="text-xs sm:text-[14px] tracking-[0.26em] font-semibold text-[#8C7355] uppercase">
              WELCOME TO NEXORA
            </span>
            <span className="w-8 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
          </div>

          {/* Title */}
          <h1 className="font-serif-title text-[42px] sm:text-[52px] md:text-[62px] font-bold text-[#0F172A] leading-tight tracking-[-0.02em]">
            Choose <span className="gold-gradient-text">Your Profile</span>
          </h1>

          {/* Subtitle */}
          <p className="text-[#334155] text-base sm:text-[19px] leading-relaxed mt-3.5 font-normal">
            Get a personalized experience based on your role.<br className="hidden sm:inline" />
            You can always change this later in settings.
          </p>
        </div>

        {/* 4 Role Selection Cards Grid with Increased Box Text & Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:gap-7 max-w-[1360px] mx-auto w-full">
          {roles.map((role) => {
            const isSelected = selectedRole === role.id;
            return (
              <div
                key={role.id}
                role="button"
                tabIndex={0}
                onClick={() => handleSelectRole(role.id)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleSelectRole(role.id);
                  }
                }}
                className={`relative rounded-3xl p-8 sm:p-9 flex flex-col justify-between items-center text-center cursor-pointer transition-all duration-300 transform select-none ${
                  isSelected
                    ? 'bg-white/95 border-2 border-[#C59B58] shadow-2xl scale-[1.02] ring-4 ring-[#C59B58]/15'
                    : 'bg-white/90 hover:bg-white border border-[#E2E8F0] hover:border-[#CBD5E1] shadow-lg hover:shadow-xl hover:scale-[1.01]'
                } backdrop-blur-md min-h-[350px] sm:min-h-[380px]`}
              >
                {/* Active check indicator badge at top-right (when selected) */}
                {isSelected && (
                  <div className="absolute top-4 right-4 w-7 h-7 rounded-full bg-[#C59B58] text-white flex items-center justify-center shadow-xs animate-in zoom-in-75 duration-200">
                    <Check className="w-4 h-4 stroke-[3]" />
                  </div>
                )}

                {/* Top: Icon in warm cream badge (Larger size) */}
                <div className="w-full flex flex-col items-center">
                  <div 
                    className={`w-[84px] h-[84px] rounded-full flex items-center justify-center transition-transform duration-300 ${
                      isSelected 
                        ? 'bg-[#F4ECE1] border-2 border-[#C59B58] scale-105 shadow-xs' 
                        : 'bg-[#F8F3EB] border border-[#EADBCA]'
                    }`}
                  >
                    {role.icon}
                  </div>

                  {/* Card Title (Increased size) */}
                  <h3 className="font-serif-title text-[24px] sm:text-[26px] font-bold text-[#0F172A] mt-6 mb-3 tracking-tight">
                    {role.title}
                  </h3>

                  {/* Card Description (Increased size) */}
                  <p className="text-[16px] sm:text-[17px] text-[#475569] leading-relaxed max-w-[260px] font-normal">
                    {role.description}
                  </p>
                </div>

                {/* Bottom: Round Arrow Action Button (Larger size) */}
                <div className="w-full flex justify-end mt-7">
                  <div 
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-200 ${
                      isSelected
                        ? 'bg-[#0F172A] text-white shadow-md'
                        : 'bg-white/80 border border-[#CBD5E1] text-[#475569] hover:bg-[#0F172A] hover:text-white'
                    }`}
                  >
                    <ArrowRight className="w-5 h-5 stroke-[2.2]" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>

      </main>

      {/* Bottom padding spacing without footer copyright */}
      <div className="relative z-20 py-4" />
    </div>
  );
}
