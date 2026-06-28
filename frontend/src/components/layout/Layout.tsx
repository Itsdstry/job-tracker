import { ReactNode, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/applications': 'Applications',
  '/jobs': 'Job Search',
  '/profile': 'Profile',
};

export const Layout = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMobileView, setIsMobileView] = useState(() => window.innerWidth < 1024);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Job Tracker Pro';
  const sidebarWidth = isCollapsed ? 64 : 256;

  useEffect(() => {
    const updateView = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobileView(mobile);
      if (!mobile) setIsMobileMenuOpen(false);
    };

    updateView();
    window.addEventListener('resize', updateView);
    return () => window.removeEventListener('resize', updateView);
  }, []);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      {isMobileMenuOpen && (
        <button
          type="button"
          aria-label="Close mobile navigation"
          className="fixed inset-0 z-30 bg-black/40 lg:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}
      <Sidebar
        isCollapsed={isCollapsed}
        onToggle={() => setIsCollapsed((c) => !c)}
        isMobileOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
      />
      <Navbar
        sidebarWidth={sidebarWidth}
        title={title}
        onMenuToggle={() => setIsMobileMenuOpen((open) => !open)}
        isMobileView={isMobileView}
      />
      <main
        className="min-h-screen pt-16 transition-all duration-300"
        style={{ marginLeft: isMobileView ? 0 : sidebarWidth }}
      >
        <div className="p-4 sm:p-6">{children}</div>
      </main>
    </div>
  );
};
