import React from 'react';
import { IoTDevice, DeviceType } from '../types/device';

export interface DeviceVisualTheme {
  status: 'ON' | 'OFF' | 'LOCKED' | 'UNLOCKED' | 'ONLINE' | 'OFFLINE' | 'ALERT' | 'OPEN' | 'CLOSED';
  isActive: boolean;
  pinOpacity: number;
  primaryColor: string;
  fillColor: string;
  strokeColor: string;
  pinBgColor: string;
  pinBorderColor: string;
  ringColor: string;
  glowColor: string;
  hasAmbientHalo: boolean;
  haloColor: string;
  haloRadiusFactor: number;
  haloOpacity: number;
  statusText: string;
  subText?: string;
}

/**
 * Checks if a device is in active / powered on state
 */
export function isDevicePowerOn(dev: IoTDevice): boolean {
  if (dev.status === 'ON') return true;
  if (dev.status === 'OFF') return false;
  if (dev.configuration?.power !== undefined) {
    return Boolean(dev.configuration.power);
  }
  return dev.status === 'ONLINE';
}

/**
 * Checks if a lock device is locked
 */
export function isDeviceLocked(dev: IoTDevice): boolean {
  if (dev.status === 'LOCKED') return true;
  if (dev.status === 'UNLOCKED') return false;
  if (dev.configuration?.lockState !== undefined) {
    return dev.configuration.lockState === 'LOCKED';
  }
  if (dev.configuration?.isLocked !== undefined) {
    return Boolean(dev.configuration.isLocked);
  }
  return true; // Default locked for safety
}

/**
 * Checks if a door/window sensor is open
 */
export function isDeviceDoorOpen(dev: IoTDevice): boolean {
  if (dev.status === 'OPEN' || dev.status === 'UNLOCKED') return true;
  if (dev.status === 'CLOSED' || dev.status === 'LOCKED') return false;
  if (dev.configuration?.isOpen !== undefined) {
    return Boolean(dev.configuration.isOpen);
  }
  if (dev.configuration?.contact !== undefined) {
    return !Boolean(dev.configuration.contact); // false contact = open
  }
  return false;
}

/**
 * Computes full visual theme for any IoT Device based on its type and current status/telemetry
 */
