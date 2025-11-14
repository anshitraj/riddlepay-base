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
    <div className="min-h-screen bg-baseDark dark:bg-baseDark bg-gray-50 flex pb-16 lg:pb-0">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:ml-60 w-full min-w-0">
        {/* Header */}
        <Header />

        {/* Content */}
        <main className="flex-1 p-3 sm:p-4 md:p-6 overflow-y-auto pb-6 sm:pb-8">
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

