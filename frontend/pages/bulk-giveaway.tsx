'use client';

import { WalletProvider } from '@/contexts/WalletContext';
import BulkGiveawayForm from '@/components/BulkGiveawayForm';
import WalletConnect from '@/components/WalletConnect';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function BulkGiveaway() {
  return (
    <WalletProvider>
      <div className="min-h-screen bg-baseDark dark:text-white text-gray-900 relative z-10">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-4 py-2 glass rounded-xl border border-border dark:text-white text-gray-900 hover:scale-105 transition-all"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </Link>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <WalletConnect />
            </div>
          </div>

          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 bg-base-gradient bg-clip-text text-transparent">
                Bulk Giveaway
              </h1>
              <p className="text-xl dark:text-gray-300 text-gray-700">
                Send gifts to multiple winners at once - perfect for companies and contests
              </p>
            </div>

            <BulkGiveawayForm />
          </div>
        </div>
      </div>
    </WalletProvider>
  );
}

