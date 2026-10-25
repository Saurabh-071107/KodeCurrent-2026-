'use client';

import React from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import LegalResearch from '@/components/LegalResearch';

export default function CitizenLegalResearchPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#0F172A] font-sans flex flex-col xl:flex-row antialiased relative">
      <div 
        className="fixed right-0 top-0 bottom-0 w-80 pointer-events-none opacity-20 overflow-hidden z-0 hidden lg:block select-none"
        style={{
          maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
        }}
      >
        <Image
          src="/assets/pale-blue-courthouse.png"
          alt="Courthouse watermark"
          fill
          className="object-cover object-right-top mix-blend-multiply"
        />
      </div>

      <Sidebar activeNav="Legal Research" dashboardHref="/citizen" rolePrefix="/citizen" />

      <div className="flex-1 xl:ml-[268px] flex flex-col min-h-screen relative z-10 w-full min-w-0">
        <LegalResearch defaultRole="citizen" initialUserName="Ramesh Kumar" initialUserRole="Citizen · ramesh.kumar@example.com" />
      </div>
    </div>
  );
}
