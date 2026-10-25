'use client';

import React from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative w-full min-h-[calc(100vh-90px)] flex items-center overflow-hidden">
      
      {/* Grand Hero Visual (Desktop): Bottom-Anchored Tableau Visual */}
      <div className="hidden lg:block absolute right-0 bottom-0 z-10 w-[68vw] xl:w-[65vw] 2xl:w-[62vw] max-w-[1550px] pointer-events-none">
        <div 
          className="relative w-full overflow-hidden"
          style={{
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.7) 22%, black 36%, black 100%)',
            maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.15) 10%, rgba(0,0,0,0.7) 22%, black 36%, black 100%)',
          }}
        >
          <Image
            src="/assets/supreme-court-tableau.png"
            alt="Supreme Court of India Legal Tableau with Constitution of India, Civil Procedure Code, Indian Penal Code, and Balance Scales of Justice"
            width={1300}
            height={807}
            priority
            className="w-full h-auto object-contain object-right-bottom block transform translate-y-1 scale-[1.04] origin-bottom-right"
          />
        </div>
      </div>

      {/* Hero Content Container */}
      <div className="max-w-[1440px] mx-auto w-full relative z-20 px-6 sm:px-12 lg:px-16 pt-6 pb-16 lg:py-0 flex flex-col justify-center">
        
        {/* Left Column Content */}
        <div className="w-full lg:w-[48%] xl:w-[45%] max-w-[580px]">
          
          {/* Eyebrow Label */}
          <div className="flex items-center gap-3 mb-5 sm:mb-6">
            <span className="w-8 h-[2px] bg-[#C59B58] inline-block rounded-full" />
            <span className="text-xs sm:text-[13px] tracking-[0.24em] font-semibold text-[#8C7355] uppercase">
              AI FOR LEGAL WORK
            </span>
          </div>

          {/* Main Headline */}
          <h1 className="font-serif-title text-[48px] sm:text-[64px] md:text-[76px] lg:text-[78px] xl:text-[88px] font-bold text-[#0F172A] leading-[1.04] tracking-[-0.03em]">
            Simplify<br />
            Legal Work<br />
            <span className="gold-gradient-text">with AI</span>
          </h1>

          {/* Subtitle Description */}
          <p className="text-base sm:text-lg md:text-[19px] text-[#334155] leading-relaxed max-w-[480px] mt-6 md:mt-7 font-normal">
            Draft, research and manage your legal work —{' '}
            <span className="block sm:inline">simple, reliable and built for India.</span>
          </p>

          {/* Call to Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mt-8 md:mt-10">
            <Link
              href="/register"
              className="bg-[#0F172A] text-white px-7 sm:px-8 py-3.5 rounded-lg text-[15px] font-medium inline-flex items-center gap-2.5 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              Get Started
              <ArrowRight className="w-4 h-4 ml-0.5" />
            </Link>
            <Link
              href="/login"
              className="border border-[#CBD5E1] bg-white/60 backdrop-blur-xs px-8 py-3.5 rounded-lg text-[15px] font-medium text-[#0F172A] hover:bg-white hover:border-[#94A3B8] transition-all transform hover:-translate-y-0.5 shadow-2xs"
            >
              Login
            </Link>
          </div>
        </div>

        {/* Responsive Mobile / Tablet Tableau Display (< 1024px) */}
        <div className="lg:hidden w-full mt-10 relative">
          <div 
            className="w-full max-w-[660px] mx-auto overflow-hidden"
            style={{
              WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 8%, black 20%, black 100%)',
              maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.2) 8%, black 20%, black 100%)',
            }}
          >
            <Image
              src="/assets/supreme-court-tableau.png"
              alt="Supreme Court Legal Tableau"
              width={1300}
              height={807}
              priority
              className="w-full h-auto object-contain"
            />
          </div>
        </div>

      </div>
    </section>
  );
}
