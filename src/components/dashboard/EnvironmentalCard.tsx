import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Sparkles,
} from 'lucide-react';
import { EnvironmentalMetric } from '../../types/dashboard';

interface EnvironmentalCardProps {
  type: 'temperature' | 'humidity' | 'aqi' | 'pm25' | 'pm10';
  title: string;
  metric: EnvironmentalMetric;
}

export const EnvironmentalCard: React.FC<EnvironmentalCardProps> = ({
  type,
  title,
  metric,
}) => {
  const getIcon = () => {
    switch (type) {
      case 'temperature':
        return <Thermometer className="w-5 h-5 text-purple-600" />;
      case 'humidity':
        return <Droplets className="w-5 h-5 text-sky-500" />;
      case 'aqi':
        return <Activity className="w-5 h-5 text-emerald-500" />;
      case 'pm25':
        return <Wind className="w-5 h-5 text-indigo-500" />;
      case 'pm10':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
    }
  };

  const getStatusBadge = () => {
    switch (metric.status) {
      case 'NORMAL':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            NORMAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200 animate-pulse">
            <AlertTriangle className="w-3 h-3 text-amber-600" />
            PERINGATAN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-500 border border-slate-200">
            UNAVAILABLE
          </span>
        );
    }
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return 'Belum ada data';
    const date = new Date(ts);
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  return (
    <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:border-purple-200 transition-all flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center">
              {getIcon()}
            </div>
            <div>
              <h4 className="text-xs font-bold text-[#181829]">{title}</h4>
              {metric.deviceName && (
                <p className="text-[10px] text-[#71758E] truncate max-w-[120px]">
                  {metric.deviceName}
                </p>
              )}
            </div>
          </div>
          {getStatusBadge()}
        </div>

        <div className="my-2">
          {metric.value !== null && metric.value !== undefined ? (
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-black text-[#181829] tracking-tight">
                {metric.value}
              </span>
              <span className="text-xs font-bold text-[#71758E]">
                {metric.unit}
              </span>
            </div>
          ) : (
            <div className="text-sm font-bold text-slate-400 py-1">
              Sensor Tidak Tersedia
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-[#71758E]">
        <span className="flex items-center gap-1 truncate max-w-[150px]">
          <Clock className="w-3 h-3 text-slate-400 shrink-0" />
          <span>{formatTime(metric.updatedAt)}</span>
        </span>
        {metric.thresholdGuide && (
          <span className="text-[9px] text-slate-400 italic hidden sm:inline truncate max-w-[130px]" title={metric.thresholdGuide}>
            {metric.thresholdGuide}
          </span>
        )}
      </div>
    </div>
  );
};

