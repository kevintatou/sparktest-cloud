'use client';

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Progress,
  Skeleton,
  Spinner
} from "@tatou/ui";

// Workspace imports
import { SomeCore, createUser, validateEmail, formatDate, sortBy, groupBy } from "@tatou/core";
import { SomeUIComponent } from "@tatou/ui";

// Modern OSS integrations
import { useAppStore } from "@/lib/store";
import { useForm } from "react-hook-form";
import { type CreateUser, type Login } from "@/lib/schemas";
import { User, CheckCircle, Users, Activity, TrendingUp, Settings, Search, Bell } from "lucide-react";

export default function Home() {
  const { user, setUser, addNotification } = useAppStore();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);

  // Demo data
  const [users, setUsers] = useState([
    { id: '1', name: 'Alice Johnson', email: 'alice@example.com', role: 'admin', status: 'active' },
    { id: '2', name: 'Bob Smith', email: 'bob@example.com', role: 'user', status: 'active' },
    { id: '3', name: 'Carol Davis', email: 'carol@example.com', role: 'user', status: 'inactive' }
  ]);

  const [projects] = useState([
    { id: '1', name: 'Website Redesign', status: 'active', priority: 'high', assignee: 'Alice Johnson', progress: 75 },
    { id: '2', name: 'Mobile App', status: 'active', priority: 'medium', assignee: 'Bob Smith', progress: 40 },
    { id: '3', name: 'API Documentation', status: 'completed', priority: 'low', assignee: 'Carol Davis', progress: 100 }
  ]);

  // User creation form
  const userForm = useForm<CreateUser>({
    // resolver: zodResolver(CreateUserSchema),  // Temporarily disabled due to version conflict
    defaultValues: {
      name: '',
      email: '',
      role: 'user'
    }
  });

  // Login form
  const loginForm = useForm<Login>({
    // resolver: zodResolver(LoginSchema),  // Temporarily disabled due to version conflict
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false
    }
  });

  const handleCreateUser = (data: CreateUser) => {
    setIsLoading(true);
    const newUser = createUser(data);
    setUsers(prev => [...prev, newUser]);
    addNotification({
      type: 'success',
      title: 'User Created',
      message: `User ${data.name} has been created successfully.`
    });
    userForm.reset();
    setIsLoading(false);
  };

  const handleLogin = (data: Login) => {
    setIsLoading(true);
    // Simulate login
    setTimeout(() => {
      setUser({
        id: '1',
        name: 'Demo User',
        email: data.email,
        role: 'admin',
        status: 'active'
      });
      addNotification({
        type: 'success',
        title: 'Welcome!',
        message: 'You have successfully logged in.'
      });
      setIsLoading(false);
    }, 1000);
  };

  const stats = [
    { label: 'Total Users', value: users.length, change: '+12%', trend: 'up' },
    { label: 'Active Projects', value: projects.filter(p => p.status === 'active').length, change: '+5%', trend: 'up' },
    { label: 'Completion Rate', value: '87%', change: '+3%', trend: 'up' },
    { label: 'System Health', value: '99.9%', change: '0%', trend: 'stable' }
  ];

  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Tatou SaaS Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Comprehensive SaaS solution with full OSS integration and business logic
          </p>
          
          {/* Core Package Info */}
          <div className="flex justify-center items-center gap-4 mt-6">
            <Badge variant="secondary">Core v{SomeCore.version}</Badge>
            <Badge>Status: {SomeCore.status}</Badge>
            <Badge variant="outline">OSS Powered</Badge>
          </div>
        </header>

        {/* Navigation */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-2 p-1 bg-background rounded-lg border">
            {['dashboard', 'users', 'projects', 'forms', 'components'].map((tab) => (
              <Button
                key={tab}
                variant={activeTab === tab ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveTab(tab)}
                className="capitalize"
              >
                {tab}
              </Button>
            ))}
          </div>
        </div>

        {/* Dashboard Tab */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {stats.map((stat, index) => (
                <Card key={index}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="text-xs text-muted-foreground">
                      <span className={stat.trend === 'up' ? 'text-green-600' : 'text-gray-600'}>
                        {stat.change}
                      </span> from last month
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Activity Chart Placeholder */}
            <Card>
              <CardHeader>
                <CardTitle>Activity Overview</CardTitle>
                <CardDescription>
                  Recent platform activity and usage metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] flex items-center justify-center bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg">
                  <div className="text-center">
                    <Activity className="h-12 w-12 mx-auto mb-4 text-blue-500" />
                    <p className="text-lg font-medium">Activity Chart</p>
                    <p className="text-sm text-muted-foreground">Chart visualization would go here</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  User Management
                </CardTitle>
                <CardDescription>
                  Manage users with @tatou/core business logic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b">
                      <tr className="border-b transition-colors hover:bg-muted/50">
                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Avatar</th>
                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Name</th>
                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Email</th>
                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Role</th>
                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Status</th>
                        <th className="h-10 px-2 text-left align-middle font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {users.map((user) => (
                        <tr key={user.id} className="border-b transition-colors hover:bg-muted/50">
                          <td className="p-2 align-middle">
                            <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                              <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                                {user.name.split(' ').map(n => n[0]).join('')}
                              </div>
                            </div>
                          </td>
                          <td className="p-2 align-middle font-medium">{user.name}</td>
                          <td className="p-2 align-middle">{user.email}</td>
                          <td className="p-2 align-middle">
                            <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="p-2 align-middle">
                            <Badge variant={user.status === 'active' ? 'default' : 'secondary'}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="p-2 align-middle">
                            <Button variant="ghost" size="sm">Edit</Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            {/* Data Processing Demo */}
            <Card>
              <CardHeader>
                <CardTitle>Data Processing Demo</CardTitle>
                <CardDescription>
                  Demonstrating @tatou/core utility functions
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="text-sm font-medium leading-none mb-2">Sorted by Name (asc)</div>
                    <div className="text-sm space-y-1 mt-2">
                      {sortBy(users, 'name').map(user => (
                        <div key={user.id} className="p-2 bg-muted rounded">
                          {user.name}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium leading-none mb-2">Grouped by Role</div>
                    <div className="text-sm space-y-2 mt-2">
                      {Object.entries(groupBy(users, 'role')).map(([role, userList]) => (
                        <div key={role}>
                          <Badge variant="outline" className="mb-1">{role}</Badge>
                          {Array.isArray(userList) && userList.map((userData: typeof users[0]) => (
                            <div key={userData.id} className="ml-4 p-1 text-xs">
                              {userData.name}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <Card>
            <CardHeader>
              <CardTitle>Project Management</CardTitle>
              <CardDescription>
                Track project progress and status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="space-y-1">
                      <h4 className="font-medium">{project.name}</h4>
                      <div className="flex items-center gap-2">
                        <Badge variant={project.status === 'completed' ? 'default' : 'secondary'}>
                          {project.status}
                        </Badge>
                        <Badge variant={project.priority === 'high' ? 'destructive' : 'outline'}>
                          {project.priority}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Assigned to {project.assignee}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-sm font-medium">{project.progress}%</div>
                        <Progress value={project.progress} className="w-[100px]" />
                      </div>
                      {project.status === 'completed' && (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Forms Tab */}
        {activeTab === 'forms' && (
          <div className="grid gap-8 md:grid-cols-2">
            {/* User Creation Form */}
            <Card>
              <CardHeader>
                <CardTitle>Create User</CardTitle>
                <CardDescription>
                  Form validation with React Hook Form + Zod
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={userForm.handleSubmit(handleCreateUser)} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="name" className="text-sm font-medium leading-none">Name</label>
                    <input
                      id="name"
                      {...userForm.register('name')}
                      placeholder="Enter full name"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                    {userForm.formState.errors.name && (
                      <p className="text-destructive text-sm">{userForm.formState.errors.name.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium leading-none">Email</label>
                    <input
                      id="email"
                      type="email"
                      {...userForm.register('email')}
                      placeholder="Enter email address"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                    {userForm.formState.errors.email && (
                      <p className="text-destructive text-sm">{userForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="role" className="text-sm font-medium leading-none">Role</label>
                    <select
                      id="role"
                      {...userForm.register('role')}
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                      <option value="guest">Guest</option>
                    </select>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Spinner size="sm" className="mr-2" />}
                    Create User
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Login Form */}
            <Card>
              <CardHeader>
                <CardTitle>Login Demo</CardTitle>
                <CardDescription>
                  Authentication form with state management
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="login-email" className="text-sm font-medium leading-none">Email</label>
                    <input
                      id="login-email"
                      type="email"
                      {...loginForm.register('email')}
                      placeholder="demo@example.com"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                    {loginForm.formState.errors.email && (
                      <p className="text-destructive text-sm">{loginForm.formState.errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium leading-none">Password</label>
                    <input
                      id="password"
                      type="password"
                      {...loginForm.register('password')}
                      placeholder="Enter password"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm"
                    />
                    {loginForm.formState.errors.password && (
                      <p className="text-destructive text-sm">{loginForm.formState.errors.password.message}</p>
                    )}
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      id="remember"
                      type="checkbox"
                      checked={loginForm.watch('rememberMe')}
                      onChange={(e) => loginForm.setValue('rememberMe', e.target.checked)}
                      className="h-4 w-4"
                    />
                    <label htmlFor="remember" className="text-sm font-medium leading-none">Remember me</label>
                  </div>

                  <Button type="submit" disabled={isLoading} className="w-full">
                    {isLoading && <Spinner size="sm" className="mr-2" />}
                    Sign In
                  </Button>
                </form>

                {user && (
                  <div className="mt-4 relative w-full rounded-lg border px-4 py-3 text-sm bg-background text-foreground">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4" />
                      <div>
                        Logged in as {user.name} ({user.email})
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Components Tab */}
        {activeTab === 'components' && (
          <div className="space-y-8">
            {/* Component Showcase */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle>Buttons</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    <Button size="sm">Primary</Button>
                    <Button variant="secondary" size="sm">Secondary</Button>
                    <Button variant="outline" size="sm">Outline</Button>
                    <Button variant="ghost" size="sm">Ghost</Button>
                    <Button variant="link" size="sm">Link</Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Badges</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2 flex-wrap">
                    <Badge>Default</Badge>
                    <Badge variant="secondary">Secondary</Badge>
                    <Badge variant="destructive">Destructive</Badge>
                    <Badge variant="outline">Outline</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Loading States</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-2 items-center">
                    <Spinner size="sm" />
                    <Spinner />
                    <Spinner size="lg" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Progress</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Task 1</span>
                      <span>75%</span>
                    </div>
                    <Progress value={75} />
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span>Task 2</span>
                      <span>40%</span>
                    </div>
                    <Progress value={40} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Avatars</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                        AB
                      </div>
                    </div>
                    <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                        CD
                      </div>
                    </div>
                    <div className="relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-muted">
                      <div className="flex h-full w-full items-center justify-center rounded-full bg-muted text-sm font-medium">
                        EF
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Icons (Lucide React)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <User className="h-5 w-5" />
                    <Settings className="h-5 w-5" />
                    <Search className="h-5 w-5" />
                    <Bell className="h-5 w-5" />
                    <Activity className="h-5 w-5" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* OSS Integration Summary */}
            <Card>
              <CardHeader>
                <CardTitle>🚀 OSS Ecosystem Integration</CardTitle>
                <CardDescription>
                  Modern tools powering this SaaS platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-2">
                    <h4 className="font-medium">State Management</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Zustand for global state</li>
                      <li>• Type-safe store design</li>
                      <li>• Notifications system</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">Forms & Validation</h4>
                    <ul className="text-sm space-y-1">
                      <li>• React Hook Form</li>
                      <li>• Zod schema validation</li>
                      <li>• Type-safe forms</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium">UI Components</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Radix UI primitives</li>
                      <li>• Tailwind CSS styling</li>
                      <li>• Lucide React icons</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t">
          <div className="flex justify-center items-center gap-4 mb-4">
            <Badge variant="outline">Legacy: {SomeUIComponent()}</Badge>
            <Badge variant="outline">Date: {formatDate(new Date())}</Badge>
            <Badge variant="outline">Email Valid: {validateEmail('test@example.com') ? 'Yes' : 'No'}</Badge>
          </div>
          
          <div className="flex justify-center">
            <Image
              className="dark:invert opacity-50"
              src="/next.svg"
              alt="Next.js logo"
              width={120}
              height={25}
              priority
            />
          </div>
        </footer>
      </div>
    </div>
  );
}
