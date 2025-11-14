'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface RiddlePayLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function RiddlePayLogo({ size = 80, showText = false, className = '' }: RiddlePayLogoProps) {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    // Check theme on mount and when it changes
    const checkTheme = () => {
      const html = document.documentElement;
      const theme = html.getAttribute('data-theme') || html.classList.contains('dark') ? 'dark' : 'light';
      setIsDark(theme === 'dark');
    };

    checkTheme();

    // Watch for theme changes
    const observer = new MutationObserver(checkTheme);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme', 'class'],
    });

    return () => observer.disconnect();
  }, []);

  // Use WHITELOGO.png for dark theme, BLACKLOGO.png for light theme
  const logoSource = isDark ? '/WHITELOGO.png' : '/BLACKLOGO.png';

  return (
    <div className={`flex items-center ${className}`}>
      {/* Riddle Pay Logo Image - Theme-aware (WHITELOGO in dark mode, BLACKLOGO in light mode) */}
      <div className="flex-shrink-0" style={{ width: size, height: size }}>
        <Image
          src={logoSource}
          alt="Riddle Pay Logo"
          width={size}
          height={size}
          className="w-full h-full object-contain"
          priority
        />
      </div>
    </div>
  );
}

