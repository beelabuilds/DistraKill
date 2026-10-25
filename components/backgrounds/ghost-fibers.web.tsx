import { useEffect, useRef } from 'react';

import type { ThemeMode } from '@/constants/auth-theme';

type GhostFibersProps = {
  mode: ThemeMode;
};

type FiberPoint = {
  x: number;
  y: number;
  phase: number;
  speed: number;
};

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

export default function GhostFibers({ mode }: GhostFibersProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modeRef = useRef(mode);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    if (!context) return;

    let animationFrame = 0;
    let isVisible = true;
    let width = 0;
    let height = 0;
    let points: FiberPoint[] = [];
    const reducedMotion = prefersReducedMotion();

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      width = Math.max(1, bounds.width);
      height = Math.max(1, bounds.height);
      canvas.width = Math.floor(width * dpr);
      canvas.height = Math.floor(height * dpr);
      context.setTransform(dpr, 0, 0, dpr, 0, 0);
      points = Array.from({ length: 72 }, (_, index) => ({
        x: (index / 71) * width,
        y: height * (0.2 + (index % 9) / 14),
        phase: index * 0.42,
        speed: 0.00035 + (index % 5) * 0.00004,
      }));
    };

    const drawFiber = (time: number, offset: number, color: string, alpha: number) => {
      context.beginPath();
      points.forEach((point, index) => {
        const x = point.x;
        const wave = Math.sin(time * point.speed + point.phase + offset) * height * 0.12;
        const y = point.y + wave + Math.sin(x / Math.max(width, 1) * Math.PI * 2 + offset) * height * 0.08;
        if (index === 0) context.moveTo(x, y);
        else context.lineTo(x, y);
      });
      context.strokeStyle = color;
      context.globalAlpha = alpha;
      context.lineWidth = 1.2;
      context.stroke();
    };

    const render = (time: number) => {
      if (!isVisible) return;
      const isDark = modeRef.current === 'dark';
      context.clearRect(0, 0, width, height);
      context.globalCompositeOperation = 'screen';
      drawFiber(reducedMotion ? 0 : time, 0, isDark ? '#44b0c6' : '#8eced3', isDark ? 0.11 : 0.055);
      drawFiber(reducedMotion ? 0 : time, 2.1, isDark ? '#308c98' : '#b3e0e1', isDark ? 0.085 : 0.04);
      drawFiber(reducedMotion ? 0 : time, 4.2, isDark ? '#74d1d7' : '#d0eeee', isDark ? 0.055 : 0.025);
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
      if (!reducedMotion) animationFrame = requestAnimationFrame(render);
    };

    const resizeObserver = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(resize) : undefined;
    resizeObserver?.observe(canvas);
    resize();
    render(0);

    const intersectionObserver = typeof IntersectionObserver !== 'undefined'
      ? new IntersectionObserver(([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible && !reducedMotion) animationFrame = requestAnimationFrame(render);
        else cancelAnimationFrame(animationFrame);
      })
      : undefined;
    intersectionObserver?.observe(canvas);

    return () => {
      cancelAnimationFrame(animationFrame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
    };
  }, []);

  return <canvas aria-hidden="true" ref={canvasRef} style={styles.canvas} />;
}

const styles = {
  canvas: {
    height: '100%',
    inset: 0,
    pointerEvents: 'none' as const,
    position: 'absolute' as const,
    width: '100%',
  },
};
