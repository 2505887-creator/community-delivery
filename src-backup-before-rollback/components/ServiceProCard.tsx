import { Star, ShieldCheck, Clock, Award, MapPin, Phone, CheckCircle2, ChevronRight } from 'lucide-react';
import { VerifiedPro } from '../types';

interface ServiceProCardProps {
  key?: string;
  pro: VerifiedPro;
  onBook: (pro: VerifiedPro) => void;
  onViewCredentials: (pro: VerifiedPro) => void;
}

export default function ServiceProCard({ pro, onBook, onViewCredentials }: ServiceProCardProps) {
  const getCategoryEmoji = (cat: string) => {
    switch (cat) {
      case 'plumbing':
        return '👨‍🔧';
      case 'electrical':
        return '👩‍🏭';
      case 'cleaning':
        return '🧹';
      case 'carpentry':
        return '🪚';
      default:
        return '🛠️';
    }
  };

  return (
    <div
      id={`pro-card-${pro.id}`}
      className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col justify-between hover:border-blue-500 hover:shadow-xs transition-colors group"
    >
      <div>
        {/* Top Pro Header: Avatar + Info */}
        <div className="flex gap-3.5 items-start">
          <div className="relative shrink-0">
            <img
              src={pro.avatar}
              alt={pro.name}
              referrerPolicy="no-referrer"
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl object-cover border border-slate-200 group-hover:border-blue-500 transition-colors"
            />
            {pro.isVerified && (
              <div 
                className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 border-2 border-white shadow-xs"
                title="Verified & Background Checked Pro"
              >
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <div>
                <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug truncate group-hover:text-blue-600 transition-colors">
                  {pro.name}
                  {pro.isVerified && (
                    <span className="ml-2 inline-block px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold rounded-full uppercase tracking-tight">
                      VERIFIED PRO
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 font-medium line-clamp-1 mt-0.5">
                  {pro.title} &bull; {pro.yearsExperience} yrs exp
                </p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-amber-500 font-bold text-xs flex items-center justify-end">
                  ★ {pro.rating.toFixed(1)}
                  <span className="text-slate-400 font-normal ml-0.5">({pro.reviewCount})</span>
                </span>
              </div>
            </div>

            {/* Specialties & Snippet */}
            <p className="text-xs text-slate-500 line-clamp-1 mt-1.5 leading-relaxed">
              {pro.bio}
            </p>

            <div className="flex flex-wrap gap-1 mt-2">
              {pro.specialties.slice(0, 3).map((spec, i) => (
                <span
                  key={i}
                  className="text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-md border border-slate-200/60"
                >
                  {spec}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Pro Metadata Strip */}
        <div className="flex items-center gap-3 text-xs text-slate-400 mt-3 pt-3 border-t border-slate-100">
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-400" />
            <span>{pro.distanceMiles} miles away</span>
          </span>
          <span>&bull;</span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-blue-500" />
            <span>~{pro.responseTimeMin}m response</span>
          </span>
          <span>&bull;</span>
          <span className="text-slate-500 font-medium">{pro.completedJobs}+ jobs</span>
        </div>
      </div>

      {/* Footer Strip with Est. Rate & Action CTA */}
      <div className="flex items-center justify-between gap-3 mt-4 pt-3 border-t border-slate-100">
        <div>
          <span className="text-xs font-bold text-blue-600 text-base sm:text-lg">Ksh{pro.hourlyRate}/hr</span>
          <span className="text-[11px] text-slate-400 font-normal ml-1">Est.</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            id={`view-credentials-${pro.id}`}
            onClick={() => onViewCredentials(pro)}
            className="text-xs text-slate-600 hover:text-slate-900 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
            title="Inspect background verification, license & insurance"
          >
            Credentials
          </button>

          <button
            id={`book-pro-btn-${pro.id}`}
            onClick={() => onBook(pro)}
            className="bg-slate-900 hover:bg-slate-800 text-white text-xs px-4 py-2 rounded-lg font-bold transition-colors cursor-pointer flex items-center space-x-1"
          >
            <span>Request Service</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
