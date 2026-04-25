'use client';

import * as React from 'react';
import { useEffect, useRef } from 'react';
import { createNoise2D } from 'simplex-noise';

interface Point {
  x: number;
  y: number;
  wave: { x: number; y: number };
  cursor: {
    x: number;
    y: number;
    vx: number;
    vy: number;
  };
}

interface WavesProps {
  className?: string;
  strokeColor?: string;
  backgroundColor?: string;
  pointerSize?: number;
  quality?: 'auto' | 'full' | 'balanced' | 'lite';
}

interface WaveProfile {
  fpsCap: number;
  xGap: number;
  yGap: number;
  cursorForceScale: number;
  maxCursorDisplacement: number;
  pointerSmoothing: number;
  pointerInteraction: boolean;
}

const WAVE_PROFILES: Record<'full' | 'balanced' | 'lite', WaveProfile> = {
  full: {
    fpsCap: 55,
    xGap: 10,
    yGap: 10,
    cursorForceScale: 1,
    maxCursorDisplacement: 50,
    pointerSmoothing: 0.34,
    pointerInteraction: true,
  },
  balanced: {
    fpsCap: 48,
    xGap: 14,
    yGap: 14,
    cursorForceScale: 0.75,
    maxCursorDisplacement: 36,
    pointerSmoothing: 0.3,
    pointerInteraction: true,
  },
  lite: {
    fpsCap: 24,
    xGap: 18,
    yGap: 18,
    cursorForceScale: 0.4,
    maxCursorDisplacement: 24,
    pointerSmoothing: 0.14,
    pointerInteraction: false,
  },
};

