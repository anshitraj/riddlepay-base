'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Gift, Sparkles, Package, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const navItems = [
  { icon: LayoutDashboard, label: 'Home', href: '/' },
  { icon: Gift, label: 'My Airdrops', href: '/my-gifts' },
  { icon: Package, label: 'Bulk', href: '/bulk-giveaway' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-baseLight/95 dark:bg-white/95 backdrop-blur-xl border-t border-border shadow-lg">
      <div className="flex items-center justify-around px-2 py-2 safe-area-bottom">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[44px] min-h-[60px] rounded-xl transition-all touch-manipulation relative"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-gradient-to-r from-[#0052FF]/20 to-[#00C2FF]/20 rounded-xl border border-[#0052FF]/30 shadow-lg shadow-[#0052FF]/20"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 transition-colors ${
                  isActive
                    ? 'text-[#0052FF] dark:text-[#00C2FF]'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              />
              <span
                className={`text-xs font-semibold relative z-10 transition-colors ${
                  isActive
                    ? 'text-[#0052FF] dark:text-[#00C2FF]'
                    : 'text-gray-400 dark:text-gray-600'
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

