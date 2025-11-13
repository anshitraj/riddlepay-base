'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Copy, ExternalLink, Settings, Search, MoreVertical } from 'lucide-react';
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
    <header className="sticky top-0 z-30 bg-gradient-to-b from-[#0A0F1F] to-[#0E152B] backdrop-blur-xl border-b border-blue-500/10 shadow-lg">
      {/* Mobile Search Bar */}
      <AnimatePresence>
        {showMobileSearch && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="md:hidden overflow-hidden border-b border-blue-500/10"
          >
            <div className="p-3">
              <SearchBar />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <div className="flex items-center justify-between p-3 sm:p-4">
        {/* Left: Logo/Branding - Empty space for now */}
        <div className="flex-1"></div>

        {/* Right: Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
          {/* Search - Mobile */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Search"
          >
            <Search className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
          </button>

          {/* Search - Desktop */}
          <div className="hidden md:block">
            <SearchBar />
          </div>

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
                className="flex items-center gap-2 sm:gap-3 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all min-h-[44px]"
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
                    <span className="text-xs sm:text-sm font-semibold text-white truncate max-w-[120px]">
                      {displayNameText}
                    </span>
                  ) : (
                    <span className="text-xs font-mono text-gray-400 truncate max-w-[120px]">
                      {shortAddress}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[9px] font-medium text-blue-400">
                    <span className="w-1 h-1 bg-green-500 rounded-full"></span>
                    Base
                  </span>
                </div>
                <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400 flex-shrink-0" />
              </button>

              {/* User Menu Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    data-user-menu-dropdown
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-64 bg-[#0E152B]/95 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-2xl z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-blue-500/10">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl()}
                          alt={displayNameText || 'User'}
                          className="w-12 h-12 rounded-full border-2 border-blue-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          {displayNameText ? (
                            <p className="text-sm font-semibold text-white truncate">
                              {displayNameText}
                            </p>
                          ) : null}
                          <p className="text-xs font-mono text-gray-400 truncate">
                            {shortAddress}
                          </p>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-medium text-blue-400 mt-1">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Base Mainnet
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={copyAddress}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 transition-all text-left"
                      >
                        <Copy className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">Copy Address</span>
                      </button>
                      <button
                        onClick={viewOnExplorer}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 transition-all text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">View on BaseScan</span>
                      </button>
                      <div className="my-1 h-px bg-blue-500/10"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Disconnect</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <WalletConnect />
          )}

          {/* Theme Toggle */}
          <ThemeToggle />

          {/* User Menu - Mobile */}
          {address && (
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
                className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 transition-all min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Menu"
              >
                <MoreVertical className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
              </button>

              {/* User Menu Dropdown */}
              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    data-user-menu-dropdown
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute right-0 mt-2 w-56 bg-[#0E152B]/95 backdrop-blur-xl rounded-2xl border border-blue-500/20 shadow-2xl z-50 overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-3 border-b border-blue-500/10">
                      <div className="flex items-center gap-3">
                        <img
                          src={getAvatarUrl()}
                          alt={displayNameText || 'User'}
                          className="w-10 h-10 rounded-full border-2 border-blue-500/30"
                        />
                        <div className="flex-1 min-w-0">
                          {displayNameText ? (
                            <p className="text-sm font-semibold text-white truncate">
                              {displayNameText}
                            </p>
                          ) : null}
                          <p className="text-xs font-mono text-gray-400 truncate">
                            {shortAddress}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={copyAddress}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 transition-all text-left"
                      >
                        <Copy className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">Copy Address</span>
                      </button>
                      <button
                        onClick={viewOnExplorer}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-blue-500/10 transition-all text-left"
                      >
                        <ExternalLink className="w-4 h-4 text-blue-400" />
                        <span className="text-sm text-white">View on BaseScan</span>
                      </button>
                      <div className="my-1 h-px bg-blue-500/10"></div>
                      <button
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all text-left"
                      >
                        <LogOut className="w-4 h-4 text-red-400" />
                        <span className="text-sm text-red-400">Disconnect</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
