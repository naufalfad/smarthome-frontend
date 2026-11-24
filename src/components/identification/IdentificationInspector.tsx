import React, { useState, useEffect } from 'react';
import {
  Grid2X2,
  Box,
  Target,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  HelpCircle,
  Save,
  Check,
  ChevronRight,
  Layers,
  Info,
} from 'lucide-react';
import {
  NodeIdentificationRecord,
  IdentifiedNodeType,
  IdentificationStatus,
} from '../../types/identification';
import {
  getCategoriesByNodeType,
  getCategoryDisplayName,
} from '../../constants/identification-categories';
import { identificationApi } from '../../services/identification.api';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface IdentificationInspectorProps {
  houseModelId: string;
  selectedNodeName: string | null;
  identification: NodeIdentificationRecord | null;
  onIdentificationUpdated: (updated: NodeIdentificationRecord) => void;
  onSelectNodeByName?: (name: string) => void;
}

export const IdentificationInspector: React.FC<IdentificationInspectorProps> = ({
  houseModelId,
  selectedNodeName,
  identification,
  onIdentificationUpdated,
  onSelectNodeByName,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [category, setCategory] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<IdentificationStatus>('SUGGESTED');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync state whenever selected identification changes
  useEffect(() => {
    if (identification) {
      setDisplayName(identification.displayName || '');
      setCategory(identification.category || 'UNKNOWN');
      setDescription(identification.description || '');
      setStatus(identification.status || 'SUGGESTED');
      setSaveSuccess(false);
      setErrorMessage(null);
    }
  }, [identification]);

  if (!selectedNodeName || !identification) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] p-6 flex flex-col items-center justify-center text-center min-h-[400px]">
        <div className="w-14 h-14 rounded-2xl bg-purple-50 border border-purple-100 flex items-center justify-center text-[#8B5CF6] mb-3 shadow-xs">
          <Sparkles className="w-7 h-7" />
        </div>
        <h3 className="text-sm font-bold text-[#181829]">
          No Node Selected for Identification
        </h3>
        <p className="text-xs text-[#71758E] max-w-xs mt-1 leading-relaxed">
          Select any room (`ROOM_*`), object (`OBJ_*`), or IoT anchor (`ANCHOR_*`) in the 3D Dollhouse or Explorer tree to classify its identity.
        </p>
      </div>
    );
  }

  const { nodeType, nodeName, stableId, suggestedCategory, parentRoom, parentFloor, revalidationStatus } =
    identification;

  const availableCategories = getCategoriesByNodeType(nodeType);

  const handleAcceptSuggestion = () => {
    if (suggestedCategory) {
      setCategory(suggestedCategory);
      setStatus('IDENTIFIED');
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const updated = await identificationApi.upsert(houseModelId, {
        nodeName,
        displayName: displayName.trim(),
        category,
        description: description.trim(),
        status,
      });

      onIdentificationUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to save node identification');
    } finally {
      setIsSaving(false);
    }
  };

  const getNodeTypeIcon = (type: IdentifiedNodeType) => {
    switch (type) {
      case 'ROOM':
        return <Grid2X2 className="w-4 h-4 text-[#7C3AED]" />;
      case 'OBJECT':
        return <Box className="w-4 h-4 text-slate-700" />;
      case 'ANCHOR':
        return <Target className="w-4 h-4 text-emerald-600" />;
    }
  };

  const getStatusBadge = (st: IdentificationStatus) => {
    switch (st) {
      case 'IDENTIFIED':
        return <Badge variant="success" className="text-[10px] py-0 px-2 font-bold">IDENTIFIED</Badge>;
      case 'SUGGESTED':
        return <Badge variant="purple" className="text-[10px] py-0 px-2 font-bold">SUGGESTED</Badge>;
      case 'NEEDS_REVIEW':
        return <Badge variant="danger" className="text-[10px] py-0 px-2 font-bold">NEEDS REVIEW</Badge>;
      default:
        return <Badge variant="slate" className="text-[10px] py-0 px-2 font-bold">UNIDENTIFIED</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] p-5 space-y-4">
      {/* Header Info */}
      <div className="border-b border-slate-100 pb-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-[#71758E] uppercase tracking-wider">
              {nodeType} Identification
            </span>
          </div>
          {getStatusBadge(status)}
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-2xl bg-purple-50 border border-purple-100 shrink-0 shadow-xs">
            {getNodeTypeIcon(nodeType)}
          </div>

          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-extrabold text-[#181829] tracking-tight truncate font-mono">
              {nodeName}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono truncate mt-0.5" title={stableId}>
              ID: {stableId}
            </p>
          </div>
        </div>
      </div>

      {/* Suggested Category Callout */}
      {suggestedCategory && suggestedCategory !== 'UNKNOWN' && (
        <div className="p-3 rounded-2xl bg-purple-50/70 border border-purple-100/80 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-[#7C3AED] flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Rule-Based Suggestion
            </span>
            {category !== suggestedCategory && (
              <button
                type="button"
                onClick={handleAcceptSuggestion}
                className="text-[10px] font-bold text-[#8B5CF6] hover:text-[#7C3AED] underline"
              >
                Accept Suggestion
              </button>
            )}
          </div>
          <p className="text-xs font-bold text-[#181829]">
            {getCategoryDisplayName(suggestedCategory)}{' '}
            <span className="text-[10px] font-mono text-[#71758E]">({suggestedCategory})</span>
          </p>
        </div>
      )}

      {/* Spatial Parent Hierarchy (From GLB) */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-[#71758E] font-medium block">Parent Room (GLB)</span>
          {parentRoom ? (
            <button
              type="button"
              onClick={() => onSelectNodeByName?.(parentRoom)}
              className="font-bold text-[#7C3AED] hover:underline font-mono truncate max-w-full block mt-0.5 text-left"
              title={`Select ${parentRoom}`}
            >
              {parentRoom}
            </button>
          ) : (
            <span className="text-slate-400 font-mono mt-0.5 block">None</span>
          )}
        </div>

        <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100">
          <span className="text-[10px] text-[#71758E] font-medium block">Parent Floor (GLB)</span>
          {parentFloor ? (
            <button
              type="button"
              onClick={() => onSelectNodeByName?.(parentFloor)}
              className="font-bold text-[#181829] hover:text-[#8B5CF6] font-mono truncate max-w-full block mt-0.5 text-left"
              title={`Select ${parentFloor}`}
            >
              {parentFloor}
            </button>
          ) : (
            <span className="text-slate-400 font-mono mt-0.5 block">None</span>
          )}
        </div>
      </div>

      {/* Main Identification Form */}
      <form onSubmit={handleSave} className="space-y-3.5">
        {/* Display Name */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#181829] block">
            Display Name <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Master Bedroom, Living Room AC"
            required
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>

        {/* Category Dropdown (Strictly validated per node type) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#181829] block">
            {nodeType === 'ROOM' ? 'Room Category' : nodeType === 'OBJECT' ? 'Object Category' : 'Anchor Category'}{' '}
            <span className="text-rose-500">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            {availableCategories.map((opt) => (
              <option key={opt.code} value={opt.code}>
                {opt.name} {opt.group ? `(${opt.group})` : ''}
              </option>
            ))}
          </select>
        </div>

        {/* Identification Status */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#181829] block">
            Confirmation Status
          </label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as IdentificationStatus)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
          >
            <option value="IDENTIFIED">IDENTIFIED (Confirmed by Admin)</option>
            <option value="SUGGESTED">SUGGESTED (Rule Recommendation)</option>
            <option value="NEEDS_REVIEW">NEEDS_REVIEW (Requires Review)</option>
            <option value="UNIDENTIFIED">UNIDENTIFIED</option>
          </select>
        </div>

        {/* Description (Optional) */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-[#181829] block">
            Description <span className="text-[10px] text-slate-400 font-normal">(Optional)</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Add spatial or installation notes for this node..."
            rows={2}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-[#181829] focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400 resize-none"
          />
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-100 text-[11px] text-rose-700 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Success feedback */}
        {saveSuccess && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-800 flex items-center gap-1.5 animate-in fade-in">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Node identity confirmed & saved to database!</span>
          </div>
        )}

        {/* Save Button */}
        <Button
          type="submit"
          variant="purple"
          size="sm"
          pill
          disabled={isSaving}
          className="w-full text-xs font-bold gap-1.5 shadow-sm"
        >
          {isSaving ? (
            <span>Saving...</span>
          ) : (
            <>
              <Save className="w-3.5 h-3.5" />
              <span>Confirm & Save Identification</span>
            </>
          )}
        </Button>
      </form>
    </div>
  );
};
