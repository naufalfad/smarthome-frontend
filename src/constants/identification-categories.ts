import { IdentifiedNodeType } from '../types/identification';

export interface CategoryOption {
  code: string;
  name: string;
  group?: string;
  description?: string;
}

export const ROOM_CATEGORIES: CategoryOption[] = [
  { code: 'LIVING_ROOM', name: 'Living Room', description: 'Main family lounge and living quarters' },
  { code: 'BEDROOM', name: 'Bedroom', description: 'Standard guest or family bedroom' },
  { code: 'MASTER_BEDROOM', name: 'Master Bedroom', description: 'Primary master bedroom suite' },
  { code: 'KITCHEN', name: 'Kitchen', description: 'Culinary preparation and cooking area' },
  { code: 'DINING_ROOM', name: 'Dining Room', description: 'Dining area for meals' },
  { code: 'BATHROOM', name: 'Bathroom', description: 'Standard bathroom, powder room, or restroom' },
  { code: 'MASTER_BATHROOM', name: 'Master Bathroom', description: 'Ensuite master bathroom' },
  { code: 'HOME_OFFICE', name: 'Home Office', description: 'Work-from-home study or office' },
  { code: 'GARAGE', name: 'Garage', description: 'Vehicle parking and workshop' },
  { code: 'HALLWAY', name: 'Hallway', description: 'Corridor, foyer, or passage' },
  { code: 'LAUNDRY_ROOM', name: 'Laundry Room', description: 'Washing, drying, and utility space' },
  { code: 'BALCONY', name: 'Balcony', description: 'Outdoor balcony, terrace, or patio' },
  { code: 'STORAGE_ROOM', name: 'Storage Room', description: 'Closet, attic, or storage space' },
  { code: 'OTHER', name: 'Other Room', description: 'Custom architectural room space' },
  { code: 'UNKNOWN', name: 'Unknown', description: 'Unclassified room' },
];

export const OBJECT_CATEGORIES: CategoryOption[] = [
  // Smart Devices
  { code: 'SMART_AC', name: 'Smart Air Conditioner', group: 'Smart Devices', description: 'HVAC / Climate control unit' },
  { code: 'SMART_LIGHTING', name: 'Smart Lighting', group: 'Smart Devices', description: 'Smart lamp, ceiling fixture, or strip' },
  { code: 'SMART_DOOR_LOCK', name: 'Smart Door Lock', group: 'Smart Devices', description: 'Access control smart lock' },
  { code: 'SMART_SENSOR_TEMPERATURE', name: 'Smart Temperature Sensor', group: 'Smart Devices', description: 'Discrete physical sensor hardware' },
  { code: 'SMART_SENSOR_AIR_QUALITY', name: 'Smart Air Quality Sensor', group: 'Smart Devices', description: 'Discrete air quality / CO2 hardware' },
  { code: 'OTHER_SMART_DEVICE', name: 'Other Smart Device', group: 'Smart Devices', description: 'Miscellaneous smart appliance' },

  // Furniture
  { code: 'SOFA', name: 'Sofa / Couch', group: 'Furniture', description: 'Living room seating furniture' },
  { code: 'TABLE', name: 'Table / Desk', group: 'Furniture', description: 'Dining or work desk' },
  { code: 'CHAIR', name: 'Chair / Stool', group: 'Furniture', description: 'Single seat furniture' },
  { code: 'BED', name: 'Bed', group: 'Furniture', description: 'Mattress and bedframe' },
  { code: 'CABINET', name: 'Cabinet', group: 'Furniture', description: 'Storage cabinet or sideboard' },
  { code: 'WARDROBE', name: 'Wardrobe', group: 'Furniture', description: 'Clothing wardrobe or armoire' },
  { code: 'TV', name: 'Television', group: 'Furniture', description: 'Display screen or entertainment console' },
  { code: 'REFRIGERATOR', name: 'Refrigerator', group: 'Furniture', description: 'Kitchen fridge or freezer' },
  { code: 'OTHER_FURNITURE', name: 'Other Furniture', group: 'Furniture', description: 'Custom furniture piece' },

  // Building Components
  { code: 'DOOR', name: 'Door', group: 'Building Components', description: 'Hinged or sliding door' },
  { code: 'WINDOW', name: 'Window', group: 'Building Components', description: 'Glass window aperture' },
  { code: 'WALL', name: 'Wall', group: 'Building Components', description: 'Architectural structural or partition wall' },
  { code: 'FLOOR_SURFACE', name: 'Floor Surface', group: 'Building Components', description: 'Tiling, parquet, or floor slab' },
  { code: 'CEILING', name: 'Ceiling', group: 'Building Components', description: 'Overhead ceiling plane' },
  { code: 'STAIRCASE', name: 'Staircase', group: 'Building Components', description: 'Steps connecting floor levels' },
  { code: 'OTHER_BUILDING_COMPONENT', name: 'Other Component', group: 'Building Components', description: 'Pillar, beam, or architectural element' },

  // Other
  { code: 'DECORATION', name: 'Decoration', group: 'Other', description: 'Plant, rug, art, or decorative asset' },
  { code: 'UNKNOWN', name: 'Unknown', group: 'Other', description: 'Unclassified physical object' },
];

export const ANCHOR_CATEGORIES: CategoryOption[] = [
  { code: 'TEMPERATURE_HUMIDITY', name: 'Temperature & Humidity Sensor', description: 'Empty object designated for ambient climate sensors' },
  { code: 'AIR_QUALITY', name: 'Air Quality / Gas Sensor', description: 'Empty object designated for VOC / CO2 sensors' },
  { code: 'OTHER_SENSOR', name: 'Other Sensor Anchor', description: 'Empty object for beacon, presence, or custom sensor' },
  { code: 'UNKNOWN', name: 'Unknown Anchor', description: 'Unclassified empty spatial anchor' },
];

export function getCategoriesByNodeType(nodeType: IdentifiedNodeType): CategoryOption[] {
  switch (nodeType) {
    case 'ROOM':
      return ROOM_CATEGORIES;
    case 'OBJECT':
      return OBJECT_CATEGORIES;
    case 'ANCHOR':
      return ANCHOR_CATEGORIES;
    default:
      return [];
  }
}

export function getCategoryDisplayName(categoryCode: string): string {
  const all = [...ROOM_CATEGORIES, ...OBJECT_CATEGORIES, ...ANCHOR_CATEGORIES];
  const found = all.find((c) => c.code === categoryCode);
  return found?.name || categoryCode;
}

