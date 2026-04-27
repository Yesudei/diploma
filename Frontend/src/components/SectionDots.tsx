'use client';

import { useEffect, useState } from 'react';

type SectionDotsProps = {
  sections: string[];
};

export default function SectionDots({ sections }: SectionDotsProps) {
  const [activeSection, setActiveSection] = useState<string>(sections[0] ?? '');

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const sectionElements = sections
      .map((sectionId) => document.getElementById(sectionId))
      .filter((element): element is HTMLElement => element !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionElements.forEach((element) => observer.observe(element));

    return () => {
      observer.disconnect();
    };
  }, [sections]);

  const handleDotClick = (sectionId: string) => {
    const section = document.getElementById(sectionId);
    if (!section) {
      return;
    }

    section.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <aside className="fixed right-7 top-1/2 z-[95] flex -translate-y-1/2 flex-col items-center gap-3">
      {sections.map((sectionId) => {
        const isActive = sectionId === activeSection;

        return (
          <button
            key={sectionId}
            type="button"
            onClick={() => handleDotClick(sectionId)}
            aria-label={`Go to ${sectionId}`}
            className="block transition-all duration-200"
            style={{
              width: '4px',
              height: isActive ? '24px' : '4px',
              borderRadius: isActive ? '2px' : '999px',
              background: isActive ? 'var(--gold)' : 'var(--text-dim)',
            }}
          />
        );
      })}
    </aside>
  );
}
