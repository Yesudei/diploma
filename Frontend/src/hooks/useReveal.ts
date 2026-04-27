'use client';

import { useCallback, useEffect, useState } from 'react';
import type { RefCallback } from 'react';

type RevealHookResult<T extends HTMLElement> = {
  ref: RefCallback<T>;
  isVisible: boolean;
};

export function useReveal<T extends HTMLElement>(): RevealHookResult<T> {
  const [node, setNode] = useState<T | null>(null);
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const ref = useCallback<RefCallback<T>>((element) => {
    setNode(element);
  }, []);

  useEffect(() => {
    if (!node || typeof window === 'undefined') {
      return;
    }

    const fallbackTimer = window.setTimeout(() => {
      setIsVisible(true);
    }, 1200);

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            window.clearTimeout(fallbackTimer);
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.05 }
    );

    observer.observe(node);

    return () => {
      window.clearTimeout(fallbackTimer);
      observer.disconnect();
    };
  }, [node]);

  return { ref, isVisible };
}
