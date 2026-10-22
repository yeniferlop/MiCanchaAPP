import { Goal } from 'lucide-react';

export function AppLogo() {
  return (
    <div className="flex items-center gap-2">
      <Goal className="h-7 w-7 text-primary" />
      <span className="font-bold text-xl font-headline text-foreground">
        MiCanchaApp
      </span>
    </div>
  );
}
