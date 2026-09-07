import { X, ShieldCheck, CheckCircle2, Award, FileText, Phone, Wrench } from 'lucide-react';
import { VerifiedPro } from '../types';

interface CredentialsModalProps {
  pro: VerifiedPro;
  onClose: () => void;
  onBookNow: () => void;
}

export default function CredentialsModal({ pro, onClose, onBookNow }: CredentialsModalProps) {
  if (!pro) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="credentials-modal-box"
        className="relative bg-white w-full max-w-lg rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <img
              src={pro.avatar}
              alt={pro.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-lg object-cover border border-slate-700 shadow-sm"
            />
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">{pro.name}</h3>
                <span className="bg-blue-500/20 text-blue-300 border border-blue-400/30 text-[9px] uppercase font-bold px-1.5 py-0.2 rounded-full flex items-center space-x-1">
                  <ShieldCheck className="w-2.5 h-2.5 text-blue-400" />
                  <span>Verified</span>
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">{pro.title}</p>
              <p className="text-[11px] text-slate-400">{pro.yearsExperience} Years Experience &bull; Metro NY</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Credentials Body */}
        <div className="p-4 sm:p-5 space-y-4 max-h-[70vh] overflow-y-auto text-xs text-slate-700">
          
          {/* Official License & Background Audit */}
          <div className="bg-blue-50/50 border border-blue-200/80 rounded-lg p-3.5 space-y-2.5">
            <div className="flex items-center space-x-2 text-blue-900 font-bold text-xs">
              <Award className="w-4 h-4 text-blue-700" />
              <span>Government License &amp; Accreditation</span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-slate-500 block text-[10px]">License Registration:</span>
                <span className="font-mono font-bold text-slate-900 text-xs">{pro.licenseNumber}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Status:</span>
                <span className="inline-flex items-center text-emerald-700 font-bold text-xs">
                  <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Active &amp; Verified
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Background Check:</span>
                <span className="text-slate-800 font-semibold text-xs">Passed (Checkr 2025)</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[10px]">Liability Insurance:</span>
                <span className="text-slate-800 font-semibold text-xs">$2,000,000 Active</span>
              </div>
            </div>
          </div>

          {/* Badges */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5">
              Verified Platform Badges
            </h4>
            <div className="flex flex-wrap gap-1.5">
              {pro.badges.map((badge, idx) => (
                <div
                  key={idx}
                  className="flex items-center space-x-1 bg-slate-100 border border-slate-200 text-slate-800 px-2 py-1 rounded-md font-medium text-[11px]"
                >
                  <ShieldCheck className="w-3 h-3 text-blue-600" />
                  <span>{badge}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bio & Experience */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1">
              About Technician
            </h4>
            <p className="leading-relaxed text-slate-600 text-xs">{pro.bio}</p>
          </div>

          {/* Core Master Skills */}
          <div>
            <h4 className="font-bold text-slate-900 uppercase tracking-wider text-[10px] mb-1.5">
              Equipped Specialties
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {pro.specialties.map((spec, idx) => (
                <div key={idx} className="flex items-center space-x-1.5 p-1.5 rounded-md bg-slate-50 border border-slate-200">
                  <Wrench className="w-3 h-3 text-blue-600 shrink-0" />
                  <span className="font-medium text-slate-800 text-[11px]">{spec}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Tenant Guarantee */}
          <div className="border-t border-slate-200 pt-2.5 flex items-start space-x-2 text-slate-500 text-[10px]">
            <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
            <p>
              Every booking with {pro.name} is protected by LocalPro's 100% Workmanship Guarantee.
              If repair fails within 30 days, re-dispatched at zero extra charge.
            </p>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div>
            <span className="text-base font-bold text-blue-600">${pro.hourlyRate}/hr</span>
            <span className="text-[11px] text-slate-500"> &bull; ~{pro.responseTimeMin}m response</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-200 cursor-pointer transition-colors"
            >
              Close
            </button>
            <button
              onClick={() => {
                onClose();
                onBookNow();
              }}
              className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition-colors cursor-pointer"
            >
              Book {pro.name.split(' ')[0]}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
