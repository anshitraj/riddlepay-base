'use client';

import { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import BottomNav from './BottomNav';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f5f3f0] via-[#f0ede8] to-[#faf8f5] dark:bg-baseDark flex pb-16 lg:pb-0">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-60 w-full min-w-0">
        {/* Header */}
        <Header />

        {/* Content */}
        <main className="flex-1 p-4 overflow-y-auto pb-6 bg-gradient-to-b from-[#0A0F1F] to-[#0E152B] dark:from-[#0A0F1F] dark:to-[#0E152B] from-gray-50 to-gray-100 dark:from-[#0A0F1F] dark:to-[#0E152B]">
          <div className="max-w-7xl mx-auto w-full">
            {children}
          </div>
        </main>
      </div>
      
      {/* Bottom Navigation for Mobile */}
      <BottomNav />
    </div>
  );
}

