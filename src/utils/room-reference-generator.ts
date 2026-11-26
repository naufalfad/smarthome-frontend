import { PolygonPoint, RoomType } from '../types/floor-plan';

export type RoomTemplateKey = 'STANDARD_HOUSE' | 'STUDIO_APARTMENT' | 'TWO_BEDROOM';

export interface RoomTemplateDefinition {
  key: RoomTemplateKey;
  name: string;
  description: string;
  iconName: string;
  badge: string;
  roomCount: number;
}

export interface GeneratedRoomReference {
  name: string;
  type: RoomType;
  color: string;
  ceilingHeight: number;
  polygonCoordinates: PolygonPoint[];
  estimatedAreaM2?: number;
}

export const ROOM_TEMPLATES: Record<RoomTemplateKey, RoomTemplateDefinition> = {
  STANDARD_HOUSE: {
    key: 'STANDARD_HOUSE',
    name: 'Rumah Lengkap (Family Home)',
    description: 'Tata ruang 5 zona: Ruang Tamu, Kamar Utama, Kamar Anak/Tamu, Dapur & Makan, serta Kamar Mandi.',
    iconName: 'Home',
    badge: 'Paling Populer',
    roomCount: 5,
  },
  TWO_BEDROOM: {
    key: 'TWO_BEDROOM',
    name: 'Rumah Minimalis 2 Kamar',
    description: 'Tata ruang modern 4-5 zona dengan ruang keluarga terbuka, 2 kamar tidur simetris, dapur, dan kamar mandi.',
    iconName: 'LayoutGrid',
    badge: 'Efektif',
    roomCount: 5,
  },
  STUDIO_APARTMENT: {
    key: 'STUDIO_APARTMENT',
    name: 'Apartemen / Studio Minimalis',
    description: 'Tata ruang terbuka 3 zona: Ruang Utama Multifungsi (Bed & Living), Pantry Dapur, dan Kamar Mandi.',
    iconName: 'Building',
    badge: 'Kompak',
    roomCount: 3,
  },
};

/**
 * Generate client-side proportional room polygons mapped across the canvas bounds
 */
