'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Play,
  Radio,
  ChevronRight,
  Settings,
} from 'lucide-react';

export type NavigationKey =
  | 'dashboard'
  | 'definitions'
  | 'runs'
  | 'agents'
  | 'settings';

export interface NavigationProps {
  activeTab: NavigationKey;
  setActiveTab: (tab: NavigationKey) => void;
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setSidebarOpen: (open: boolean) => void;
}

const navigationGroups = [
  {
    title: 'Testing',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { key: 'definitions', label: 'Definitions', icon: FileText },
      { key: 'runs', label: 'Runs', icon: Play },
    ],
  },
  {
    title: 'Cloud',
    items: [{ key: 'agents', label: 'Agents', icon: Radio }],
  },
  {
    title: 'Platform',
    items: [{ key: 'settings', label: 'Settings', icon: Settings }],
  },
];

// Custom hook for responsive behavior
function useIsLargeScreen() {
  const [isLargeScreen, setIsLargeScreen] = useState(true);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  return isLargeScreen;
}

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  setSidebarOpen,
}) => {
  const isLargeScreen = useIsLargeScreen();
  return (
    <>
      <div className="flex-1 overflow-y-auto py-5">
        <nav className={cn('space-y-6', sidebarCollapsed ? 'px-3' : 'px-5')}>
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <h3 className="px-1 mb-3 text-xs font-semibold uppercase text-muted-foreground">
                  {group.title}
                </h3>
              )}
              <div className="space-y-2">
                {group.items.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key as NavigationKey);
                      // Close sidebar on mobile after navigation
                      if (!isLargeScreen) {
                        setSidebarOpen(false);
                      }
                    }}
                    className={cn(
                      'group relative flex w-full cursor-pointer items-center rounded-xl text-sm font-medium transition-colors',
                      sidebarCollapsed
                        ? 'justify-center p-3'
                        : 'space-x-3 px-3 py-2.5',
                      activeTab === key
                        ? 'bg-slate-950 text-white shadow-sm shadow-sky-950/10'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    )}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon
                      className={cn(
                        'flex-shrink-0',
                        sidebarCollapsed ? 'h-5 w-5' : 'h-4 w-4'
                      )}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{label}</span>
                    )}
                    {/* Active indicator dot for collapsed mode */}
                    {sidebarCollapsed && activeTab === key && (
                      <div className="absolute right-1 top-1 h-2 w-2 rounded-full bg-white"></div>
                    )}
                  </button>
                ))}
              </div>
              {sidebarCollapsed &&
                group !== navigationGroups[navigationGroups.length - 1] && (
                  <div className="mx-2 my-3 h-px bg-sky-100"></div>
                )}
            </div>
          ))}
        </nav>
      </div>

      <div
        className={cn('border-t border-border p-4', sidebarCollapsed && 'px-2')}
      >
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSidebarCollapsed(!sidebarCollapsed);
            // On mobile, also close the sidebar when collapsing
            if (!isLargeScreen && !sidebarCollapsed) {
              setSidebarOpen(false);
            }
          }}
          className={cn(
            'w-full justify-start border border-transparent text-muted-foreground hover:border-border hover:bg-muted hover:text-foreground',
            sidebarCollapsed && 'justify-center px-0'
          )}
          title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <ChevronRight
            className={cn(
              'h-4 w-4 transition-transform duration-200',
              !sidebarCollapsed && 'rotate-180'
            )}
          />
          {!sidebarCollapsed && (
            <span className="ml-2 text-xs font-medium">Collapse</span>
          )}
        </Button>
      </div>
    </>
  );
};
