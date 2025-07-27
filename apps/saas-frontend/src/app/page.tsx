import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// Workspace imports - let's test that they can actually be imported
import { SomeCore } from "@tatou/core";
import { SomeUIComponent, Button as TatouButton, Card as TatouCard, CardHeader as TatouCardHeader, CardTitle as TatouCardTitle, CardContent as TatouCardContent } from "@tatou/ui";

export default function Home() {
  return (
    <div className="font-sans min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4">
            Tatou SaaS Platform
          </h1>
          <p className="text-xl text-muted-foreground">
            Modern SaaS frontend with professional UI components from open source
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {/* Core Package Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🚀 Core Package
                <Badge variant="secondary">v{SomeCore.version}</Badge>
              </CardTitle>
              <CardDescription>
                Backend integration and core functionality
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Package: @tatou/core</p>
              <p className="text-sm">Status: {SomeCore.status}</p>
            </CardContent>
          </Card>

          {/* UI Components Showcase */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                🎨 UI Components
                <Badge>OSS Powered</Badge>
              </CardTitle>
              <CardDescription>
                Professional components from shadcn/ui
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Button size="sm">Primary</Button>
                <Button variant="secondary" size="sm">Secondary</Button>
                <Button variant="outline" size="sm">Outline</Button>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Badge>Default</Badge>
                <Badge variant="secondary">Secondary</Badge>
                <Badge variant="outline">Outline</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Workspace Integration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                📦 Workspace
                <Badge variant="outline">Monorepo</Badge>
              </CardTitle>
              <CardDescription>
                Integrated workspace packages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">Legacy: {SomeUIComponent()}</p>
              <TatouButton variant="secondary" size="sm">
                Workspace Button
              </TatouButton>
            </CardContent>
          </Card>
        </div>

        {/* Features Grid */}
        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <TatouCard>
            <TatouCardHeader>
              <TatouCardTitle>🔧 Built with Modern Tools</TatouCardTitle>
            </TatouCardHeader>
            <TatouCardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Next.js 15 with React 19
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                  Tailwind CSS v4
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                  shadcn/ui Components
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
                  Radix UI Primitives
                </li>
              </ul>
            </TatouCardContent>
          </TatouCard>

          <Card>
            <CardHeader>
              <CardTitle>⚡ Performance Features</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
                  Turbopack for fast development
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  pnpm workspace optimization
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-indigo-500 rounded-full"></span>
                  TypeScript for type safety
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 bg-pink-500 rounded-full"></span>
                  ESLint for code quality
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>

        {/* Action Buttons */}
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-4 flex-wrap">
            <Button size="lg">Get Started</Button>
            <Button variant="outline" size="lg">View Documentation</Button>
            <Button variant="secondary" size="lg">Browse Components</Button>
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
        </div>
      </div>
    </div>
  );
}
