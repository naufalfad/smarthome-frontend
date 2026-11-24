import React, { useState } from 'react';
import {
  Zap,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Sliders,
  ChevronDown,
  ChevronRight,
  Shield,
  RefreshCw,
} from 'lucide-react';
import { DashboardAutomationSummary } from '../../types/dashboard';

interface AutomationOverviewSectionProps {
  summary: DashboardAutomationSummary | null;
  loading: boolean;
  onRefresh: () => void;
}

export const AutomationOverviewSection: React.FC<AutomationOverviewSectionProps> = ({
  summary,
  loading,
  onRefresh,
}) => {
  const [activeTab, setActiveTab] = useState<'rules' | 'executions'>('rules');
  const [expandedExecId, setExpandedExecId] = useState<string | null>(null);

  if (loading && !summary) {
    return (
      <div className="bg-white rounded-3xl p-16 text-center border border-slate-200">
        <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mx-auto mb-3" />
        <p className="text-xs font-bold text-slate-600">Memuat data otomasi rumah...</p>
      </div>
    );
  }

  const rules = summary?.rules || [];
  const executions = summary?.recentExecutions || [];

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'PARTIAL_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            PARTIAL
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      case 'PROCESSING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
            <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
            PROCESSING
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500">
            {status || 'BELUM PERNAH'}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#71758E] tracking-wider">
              Aturan Aktif
            </span>
            <p className="text-2xl font-black text-purple-600 mt-1">
              {summary?.activeCount || 0}
            </p>
            <p className="text-xs text-[#71758E] mt-0.5">Mengevaluasi secara otomatis</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
            <Zap className="w-6 h-6 fill-current" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#71758E] tracking-wider">
              Aturan Nonaktif
            </span>
            <p className="text-2xl font-black text-slate-400 mt-1">
              {summary?.inactiveCount || 0}
            </p>
            <p className="text-xs text-[#71758E] mt-0.5">Dijeda oleh Administrator</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center">
            <Sliders className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-[#71758E] tracking-wider">
              Total Eksekusi Log
            </span>
            <p className="text-2xl font-black text-[#181829] mt-1">
              {executions.length}
            </p>
            <p className="text-xs text-[#71758E] mt-0.5">Audit log tersimpan</p>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Daftar Aturan vs Riwayat Log Eksekusi */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-3 bg-purple-50/40">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('rules')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'rules'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Daftar Aturan Otomasi ({rules.length})
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'executions'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              Log Riwayat Eksekusi ({executions.length})
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
            title="Muat Ulang Data"
          >
            <RefreshCw className="w-4 h-4 text-purple-600" />
          </button>
        </div>

        {/* Content View */}
        <div className="p-6">
          {activeTab === 'rules' ? (
            <div className="space-y-3">
              {rules.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada aturan otomasi yang dikonfigurasi.
                </div>
              ) : (
                rules.map((rule) => (
                  <div
                    key={rule.id}
                    className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 transition-all shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#181829] text-sm">
                          {rule.name}
                        </span>
                        {rule.enabled ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            AKTIF
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-100 text-slate-500">
                            NONAKTIF
                          </span>
                        )}
                        {getStatusBadge(rule.lastExecutionStatus)}
                      </div>
                      <p className="text-xs text-[#71758E] mt-1">
                        {rule.description || 'Tidak ada deskripsi'}
                      </p>

                      <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 flex-wrap">
                        <span>Pemicu: <strong className="text-purple-600 font-mono">{rule.triggerType}</strong></span>
                        <span>•</span>
                        <span>{rule.conditionCount} Kondisi IF &rarr; {rule.actionCount} Aksi THEN</span>
                        <span>•</span>
                        <span>Target: {rule.targetDevices.join(', ') || 'Belum diatur'}</span>
                      </div>
                    </div>

                    <div className="text-right text-xs text-[#71758E] shrink-0 border-t md:border-t-0 pt-2 md:pt-0">
                      <span className="block text-[10px] text-slate-400">Terakhir Dipicu:</span>
                      <span className="font-semibold text-slate-700">
                        {rule.lastTriggeredAt
                          ? new Date(rule.lastTriggeredAt).toLocaleString('id-ID', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : 'Belum pernah'}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {executions.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">
                  Belum ada log eksekusi yang tercatat.
                </div>
              ) : (
                executions.map((exec) => {
                  const isExpanded = expandedExecId === exec.id;
                  const date = new Date(exec.startedAt);

                  return (
                    <div
                      key={exec.id}
                      className="border border-slate-200 rounded-2xl overflow-hidden bg-white shadow-2xs hover:border-purple-200 transition-colors"
                    >
                      <div
                        onClick={() => setExpandedExecId(isExpanded ? null : exec.id)}
                        className="p-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <button className="text-slate-400">
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
                            <span className="text-[11px] text-[#71758E] mt-0.5 block">
                              {date.toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}{' '}
                              {date.toLocaleTimeString('id-ID', {
                                hour: '2-digit',
                                minute: '2-digit',
                                second: '2-digit',
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-slate-100 bg-slate-50/50 space-y-3 text-xs">
                          {exec.errorMessage && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700">
                              <strong>Error:</strong> {exec.errorMessage}
                            </div>
                          )}

                          {exec.triggerData && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">
                                Snapshot Pemicu:
                              </span>
                              <pre className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto">
                                {JSON.stringify(exec.triggerData, null, 2)}
                              </pre>
                            </div>
                          )}

                          {exec.executionResult && (
                            <div>
                              <span className="font-bold text-slate-700 block mb-1">
                                Hasil Tindakan:
                              </span>
                              <pre className="p-3 rounded-xl bg-white border border-slate-200 font-mono text-[10px] text-slate-700 overflow-x-auto">
                                {JSON.stringify(exec.executionResult, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

