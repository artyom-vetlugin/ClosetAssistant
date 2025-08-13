import type { ReactNode, ChangeEvent } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Navigation from './Navigation';
import { useTranslation } from 'react-i18next';

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  const { signOut, user } = useAuth();
  const { t, i18n } = useTranslation('common');

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const changeLang = (e: ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-900">{t('appName')}</h1>
          <div className="flex items-center space-x-4">
            <select
              aria-label="Language"
              value={i18n.resolvedLanguage}
              onChange={changeLang}
              className="text-sm border rounded px-2 py-1 bg-white"
            >
              <option value="en">🇬🇧 EN</option>
              <option value="ru">🇷🇺 RU</option>
            </select>
            <span className="text-sm text-gray-600 hidden md:block">
              {user?.email}
            </span>
            <button
              onClick={handleSignOut}
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              {t('signOut')}
            </button>
          </div>
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