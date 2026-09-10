import {
  Search,
  ShieldCheck,
  SlidersHorizontal,
  Wrench,
  Sparkles,
  Zap,
  Hammer,
  Settings,
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

const categoryIcons: Record<string, LucideIcon> = {
  plumbing: Wrench,
  electrical: Zap,
  cleaning: Sparkles,
  carpentry: Hammer,
  appliances: Settings,
};

const formatCategory = (category: string) =>
  category.charAt(0).toUpperCase() + category.slice(1);

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
    <section className="space-y-5">
      {/* Header */}
      <div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-medium text-blue-600">
              OmniServe Services
            </p>

            <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-900">
              Find a Service Professional
            </h2>

            <p className="mt-1 max-w-2xl text-sm text-slate-500">
              Browse available professionals, compare their services, and book
              the right person for your needs.
            </p>
          </div>

          <div className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600">
            {filteredPros.length} of {pros.length} professionals
          </div>
        </div>
      </div>

      {/* Search + Filter */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-3 lg:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <input
              type="text"
              value={proSearchQuery}
              onChange={(event) =>
                setProSearchQuery(event.target.value)
              }
              placeholder="Search by provider, service, or specialty..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm outline-none transition placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:ring-2 focus:ring-blue-100"
            />
          </div>

          {/* Category select */}
          <div className="relative">
            <SlidersHorizontal className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

            <select
              value={proCategoryFilter}
              onChange={(event) =>
                setProCategoryFilter(event.target.value)
              }
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white py-3 pl-10 pr-9 text-sm outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 lg:w-60"
            >
              <option value="all">All services</option>

              {categories.map((category) => (
                <option key={category} value={category}>
                  {formatCategory(category)}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Category chips */}
        {categories.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Browse by service
            </p>

            <div className="flex gap-2 overflow-x-auto pb-1">
              <button
                type="button"
                onClick={() => setProCategoryFilter('all')}
                className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                  proCategoryFilter === 'all'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                All
              </button>

              {categories.map((category) => {
                const Icon = categoryIcons[category] ?? Wrench;
                const active = proCategoryFilter === category;

                return (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setProCategoryFilter(category)}
                    className={`flex shrink-0 items-center gap-2 rounded-full px-3.5 py-2 text-sm font-medium transition ${
                      active
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {formatCategory(category)}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      <div>
        {filteredPros.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <EmptyState
              icon={ShieldCheck}
              title="No service professionals found"
              subtitle="Try another search term or choose a different service category."
            />
          </div>
        ) : (
          <>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-900">
                Available professionals
              </h3>

              <span className="text-sm text-slate-500">
                {filteredPros.length} result
                {filteredPros.length !== 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {filteredPros.map(renderProviderCard)}
            </div>
          </>
        )}
      </div>
    </section>
  );
}