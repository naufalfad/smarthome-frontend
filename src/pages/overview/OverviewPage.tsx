import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid2X2,
  Crosshair,
  Cpu,
  ArrowRight,
  Boxes,
  Clock,
  Sparkles,
  Wind,
  Lightbulb,
  Zap,
  Camera,
  CheckCircle2,
  Map,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/common/StatCard';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { houseModelApi } from '../../services/house-model.api';
import { HouseModel } from '../../types/house-model';

export const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [modelCount, setModelCount] = useState<number>(0);
  const [recentModels, setRecentModels] = useState<HouseModel[]>([]);

  useEffect(() => {
    houseModelApi
      .getHouseModels({ limit: 4 })
      .then((data) => {
        setModelCount(data.pagination.total);
        setRecentModels(data.models);
      })
      .catch((err) => {
        console.warn('Failed to load overview model count:', err);
      });
  }, []);

  return (
    <div className="space-y-6">
      {/* Page Header with Action Buttons */}
      <PageHeader
        title="Admin Workspace Overview"
        description="Unified administration hub for interactive 2D floor plans, spatial zones, and IoT device topology."
        breadcrumbs={[{ label: 'Overview', isCurrent: true }]}
        actions={
          <div className="flex items-center gap-2.5">
            <Button
              onClick={() => navigate('/floor-plan')}
              variant="purple"
              size="sm"
              pill
              className="gap-1.5"
            >
              <Map className="w-4 h-4" />
              <span>Launch 2D Floor Plan</span>
            </Button>
            <Button
              onClick={() => navigate('/models')}
              variant="secondary"
              size="sm"
              pill
              className="gap-1.5 text-slate-600"
            >
              <Box className="w-3.5 h-3.5" />
              <span>Legacy 3D Library</span>
            </Button>
          </div>
        }
      />

      {/* Filter / Quick Category Pills */}
      <div className="flex flex-wrap items-center gap-2">
        <button className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white border border-slate-200/90 text-xs font-semibold text-[#181829] shadow-xs hover:border-purple-300 transition-colors">
          <Wind className="w-3.5 h-3.5 text-[#8B5CF6]" />
          <span>Spatial Overview</span>
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/70 border border-slate-200/80 text-xs text-[#71758E] hover:text-[#181829] shadow-xs hover:bg-white transition-colors">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Lighting Nodes</span>
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/70 border border-slate-200/80 text-xs text-[#71758E] hover:text-[#181829] shadow-xs hover:bg-white transition-colors">
          <Zap className="w-3.5 h-3.5 text-emerald-500" />
          <span>Power & Relays</span>
        </button>
        <button className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white/70 border border-slate-200/80 text-xs text-[#71758E] hover:text-[#181829] shadow-xs hover:bg-white transition-colors">
          <Camera className="w-3.5 h-3.5 text-blue-500" />
          <span>Camera Orbits</span>
        </button>
      </div>

      {/* Welcome Banner */}
      <div className="relative rounded-[26px] border border-white/80 bg-gradient-to-r from-purple-100/70 via-white to-purple-50/50 p-6 lg:p-8 overflow-hidden shadow-[0_12px_32px_-4px_rgba(112,118,150,0.08)]">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="purple" className="mb-3 shadow-xs">
            <Sparkles className="w-3 h-3 text-[#8B5CF6]" />
            Phase 1 Active — 2D Floor Plan Studio Transition
          </Badge>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#181829] tracking-tight">
            Welcome to Smart Home 2D Floor Plan Studio
          </h2>
          <p className="text-sm text-[#71758E] mt-2.5 leading-relaxed">
            This administrative workspace enables interactive 2D floor plan layout authoring,
            room boundary management, interior element positioning, and IoT device binding.
            Previous 3D Dollhouse capabilities are securely preserved under Legacy 3D Studio.
          </p>

          <div className="flex flex-wrap items-center gap-3 mt-6">
            <Button
              size="sm"
              variant="purple"
              pill
              onClick={() => navigate('/floor-plan')}
              className="gap-1.5"
            >
              <Map className="w-4 h-4" />
              <span>Open 2D Floor Plan Studio</span>
            </Button>
            <Button
              size="sm"
              variant="secondary"
              pill
              onClick={() => navigate('/models')}
              className="gap-1.5 text-slate-600"
            >
              <Boxes className="w-4 h-4" />
              <span>Legacy 3D Dollhouse Models ({modelCount})</span>
            </Button>
          </div>
        </div>

        <div className="absolute right-4 -bottom-6 opacity-10 pointer-events-none hidden md:block">
          <Boxes className="w-64 h-64 text-[#8B5CF6]" />
        </div>
      </div>

      {/* Metric KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="3D Home Models"
          value={modelCount}
          statusText={
            modelCount > 0
              ? `${modelCount} models stored in database`
              : 'No models imported yet'
          }
          badge="GLB 2.0"
          hint="Manage architectural dollhouses in Model Library"
          icon={Box}
          highlight={true}
        />
        <StatCard
          title="Configured Rooms"
          value={0}
          statusText="Spatial boundaries standby"
          badge="SPATIAL"
          hint="Room isolation activates in Phase 3"
          icon={Grid2X2}
        />
        <StatCard
          title="Mapped Objects"
          value={0}
          statusText="Scene graph nodes ready"
          badge="3D MESH"
          hint="Object node selection foundation active"
          icon={Crosshair}
        />
        <StatCard
          title="Configured Devices"
          value={0}
          statusText="IoT telemetry standby"
          badge="HARDWARE"
          hint="Hardware pairing begins in Phase 3"
          icon={Cpu}
        />
      </div>

      {/* Workflow Progression Pipeline & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Workflow Progression Stepper (2 cols) */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Digital Twin Configuration Pipeline</CardTitle>
                <CardDescription>
                  Structured workflow to transition raw 3D architectural assets into an interactive IoT twin
                </CardDescription>
              </div>
              <Badge variant="purple" className="font-mono text-[11px]">
                5 Steps
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {/* Step 1 */}
              <div
                onClick={() => navigate('/models')}
                className="group flex items-start gap-3.5 p-4 rounded-2xl border border-purple-200/90 bg-purple-50/50 hover:bg-purple-50 transition-all cursor-pointer shadow-xs"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-[#8B5CF6] text-white font-mono text-xs font-bold shrink-0 shadow-sm shadow-purple-500/20">
                  ✓
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#181829] group-hover:text-[#7C3AED] transition-colors">
                      GLB Upload, Asset Management & Inspection
                    </h4>
                    <Badge variant="success" className="text-[10px] py-0 px-2 font-semibold">
                      Phase 2 Active
                    </Badge>
                  </div>
                  <p className="text-xs text-[#71758E] mt-0.5 leading-relaxed">
                    Upload unified GLB dollhouse assets, inspect internal node hierarchies, and explore models in 3D.
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-[#8B5CF6] self-center shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>

              {/* Step 2 */}
              <div
                onClick={() => navigate('/rooms')}
                className="group flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 font-mono text-xs font-bold shrink-0">
                  2
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#181829] group-hover:text-[#7C3AED] transition-colors">
                      Define Room Boundaries & Zones
                    </h4>
                    <span className="text-[11px] text-[#71758E] font-mono">
                      (Next Phase)
                    </span>
                  </div>
                  <p className="text-xs text-[#71758E] mt-0.5 leading-relaxed">
                    Partition spatial layout into living room, bedrooms, kitchen, and exterior zones.
                  </p>
                </div>
              </div>

              {/* Step 3 */}
              <div
                onClick={() => navigate('/mapping')}
                className="group flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 font-mono text-xs font-bold shrink-0">
                  3
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#181829] group-hover:text-[#7C3AED] transition-colors">
                      Interactive 3D Node Selection & Mapping
                    </h4>
                  </div>
                  <p className="text-xs text-[#71758E] mt-0.5 leading-relaxed">
                    Click directly on light fixtures, air conditioners, and sensors inside the 3D viewport.
                  </p>
                </div>
              </div>

              {/* Step 4 */}
              <div
                onClick={() => navigate('/devices')}
                className="group flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 font-mono text-xs font-bold shrink-0">
                  4
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#181829] group-hover:text-[#7C3AED] transition-colors">
                      Configure IoT Telemetry Topics & Protocols
                    </h4>
                  </div>
                  <p className="text-xs text-[#71758E] mt-0.5 leading-relaxed">
                    Bind physical sensors and relays to mapped 3D mesh nodes via MQTT or WebSocket.
                  </p>
                </div>
              </div>

              {/* Step 5 */}
              <div
                onClick={() => navigate('/preview')}
                className="group flex items-start gap-3.5 p-4 rounded-2xl border border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all cursor-pointer"
              >
                <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-slate-200/80 text-slate-600 font-mono text-xs font-bold shrink-0">
                  5
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-[#181829] group-hover:text-[#7C3AED] transition-colors">
                      Launch Interactive Customer Dashboard
                    </h4>
                  </div>
                  <p className="text-xs text-[#71758E] mt-0.5 leading-relaxed">
                    Preview real-time sensor heatmaps, state toggling, and interactive camera orbits.
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Activity / Stored Assets Section */}
        <Card className="flex flex-col">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#8B5CF6]" />
                <span>Recent Assets</span>
              </CardTitle>
              <Badge variant="slate" className="text-[10px]">
                {modelCount} Total
              </Badge>
            </div>
            <CardDescription>
              Stored 3D dollhouse models and inspection manifests
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between p-5 border-t border-slate-100">
            {recentModels.length > 0 ? (
              <div className="space-y-2">
                {recentModels.map((m) => (
                  <div
                    key={m.id}
                    onClick={() => navigate(`/models/${m.id}`)}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 hover:bg-purple-50 transition-colors cursor-pointer group"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <Box className="w-4 h-4 text-[#8B5CF6] shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-[#181829] group-hover:text-[#7C3AED] truncate">
                          {m.name}
                        </p>
                        <p className="text-[10px] text-[#71758E] font-mono">
                          {m.modelMetadata?.summary.totalNodes || 0} nodes ·{' '}
                          {m.status}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-[#8B5CF6] transition-colors shrink-0" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-6">
                <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#8B5CF6] mb-3 shadow-xs">
                  <Clock className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-[#181829]">
                  No Assets Uploaded Yet
                </h4>
                <p className="text-[11px] text-[#71758E] max-w-xs mt-1 leading-relaxed">
                  Upload your first .GLB file in Model Library to start inspecting dollhouse scene graphs.
                </p>
              </div>
            )}

            <Button
              size="sm"
              variant="outline"
              pill
              onClick={() => navigate('/models')}
              className="mt-4 text-xs w-full"
            >
              <span>Manage Model Library</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
