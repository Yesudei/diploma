'use client';

import dynamic from 'next/dynamic';

const Hero = dynamic(() => import('@/components/sections/Hero'), { ssr: false });
const Features = dynamic(() => import('@/components/sections/Features'), { ssr: false });
const Teachers = dynamic(() => import('@/components/sections/Teachers'), { ssr: false });
const Pricing = dynamic(() => import('@/components/sections/Pricing'), { ssr: false });
const CTA = dynamic(() => import('@/components/sections/CTA'), { ssr: false });
const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: false });

export default function HomePage() {
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
