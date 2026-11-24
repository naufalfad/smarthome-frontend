import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Grid2X2,
  ArrowRight,
  Boxes,
  Loader2,
  Box,
  Target,
  Sparkles,
  CheckCircle2,
  Layers,
} from 'lucide-react';
import { HouseModel } from '../../types/house-model';
import { houseModelApi } from '../../services/house-model.api';
import { PageHeader } from '../../components/common/PageHeader';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const RoomManagementPage: React.FC = () => {
  const navigate = useNavigate();
  const [models, setModels] = useState<HouseModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await houseModelApi.getHouseModels({ limit: 50 });
        setModels(response.models);
      } catch (err) {
        console.error('Failed to load house models:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchModels();
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Room & Structure Identification"
        description="Classify architectural rooms, spatial boundaries, smart IoT objects, and sensor anchors across 3D dollhouse models."
        breadcrumbs={[{ label: 'Room Management', isCurrent: true }]}
      />

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-[#7C3AED] font-bold text-xs">
              <Grid2X2 className="w-4 h-4" />
              <span>Room Spatial Zones</span>
            </div>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Identify Living Rooms, Master Bedrooms, Kitchens, and Bathrooms with natural display names and floor levels.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
              <Box className="w-4 h-4 text-[#8B5CF6]" />
              <span>Object Classification</span>
            </div>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Classify Smart ACs, lighting fixtures, door locks, and furniture while preserving parent room containment.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-800 font-bold text-xs">
              <Target className="w-4 h-4 text-emerald-600" />
              <span>IoT Spatial Anchors</span>
            </div>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Maintain Empty Objects without mesh as temperature, humidity, and air quality spatial indicators.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* House Models Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-extrabold text-[#181829] tracking-tight">
              House Models for Identification
            </h3>
            <p className="text-xs text-[#71758E]">
              Select a 3D model below to launch its interactive identification workspace
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-12 bg-white rounded-3xl border border-slate-200">
            <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin mb-2" />
            <span className="text-xs font-bold text-[#181829]">Loading models...</span>
          </div>
        ) : models.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 space-y-3">
            <Boxes className="w-8 h-8 text-slate-300 mx-auto" />
            <h4 className="text-xs font-bold text-[#181829]">No 3D Models Available</h4>
            <p className="text-xs text-[#71758E] max-w-sm mx-auto">
              Please upload an architectural GLB dollhouse model first in the Model Library.
            </p>
            <Button variant="purple" size="sm" pill onClick={() => navigate('/models')}>
              Go to Model Library
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {models.map((model) => {
              const flatNodes: any[] = (model.modelMetadata as any)?.allNodesFlat || [];
              const roomCount = flatNodes.filter(
                (n) => n.classification === 'ROOM' || n.name.startsWith('ROOM_')
              ).length;
              const objCount = flatNodes.filter(
                (n) => n.classification === 'OBJ' || n.name.startsWith('OBJ_')
              ).length;
              const anchorCount = flatNodes.filter(
                (n) => n.isAnchor || n.name.startsWith('ANCHOR_')
              ).length;

              return (
                <div
                  key={model.id}
                  className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] hover:border-purple-300 transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-[#181829] tracking-tight truncate">
                        {model.name}
                      </span>
                      <Badge
                        variant={model.status === 'PUBLISHED' ? 'success' : 'purple'}
                        className="text-[10px]"
                      >
                        {model.status}
                      </Badge>
                    </div>

                    <p className="text-[11px] text-[#71758E] line-clamp-2">
                      {model.description || 'Architectural 3D dollhouse model asset.'}
                    </p>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 text-center text-[10px] font-mono">
                      <div className="p-2 rounded-xl bg-purple-50 text-[#7C3AED]">
                        <span className="block font-bold text-xs">{roomCount}</span>
                        <span>Rooms</span>
                      </div>
                      <div className="p-2 rounded-xl bg-slate-50 text-slate-700">
                        <span className="block font-bold text-xs">{objCount}</span>
                        <span>Objects</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700">
                        <span className="block font-bold text-xs">{anchorCount}</span>
                        <span>Anchors</span>
                      </div>
                    </div>
                  </div>

                  <Button
                    variant="purple"
                    size="sm"
                    pill
                    onClick={() => navigate(`/models/${model.id}`)}
                    className="w-full text-xs gap-1.5 justify-center shadow-xs"
                  >
                    <span>Launch Identification Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
