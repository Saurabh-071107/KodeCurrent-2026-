'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Home,
  FileText,
  Briefcase,
  Languages,
  BookOpen,
  Sliders,
  Users,
  Sparkles,
  Scale,
  X,
  ChevronDown,
  GraduationCap,
  Gavel,
  PenTool,
  Award,
  Library
} from 'lucide-react';

export interface NavSubItem {
  name: string;
  icon: React.ReactNode;
  href: string;
}

export interface NavItem {
  name: string;
  icon: React.ReactNode;
  href: string;
  children?: NavSubItem[];
}

const BARE_ACT_ALIASES = ['bare ai', 'bar ai', 'bare act ai', 'bar act ai', 'bare acts ai', 'bare act', 'bare acts', 'bar acts'];
const CASE_ALIASES = ['case tracker', 'followed cases', 'my cases', 'cases'];
const HOME_ALIASES = ['home', 'dashboard'];
const RESEARCH_ALIASES = ['legal research', 'research', 'legal assistant'];
const CLIENT_ALIASES = ['client management', 'client', 'clients'];
const AI_ALIASES = ['nexora ai', 'nexora', 'ai', 'ai assistant'];
const CITATION_ALIASES = [
  'document review & verification',
  'document review',
  'document verification',
  'citation review',
  'citation',
  'citations',
  'verification'
];

interface SidebarProps {
  activeNav?: string;
  onSelectNav?: (name: string) => void;
  dashboardHref?: string;
  rolePrefix?: string;
}

