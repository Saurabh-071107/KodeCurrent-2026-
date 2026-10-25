'use client';

import React from 'react';
import Image from 'next/image';
import Sidebar from '@/components/Sidebar';
import DocumentVerification from '@/components/DocumentVerification';

export default function FirmDocumentVerificationPage() {
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-[#1E293B] font-sans flex flex-col xl:flex-row antialiased relative">
      {/* Background Classical Courthouse Columns Watermark (Right Margin) */}
      <div 
        className="fixed right-0 top-0 bottom-0 w-80 pointer-events-none opacity-10 overflow-hidden z-0 hidden lg:block select-none"
        style={{
          maskImage: 'linear-gradient(to left, black 20%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to left, black 30%, transparent 100%)',
        }}
      >
        <Image
          src="/assets/pale-blue-courthouse.png"
          alt="Courthouse watermark"
          fill
          className="object-cover object-right-top mix-blend-multiply"
        />
      </div>

      <Sidebar activeNav="Document Verification" dashboardHref="/firm" rolePrefix="/firm" />

      <div className="flex-1 xl:ml-[268px] flex flex-col min-h-screen relative z-10 w-full min-w-0">
        <DocumentVerification
          role="firm"
          initialUserName="Sharma & Associates"
          initialUserRole="Law Firm · team@sharma-law.com"
          dashboardHref="/firm"
        />
      </div>
    </div>
  );
}
