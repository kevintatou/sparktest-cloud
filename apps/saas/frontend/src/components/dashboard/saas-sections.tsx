'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  Plus, Users, User, CreditCard, Folder, BarChart3, Monitor, BookOpen,
  Plug, GitBranch, Settings, Bell, Play
} from 'lucide-react';
import { NavigationKey } from './navigation';
import { BillingSection } from './billing-section';

export interface SaasSectionsProps {
  activeTab: NavigationKey;
}

export const SaasSections: React.FC<SaasSectionsProps> = ({ activeTab }) => {
  switch (activeTab) {
    case 'projects':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Projects</h2>
              <p className="text-muted-foreground">
                Organize your tests into projects for better management.
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Project
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <Folder className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No projects yet</h3>
              <p className="text-muted-foreground mb-4">Create projects to organize your tests and collaborate with teams</p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Project
              </Button>
            </CardContent>
          </Card>
        </div>
      );

    case 'teams':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Teams</h2>
              <p className="text-muted-foreground">
                Manage your organization's teams and collaboration.
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Team
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No teams configured</h3>
              <p className="text-muted-foreground mb-4">Set up teams to collaborate on test projects</p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Create Your First Team
              </Button>
            </CardContent>
          </Card>
        </div>
      );

    case 'users':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">User Management</h2>
              <p className="text-muted-foreground">
                Manage users, roles, and permissions across your organization.
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Invite User
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <User className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">User management</h3>
              <p className="text-muted-foreground mb-4">Invite team members and manage permissions</p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Invite Team Members
              </Button>
            </CardContent>
          </Card>
        </div>
      );

    case 'billing':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Billing & Plans</h2>
            <p className="text-muted-foreground">
              Manage your subscription, billing, and usage.
            </p>
          </div>
          <BillingSection />
        </div>
      );

    case 'analytics':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Analytics</h2>
            <p className="text-muted-foreground">
              Insights and metrics about your test performance and trends.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Success Rate</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">94.2%</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+2.1%</span> from last month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Duration</CardTitle>
                <Monitor className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">2.4min</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">-0.3min</span> faster
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Runs</CardTitle>
                <Play className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,245</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-green-600">+12%</span> this month
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Failed Tests</CardTitle>
                <Bell className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">72</div>
                <p className="text-xs text-muted-foreground">
                  <span className="text-red-600">+5</span> this week
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'monitoring':
      return (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Monitoring & Alerts</h2>
              <p className="text-muted-foreground">
                Set up alerts and monitor your test infrastructure health.
              </p>
            </div>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Create Alert
            </Button>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <Bell className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">No alerts configured</h3>
              <p className="text-muted-foreground mb-4">Set up monitoring and alerts for your test infrastructure</p>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Configure Your First Alert
              </Button>
            </CardContent>
          </Card>
        </div>
      );

    case 'integrations':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Integrations</h2>
            <p className="text-muted-foreground">
              Connect SparkTest with your development tools and workflows.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[
              { name: 'GitHub Actions', description: 'Integrate with CI/CD workflows', connected: true },
              { name: 'Slack', description: 'Get notifications in Slack', connected: false },
              { name: 'Jira', description: 'Link test results to issues', connected: false },
              { name: 'Discord', description: 'Team notifications', connected: false },
              { name: 'Webhook', description: 'Custom HTTP callbacks', connected: false },
            ].map((integration) => (
              <Card key={integration.name}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold">{integration.name}</h3>
                    <div className={cn(
                      "h-2 w-2 rounded-full",
                      integration.connected ? "bg-green-500" : "bg-gray-300"
                    )} />
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{integration.description}</p>
                  <Button 
                    variant={integration.connected ? "outline" : "default"} 
                    size="sm" 
                    className="w-full"
                  >
                    {integration.connected ? 'Configure' : 'Connect'}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      );

    case 'audit':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Audit Logs</h2>
            <p className="text-muted-foreground">
              Track all user actions and system events for compliance and security.
            </p>
          </div>
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <h3 className="text-lg font-semibold mb-2">Audit logs</h3>
              <p className="text-muted-foreground mb-4">All user actions and system events are logged here</p>
              <Button variant="outline">
                View Recent Activity
              </Button>
            </CardContent>
          </Card>
        </div>
      );

    case 'docs':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">API Documentation</h2>
            <p className="text-muted-foreground">
              Complete API reference and integration guides.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Quick Start</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Get started with the SparkTest API in minutes
                </p>
                <Button className="w-full">
                  View Quick Start Guide
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>API Reference</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Complete API documentation with examples
                </p>
                <Button variant="outline" className="w-full">
                  Browse API Reference
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    case 'settings':
      return (
        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
            <p className="text-muted-foreground">
              Configure your organization and platform preferences.
            </p>
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Organization Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Organization Name</label>
                  <p className="text-sm text-muted-foreground">Acme Corp</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Custom Domain</label>
                  <p className="text-sm text-muted-foreground">tests.acmecorp.com</p>
                </div>
                <Button variant="outline" className="w-full">
                  Edit Organization
                </Button>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Default Executor</label>
                  <p className="text-sm text-muted-foreground">Kubernetes Cluster</p>
                </div>
                <div>
                  <label className="text-sm font-medium">Retention Policy</label>
                  <p className="text-sm text-muted-foreground">90 days</p>
                </div>
                <Button variant="outline" className="w-full">
                  Configure Platform
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );

    default:
      return null;
  }
};