export default function Sidebar({
  activeNav = 'Drafting Studio',
  onSelectNav,
  dashboardHref = '/dashboard',
  rolePrefix
}: SidebarProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openDropdowns, setOpenDropdowns] = useState<Record<string, boolean>>({});
  const pathname = usePathname();

  const toggleDropdown = (name: string) => {
    setOpenDropdowns((prev) => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  // Derive role prefix from explicit prop or dashboardHref (e.g., '/student', '/advocate')
  const prefix = rolePrefix || (dashboardHref && dashboardHref !== '/dashboard' ? dashboardHref : '');
  const isStudent = prefix === '/student' || dashboardHref === '/student';
  const isCitizen = prefix === '/citizen' || dashboardHref === '/citizen';

  const navItems: NavItem[] = isStudent
    ? [
        { name: 'Home', icon: <Home className="w-5 h-5" />, href: '/student' },
        {
          name: 'Student Center',
          icon: <GraduationCap className="w-5 h-5" />,
          href: '/student/student-center',
          children: [
            { name: 'AI live Courtroom', icon: <Gavel className="w-4 h-4" />, href: '/student/courtroom' },
            { name: 'Moot Memorial Lab', icon: <PenTool className="w-4 h-4" />, href: '/student/moot-memorial' },
            { name: 'Exam & Moot Preparation', icon: <GraduationCap className="w-4 h-4" />, href: '/student/exam-prep' },
            { name: 'Internship & Career Hub', icon: <Briefcase className="w-4 h-4" />, href: '/student/career-hub' },
            { name: 'Certifications & Leaderboards', icon: <Award className="w-4 h-4" />, href: '/student/certifications' },
          ]
        },
        { name: 'Legal Research', icon: <BookOpen className="w-5 h-5" />, href: '/student/legal-research' },
        {
          name: 'Legal Library',
          icon: <Library className="w-5 h-5" />,
          href: '/student/legal-library',
          children: [
            { name: 'Bare AI', icon: <BookOpen className="w-4 h-4" />, href: '/student/legal-library/bare-acts' },
            { name: 'Legal Dictionary', icon: <Scale className="w-4 h-4" />, href: '/student/legal-library/dictionary' },
            { name: 'Legal Forms', icon: <FileText className="w-4 h-4" />, href: '/student/legal-library/forms' },
            { name: 'Judgment Library', icon: <Gavel className="w-4 h-4" />, href: '/student/legal-library/judgments' },
          ]
        },
        { name: 'Drafting Studio', icon: <FileText className="w-5 h-5" />, href: '/student/drafting-studio' },
        { name: 'Document Verification', icon: <Scale className="w-5 h-5" />, href: '/student/document-verification' },
        { name: 'Followed Cases', icon: <Briefcase className="w-5 h-5" />, href: '/student/case-tracker' },
        { name: 'Translation', icon: <Languages className="w-5 h-5" />, href: '/student/translation' },
      ]
    : isCitizen
    ? [
        { name: 'Dashboard', icon: <Home className="w-5 h-5" />, href: '/citizen' },
        { name: 'Legal Research', icon: <BookOpen className="w-5 h-5" />, href: '/citizen/legal-research' },
        {
          name: 'Legal Library',
          icon: <Library className="w-5 h-5" />,
          href: '/citizen/legal-library',
          children: [
            { name: 'Bare AI', icon: <BookOpen className="w-4 h-4" />, href: '/citizen/legal-library/bare-acts' },
            { name: 'Legal Dictionary', icon: <Scale className="w-4 h-4" />, href: '/citizen/legal-library/dictionary' },
            { name: 'Legal Forms', icon: <FileText className="w-4 h-4" />, href: '/citizen/legal-library/forms' },
            { name: 'Judgment Library', icon: <Gavel className="w-4 h-4" />, href: '/citizen/legal-library/judgments' },
          ]
        },
        { name: 'Drafting Studio', icon: <FileText className="w-5 h-5" />, href: '/citizen/drafting-studio' },
        { name: 'Document Verification', icon: <Scale className="w-5 h-5" />, href: '/citizen/document-verification' },
        { name: 'My Cases', icon: <Briefcase className="w-5 h-5" />, href: '/citizen/case-tracker' },
        { name: 'Translation', icon: <Languages className="w-5 h-5" />, href: '/citizen/translation' },
      ]
    : [
        { name: 'Dashboard', icon: <Home className="w-5 h-5" />, href: dashboardHref },
        { name: 'Nexora AI', icon: <Sparkles className="w-5 h-5" />, href: prefix ? `${prefix}/nexora-ai` : '/nexora-ai' },
        { name: 'Drafting Studio', icon: <FileText className="w-5 h-5" />, href: prefix ? `${prefix}/drafting-studio` : '/drafting-studio' },
        { name: 'Case Tracker', icon: <Briefcase className="w-5 h-5" />, href: prefix ? `${prefix}/case-tracker` : '/case-tracker' },
        { name: 'Client Management', icon: <Users className="w-5 h-5" />, href: prefix ? `${prefix}/client-management` : '/client-management' },
        { name: 'Document Verification', icon: <Scale className="w-5 h-5" />, href: prefix ? `${prefix}/document-verification` : '/document-verification' },
        { name: 'Legal Research', icon: <BookOpen className="w-5 h-5" />, href: prefix ? `${prefix}/legal-research` : '/legal-research' },
        {
          name: 'Legal Library',
          icon: <Library className="w-5 h-5" />,
          href: prefix ? `${prefix}/legal-library` : '/legal-library',
          children: [
            { name: 'Bare AI', icon: <BookOpen className="w-4 h-4" />, href: prefix ? `${prefix}/legal-library/bare-acts` : '/legal-library/bare-acts' },
            { name: 'Legal Dictionary', icon: <Scale className="w-4 h-4" />, href: prefix ? `${prefix}/legal-library/dictionary` : '/legal-library/dictionary' },
            { name: 'Legal Forms', icon: <FileText className="w-4 h-4" />, href: prefix ? `${prefix}/legal-library/forms` : '/legal-library/forms' },
            { name: 'Judgment Library', icon: <Gavel className="w-4 h-4" />, href: prefix ? `${prefix}/legal-library/judgments` : '/legal-library/judgments' },
          ]
        },
        { name: 'Translation', icon: <Languages className="w-5 h-5" />, href: prefix ? `${prefix}/translation` : '/translation' },
      ];

  const isSubItemActive = (child: NavSubItem) => {
    if (activeNav && activeNav.toLowerCase() === child.name.toLowerCase()) return true;
    if (activeNav && BARE_ACT_ALIASES.includes(activeNav.toLowerCase()) && BARE_ACT_ALIASES.includes(child.name.toLowerCase())) return true;
    if (pathname) {
      if (pathname === child.href) return true;
      if (
        child.href !== '/student' &&
        child.href !== '/citizen' &&
        child.href !== '/legal-library' &&
        child.href !== '/student/legal-library' &&
        child.href !== '/citizen/legal-library' &&
        pathname.startsWith(child.href)
      ) {
        return true;
      }
      if ((pathname.includes('bare-act') || pathname.includes('bare-acts') || pathname.includes('bare-ai')) && (child.href.includes('bare-act') || child.href.includes('bare-ai'))) {
        if (child.href.includes('legal-library') && pathname.includes('legal-library')) return true;
        if (!child.href.includes('legal-library') && !pathname.includes('legal-library')) return true;
      }
    }
    return false;
  };

  const isItemActive = (item: NavItem) => {
    // 1. Direct activeNav string match
    if (activeNav && activeNav.toLowerCase() === item.name.toLowerCase()) return true;

    // 2. Child active check
    if (item.children && item.children.some((c) => isSubItemActive(c))) {
      return true;
    }

    // 3. Alias matchings
    const lowerName = item.name.toLowerCase();
    const lowerNav = activeNav ? activeNav.toLowerCase() : '';

    if (lowerNav && (
      (CASE_ALIASES.includes(lowerNav) && CASE_ALIASES.includes(lowerName)) ||
      (HOME_ALIASES.includes(lowerNav) && HOME_ALIASES.includes(lowerName)) ||
      (RESEARCH_ALIASES.includes(lowerNav) && RESEARCH_ALIASES.includes(lowerName)) ||
      (CLIENT_ALIASES.includes(lowerNav) && CLIENT_ALIASES.includes(lowerName)) ||
      (AI_ALIASES.includes(lowerNav) && AI_ALIASES.includes(lowerName)) ||
      (CITATION_ALIASES.includes(lowerNav) && CITATION_ALIASES.includes(lowerName)) ||
      (BARE_ACT_ALIASES.includes(lowerNav) && BARE_ACT_ALIASES.includes(lowerName))
    )) {
      return true;
    }

    // 4. Current URL pathname matching
    if (pathname) {
      if (pathname === item.href) return true;
      if (
        item.href !== '/' &&
        item.href !== '/student' &&
        item.href !== '/advocate' &&
        item.href !== '/citizen' &&
        item.href !== '/firm' &&
        item.href !== '/dashboard' &&
        pathname.startsWith(item.href)
      ) {
        return true;
      }
      if ((pathname.includes('case-tracker') || pathname.includes('casetracker')) && CASE_ALIASES.includes(lowerName)) {
        return true;
      }
      if (pathname.includes('legal-research') && RESEARCH_ALIASES.includes(lowerName)) {
        return true;
      }
      if ((pathname.includes('client-management') || pathname.includes('clientmanagement')) && CLIENT_ALIASES.includes(lowerName)) {
        return true;
      }
      if ((pathname.includes('nexora-ai') || pathname.includes('nexoraai')) && AI_ALIASES.includes(lowerName)) {
        return true;
      }
      if (
        (pathname.includes('document-verification') ||
          pathname.includes('citation-review') ||
          pathname.includes('citation')) &&
        CITATION_ALIASES.includes(lowerName)
      ) {
        return true;
      }
      if (
        (pathname.includes('bare-acts-ai') || pathname.includes('bare-act-ai') || pathname.includes('bare-act')) &&
        BARE_ACT_ALIASES.includes(lowerName)
      ) {
        return true;
      }
    }

    return false;
  };

  return (
    <aside className="w-full xl:w-[268px] xl:h-screen bg-[#FAF8F5] border-r border-[#EAE3D6] font-sans flex flex-col justify-between p-4 sm:p-5 xl:fixed xl:inset-y-0 xl:left-0 z-40 select-none overflow-y-auto scrollbar-none">
      <div>
        {/* Logo Brand Header: Nexora Logo */}
        <div className="flex items-center justify-between pb-5 pt-1 px-2 border-b border-[#EAE3D6]">
          <Link href={dashboardHref} className="flex items-center gap-3.5 group">
            <div className="relative w-11 h-10 overflow-hidden flex-shrink-0">
              <Image
                src="/assets/nexora-logo.png"
                alt="Nexora Logo"
                width={160}
                height={160}
                priority
                className="absolute top-0 left-1/2 -translate-x-1/2 w-13 h-auto object-cover object-top max-w-none transform transition-transform group-hover:scale-105"
              />
            </div>
            <div className="flex flex-col">
              <span className="font-brand text-2xl font-bold tracking-[0.16em] text-[#0F172A] leading-none">
                NEXORA
              </span>
              <span className="text-[10px] tracking-[0.2em] font-medium text-[#8C7355] uppercase mt-1 leading-none">
                LAW MADE SIMPLE
              </span>
            </div>
          </Link>

          {/* Mobile Hamburger Button */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-1.5 rounded-lg text-slate-700 hover:bg-[#EFE8DC]"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Sliders className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation Links with identical size (15px) and styling as Home */}
        <nav className={`mt-5 space-y-1 ${mobileMenuOpen ? 'block' : 'hidden xl:block'}`}>
          {navItems.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isAnyChildActive = hasChildren && item.children!.some((c) => isSubItemActive(c));
            const isActive = isItemActive(item) || isAnyChildActive;

            if (hasChildren) {
              const isOpen = openDropdowns[item.name] ?? false;
              return (
                <div key={item.name} className="space-y-1">
                  <button
                    type="button"
                    onClick={() => toggleDropdown(item.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-all relative text-left cursor-pointer ${
                      isActive
                        ? 'bg-[#EBF2FC] text-[#1E3A8A] font-bold shadow-2xs'
                        : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F2ECE1]/70'
                    }`}
                  >
                    {/* Left Active Indicator Bar (Signature Blue Pill) */}
                    {isActive && (
                      <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#1E3A8A] rounded-r-md" />
                    )}
                    <div className="flex items-center gap-3.5">
                      <span className={`${isActive ? 'text-[#1E3A8A]' : 'text-[#64748B]'}`}>
                        {item.icon}
                      </span>
                      <span>{item.name}</span>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[#64748B] transition-transform duration-200 ${
                        isOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Children */}
                  {isOpen && (
                    <div className="ml-5 pl-3 border-l-2 border-[#EAE3D6] space-y-1 pt-1 pb-1 animate-in fade-in duration-150">
                      {item.children!.map((child) => {
                        const childActive = isSubItemActive(child);
                        return (
                          <Link
                            key={child.name}
                            href={child.href}
                            onClick={() => {
                              if (onSelectNav) onSelectNav(child.name);
                              setMobileMenuOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-semibold transition-all text-left ${
                              childActive
                                ? 'bg-[#1E3A8A] text-white shadow-xs font-bold'
                                : 'text-[#64748B] hover:text-[#1E3A8A] hover:bg-[#F2ECE1]/80'
                            }`}
                          >
                            <span className={`${childActive ? 'text-white' : 'text-[#C59B58]'}`}>
                              {child.icon}
                            </span>
                            <span className="truncate">{child.name}</span>
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => {
                  if (onSelectNav) onSelectNav(item.name);
                  setMobileMenuOpen(false);
                }}
                className={`w-full flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-[15px] font-semibold transition-all relative text-left ${
                  isActive
                    ? 'bg-[#EBF2FC] text-[#1E3A8A] font-bold shadow-2xs'
                    : 'text-[#475569] hover:text-[#0F172A] hover:bg-[#F2ECE1]/70'
                }`}
              >
                {/* Left Active Indicator Bar (Signature Blue Pill) */}
                {isActive && (
                  <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1.5 h-6 bg-[#1E3A8A] rounded-r-md" />
                )}
                <span className={`${isActive ? 'text-[#1E3A8A]' : 'text-[#64748B]'}`}>
                  {item.icon}
                </span>
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Sidebar Bottom: Supreme Court Engraving (Enlarged) */}
      <div className="hidden xl:flex flex-col items-center text-center pt-3 pb-2 px-1 border-t border-[#EAE3D6]/70 mt-auto">
        <div className="relative w-full h-36 sm:h-44 md:h-48 opacity-95">
          <Image
            src="/assets/supreme-court-engraving.png"
            alt="Supreme Court of India"
            fill
            className="object-contain object-bottom mix-blend-multiply"
          />
        </div>
        <span className="text-[10px] tracking-[0.25em] font-serif font-bold text-[#8C7355] uppercase mt-2">
          CONSTITUTION OF INDIA
        </span>
      </div>
    </aside>
  );
}
