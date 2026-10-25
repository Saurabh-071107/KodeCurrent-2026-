'use client';

import React, { useEffect, useState } from 'react';
import StudentDashboardPage from '../student/page';
import AdvocateDashboardPage from '../advocate/page';
import FirmDashboardPage from '../firm/page';
import CitizenDashboardPage from '../citizen/page';

export default function DashboardPage() {
  const [role, setRole] = useState<'firm' | 'advocate' | 'student' | 'citizen'>('advocate');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('draftmate_user');
        if (stored) {
          const parsed = JSON.parse(stored);
          const r = parsed.role || parsed.onboarding?.role;
          if (r === 'firm' || r === 'firm_admin') {
            setRole('firm');
          } else if (r === 'student') {
            setRole('student');
          } else if (r === 'citizen') {
            setRole('citizen');
          } else {
            setRole('advocate');
          }
        }
      } catch (e) {
        console.error('Failed to read user role', e);
      }
    }
  }, []);

  if (!mounted) {
    return <AdvocateDashboardPage />;
  }

  if (role === 'firm') {
    return <FirmDashboardPage />;
  }

  if (role === 'student') {
    return <StudentDashboardPage />;
  }

  if (role === 'citizen') {
    return <CitizenDashboardPage />;
  }

  return <AdvocateDashboardPage />;
}

