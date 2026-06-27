import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';

interface NavbarProps {
  sidebarWidth: number;
  title: string;
  onMenuToggle: () => void;
  isMobileView: boolean;
}

export const Navbar = ({ sidebarWidth, title, onMenuToggle, isMobileView }: NavbarProps) => {
  const { theme, toggleTheme } = useTheme();
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === 'en' ? 'es' : 'en');
  };

  return (
    <header
      className="fixed top-0 right-0 z-30 flex h-16 items-center border-b border-gray-200 bg-white/90 px-4 sm:px-6 backdrop-blur dark:border-gray-700 dark:bg-gray-900/90"
      style={{ left: isMobileView ? 0 : sidebarWidth }}
    >
      <div className="flex flex-1 items-center gap-2 sm:gap-3">
        {isMobileView && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="rounded-lg p-2 text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        )}
        <h1 className="truncate text-base font-semibold text-gray-900 dark:text-white sm:text-lg">
          {title}
        </h1>
      </div>

      <div className="flex items-center gap-1">
        {/* Language toggle */}
        <button
          onClick={toggleLanguage}
          className="rounded-lg px-2.5 py-1.5 text-xs font-semibold text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Toggle language"
        >
          {i18n.language === 'en' ? 'ES' : 'EN'}
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-gray-200"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
};
