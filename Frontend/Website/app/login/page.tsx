'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  ArrowLeft,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { api } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();

  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    if (!password) {
      setError('Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.login({
        mobile: cleanMobile,
        password,
      });

      if (!res.success) {
        setError(res.message || 'Invalid mobile number or password.');
        return;
      }

      // Store JWT token & user profile in localStorage
      if (typeof window !== 'undefined') {
        if (res.token) localStorage.setItem('draftmate_token', res.token);
        if (res.user) localStorage.setItem('draftmate_user', JSON.stringify(res.user));
      }

      // Direct user to their respective persona dashboard
      const targetRole = res.user?.role || res.user?.onboarding?.role;
      if (targetRole === 'student') {
        router.push('/student');
      } else if (targetRole === 'firm' || targetRole === 'firm_admin') {
        router.push('/firm');
      } else if (targetRole === 'citizen') {
        router.push('/citizen');
      } else if (targetRole === 'advocate') {
        router.push('/advocate');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to connect to authentication server.');
    } finally {
      setLoading(false);
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

      {/* 2. Top Header: Brand Crest Logo & Home link */}
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

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white px-4 py-2 rounded-full border border-slate-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* 3. Central Login Card */}
      <main className="relative z-20 w-full max-w-[500px] mx-auto px-4 sm:px-6 py-6 md:py-10 flex-1 flex flex-col justify-center">
        <div className="bg-[#FAF7F2]/96 backdrop-blur-md rounded-[28px] p-7 sm:p-10 border border-[#EFE8DC] shadow-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2.5 mb-2.5">
              <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
              <span className="text-xs tracking-[0.24em] font-semibold text-[#8C7355] uppercase">
                SECURE ACCESS
              </span>
              <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
            </div>

            <h1 className="font-serif-title text-3xl sm:text-[38px] font-bold text-[#0F172A] tracking-tight leading-tight">
              Welcome <span className="gold-gradient-text">Back</span>
            </h1>

            <p className="text-[#475569] text-sm sm:text-base mt-2 leading-relaxed font-normal">
              Sign in with your registered mobile number and password.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            {/* Mobile Number */}
            <div>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                Mobile Number
              </label>
              <div className="relative flex rounded-xl border border-[#E2E8F0] bg-white/85 shadow-2xs focus-within:border-[#C59B58] focus-within:ring-2 focus-within:ring-[#C59B58]/20 transition-all overflow-hidden">
                <div className="flex items-center gap-1.5 px-3.5 bg-[#F8F4EC] border-r border-[#E2E8F0] text-xs font-bold text-[#785E3A] select-none">
                  <span className="px-1.5 py-0.5 rounded bg-[#EAE3D6] text-[10px] font-mono">IN</span>
                  <span>+91</span>
                </div>
                <div className="relative flex-1 flex items-center">
                  <input
                    type="tel"
                    maxLength={10}
                    autoFocus
                    value={mobile}
                    onChange={(e) => {
                      const val = e.target.value.replace(/\D/g, '');
                      setMobile(val);
                      setError('');
                    }}
                    placeholder="98765 43210"
                    className="w-full px-4 py-3.5 bg-transparent text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C7355]">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Enter your password"
                  className="w-full pl-12 pr-12 py-3.5 bg-white/85 border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition-all shadow-2xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Error Banner */}
            {error && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in duration-150">
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#0F172A] disabled:opacity-75 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Authenticating...
                </>
              ) : (
                <>
                  Sign In to Nexora
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch to Register */}
          <div className="text-center mt-6 pt-5 border-t border-[#EAE3D7]">
            <p className="text-sm text-[#64748B]">
              New to Nexora?{' '}
              <Link
                href="/register"
                className="font-semibold text-[#0F172A] hover:text-[#C59B58] transition-colors underline decoration-[#C59B58] decoration-2 underline-offset-2"
              >
                Create an account with OTP
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Bottom info badge */}
      <div className="relative z-20 py-4 text-center">
        <p className="text-xs text-slate-500 inline-flex items-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-[#8C7355]" />
          256-bit SSL encrypted session · Bar Council of India compliant
        </p>
      </div>
    </div>
  );
}
