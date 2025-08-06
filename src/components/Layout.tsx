import { ReactNode } from 'react';
import Navigation from './Navigation';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900">ClosetAssistant</h1>
        </div>
      </header>

      {/* Navigation - Desktop */}
      <div className="hidden md:block">
        <Navigation />
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {children}
      </main>

      {/* Navigation - Mobile */}
      <div className="md:hidden">
        <Navigation />
      </div>
    </div>
  );
};

export default Layout;