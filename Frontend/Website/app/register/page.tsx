'use client';

import React, { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  User, 
  ArrowRight, 
  ArrowLeft, 
  ShieldCheck, 
  RotateCw,
  Edit2,
  Lock,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { api } from '@/lib/api';

export default function RegisterPage() {
  const router = useRouter();
  
  // 3-Step Flow: 'mobile' -> 'otp' -> 'profile'
  const [step, setStep] = useState<'mobile' | 'otp' | 'profile'>('mobile');
  const [loading, setLoading] = useState(false);
  
  // Step 1: Mobile
  const [mobile, setMobile] = useState('');
  
  // Step 2: OTP
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);

  // Step 3: Name, Role & Password
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'advocate' | 'student' | 'firm_admin' | 'citizen'>('advocate');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation / Error state
  const [error, setError] = useState('');

  const otpInputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Timer countdown for OTP resend
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (step === 'otp' && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
      if (interval) clearInterval(interval);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  // ==========================================
  // Step 1: Submit Mobile Number -> Send OTP
  // ==========================================
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    if (cleanMobile.length !== 10) {
      setError('Please enter a valid 10-digit Indian mobile number.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.sendOtp(cleanMobile, 'register');
      if (!res.success) {
        setError(res.message || 'Failed to send OTP.');
        return;
      }

      setStep('otp');
      setTimer(res.expiresInSeconds || 30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);

      setTimeout(() => {
        otpInputsRef.current[0]?.focus();
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Error communicating with server.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Step 2: Handle OTP Input & Verification
  // ==========================================
  const handleOtpChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const newOtp = [...otp];
    newOtp[index] = digit;
    setOtp(newOtp);
    setError('');

    if (digit && index < 5) {
      otpInputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpInputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pastedData) {
      const newOtp = [...otp];
      for (let i = 0; i < pastedData.length; i++) {
        newOtp[i] = pastedData[i];
      }
      setOtp(newOtp);
      const nextIndex = Math.min(pastedData.length, 5);
      otpInputsRef.current[nextIndex]?.focus();
    }
  };

  const handleResendOtp = async () => {
    if (!canResend || loading) return;
    setError('');
    setLoading(true);
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    try {
      const res = await api.sendOtp(cleanMobile, 'register');
      if (!res.success) {
        setError(res.message || 'Failed to resend OTP.');
        return;
      }
      setTimer(30);
      setCanResend(false);
      setOtp(['', '', '', '', '', '']);
      otpInputsRef.current[0]?.focus();
    } catch (err: any) {
      setError(err?.message || 'Failed to resend verification code.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const enteredOtp = otp.join('');

    if (enteredOtp.length !== 6) {
      setError('Please enter all 6 digits of the OTP.');
      return;
    }

    setLoading(true);
    setError('');
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    try {
      const res = await api.verifyOtp(cleanMobile, enteredOtp);
      if (!res.success) {
        setError(res.message || 'Invalid or expired OTP.');
        return;
      }

      // OTP Verified! Advance to Step 3 (Profile Setup)
      setStep('profile');
    } catch (err: any) {
      setError(err?.message || 'Error verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  // ==========================================
  // Step 3: Submit Name & Password
  // ==========================================
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedName = name.trim();
    if (!trimmedName) {
      setError('Please enter your full name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match. Please check again.');
      return;
    }

    setLoading(true);
    const cleanMobile = mobile.replace(/\D/g, '').slice(-10);
    try {
      const res = await api.register({
        mobile: cleanMobile,
        name: trimmedName,
        password,
        role: selectedRole,
      });

      if (!res.success) {
        setError(res.message || 'Registration failed.');
        return;
      }

      // Store JWT token & user profile in localStorage
      if (typeof window !== 'undefined') {
        const userData = {
          ...(res.user || {}),
          name: trimmedName,
          mobile: cleanMobile,
          role: selectedRole,
          onboarding: { completed: true, role: selectedRole },
        };
        if (res.token) localStorage.setItem('draftmate_token', res.token);
        localStorage.setItem('draftmate_user', JSON.stringify(userData));
      }

      // Save onboarding role
      api.updateOnboarding({ role: selectedRole }).catch(() => {});

      // Direct immediately to the user's respective dashboard
      if (selectedRole === 'student') {
        router.push('/student');
      } else if (selectedRole === 'firm_admin') {
        router.push('/firm');
      } else if (selectedRole === 'citizen') {
        router.push('/citizen');
      } else {
        router.push('/advocate');
      }
    } catch (err: any) {
      setError(err?.message || 'Error creating account.');
    } finally {
      setLoading(false);
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

          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-slate-900 bg-white/70 hover:bg-white px-4 py-2 rounded-full border border-slate-200 transition-colors shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Home</span>
          </Link>
        </div>
      </header>

      {/* 3. Central Registration Card in Signature Parchment Theme */}
      <main className="relative z-20 w-full max-w-[560px] mx-auto px-4 sm:px-6 py-6 md:py-10 flex-1 flex flex-col justify-center">
        <div className="bg-[#FAF7F2]/96 backdrop-blur-md rounded-[28px] p-7 sm:p-10 border border-[#EFE8DC] shadow-2xl">
          
          {/* ============================================================== */}
          {/* STEP 1: MOBILE NUMBER                                          */}
          {/* ============================================================== */}
          {step === 'mobile' && (
            <div>
              {/* Header */}
              <div className="text-center mb-7">
                <div className="flex items-center justify-center gap-2.5 mb-2.5">
                  <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
                  <span className="text-xs tracking-[0.24em] font-semibold text-[#8C7355] uppercase">
                    STEP 1 OF 3
                  </span>
                  <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
                </div>

                <h1 className="font-serif-title text-3xl sm:text-[38px] font-bold text-[#0F172A] tracking-tight leading-tight">
                  Enter Your <span className="gold-gradient-text">Mobile</span>
                </h1>
                
                <p className="text-[#475569] text-sm sm:text-base mt-2 leading-relaxed font-normal">
                  We&apos;ll send an OTP to verify your mobile number.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSendOtp} className="space-y-5">
                
                {/* Mobile Number with +91 country code */}
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
                  <p className="text-xs text-[#64748B] mt-1.5 flex items-center gap-1 font-medium">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#8C7355]" />
                    Instant SMS verification code will be sent.
                  </p>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                {/* CTA Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F172A] disabled:opacity-75 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      Send OTP Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Login Link */}
              <div className="text-center mt-6 pt-5 border-t border-[#EAE3D7]">
                <p className="text-sm text-[#64748B]">
                  Already registered?{' '}
                  <Link href="/login" className="font-semibold text-[#0F172A] hover:text-[#C59B58] transition-colors underline decoration-[#C59B58] decoration-2 underline-offset-2">
                    Log in
                  </Link>
                </p>
              </div>
            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 2: 6-DIGIT OTP VERIFICATION                              */}
          {/* ============================================================== */}
          {step === 'otp' && (
            <div>
              {/* Header */}
              <div className="text-center mb-7">
                <div className="flex items-center justify-center gap-2.5 mb-2.5">
                  <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
                  <span className="text-xs tracking-[0.24em] font-semibold text-[#8C7355] uppercase">
                    STEP 2 OF 3
                  </span>
                  <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
                </div>

                <h1 className="font-serif-title text-3xl sm:text-[38px] font-bold text-[#0F172A] tracking-tight leading-tight">
                  Verify <span className="gold-gradient-text">OTP</span>
                </h1>
                
                <p className="text-[#475569] text-sm sm:text-base mt-2 leading-relaxed font-normal">
                  Enter the 6-digit code sent to{' '}
                  <span className="font-semibold text-[#0F172A] whitespace-nowrap">
                    +91 {mobile}
                  </span>
                </p>

                {/* Edit number option */}
                <button
                  type="button"
                  onClick={() => {
                    setStep('mobile');
                    setError('');
                  }}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-[#8C7355] hover:text-[#0F172A] mt-1.5 transition-colors"
                >
                  <Edit2 className="w-3 h-3" />
                  Change mobile number
                </button>
              </div>

              {/* OTP Form */}
              <form onSubmit={handleVerifyOtp} className="space-y-6">
                
                {/* 6 Digit Input Boxes */}
                <div className="flex items-center justify-center gap-2 sm:gap-3">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => {
                        otpInputsRef.current[idx] = el;
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={handlePaste}
                      className="w-11 h-14 sm:w-13 sm:h-16 text-center text-xl sm:text-2xl font-bold font-mono rounded-xl border border-[#E2E8F0] bg-white text-[#0F172A] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/25 shadow-2xs transition-all"
                    />
                  ))}
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium text-center animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                {/* Resend OTP Section */}
                <div className="text-center">
                  {canResend ? (
                    <button
                      type="button"
                      onClick={handleResendOtp}
                      className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#8C7355] hover:text-[#0F172A] transition-colors"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      Resend Verification Code
                    </button>
                  ) : (
                    <p className="text-xs sm:text-sm text-[#64748B]">
                      Resend code in{' '}
                      <span className="font-semibold text-[#0F172A] font-mono">
                        0:{timer < 10 ? `0${timer}` : timer}
                      </span>
                    </p>
                  )}
                </div>

                {/* Verify Code Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#0F172A] disabled:opacity-75 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Verifying Code...
                    </>
                  ) : (
                    <>
                      Verify Code
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>

                {/* Back to mobile link */}
                <div className="text-center">
                  <button
                    type="button"
                    onClick={() => {
                      setStep('mobile');
                      setError('');
                    }}
                    className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0F172A] transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Mobile Number
                  </button>
                </div>

              </form>

            </div>
          )}

          {/* ============================================================== */}
          {/* STEP 3: NAME & PASSWORD (POST OTP VERIFICATION)                */}
          {/* ============================================================== */}
          {step === 'profile' && (
            <div>
              {/* Header */}
              <div className="text-center mb-7">
                <div className="flex items-center justify-center gap-2.5 mb-2.5">
                  <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
                  <span className="text-xs tracking-[0.24em] font-semibold text-[#8C7355] uppercase">
                    STEP 3 OF 3
                  </span>
                  <span className="w-6 h-[1.5px] bg-[#C59B58] inline-block rounded-full" />
                </div>

                <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-green-50 text-green-700 border border-green-200 rounded-full text-xs font-semibold mb-3">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Phone verified: +91 {mobile}
                </div>

                <h1 className="font-serif-title text-3xl sm:text-[38px] font-bold text-[#0F172A] tracking-tight leading-tight">
                  Set Up Your <span className="gold-gradient-text">Profile</span>
                </h1>
                
                <p className="text-[#475569] text-sm sm:text-base mt-2 leading-relaxed font-normal">
                  Enter your full name and create a password for your account.
                </p>
              </div>

              {/* Profile Form */}
              <form onSubmit={handleProfileSubmit} className="space-y-4 sm:space-y-5">
                
                {/* Full Name */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                    Full Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C7355]">
                      <User className="w-5 h-5" />
                    </div>
                    <input
                      type="text"
                      autoFocus
                      value={name}
                      onChange={(e) => {
                        setName(e.target.value);
                        setError('');
                      }}
                      placeholder="e.g., Rajesh Sharma"
                      className="w-full pl-12 pr-4 py-3.5 bg-white/85 border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition-all shadow-2xs"
                    />
                  </div>
                </div>

                {/* Role / Account Persona Selection */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                    Select Your Role
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {[
                      { id: 'advocate', title: 'Advocate / Legal Pro', sub: 'Practice management & case drafts' },
                      { id: 'student', title: 'Law Student', sub: 'Moot court & legal studies' },
                      { id: 'firm_admin', title: 'Law Firm Member', sub: 'Multi-advocate firm & matters' },
                      { id: 'citizen', title: 'Non-Legal User', sub: 'Notices, leases & legal help' },
                    ].map((r) => {
                      const isSel = selectedRole === r.id;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => setSelectedRole(r.id as any)}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            isSel
                              ? 'bg-[#EBF2FC] border-[#1E3A8A] ring-1 ring-[#1E3A8A] text-[#1E3A8A]'
                              : 'bg-white/80 border-[#DECDB8] hover:border-[#C59B58] text-[#475569]'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-xs sm:text-[13px] font-bold text-[#0F172A] block leading-tight">
                              {r.title}
                            </span>
                            {isSel && <CheckCircle2 className="w-3.5 h-3.5 text-[#1E3A8A] shrink-0" />}
                          </div>
                          <span className="text-[10px] text-[#64748B] block mt-0.5 leading-snug">
                            {r.sub}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Password Field */}
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
                      placeholder="Minimum 6 characters"
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

                {/* Confirm Password Field */}
                <div>
                  <label className="block text-[15px] font-semibold text-[#0F172A] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#8C7355]">
                      <Lock className="w-5 h-5" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        setError('');
                      }}
                      placeholder="Re-enter your password"
                      className="w-full pl-12 pr-12 py-3.5 bg-white/85 border border-[#E2E8F0] rounded-xl text-base text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#C59B58] focus:ring-2 focus:ring-[#C59B58]/20 transition-all shadow-2xs"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                      tabIndex={-1}
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-xs sm:text-sm font-medium animate-in fade-in duration-150">
                    {error}
                  </div>
                )}

                {/* Complete Registration Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#0F172A] disabled:opacity-75 disabled:cursor-not-allowed text-white py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-base font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#1E293B] shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 active:translate-y-0"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Creating Account...
                      </>
                    ) : (
                      <>
                        Complete Registration & Continue
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>

              </form>

            </div>
          )}

        </div>
      </main>

      {/* Bottom spacing */}
      <div className="relative z-20 py-3" />
    </div>
  );
}
