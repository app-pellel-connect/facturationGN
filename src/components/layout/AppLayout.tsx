import { ReactNode } from 'react';
import { MobileNav } from './MobileNav';
import { HeaderActions } from './HeaderActions';
import { OverdueNotification } from '@/components/notifications/OverdueNotification';

interface AppLayoutProps {
  children: ReactNode;
  title?: string;
}

export function AppLayout({ children, title }: AppLayoutProps) {
  return (
    <div className="min-h-screen bg-background pb-20">
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">{title || 'FactureGN'}</h1>
          <HeaderActions />
        </div>
      </header>
      <main className="p-4">
        {children}
      </main>
      <OverdueNotification />
      <MobileNav />
    </div>
  );
}
