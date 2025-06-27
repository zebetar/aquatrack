
import type { ReactNode } from 'react';
import { memo } from 'react'; // Added memo

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export const PageHeader = memo(({ title, description, actions }: PageHeaderProps) => { // Wrapped with memo
  return (
    <div className="mb-6 flex flex-row items-center justify-between gap-4 rounded-lg border border-border bg-card p-4 shadow-sm sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 gap-2">{actions}</div>}
    </div>
  );
});

PageHeader.displayName = 'PageHeader'; // Added display name for memoized component
