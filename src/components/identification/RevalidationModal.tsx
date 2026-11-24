import React, { useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  PlusCircle,
  MinusCircle,
  Loader2,
  ShieldCheck,
} from 'lucide-react';
import { RevalidationReport } from '../../types/identification';
import { identificationApi } from '../../services/identification.api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface RevalidationModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseModelId: string;
  onRevalidated: () => void;
}

export const RevalidationModal: React.FC<RevalidationModalProps> = ({
  isOpen,
  onClose,
  houseModelId,
  onRevalidated,
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [report, setReport] = useState<RevalidationReport | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleRunRevalidation = async () => {
    setIsRunning(true);
    setErrorMessage(null);
    try {
      const result = await identificationApi.revalidate(houseModelId);
      setReport(result);
      onRevalidated();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to revalidate GLB against identifications');
    } finally {
      setIsRunning(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-50 text-[#8B5CF6]">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181829] tracking-tight">
                GLB Hierarchy Revalidation
              </h2>
              <p className="text-xs text-[#71758E]">
                Safely verify stored identities against the 3D model internal node graph
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-[#71758E] leading-relaxed flex items-start gap-2.5">
            <ShieldCheck className="w-5 h-5 text-[#8B5CF6] shrink-0 mt-0.5" />
            <span>
              This safety engine compares every stored room, object, and anchor against the GLB file. If nodes were renamed or moved between rooms in Blender, they will be flagged for review <strong>without deleting any existing data</strong>.
            </span>
          </div>

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100 text-xs text-rose-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {report && (
            <div className="space-y-3 animate-in fade-in">
              <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider block">
                Revalidation Summary
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs">
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100">
                  <span className="text-lg font-black text-emerald-800 block">
                    {report.summary.totalMatched}
                  </span>
                  <span className="text-[10px] text-emerald-700 font-bold">Matched Nodes</span>
                </div>

                <div className="p-3 rounded-2xl bg-purple-50 border border-purple-100">
                  <span className="text-lg font-black text-[#7C3AED] block">
                    {report.summary.totalNew}
                  </span>
                  <span className="text-[10px] text-[#7C3AED] font-bold">New Nodes</span>
                </div>

                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-100">
                  <span className="text-lg font-black text-amber-800 block">
                    {report.summary.totalNeedsReview}
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">Needs Review</span>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50 border border-rose-100">
                  <span className="text-lg font-black text-rose-700 block">
                    {report.summary.totalMissing}
                  </span>
                  <span className="text-[10px] text-rose-600 font-bold">Missing Nodes</span>
                </div>
              </div>

              {/* Discrepancies Details if any */}
              {report.details.needsReview.length > 0 && (
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-bold text-amber-800">
                    Hierarchy Changes Flagged for Review:
                  </span>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                    {report.details.needsReview.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2 rounded-xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-900 font-mono"
                      >
                        <strong>{item.nodeName}</strong>: {item.reason}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="secondary" size="sm" pill onClick={onClose}>
            Close
          </Button>

          <Button
            variant="purple"
            size="sm"
            pill
            disabled={isRunning}
            onClick={handleRunRevalidation}
            className="gap-1.5"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Scanning GLB Structure...</span>
              </>
            ) : (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Run Revalidation Now</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

