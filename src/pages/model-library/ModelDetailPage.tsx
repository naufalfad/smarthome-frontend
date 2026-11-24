import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Trash2,
  FolderTree,
  Info,
  Loader2,
  AlertCircle,
  Sliders,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { HouseModel } from '../../types/house-model';
import {
  CameraPreset,
  SceneNodeHierarchyMeta,
} from '../../types/scene-interaction';
import {
  NodeIdentificationRecord,
  IdentificationOverviewSummary,
} from '../../types/identification';
import { houseModelApi } from '../../services/house-model.api';
import { identificationApi } from '../../services/identification.api';
import { useAuthenticatedBlobUrl } from '../../hooks/useAuthenticatedBlobUrl';
import {
  buildSceneHierarchyIndex,
  extractFloorNames,
} from '../../lib/scene-hierarchy';
import { DollhouseViewer } from '../../components/viewer/DollhouseViewer';
import { SceneExplorer } from '../../components/viewer/SceneExplorer';
import { IdentificationOverview } from '../../components/identification/IdentificationOverview';
import { IdentificationInspector } from '../../components/identification/IdentificationInspector';
import { BulkIdentificationModal } from '../../components/identification/BulkIdentificationModal';
import { RevalidationModal } from '../../components/identification/RevalidationModal';
import { ModelInfoPanel } from '../../components/viewer/ModelInfoPanel';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { EditModelModal } from '../../components/models/EditModelModal';
import { DeleteModelDialog } from '../../components/models/DeleteModelDialog';

