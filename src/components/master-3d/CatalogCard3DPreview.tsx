import React from 'react';
import {
  Box,
  Layers,
  Sparkles,
  Maximize2,
  Play,
  RotateCcw,
  Ruler,
  CheckCircle2,
  AlertTriangle,
  Eye,
} from 'lucide-react';
import { Model3DCanvasPreview } from './Model3DCanvasPreview';
import { sanitizeSvgInner } from '../../utils/sanitizeSvg';

interface CatalogCard3DPreviewProps {
  id: string;
  name: string;
  category: string;
  type: 'DEVICE' | 'OBJECT';
  modelUrl?: string | null;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  color?: string | null;
  placementTarget?: string;
  svgContent?: string | null;
  isActive3D: boolean;
  onToggleActive3D: () => void;
  onOpenInspector: () => void;
  className?: string;
}

export const CatalogCard3DPreview: React.FC<CatalogCard3DPreviewProps> = ({
  id,
  name,
  category,
  type,
  modelUrl,
  dimensions,
  color = '#6366F1',
  placementTarget = 'FLOOR',
  svgContent,
  isActive3D,
  onToggleActive3D,
  onOpenInspector,
  className = 'h-48',
}) => {
  const hasGlb = !!modelUrl;

  // Active Live Three.js WebGL Canvas (Exclusive 1-context at a time)
  if (isActive3D) {
    return (
      <div className={`relative ${className} w-full rounded-xl overflow-hidden bg-slate-950 border border-indigo-500/60 shadow-xl shadow-indigo-950/40`}>
        <Model3DCanvasPreview
          modelUrl={modelUrl}
          dimensions={dimensions}
          color={color || '#6366F1'}
          placementTarget={placementTarget}
          autoRotate={true}
          className="w-full h-full"
        />

        {/* Top Control Overlay */}
        <div className="absolute top-2 right-2 z-20 flex items-center gap-1.5">
          <button
            type="button"
            onClick={onOpenInspector}
            title="Buka Inspektur 3D Layar Penuh"
            className="p-1.5 rounded-lg bg-black/70 hover:bg-indigo-600 text-slate-300 hover:text-white backdrop-blur-md border border-white/20 transition-colors shadow-sm"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onToggleActive3D}
            title="Tutup Mode 3D Interaktif"
            className="px-2 py-1 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 text-[10px] font-semibold backdrop-blur-md transition-colors"
          >
            Selesai 3D
          </button>
        </div>
      </div>
    );
  }

  // High-Performance Stylized 3D CAD Blueprint Preview (Zero WebGL context overhead)
  return (
    <div
      onClick={onToggleActive3D}
      className={`relative ${className} w-full rounded-xl overflow-hidden bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border border-slate-800 hover:border-indigo-500/50 transition-all cursor-pointer group flex flex-col justify-between p-3 select-none`}
    >
      {/* Background CAD Isometric Floor Grid */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none group-hover:opacity-30 transition-opacity"
        style={{
          backgroundImage:
            'linear-gradient(to right, #6366f1 1px, transparent 1px), linear-gradient(to bottom, #6366f1 1px, transparent 1px)',
          backgroundSize: '24px 24px',
          maskImage: 'radial-gradient(ellipse at center, rgba(0,0,0,1) 30%, rgba(0,0,0,0) 80%)',
        }}
      />

      {/* Top Header Tags */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-slate-300 border border-white/10 flex items-center gap-1">
            <Layers className="w-2.5 h-2.5 text-indigo-400" />
            {hasGlb ? '3D GLB' : '3D Box'}
          </span>
          <span className="text-[9px] font-mono uppercase px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
            {placementTarget}
          </span>
        </div>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenInspector();
          }}
          title="Buka Inspektur 3D Lengkap"
          className="p-1 rounded-md bg-black/40 hover:bg-indigo-600 text-slate-400 hover:text-white backdrop-blur-md border border-white/10 transition-colors"
        >
          <Maximize2 className="w-3 h-3" />
        </button>
      </div>

      {/* Center 3D Isometric Projection Graphic */}
      <div className="relative z-10 flex-1 flex items-center justify-center py-2">
        {svgContent ? (
          // Crisp 2D Architectural Symbol with Isometric Aura
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div
              className="absolute inset-0 rounded-2xl opacity-20 group-hover:opacity-40 transition-opacity blur-md"
              style={{ backgroundColor: color || '#8B5CF6' }}
            />
            <div
              className="relative w-16 h-16 [&>svg]:w-full [&>svg]:h-full [&>svg]:drop-shadow-md group-hover:scale-105 transition-transform"
              dangerouslySetInnerHTML={{ __html: sanitizeSvgInner(svgContent) }}
            />
          </div>
        ) : (
          // Stylized Isometric Wireframe Cube
          <div className="relative w-20 h-20 flex items-center justify-center">
            <div
              className="absolute inset-2 rounded-xl opacity-25 group-hover:opacity-40 transition-opacity blur-lg"
              style={{ backgroundColor: color || '#6366F1' }}
            />
            <div className="relative flex flex-col items-center justify-center">
              <Box
                className="w-12 h-12 text-indigo-400 group-hover:text-indigo-300 group-hover:scale-110 transition-all drop-shadow-[0_4px_12px_rgba(99,102,241,0.5)]"
                style={{ color: color || '#818CF8' }}
              />
              <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-wider">
                {hasGlb ? 'Model 3D Siap' : 'Balok Spasial'}
              </span>
            </div>
          </div>
        )}

        {/* Hover Action Overlay */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-xs rounded-lg">
          <div className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white text-[11px] font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-600/40">
            <Play className="w-3 h-3 fill-current" />
            <span>Klik untuk Putar 3D</span>
          </div>
        </div>
      </div>

      {/* Bottom Dimension Metrics Bar */}
      <div className="relative z-10 flex items-center justify-between text-[10px] font-mono text-slate-400 bg-black/50 backdrop-blur-md px-2.5 py-1 rounded-lg border border-white/5">
        <div className="flex items-center gap-2">
          <span>P: <strong className="text-slate-200">{dimensions.length.toFixed(2)}m</strong></span>
          <span>L: <strong className="text-slate-200">{dimensions.width.toFixed(2)}m</strong></span>
          <span>T: <strong className="text-slate-200">{dimensions.height.toFixed(2)}m</strong></span>
        </div>
        <span className="text-indigo-400 text-[9px] font-semibold flex items-center gap-0.5 group-hover:underline">
          <Eye className="w-2.5 h-2.5" /> 3D View
        </span>
      </div>
    </div>
  );
};
