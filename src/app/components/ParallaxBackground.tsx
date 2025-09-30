'use client';

import { useEffect, useState } from 'react';

export default function ParallaxBackground() {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 pixelated"
      style={{
        background: `
          linear-gradient(rgba(11, 18, 32, 0.3), rgba(11, 18, 32, 0.5)),
          url('/FujiScan-bg-2.png')
        `,
        backgroundSize: 'cover',
        backgroundPosition: `center ${-offsetY * 0.15}px`,
        backgroundRepeat: 'no-repeat',
        minHeight: '120vh',
      }}
    />
  );
}
