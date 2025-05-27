
import type { ReactNode } from 'react';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-t from-blue-300 via-blue-100 to-sky-50 p-4">
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
