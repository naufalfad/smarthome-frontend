/**
 * PHASE 7: AUTOMATION RULE BUILDER MODAL
 * Visual interactive builder for creating, editing, and dry-run testing automation rules.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Play,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Clock,
  Zap,
  Sliders,
  Shield,
  Loader2,
} from 'lucide-react';
import {
  AutomationRule,
  RuleCondition,
  RuleAction,
  ConditionOperator,
  TriggerMode,
  DryRunTestResult,
  ComparisonOperator,
} from '../../types/automation';
import { IoTDevice } from '../../types/device';
import { automationApi } from '../../services/automation.api';

interface AutomationRuleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved: () => void;
  ruleToEdit?: AutomationRule | null;
  devices: IoTDevice[];
  houseId?: string;
}

const READ_ONLY_DEVICE_TYPES = new Set([
  'TEMP_HUMIDITY_SENSOR',
  'AIR_QUALITY_SENSOR',
  'SENSOR',
  'SECURITY_CAMERA',
  'MOTION_SENSOR',
]);

export const AutomationRuleModal: React.FC<AutomationRuleModalProps> = ({
  isOpen,
  onClose,
  onSaved,
  ruleToEdit,
  devices,
  houseId,
}) => {
  // Form States
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<number>(0);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(60);
  const [triggerMode, setTriggerMode] = useState<TriggerMode>('WHEN_CONDITION_BECOMES_TRUE');
  const [conditionOperator, setConditionOperator] = useState<ConditionOperator>('ALL');
  const [conditions, setConditions] = useState<RuleCondition[]>([]);
  const [actions, setActions] = useState<RuleAction[]>([]);

  // Execution & Testing States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDryRunning, setIsDryRunning] = useState(false);
  const [dryRunResult, setDryRunResult] = useState<DryRunTestResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Controllable devices list for actions
  const controllableDevices = devices.filter((d) => {
    const type = d.catalogItem?.deviceType || d.type;
    return !READ_ONLY_DEVICE_TYPES.has(type);
  });

  // Populate or reset form
  useEffect(() => {
    if (!isOpen) {
      setDryRunResult(null);
      setErrorMessage(null);
      return;
    }

    if (ruleToEdit) {
      setName(ruleToEdit.name);
      setDescription(ruleToEdit.description || '');
      setPriority(ruleToEdit.priority || 0);
      setCooldownSeconds(ruleToEdit.cooldownSeconds || 60);
      setTriggerMode(ruleToEdit.triggerMode || 'WHEN_CONDITION_BECOMES_TRUE');
      setConditionOperator(ruleToEdit.conditionOperator || 'ALL');
      setConditions(Array.isArray(ruleToEdit.conditions) ? [...ruleToEdit.conditions] : []);
      setActions(Array.isArray(ruleToEdit.actions) ? [...ruleToEdit.actions] : []);
    } else {
      // Default initial rule draft
      setName('');
      setDescription('');
      setPriority(10);
      setCooldownSeconds(60);
      setTriggerMode('WHEN_CONDITION_BECOMES_TRUE');
      setConditionOperator('ALL');

      // Default condition if any device exists
      const firstSensor = devices.find((d) =>
        ['TEMP_HUMIDITY_SENSOR', 'AIR_QUALITY_SENSOR'].includes(d.catalogItem?.deviceType || d.type)
      ) || devices[0];

      if (firstSensor) {
        setConditions([
          {
            type: 'SENSOR',
            deviceId: firstSensor.id,
            metric: 'temperature',
            operator: '>',
            value: 28,
          },
        ]);
      } else {
        setConditions([]);
      }

      // Default action if any controllable device exists
      if (controllableDevices.length > 0) {
        setActions([
          {
            deviceId: controllableDevices[0].id,
            commandType: 'SET_POWER',
            payload: { power: true },
          },
        ]);
      } else {
        setActions([]);
      }
    }
    setDryRunResult(null);
    setErrorMessage(null);
  }, [isOpen, ruleToEdit, devices]);

  if (!isOpen) return null;

  // ----------------------------------------------------
  // Handlers for Conditions
  // ----------------------------------------------------
  const addCondition = (type: 'SENSOR' | 'DEVICE_STATE' | 'TIME') => {
    if (type === 'SENSOR') {
      const sensorDev = devices.find((d) =>
        ['TEMP_HUMIDITY_SENSOR', 'AIR_QUALITY_SENSOR'].includes(d.catalogItem?.deviceType || d.type)
      ) || devices[0];
      setConditions([
        ...conditions,
        {
          type: 'SENSOR',
          deviceId: sensorDev ? sensorDev.id : '',
          metric: 'temperature',
          operator: '>',
          value: 28,
        },
      ]);
    } else if (type === 'DEVICE_STATE') {
      const dev = devices[0];
      setConditions([
        ...conditions,
        {
          type: 'DEVICE_STATE',
          deviceId: dev ? dev.id : '',
          property: 'power',
          operator: '==',
          value: true,
        },
      ]);
    } else {
      setConditions([
        ...conditions,
        {
          type: 'TIME',
          mode: 'TIME_RANGE',
          startTime: '08:00',
          endTime: '17:00',
          timezone: 'Asia/Jakarta',
        },
      ]);
    }
  };

  const updateCondition = (index: number, updated: RuleCondition) => {
    const next = [...conditions];
    next[index] = updated;
    setConditions(next);
  };

  const removeCondition = (index: number) => {
    setConditions(conditions.filter((_, i) => i !== index));
  };

  // ----------------------------------------------------
  // Handlers for Actions
  // ----------------------------------------------------
  const addAction = () => {
    const dev = controllableDevices[0];
    if (!dev) return;
    setActions([
      ...actions,
      {
        deviceId: dev.id,
        commandType: 'SET_POWER',
        payload: { power: true },
      },
    ]);
  };

  const updateAction = (index: number, updated: RuleAction) => {
    const next = [...actions];
    next[index] = updated;
    setActions(next);
  };

  const removeAction = (index: number) => {
    setActions(actions.filter((_, i) => i !== index));
  };

  // ----------------------------------------------------
  // Dry-run Simulation
  // ----------------------------------------------------
  const handleDryRun = async () => {
    try {
      setIsDryRunning(true);
      setErrorMessage(null);

      const draft = {
        name: name || 'Draf Aturan Otomasi',
        conditionOperator,
        conditions,
        actions,
      };

      const result = await automationApi.testDraftRule(draft);
      setDryRunResult(result);
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menjalankan simulasi dry-run');
    } finally {
      setIsDryRunning(false);
    }
  };

  // ----------------------------------------------------
  // Save Rule
  // ----------------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMessage('Nama aturan wajib diisi');
      return;
    }
    if (conditions.length === 0) {
      setErrorMessage('Minimal harus ada 1 kondisi IF');
      return;
    }
    if (actions.length === 0) {
      setErrorMessage('Minimal harus ada 1 tindakan THEN');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMessage(null);

      const payload = {
        houseId: houseId || ruleToEdit?.houseId || null,
        name: name.trim(),
        description: description.trim() || undefined,
        priority,
        cooldownSeconds,
        triggerMode,
        conditionOperator,
        conditions,
        actions,
      };

      if (ruleToEdit) {
        await automationApi.updateRule(ruleToEdit.id, payload);
      } else {
        await automationApi.createRule(payload);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal menyimpan aturan otomasi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl border border-slate-200 w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-[#181829]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
              <Zap className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181829]">
                {ruleToEdit ? 'Edit Aturan Otomasi' : 'Buat Aturan Otomasi Baru'}
              </h2>
              <p className="text-xs text-[#71758E]">
                Tentukan kondisi otomatis (IF) dan tindakan perangkat (THEN)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-600" />
              <span className="font-medium">{errorMessage}</span>
            </div>
          )}

          {/* Section 1: General Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nama Aturan <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="cth: Suhu Panas -> Nyalakan AC Otomatis"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#181829] placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Deskripsi
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Penjelasan tujuan aturan ini..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-[#181829] placeholder-slate-400 focus:outline-none focus:border-purple-500 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Tuning Params */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 rounded-2xl bg-purple-50/40 border border-purple-100 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Mode Pemicu (Trigger Mode)
              </label>
              <select
                value={triggerMode}
                onChange={(e) => setTriggerMode(e.target.value as TriggerMode)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200/80 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-purple-500"
              >
                <option value="WHEN_CONDITION_BECOMES_TRUE">Saat Kondisi Berubah True (Edge)</option>
                <option value="WHILE_CONDITION_IS_TRUE">Selama Kondisi True (Level)</option>
                <option value="SCHEDULED">Berdasarkan Jadwal / Waktu</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Prioritas (0 - 100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={priority}
                onChange={(e) => setPriority(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200/80 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Angka lebih tinggi dievaluasi lebih dulu</span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Jeda Cooldown (Detik)
              </label>
              <input
                type="number"
                min="0"
                value={cooldownSeconds}
                onChange={(e) => setCooldownSeconds(parseInt(e.target.value, 10) || 0)}
                className="w-full px-2.5 py-1.5 bg-white border border-purple-200/80 rounded-xl text-slate-800 text-xs font-medium focus:outline-none focus:border-purple-500"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Mencegah spam pemicu berulang</span>
            </div>
          </div>

          {/* Section 2: CONDITIONS (IF) */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 font-bold text-xs tracking-wider border border-blue-200">
                  IF
                </span>
                <span className="text-xs font-bold text-[#181829]">Kondisi yang Dipantau</span>
                <span className="text-[11px] text-[#71758E]">({conditions.length} kondisi)</span>
              </div>

              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-500 font-medium">Hubungkan:</span>
                <button
                  type="button"
                  onClick={() => setConditionOperator('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    conditionOperator === 'ALL'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  DAN (ALL)
                </button>
                <button
                  type="button"
                  onClick={() => setConditionOperator('ANY')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                    conditionOperator === 'ANY'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  ATAU (ANY)
                </button>
              </div>
            </div>

            {/* Condition Cards */}
            <div className="space-y-2">
              {conditions.map((cond, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center gap-2 text-xs"
                >
                  <span className="text-slate-400 font-mono font-bold w-5">#{idx + 1}</span>

                  {/* Condition Type */}
                  <select
                    value={cond.type}
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      if (newType === 'SENSOR') {
                        updateCondition(idx, {
                          type: 'SENSOR',
                          deviceId: devices[0]?.id || '',
                          metric: 'temperature',
                          operator: '>',
                          value: 28,
                        });
                      } else if (newType === 'DEVICE_STATE') {
                        updateCondition(idx, {
                          type: 'DEVICE_STATE',
                          deviceId: devices[0]?.id || '',
                          property: 'power',
                          operator: '==',
                          value: true,
                        });
                      } else {
                        updateCondition(idx, {
                          type: 'TIME',
                          mode: 'TIME_RANGE',
                          startTime: '08:00',
                          endTime: '17:00',
                          timezone: 'Asia/Jakarta',
                        });
                      }
                    }}
                    className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                  >
                    <option value="SENSOR">Sensor Metrik</option>
                    <option value="DEVICE_STATE">Status Perangkat</option>
                    <option value="TIME">Waktu / Jadwal</option>
                  </select>

                  {/* SENSOR SPECIFIC */}
                  {cond.type === 'SENSOR' && (
                    <>
                      {/* Device Picker */}
                      <select
                        value={cond.deviceId}
                        onChange={(e) => updateCondition(idx, { ...cond, deviceId: e.target.value })}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium max-w-[180px]"
                      >
                        {devices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.catalogItem?.name || d.type})
                          </option>
                        ))}
                      </select>

                      {/* Metric Picker */}
                      <select
                        value={cond.metric}
                        onChange={(e) => updateCondition(idx, { ...cond, metric: e.target.value })}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                      >
                        <option value="temperature">Suhu (°C)</option>
                        <option value="humidity">Kelembapan (%)</option>
                        <option value="aqi">Kualitas Udara (AQI)</option>
                        <option value="pm25">PM2.5 (µg/m³)</option>
                        <option value="pm10">PM10 (µg/m³)</option>
                      </select>

                      {/* Operator */}
                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          updateCondition(idx, { ...cond, operator: e.target.value as ComparisonOperator })
                        }
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono font-medium"
                      >
                        <option value=">">&gt; Lebih besar dari</option>
                        <option value="<">&lt; Lebih kecil dari</option>
                        <option value=">=">&gt;= Lebih besar atau sama</option>
                        <option value="<=">&lt;= Lebih kecil atau sama</option>
                        <option value="==">== Sama dengan</option>
                        <option value="BETWEEN">Antara (Range)</option>
                      </select>

                      {/* Target Value */}
                      <input
                        type="number"
                        step="any"
                        value={cond.value}
                        onChange={(e) =>
                          updateCondition(idx, { ...cond, value: parseFloat(e.target.value) || 0 })
                        }
                        className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                      />

                      {cond.operator === 'BETWEEN' && (
                        <>
                          <span className="text-slate-500 font-medium">s/d</span>
                          <input
                            type="number"
                            step="any"
                            value={cond.valueMax || 0}
                            onChange={(e) =>
                              updateCondition(idx, { ...cond, valueMax: parseFloat(e.target.value) || 0 })
                            }
                            className="w-20 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                          />
                        </>
                      )}
                    </>
                  )}

                  {/* DEVICE_STATE SPECIFIC */}
                  {cond.type === 'DEVICE_STATE' && (
                    <>
                      <select
                        value={cond.deviceId}
                        onChange={(e) => updateCondition(idx, { ...cond, deviceId: e.target.value })}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium max-w-[180px]"
                      >
                        {devices.map((d) => (
                          <option key={d.id} value={d.id}>
                            {d.name} ({d.catalogItem?.name || d.type})
                          </option>
                        ))}
                      </select>

                      <select
                        value={cond.property}
                        onChange={(e) => updateCondition(idx, { ...cond, property: e.target.value })}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                      >
                        <option value="power">Daya (power)</option>
                        <option value="status">Status</option>
                        <option value="lockState">Kunci Pintu (lockState)</option>
                        <option value="brightness">Kecerahan (brightness)</option>
                        <option value="mode">Mode AC</option>
                      </select>

                      <select
                        value={cond.operator}
                        onChange={(e) =>
                          updateCondition(idx, { ...cond, operator: e.target.value as ComparisonOperator })
                        }
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-mono font-medium"
                      >
                        <option value="==">== Sama dengan</option>
                        <option value="!=">!= Tidak sama</option>
                      </select>

                      {cond.property === 'power' ? (
                        <select
                          value={String(cond.value)}
                          onChange={(e) =>
                            updateCondition(idx, { ...cond, value: e.target.value === 'true' })
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        >
                          <option value="true">ON (Hidup)</option>
                          <option value="false">OFF (Mati)</option>
                        </select>
                      ) : cond.property === 'lockState' ? (
                        <select
                          value={String(cond.value)}
                          onChange={(e) => updateCondition(idx, { ...cond, value: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        >
                          <option value="LOCKED">LOCKED (Terkunci)</option>
                          <option value="UNLOCKED">UNLOCKED (Terbuka)</option>
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={String(cond.value)}
                          onChange={(e) => updateCondition(idx, { ...cond, value: e.target.value })}
                          className="w-28 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        />
                      )}
                    </>
                  )}

                  {/* TIME SPECIFIC */}
                  {(cond.type === 'TIME' || cond.type === 'SCHEDULE') && (
                    <>
                      <select
                        value={cond.mode}
                        onChange={(e) => updateCondition(idx, { ...cond, mode: e.target.value as any })}
                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                      >
                        <option value="TIME_RANGE">Rentang Waktu (Jam Mulai - Jam Selesai)</option>
                        <option value="AFTER_TIME">Setelah Jam (After Time)</option>
                        <option value="BEFORE_TIME">Sebelum Jam (Before Time)</option>
                        <option value="AT_TIME">Tepat Pada Jam (Exact Minute)</option>
                      </select>

                      {cond.mode === 'TIME_RANGE' ? (
                        <>
                          <input
                            type="time"
                            value={cond.startTime || '08:00'}
                            onChange={(e) => updateCondition(idx, { ...cond, startTime: e.target.value })}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                          />
                          <span className="text-slate-500 font-medium">s/d</span>
                          <input
                            type="time"
                            value={cond.endTime || '17:00'}
                            onChange={(e) => updateCondition(idx, { ...cond, endTime: e.target.value })}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                          />
                        </>
                      ) : (
                        <input
                          type="time"
                          value={cond.time || '12:00'}
                          onChange={(e) => updateCondition(idx, { ...cond, time: e.target.value })}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        />
                      )}
                      <span className="text-slate-400 text-[10.5px]">WIB (Asia/Jakarta)</span>
                    </>
                  )}

                  {/* Delete Button */}
                  <button
                    type="button"
                    onClick={() => removeCondition(idx)}
                    className="ml-auto p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Condition Buttons */}
            <div className="flex items-center gap-2 pt-1 text-xs">
              <span className="text-slate-500 font-medium">+ Tambah Kondisi:</span>
              <button
                type="button"
                onClick={() => addCondition('SENSOR')}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-blue-600" />
                Sensor Metrik
              </button>
              <button
                type="button"
                onClick={() => addCondition('DEVICE_STATE')}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                Status Perangkat
              </button>
              <button
                type="button"
                onClick={() => addCondition('TIME')}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold transition-colors flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5 text-amber-600" />
                Jadwal / Waktu
              </button>
            </div>
          </div>

          {/* Section 3: ACTIONS (THEN) */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-xs tracking-wider border border-emerald-200">
                  THEN
                </span>
                <span className="text-xs font-bold text-[#181829]">Tindakan pada Perangkat</span>
                <span className="text-[11px] text-[#71758E]">({actions.length} tindakan)</span>
              </div>
              <span className="text-[11px] text-[#71758E]">
                Perangkat kontrol (Lampu, AC, Kunci). Sensor bersifat read-only.
              </span>
            </div>

            {/* Action Cards */}
            <div className="space-y-2">
              {actions.map((act, idx) => {
                const targetDevice = devices.find((d) => d.id === act.deviceId);
                const devType = targetDevice?.catalogItem?.deviceType || targetDevice?.type || '';

                return (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200/80 rounded-2xl flex flex-wrap items-center gap-2 text-xs"
                  >
                    <span className="text-slate-400 font-mono font-bold w-5">#{idx + 1}</span>

                    {/* Device Picker */}
                    <select
                      value={act.deviceId}
                      onChange={(e) => {
                        const newDevId = e.target.value;
                        const newDev = devices.find((d) => d.id === newDevId);
                        const newType = newDev?.catalogItem?.deviceType || newDev?.type;
                        let defaultCmd = 'SET_POWER';
                        let defaultPayload: Record<string, any> = { power: true };

                        if (newType === 'SMART_LOCK') {
                          defaultCmd = 'SET_LOCK_STATE';
                          defaultPayload = { lockState: 'LOCKED' };
                        } else if (newType === 'SMART_AC') {
                          defaultCmd = 'SET_POWER';
                          defaultPayload = { power: true, targetTemperature: 24, mode: 'COOL' };
                        }

                        updateAction(idx, {
                          deviceId: newDevId,
                          commandType: defaultCmd,
                          payload: defaultPayload,
                        });
                      }}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium max-w-[200px]"
                    >
                      {controllableDevices.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.catalogItem?.name || d.type})
                        </option>
                      ))}
                    </select>

                    {/* Action Controls for SMART LIGHT & DIMMER */}
                    {(devType === 'SMART_LIGHT' || devType === 'SMART_DIMMER' || devType === 'LIGHT') && (
                      <>
                        <select
                          value={act.commandType}
                          onChange={(e) => {
                            const cmd = e.target.value;
                            if (cmd === 'SET_POWER') {
                              updateAction(idx, { ...act, commandType: cmd, payload: { power: true } });
                            } else {
                              updateAction(idx, {
                                ...act,
                                commandType: cmd,
                                payload: { brightness: 80 },
                              });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        >
                          <option value="SET_POWER">Kontrol Daya (Power)</option>
                          <option value="SET_BRIGHTNESS">Atur Kecerahan (Brightness)</option>
                        </select>

                        {act.commandType === 'SET_POWER' ? (
                          <select
                            value={String(act.payload.power)}
                            onChange={(e) =>
                              updateAction(idx, {
                                ...act,
                                payload: { ...act.payload, power: e.target.value === 'true' },
                              })
                            }
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                          >
                            <option value="true">Nyalakan (ON)</option>
                            <option value="false">Matikan (OFF)</option>
                          </select>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={act.payload.brightness ?? 80}
                              onChange={(e) =>
                                updateAction(idx, {
                                  ...act,
                                  payload: { ...act.payload, brightness: parseInt(e.target.value, 10) },
                                })
                              }
                              className="w-24 accent-purple-600"
                            />
                            <span className="w-8 font-mono font-bold text-slate-700">
                              {act.payload.brightness ?? 80}%
                            </span>
                          </div>
                        )}
                      </>
                    )}

                    {/* Action Controls for SMART AC */}
                    {(devType === 'SMART_AC' || devType === 'AIR_CONDITIONER') && (
                      <>
                        <select
                          value={act.commandType}
                          onChange={(e) => {
                            const cmd = e.target.value;
                            if (cmd === 'SET_POWER') {
                              updateAction(idx, { ...act, commandType: cmd, payload: { power: true } });
                            } else if (cmd === 'SET_AC_TEMPERATURE') {
                              updateAction(idx, {
                                ...act,
                                commandType: cmd,
                                payload: { targetTemperature: 24 },
                              });
                            } else if (cmd === 'SET_AC_MODE') {
                              updateAction(idx, { ...act, commandType: cmd, payload: { mode: 'COOL' } });
                            }
                          }}
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        >
                          <option value="SET_POWER">Kontrol Daya AC</option>
                          <option value="SET_AC_TEMPERATURE">Atur Suhu Target AC</option>
                          <option value="SET_AC_MODE">Atur Mode Operasi AC</option>
                        </select>

                        {act.commandType === 'SET_POWER' && (
                          <select
                            value={String(act.payload.power)}
                            onChange={(e) =>
                              updateAction(idx, {
                                ...act,
                                payload: { ...act.payload, power: e.target.value === 'true' },
                              })
                            }
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                          >
                            <option value="true">Nyalakan (ON)</option>
                            <option value="false">Matikan (OFF)</option>
                          </select>
                        )}

                        {act.commandType === 'SET_AC_TEMPERATURE' && (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="16"
                              max="30"
                              value={act.payload.targetTemperature ?? 24}
                              onChange={(e) =>
                                updateAction(idx, {
                                  ...act,
                                  payload: {
                                    ...act.payload,
                                    targetTemperature: parseInt(e.target.value, 10),
                                  },
                                })
                              }
                              className="w-16 px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                            />
                            <span className="text-slate-500 font-medium">°C</span>
                          </div>
                        )}

                        {act.commandType === 'SET_AC_MODE' && (
                          <select
                            value={act.payload.mode || 'COOL'}
                            onChange={(e) =>
                              updateAction(idx, {
                                ...act,
                                payload: { ...act.payload, mode: e.target.value },
                              })
                            }
                            className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                          >
                            <option value="COOL">COOL</option>
                            <option value="HEAT">HEAT</option>
                            <option value="AUTO">AUTO</option>
                            <option value="FAN">FAN</option>
                            <option value="DRY">DRY</option>
                          </select>
                        )}
                      </>
                    )}

                    {/* Action Controls for SMART LOCK */}
                    {(devType === 'SMART_LOCK' || devType === 'LOCK') && (
                      <>
                        <select
                          value={act.commandType}
                          onChange={(e) =>
                            updateAction(idx, {
                              ...act,
                              commandType: e.target.value,
                              payload: { lockState: 'LOCKED' },
                            })
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        >
                          <option value="SET_LOCK_STATE">Kunci / Buka Pintu</option>
                        </select>

                        <select
                          value={act.payload.lockState || 'LOCKED'}
                          onChange={(e) =>
                            updateAction(idx, {
                              ...act,
                              payload: { lockState: e.target.value },
                            })
                          }
                          className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl text-slate-800 font-medium"
                        >
                          <option value="LOCKED">KUNCI (LOCKED)</option>
                          <option value="UNLOCKED">BUKA (UNLOCKED)</option>
                        </select>
                      </>
                    )}

                    {/* Delete Action Button */}
                    <button
                      type="button"
                      onClick={() => removeAction(idx)}
                      className="ml-auto p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Add Action Button */}
            {controllableDevices.length > 0 ? (
              <button
                type="button"
                onClick={addAction}
                className="px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-xs font-bold transition-colors flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                Tambah Tindakan (THEN)
              </button>
            ) : (
              <p className="text-xs text-amber-600 font-medium">
                Belum ada perangkat kontrol (lampu, AC, kunci pintu) yang ditempatkan pada denah ini.
              </p>
            )}
          </div>

          {/* Section 4: DRY RUN INSPECTION BOX */}
          <div className="pt-2">
            <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-200/80 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-purple-950 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-purple-600" />
                    Uji Aturan Secara Langsung (Live Dry-Run Test)
                  </h4>
                  <p className="text-[11px] text-[#71758E]">
                    Mengevaluasi kondisi terhadap sensor live dan memvalidasi keamanan tindakan tanpa mengubah status fisik perangkat.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDryRun}
                  disabled={isDryRunning || conditions.length === 0}
                  className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {isDryRunning ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Play className="w-3.5 h-3.5 fill-current" />
                  )}
                  Uji Aturan Sekarang
                </button>
              </div>

              {dryRunResult && (
                <div className="p-3.5 rounded-xl bg-white border border-purple-200 space-y-2 text-xs shadow-2xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-800 font-bold">Hasil Evaluasi Kondisi Saat Ini:</span>
                    {dryRunResult.isConditionMet ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        Kondisi TERPENUHI (Akan Memicu)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 font-bold text-[11px]">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Kondisi BELUM TERPENUHI
                      </span>
                    )}
                  </div>

                  {/* Conditions Breakdown */}
                  <div className="space-y-1">
                    {dryRunResult.conditionsEvaluated.map((c, i) => (
                      <div key={i} className="text-slate-600 flex items-center gap-2">
                        {c.isMet ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        )}
                        <span className="font-medium">{c.message}</span>
                      </div>
                    ))}
                  </div>

                  {/* Action Validations */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-slate-800 font-bold mb-1">Validasi Keamanan Tindakan:</div>
                    {dryRunResult.actionValidations.map((a, i) => (
                      <div key={i} className="flex items-center gap-2 text-slate-600">
                        {a.isValid ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                        )}
                        <span className="font-medium">
                          {a.deviceName} ({a.deviceType}) &rarr; {a.commandType}:{' '}
                          {a.isValid ? 'Valid & Siap Dijalankan' : a.reason}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || conditions.length === 0 || actions.length === 0}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-xs font-bold text-white shadow-xs transition-all flex items-center gap-2"
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {ruleToEdit ? 'Perbarui Aturan' : 'Simpan & Aktifkan Aturan'}
          </button>
        </div>
      </div>
    </div>
  );
};

