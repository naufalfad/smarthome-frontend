import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  SlidersHorizontal,
  CheckCircle2,
  Filter,
  Check,
  AlertCircle,
  Loader2,
  Grid2X2,
  Box,
  Target,
} from 'lucide-react';
import {
  NodeIdentificationRecord,
  IdentifiedNodeType,
  IdentificationStatus,
} from '../../types/identification';
import { getCategoryDisplayName } from '../../constants/identification-categories';
import { identificationApi } from '../../services/identification.api';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

export interface BulkIdentificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  houseModelId: string;
  onSuccess: () => void;
  availableFloors: string[];
}

export const BulkIdentificationModal: React.FC<BulkIdentificationModalProps> = ({
  isOpen,
  onClose,
  houseModelId,
  onSuccess,
  availableFloors,
}) => {
  const [filterType, setFilterType] = useState<IdentifiedNodeType | 'ALL'>('ALL');
  const [filterStatus, setFilterStatus] = useState<IdentificationStatus | 'ALL'>('SUGGESTED');
  const [filterFloor, setFilterFloor] = useState<string | 'ALL'>('ALL');

  const [isLoading, setIsLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [items, setItems] = useState<NodeIdentificationRecord[]>([]);
  const [selectedNodeNames, setSelectedNodeNames] = useState<Set<string>>(new Set());
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load candidate items for bulk confirmation
  const loadCandidates = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const records = await identificationApi.getIdentifications(houseModelId, {
        nodeType: filterType === 'ALL' ? undefined : filterType,
        status: filterStatus === 'ALL' ? undefined : filterStatus,
        parentFloor: filterFloor === 'ALL' ? undefined : filterFloor,
      });

      setItems(records);
      // Default: select all valid suggested candidates
      const validNames = new Set(records.map((r) => r.nodeName));
      setSelectedNodeNames(validNames);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to fetch candidate nodes');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadCandidates();
    }
  }, [isOpen, filterType, filterStatus, filterFloor]);

  const toggleSelectAll = () => {
    if (selectedNodeNames.size === items.length) {
      setSelectedNodeNames(new Set());
    } else {
      setSelectedNodeNames(new Set(items.map((i) => i.nodeName)));
    }
  };

  const toggleItem = (nodeName: string) => {
    setSelectedNodeNames((prev) => {
      const next = new Set(prev);
      if (next.has(nodeName)) next.delete(nodeName);
      else next.add(nodeName);
      return next;
    });
  };

  const handleConfirmSelected = async () => {
    if (selectedNodeNames.size === 0) return;
    setIsApplying(true);
    setErrorMessage(null);

    try {
      const itemsToConfirm = items
        .filter((item) => selectedNodeNames.has(item.nodeName))
        .map((item) => ({
          nodeName: item.nodeName,
          category: item.suggestedCategory || item.category,
          displayName: item.displayName,
          status: 'IDENTIFIED' as IdentificationStatus,
        }));

      await identificationApi.bulkConfirm(houseModelId, {
        items: itemsToConfirm,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to apply bulk confirmation');
    } finally {
      setIsApplying(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[85vh] bg-white rounded-3xl border border-slate-200/90 shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-2xl bg-purple-50 text-[#8B5CF6]">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#181829] tracking-tight">
                Bulk Node Identification
              </h2>
              <p className="text-xs text-[#71758E]">
                Review and confirm suggested identities across multiple nodes simultaneously
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls Bar */}
        <div className="p-3.5 border-b border-slate-100 bg-slate-50/60 flex flex-wrap items-center gap-2.5 text-xs">
          {/* Node Type Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Type:</span>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="px-2.5 py-1 text-xs rounded-xl bg-white border border-slate-200 text-[#181829] focus:outline-none"
            >
              <option value="ALL">All Types</option>
              <option value="ROOM">Rooms Only</option>
              <option value="OBJECT">Objects Only</option>
              <option value="ANCHOR">Anchors Only</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold text-slate-500 uppercase">Status:</span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-2.5 py-1 text-xs rounded-xl bg-white border border-slate-200 text-[#181829] focus:outline-none"
            >
              <option value="SUGGESTED">Suggested Only</option>
              <option value="UNIDENTIFIED">Unidentified</option>
              <option value="NEEDS_REVIEW">Needs Review</option>
              <option value="ALL">All Statuses</option>
            </select>
          </div>

          {/* Floor Filter */}
          {availableFloors.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-bold text-slate-500 uppercase">Floor:</span>
              <select
                value={filterFloor}
                onChange={(e) => setFilterFloor(e.target.value)}
                className="px-2.5 py-1 text-xs rounded-xl bg-white border border-slate-200 text-[#181829] focus:outline-none"
              >
                <option value="ALL">All Floors</option>
                {availableFloors.map((fl) => (
                  <option key={fl} value={fl}>
                    {fl}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="ml-auto text-[11px] text-[#71758E] font-medium">
            Selected: <strong className="text-[#181829]">{selectedNodeNames.size}</strong> of {items.length}
          </div>
        </div>

        {/* Candidate List Table Preview */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <Loader2 className="w-6 h-6 text-[#8B5CF6] animate-spin mb-2" />
              <span className="text-xs font-bold text-[#181829]">Loading candidate nodes...</span>
            </div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center text-xs text-slate-400">
              No matching nodes found for the selected filter criteria.
            </div>
          ) : (
            <div className="border border-slate-200/80 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200/80 text-[10px] font-bold text-[#71758E] uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3 w-8">
                      <input
                        type="checkbox"
                        checked={selectedNodeNames.size === items.length && items.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded accent-purple-600 cursor-pointer"
                      />
                    </th>
                    <th className="py-2.5 px-3">Node Name</th>
                    <th className="py-2.5 px-3">Proposed Display Name</th>
                    <th className="py-2.5 px-3">Proposed Category</th>
                    <th className="py-2.5 px-3">Parent Room</th>
                    <th className="py-2.5 px-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item) => {
                    const isSelected = selectedNodeNames.has(item.nodeName);
                    return (
                      <tr
                        key={item.nodeName}
                        onClick={() => toggleItem(item.nodeName)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-purple-50/40' : 'hover:bg-slate-50/70'
                        }`}
                      >
                        <td className="py-2.5 px-3" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleItem(item.nodeName)}
                            className="rounded accent-purple-600 cursor-pointer"
                          />
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] font-bold text-[#181829]">
                          {item.nodeName}
                        </td>
                        <td className="py-2.5 px-3 text-[#181829]">
                          {item.displayName}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="font-semibold text-[#7C3AED]">
                            {getCategoryDisplayName(item.suggestedCategory || item.category)}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500 font-mono text-[11px]">
                          {item.parentRoom || '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <Badge variant="purple" className="text-[9px] py-0 px-1.5 font-bold">
                            → CONFIRM
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between">
          <Button variant="secondary" size="sm" pill onClick={onClose}>
            Cancel
          </Button>

          <div className="flex items-center gap-2">
            {errorMessage && (
              <span className="text-xs text-rose-600 font-medium">{errorMessage}</span>
            )}
            <Button
              variant="purple"
              size="sm"
              pill
              disabled={isApplying || selectedNodeNames.size === 0}
              onClick={handleConfirmSelected}
              className="gap-1.5"
            >
              {isApplying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Applying Changes...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Confirm {selectedNodeNames.size} Node(s) as Identified</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

