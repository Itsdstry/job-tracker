import { ReactNode, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/applications': 'Applications',
  '/profile': 'Profile',
};

export const Layout = ({ children }: { children: ReactNode }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();

  const title = PAGE_TITLES[location.pathname] || 'Job Tracker Pro';
  const sidebarWidth = isCollapsed ? 64 : 256;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
      <Sidebar isCollapsed={isCollapsed} onToggle={() => setIsCollapsed((c) => !c)} />
      <Navbar sidebarWidth={sidebarWidth} title={title} />
      <main
        className="pt-16 min-h-screen transition-all duration-300"
        style={{ marginLeft: sidebarWidth }}
      >
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
};
