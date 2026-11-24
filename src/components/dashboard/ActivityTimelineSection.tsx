import React from 'react';
import {
  Clock,
  Zap,
  Radio,
  Sliders,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  User,
} from 'lucide-react';
import { DashboardActivityItem } from '../../types/dashboard';

interface ActivityTimelineSectionProps {
  activities: DashboardActivityItem[];
  loading: boolean;
  onRefresh: () => void;
}

export const ActivityTimelineSection: React.FC<ActivityTimelineSectionProps> = ({
  activities,
  loading,
  onRefresh,
}) => {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            FAILED
          </span>
        );
      case 'PROCESSING':
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 animate-pulse">
            <RefreshCw className="w-3 h-3 text-sky-600 animate-spin" />
            {status}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-purple-50/40">
        <div>
          <h3 className="text-sm font-extrabold text-[#181829]">
            Pusat Aktivitas & Riwayat Rumah
          </h3>
          <p className="text-xs text-[#71758E]">
            Log kronologis perintah manual penghuni dan eksekusi otomasi mandiri backend
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-2xs"
          title="Muat Ulang Aktivitas"
        >
          <RefreshCw className={`w-4 h-4 text-purple-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="p-6">
        {activities.length === 0 ? (
          <div className="text-center py-16 text-slate-400 text-xs">
            <Clock className="w-12 h-12 stroke-[1.5] text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-slate-600">Belum Ada Aktivitas Tercatat</p>
            <p className="text-[#71758E] mt-1 max-w-sm mx-auto">
              Perintah perangkat dan trigger otomasi akan muncul di sini secara otomatis.
            </p>
          </div>
        ) : (
          <div className="relative border-l border-slate-200 ml-4 space-y-6 py-2">
            {activities.map((item) => {
              const date = new Date(item.timestamp);
              const isAuto = item.source === 'AUTOMATION';

              return (
                <div key={item.id} className="relative pl-6 group">
                  {/* Timeline dot */}
                  <div
                    className={`absolute -left-3 top-1 w-6 h-6 rounded-full border-2 border-white shadow-xs flex items-center justify-center text-white ${
                      isAuto ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                  >
                    {isAuto ? <Zap className="w-3 h-3 fill-current" /> : <User className="w-3 h-3" />}
                  </div>

                  <div className="p-4 rounded-2xl border border-slate-200 bg-white hover:border-purple-200 hover:shadow-2xs transition-all space-y-1.5">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#181829] text-xs">
                          {item.title}
                        </span>
                        {getStatusBadge(item.status)}
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            isAuto
                              ? 'bg-purple-50 text-purple-700 border border-purple-200'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isAuto ? 'OTOMASI' : 'MANUAL'}
                        </span>
                      </div>

                      <span className="text-[10px] text-slate-400">
                        {date.toLocaleDateString('id-ID', {
                          day: 'numeric',
                          month: 'short',
                        })}{' '}
                        {date.toLocaleTimeString('id-ID', {
                          hour: '2-digit',
                          minute: '2-digit',
                          second: '2-digit',
                        })}
                      </span>
                    </div>

                    <p className="text-xs text-[#71758E]">{item.description}</p>

                    {item.errorMessage && (
                      <div className="p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-[11px]">
                        <strong>Error:</strong> {item.errorMessage}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

