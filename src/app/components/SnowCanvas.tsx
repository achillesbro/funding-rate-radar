'use client';
import { useEffect, useRef } from 'react';

type Props = {
  /** flakes per px² (0.00006–0.00012 is subtle) */
  density?: number;
  /** vertical speed in px/s */
  speedY?: number;
  /** horizontal drift in px/s (negative = left) */
  speedX?: number;
  /** min/max flake size in px */
  size?: [number, number];
  /** z-index layer (place above bg, below content) */
  zIndex?: number;
  /** opacity 0–1 */
  opacity?: number;
};

export default function SnowCanvas({
  density = 0.00008,
  speedY = 20,
  speedX = -10,
  size = [3, 6],
  zIndex = 10,
  opacity = 0.4,
}: Props) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const canvas = ref.current!;
    const ctx = canvas.getContext('2d', { alpha: true })!;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    let W = 0, H = 0, flakes: Flake[] = [], raf = 0, last = performance.now();

    type Flake = { x: number; y: number; vx: number; vy: number; r: number; a: number; };

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    const makeFlake = (spawnTopRight = false): Flake => ({
      x: spawnTopRight ? rand(W * 0.7, W + 20) : rand(0, W),
      y: spawnTopRight ? rand(-20, H * 0.2) : rand(0, H),
      vx: rand(speedX * 0.8, speedX * 1.2),
      vy: rand(speedY * 0.6, speedY * 1.0),
      r: rand(size[0], size[1]),
      a: rand(0.2, opacity),
    });

    const resize = () => {
      W = window.innerWidth; H = window.innerHeight;
      // Use lower resolution for pixelated effect
      const pixelRatio = 0.5; // Lower resolution for more pixelated look
      canvas.width = Math.floor(W * pixelRatio);
      canvas.height = Math.floor(H * pixelRatio);
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
      // Disable smoothing for pixelated effect
      ctx.imageSmoothingEnabled = false;
      // target flake count by area
      const target = Math.max(1, Math.floor(W * H * density));
      if (flakes.length < target) {
        while (flakes.length < target) flakes.push(makeFlake());
      } else {
        flakes.length = target;
      }
    };

    const step = (t: number) => {
      const dt = Math.min(0.05, (t - last) / 1000); // clamp to 50ms
      last = t;

      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < flakes.length; i++) {
        const f = flakes[i];
        f.x += f.vx * dt;
        f.y += f.vy * dt;

        // wrap when off-screen (re-spawn near top-right)
        if (f.y > H + 4 || f.x < -4) {
          flakes[i] = makeFlake(true);
          continue;
        }

        ctx.globalAlpha = f.a;
        ctx.fillStyle = '#a0a0a0';
        ctx.fillRect(f.x, f.y, f.r, f.r);
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(step);
    };

    resize();
    window.addEventListener('resize', resize);
    raf = requestAnimationFrame(step);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
    };
  }, [density, speedX, speedY, size, opacity]);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none fixed inset-0 pixelated"
      style={{ zIndex }}
    />
  );
}
