import type { LucideIcon } from 'lucide-react';
import { AlertCircle } from 'lucide-react';

interface TenantPortalPlaceholderProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export default function TenantPortalPlaceholder({
  icon: Icon,
  title,
  description,
}: TenantPortalPlaceholderProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-50 ring-1 ring-slate-200">
          <Icon className="h-7 w-7 text-slate-400" />
        </div>

        <h2 className="mt-4 text-lg font-bold text-slate-900">
          {title}
        </h2>

        <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">
          {description}
        </p>

        <div className="mt-4 inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-500">
          <AlertCircle className="h-3.5 w-3.5" />
          No backend functionality is connected for this area yet.
        </div>
      </div>
    </section>
  );
}