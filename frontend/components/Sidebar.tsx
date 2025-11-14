'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  Gift, 
  Users, 
  Trophy, 
  LogOut,
  Menu,
  X,
  Sparkles,
  Package
} from 'lucide-react';
import RiddlePayLogo from './RiddlePayLogo';
import { useWallet } from '@/contexts/WalletContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/' },
  { icon: Gift, label: 'My Airdrops', href: '/my-gifts' },
  { icon: Sparkles, label: 'Claim Airdrops', href: '/my-gifts' },
  { icon: Package, label: 'Bulk Giveaway', href: '/bulk-giveaway' },
  { icon: Trophy, label: 'Leaderboard', href: '/leaderboard' },
];

export default function Sidebar() {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const pathname = usePathname();
  const { disconnect } = useWallet();

  const handleLogout = () => {
    disconnect();
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2.5 min-w-[44px] min-h-[44px] glass rounded-lg border border-border touch-manipulation active:scale-95"
        aria-label="Toggle menu"
      >
        {isMobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 bg-baseLight/40 dark:bg-white/8 backdrop-blur-xl border-r border-border z-40 flex-col shadow-lg">
        {/* Desktop Sidebar Content */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <Link href="/" prefetch={true}>
            <RiddlePayLogo size={40} showText={true} />
          </Link>
        </div>

        <div className="flex-1 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
          <nav className="flex-1 overflow-y-auto overflow-x-hidden p-4 pb-2 space-y-2">
            <div className="px-2 mb-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500 font-semibold">Navigation</p>
            </div>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              
              return (
                <Link key={item.href} href={item.href} prefetch={true}>
                  <motion.div
                    className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                      isActive
                        ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 border border-blue-500/50 text-white dark:text-gray-900 shadow-lg shadow-blue-500/20'
                        : 'text-gray-400 dark:text-gray-600 hover:bg-baseLight/30 dark:hover:bg-white/10 hover:text-white dark:hover:text-gray-900 hover:border-border'
                    } border border-transparent`}
                    whileHover={{ scale: 1.02, x: 4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                    <span className="font-semibold text-sm">{item.label}</span>
                  </motion.div>
                </Link>
              );
            })}
          </nav>

          <div className="flex-shrink-0 p-3 pt-2 border-t border-border bg-baseLight/40 dark:bg-white/8">
            <div className="px-2 mb-1.5">
              <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500 font-semibold">Account</p>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-xl text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all border border-transparent hover:border-red-500/30 touch-manipulation active:scale-95"
            >
              <LogOut className="w-5 h-5" />
              <span className="font-semibold text-sm">Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <motion.aside
        initial={false}
        animate={{
          x: isMobileOpen ? 0 : -240,
        }}
        className="lg:hidden fixed left-0 top-0 h-screen w-60 bg-baseLight/40 dark:bg-white/8 backdrop-blur-xl border-r border-border z-40 flex flex-col shadow-lg"
      >
        {/* Logo */}
        <div className="p-5 border-b border-border flex-shrink-0">
          <Link href="/" prefetch={true} onClick={() => setIsMobileOpen(false)}>
            <RiddlePayLogo size={40} showText={true} />
          </Link>
        </div>

        <nav className="flex-1 p-4 pb-2 space-y-2 overflow-y-auto overflow-x-hidden" style={{ maxHeight: 'calc(100vh - 200px)' }}>
          <div className="px-2 mb-4">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500 font-semibold">Navigation</p>
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            
            return (
              <Link key={item.href} href={item.href} prefetch={true} onClick={() => setIsMobileOpen(false)}>
                <motion.div
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-500/30 to-blue-600/30 border border-blue-500/50 text-white dark:text-gray-900 shadow-lg shadow-blue-500/20'
                      : 'text-gray-400 dark:text-gray-600 hover:bg-baseLight/30 dark:hover:bg-white/10 hover:text-white dark:hover:text-gray-900 hover:border-border'
                    } border border-transparent`}
                  whileHover={{ scale: 1.02, x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Icon className={`w-5 h-5 ${isActive ? 'text-blue-400' : ''}`} />
                  <span className="font-semibold text-sm">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 pt-2 border-t border-border flex-shrink-0 bg-baseLight/40 dark:bg-white/8">
          <div className="px-2 mb-1.5">
            <p className="text-xs uppercase tracking-wider text-gray-500 dark:text-gray-500 font-semibold">Account</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-2.5 min-h-[44px] rounded-xl text-red-400 hover:bg-red-500/20 hover:border-red-500/30 transition-all border border-transparent hover:border-red-500/30 touch-manipulation active:scale-95"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-semibold text-sm">Log out</span>
          </button>
        </div>
      </motion.aside>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setIsMobileOpen(false)}
        />
      )}
    </>
  );
}

