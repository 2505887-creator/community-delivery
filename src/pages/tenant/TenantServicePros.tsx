import {
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from 'lucide-react';

import type { LucideIcon } from 'lucide-react';
import type { VerifiedPro } from '../../types';

interface TenantServiceProsProps {
  pros: VerifiedPro[];
  filteredPros: VerifiedPro[];
  categories: string[];

  proSearchQuery: string;
  setProSearchQuery: (query: string) => void;

  proCategoryFilter: string;
  setProCategoryFilter: (category: string) => void;

  renderProviderCard: (pro: VerifiedPro) => React.ReactNode;

  EmptyState: ({
    icon,
    title,
    subtitle,
  }: {
    icon: LucideIcon;
    title: string;
    subtitle: string;
  }) => React.ReactNode;
}

export default function TenantServicePros({
  pros,
  filteredPros,
  categories,
  proSearchQuery,
  setProSearchQuery,
  proCategoryFilter,
  setProCategoryFilter,
  renderProviderCard,
  EmptyState,
}: TenantServiceProsProps) {
  return (
    <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold text-slate-900">
            <ShieldCheck className="h-5 w-5 text-blue-600" />
            Verified Service Providers
          </h2>

          <p className="mt-1 text-sm text-slate-500">
            Find verified professionals available through OmniServe.
          </p>
        </div>

        <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-500">
          {filteredPros.length} of {pros.length}
        </span>
      </div>

      <div className="mt-5 flex flex-col gap-3 lg:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <input
            type="text"
            value={proSearchQuery}
            onChange={(event) =>
              setProSearchQuery(event.target.value)
            }
            placeholder="Search providers..."
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-9 pr-3 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
          />
        </div>

        <div className="relative">
          <SlidersHorizontal className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

          <select
            value={proCategoryFilter}
            onChange={(event) =>
              setProCategoryFilter(event.target.value)
            }
            className="w-full appearance-none rounded-lg border border-slate-200 bg-white py-2.5 pl-9 pr-8 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 lg:w-56"
          >
            <option value="all">All categories</option>

            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="mt-5">
        {filteredPros.length === 0 ? (
          <EmptyState
            icon={ShieldCheck}
            title="No providers found"
            subtitle="Try a different search term or category."
          />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredPros.map(renderProviderCard)}
          </div>
        )}
      </div>
    </section>
  );
}