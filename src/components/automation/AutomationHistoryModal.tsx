/**
 * PHASE 7: AUTOMATION EXECUTION HISTORY MODAL
 * Displays detailed trigger snapshots and command results of past rule executions.
 */

import React, { useEffect, useState } from 'react';
import {
  X,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Zap,
  Sliders,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { automationApi } from '../../services/automation.api';
import { AutomationExecution } from '../../types/automation';

interface AutomationHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  ruleId?: string; // If provided, shows history for this rule; otherwise shows global history
  ruleName?: string;
}

export const AutomationHistoryModal: React.FC<AutomationHistoryModalProps> = ({
  isOpen,
  onClose,
  ruleId,
  ruleName,
}) => {
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);
      if (ruleId) {
        const res = await automationApi.getRuleExecutions(ruleId, 50, 0);
        setExecutions(res.executions);
      } else {
        const res = await automationApi.getAllExecutions(
          50,
          0,
          statusFilter !== 'ALL' ? statusFilter : undefined
        );
        setExecutions(res.executions);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load execution history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchHistory();
    }
  }, [isOpen, ruleId, statusFilter]);

  if (!isOpen) return null;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'PARTIAL_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            PARTIAL
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            FAILED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-sky-600" />
            PROCESSING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-4xl max-h-[88vh] flex flex-col shadow-2xl overflow-hidden text-[#181829]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181829]">
                {ruleName ? `Riwayat Eksekusi: ${ruleName}` : 'Riwayat Eksekusi Otomasi'}
              </h2>
              <p className="text-xs text-[#71758E]">
                Log audit trigger otomatis dan perintah perangkat secara mandiri
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchHistory}
              disabled={loading}
              title="Refresh"
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-colors disabled:opacity-50 shadow-2xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-purple-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors shadow-2xs"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Bar (if global) */}
        {!ruleId && (
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center gap-2 text-xs">
            <span className="text-slate-500 font-medium">Filter Status:</span>
            {['ALL', 'SUCCESS', 'PARTIAL_SUCCESS', 'FAILED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === st
                    ? 'bg-purple-600 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        )}

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {loading && executions.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-sm font-medium text-slate-600">Memuat riwayat eksekusi...</p>
            </div>
          ) : executions.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
              <div className="w-14 h-14 rounded-3xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-400">
                <Zap className="w-7 h-7 stroke-[1.5]" />
              </div>
              <p className="text-sm font-bold text-[#181829]">Belum ada riwayat eksekusi</p>
              <p className="text-xs text-[#71758E] max-w-sm">
                Aturan otomasi akan mencatat log di sini secara otomatis ketika kondisi IF terpenuhi dan tindakan THEN dijalankan.
              </p>
            </div>
          ) : (
            executions.map((exec) => {
              const isExpanded = expandedId === exec.id;
              const startedDate = new Date(exec.startedAt);
              const durationMs = exec.completedAt
                ? new Date(exec.completedAt).getTime() - startedDate.getTime()
                : null;

              return (
                <div
                  key={exec.id}
                  className="border border-slate-200 bg-white rounded-2xl overflow-hidden hover:border-purple-200 transition-colors shadow-xs"
                >
                  {/* Row Summary */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : exec.id)}
                    className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button className="text-slate-400 hover:text-slate-700">
                        {isExpanded ? (
                          <ChevronDown className="w-4 h-4 text-purple-600" />
                        ) : (
                          <ChevronRight className="w-4 h-4" />
                        )}
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-[#181829] text-sm">
                            {exec.rule?.name || 'Automation Rule'}
                          </span>
                          {getStatusBadge(exec.status)}
                        </div>
                        <div className="flex items-center gap-3 mt-1 text-xs text-[#71758E]">
                          <span>
                            {startedDate.toLocaleDateString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}{' '}
                            {startedDate.toLocaleTimeString('id-ID', {
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </span>
                          {durationMs !== null && <span>• {durationMs}ms</span>}
                          {exec.executionResult && (
                            <span>• {exec.executionResult.length} tindakan</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/60 space-y-4 text-xs">
                      {/* Error Banner if any */}
                      {exec.errorMessage && (
                        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                          <span className="font-bold">Error:</span> {exec.errorMessage}
                        </div>
                      )}

                      {/* Trigger Data Snapshot */}
                      {exec.triggerData && (
                        <div>
                          <div className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Sliders className="w-3.5 h-3.5 text-purple-600" />
                            Kondisi yang Memenuhi Trigger:
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1.5 shadow-2xs">
                            {Array.isArray(exec.triggerData.conditions) ? (
                              exec.triggerData.conditions.map((c: any, idx: number) => (
                                <div key={idx} className="text-slate-700 flex items-center gap-2 font-medium">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                  <span>{c.message || JSON.stringify(c)}</span>
                                </div>
                              ))
                            ) : (
                              <pre className="text-slate-700 font-mono text-[11px] overflow-x-auto">
                                {JSON.stringify(exec.triggerData, null, 2)}
                              </pre>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Action Results */}
                      {exec.executionResult && exec.executionResult.length > 0 && (
                        <div>
                          <div className="font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                            <Zap className="w-3.5 h-3.5 text-purple-600" />
                            Tindakan Perangkat yang Dijalankan:
                          </div>
                          <div className="space-y-2">
                            {exec.executionResult.map((res: any, idx: number) => (
                              <div
                                key={idx}
                                className="p-3 rounded-xl bg-white border border-slate-200 flex items-start justify-between gap-3 shadow-2xs"
                              >
                                <div>
                                  <div className="font-bold text-slate-800">
                                    {res.deviceName || res.deviceId} &rarr;{' '}
                                    <span className="text-purple-600 font-mono font-bold">
                                      {res.commandType}
                                    </span>
                                  </div>
                                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                                    Payload: {JSON.stringify(res.payload)}
                                  </div>
                                  {res.commandId && (
                                    <div className="text-[10px] text-slate-400 mt-0.5 font-mono">
                                      Command ID: {res.commandId}
                                    </div>
                                  )}
                                  {res.errorMessage && (
                                    <div className="text-[11px] text-rose-600 mt-1 font-medium">
                                      {res.errorMessage}
                                    </div>
                                  )}
                                </div>
                                <div>{getStatusBadge(res.status)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-[#71758E]">
          <span>Menampilkan hingga 50 eksekusi terakhir</span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors shadow-2xs"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

