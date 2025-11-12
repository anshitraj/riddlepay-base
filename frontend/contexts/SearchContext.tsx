'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { Gift } from '@/hooks/useContract';

interface SearchResult {
  type: 'gift' | 'address';
  id?: number;
  gift?: Gift;
  address?: string;
  matchField?: string;
}

interface SearchContextType {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  searchResults: SearchResult[];
  isSearching: boolean;
  performSearch: (query: string) => Promise<void>;
  clearSearch: () => void;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

interface SearchProviderProps {
  children: ReactNode;
  getGift?: (id: number) => Promise<Gift>;
  getGiftsForUser?: (address: string) => Promise<number[]>;
  address?: string | null;
}

export function SearchProvider({ children, getGift, getGiftsForUser, address }: SearchProviderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    const results: SearchResult[] = [];
    const queryLower = query.toLowerCase().trim();

    try {
      // Check if query is a gift ID (number)
      if (/^\d+$/.test(query) && getGift) {
        const giftId = parseInt(query);
        try {
          const gift = await getGift(giftId);
          results.push({
            type: 'gift',
            id: giftId,
            gift,
            matchField: 'Gift ID',
          });
        } catch {
          // Gift doesn't exist, continue searching
        }
      }

      // Check if query is an Ethereum address
      if (/^0x[a-fA-F0-9]{40}$/.test(query)) {
        results.push({
          type: 'address',
          address: query,
          matchField: 'Address',
        });

        // If user is connected, search their gifts for this address
        if (address && getGiftsForUser) {
          try {
            const giftIds = await getGiftsForUser(address);
            for (const id of giftIds.slice(0, 20)) { // Limit to 20 for performance
              try {
                if (!getGift) continue;
                const gift = await getGift(id);
                if (
                  gift.sender.toLowerCase() === queryLower ||
                  gift.receiver.toLowerCase() === queryLower
                ) {
                  results.push({
                    type: 'gift',
                    id,
                    gift,
                    matchField: gift.sender.toLowerCase() === queryLower ? 'Sender' : 'Receiver',
                  });
                }
              } catch {
                continue;
              }
            }
          } catch (err) {
            console.error('Error searching user gifts:', err);
          }
        }
      }

      // Search user's gifts by text (riddle, message, etc.)
      if (address && query.length >= 3 && getGiftsForUser && getGift) {
        try {
          const giftIds = await getGiftsForUser(address);
          for (const id of giftIds.slice(0, 50)) { // Limit to 50 for performance
            try {
              const gift = await getGift(id);
              const matches: string[] = [];

              if (gift.riddle?.toLowerCase().includes(queryLower)) {
                matches.push('Riddle');
              }
              if (gift.message?.toLowerCase().includes(queryLower)) {
                matches.push('Message');
              }
              if (gift.sender.toLowerCase().includes(queryLower)) {
                matches.push('Sender');
              }
              if (gift.receiver.toLowerCase().includes(queryLower)) {
                matches.push('Receiver');
              }

              if (matches.length > 0) {
                // Check if already added (avoid duplicates)
                if (!results.some(r => r.type === 'gift' && r.id === id)) {
                  results.push({
                    type: 'gift',
                    id,
                    gift,
                    matchField: matches.join(', '),
                  });
                }
              }
            } catch {
              continue;
            }
          }
        } catch (err) {
          console.error('Error searching gifts:', err);
        }
      }

      // Search partial address matches
      if (query.startsWith('0x') && query.length >= 4) {
        if (address && getGiftsForUser && getGift) {
          try {
            const giftIds = await getGiftsForUser(address);
            for (const id of giftIds.slice(0, 20)) {
              try {
                const gift = await getGift(id);
                if (
                  gift.sender.toLowerCase().includes(queryLower) ||
                  gift.receiver.toLowerCase().includes(queryLower)
                ) {
                  if (!results.some(r => r.type === 'gift' && r.id === id)) {
                    results.push({
                      type: 'gift',
                      id,
                      gift,
                      matchField: gift.sender.toLowerCase().includes(queryLower) ? 'Sender' : 'Receiver',
                    });
                  }
                }
              } catch {
                continue;
              }
            }
          } catch (err) {
            console.error('Error searching addresses:', err);
          }
        }
      }

      setSearchResults(results.slice(0, 10)); // Limit to 10 results
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return (
    <SearchContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        searchResults,
        isSearching,
        performSearch,
        clearSearch,
      }}
    >
      {children}
    </SearchContext.Provider>
  );
}

export function useSearch() {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
}

