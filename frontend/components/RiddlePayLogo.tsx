'use client';

interface RiddlePayLogoProps {
  size?: number;
  showText?: boolean;
  className?: string;
}

export default function RiddlePayLogo({ size = 40, showText = true, className = '' }: RiddlePayLogoProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Stylized R Logo */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="flex-shrink-0"
      >
        <defs>
          <linearGradient id={`goldGradient-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="30%" stopColor="#FFA500" stopOpacity="1" />
            <stop offset="70%" stopColor="#FFD700" stopOpacity="1" />
            <stop offset="100%" stopColor="#FFA500" stopOpacity="1" />
          </linearGradient>
          <filter id={`glow-${size}`}>
            <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        {/* Left vertical stroke of R */}
        <path
          d="M 25 20 L 25 80"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="6"
          strokeLinecap="round"
          filter={`url(#glow-${size})`}
        />
        
        {/* Puzzle piece tab at top of left stroke */}
        <path
          d="M 25 20 L 25 25 L 20 25 L 20 22 L 25 20 Z"
          fill={`url(#goldGradient-${size})`}
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="2"
        />
        
        {/* Top horizontal stroke */}
        <path
          d="M 25 20 L 50 20"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="6"
          strokeLinecap="round"
          filter={`url(#glow-${size})`}
        />
        
        {/* Diagonal stroke */}
        <path
          d="M 50 20 L 65 50"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="6"
          strokeLinecap="round"
          filter={`url(#glow-${size})`}
        />
        
        {/* Puzzle piece slot in middle of left stroke */}
        <rect
          x="22"
          y="48"
          width="6"
          height="6"
          fill="none"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="2.5"
          rx="1"
        />
        
        {/* Curved part of R (loop) */}
        <path
          d="M 50 20 Q 70 20 75 40 Q 75 55 65 60"
          fill="none"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="6"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#glow-${size})`}
        />
        
        {/* Keyhole in lower loop (where loop connects) */}
        <circle
          cx="60"
          cy="50"
          r="5"
          fill="none"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="3"
        />
        <rect
          x="58"
          y="55"
          width="4"
          height="6"
          fill="none"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="3"
          rx="2"
        />
        
        {/* Bottom vertical stroke */}
        <path
          d="M 65 50 L 65 80"
          stroke={`url(#goldGradient-${size})`}
          strokeWidth="6"
          strokeLinecap="round"
          filter={`url(#glow-${size})`}
        />
      </svg>
      
      {/* RIDDLE PAY Text */}
      {showText && (
        <div className="flex flex-col">
          <span className="text-lg font-bold bg-gradient-to-r from-[#FFD700] via-[#FFA500] to-[#FFD700] bg-clip-text text-transparent uppercase tracking-tight">
            RIDDLE PAY
          </span>
        </div>
      )}
    </div>
  );
}

