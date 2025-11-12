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
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-gray-400 dark:text-gray-600" />
        <input
          type="text"
          placeholder="Search airdrops, addresses..."
          value={searchQuery}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          className="w-full pl-9 sm:pl-10 pr-8 sm:pr-10 py-2.5 sm:py-2 min-h-[44px] text-base glass rounded-xl border border-border text-white dark:text-gray-900 placeholder-gray-500 dark:placeholder-gray-500 focus:outline-none focus:border-blue-500/50 transition-all touch-manipulation"
        />
        {searchQuery && (
          <button
            onClick={() => {
              clearSearch();
              setIsOpen(false);
            }}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="w-4 h-4 text-blue-400 animate-spin" />
          </div>
        )}
      </div>

      {/* Search Results Dropdown */}
      {isOpen && searchQuery.trim() && (
        <div className="absolute top-full mt-2 w-full glass-strong rounded-xl border border-border shadow-xl z-50 max-h-96 overflow-y-auto">
          {isSearching ? (
            <div className="p-4 text-center">
              <Loader2 className="w-5 h-5 text-blue-400 animate-spin mx-auto mb-2" />
              <p className="text-sm text-gray-400">Searching...</p>
            </div>
          ) : searchResults.length > 0 ? (
            <div className="p-2">
              <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                Search Results ({searchResults.length})
              </div>
              {searchResults.map((result, idx) => (
                <button
                  key={idx}
                  onClick={() => handleResultClick(result)}
                  className="w-full text-left px-3 py-2.5 rounded-lg hover:bg-baseLight/20 dark:hover:bg-white/10 transition-all border border-transparent hover:border-blue-500/30"
                >
                  {result.type === 'gift' && result.gift && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center flex-shrink-0">
                        <Gift className="w-5 h-5 text-blue-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold dark:text-white text-gray-900">
                            Airdrop #{result.id}
                          </span>
                          {result.matchField && (
                            <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-400 rounded">
                              {result.matchField}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {result.gift.riddle && result.gift.riddle.trim()
                            ? `Riddle: ${result.gift.riddle.substring(0, 40)}...`
                            : 'Direct Airdrop'}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                          {formatAmount(result.gift.amount, result.gift.tokenAddress)}
                          {result.gift.claimed && ' • Claimed'}
                        </p>
                      </div>
                    </div>
                  )}
                  {result.type === 'address' && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-purple-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-semibold dark:text-white text-gray-900">
                            Address
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                          {result.address}
                        </p>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-400">No results found</p>
              <p className="text-xs text-gray-500 mt-1">Try searching by airdrop ID, address, or riddle text</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

