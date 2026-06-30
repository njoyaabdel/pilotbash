import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Bash Assistant',
  description: 'Interact with your file system in natural language',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className="h-full">{children}</body>
    </html>
  );
}
