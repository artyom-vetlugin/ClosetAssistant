import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const Navigation = () => {
  const location = useLocation();
  const { t } = useTranslation('nav');

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: t('home'), icon: '🏠' },
    { path: '/wardrobe', label: t('wardrobe'), icon: '👗' },
    { path: '/add-item', label: t('add'), icon: '➕' },
    { path: '/suggestions', label: t('suggest'), icon: '✨' },
    { path: '/saved', label: t('saved'), icon: '💾' },
    { path: '/history', label: t('history'), icon: '📅' },
  ];

  return (
    <nav className="bg-white border-t border-gray-200 fixed bottom-0 left-0 right-0 z-50 md:relative md:border-t-0 md:border-b md:mb-6">
      <div className="container mx-auto px-4">
        <div className="flex justify-around md:justify-start md:space-x-8">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 text-xs transition-colors ${
                isActive(item.path)
                  ? 'text-primary-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <span className="text-lg mb-1">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navigation;