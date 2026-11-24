import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  ChevronRight,
  ChevronDown,
  Box,
  Target,
  FolderTree,
  Search,
  Filter,
  Sparkles,
  Info,
  Maximize2,
  Grid2X2,
} from 'lucide-react';
import { NodeInfo, NodeClassificationType } from '../../types/house-model';
import { NodeIdentificationRecord } from '../../types/identification';
import { getCategoryDisplayName } from '../../constants/identification-categories';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';

export interface SceneExplorerProps {
  nodeTree: NodeInfo[];
  allNodesFlat: NodeInfo[];
  selectedNodeName: string | null;
  onSelectNode: (nodeName: string | null) => void;
  identificationMap?: Map<string, NodeIdentificationRecord>;
}

export const SceneExplorer: React.FC<SceneExplorerProps> = ({
  nodeTree,
  allNodesFlat,
  selectedNodeName,
  onSelectNode,
  identificationMap,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<string>('ALL');

  // Node DOM refs for smooth auto-scroll to selected node
  const nodeRowRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  // Expand state
  const [expandedNodes, setExpandedNodes] = useState<Set<number>>(() => {
    // Default: expand top-level roots
    const initial = new Set<number>();
    nodeTree.forEach((n) => initial.add(n.index));
    return initial;
  });

  // Automatically reveal selected node in tree by expanding all its ancestors
  useEffect(() => {
    if (!selectedNodeName) return;

    // Find target node in flat list
    const target = allNodesFlat.find((n) => n.name === selectedNodeName);
    if (!target) return;

    // Trace ancestors
    const ancestorIndices: number[] = [];
    let currParentIndex = target.parentIndex;
    while (currParentIndex !== null && currParentIndex !== undefined) {
      ancestorIndices.push(currParentIndex);
      const parentNode = allNodesFlat.find((n) => n.index === currParentIndex);
      currParentIndex = parentNode ? parentNode.parentIndex : null;
    }

    if (ancestorIndices.length > 0) {
      setExpandedNodes((prev) => {
        const next = new Set(prev);
        ancestorIndices.forEach((idx) => next.add(idx));
        return next;
      });
    }

    // Scroll selected row into viewport smoothly
    const timer = setTimeout(() => {
      const el = nodeRowRefs.current.get(selectedNodeName);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [selectedNodeName, allNodesFlat]);

  const toggleExpand = (index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedNodes((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const expandAll = () => {
    const all = new Set<number>();
    allNodesFlat.forEach((n) => all.add(n.index));
    setExpandedNodes(all);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set());
  };

  // Find currently selected node info from flat list
  const selectedNode = useMemo(() => {
    if (!selectedNodeName) return null;
    return allNodesFlat.find((n) => n.name === selectedNodeName) || null;
  }, [allNodesFlat, selectedNodeName]);

  // Filter nodes if search term is active or category filter is picked
  const filteredFlatNodes = useMemo(() => {
    if (!searchTerm.trim() && activeFilter === 'ALL') return null;

    return allNodesFlat.filter((node) => {
      const ident = identificationMap?.get(node.name);

      const matchesSearch =
        !searchTerm.trim() ||
        node.name.toLowerCase().includes(searchTerm.toLowerCase().trim()) ||
        (ident && ident.displayName.toLowerCase().includes(searchTerm.toLowerCase().trim())) ||
        (ident && ident.category.toLowerCase().includes(searchTerm.toLowerCase().trim()));

      const matchesFilter =
        activeFilter === 'ALL' ||
        (activeFilter === 'ANCHOR' && (node.isAnchor || node.name.toUpperCase().startsWith('ANCHOR_'))) ||
        (activeFilter === 'ROOM' && (node.classification === 'ROOM' || node.name.toUpperCase().startsWith('ROOM_'))) ||
        (activeFilter === 'OBJ' && (node.classification === 'OBJ' || node.name.toUpperCase().startsWith('OBJ_'))) ||
        (activeFilter === 'IDENTIFIED' && ident?.status === 'IDENTIFIED') ||
        (activeFilter === 'SUGGESTED' && ident?.status === 'SUGGESTED');

      return matchesSearch && matchesFilter;
    });
  }, [allNodesFlat, searchTerm, activeFilter, identificationMap]);

  // Render status & category badge
  const renderNodeBadges = (node: NodeInfo) => {
    const ident = identificationMap?.get(node.name);
    if (!ident) {
      if (node.isAnchor) {
        return (
          <Badge variant="purple" className="text-[9px] py-0 px-1 font-bold">
            ANCHOR
          </Badge>
        );
      }
      return null;
    }

    return (
      <div className="flex items-center gap-1 shrink-0">
        {ident.status === 'IDENTIFIED' ? (
          <Badge variant="success" className="text-[9px] py-0 px-1.5 font-bold">
            IDENTIFIED
          </Badge>
        ) : ident.status === 'SUGGESTED' ? (
          <Badge variant="purple" className="text-[9px] py-0 px-1.5 font-bold">
            SUGGESTED
          </Badge>
        ) : ident.status === 'NEEDS_REVIEW' ? (
          <Badge variant="danger" className="text-[9px] py-0 px-1.5 font-bold">
            REVIEW
          </Badge>
        ) : null}
      </div>
    );
  };

  // Recursive Tree Node component
  const TreeNode: React.FC<{ node: NodeInfo; depth?: number }> = ({
    node,
    depth = 0,
  }) => {
    const isExpanded = expandedNodes.has(node.index);
    const hasChildren = node.children && node.children.length > 0;
    const isSelected = selectedNodeName === node.name;
    const ident = identificationMap?.get(node.name);

    return (
      <div className="select-none text-xs">
        <div
          ref={(el) => {
            if (el) {
              nodeRowRefs.current.set(node.name, el);
            } else {
              nodeRowRefs.current.delete(node.name);
            }
          }}
          onClick={() => onSelectNode(isSelected ? null : node.name)}
          style={{ paddingLeft: `${depth * 14 + 8}px` }}
          className={`flex items-center gap-2 py-1.5 pr-2 rounded-xl cursor-pointer transition-all ${
            isSelected
              ? 'bg-[#181824] text-white shadow-xs font-semibold'
              : 'text-slate-700 hover:text-[#181829] hover:bg-slate-100/80'
          }`}
        >
          {/* Expand/Collapse toggle */}
          {hasChildren ? (
            <button
              onClick={(e) => toggleExpand(node.index, e)}
              className="p-0.5 rounded-sm hover:bg-slate-200/50 text-slate-400 hover:text-slate-700"
            >
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
          ) : (
            <span className="w-3.5 h-3.5 inline-block" />
          )}

          {/* Node Icon */}
          {node.isAnchor || node.name.toUpperCase().startsWith('ANCHOR_') ? (
            <Target
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-[#A78BFA]' : 'text-emerald-600'
              }`}
            />
          ) : node.name.toUpperCase().startsWith('ROOM_') || node.classification === 'ROOM' ? (
            <Grid2X2
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-white' : 'text-[#8B5CF6]'
              }`}
            />
          ) : node.hasMesh ? (
            <Box
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-white' : 'text-slate-500'
              }`}
            />
          ) : (
            <FolderTree
              className={`w-3.5 h-3.5 shrink-0 ${
                isSelected ? 'text-white' : 'text-slate-400'
              }`}
            />
          )}

          {/* Node Label: Display Name with original node name subtitle */}
          <div className="truncate flex-1 min-w-0">
            {ident && ident.displayName !== node.name ? (
              <div className="flex flex-col">
                <span className={`truncate text-[11px] font-bold ${isSelected ? 'text-white' : 'text-[#181829]'}`}>
                  {ident.displayName}
                </span>
                <span className={`truncate font-mono text-[9px] ${isSelected ? 'text-slate-300' : 'text-slate-400'}`}>
                  {node.name}
                </span>
              </div>
            ) : (
              <span className="truncate font-mono text-[11px]">
                {node.name}
              </span>
            )}
          </div>

          {/* Badges */}
          {renderNodeBadges(node)}
        </div>

        {/* Render child nodes if expanded */}
        {hasChildren && isExpanded && (
          <div className="space-y-0.5">
            {node.children!.map((child) => (
              <TreeNode key={child.index} node={child} depth={depth + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-3xl border border-slate-200/80 shadow-[0_10px_30px_-5px_rgba(112,118,150,0.06)] overflow-hidden">
      {/* Panel Header */}
      <div className="p-4 border-b border-slate-100 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-purple-50 text-[#8B5CF6]">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-[#181829]">Identification Explorer</h3>
            <span className="text-[10px] text-[#71758E]">
              {allNodesFlat.length} internal nodes
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={expandAll}
            className="text-[10px] text-slate-500 hover:text-[#8B5CF6] px-2 py-1 rounded-md hover:bg-purple-50 font-medium"
            title="Expand All"
          >
            Expand
          </button>
          <span className="text-slate-200">|</span>
          <button
            onClick={collapseAll}
            className="text-[10px] text-slate-500 hover:text-[#8B5CF6] px-2 py-1 rounded-md hover:bg-purple-50 font-medium"
            title="Collapse All"
          >
            Collapse
          </button>
        </div>
      </div>

      {/* Search & Category Filter */}
      <div className="p-3 border-b border-slate-100 space-y-2">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by display name or node ID..."
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-full bg-slate-50 border border-slate-200 text-[#181829] placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-1 focus:ring-purple-400"
          />
        </div>

        {/* Quick Filter Badges */}
        <div className="flex flex-wrap gap-1">
          {['ALL', 'ROOM', 'OBJ', 'ANCHOR', 'IDENTIFIED', 'SUGGESTED'].map((filterKey) => (
            <button
              key={filterKey}
              onClick={() => setActiveFilter(filterKey)}
              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold transition-all ${
                activeFilter === filterKey
                  ? 'bg-[#181824] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {filterKey}
            </button>
          ))}
        </div>
      </div>

      {/* Main Tree List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
        {filteredFlatNodes ? (
          filteredFlatNodes.length > 0 ? (
            <div className="space-y-1">
              <div className="px-2 py-1 text-[10px] text-[#71758E] font-medium">
                Showing {filteredFlatNodes.length} filtered nodes:
              </div>
              {filteredFlatNodes.map((node) => {
                const ident = identificationMap?.get(node.name);
                return (
                  <div
                    key={node.index}
                    ref={(el) => {
                      if (el) {
                        nodeRowRefs.current.set(node.name, el);
                      } else {
                        nodeRowRefs.current.delete(node.name);
                      }
                    }}
                    onClick={() => onSelectNode(node.name)}
                    className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer text-xs transition-all ${
                      selectedNodeName === node.name
                        ? 'bg-[#181824] text-white shadow-xs font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {node.isAnchor || node.name.toUpperCase().startsWith('ANCHOR_') ? (
                      <Target className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    ) : node.name.toUpperCase().startsWith('ROOM_') || node.classification === 'ROOM' ? (
                      <Grid2X2 className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
                    ) : node.hasMesh ? (
                      <Box className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    ) : (
                      <FolderTree className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}

                    <div className="truncate flex-1 min-w-0">
                      {ident && ident.displayName !== node.name ? (
                        <div className="flex flex-col">
                          <span className={`truncate text-[11px] font-bold ${selectedNodeName === node.name ? 'text-white' : 'text-[#181829]'}`}>
                            {ident.displayName}
                          </span>
                          <span className={`truncate font-mono text-[9px] ${selectedNodeName === node.name ? 'text-slate-300' : 'text-slate-400'}`}>
                            {node.name}
                          </span>
                        </div>
                      ) : (
                        <span className="truncate flex-1 font-mono text-[11px]">
                          {node.name}
                        </span>
                      )}
                    </div>

                    {renderNodeBadges(node)}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-6 text-center text-xs text-slate-400">
              No nodes matching &apos;{searchTerm}&apos;
            </div>
          )
        ) : (
          nodeTree.map((rootNode) => (
            <TreeNode key={rootNode.index} node={rootNode} />
          ))
        )}
      </div>

      {/* Quick Status Bar when node is selected */}
      {selectedNode && (
        <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-[11px]">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles className="w-3.5 h-3.5 text-[#8B5CF6] shrink-0" />
            <span className="font-mono font-bold truncate text-[#181829]">
              {identificationMap?.get(selectedNode.name)?.displayName || selectedNode.name}
            </span>
          </div>
          <button
            onClick={() => onSelectNode(null)}
            className="text-[10px] text-slate-400 hover:text-slate-700 font-medium"
          >
            Clear
          </button>
        </div>
      )}
    </div>
  );
};
