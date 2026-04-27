import Nav from '@/components/Nav';
import SectionDots from '@/components/SectionDots';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import ChatButton from '@/components/ChatButton';
import LearningPathSection from '@/components/LearningPathSection';
import LandingFooter from '@/components/LandingFooter';

const sectionIds: string[] = ['hero', 'path', 'features'];

export default function HomePage() {
  return (
    <>
      <Nav />
      <SectionDots sections={sectionIds} />

      <main
        id="landing-scroll-container"
        className="landing-scroll-container relative z-10 bg-transparent"
      >
        <HeroSection id="hero" />
        <LearningPathSection id="path" />
        <FeaturesSection id="features" />
        <div className="shrink-0" style={{ scrollSnapAlign: 'end' }}>
          <LandingFooter />
        </div>
      </main>

      <ChatButton />
    </>
  );
}