export function getDeviceVisualTheme(dev: IoTDevice): DeviceVisualTheme {
  const isAlert = dev.status === 'ALERT' || dev.configuration?.alert === true;
  const cfg = (dev.configuration as Record<string, any>) || {};
  const type = (dev.type || '').toUpperCase();

  // 1. EMERGENCY / CRITICAL ALERT STATE
  if (isAlert) {
    return {
      status: 'ALERT',
      isActive: true,
      pinOpacity: 1.0,
      primaryColor: '#EF4444',
      fillColor: 'rgba(239, 68, 68, 0.45)',
      strokeColor: '#EF4444',
      pinBgColor: '#7F1D1D',
      pinBorderColor: '#FCA5A5',
      ringColor: '#EF4444',
      glowColor: 'rgba(239, 68, 68, 0.75)',
      hasAmbientHalo: true,
      haloColor: '#EF4444',
      haloRadiusFactor: 2.6,
      haloOpacity: 0.38,
      statusText: '⚠️ BAHAYA',
    };
  }

  // 2. SMART DOOR LOCK (High-Visibility Contrast: Terkunci vs Belum Dikunci)
  if (type === 'LOCK' || type === 'SMART_LOCK') {
    const locked = isDeviceLocked(dev);

    if (locked) {
      // TERKUNCI (LOCKED) — Solid emerald green, secure, calm, closed shackle
      return {
        status: 'LOCKED',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#10B981', // Emerald green
        fillColor: 'rgba(16, 185, 129, 0.35)',
        strokeColor: '#10B981',
        pinBgColor: '#064E3B', // Deep emerald
        pinBorderColor: '#6EE7B7', // Luminous mint
        ringColor: '#10B981',
        glowColor: 'rgba(16, 185, 129, 0.5)',
        hasAmbientHalo: true, // Subtle security aura
        haloColor: '#10B981',
        haloRadiusFactor: 1.8,
        haloOpacity: 0.22,
        statusText: '🔒 TERKUNCI',
      };
    }

    // BELUM DIKUNCI / TERBUKA (UNLOCKED) — Attention-grabbing coral orange warning!
    return {
      status: 'UNLOCKED',
      isActive: false, // Unlatched
      pinOpacity: 1.0, // High visibility alert level
      primaryColor: '#F97316', // Coral orange
      fillColor: 'rgba(249, 115, 22, 0.4)',
      strokeColor: '#F97316',
      pinBgColor: '#431407', // Deep orange-red base
      pinBorderColor: '#FDBA74', // Radiant orange border
      ringColor: '#F97316',
      glowColor: 'rgba(249, 115, 22, 0.75)',
      hasAmbientHalo: true, // Unlocked alert aura on floor plan
      haloColor: '#F97316',
      haloRadiusFactor: 2.4,
      haloOpacity: 0.32,
      statusText: '🔓 BELUM DIKUNCI',
    };
  }

  // 3. DOOR & WINDOW SENSORS
  if (type === 'DOOR_SENSOR' || type === 'WINDOW_SENSOR') {
    const isOpen = isDeviceDoorOpen(dev);
    const labelPrefix = type === 'WINDOW_SENSOR' ? '🪟' : '🚪';

    if (isOpen) {
      // TERBUKA — Warning Orange
      return {
        status: 'OPEN',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#F97316',
        fillColor: 'rgba(249, 115, 22, 0.4)',
        strokeColor: '#F97316',
        pinBgColor: '#431407',
        pinBorderColor: '#FDBA74',
        ringColor: '#F97316',
        glowColor: 'rgba(249, 115, 22, 0.65)',
        hasAmbientHalo: true,
        haloColor: '#F97316',
        haloRadiusFactor: 2.2,
        haloOpacity: 0.28,
        statusText: `${labelPrefix} TERBUKA`,
      };
    }

    // TERTUTUP — Calm Emerald Green (Safe, resting state)
    return {
      status: 'CLOSED',
      isActive: false,
      pinOpacity: 0.55,
      primaryColor: '#10B981',
      fillColor: 'rgba(16, 185, 129, 0.2)',
      strokeColor: '#34D399',
      pinBgColor: '#064E3B',
      pinBorderColor: '#34D399',
      ringColor: '#10B981',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#10B981',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: `${labelPrefix} TERTUTUP`,
    };
  }

  // 4. LIGHTING & DIMMERS (Menyala: Warm Yellow/Amber Radiant vs Redup: Dark Muted Slate)
  if (type === 'LIGHT' || type === 'SMART_LIGHT' || type === 'SMART_DIMMER') {
    const isPower = isDevicePowerOn(dev);
    const brightness = typeof cfg.brightness === 'number' ? cfg.brightness : 100;

    if (isPower) {
      return {
        status: 'ON',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#F59E0B',
        fillColor: '#FDE047', // Radiant glowing warm yellow
        strokeColor: '#D97706',
        pinBgColor: '#3A1E02', // Deep warm amber
        pinBorderColor: '#FDE047',
        ringColor: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.7)',
        hasAmbientHalo: true,
        haloColor: '#FBBF24',
        haloRadiusFactor: 2.6 + (brightness / 100) * 0.8,
        haloOpacity: 0.3 + (brightness / 100) * 0.25,
        statusText: type === 'SMART_DIMMER' ? `💡 ${brightness}%` : '💡 MENYALA',
        subText: type === 'SMART_DIMMER' ? `${brightness}%` : undefined,
      };
    }

    return {
      status: 'OFF',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '⚪ MATI',
    };
  }

  // 5. AIR CONDITIONER & CLIMATE (Menyala: Cool Cyan Airflow vs Redup: Inactive)
  if (type === 'AC' || type === 'SMART_AC' || type === 'THERMOSTAT') {
    const isPower = isDevicePowerOn(dev);
    const temp = cfg.targetTemperature ?? cfg.temperature ?? 24;

    if (isPower) {
      return {
        status: 'ON',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#06B6D4', // Cool Cyan
        fillColor: 'rgba(6, 182, 212, 0.38)',
        strokeColor: '#06B6D4',
        pinBgColor: '#083344', // Deep cyan base
        pinBorderColor: '#67E8F9',
        ringColor: '#06B6D4',
        glowColor: 'rgba(6, 182, 212, 0.6)',
        hasAmbientHalo: true,
        haloColor: '#06B6D4',
        haloRadiusFactor: 2.2,
        haloOpacity: 0.28,
        statusText: `❄️ ${temp}°C`,
        subText: 'COOL',
      };
    }

    return {
      status: 'OFF',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '⚪ MATI',
    };
  }

  // 6. SWITCH & SOCKET (Menyala: Electric Blue vs Redup: Slate Off)
  if (type === 'SWITCH' || type === 'SOCKET') {
    const isPower = isDevicePowerOn(dev);
    const isSocket = type === 'SOCKET';

    if (isPower) {
      return {
        status: 'ON',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#3B82F6', // Electric Blue
        fillColor: 'rgba(59, 130, 246, 0.38)',
        strokeColor: '#3B82F6',
        pinBgColor: '#1E3A8A',
        pinBorderColor: '#93C5FD',
        ringColor: '#3B82F6',
        glowColor: 'rgba(59, 130, 246, 0.5)',
        hasAmbientHalo: true,
        haloColor: '#3B82F6',
        haloRadiusFactor: 2.0,
        haloOpacity: 0.22,
        statusText: isSocket ? '🔌 ON' : '⚡ ON',
      };
    }

    return {
      status: 'OFF',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: isSocket ? '⚪ OFF' : '⚪ OFF',
    };
  }

  // 7. FAN (Menyala: Sky Blue vs Redup: Mati)
  if (type === 'FAN') {
    const isPower = isDevicePowerOn(dev);

    if (isPower) {
      return {
        status: 'ON',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#0284C7',
        fillColor: 'rgba(2, 132, 199, 0.35)',
        strokeColor: '#0284C7',
        pinBgColor: '#0C4A6E',
        pinBorderColor: '#7DD3FC',
        ringColor: '#0284C7',
        glowColor: 'rgba(2, 132, 199, 0.5)',
        hasAmbientHalo: true,
        haloColor: '#0284C7',
        haloRadiusFactor: 2.1,
        haloOpacity: 0.24,
        statusText: '🌀 ON',
      };
    }

    return {
      status: 'OFF',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '⚪ MATI',
    };
  }

  // 8. CAMERA (Online/Live: Violet vs Offline: Gray)
  if (type === 'CAMERA') {
    const isOnline = dev.status === 'ONLINE' || dev.status === 'ON' || dev.status !== 'OFFLINE';

    if (isOnline) {
      return {
        status: 'ONLINE',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#8B5CF6',
        fillColor: 'rgba(139, 92, 246, 0.35)',
        strokeColor: '#8B5CF6',
        pinBgColor: '#2E1065',
        pinBorderColor: '#C4B5FD',
        ringColor: '#8B5CF6',
        glowColor: 'rgba(139, 92, 246, 0.5)',
        hasAmbientHalo: true,
        haloColor: '#8B5CF6',
        haloRadiusFactor: 2.0,
        haloOpacity: 0.22,
        statusText: '📹 LIVE',
      };
    }

    return {
      status: 'OFFLINE',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '⚪ OFFLINE',
    };
  }

  // 9. SAFETY SENSORS (SMOKE_DETECTOR & WATER_LEAK)
  if (type === 'SMOKE_DETECTOR' || type === 'WATER_LEAK') {
    const isLeak = type === 'WATER_LEAK';
    const alertTriggered = isAlert || dev.status === 'ALERT';

    if (alertTriggered) {
      return {
        status: 'ALERT',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#EF4444',
        fillColor: 'rgba(239, 68, 68, 0.45)',
        strokeColor: '#EF4444',
        pinBgColor: '#7F1D1D',
        pinBorderColor: '#FCA5A5',
        ringColor: '#EF4444',
        glowColor: 'rgba(239, 68, 68, 0.8)',
        hasAmbientHalo: true,
        haloColor: '#EF4444',
        haloRadiusFactor: 2.6,
        haloOpacity: 0.38,
        statusText: isLeak ? '💧 BOCOR!' : '🔥 ASAP!',
      };
    }

    return {
      status: 'ONLINE',
      isActive: false, // Normal calm state
      pinOpacity: 0.55,
      primaryColor: '#10B981',
      fillColor: 'rgba(16, 185, 129, 0.25)',
      strokeColor: '#10B981',
      pinBgColor: '#064E3B',
      pinBorderColor: '#6EE7B7',
      ringColor: '#10B981',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#10B981',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '🛡️ AMAN',
    };
  }

  // 10. MOTION SENSOR
  if (type === 'MOTION_SENSOR') {
    const motionDetected = dev.status === 'ALERT' || dev.configuration?.motion === true;

    if (motionDetected) {
      return {
        status: 'ALERT',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#F59E0B',
        fillColor: 'rgba(245, 158, 11, 0.4)',
        strokeColor: '#F59E0B',
        pinBgColor: '#451A03',
        pinBorderColor: '#FCD34D',
        ringColor: '#F59E0B',
        glowColor: 'rgba(245, 158, 11, 0.65)',
        hasAmbientHalo: true,
        haloColor: '#F59E0B',
        haloRadiusFactor: 2.2,
        haloOpacity: 0.28,
        statusText: '🚶 GERAKAN',
      };
    }

    return {
      status: 'ONLINE',
      isActive: false,
      pinOpacity: 0.55,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '🛡️ STANDBY',
    };
  }

  // 11. SENSORS (TEMPERATURE, HUMIDITY, AIR QUALITY)
  if (type === 'TEMP_HUMIDITY_SENSOR' || type === 'SENSOR') {
    const temp = cfg.temperature ?? 25.5;
    const isOnline = dev.status !== 'OFFLINE';

    if (isOnline) {
      return {
        status: 'ONLINE',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#14B8A6', // Teal
        fillColor: 'rgba(20, 184, 166, 0.35)',
        strokeColor: '#14B8A6',
        pinBgColor: '#134E4A',
        pinBorderColor: '#5EEAD4',
        ringColor: '#14B8A6',
        glowColor: 'rgba(20, 184, 166, 0.45)',
        hasAmbientHalo: false,
        haloColor: '#14B8A6',
        haloRadiusFactor: 1,
        haloOpacity: 0,
        statusText: `🌡️ ${temp}°C`,
      };
    }

    return {
      status: 'OFFLINE',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '⚪ OFFLINE',
    };
  }

  if (type === 'AIR_QUALITY_SENSOR') {
    const aqi = cfg.aqi ?? 35;
    const isOnline = dev.status !== 'OFFLINE';

    if (isOnline) {
      return {
        status: 'ONLINE',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#22C55E', // Green
        fillColor: 'rgba(34, 197, 94, 0.35)',
        strokeColor: '#22C55E',
        pinBgColor: '#14532D',
        pinBorderColor: '#86EFAC',
        ringColor: '#22C55E',
        glowColor: 'rgba(34, 197, 94, 0.45)',
        hasAmbientHalo: false,
        haloColor: '#22C55E',
        haloRadiusFactor: 1,
        haloOpacity: 0,
        statusText: `🍃 ${aqi} AQI`,
      };
    }

    return {
      status: 'OFFLINE',
      isActive: false,
      pinOpacity: 0.45,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '⚪ OFFLINE',
    };
  }

  // 12. CURTAIN
  if (type === 'CURTAIN') {
    const isOpen = cfg.position !== undefined ? cfg.position > 0 : dev.status === 'OPEN' || dev.status === 'ON';
    if (isOpen) {
      return {
        status: 'OPEN',
        isActive: true,
        pinOpacity: 1.0,
        primaryColor: '#38BDF8',
        fillColor: 'rgba(56, 189, 248, 0.35)',
        strokeColor: '#38BDF8',
        pinBgColor: '#075985',
        pinBorderColor: '#BAE6FD',
        ringColor: '#38BDF8',
        glowColor: 'rgba(56, 189, 248, 0.45)',
        hasAmbientHalo: true,
        haloColor: '#38BDF8',
        haloRadiusFactor: 2.0,
        haloOpacity: 0.22,
        statusText: '🪟 TERBUKA',
      };
    }
    return {
      status: 'CLOSED',
      isActive: false,
      pinOpacity: 0.55,
      primaryColor: '#64748B',
      fillColor: 'transparent',
      strokeColor: '#94A3B8',
      pinBgColor: '#0F172A',
      pinBorderColor: '#334155',
      ringColor: '#334155',
      glowColor: 'none',
      hasAmbientHalo: false,
      haloColor: '#64748B',
      haloRadiusFactor: 1,
      haloOpacity: 0,
      statusText: '🪟 TERTUTUP',
    };
  }

  // DEFAULT / FALLBACK
  const isPower = isDevicePowerOn(dev);
  return {
    status: isPower ? 'ON' : 'OFF',
    isActive: isPower,
    pinOpacity: isPower ? 1.0 : 0.45,
    primaryColor: isPower ? '#10B981' : '#64748B',
    fillColor: isPower ? 'rgba(16, 185, 129, 0.35)' : 'transparent',
    strokeColor: isPower ? '#10B981' : '#94A3B8',
    pinBgColor: isPower ? '#064E3B' : '#0F172A',
    pinBorderColor: isPower ? '#6EE7B7' : '#334155',
    ringColor: isPower ? '#10B981' : '#334155',
    glowColor: isPower ? 'rgba(16, 185, 129, 0.4)' : 'none',
    hasAmbientHalo: false,
    haloColor: '#10B981',
    haloRadiusFactor: 1,
    haloOpacity: 0,
    statusText: isPower ? 'ON' : 'OFF',
  };
}