export function Waves({
  className = '',
  strokeColor = '#ffffff',
  backgroundColor = '#000000',
  pointerSize = 0.5,
  quality = 'auto',
}: WavesProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const mouseRef = useRef({
    x: -10,
    y: 0,
    lx: 0,
    ly: 0,
    sx: 0,
    sy: 0,
    v: 0,
    vs: 0,
    a: 0,
    set: false,
  });
  const pathsRef = useRef<SVGPathElement[]>([]);
  const linesRef = useRef<Point[][]>([]);
  const noiseRef = useRef<((x: number, y: number) => number) | null>(null);
  const rafRef = useRef<number | null>(null);
  const boundingRef = useRef<DOMRect | null>(null);
  const profileRef = useRef<WaveProfile>(WAVE_PROFILES.balanced);
  const reducedMotionRef = useRef(false);
  const isDocumentVisibleRef = useRef(true);
  const isInViewRef = useRef(true);
  const lastFrameTimeRef = useRef(0);

  const setSize = () => {
    if (!containerRef.current || !svgRef.current) return;

    boundingRef.current = containerRef.current.getBoundingClientRect();
    const { width, height } = boundingRef.current;
    if (width <= 0 || height <= 0) return;

    svgRef.current.style.width = `${width}px`;
    svgRef.current.style.height = `${height}px`;
  };

  const setLines = () => {
    if (!svgRef.current || !boundingRef.current) return;

    const { width, height } = boundingRef.current;
    linesRef.current = [];

    pathsRef.current.forEach((path) => {
      path.remove();
    });
    pathsRef.current = [];

    const { xGap, yGap } = profileRef.current;

    const oWidth = width + xGap * 12;
    const oHeight = height + yGap * 4;

    const totalLines = Math.ceil(oWidth / xGap);
    const totalPoints = Math.ceil(oHeight / yGap);

    const xStart = (width - xGap * totalLines) / 2;
    const yStart = (height - yGap * totalPoints) / 2;

    for (let i = 0; i < totalLines; i++) {
      const points: Point[] = [];

      for (let j = 0; j < totalPoints; j++) {
        points.push({
          x: xStart + xGap * i,
          y: yStart + yGap * j,
          wave: { x: 0, y: 0 },
          cursor: { x: 0, y: 0, vx: 0, vy: 0 },
        });
      }

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.classList.add('a__line', 'js-line');
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', strokeColor);
      path.setAttribute('stroke-width', '1');
      path.setAttribute('stroke-opacity', '0.45');

      svgRef.current.appendChild(path);
      pathsRef.current.push(path);
      linesRef.current.push(points);
    }
  };

  const updateMousePosition = (x: number, y: number) => {
    if (!boundingRef.current) return;

    const mouse = mouseRef.current;
    mouse.x = x - boundingRef.current.left;
    mouse.y = y - boundingRef.current.top;

    if (!mouse.set) {
      mouse.sx = mouse.x;
      mouse.sy = mouse.y;
      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.set = true;
    }

    if (containerRef.current) {
      containerRef.current.style.setProperty('--x', `${mouse.x}px`);
      containerRef.current.style.setProperty('--y', `${mouse.y}px`);
    }
  };

  const movePoints = (time: number) => {
    const { current: lines } = linesRef;
    const { current: mouse } = mouseRef;
    const { current: noise } = noiseRef;
    const { cursorForceScale, maxCursorDisplacement, pointerInteraction } = profileRef.current;
    const hasCursorInteraction = pointerInteraction && mouse.set;

    if (!noise) return;

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
      const points = lines[lineIndex];
      for (let pointIndex = 0; pointIndex < points.length; pointIndex++) {
        const p = points[pointIndex];
        const move = noise((p.x + time * 0.008) * 0.003, (p.y + time * 0.003) * 0.002) * 8;

        p.wave.x = Math.cos(move) * 12;
        p.wave.y = Math.sin(move) * 6;

        if (hasCursorInteraction) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const d = Math.hypot(dx, dy);
          const l = Math.max(175, mouse.vs);

          if (d < l) {
            const s = 1 - d / l;
            const f = Math.cos(d * 0.001) * s;

            p.cursor.vx += Math.cos(mouse.a) * f * l * mouse.vs * 0.00035 * cursorForceScale;
            p.cursor.vy += Math.sin(mouse.a) * f * l * mouse.vs * 0.00035 * cursorForceScale;
          }
        }

        p.cursor.vx += (0 - p.cursor.x) * 0.01;
        p.cursor.vy += (0 - p.cursor.y) * 0.01;

        p.cursor.vx *= 0.95;
        p.cursor.vy *= 0.95;

        p.cursor.x += p.cursor.vx;
        p.cursor.y += p.cursor.vy;

        p.cursor.x = Math.min(maxCursorDisplacement, Math.max(-maxCursorDisplacement, p.cursor.x));
        p.cursor.y = Math.min(maxCursorDisplacement, Math.max(-maxCursorDisplacement, p.cursor.y));
      }
    }
  };

  const moved = (point: Point, withCursorForce = true) => ({
    x: point.x + point.wave.x + (withCursorForce ? point.cursor.x : 0),
    y: point.y + point.wave.y + (withCursorForce ? point.cursor.y : 0),
  });

  const drawLines = () => {
    const { current: lines } = linesRef;
    const { current: paths } = pathsRef;

    for (let lIndex = 0; lIndex < lines.length; lIndex++) {
      const points = lines[lIndex];
      if (points.length < 2 || !paths[lIndex]) continue;

      const firstPoint = moved(points[0], false);
      let d = `M ${firstPoint.x} ${firstPoint.y}`;

      for (let i = 1; i < points.length; i++) {
        const current = moved(points[i]);
        d += ` L ${current.x} ${current.y}`;
      }

      paths[lIndex].setAttribute('d', d);
    }
  };

  const tick = (time: number) => {
    const minFrameTime = 1000 / profileRef.current.fpsCap;
    if (time - lastFrameTimeRef.current < minFrameTime) {
      rafRef.current = requestAnimationFrame(tick);
      return;
    }
    lastFrameTimeRef.current = time;

    const { current: mouse } = mouseRef;

    if (mouse.set) {
      const smoothing = profileRef.current.pointerSmoothing;
      mouse.sx += (mouse.x - mouse.sx) * smoothing;
      mouse.sy += (mouse.y - mouse.sy) * smoothing;

      const dx = mouse.x - mouse.lx;
      const dy = mouse.y - mouse.ly;
      const d = Math.hypot(dx, dy);

      mouse.v = d;
      mouse.vs += (d - mouse.vs) * 0.1;
      mouse.vs = Math.min(100, mouse.vs);

      mouse.lx = mouse.x;
      mouse.ly = mouse.y;
      mouse.a = Math.atan2(dy, dx);

      if (containerRef.current) {
        containerRef.current.style.setProperty('--x', `${mouse.x}px`);
        containerRef.current.style.setProperty('--y', `${mouse.y}px`);
      }
    }

    movePoints(time);
    drawLines();

    rafRef.current = requestAnimationFrame(tick);
  };

  useEffect(() => {
    if (!containerRef.current || !svgRef.current) return;

    const resolveProfile = () => {
      if (quality !== 'auto') {
        reducedMotionRef.current = false;
        profileRef.current = WAVE_PROFILES[quality];
        return;
      }

      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      const reducedMotion = media.matches;
      const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobile = hasTouch && window.innerWidth < 768;
      const cores = navigator.hardwareConcurrency ?? 6;
      const nav = navigator as Navigator & { connection?: { saveData?: boolean } };
      const saveData = Boolean(nav.connection?.saveData);

      reducedMotionRef.current = reducedMotion;

      if (reducedMotion || saveData || isMobile) {
        profileRef.current = WAVE_PROFILES.lite;
        return;
      }

      if (cores <= 4) {
        profileRef.current = WAVE_PROFILES.balanced;
        return;
      }

      profileRef.current = WAVE_PROFILES.full;
    };

    const startAnimation = () => {
      if (reducedMotionRef.current) return;
      if (!isDocumentVisibleRef.current || !isInViewRef.current) return;
      if (rafRef.current !== null) return;
      lastFrameTimeRef.current = performance.now();
      rafRef.current = requestAnimationFrame(tick);
    };

    const stopAnimation = () => {
      if (rafRef.current === null) return;
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };

    const onResize = () => {
      resolveProfile();
      setSize();
      setLines();
      drawLines();
      startAnimation();
    };

    const onVisibilityChange = () => {
      isDocumentVisibleRef.current = !document.hidden;
      if (isDocumentVisibleRef.current) {
        startAnimation();
        return;
      }
      stopAnimation();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (!profileRef.current.pointerInteraction) return;
      if (!event.isPrimary) return;
      updateMousePosition(event.clientX, event.clientY);
    };

    let observer: IntersectionObserver | null = null;

    resolveProfile();
    noiseRef.current = createNoise2D();

    setSize();
    setLines();
    drawLines();

    const container = containerRef.current;

    window.addEventListener('resize', onResize);
    document.addEventListener('visibilitychange', onVisibilityChange);

    window.addEventListener('pointermove', onPointerMove, { passive: true });

    if ('IntersectionObserver' in window) {
      observer = new IntersectionObserver(
        (entries) => {
          const [entry] = entries;
          if (!entry) return;
          isInViewRef.current = entry.isIntersecting && entry.intersectionRatio >= 0.05;
          if (isInViewRef.current) {
            startAnimation();
            return;
          }
          stopAnimation();
        },
        { threshold: [0, 0.05, 0.2], rootMargin: '0px' }
      );

      observer.observe(container);
    }

    startAnimation();

    return () => {
      stopAnimation();
      window.removeEventListener('resize', onResize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      window.removeEventListener('pointermove', onPointerMove);
      observer?.disconnect();
    };
  }, [quality, strokeColor]); // eslint-disable-line react-hooks/exhaustive-deps

  const waveStyle: React.CSSProperties & Record<'--x' | '--y', string> = {
    backgroundColor,
    position: 'absolute',
    top: 0,
    left: 0,
    margin: 0,
    padding: 0,
    width: '100%',
    height: '100%',
    overflow: 'hidden',
    '--x': '-0.5rem',
    '--y': '50%',
  };

  return (
    <div
      ref={containerRef}
      className={`waves-component relative overflow-hidden ${className}`}
      style={waveStyle}
    >
      <svg ref={svgRef} className="block h-full w-full js-svg" xmlns="http://www.w3.org/2000/svg" />
      <div
        className="pointer-dot"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: `${pointerSize}rem`,
          height: `${pointerSize}rem`,
          background: strokeColor,
          borderRadius: '50%',
          transform: 'translate3d(calc(var(--x) - 50%), calc(var(--y) - 50%), 0)',
          willChange: 'transform',
          opacity: 0.9,
        }}
      />
    </div>
  );
}
