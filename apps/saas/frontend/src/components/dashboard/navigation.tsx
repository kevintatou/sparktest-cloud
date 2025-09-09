'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  LayoutDashboard, FileText, Play, Server, Layers,
  Users, Building2, BarChart3, Bell, Plug, CreditCard, Folder,
  BookOpen, Monitor, GitBranch, User, ChevronRight, Settings
} from 'lucide-react';

export type NavigationKey = 
  | 'dashboard' | 'definitions' | 'runs' | 'executors' | 'suites'
  | 'teams' | 'users' | 'billing' | 'analytics' | 'monitoring' 
  | 'integrations' | 'audit' | 'projects' | 'docs' | 'settings';

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
      { key: 'definitions', label: 'Test Definitions', icon: FileText },
      { key: 'runs', label: 'Test Runs', icon: Play },
      { key: 'executors', label: 'Executors', icon: Server },
      { key: 'suites', label: 'Test Suites', icon: Layers },
    ]
  },
  {
    title: 'Organization',
    items: [
      { key: 'projects', label: 'Projects', icon: Folder },
      { key: 'teams', label: 'Teams', icon: Users },
      { key: 'users', label: 'User Management', icon: User },
      { key: 'billing', label: 'Billing & Plans', icon: CreditCard },
    ]
  },
  {
    title: 'Analytics & Monitoring',
    items: [
      { key: 'analytics', label: 'Analytics', icon: BarChart3 },
      { key: 'monitoring', label: 'Monitoring & Alerts', icon: Monitor },
      { key: 'audit', label: 'Audit Logs', icon: BookOpen },
    ]
  },
  {
    title: 'Platform',
    items: [
      { key: 'integrations', label: 'Integrations', icon: Plug },
      { key: 'docs', label: 'API Documentation', icon: GitBranch },
      { key: 'settings', label: 'Settings', icon: Settings },
    ]
  }
];

export const Navigation: React.FC<NavigationProps> = ({
  activeTab,
  setActiveTab,
  sidebarCollapsed,
  setSidebarCollapsed,
  setSidebarOpen,
}) => {
  return (
    <>
      <div className="flex-1 overflow-y-auto py-6">
        <nav className={cn("space-y-6", sidebarCollapsed ? "px-2" : "px-4")}>
          {navigationGroups.map((group) => (
            <div key={group.title}>
              {!sidebarCollapsed && (
                <h3 className="px-3 mb-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {group.title}
                </h3>
              )}
              <div className="space-y-1">
                {group.items.map(({ key, label, icon: Icon }) => (
                  <button
                    key={key}
                    onClick={() => {
                      setActiveTab(key as NavigationKey);
                      if (window.innerWidth < 1024) setSidebarOpen(false);
                    }}
                    className={cn(
                      "group flex items-center w-full rounded-lg text-sm font-medium transition-all duration-200 cursor-pointer",
                      sidebarCollapsed ? "p-3 justify-center" : "space-x-3 px-3 py-2",
                      activeTab === key
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted/80 hover:scale-[1.02]"
                    )}
                    title={sidebarCollapsed ? label : undefined}
                  >
                    <Icon className={cn(
                      "flex-shrink-0",
                      sidebarCollapsed ? "h-5 w-5" : "h-4 w-4"
                    )} />
                    {!sidebarCollapsed && (
                      <span className="truncate">{label}</span>
                    )}
                    {/* Active indicator dot for collapsed mode */}
                    {sidebarCollapsed && activeTab === key && (
                      <div className="absolute -top-1 -right-1 h-2 w-2 bg-primary-foreground rounded-full"></div>
                    )}
                  </button>
                ))}
              </div>
              {sidebarCollapsed && group !== navigationGroups[navigationGroups.length - 1] && (
                <div className="h-px bg-border/50 mx-2 my-3"></div>
              )}
            </div>
          ))}
        </nav>
      </div>

      {/* Sidebar Footer with Collapse Toggle - Always Visible */}
      <div className={cn("p-4 border-t bg-muted/30", sidebarCollapsed && "px-2")}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSidebarCollapsed(!sidebarCollapsed);
            // On mobile, also close the sidebar when collapsing
            if (window.innerWidth < 1024 && !sidebarCollapsed) {
              setSidebarOpen(false);
            }
          }}
          className={cn(
            "w-full justify-start group hover:bg-accent/50 border border-transparent hover:border-border",
            sidebarCollapsed && "justify-center px-0"
          )}
          title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          <ChevronRight className={cn(
            "h-4 w-4 transition-transform duration-200",
            !sidebarCollapsed && "rotate-180"
          )} />
          {!sidebarCollapsed && <span className="ml-2 text-xs font-medium">Collapse</span>}
        </Button>
      </div>
    </>
  );
};