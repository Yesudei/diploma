import dynamic from 'next/dynamic';
import Pricing from '@/components/sections/Pricing';

const Nav = dynamic(() => import('@/components/layout/Nav'), { ssr: false });

export default function PlansPage() {
  return (
    <>
      <Nav />
      <main className="min-h-screen bg-[#0A0A0F] pt-[72px]">
        <Pricing />
      </main>
    </>
  );
}

