'use client';

import { useState, useEffect, useRef } from 'react';
import { Search, X, Gift, MapPin, Loader2 } from 'lucide-react';
import { useSearch } from '@/contexts/SearchContext';
import { useRouter } from 'next/navigation';
import { formatAmount } from '@/utils/formatAmount';
import Link from 'next/link';

export default function SearchBar() {
  const { searchQuery, setSearchQuery, searchResults, isSearching, performSearch, clearSearch } = useSearch();
  const [isOpen, setIsOpen] = useState(false);
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Debounce search
  useEffect(() => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    if (searchQuery.trim()) {
      const timer = setTimeout(() => {
        performSearch(searchQuery);
      }, 500);
      setDebounceTimer(timer);
    } else {
      clearSearch();
    }

    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
    setIsOpen(true);
  };

  const handleResultClick = (result: any) => {
    if (result.type === 'gift' && result.id !== undefined) {
      router.push(`/claim?giftId=${result.id}`);
      setIsOpen(false);
      clearSearch();
    } else if (result.type === 'address') {
      router.push(`/my-gifts`);
      setIsOpen(false);
      clearSearch();
    }
  };

  return (
    <div className="relative w-full" ref={searchRef}>
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-600 pointer-events-none" />
        <input
          type="text"
          placeholder="Search airdrops, addresses..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-10 sm:pl-11 pr-10 sm:pr-11 py-3 sm:py-2.5 min-h-[48px] sm:min-h-[44px] text-base sm:text-sm glass rounded-xl sm:rounded-lg border border-border text-white dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all touch-manipulation"
        />
        {searchQuery && (
          <button
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
            className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center touch-manipulation"
            aria-label="Clear search"
          >
            <X className="w-5 h-5 sm:w-4 sm:h-4" />
          </button>
        )}
        {isSearching && !searchQuery && (
          <div className="absolute right-3 sm:right-4 top-1/2 transform -translate-y-1/2 pointer-events-none">
            <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 text-blue-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute top-full mt-2 w-full glass-strong rounded-xl sm:rounded-lg border border-border shadow-xl z-50 max-h-[70vh] sm:max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 sm:p-3 text-center">
              <Loader2 className="w-5 h-5 sm:w-4 sm:h-4 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-sm sm:text-xs text-gray-400">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2 sm:p-1.5">
              <div className="px-3 sm:px-2.5 py-2 sm:py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-3 sm:px-2.5 py-3 sm:py-2.5 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all border border-transparent hover:border-blue-500/30 min-h-[60px] sm:min-h-[52px] touch-manipulation"
                >
                  {result.type === 'gift' && result.gift && (
                    <div className="flex items-center gap-3 sm:gap-2.5">
                      <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-6 h-6 sm:w-5 sm:h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className="text-base sm:text-sm font-semibold dark:text-white text-gray-900">
                            Airdrop #{result.id}
                          </span>
                          {result.matchField && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                              {result.matchField}
                            </span>
                          )}
                        </div>
                        <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                          {result.gift.riddle && result.gift.riddle.trim()
                            ? `Riddle: ${result.gift.riddle.substring(0, 40)}...`
                            : 'Direct Airdrop'}
                        </p>
                        <p className="text-sm sm:text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatAmount(result.gift.amount, result.gift.tokenAddress)}
                          {result.gift.claimed && ' • Claimed'}
                        </p>
                      </div>
                    </div>
                  )}
                  {result.type === 'address' && (
                    <div className="flex items-center gap-3 sm:gap-2.5">
                      <div className="w-12 h-12 sm:w-10 sm:h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-6 h-6 sm:w-5 sm:h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-base sm:text-sm font-semibold dark:text-white text-gray-900">
                            Address
                          </span>
                        </div>
                        <p className="text-sm sm:text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                          {result.address}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 sm:p-3 text-center">
              <p className="text-sm sm:text-xs text-gray-400">No results found</p>
              <p className="text-xs text-gray-500 mt-1">Try searching by airdrop ID, address, or riddle text</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

