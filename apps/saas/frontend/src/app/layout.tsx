import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SparkTest SaaS',
  description: 'Test execution platform for modern developers',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="font-sans">{children}</body>
    </html>
  );
}