/**
 * Returns gradient url matching theme halo
 */
export function getDeviceHaloGradientUrl(theme: DeviceVisualTheme, prefix: string = ''): string {
  if (theme.status === 'ALERT' || theme.haloColor === '#EF4444') {
    return `url(#${prefix}alert-ambient-glow)`;
  }
  if (theme.haloColor === '#06B6D4') {
    return `url(#${prefix}ac-ambient-glow)`;
  }
  if (theme.haloColor === '#F97316' || theme.status === 'UNLOCKED') {
    return `url(#${prefix}orange-ambient-glow)`;
  }
  if (theme.haloColor === '#10B981' || theme.status === 'LOCKED') {
    return `url(#${prefix}green-ambient-glow)`;
  }
  if (theme.haloColor === '#3B82F6' || theme.haloColor === '#0284C7' || theme.haloColor === '#38BDF8') {
    return `url(#${prefix}blue-ambient-glow)`;
  }
  if (theme.haloColor === '#8B5CF6') {
    return `url(#${prefix}purple-ambient-glow)`;
  }
  return `url(#${prefix}light-ambient-glow)`;
}

/**
 * SVG Ambient Gradients definitions component for SVG Canvas
 */
export const DeviceAmbientGlowDefs: React.FC<{ prefix?: string }> = ({ prefix = '' }) => (
  <>
    {/* Light Ambient Illumination Halo Gradient */}
    <radialGradient id={`${prefix}light-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#FDE047" stopOpacity="0.45" />
      <stop offset="45%" stopColor="#F59E0B" stopOpacity="0.22" />
      <stop offset="100%" stopColor="#F59E0B" stopOpacity="0" />
    </radialGradient>

    {/* AC Cool Air Ambient Radial Gradient */}
    <radialGradient id={`${prefix}ac-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.4" />
      <stop offset="55%" stopColor="#06B6D4" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#06B6D4" stopOpacity="0" />
    </radialGradient>

    {/* Alert Ambient Glow */}
    <radialGradient id={`${prefix}alert-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.5" />
      <stop offset="60%" stopColor="#EF4444" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#EF4444" stopOpacity="0" />
    </radialGradient>

    {/* Orange Unlocked / Warning Ambient Glow */}
    <radialGradient id={`${prefix}orange-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#FB923C" stopOpacity="0.45" />
      <stop offset="60%" stopColor="#F97316" stopOpacity="0.2" />
      <stop offset="100%" stopColor="#F97316" stopOpacity="0" />
    </radialGradient>

    {/* Green Locked / Safe Security Aura */}
    <radialGradient id={`${prefix}green-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#34D399" stopOpacity="0.4" />
      <stop offset="60%" stopColor="#10B981" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
    </radialGradient>

    {/* Blue Electric Switch / Socket / Fan Aura */}
    <radialGradient id={`${prefix}blue-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.4" />
      <stop offset="60%" stopColor="#3B82F6" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
    </radialGradient>

    {/* Purple Camera / Vision Aura */}
    <radialGradient id={`${prefix}purple-ambient-glow`} cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.4" />
      <stop offset="60%" stopColor="#8B5CF6" stopOpacity="0.18" />
      <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
    </radialGradient>
  </>
);

/**
 * Scalable Vector Icon Component (viewBox 0 0 24 24)
 * Renders distinct illuminated vs dimmed graphics for every device type
 */
export const DeviceSvgIcon: React.FC<{ type: string; theme: DeviceVisualTheme }> = ({
  type,
  theme,
}) => {
  const t = (type || '').toUpperCase();

  switch (t) {
    // 1. LIGHTING (Bulb with Radiant Yellow Fill & Beams vs Dim Outline)
    case 'LIGHT':
    case 'SMART_LIGHT':
      return theme.isActive ? (
        <>
          <path
            d="M9 18h6m-4 4h2m-5-8.5A6 6 0 1 1 16 13.5c-.8.8-1.5 2-1.5 3h-5c0-1-.7-2.2-1.5-3z"
            fill={theme.fillColor}
            stroke={theme.strokeColor}
            strokeWidth="1.8"
          />
          {/* Beaming rays */}
          <line x1="12" y1="1" x2="12" y2="3.5" stroke={theme.primaryColor} strokeWidth="2" strokeLinecap="round" />
          <line x1="4.2" y1="4.2" x2="5.8" y2="5.8" stroke={theme.primaryColor} strokeWidth="1.8" strokeLinecap="round" />
          <line x1="19.8" y1="4.2" x2="18.2" y2="5.8" stroke={theme.primaryColor} strokeWidth="1.8" strokeLinecap="round" />
        </>
      ) : (
        <path
          d="M9 18h6m-4 4h2m-5-8.5A6 6 0 1 1 16 13.5c-.8.8-1.5 2-1.5 3h-5c0-1-.7-2.2-1.5-3z"
          fill="none"
          stroke={theme.strokeColor}
          strokeWidth="1.8"
          opacity="0.65"
        />
      );

    // 2. SMART DIMMER (Active Track & Glow Slider vs Inactive)
    case 'SMART_DIMMER':
      return theme.isActive ? (
        <>
          <path d="M4 12h16m-12-6h8m-5 12h5" stroke={theme.strokeColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="8" cy="12" r="3" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.5" />
          <circle cx="15" cy="6" r="2.5" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.5" />
        </>
      ) : (
        <>
          <path d="M4 12h16m-12-6h8m-5 12h5" stroke={theme.strokeColor} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
          <circle cx="8" cy="12" r="2.5" fill="none" stroke={theme.strokeColor} strokeWidth="1.5" opacity="0.6" />
        </>
      );

    // 3. SMART LOCK (High-Contrast: Closed Shackle Emerald vs Wide Open Shackle Orange)
    case 'LOCK':
    case 'SMART_LOCK':
      return theme.status === 'LOCKED' ? (
        <>
          {/* Padlock Closed Shackle — Secure Emerald Green */}
          <rect x="5" y="11" width="14" height="10" rx="2" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" fill="none" stroke={theme.strokeColor} strokeWidth="2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.5" fill={theme.strokeColor} />
        </>
      ) : (
        <>
          {/* Padlock Shackle Swung Wide Open — Unlocked Warning Orange */}
          <rect x="5" y="11" width="14" height="10" rx="2" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          {/* Distinctive open shackle disengaged & swung upward */}
          <path d="M8 11V6a4 4 0 0 1 8 0" fill="none" stroke={theme.strokeColor} strokeWidth="2.2" strokeLinecap="round" />
          <circle cx="12" cy="16" r="1.5" fill={theme.strokeColor} />
        </>
      );

    // 4. DOOR SENSOR (Open Swung Door vs Closed Door)
    case 'DOOR_SENSOR':
      return theme.status === 'OPEN' || theme.status === 'UNLOCKED' ? (
        <>
          {/* Doorway frame + Swung open door leaf */}
          <path d="M4 21h16M5 21V5a2 2 0 0 1 2-2h3v18" fill="none" stroke={theme.strokeColor} strokeWidth="1.8" strokeLinecap="round" />
          <path d="M10 3l8 4v14l-8-3V3z" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" strokeLinejoin="round" />
          <circle cx="16" cy="14" r="1.5" fill={theme.primaryColor} />
        </>
      ) : (
        <>
          {/* Door flush shut tight */}
          <rect x="6" y="3" width="12" height="18" rx="1.5" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          <circle cx="15" cy="12" r="1.5" fill={theme.primaryColor} />
        </>
      );

    // 5. WINDOW SENSOR
    case 'WINDOW_SENSOR':
      return theme.status === 'OPEN' || theme.status === 'UNLOCKED' ? (
        <>
          {/* Casement window swung open */}
          <rect x="3" y="4" width="8" height="16" rx="1" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          <path d="M11 4l8 3v13l-8-3V4z" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
        </>
      ) : (
        <>
          {/* 4-pane window shut tight */}
          <rect x="4" y="4" width="16" height="16" rx="1.5" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          <line x1="12" y1="4" x2="12" y2="20" stroke={theme.strokeColor} strokeWidth="1.5" />
          <line x1="4" y1="12" x2="20" y2="12" stroke={theme.strokeColor} strokeWidth="1.5" />
        </>
      );

    // 6. AIR CONDITIONER (Cool Air Waves Flowing vs Static Outline)
    case 'AC':
    case 'SMART_AC':
      return theme.isActive ? (
        <>
          <rect x="3" y="5" width="18" height="9" rx="2" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          {/* Flowing Cool Airwaves */}
          <path d="M6 18c1.5 1 3 1 4.5 0s3-1 4.5 0" fill="none" stroke={theme.primaryColor} strokeWidth="1.6" strokeLinecap="round" />
          <path d="M8 21c1.2 0.8 2.4 0.8 3.6 0s2.4-0.8 3.6 0" fill="none" stroke={theme.primaryColor} strokeWidth="1.6" strokeLinecap="round" />
        </>
      ) : (
        <rect x="3" y="6" width="18" height="10" rx="2" fill="none" stroke={theme.strokeColor} strokeWidth="1.8" opacity="0.6" />
      );

    // 7. THERMOSTAT / TEMP SENSOR
    case 'THERMOSTAT':
    case 'TEMP_HUMIDITY_SENSOR':
      return theme.isActive ? (
        <>
          <path
            d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
            fill={theme.fillColor}
            stroke={theme.strokeColor}
            strokeWidth="1.8"
          />
          <circle cx="11.5" cy="17" r="2.2" fill={theme.primaryColor} />
          {/* Degree tick */}
          <line x1="14" y1="7" x2="16.5" y2="7" stroke={theme.primaryColor} strokeWidth="1.5" strokeLinecap="round" />
        </>
      ) : (
        <path
          d="M14 14.76V3.5a2.5 2.5 0 0 0-5 0v11.26a4.5 4.5 0 1 0 5 0z"
          fill="none"
          stroke={theme.strokeColor}
          strokeWidth="1.8"
          opacity="0.6"
        />
      );

    // 8. AIR QUALITY SENSOR
    case 'AIR_QUALITY_SENSOR':
      return theme.isActive ? (
        <>
          <path
            d="M22 12h-4l-3 9L9 3l-3 9H2"
            fill="none"
            stroke={theme.strokeColor}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <circle cx="12" cy="12" r="3" fill={theme.fillColor} />
        </>
      ) : (
        <path
          d="M22 12h-4l-3 5L9 7l-3 5H2"
          fill="none"
          stroke={theme.strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.6"
        />
      );

    // 9. FAN (Spinning Tri-Blade vs Inactive)
    case 'FAN':
      return theme.isActive ? (
        <>
          <path
            d="M12 12c-2-3-4-2-4 0a4 4 0 0 0 4 4c3-2 2-4 0-4zm0 0c3-2 2-4 0-4a4 4 0 0 0-4 4c2 3 4 2 4 0zm0 0c2 3 4 2 4 0a4 4 0 0 0-4-4c-3 2-2 4 0 4z"
            fill={theme.fillColor}
            stroke={theme.strokeColor}
            strokeWidth="1.8"
          />
          <circle cx="12" cy="12" r="2" fill={theme.primaryColor} />
        </>
      ) : (
        <path
          d="M12 12c-2-3-4-2-4 0a4 4 0 0 0 4 4c3-2 2-4 0-4zm0 0c3-2 2-4 0-4a4 4 0 0 0-4 4c2 3 4 2 4 0zm0 0c2 3 4 2 4 0a4 4 0 0 0-4-4c-3 2-2 4 0 4z"
          fill="none"
          stroke={theme.strokeColor}
          strokeWidth="1.8"
          opacity="0.6"
        />
      );

    // 10. CAMERA (Live Camera + Red Recording Dot vs Gray Camera)
    case 'CAMERA':
      return theme.isActive ? (
        <>
          <path d="M23 7l-7 5 7 5V7z" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          <rect x="1" y="5" width="15" height="14" rx="2" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.8" />
          <circle cx="8.5" cy="12" r="2.8" fill={theme.primaryColor} />
          {/* Active Red Recording Indicator Dot */}
          <circle cx="4" cy="8" r="1.5" fill="#EF4444" />
        </>
      ) : (
        <>
          <path d="M23 7l-7 5 7 5V7z" fill="none" stroke={theme.strokeColor} strokeWidth="1.8" opacity="0.6" />
          <rect x="1" y="5" width="15" height="14" rx="2" fill="none" stroke={theme.strokeColor} strokeWidth="1.8" opacity="0.6" />
        </>
      );

    // 11. SWITCH
    case 'SWITCH':
      return (
        <>
          <rect
            x="3"
            y="5"
            width="18"
            height="14"
            rx="3"
            stroke={theme.strokeColor}
            fill={theme.fillColor}
            strokeWidth="1.8"
          />
          <circle
            cx={theme.isActive ? 16 : 8}
            cy="12"
            r="3.2"
            fill={theme.primaryColor}
          />
        </>
      );

    // 12. SOCKET
    case 'SOCKET':
      return (
        <>
          <circle
            cx="12"
            cy="12"
            r="9"
            stroke={theme.strokeColor}
            fill={theme.fillColor}
            strokeWidth="1.8"
          />
          <circle cx="9" cy="11" r="1.8" fill={theme.primaryColor} />
          <circle cx="15" cy="11" r="1.8" fill={theme.primaryColor} />
          {theme.isActive && (
            <path d="M12 7v2" stroke={theme.primaryColor} strokeWidth="1.5" strokeLinecap="round" />
          )}
        </>
      );

    // 13. MOTION SENSOR
    case 'MOTION_SENSOR':
      return theme.isActive ? (
        <>
          <path
            d="M4 12a8 8 0 0 1 16 0M7 12a5 5 0 0 1 10 0M10 12a2 2 0 0 1 4 0"
            fill="none"
            stroke={theme.primaryColor}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="12" cy="15" r="2" fill={theme.primaryColor} />
        </>
      ) : (
        <path
          d="M7 12a5 5 0 0 1 10 0M10 12a2 2 0 0 1 4 0"
          fill="none"
          stroke={theme.strokeColor}
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity="0.6"
        />
      );

    // 14. SMOKE DETECTOR
    case 'SMOKE_DETECTOR':
      return theme.status === 'ALERT' ? (
        <>
          <path
            d="M8.5 2C8.5 2 5 6 5 9.5a3.5 3.5 0 0 0 7 0C12 6 8.5 2 8.5 2z"
            fill={theme.fillColor}
            stroke={theme.strokeColor}
            strokeWidth="2"
          />
          <circle cx="8.5" cy="10" r="1.5" fill="#FFFFFF" />
        </>
      ) : (
        <path
          d="M8.5 2C8.5 2 5 6 5 9.5a3.5 3.5 0 0 0 7 0C12 6 8.5 2 8.5 2z"
          fill={theme.fillColor}
          stroke={theme.strokeColor}
          strokeWidth="1.8"
        />
      );

    // 15. WATER LEAK
    case 'WATER_LEAK':
      return theme.status === 'ALERT' ? (
        <>
          <path
            d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
            fill={theme.fillColor}
            stroke={theme.strokeColor}
            strokeWidth="2"
          />
          <circle cx="12" cy="13" r="2" fill="#FFFFFF" />
        </>
      ) : (
        <path
          d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"
          fill={theme.fillColor}
          stroke={theme.strokeColor}
          strokeWidth="1.8"
        />
      );

    // 16. CURTAIN
    case 'CURTAIN':
      return theme.status === 'OPEN' ? (
        <>
          <rect x="4" y="3" width="16" height="18" rx="1.5" fill="none" stroke={theme.strokeColor} strokeWidth="1.6" />
          <path d="M4 3c2 5 2 9 0 18M20 3c-2 5-2 9 0 18" stroke={theme.primaryColor} strokeWidth="2" strokeLinecap="round" />
        </>
      ) : (
        <>
          <rect x="4" y="3" width="16" height="18" rx="1.5" fill={theme.fillColor} stroke={theme.strokeColor} strokeWidth="1.6" />
          <line x1="12" y1="3" x2="12" y2="21" stroke={theme.strokeColor} strokeWidth="1.8" />
        </>
      );

    // DEFAULT / FALLBACK
    default:
      return theme.isActive ? (
        <>
          <circle cx="12" cy="12" r="4" fill={theme.primaryColor} />
          <circle cx="12" cy="12" r="8" fill="none" stroke={theme.strokeColor} strokeWidth="1.8" />
        </>
      ) : (
        <circle cx="12" cy="12" r="6" fill="none" stroke={theme.strokeColor} strokeWidth="1.8" opacity="0.6" />
      );
  }
};