export const ModelDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [model, setModel] = useState<HouseModel | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Interaction & Visibility States
  const [selectedNodeName, setSelectedNodeName] = useState<string | null>(null);
  const [selectedRoomName, setSelectedRoomName] = useState<string | null>(null);
  const [activeFloor, setActiveFloor] = useState<string | 'ALL'>('ALL');
  const [isolatedRoom, setIsolatedRoom] = useState<string | null>(null);
  const [showAnchors, setShowAnchors] = useState<boolean>(true);
  const [wireframe, setWireframe] = useState<boolean>(false);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('ISO');

  // Sidebar Tab: explorer | identify | specs
  const [activeTab, setActiveTab] = useState<'explorer' | 'identify' | 'specs'>('explorer');

  // Phase 4: Identifications State
  const [overview, setOverview] = useState<IdentificationOverviewSummary | null>(null);
  const [identifications, setIdentifications] = useState<NodeIdentificationRecord[]>([]);
  const [isOverviewLoading, setIsOverviewLoading] = useState(false);

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isRevalidationModalOpen, setIsRevalidationModalOpen] = useState(false);

  const loadModel = async () => {
    if (!id) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await houseModelApi.getHouseModelById(id);
      setModel(data);
    } catch (err: any) {
      setError(err?.message || 'Failed to load model details');
    } finally {
      setIsLoading(false);
    }
  };

  const loadIdentificationsData = useCallback(async () => {
    if (!id) return;
    setIsOverviewLoading(true);
    try {
      const [overviewData, listData] = await Promise.all([
        identificationApi.getOverview(id),
        identificationApi.getIdentifications(id),
      ]);
      setOverview(overviewData);
      setIdentifications(listData);
    } catch (err) {
      console.error('Error fetching identifications data:', err);
    } finally {
      setIsOverviewLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadModel();
  }, [id]);

  useEffect(() => {
    if (model) {
      loadIdentificationsData();
    }
  }, [model, loadIdentificationsData]);

  const allNodesFlat = useMemo(() => {
    return model?.modelMetadata?.allNodesFlat || [];
  }, [model]);

  const nodeTree = useMemo(() => {
    return model?.modelMetadata?.nodeTree || [];
  }, [model]);

  // Index scene hierarchy for instant parent room/floor traversal & classification
  const hierarchyMetaMap = useMemo(() => {
    return buildSceneHierarchyIndex(allNodesFlat);
  }, [allNodesFlat]);

  // Extract available floor levels
  const availableFloors = useMemo(() => {
    return extractFloorNames(allNodesFlat);
  }, [allNodesFlat]);

  // Fast map of nodeName -> NodeIdentificationRecord
  const identificationMap = useMemo(() => {
    const map = new Map<string, NodeIdentificationRecord>();
    identifications.forEach((rec) => {
      map.set(rec.nodeName, rec);
    });
    return map;
  }, [identifications]);

  // Selected node identification record
  const selectedIdentification = useMemo(() => {
    if (!selectedNodeName) return null;
    return identificationMap.get(selectedNodeName) || null;
  }, [identificationMap, selectedNodeName]);

  // Display name for selected node and room in 3D viewport tooltip
  const selectedNodeDisplayName = useMemo(() => {
    if (!selectedNodeName) return null;
    return identificationMap.get(selectedNodeName)?.displayName || selectedNodeName;
  }, [identificationMap, selectedNodeName]);

  const selectedRoomDisplayName = useMemo(() => {
    if (!selectedRoomName) return null;
    return identificationMap.get(selectedRoomName)?.displayName || selectedRoomName;
  }, [identificationMap, selectedRoomName]);

  // When node is selected in 3D viewport or Explorer, sync state and switch to Identify tab
  const handleSelectNode = (nodeName: string | null) => {
    setSelectedNodeName(nodeName);
    if (nodeName) {
      const meta = hierarchyMetaMap.get(nodeName);
      if (meta?.parentRoom) {
        setSelectedRoomName(meta.parentRoom.name);
      }
      setActiveTab('identify');
    } else {
      setSelectedRoomName(null);
    }
  };

  const handleSelectRoom = (roomName: string | null) => {
    setSelectedRoomName(roomName);
  };

  const handleClearIsolation = () => {
    setIsolatedRoom(null);
  };

  const handleIdentificationUpdated = (updated: NodeIdentificationRecord) => {
    setIdentifications((prev) => {
      const index = prev.findIndex((i) => i.id === updated.id);
      if (index >= 0) {
        const next = [...prev];
        next[index] = updated;
        return next;
      }
      return [...prev, updated];
    });
    loadIdentificationsData();
  };

  // Fetch protected 3D GLB binary via shared authenticated HTTP client
  const rawModelFileUrl = model ? houseModelApi.getModelFileUrl(model.id) : null;
  const {
    blobUrl: modelBlobUrl,
    loading: isModelBinaryLoading,
    error: modelBinaryError,
  } = useAuthenticatedBlobUrl(rawModelFileUrl);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] text-center space-y-3">
        <Loader2 className="w-8 h-8 text-[#8B5CF6] animate-spin" />
        <h3 className="text-sm font-bold text-[#181829]">
          Loading 3D Dollhouse Workspace...
        </h3>
        <p className="text-xs text-[#71758E]">
          Fetching model metadata and identification registry
        </p>
      </div>
    );
  }

  if (error || !model) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
          <AlertCircle className="w-7 h-7" />
        </div>
        <h3 className="text-base font-bold text-[#181829]">
          Model Not Found or Inaccessible
        </h3>
        <p className="text-xs text-[#71758E] max-w-sm">
          {error || `House model with ID '${id}' could not be retrieved.`}
        </p>
        <Button
          variant="secondary"
          pill
          size="sm"
          onClick={() => navigate('/models')}
          className="mt-2"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Model Library</span>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Top Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/models')}
            className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:text-[#8B5CF6] hover:bg-purple-50 shadow-xs transition-colors"
            title="Back to Model Library"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-[#181829] tracking-tight truncate max-w-md">
                {model.name}
              </h1>
              <Badge
                variant={
                  model.status === 'PUBLISHED'
                    ? 'success'
                    : model.status === 'DRAFT'
                    ? 'purple'
                    : 'slate'
                }
                className="text-[10px]"
              >
                {model.status}
              </Badge>
            </div>
            <p className="text-xs text-[#71758E] flex items-center gap-2 mt-0.5">
              <span>{model.fileName}</span>
              <span>·</span>
              <span className="font-mono">{allNodesFlat.length} Nodes</span>
              <span>·</span>
              <span className="font-mono">
                {model.modelMetadata?.summary.totalMeshes || 0} Meshes
              </span>
              <span>·</span>
              <span className="font-mono">
                {model.modelMetadata?.summary.totalMaterials || 0} Materials
              </span>
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button
            variant="secondary"
            size="sm"
            pill
            onClick={() => setIsEditModalOpen(true)}
          >
            <Edit2 className="w-3.5 h-3.5 text-[#8B5CF6]" />
            <span>Edit Info</span>
          </Button>

          <Button
            variant="secondary"
            size="sm"
            pill
            onClick={() => setIsDeleteDialogOpen(true)}
            className="text-rose-600 hover:bg-rose-50"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </Button>
        </div>
      </div>

      {/* Phase 4: Identification Overview Bar (Rooms, Objects, Anchors Metrics & Bulk Actions) */}
      <IdentificationOverview
        overview={overview}
        isLoading={isOverviewLoading}
        onOpenBulkModal={() => setIsBulkModalOpen(true)}
        onOpenRevalidationModal={() => setIsRevalidationModalOpen(true)}
      />

      {/* Main Studio Inspection Workspace (Grid with 3D Viewer & Side Panel) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 h-[calc(100vh-270px)] min-h-[600px]">
        {/* Left / Center: Interactive 3D Dollhouse Viewport (8 cols) */}
        <div className="lg:col-span-8 h-full flex flex-col">
          {isModelBinaryLoading || !modelBlobUrl ? (
            <div className="flex-1 flex flex-col items-center justify-center bg-slate-50 rounded-3xl border border-slate-200 p-6 text-center space-y-2">
              {modelBinaryError ? (
                <>
                  <AlertCircle className="w-7 h-7 text-rose-500" />
                  <p className="text-xs font-bold text-slate-700">Gagal memuat berkas model 3D</p>
                  <p className="text-[11px] text-slate-500">{modelBinaryError}</p>
                </>
              ) : (
                <>
                  <Loader2 className="w-7 h-7 text-[#8B5CF6] animate-spin" />
                  <p className="text-xs font-bold text-slate-700">Mengunduh berkas 3D GLB terautentikasi...</p>
                </>
              )}
            </div>
          ) : (
            <DollhouseViewer
              modelUrl={modelBlobUrl}
              selectedNodeName={selectedNodeName}
              onSelectNode={handleSelectNode}
              selectedRoomName={selectedRoomName}
              onSelectRoom={handleSelectRoom}
              activeFloor={activeFloor}
              onSelectFloor={(fl) => setActiveFloor(fl)}
              isolatedRoom={isolatedRoom}
              onClearIsolation={handleClearIsolation}
              showAnchors={showAnchors}
              onToggleAnchors={() => setShowAnchors(!showAnchors)}
              wireframe={wireframe}
              onToggleWireframe={() => setWireframe(!wireframe)}
              cameraPreset={cameraPreset}
              onSelectPreset={(preset) => setCameraPreset(preset)}
              hierarchyMetaMap={hierarchyMetaMap}
              allNodesFlat={allNodesFlat}
              availableFloors={availableFloors}
              selectedNodeDisplayName={selectedNodeDisplayName}
              selectedRoomDisplayName={selectedRoomDisplayName}
              className="flex-1"
            />
          )}
        </div>

        {/* Right: Identification Explorer, Inspector, and Specs Tabs (4 cols) */}
        <div className="lg:col-span-4 h-full flex flex-col space-y-3">
          {/* Tab Switcher Pills */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs shrink-0">
            {/* Identification Explorer Tab */}
            <button
              onClick={() => setActiveTab('explorer')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'explorer'
                  ? 'bg-[#181824] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <FolderTree className="w-3.5 h-3.5" />
              <span>Explorer</span>
            </button>

            {/* Identification Inspector Tab */}
            <button
              onClick={() => setActiveTab('identify')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all relative ${
                activeTab === 'identify'
                  ? 'bg-[#181824] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Identify</span>
              {selectedNodeName && (
                <span className="w-2 h-2 rounded-full bg-[#8B5CF6] animate-pulse" />
              )}
            </button>

            {/* Model Specs Tab */}
            <button
              onClick={() => setActiveTab('specs')}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'specs'
                  ? 'bg-[#181824] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Info className="w-3.5 h-3.5" />
              <span>Specs</span>
            </button>
          </div>

          {/* Active Tab Content */}
          <div className="flex-1 min-h-0 overflow-y-auto">
            {activeTab === 'explorer' && (
              <SceneExplorer
                nodeTree={nodeTree}
                allNodesFlat={allNodesFlat}
                selectedNodeName={selectedNodeName}
                onSelectNode={handleSelectNode}
                identificationMap={identificationMap}
              />
            )}

            {activeTab === 'identify' && (
              <IdentificationInspector
                houseModelId={model.id}
                selectedNodeName={selectedNodeName}
                identification={selectedIdentification}
                onIdentificationUpdated={handleIdentificationUpdated}
                onSelectNodeByName={handleSelectNode}
              />
            )}

            {activeTab === 'specs' && (
              <ModelInfoPanel
                model={model}
                onModelUpdated={(updated) => setModel(updated)}
              />
            )}
          </div>
        </div>
      </div>

      {/* Bulk Identification Modal */}
      <BulkIdentificationModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        houseModelId={model.id}
        availableFloors={availableFloors}
        onSuccess={loadIdentificationsData}
      />

      {/* GLB Revalidation Modal */}
      <RevalidationModal
        isOpen={isRevalidationModalOpen}
        onClose={() => setIsRevalidationModalOpen(false)}
        houseModelId={model.id}
        onRevalidated={loadIdentificationsData}
      />

      {/* Edit Modal */}
      <EditModelModal
        model={model}
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={(updated) => setModel(updated)}
      />

      {/* Delete Dialog */}
      <DeleteModelDialog
        model={model}
        isOpen={isDeleteDialogOpen}
        onClose={() => setIsDeleteDialogOpen(false)}
        onSuccess={() => navigate('/models')}
      />
    </div>
  );
};
