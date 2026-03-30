'use client';

import { useEffect } from 'react';
import Nav from '@/components/layout/Nav';
import Footer from '@/components/layout/Footer';
import Hero from '@/components/sections/Hero';
import Features from '@/components/sections/Features';
import Teachers from '@/components/sections/Teachers';
import Pricing from '@/components/sections/Pricing';
import CTA from '@/components/sections/CTA';

export default function HomePage() {
  useEffect(() => {
    console.log('🏠 Home page loaded');
  }, []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <Teachers />
        <Pricing />
        <CTA />
      </main>
      <Footer />
    </>
  );
}
