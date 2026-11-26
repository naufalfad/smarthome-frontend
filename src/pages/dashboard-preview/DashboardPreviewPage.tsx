/**
 * PHASE 8: ADMIN DASHBOARD PREVIEW PAGE
 * Live preview of the Smart Home User Dashboard from the Admin viewport.
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Eye,
  ArrowLeft,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import { floorPlanApi } from '../../services/floor-plan.api';
import { House } from '../../types/floor-plan';
import { ClientDashboardPage } from '../client/ClientDashboardPage';
import { Button } from '../../components/ui/button';

export const DashboardPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [houses, setHouses] = useState<House[]>([]);
  const [selectedHouseId, setSelectedHouseId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    floorPlanApi.getHouses().then((data) => {
      setHouses(data);
      if (data.length > 0) {
        setSelectedHouseId(data[0].id);
      }
      setLoading(false);
    }).catch(() => {
      setLoading(false);
    });
  }, []);

  return (
    <div className="space-y-4">
      {/* Admin Preview Mode Top Banner */}
      <div className="bg-gradient-to-r from-purple-700 to-indigo-800 text-white rounded-2xl p-4 shadow-sm flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
            <Eye className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-black tracking-tight">MODE PREVIEW DASHBOARD PENGHUNI</h2>
              <span className="px-2 py-0.5 rounded-full bg-white/20 text-[9px] font-mono font-bold tracking-wider uppercase">
                ADMIN VIEWPORT
              </span>
            </div>
            <p className="text-xs text-purple-100 mt-0.5">
              Menampilkan pengalaman dashboard rumah secara interaktif persis seperti yang dilihat oleh penghuni rumah.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {houses.length > 1 && (
            <select
              value={selectedHouseId}
              onChange={(e) => setSelectedHouseId(e.target.value)}
              className="bg-purple-900/80 border border-purple-400/40 text-white rounded-xl px-3 py-1.5 text-xs font-bold outline-none cursor-pointer"
            >
              {houses.map((h) => (
                <option key={h.id} value={h.id}>
                  {h.name}
                </option>
              ))}
            </select>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/floor-plan')}
            className="text-xs gap-1.5 bg-white text-purple-900 hover:bg-purple-50 font-bold rounded-xl"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Studio Denah</span>
          </Button>

          <Button
            variant="purple"
            size="sm"
            onClick={() => window.open(selectedHouseId ? `/client/${selectedHouseId}` : '/client', '_blank')}
            className="text-xs gap-1.5 bg-purple-500 hover:bg-purple-400 font-bold rounded-xl shadow-xs"
            title="Buka Halaman Mandiri di Tab Baru"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Tab Mandiri</span>
          </Button>
        </div>
      </div>

      {/* Render the full User Dashboard */}
      {loading ? (
        <div className="min-h-[400px] bg-white rounded-3xl border border-slate-200 flex flex-col items-center justify-center p-8 text-center">
          <RefreshCw className="w-8 h-8 text-purple-600 animate-spin mb-3" />
          <p className="text-xs font-bold text-slate-600">Menyiapkan Preview Dashboard...</p>
        </div>
      ) : (
        <div className="rounded-3xl overflow-hidden border border-slate-200 shadow-md">
          <ClientDashboardPage key={selectedHouseId} initialHouseId={selectedHouseId} />
        </div>
      )}
    </div>
  );
};
