/**
 * PHASE 7: AUTOMATION LIST PANEL
 * Central hub to manage smart home automation rules, view status, toggle rules, and open history.
 */

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Plus,
  Play,
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  RefreshCw,
  Power,
  ShieldCheck,
  Activity,
  Layers,
} from 'lucide-react';
import { automationApi } from '../../services/automation.api';
import {
  AutomationRule,
  AutomationEngineStatus,
} from '../../types/automation';
import { IoTDevice } from '../../types/device';
import { AutomationRuleModal } from './AutomationRuleModal';
import { AutomationHistoryModal } from './AutomationHistoryModal';

interface AutomationListPanelProps {
  isOpen: boolean;
  onClose: () => void;
  devices: IoTDevice[];
  houseId?: string;
}

export const AutomationListPanel: React.FC<AutomationListPanelProps> = ({
  isOpen,
  onClose,
  devices,
  houseId,
}) => {
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [engineStatus, setEngineStatus] = useState<AutomationEngineStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  // Modal states
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [ruleToEdit, setRuleToEdit] = useState<AutomationRule | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedRuleForHistory, setSelectedRuleForHistory] = useState<AutomationRule | null>(null);

  // Fetch rules & engine status
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [fetchedRules, status] = await Promise.all([
        automationApi.getRules({ houseId }),
        automationApi.getEngineStatus(),
      ]);
      setRules(fetchedRules);
      setEngineStatus(status);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat aturan otomasi');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
      // Polling engine status every 6 seconds while panel is open
      const interval = setInterval(async () => {
        try {
          const status = await automationApi.getEngineStatus();
          setEngineStatus(status);
        } catch {}
      }, 6000);
      return () => clearInterval(interval);
    }
  }, [isOpen, houseId]);

  if (!isOpen) return null;

  // Toggle rule enabled state
  const handleToggle = async (rule: AutomationRule) => {
    try {
      // Optimistic update
      setRules((prev) =>
        prev.map((r) => (r.id === rule.id ? { ...r, enabled: !r.enabled } : r))
      );
      await automationApi.toggleRule(rule.id, !rule.enabled);
    } catch (err: any) {
      setError(err.message || 'Gagal mengubah status aturan');
      loadData(); // Revert on failure
    }
  };

  // Delete rule
  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Hapus aturan otomasi "${name}"? Tindakan ini tidak dapat dibatalkan.`)) {
      return;
    }
    try {
      await automationApi.deleteRule(id);
      setRules((prev) => prev.filter((r) => r.id !== id));
    } catch (err: any) {
      setError(err.message || 'Gagal menghapus aturan otomasi');
    }
  };

  // Trigger manual evaluation cycle
  const handleTriggerCycle = async () => {
    try {
      setIsEvaluating(true);
      await automationApi.triggerEvaluation();
      await loadData();
    } catch (err: any) {
      setError(err.message || 'Gagal menjalankan evaluasi siklus');
    } finally {
      setIsEvaluating(false);
    }
  };

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'PARTIAL_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            PARTIAL
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-100 text-slate-500">
            BELUM DIJALANKAN
          </span>
        );
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
        <div className="bg-white border border-slate-200 rounded-3xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#181829]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
                <Zap className="w-5 h-5 fill-current" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-extrabold text-[#181829]">Smart Home Automation Engine</h2>
                  {engineStatus?.isRunning && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      BACKGROUND ACTIVE
                    </span>
                  )}
                </div>
                <p className="text-xs text-[#71758E]">
                  Mesin otomasi mandiri backend (IF sensor/state terpenuhi &rarr; THEN jalankan aksi)
                </p>
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleTriggerCycle}
                disabled={isEvaluating}
                title="Evaluasi Siklus Sekarang"
                className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isEvaluating ? 'animate-spin text-purple-600' : ''}`} />
                Evaluasi Sekarang
              </button>

              <button
                onClick={() => {
                  setSelectedRuleForHistory(null);
                  setIsHistoryModalOpen(true);
                }}
                className="px-3 py-1.5 rounded-xl bg-purple-50 border border-purple-200 hover:bg-purple-100 text-purple-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-2xs"
              >
                <Clock className="w-3.5 h-3.5 text-purple-600" />
                Riwayat Global
              </button>

              <button
                onClick={() => {
                  setRuleToEdit(null);
                  setIsRuleModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Aturan Baru
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Engine Status Banner */}
          {engineStatus && (
            <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex flex-wrap items-center justify-between text-xs text-slate-600 gap-3">
              <div className="flex items-center gap-4">
                <span>
                  Siklus: <strong className="text-slate-900 font-mono">#{engineStatus.cycleCount}</strong>
                </span>
                <span>
                  Aturan Aktif:{' '}
                  <strong className="text-emerald-700 font-bold">{engineStatus.activeRulesCount}</strong>
                </span>
                <span>
                  Total Eksekusi:{' '}
                  <strong className="text-slate-900 font-mono">{engineStatus.totalExecutionsCount}</strong>
                </span>
                {engineStatus.cooldownActiveRules > 0 && (
                  <span className="text-amber-700 font-medium">
                    {engineStatus.cooldownActiveRules} aturan dalam masa cooldown
                  </span>
                )}
              </div>
              <div className="text-[11px] text-slate-500">
                Waktu evaluasi terakhir:{' '}
                {engineStatus.lastCycleAt
                  ? new Date(engineStatus.lastCycleAt).toLocaleTimeString('id-ID')
                  : 'Belum ada'}
              </div>
            </div>
          )}

          {/* Rules List Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white">
            {error && (
              <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {error}
              </div>
            )}

            {loading && rules.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3">
                <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
                <p className="text-xs font-semibold text-slate-600">Memuat daftar aturan otomasi...</p>
              </div>
            ) : rules.length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-3 text-center">
                <Zap className="w-14 h-14 stroke-[1.2] text-slate-300" />
                <p className="text-sm font-bold text-slate-800">Belum ada aturan otomasi</p>
                <p className="text-xs text-[#71758E] max-w-md">
                  Otomasi memungkinkan smart home bertindak secara mandiri tanpa campur tangan manual. Klik "Aturan Baru" untuk membuat aturan IF &rarr; THEN pertama Anda.
                </p>
                <button
                  onClick={() => {
                    setRuleToEdit(null);
                    setIsRuleModalOpen(true);
                  }}
                  className="mt-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-xs font-bold text-white transition-colors shadow-xs"
                >
                  + Buat Aturan Pertama
                </button>
              </div>
            ) : (
              rules.map((rule) => {
                const conditionsCount = Array.isArray(rule.conditions) ? rule.conditions.length : 0;
                const actionsCount = Array.isArray(rule.actions) ? rule.actions.length : 0;

                return (
                  <div
                    key={rule.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      rule.enabled
                        ? 'bg-white border-slate-200 hover:border-purple-300 hover:shadow-xs'
                        : 'bg-slate-50/70 border-slate-200/60 opacity-60'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      {/* Left: Info & Badges */}
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2.5">
                          <button
                            onClick={() => handleToggle(rule)}
                            title={rule.enabled ? 'Nonaktifkan' : 'Aktifkan'}
                            className={`w-9 h-5 rounded-full transition-colors relative flex items-center px-0.5 ${
                              rule.enabled ? 'bg-purple-600' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`w-4 h-4 rounded-full bg-white transition-transform ${
                                rule.enabled ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          <h3 className="font-bold text-sm text-[#181829]">{rule.name}</h3>

                          <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            {rule.triggerType}
                          </span>

                          <span className="px-2 py-0.5 rounded-md text-[10px] bg-slate-100 text-slate-600 font-mono font-bold">
                            P: {rule.priority}
                          </span>

                          {getStatusBadge(rule.lastExecutionStatus)}
                        </div>

                        {rule.description && (
                          <p className="text-xs text-[#71758E]">{rule.description}</p>
                        )}

                        {/* Condition & Action Snippets */}
                        <div className="flex flex-wrap items-center gap-2 text-xs pt-1">
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold border border-blue-200">
                            IF: {conditionsCount} kondisi ({rule.conditionOperator})
                          </span>
                          <span className="text-slate-400 font-bold">&rarr;</span>
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                            THEN: {actionsCount} tindakan
                          </span>
                          <span className="text-slate-300">•</span>
                          <span className="text-slate-500 text-[11px] font-medium">
                            Cooldown: {rule.cooldownSeconds}s
                          </span>
                          {rule.executionCount > 0 && (
                            <span className="text-slate-500 text-[11px] font-medium">
                              • Dipicu {rule.executionCount} kali
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {/* History button */}
                        <button
                          onClick={() => {
                            setSelectedRuleForHistory(rule);
                            setIsHistoryModalOpen(true);
                          }}
                          title="Lihat Riwayat Eksekusi"
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200 text-slate-600 hover:text-purple-700 transition-colors shadow-2xs"
                        >
                          <Clock className="w-4 h-4" />
                        </button>

                        {/* Edit button */}
                        <button
                          onClick={() => {
                            setRuleToEdit(rule);
                            setIsRuleModalOpen(true);
                          }}
                          title="Edit Aturan"
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-purple-50 hover:border-purple-200 text-slate-600 hover:text-purple-700 transition-colors shadow-2xs"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete button */}
                        <button
                          onClick={() => handleDelete(rule.id, rule.name)}
                          title="Hapus Aturan"
                          className="p-2 rounded-xl bg-slate-50 border border-slate-200 hover:bg-rose-50 hover:border-rose-200 text-slate-400 hover:text-rose-600 transition-colors shadow-2xs"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>
              Total {rules.length} aturan terkonfigurasi • Eksekusi mandiri 100% di backend
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold transition-colors shadow-2xs"
            >
              Tutup
            </button>
          </div>
        </div>
      </div>

      {/* Embedded Modals */}
      <AutomationRuleModal
        isOpen={isRuleModalOpen}
        onClose={() => setIsRuleModalOpen(false)}
        onSaved={loadData}
        ruleToEdit={ruleToEdit}
        devices={devices}
        houseId={houseId}
      />

      <AutomationHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        ruleId={selectedRuleForHistory?.id}
        ruleName={selectedRuleForHistory?.name}
      />
    </>
  );
};

