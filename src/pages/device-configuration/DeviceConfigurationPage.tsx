import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cpu, ArrowRight, Plus } from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { EmptyState } from '../../components/common/EmptyState';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';

export const DeviceConfigurationPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Device Configuration"
        description="Manage IoT telemetry topics, device protocols (MQTT, HTTP, WebSocket), sensor pin mappings, and hardware properties."
        breadcrumbs={[{ label: 'Device Configuration', isCurrent: true }]}
        actions={
          <Button variant="secondary" size="sm" pill disabled className="opacity-60 cursor-not-allowed">
            <Plus className="w-4 h-4 text-[#8B5CF6]" />
            <span>Register IoT Device</span>
          </Button>
        }
      />

      <EmptyState
        icon={Cpu}
        phaseBadge="IoT Protocol Layer Standby"
        title="No Devices Configured"
        description="IoT devices link physical sensors and actuators (temperature sensors, smart switches, relay boards) to their mapped 3D digital objects. Device registration will become active in Phase 3."
        action={
          <Button variant="dark" pill onClick={() => navigate('/mapping')}>
            <span>Review Object Mapping</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        }
        hint="Prepared for standard MQTT broker connections, Home Assistant integration, and WebSocket event telemetry."
      />

      {/* Feature Capabilities */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-5 space-y-2">
            <Badge variant="purple" className="text-[10px]">
              MQTT Protocol
            </Badge>
            <h4 className="text-xs font-bold text-[#181829]">Pub/Sub Telemetry Broker</h4>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Subscribe to standard MQTT topics (e.g., <code>home/livingroom/temp</code>) for high-frequency sensor streams.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <Badge variant="success" className="text-[10px]">
              Two-Way Actuation
            </Badge>
            <h4 className="text-xs font-bold text-[#181829]">Relay Control Commands</h4>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Send immediate command payloads to toggle lights, adjust dimmers, or operate HVAC power levels directly.
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-2">
            <Badge variant="slate" className="text-[10px]">
              Virtual Simulation
            </Badge>
            <h4 className="text-xs font-bold text-[#181829]">Hardware Emulation Mode</h4>
            <p className="text-[11px] text-[#71758E] leading-relaxed">
              Test and validate UI interactions in simulation mode without requiring physical hardware present.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
