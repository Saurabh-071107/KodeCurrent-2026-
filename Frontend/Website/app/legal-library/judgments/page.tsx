'use client';

import React from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import LegalLibrary from '@/components/LegalLibrary';

export default function JudgmentLibraryPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col xl:flex-row antialiased relative">
      <div 
        className="fixed right-0 top-0 bottom-0 w-80 pointer-events-none opacity-15 overflow-hidden z-0 hidden lg:block select-none"
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

      <Sidebar activeNav="Judgment Library" dashboardHref="/advocate" rolePrefix="/advocate" />

      <div className="flex-1 xl:ml-[268px] flex flex-col min-h-screen relative z-10 w-full min-w-0 p-4 sm:p-6 lg:p-8">
        <LegalLibrary view="judgments" rolePrefix="/advocate" />
      </div>
    </div>
  );
}
