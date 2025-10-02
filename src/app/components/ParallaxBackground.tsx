'use client';

import { useEffect, useState } from 'react';

export default function ParallaxBackground() {
  const [offsetY, setOffsetY] = useState(0);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };

    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Set initial mobile state
    handleResize();

    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // Different parallax intensity for mobile vs desktop
  const parallaxIntensity = isMobile ? 0.05 : 0.15;
  
  // Different background images for mobile vs desktop
  const backgroundImage = isMobile ? '/FujiScan-bg.png' : '/FujiScan-bg-2.png';

  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 pixelated bg-responsive"
      style={{
        background: `
          linear-gradient(rgba(11, 18, 32, 0.15), rgba(11, 18, 32, 0.25)),
          url('${backgroundImage}')
        `,
        backgroundSize: 'cover',
        backgroundPosition: isMobile 
          ? `center ${-250 + (-offsetY * parallaxIntensity)}px`
          : `center ${-offsetY * parallaxIntensity}px`,
        backgroundRepeat: 'no-repeat',
        minHeight: isMobile ? '150vh' : '120vh',
      }}
    />
  );
}
