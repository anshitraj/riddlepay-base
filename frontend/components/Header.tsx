'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { User, LogOut, Copy, ExternalLink, Settings, Search, Send, RefreshCw } from 'lucide-react';
import WalletConnect from './WalletConnect';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import { useWallet } from '@/contexts/WalletContext';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { address, disconnect } = useWallet();
  const { username, avatar, displayName } = useFarcasterUser(address);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    if (!showUserMenu && !showSettingsMenu) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Check if click is inside user menu container or dropdown
      const userMenuContainer = document.querySelector('[data-user-menu]');
      const userMenuDropdown = document.querySelector('[data-user-menu-dropdown]');
      if (
        (userMenuContainer && userMenuContainer.contains(target)) ||
        (userMenuDropdown && userMenuDropdown.contains(target))
      ) {
        return; // Don't close if clicking inside user menu area
      }
      
      // Close both menus if clicking outside
      setShowUserMenu(false);
      setShowSettingsMenu(false);
    };

    // Use capture phase to catch clicks before they bubble
    document.addEventListener('mousedown', handleClickOutside, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [showUserMenu, showSettingsMenu]);

  const copyAddress = async () => {
    if (!address) return;
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied!');
      setShowUserMenu(false);
    } catch (err) {
      toast.error('Failed to copy');
    }
  };

  const viewOnExplorer = () => {
    if (!address) return;
    window.open(`https://basescan.org/address/${address}`, '_blank');
    setShowUserMenu(false);
  };

  const handleDisconnect = () => {
    disconnect();
    setShowUserMenu(false);
    toast.success('Disconnected');
  };

  // Generate avatar from address if no avatar
  const getAvatarUrl = () => {
    if (avatar) return avatar;
    // Generate a simple gradient avatar based on address
    const colors = ['#0052FF', '#00C2FF', '#7B61FF', '#FF6B6B', '#4ECDC4'];
    const colorIndex = parseInt(address?.slice(2, 3) || '0', 16) % colors.length;
    return `data:image/svg+xml,${encodeURIComponent(`
      <svg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg">
        <rect width="40" height="40" fill="${colors[colorIndex]}"/>
        <text x="20" y="28" font-family="Arial" font-size="18" font-weight="bold" fill="white" text-anchor="middle">
          ${(username || displayName || address?.slice(2, 3) || '?').charAt(0).toUpperCase()}
        </text>
      </svg>
    `)}`;
  };

  const displayNameText = displayName || username ? `@${username || displayName}` : null;
  const shortAddress = address ? `${address.slice(0, 6)}...${address.slice(-4)}` : '';

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-gradient-to-b dark:from-[#0A0F1F] dark:to-[#0E152B] border-b border-[#e5e7eb] dark:border-blue-500/10 shadow-sm">
      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-b border-blue-500/10"
          >
            <div className="p-3 sm:p-4 bg-[#0A0F1F]/95 dark:bg-[#0A0F1F]/95 bg-white/95 dark:bg-[#0A0F1F]/95 backdrop-blur-xl pl-14">
              <SearchBar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center gap-2 sm:gap-3 md:gap-4 p-3 sm:p-4 overflow-visible">
        {/* Left: RiddlePay Branding (Mobile) / Create Button (Desktop) */}
        <div className="flex-shrink-0">
          {/* Mobile: RiddlePay Branding with Logo - moved right to avoid hamburger menu */}
          <div className="sm:hidden flex items-center gap-2 ml-12">
            <Link href="/" prefetch={true} className="flex items-center gap-2 group">
              <div className="relative w-8 h-8 flex-shrink-0">
                <Image
                  src="/riddlepay-logo.svg"
                  alt="RiddlePay Logo"
                  width={32}
                  height={32}
                  className="w-full h-full object-contain"
                  priority
                />
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-bold text-[#111827] dark:text-white leading-tight">RiddlePay</span>
                <span className="text-[10px] text-[#6b7280] dark:text-gray-300 leading-tight">powered by Base</span>
              </div>
            </Link>
          </div>
          {/* Desktop: Create Secret Airdrop Button */}
          <Link href="/" prefetch={true} className="hidden sm:block">
            <button className="flex items-center gap-2 px-3 sm:px-4 py-2 min-h-[44px] bg-gradient-to-r from-[#0052FF] to-[#00C2FF] rounded-xl hover:shadow-lg hover:shadow-blue-500/30 transition-all duration-300 group">
              <Send className="w-4 h-4 text-white dark:text-white group-hover:translate-x-1 transition-transform" />
              <span className="text-sm font-semibold text-white dark:text-white whitespace-nowrap">Create Secret Airdrop</span>
            </button>
          </Link>
        </div>

        {/* Center: Search Bar (Desktop) - Properly spaced */}
        <div className="hidden md:flex flex-1 justify-center items-center max-w-lg mx-4 lg:ml-20">
          <SearchBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1 sm:gap-1.5 sm:gap-2 flex-shrink-0 ml-auto min-w-0 overflow-visible">
          {/* Refresh Button */}
          <button
            onClick={() => {
              window.location.reload();
            }}
            className="p-2 rounded-lg shadow-sm bg-white dark:bg-blue-500/10 border border-[#e5e7eb] dark:border-blue-500/20 hover:bg-gray-50 dark:hover:bg-blue-500/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center group flex-shrink-0"
            aria-label="Refresh"
            title="Refresh page"
          >
            <RefreshCw className="w-4 h-4 sm:w-5 sm:h-5 text-[#111827] dark:text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
          </button>

          {/* Search - Mobile */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-lg shadow-sm bg-white dark:bg-blue-500/10 border border-[#e5e7eb] dark:border-blue-500/20 hover:bg-gray-50 dark:hover:bg-blue-500/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center flex-shrink-0"
            aria-label="Search"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-[#111827] dark:text-blue-400" />
          </button>

          {/* Profile Menu - Combined with Settings */}
          {address ? (
            <div className="relative" data-user-menu>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  e.preventDefault();
                  if (showSettingsMenu) {
                    setShowSettingsMenu(false);
                    setTimeout(() => setShowUserMenu(true), 0);
                  } else {
                    setShowUserMenu(!showUserMenu);
                  }
                }}
                className="flex items-center gap-2 sm:gap-3 p-2 rounded-lg shadow-sm bg-white dark:bg-blue-500/10 border border-[#e5e7eb] dark:border-blue-500/20 hover:bg-gray-50 dark:hover:bg-blue-500/20 transition-all min-h-[44px]"
                aria-label="Account Menu"
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <img
                    src={getAvatarUrl()}
                    alt={displayNameText || 'User'}
                    className="w-8 h-8 sm:w-9 sm:h-9 rounded-full border-2 border-blue-500/30 ring-2 ring-blue-500/10"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = getAvatarUrl();
                    }}
                  />
                  {/* Online indicator */}
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0A0F1F]"></div>
                </div>
                {/* Username/Address & Network */}
                <div className="hidden sm:flex flex-col items-start min-w-0">
                  {displayNameText ? (
                    <span className="text-xs sm:text-sm font-semibold text-white dark:text-white text-gray-900 dark:text-white truncate max-w-[120px]">
                      {displayNameText}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                      {shortAddress}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/10 bg-blue-100 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 border-blue-300 dark:border-blue-500/20 text-[9px] font-medium text-blue-400 dark:text-blue-400 text-blue-600 dark:text-blue-400">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    Base
                  </span>
                </div>
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-[#111827] dark:text-blue-400 flex-shrink-0" />
              </button>

              {/* User Menu Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    data-user-menu-dropdown
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-white dark:bg-[#0E152B]/95 rounded-xl border border-gray-200 dark:border-blue-500/20 shadow-lg z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-blue-500/10 dark:border-blue-500/10 border-gray-200 dark:border-blue-500/10">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl()}
                          alt={displayNameText || 'User'}
                          className="w-12 h-12 rounded-full border-2 border-blue-500/30 dark:border-blue-500/30 border-gray-300 dark:border-blue-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          {displayNameText ? (
                            <p className="text-sm font-semibold text-white dark:text-white text-gray-900 dark:text-white truncate">
                              {displayNameText}
                            </p>
                          ) : null}
                          <p className="text-xs font-mono text-gray-400 dark:text-gray-400 text-gray-600 dark:text-gray-400 truncate">
                            {shortAddress}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 dark:bg-blue-500/10 bg-blue-100 dark:bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/20 border-blue-300 dark:border-blue-500/20 text-[10px] font-medium text-blue-400 dark:text-blue-400 text-blue-600 dark:text-blue-400 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Base Mainnet
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={copyAddress}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 dark:hover:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left"
                      >
                        <Copy className="w-4 h-4 text-blue-400 dark:text-blue-400 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-white dark:text-white text-gray-900 dark:text-white">Copy Address</span>
                      </button>
                      <button
                        onClick={viewOnExplorer}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 dark:hover:bg-blue-500/10 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400 dark:text-blue-400 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm text-white dark:text-white text-gray-900 dark:text-white">View on BaseScan</span>
                      </button>
                      <div className="my-1 h-px bg-blue-500/10 dark:bg-blue-500/10 bg-gray-200 dark:bg-blue-500/10"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 dark:hover:bg-red-500/10 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400 dark:text-red-400 text-red-600 dark:text-red-400" />
                        <span className="text-sm text-red-400 dark:text-red-400 text-red-600 dark:text-red-400">Disconnect</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-shrink overflow-visible">
              <WalletConnect />
            </div>
          )}

          {/* Theme Toggle */}
          <div className="flex-shrink-0">
            <ThemeToggle />
          </div>
        </div>
      </div>
    </header>
  );
}
