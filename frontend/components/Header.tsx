'use client';

import { useState, useRef, useEffect } from 'react';
import { User, LogOut, Copy, ExternalLink } from 'lucide-react';
import WalletConnect from './WalletConnect';
import ThemeToggle from './ThemeToggle';
import SearchBar from './SearchBar';
import RiddlePayLogo from './RiddlePayLogo';
import { useWallet } from '@/contexts/WalletContext';
import { useFarcasterUser } from '@/hooks/useFarcasterUser';
import toast from 'react-hot-toast';

export default function Header() {
  const { address, disconnect } = useWallet();
  const { username, avatar, displayName } = useFarcasterUser(address);
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const desktopUserMenuRef = useRef<HTMLDivElement>(null);
  const mobileUserMenuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      
      // Check if click is inside desktop menu
      if (desktopUserMenuRef.current && desktopUserMenuRef.current.contains(target)) {
        return; // Don't close if clicking inside desktop menu
      }
      
      // Check if click is inside mobile menu
      if (mobileUserMenuRef.current && mobileUserMenuRef.current.contains(target)) {
        return; // Don't close if clicking inside mobile menu
      }
      
      // Close menu if clicked outside both menus
      setShowUserMenu(false);
    };

    if (showUserMenu) {
      // Use a small delay to ensure button clicks are processed first
      setTimeout(() => {
        document.addEventListener('mousedown', handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showUserMenu]);

  const copyAddress = async (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (!address) {
      toast.error('No address to copy');
      return;
    }
    
    try {
      await navigator.clipboard.writeText(address);
      toast.success('Address copied to clipboard!');
      setTimeout(() => setShowUserMenu(false), 100);
    } catch (err) {
      // Fallback for older browsers
      try {
        const textArea = document.createElement('textarea');
        textArea.value = address;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        const successful = document.execCommand('copy');
        textArea.remove();
        
        if (successful) {
          toast.success('Address copied to clipboard!');
          setTimeout(() => setShowUserMenu(false), 100);
        } else {
          throw new Error('Copy command failed');
        }
      } catch (fallbackErr) {
        console.error('Failed to copy address:', fallbackErr);
        toast.error('Failed to copy address. Please copy manually.');
      }
    }
  };

  const viewOnExplorer = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!address) {
      toast.error('No address to view');
      return;
    }
    
    const url = `https://basescan.org/address/${address}`;
    
    try {
      const newWindow = window.open(url, '_blank', 'noopener,noreferrer');
      
      if (!newWindow || newWindow.closed || typeof newWindow.closed === 'undefined') {
        toast.error('Popup blocked. Please allow popups for this site.');
      } else {
        setTimeout(() => setShowUserMenu(false), 100);
      }
    } catch (err) {
      console.error('Error opening explorer:', err);
      toast.error('Failed to open explorer');
    }
  };

  const handleDisconnect = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    try {
      disconnect();
      setTimeout(() => setShowUserMenu(false), 100);
      toast.success('Wallet disconnected');
    } catch (err) {
      console.error('Error disconnecting:', err);
      toast.error('Failed to disconnect wallet');
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-baseLight/40 dark:bg-white/8 backdrop-blur-xl border-b border-border shadow-lg shadow-black/5">
      {/* Mobile Search Bar */}
      {showMobileSearch && (
        <div className="md:hidden p-3 border-b border-border">
          <SearchBar />
        </div>
      )}
      
      <div className="flex items-center justify-between p-3 md:p-4">
        {/* Left: RiddlePay Branding + Page Title */}
        <div className="flex items-center gap-2 md:gap-4 min-w-0 flex-1">
          <div className="hidden sm:block">
            <RiddlePayLogo size={28} showText={true} />
          </div>
          <div className="sm:hidden">
            <RiddlePayLogo size={24} showText={false} />
          </div>
          <div className="hidden md:block h-6 w-px bg-border"></div>
          <h2 className="hidden sm:block text-base md:text-lg font-semibold text-gray-400 dark:text-gray-600 truncate">Dashboard</h2>
        </div>

        {/* Center: Search - Desktop */}
        <div className="hidden md:block flex-1 max-w-md mx-4">
          <SearchBar />
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
          {/* Mobile Search Toggle */}
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="md:hidden p-2 glass rounded-lg border border-border hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all"
            aria-label="Toggle search"
          >
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </button>
          
          <ThemeToggle />
          {address ? (
            <div className="hidden sm:flex items-center gap-2">
              {/* User Menu */}
              <div className="relative" ref={desktopUserMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer overflow-hidden"
                  aria-label="User menu"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username || displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </button>
                
                {/* User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center gap-3 mb-2">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={username || displayName || 'User'}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {username || displayName ? (
                            <>
                              <p className="text-sm font-semibold dark:text-white text-gray-900 truncate">
                                {displayName || `@${username}`}
                              </p>
                              {username && displayName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{username}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected Wallet</p>
                          )}
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all text-left cursor-pointer active:scale-95"
                      >
                        <Copy className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                        <span className="text-sm dark:text-white text-gray-900">Copy Address</span>
                      </button>
                      <button
                        type="button"
                        onClick={viewOnExplorer}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all text-left cursor-pointer active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                        <span className="text-sm dark:text-white text-gray-900">View on BaseScan</span>
                      </button>
                      <div className="my-1 h-px bg-border"></div>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all text-left cursor-pointer active:scale-95"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              <WalletConnect />
            </div>
          ) : (
            <div className="hidden sm:block">
              <WalletConnect />
            </div>
          )}
          {/* Mobile Wallet Button */}
          <div className="sm:hidden">
            {address ? (
              <div className="relative" ref={mobileUserMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center hover:scale-110 transition-all duration-200 cursor-pointer overflow-hidden"
                  aria-label="User menu"
                >
                  {avatar ? (
                    <img
                      src={avatar}
                      alt={username || displayName || 'User'}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-white" />
                  )}
                </button>
                
                {/* Mobile User Menu Dropdown */}
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 glass-strong rounded-xl border border-border shadow-xl z-50 overflow-hidden">
                    <div className="p-3 border-b border-border">
                      <div className="flex items-center gap-3 mb-2">
                        {avatar ? (
                          <img
                            src={avatar}
                            alt={username || displayName || 'User'}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                            <User className="w-5 h-5 text-white" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          {username || displayName ? (
                            <>
                              <p className="text-sm font-semibold dark:text-white text-gray-900 truncate">
                                {displayName || `@${username}`}
                              </p>
                              {username && displayName && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  @{username}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Connected Wallet</p>
                          )}
                          <p className="text-xs font-mono text-gray-500 dark:text-gray-400 truncate">
                            {address.slice(0, 6)}...{address.slice(-4)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="p-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={copyAddress}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all text-left cursor-pointer active:scale-95"
                      >
                        <Copy className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                        <span className="text-sm dark:text-white text-gray-900">Copy Address</span>
                      </button>
                      <button
                        type="button"
                        onClick={viewOnExplorer}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all text-left cursor-pointer active:scale-95"
                      >
                        <ExternalLink className="w-4 h-4 text-gray-400 dark:text-gray-600" />
                        <span className="text-sm dark:text-white text-gray-900">View on BaseScan</span>
                      </button>
                      <div className="my-1 h-px bg-border"></div>
                      <button
                        type="button"
                        onClick={handleDisconnect}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-red-500/10 transition-all text-left cursor-pointer active:scale-95"
                      >
                        <LogOut className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-red-500">Disconnect</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <WalletConnect />
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Wallet Connect Dropdown */}
      {address && (
        <div className="sm:hidden border-t border-border p-3">
          <WalletConnect />
        </div>
      )}
    </header>
  );
}

