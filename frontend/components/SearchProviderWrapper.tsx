'use client';

import { ReactNode } from 'react';
import { SearchProvider } from '@/contexts/SearchContext';
import { useWallet } from '@/contexts/WalletContext';
import { useContract } from '@/hooks/useContract';

export default function SearchProviderWrapper({ children }: { children: ReactNode }) {
  const { address } = useWallet();
  const { getGift, getGiftsForUser } = useContract();

  return (
    <SearchProvider getGift={getGift} getGiftsForUser={getGiftsForUser} address={address}>
      {children}
    </SearchProvider>
  );
}

