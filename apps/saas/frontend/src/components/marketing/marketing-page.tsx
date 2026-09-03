'use client';

import type React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  Check,
  Github,
  Laptop,
  Terminal,
  Video,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export function MarketingPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3" aria-label="SparkTest home">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white shadow-sm shadow-sky-500/20">
              <Zap className="h-6 w-6" />
            </span>
            <span>
              <span className="block text-lg font-semibold tracking-tight">SparkTest</span>
              <span className="block text-xs text-muted-foreground">Cloud testing, kept small</span>
            </span>
          </Link>
          <nav className="flex items-center gap-2 text-sm">
            <a href="#how-it-works" className="hidden px-3 py-2 text-muted-foreground hover:text-foreground sm:block">
              How it works
            </a>
            <a href="https://github.com/kevintatou/sparktest" target="_blank" rel="noreferrer" className="hidden items-center gap-2 px-3 py-2 text-muted-foreground hover:text-foreground sm:flex">
              <Github className="h-4 w-4" />
              OSS
            </a>
            <Link href="/?auth=login" className="px-3 py-2 text-muted-foreground hover:text-foreground">
              Sign in
            </Link>
            <Button asChild size="sm">
              <Link href="/?auth=signup">Start free</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="mx-auto grid max-w-6xl gap-14 px-5 pb-20 pt-16 lg:grid-cols-[1fr_0.9fr] lg:items-center lg:px-8 lg:pb-28 lg:pt-24">
        <div>
          <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Free during beta
          </p>
          <h1 className="max-w-2xl text-4xl font-bold tracking-tight sm:text-6xl">
            Run your tests. Anywhere.
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
            Connect your own machine or server, run the tests you already have, and see logs and results in one small dashboard.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/?auth=signup">
                Start free
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg">
              <a href="https://github.com/kevintatou/sparktest" target="_blank" rel="noreferrer">
                <Github className="mr-2 h-4 w-4" />
                View on GitHub
              </a>
            </Button>
          </div>
        </div>

        <div
          className="relative flex aspect-video min-h-[320px] items-center justify-center overflow-hidden rounded-2xl border border-border bg-slate-950 shadow-sm sm:min-h-0"
          data-testid="marketing-video"
        >
          <div className="flex flex-col items-center gap-3 text-center text-white/80">
            <span className="flex h-14 w-14 items-center justify-center rounded-full border border-white/30 bg-white/10">
              <Video className="h-6 w-6" />
            </span>
            <span className="text-sm font-medium">SparkTest demo video</span>
            <span className="text-xs text-white/50">Add product video here</span>
          </div>
          <div className="absolute bottom-4 left-4 flex items-center gap-3 rounded-lg border border-white/15 bg-black/40 px-3 py-2 text-xs text-white/70 backdrop-blur">
            <Laptop className="h-4 w-4" />
            Your machine
            <ArrowRight className="h-4 w-4" />
            <span className="font-medium text-white">Agent</span>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-y border-border bg-card/40">
        <div className="mx-auto max-w-6xl px-5 py-20 lg:px-8">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">How it works</p>
            <h2 className="mt-3 text-3xl font-bold tracking-tight">Agent → Test → Run → Result</h2>
            <p className="mt-4 text-muted-foreground">No new test language. SparkTest runs the commands your team already trusts.</p>
          </div>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            <Step number="01" icon={<Terminal className="h-5 w-5" />} title="Connect an agent" text="Install a small native agent on a laptop, VM, server, or cluster." />
            <Step number="02" icon={<Zap className="h-5 w-5" />} title="Add a command" text="Use npm test, pytest, Playwright, k6, Cypress, Newman, or any command." />
            <Step number="03" icon={<Check className="h-5 w-5" />} title="Run and see the result" text="Trigger a run from the dashboard and inspect its status and output." />
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-6xl gap-12 px-5 py-20 lg:grid-cols-2 lg:px-8">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Your tests. Your infrastructure.</h2>
          <p className="mt-4 leading-7 text-muted-foreground">
            Test execution stays on infrastructure you control. SparkTest Cloud coordinates the work and keeps the result history easy to inspect.
          </p>
        </div>
        <div className="space-y-3 text-sm text-muted-foreground">
          {['No Docker or Kubernetes requirement', 'No proprietary test framework', 'One place for shared logs and run history', 'Small enough for a small development team'].map((item) => (
            <div key={item} className="flex items-center gap-3 border-b border-border pb-3">
              <Check className="h-4 w-4 shrink-0 text-emerald-500" />
              <span>{item}</span>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card/40">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-6 px-5 py-14 sm:flex-row sm:items-center lg:px-8">
          <div>
            <h2 className="text-2xl font-bold">Connect a machine. Run a test.</h2>
            <p className="mt-2 text-muted-foreground">SparkTest Cloud is free during beta.</p>
          </div>
          <Button asChild size="lg"><Link href="/?auth=signup">Start free <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
        </div>
      </section>
    </main>
  );
}

function Step({ number, icon, title, text }: { number: string; icon: React.ReactNode; title: string; text: string }) {
  return (
    <div className="border border-border bg-background p-6">
      <div className="flex items-center justify-between text-primary"><span className="text-xs font-semibold">{number}</span>{icon}</div>
      <h3 className="mt-8 text-lg font-semibold">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-muted-foreground">{text}</p>
    </div>
  );
}
