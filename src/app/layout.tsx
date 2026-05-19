import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Nebula Flock — Live Agent Status',
  description: 'Watch your Nebula agents as a flock of pigeons. Each bird represents an agent, its color matches its role, and its behavior shows its live status.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-background text-foreground antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
