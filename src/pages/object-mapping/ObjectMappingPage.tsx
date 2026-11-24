import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Crosshair, ArrowRight, MousePointerClick } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const ObjectMappingPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="3D Object Mapping"
        description="Interact directly with 3D model geometry to select individual nodes (lights, HVAC units, door locks, sensors) and bind them to smart entities."
        breadcrumbs={[{ label: 'Object Mapping', isCurrent: true }]}
        actions={
          <Button variant="secondary" size="sm" pill disabled className="opacity-60 cursor-not-allowed">
            <MousePointerClick className="w-4 h-4 text-[#8B5CF6]" />
            <span>Select 3D Mesh Node</span>
          </Button>
        }
      />

      <EmptyState
        icon={Crosshair}
        phaseBadge="Interactive Node Raycasting Standby"
        title="No Objects Mapped"
        description="Object mapping requires an interactive 3D canvas with loaded geometry meshes. Once a 3D model is chosen, you can hover and click directly on fixtures inside the viewport to link them to IoT entities."
        action={
          <Button variant="dark" pill onClick={() => navigate('/models')}>
            <span>Choose 3D Model</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        }
        hint="Three.js raycaster will detect node meshes, highlight bounding outlines, and read node metadata tags."
      />

      {/* Feature Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <Badge variant="purple" className="text-[10px]">
              Direct Raycasting
            </Badge>
            <h4 className="text-xs font-bold text-[#181829]">Interactive Viewport Picker</h4>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Click lamp shades, ceiling fans, or thermostats in the 3D scene to open immediate property inspectors.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <Badge variant="slate" className="text-[10px]">
              Mesh Hierarchy
            </Badge>
            <h4 className="text-xs font-bold text-[#181829]">Scene Graph Explorer</h4>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Traverse parent-child mesh relationships to select either individual sub-meshes or entire compound objects.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <Badge variant="success" className="text-[10px]">
              Visual Feedback
            </Badge>
            <h4 className="text-xs font-bold text-[#181829]">Dynamic Outline Glow</h4>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Selected 3D nodes glow with translucent purple outlines (like the purple apartment walls in the reference design).
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
