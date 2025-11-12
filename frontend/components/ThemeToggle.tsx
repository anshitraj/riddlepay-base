'use client';

import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';
import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <button
        className="p-2.5 glass rounded-xl border border-border hover:border-blue-500/50 transition-all duration-200 hover:scale-105"
        aria-label="Toggle theme"
        disabled
      >
        <Sun className="w-5 h-5 text-yellow-400" />
      </button>
    );
  }

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 glass rounded-xl border border-border hover:border-blue-500/50 transition-all duration-200 hover:scale-105"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? (
        <Sun className="w-5 h-5 text-yellow-400" />
      ) : (
        <Moon className="w-5 h-5 text-blue-500" />
      )}
    </button>
  );
}

