'use client';

import { WalletProvider } from '@/contexts/WalletContext';
import SearchProviderWrapper from '@/components/SearchProviderWrapper';
import BulkGiveawayForm from '@/components/BulkGiveawayForm';
import Layout from '@/components/Layout';

export default function BulkGiveaway() {
  return (
    <WalletProvider>
      <SearchProviderWrapper>
        <Layout>
        <div className="space-y-4 sm:space-y-6">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white dark:text-gray-900 mb-1 sm:mb-2">
              Bulk Giveaway
            </h1>
            <p className="text-gray-400 dark:text-gray-600 text-sm sm:text-base">
              Send gifts to multiple winners at once - perfect for companies and contests
            </p>
          </div>

          <div className="glass rounded-2xl p-4 sm:p-6 border border-border">
            <BulkGiveawayForm />
          </div>
        </div>
      </Layout>
      </SearchProviderWrapper>
    </WalletProvider>
  );
}

