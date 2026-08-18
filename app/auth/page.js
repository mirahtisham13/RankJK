'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import AuthModal from '@/components/AuthModal';

function AuthContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const defaultTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  return (
    <div style={{ minHeight: 'calc(100vh - 200px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <AuthModal
        defaultTab={defaultTab}
        onSuccess={() => router.push('/')}
      />
    </div>
  );
}

export default function AuthPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: '80vh' }} />}>
        <AuthContent />
      </Suspense>
      <Footer />
    </>
  );
}
