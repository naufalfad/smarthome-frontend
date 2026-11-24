import React, { useState } from 'react';
import { useApiHealth } from '../../hooks/useApiHealth';
import { Badge } from '../ui/badge';
import { Modal } from '../ui/modal';
import { Button } from '../ui/button';
import { Activity, RefreshCw, Server, Database, AlertCircle } from 'lucide-react';
import { api } from '../../services/api';

export const ApiStatusBadge: React.FC = () => {
  const { status, data, error, latency, refresh } = useApiHealth();
  const [modalOpen, setModalOpen] = useState(false);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [isTestingDb, setIsTestingDb] = useState(false);

  const testDatabase = async () => {
    setIsTestingDb(true);
    try {
      const res = await api.getDbHealth();
      setDbStatus(res);
    } catch (err: any) {
      setDbStatus({ success: false, message: err?.message || 'Database test failed' });
    } finally {
      setIsTestingDb(false);
    }
  };

  const handleOpenModal = () => {
    setModalOpen(true);
    testDatabase();
  };

  const statusConfigs = {
    online: {
      variant: 'success' as const,
      text: 'API: Online',
    },
    connecting: {
      variant: 'warning' as const,
      text: 'API: Connecting...',
    },
    offline: {
      variant: 'danger' as const,
      text: 'API: Offline',
    },
  };

  const current = statusConfigs[status];

  return (
    <>
      <button
        onClick={handleOpenModal}
        className="cursor-pointer transition-transform active:scale-95 focus:outline-none"
        title="Click to view backend health diagnostics"
      >
        <Badge
          variant={current.variant}
          pulse={status === 'online'}
          className="gap-1.5 py-1.5 px-3.5 text-xs font-mono font-medium shadow-xs hover:border-slate-300 transition-colors bg-white/90"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>{current.text}</span>
          {latency !== null && status === 'online' && (
            <span className="text-[10px] opacity-75 font-normal">
              ({latency}ms)
            </span>
          )}
        </Badge>
      </button>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Backend System & API Status"
        description="Live diagnostics for Smart Home 3D REST API and Database connection"
        footer={
          <div className="flex items-center justify-between w-full">
            <span className="text-[11px] text-[#71758E]">
              Endpoint: <code className="text-[#8B5CF6] font-mono">{api.getBaseUrl()}</code>
            </span>
            <Button
              size="sm"
              variant="outline"
              pill
              onClick={() => {
                refresh();
                testDatabase();
              }}
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Refresh Now</span>
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {/* Main API status block */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  status === 'online'
                    ? 'bg-emerald-100/80 text-emerald-600 border border-emerald-200'
                    : 'bg-rose-100/80 text-rose-600 border border-rose-200'
                }`}
              >
                <Server className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#181829]">
                  Express.js REST API
                </div>
                <div className="text-[11px] text-[#71758E]">
                  {status === 'online'
                    ? `Healthy — Latency: ${latency ?? 0}ms`
                    : 'Offline / Cannot connect to server'}
                </div>
              </div>
            </div>
            <Badge variant={status === 'online' ? 'success' : 'danger'}>
              {status.toUpperCase()}
            </Badge>
          </div>

          {/* Database status block */}
          <div className="p-4 rounded-2xl border border-slate-100 bg-slate-50/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div
                className={`p-2.5 rounded-xl ${
                  dbStatus?.data?.isConnected
                    ? 'bg-emerald-100/80 text-emerald-600 border border-emerald-200'
                    : 'bg-amber-100/80 text-amber-700 border border-amber-200'
                }`}
              >
                <Database className="w-5 h-5" />
              </div>
              <div>
                <div className="text-xs font-bold text-[#181829]">
                  PostgreSQL / Prisma Client
                </div>
                <div className="text-[11px] text-[#71758E]">
                  {isTestingDb
                    ? 'Pinging database...'
                    : dbStatus?.data?.isConnected
                    ? `Connected via Prisma (${dbStatus?.data?.latencyMs || 0}ms)`
                    : 'Not yet connected (Configure DATABASE_URL in backend/.env)'}
                </div>
              </div>
            </div>
            <Badge
              variant={
                dbStatus?.data?.isConnected ? 'success' : 'warning'
              }
            >
              {dbStatus?.data?.isConnected ? 'CONNECTED' : 'STANDBY'}
            </Badge>
          </div>

          {/* Details table if online */}
          {data && (
            <div className="rounded-2xl border border-slate-100 bg-white p-4 space-y-2 text-xs shadow-xs">
              <div className="text-[11px] font-bold text-[#71758E] uppercase tracking-wider mb-2">
                Server Telemetry
              </div>
              <div className="grid grid-cols-2 gap-2.5 text-slate-700">
                <div>
                  <span className="text-[#71758E]">Environment:</span>{' '}
                  <span className="font-mono font-medium text-[#7C3AED]">
                    {data.environment}
                  </span>
                </div>
                <div>
                  <span className="text-[#71758E]">Node.js:</span>{' '}
                  <span className="font-mono text-[#181829]">
                    {data.nodeVersion}
                  </span>
                </div>
                <div>
                  <span className="text-[#71758E]">Memory (Heap):</span>{' '}
                  <span className="font-mono text-[#181829]">
                    {data.memoryUsageMb.heapUsed} MB / {data.memoryUsageMb.heapTotal} MB
                  </span>
                </div>
                <div>
                  <span className="text-[#71758E]">Uptime:</span>{' '}
                  <span className="font-mono text-[#181829]">
                    {data.uptimeSeconds}s
                  </span>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Connection Error</p>
                <p className="text-[11px] opacity-90 mt-0.5">{error}</p>
                <p className="text-[10px] text-rose-500 mt-1.5">
                  Ensure the backend process is running (`npm run dev:backend`).
                </p>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};
