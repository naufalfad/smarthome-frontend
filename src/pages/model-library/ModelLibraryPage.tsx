import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  HardDrive,
  Calendar,
  Layers,
  Sparkles,
  Loader2,
  AlertCircle,
  FileCode2,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { formatBytes } from '../../lib/utils';
import { houseModelApi } from '../../services/house-model.api';
import { HouseModel, ModelStatus } from '../../types/house-model';
import { UploadModelModal } from '../../components/models/UploadModelModal';
import { EditModelModal } from '../../components/models/EditModelModal';
import { DeleteModelDialog } from '../../components/models/DeleteModelDialog';

export const ModelLibraryPage: React.FC = () => {
  const navigate = useNavigate();

  const [models, setModels] = useState<HouseModel[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals state
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<HouseModel | null>(null);
  const [deletingModel, setDeletingModel] = useState<HouseModel | null>(null);

  const fetchModels = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await houseModelApi.getHouseModels({
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? (statusFilter as ModelStatus) : undefined,
      });
      setModels(data.models);
      setTotalCount(data.pagination.total);
    } catch (err: any) {
      setError(err?.message || 'Failed to fetch house models from backend');
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchModels();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchModels]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="3D Model Library"
        description="Asset management repository for unified 3D dollhouse models, node hierarchies, and architectural mesh inspections."
        breadcrumbs={[{ label: 'Model Library', isCurrent: true }]}
        actions={
          <Button
            variant="dark"
            pill
            onClick={() => setIsUploadModalOpen(true)}
            className="group"
          >
            <Plus className="w-4 h-4 transition-transform group-hover:rotate-90" />
            <span>Add 3D Model</span>
          </Button>
        }
      />

      {/* Toolbar: Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3.5 rounded-2xl border border-slate-200/80 bg-white shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search models by name or file..."
            className="w-full pl-10 pr-3.5 py-2 text-xs rounded-full bg-slate-50 border border-slate-200 text-[#181829] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-purple-400/40 transition-all"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['ALL', 'DRAFT', 'PUBLISHED', 'ARCHIVED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-full text-xs font-bold transition-all ${
                statusFilter === st
                  ? 'bg-[#181824] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {st}
            </button>
          ))}

          <div className="h-4 w-px bg-slate-200 mx-1 hidden sm:block" />

          <Badge variant="purple" className="font-mono text-[11px] py-1 px-3 shrink-0">
            {totalCount} Models
          </Badge>
        </div>
      </div>

      {/* Main Content Area */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
          <h4 className="text-xs font-bold text-[#181829]">
            Loading 3D Models...
          </h4>
          <p className="text-[11px] text-[#71758E]">
            Querying PostgreSQL asset repository
          </p>
        </div>
      ) : error ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-rose-200 shadow-sm space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-[#181829]">
            Could Not Load Models
          </h4>
          <p className="text-xs text-[#71758E] max-w-md mx-auto">{error}</p>
          <Button variant="secondary" size="sm" pill onClick={fetchModels}>
            Retry Request
          </Button>
        </div>
      ) : models.length === 0 ? (
        <EmptyState
          icon={Box}
          phaseBadge="Phase 2 Asset Repository Ready"
          title={
            searchTerm || statusFilter !== 'ALL'
              ? 'No Matching 3D Models'
              : 'No 3D Home Models Found'
          }
          description={
            searchTerm || statusFilter !== 'ALL'
              ? 'No house models matched your current search filters. Try clearing your query.'
              : 'Your 3D model repository is currently empty. Upload your first GLB dollhouse model to begin spatial inspection and 3D viewing.'
          }
          action={
            <Button
              variant="dark"
              pill
              onClick={() => setIsUploadModalOpen(true)}
            >
              <Plus className="w-4 h-4" />
              <span>Add 3D Model</span>
            </Button>
          }
          hint="Supports binary GLB assets exported from Blender, SketchUp, Revit, or 3ds Max."
        />
      ) : (
        /* Modern 3D Model Card Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {models.map((item) => {
            const uploadDate = new Date(item.createdAt).toLocaleDateString(
              'en-US',
              {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              }
            );

            const summary = item.modelMetadata?.summary;

            return (
              <Card
                key={item.id}
                className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-slate-200/90 flex flex-col justify-between"
              >
                <div>
                  {/* Model Preview Header Area (Dollhouse visual placeholder) */}
                  <div
                    onClick={() => navigate(`/models/${item.id}`)}
                    className="relative h-44 rounded-t-[22px] bg-gradient-to-br from-purple-100/80 via-slate-100 to-purple-50/60 flex items-center justify-center overflow-hidden cursor-pointer group-hover:from-purple-200/70 transition-colors"
                  >
                    {/* Isometric dollhouse visual emblem */}
                    <div className="relative w-24 h-24 rounded-3xl bg-white/90 border border-purple-200 flex items-center justify-center shadow-lg shadow-purple-500/10 group-hover:scale-105 transition-transform duration-300">
                      <Box className="w-12 h-12 text-[#8B5CF6]" />
                      <Sparkles className="w-4 h-4 text-[#A78BFA] absolute top-2 right-2" />
                    </div>

                    {/* Top Status Badge */}
                    <div className="absolute top-3 right-3">
                      <Badge
                        variant={
                          item.status === 'PUBLISHED'
                            ? 'success'
                            : item.status === 'DRAFT'
                            ? 'purple'
                            : 'slate'
                        }
                        className="text-[10px] font-bold shadow-xs"
                      >
                        {item.status}
                      </Badge>
                    </div>

                    {/* Format Pill */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-sm text-[10px] font-mono font-semibold text-[#181829] shadow-xs">
                      <FileCode2 className="w-3 h-3 text-[#8B5CF6]" />
                      <span>GLB 2.0</span>
                    </div>

                    {/* Hover Inspect CTA Overlay */}
                    <div className="absolute inset-0 bg-slate-900/10 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="px-4 py-2 rounded-full bg-[#181824] text-white text-xs font-bold shadow-lg flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-[#A78BFA]" />
                        <span>Inspect in 3D</span>
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <CardContent className="p-5 space-y-3">
                    <div>
                      <h3
                        onClick={() => navigate(`/models/${item.id}`)}
                        className="text-base font-extrabold text-[#181829] tracking-tight truncate cursor-pointer hover:text-[#7C3AED] transition-colors"
                      >
                        {item.name}
                      </h3>
                      <p className="text-xs text-[#71758E] mt-1 line-clamp-2 leading-relaxed">
                        {item.description || 'No description provided.'}
                      </p>
                    </div>

                    {/* Hierarchical Stats Pills */}
                    {summary && (
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <Badge variant="slate" className="text-[10px] py-0 px-2 font-mono">
                          {summary.totalNodes} Nodes
                        </Badge>
                        <Badge variant="slate" className="text-[10px] py-0 px-2 font-mono">
                          {summary.totalMeshes} Meshes
                        </Badge>
                        {summary.totalRoomsDetected > 0 && (
                          <Badge variant="success" className="text-[10px] py-0 px-2 font-mono">
                            {summary.totalRoomsDetected} Rooms
                          </Badge>
                        )}
                        {summary.totalEmptyAnchors > 0 && (
                          <Badge variant="purple" className="text-[10px] py-0 px-2 font-mono">
                            {summary.totalEmptyAnchors} Anchors
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* File specs row */}
                    <div className="flex items-center justify-between text-[11px] text-[#71758E] pt-2 border-t border-slate-100">
                      <span className="flex items-center gap-1 font-mono">
                        <HardDrive className="w-3.5 h-3.5 text-[#8B5CF6]" />
                        {formatBytes(item.fileSize)}
                      </span>

                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {uploadDate}
                      </span>
                    </div>
                  </CardContent>
                </div>

                {/* Card Actions Footer */}
                <div className="p-4 bg-slate-50/60 border-t border-slate-100 flex items-center justify-between gap-2">
                  <Button
                    variant="dark"
                    size="sm"
                    pill
                    onClick={() => navigate(`/models/${item.id}`)}
                    className="flex-1 text-xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#A78BFA]" />
                    <span>View Dollhouse</span>
                  </Button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingModel(item)}
                      className="p-2 rounded-full text-slate-500 hover:text-[#8B5CF6] hover:bg-white border border-transparent hover:border-slate-200 transition-colors shadow-xs"
                      title="Edit Model"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingModel(item)}
                      className="p-2 rounded-full text-slate-500 hover:text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 transition-colors shadow-xs"
                      title="Delete Model"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Upload Model Modal */}
      <UploadModelModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={() => {
          fetchModels();
        }}
      />

      {/* Edit Model Modal */}
      <EditModelModal
        model={editingModel}
        isOpen={!!editingModel}
        onClose={() => setEditingModel(null)}
        onSuccess={() => {
          fetchModels();
        }}
      />

      {/* Delete Model Dialog */}
      <DeleteModelDialog
        model={deletingModel}
        isOpen={!!deletingModel}
        onClose={() => setDeletingModel(null)}
        onSuccess={() => {
          fetchModels();
        }}
      />
    </div>
  );
};
