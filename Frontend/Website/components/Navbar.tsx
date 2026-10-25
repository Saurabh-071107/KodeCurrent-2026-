'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

export default function Navbar() {
  return (
    <header className="w-full relative z-30 pt-7 pb-4 px-6 md:px-12 lg:px-16 bg-transparent">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between">
        
        {/* Brand / Logo (Enlarged and bold) */}
        <Link href="/" className="flex items-center gap-4 group">
          <div className="relative w-[52px] h-[46px] overflow-hidden flex-shrink-0">
            {/* Nexora Crest Icon: cleanly cropped to crest only */}
            <Image
              src="/assets/nexora-logo.png"
              alt="Nexora Crest Logo"
              width={180}
              height={180}
              priority
              className="absolute top-0 left-1/2 -translate-x-1/2 w-[60px] h-auto object-cover object-top max-w-none transform transition-transform group-hover:scale-105"
            />
          </div>
          <span className="font-brand text-3xl font-bold tracking-[0.18em] text-[#0F172A] mt-0.5">
            NEXORA
          </span>
        </Link>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-3.5 sm:gap-5">
          <Link
            href="/about"
            className="text-[15px] font-medium text-[#475569] hover:text-[#0F172A] transition-colors px-2 py-1"
          >
            About Us
          </Link>
          <Link
            href="/login"
            className="px-5 sm:px-6 py-2.5 rounded-lg text-[15px] font-medium text-[#0F172A] border border-[#CBD5E1] bg-white/60 backdrop-blur-xs hover:bg-white hover:border-[#94A3B8] transition-all shadow-2xs"
          >
            Login
          </Link>
          <Link
            href="/register"
            className="px-5 sm:px-6 py-2.5 rounded-lg text-[15px] font-medium text-white bg-[#0F172A] hover:bg-[#1E293B] transition-all shadow-sm hover:shadow"
          >
            Register
          </Link>
        </div>

      </div>
    </header>
  );
}
