'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';

interface RiddlePayLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function RiddlePayLogo({ size = 80, showText = false, className = '' }: RiddlePayLogoProps) {
  // Always use dark theme logo
  const logoSource = '/WHITELOGO.png';

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