export function generateAutoRoomReferences(
  canvasBounds: { width: number; height: number; x?: number; y?: number },
  templateKey: RoomTemplateKey = 'STANDARD_HOUSE',
  pixelsPerMeter?: number | null
): GeneratedRoomReference[] {
  const minX = (canvasBounds.x || 0) + canvasBounds.width * 0.05;
  const minY = (canvasBounds.y || 0) + canvasBounds.height * 0.05;
  const totalW = canvasBounds.width * 0.90;
  const totalH = canvasBounds.height * 0.90;

  const wallGap = Math.max(Math.min(canvasBounds.width, canvasBounds.height) * 0.012, 4); // Interior wall offset in px

  const calculateArea = (w: number, h: number): number | undefined => {
    if (!pixelsPerMeter || pixelsPerMeter <= 0) return undefined;
    const mWidth = w / pixelsPerMeter;
    const mHeight = h / pixelsPerMeter;
    return Math.round(mWidth * mHeight * 100) / 100;
  };

  const createRect = (rx: number, ry: number, rw: number, rh: number): PolygonPoint[] => {
    const x1 = Math.round(rx);
    const y1 = Math.round(ry);
    const x2 = Math.round(rx + rw);
    const y2 = Math.round(ry + rh);
    return [
      { x: x1, y: y1 },
      { x: x2, y: y1 },
      { x: x2, y: y2 },
      { x: x1, y: y2 },
    ];
  };

  if (templateKey === 'STUDIO_APARTMENT') {
    // 3 Rooms: Studio Main Area (62%), Kitchenette (38% top), Bathroom (38% bottom)
    const mainW = totalW * 0.62 - wallGap / 2;
    const sideW = totalW * 0.38 - wallGap / 2;
    const sideX = minX + mainW + wallGap;

    const kitchenH = totalH * 0.44 - wallGap / 2;
    const bathH = totalH * 0.56 - wallGap / 2;
    const bathY = minY + kitchenH + wallGap;

    return [
      {
        name: 'Area Utama Studio (Living & Bed)',
        type: 'LIVING_ROOM',
        color: '#6366F1', // Indigo
        ceilingHeight: 3.0,
        polygonCoordinates: createRect(minX, minY, mainW, totalH),
        estimatedAreaM2: calculateArea(mainW, totalH),
      },
      {
        name: 'Dapur & Pantry',
        type: 'KITCHEN',
        color: '#F59E0B', // Amber
        ceilingHeight: 2.8,
        polygonCoordinates: createRect(sideX, minY, sideW, kitchenH),
        estimatedAreaM2: calculateArea(sideW, kitchenH),
      },
      {
        name: 'Kamar Mandi',
        type: 'BATHROOM',
        color: '#0EA5E9', // Sky Blue
        ceilingHeight: 2.6,
        polygonCoordinates: createRect(sideX, bathY, sideW, bathH),
        estimatedAreaM2: calculateArea(sideW, bathH),
      },
    ];
  }

  if (templateKey === 'TWO_BEDROOM') {
    // 5 Rooms: Living Room (58% W, 55% H), Bed 1 (42% W, 55% H)
    // Bottom: Kitchen (38% W), Bathroom (24% W), Bed 2 (38% W)
    const topH = totalH * 0.54 - wallGap / 2;
    const botH = totalH * 0.46 - wallGap / 2;
    const botY = minY + topH + wallGap;

    const topLivingW = totalW * 0.58 - wallGap / 2;
    const topBedW = totalW * 0.42 - wallGap / 2;
    const topBedX = minX + topLivingW + wallGap;

    const botKitchenW = totalW * 0.38 - wallGap / 2;
    const botBathW = totalW * 0.24 - wallGap;
    const botBed2W = totalW * 0.38 - wallGap / 2;

    const botBathX = minX + botKitchenW + wallGap;
    const botBed2X = botBathX + botBathW + wallGap;

    return [
      {
        name: 'Ruang Tamu & Keluarga',
        type: 'LIVING_ROOM',
        color: '#6366F1', // Indigo
        ceilingHeight: 3.2,
        polygonCoordinates: createRect(minX, minY, topLivingW, topH),
        estimatedAreaM2: calculateArea(topLivingW, topH),
      },
      {
        name: 'Kamar Tidur Utama',
        type: 'BEDROOM',
        color: '#8B5CF6', // Purple
        ceilingHeight: 3.0,
        polygonCoordinates: createRect(topBedX, minY, topBedW, topH),
        estimatedAreaM2: calculateArea(topBedW, topH),
      },
      {
        name: 'Dapur & Ruang Makan',
        type: 'KITCHEN',
        color: '#F59E0B', // Amber
        ceilingHeight: 2.8,
        polygonCoordinates: createRect(minX, botY, botKitchenW, botH),
        estimatedAreaM2: calculateArea(botKitchenW, botH),
      },
      {
        name: 'Kamar Mandi',
        type: 'BATHROOM',
        color: '#0EA5E9', // Sky Blue
        ceilingHeight: 2.6,
        polygonCoordinates: createRect(botBathX, botY, botBathW, botH),
        estimatedAreaM2: calculateArea(botBathW, botH),
      },
      {
        name: 'Kamar Tidur 2',
        type: 'BEDROOM',
        color: '#10B981', // Emerald
        ceilingHeight: 3.0,
        polygonCoordinates: createRect(botBed2X, botY, botBed2W, botH),
        estimatedAreaM2: calculateArea(botBed2W, botH),
      },
    ];
  }

  // Default: STANDARD_HOUSE (5 Rooms)
  // Left Zone (56% W): Living Room (58% H), Kitchen & Dining (42% H)
  // Right Zone (44% W): Master Bed (40% H), Bathroom (20% H), Bedroom 2 (40% H)
  const leftW = totalW * 0.55 - wallGap / 2;
  const rightW = totalW * 0.45 - wallGap / 2;
  const rightX = minX + leftW + wallGap;

  const leftLivingH = totalH * 0.58 - wallGap / 2;
  const leftKitchenH = totalH * 0.42 - wallGap / 2;
  const leftKitchenY = minY + leftLivingH + wallGap;

  const rightMasterH = totalH * 0.40 - wallGap / 2;
  const rightBathH = totalH * 0.20 - wallGap;
  const rightBed2H = totalH * 0.40 - wallGap / 2;

  const rightBathY = minY + rightMasterH + wallGap;
  const rightBed2Y = rightBathY + rightBathH + wallGap;

  return [
    {
      name: 'Ruang Tamu & Keluarga',
      type: 'LIVING_ROOM',
      color: '#6366F1', // Indigo
      ceilingHeight: 3.2,
      polygonCoordinates: createRect(minX, minY, leftW, leftLivingH),
      estimatedAreaM2: calculateArea(leftW, leftLivingH),
    },
    {
      name: 'Dapur & Ruang Makan',
      type: 'KITCHEN',
      color: '#F59E0B', // Amber
      ceilingHeight: 2.8,
      polygonCoordinates: createRect(minX, leftKitchenY, leftW, leftKitchenH),
      estimatedAreaM2: calculateArea(leftW, leftKitchenH),
    },
    {
      name: 'Kamar Tidur Utama',
      type: 'BEDROOM',
      color: '#8B5CF6', // Purple
      ceilingHeight: 3.0,
      polygonCoordinates: createRect(rightX, minY, rightW, rightMasterH),
      estimatedAreaM2: calculateArea(rightW, rightMasterH),
    },
    {
      name: 'Kamar Mandi',
      type: 'BATHROOM',
      color: '#0EA5E9', // Sky Blue
      ceilingHeight: 2.6,
      polygonCoordinates: createRect(rightX, rightBathY, rightW, rightBathH),
      estimatedAreaM2: calculateArea(rightW, rightBathH),
    },
    {
      name: 'Kamar Tidur 2',
      type: 'BEDROOM',
      color: '#10B981', // Emerald
      ceilingHeight: 3.0,
      polygonCoordinates: createRect(rightX, rightBed2Y, rightW, rightBed2H),
      estimatedAreaM2: calculateArea(rightW, rightBed2H),
    },
  ];
}
