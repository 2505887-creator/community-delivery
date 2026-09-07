import { useState } from 'react';
import { Sparkles, X, AlertTriangle, ShieldCheck, CheckCircle2, ArrowRight, Loader2, Wrench } from 'lucide-react';
import { VerifiedPro } from '../types';

interface AiDiagnosisResult {
  diagnosis: string;
  urgency: 'emergency' | 'high' | 'medium' | 'standard';
  recommendedTrade: 'plumbing' | 'electrical' | 'cleaning' | 'carpentry' | 'appliances';
  estimatedCostRange: string;
  estimatedTimeHours: string;
  safetyWarning: string;
  recommendedSpecialty: string;
  materialsLikelyNeeded: string[];
}

interface AiDiagnosisModalProps {
  pros: VerifiedPro[];
  onClose: () => void;
  onSelectProToBook: (pro: VerifiedPro, initialDescription: string, urgency: 'normal' | 'emergency') => void;
}

export default function AiDiagnosisModal({
  pros,
  onClose,
  onSelectProToBook
}: AiDiagnosisModalProps) {
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<AiDiagnosisResult | null>(null);

  const quickPrompts = [
    'Kitchen sink pipe leaking water into base cabinet under sink',
    'Main circuit breaker tripped and sparks near washing machine outlet',
    'Toilet overflowing onto floor, fill valve will not stop running',
    'Deep apartment move-out cleaning needed with oven and tile grout scrubbing'
  ];

  const handleDiagnose = async (textToDiagnose?: string) => {
    const query = textToDiagnose || description;
    if (!query.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/ai/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ issueDescription: query })
      });
      const data = await response.json();
      if (data.success && data.data) {
        setResult(data.data);
      }
    } catch (err) {
      console.error('Diagnosis error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Find the highest rated matching verified pro for the recommended trade
  const matchedPro = result
    ? pros.find(p => p.category === result.recommendedTrade) || pros[0] || null
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div 
        id="ai-diagnosis-modal-box"
        className="relative bg-white w-full max-w-xl rounded-xl shadow-xl border border-slate-200 overflow-hidden my-6 transition-all"
      >
        {/* Modal Top Header */}
        <div className="p-4 sm:p-5 bg-slate-900 text-white flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/20 border border-blue-400/40 flex items-center justify-center text-blue-300">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base text-white">AI Home Issue Diagnostic</h3>
                <span className="bg-blue-500/20 text-blue-300 text-[9px] font-bold px-1.5 py-0.2 rounded uppercase tracking-wider">
                  Gemini
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Instant safety triage, fair price estimates, and top verified trade matching.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="p-4 sm:p-5 space-y-4">
          {/* Input Box */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
              Describe What Happened In Your Apartment
            </label>
            <textarea
              id="ai-diagnosis-input"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Water is leaking through the ceiling tile under the bathroom above, and valve is jammed."
              className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-xs text-slate-800 placeholder-slate-400 resize-none outline-hidden"
            />

            {/* Quick Prompts */}
            <div className="mt-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Quick Examples:</span>
              <div className="flex flex-wrap gap-1.5">
                {quickPrompts.map((example, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setDescription(example);
                      handleDiagnose(example);
                    }}
                    className="text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md transition-colors text-left cursor-pointer truncate max-w-xs"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              id="submit-ai-diagnosis-btn"
              disabled={isLoading || !description.trim()}
              onClick={() => handleDiagnose()}
              className="w-full mt-3 py-2 px-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold rounded-lg text-xs shadow-xs transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing Issue &amp; Calculating Cost...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Analyze Issue &amp; Match Pro</span>
                </>
              )}
            </button>
          </div>

          {/* AI Result Cards */}
          {result && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              {/* Immediate Safety Alert */}
              <div className={`p-3 rounded-lg border ${
                result.urgency === 'emergency' 
                  ? 'bg-rose-50 border-rose-200 text-rose-900' 
                  : 'bg-amber-50 border-amber-200 text-amber-900'
              }`}>
                <div className="flex items-center space-x-1.5 font-bold text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  <span>Immediate Action Required:</span>
                </div>
                <p className="text-[11px] mt-0.5 font-medium leading-relaxed">
                  {result.safetyWarning}
                </p>
              </div>

              {/* Diagnosis Summary & Pricing Range */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Specialist Needed</span>
                  <span className="font-bold text-slate-900 capitalize text-xs">
                    {result.recommendedTrade} Pro
                  </span>
                  <p className="text-[10px] text-slate-500 mt-0.5">{result.recommendedSpecialty}</p>
                </div>

                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                  <span className="text-slate-500 text-[10px] block uppercase font-bold">Cost Estimate</span>
                  <span className="font-bold text-emerald-600 text-xs">{result.estimatedCostRange}</span>
                  <p className="text-[10px] text-slate-500 mt-0.5">Est. time: {result.estimatedTimeHours}</p>
                </div>
              </div>

              {/* Technical Diagnosis Detail */}
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs">
                <span className="font-bold text-slate-700 block mb-0.5 text-[11px]">Technical Assessment:</span>
                <p className="text-slate-600 leading-relaxed text-[11px]">{result.diagnosis}</p>

                {result.materialsLikelyNeeded && result.materialsLikelyNeeded.length > 0 && (
                  <div className="mt-2 pt-1.5 border-t border-slate-200 flex items-center space-x-1.5 flex-wrap">
                    <span className="text-slate-400 text-[10px] uppercase font-bold">Hardware expected:</span>
                    {result.materialsLikelyNeeded.map((mat, i) => (
                      <span key={i} className="bg-white border border-slate-200 px-1.5 py-0.2 rounded text-[10px] text-slate-600">
                        {mat}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* 1-Click Top Match Pro Dispatch Recommendation */}
              {matchedPro && (
                <div className="p-3 rounded-lg bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
                  <div className="flex items-center space-x-2.5">
                    <img
                      src={matchedPro?.avatar || ''}
                      alt={matchedPro?.name || 'Pro'}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-lg object-cover border border-blue-300"
                    />
                    <div>
                      <div className="flex items-center space-x-1.5">
                        <h5 className="font-bold text-xs text-slate-900">{matchedPro?.name || 'Verified Pro'}</h5>
                        <ShieldCheck className="w-3 h-3 text-blue-600" />
                      </div>
                      <p className="text-[11px] text-slate-500">
                        {matchedPro?.title} &bull; ${matchedPro?.hourlyRate}/hr
                      </p>
                      <span className="text-[10px] text-emerald-700 font-semibold">
                        ★ {matchedPro?.rating} ({matchedPro?.completedJobs} jobs) &bull; {matchedPro?.distanceMiles} mi away
                      </span>
                    </div>
                  </div>

                  <button
                    id="ai-book-matched-pro-btn"
                    onClick={() => {
                      onClose();
                      onSelectProToBook(
                        matchedPro,
                        description,
                        result.urgency === 'emergency' ? 'emergency' : 'normal'
                      );
                    }}
                    className="w-full sm:w-auto px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer shrink-0"
                  >
                    <span>Instant Book {matchedPro.name.split(' ')[0]}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              )}

            </div>
          )}
        </div>
      </div>
    </div>
  );
}
