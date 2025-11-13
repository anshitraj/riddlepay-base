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
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0E152B]/95 backdrop-blur-2xl border-t border-[#0066FF]/10 shadow-2xl pb-safe">
      <div className="flex items-center justify-around px-2 py-2">
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
                <>
                  {/* Neon glow background */}
                  <motion.div
                    layoutId="activeTab"
                    className="absolute inset-0 bg-gradient-to-br from-[#0052FF]/30 to-[#00C2FF]/30 rounded-xl border border-[#0052FF]/40 shadow-lg shadow-[#0052FF]/30"
                    initial={false}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                  {/* Outer glow */}
                  <div className="absolute inset-0 bg-gradient-to-br from-[#0052FF]/20 to-[#00C2FF]/20 rounded-xl blur-md -z-10" />
                </>
              )}
              <Icon
                className={`w-6 h-6 relative z-10 transition-all ${
                  isActive
                    ? 'text-[#0052FF] drop-shadow-[0_0_8px_rgba(0,82,255,0.6)]'
                    : 'text-gray-400'
                }`}
              />
              <span
                className={`text-[11px] font-semibold relative z-10 transition-colors ${
                  isActive
                    ? 'text-[#0052FF]'
                    : 'text-gray-400'
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

