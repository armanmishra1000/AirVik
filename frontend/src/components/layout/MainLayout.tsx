'use client';

import React, { ReactNode } from 'react';
import Navigation from './Navigation';

interface MainLayoutProps {
  children: ReactNode;
  className?: string;
  showNavigation?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({
  children,
  className = '',
  showNavigation = true,
}) => {
  return (
    <div className={`min-h-screen bg-gray-50 ${className}`}>
      {showNavigation && <Navigation />}
      <main className="flex-1">
        {children}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              © 2025 AirVik. All rights reserved.
            </div>
            <div className="flex space-x-6">
              <a href="/privacy" className="text-sm text-gray-500 hover:text-gray-700">
                Privacy Policy
              </a>
              <a href="/terms" className="text-sm text-gray-500 hover:text-gray-700">
                Terms of Service
              </a>
              <a href="/support" className="text-sm text-gray-500 hover:text-gray-700">
                Support
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
