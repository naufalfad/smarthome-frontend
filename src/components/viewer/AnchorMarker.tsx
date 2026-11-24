import React, { useState } from 'react';
import { Html } from '@react-three/drei';
import { Radio, Thermometer, Wind, Target, Sparkles } from 'lucide-react';
import { NodeInfo } from '../../types/house-model';

export interface AnchorMarkerProps {
  node: NodeInfo;
  worldPosition: [number, number, number];
  isSelected: boolean;
  onSelect: (nodeName: string) => void;
}

export const AnchorMarker: React.FC<AnchorMarkerProps> = ({
  node,
  worldPosition,
  isSelected,
  onSelect,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  // Pick appropriate icon based on anchor name keywords
  const getIcon = () => {
    const upper = node.name.toUpperCase();
    if (upper.includes('TEMP')) return <Thermometer className="w-3.5 h-3.5" />;
    if (upper.includes('AIR') || upper.includes('HUMID')) return <Wind className="w-3.5 h-3.5" />;
    if (upper.includes('BEACON') || upper.includes('TAG')) return <Radio className="w-3.5 h-3.5" />;
    return <Target className="w-3.5 h-3.5" />;
  };

  return (
    <group position={worldPosition}>
      <Html
        center
        distanceFactor={18}
        zIndexRange={[100, 0]}
        className="pointer-events-auto select-none"
      >
        <div
          onClick={(e) => {
            e.stopPropagation();
            onSelect(node.name);
          }}
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
          className={`group flex items-center gap-1.5 transition-all duration-200 cursor-pointer ${
            isSelected
              ? 'scale-110 z-50'
              : 'hover:scale-105'
          }`}
          title={`IoT Anchor: ${node.name}`}
        >
          {/* Circular Pin Badge */}
          <div
            className={`relative flex items-center justify-center w-7 h-7 rounded-full shadow-lg transition-all ${
              isSelected
                ? 'bg-[#181824] text-white ring-2 ring-[#8B5CF6] ring-offset-2 ring-offset-white'
                : isHovered
                ? 'bg-[#8B5CF6] text-white shadow-purple-500/30'
                : 'bg-white/95 text-[#8B5CF6] border border-purple-200/90 shadow-slate-900/10'
            }`}
          >
            {getIcon()}
            {/* Live pulse dot */}
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#10B981] ring-1 ring-white" />
          </div>

          {/* Floating Pill Label */}
          {(isSelected || isHovered) && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#181824] text-white text-[10px] font-mono font-medium shadow-xl whitespace-nowrap animate-in fade-in zoom-in-95 duration-150">
              <Sparkles className="w-2.5 h-2.5 text-[#A78BFA]" />
              <span>{node.name}</span>
            </div>
          )}
        </div>
      </Html>
    </group>
  );
};

