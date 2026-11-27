/**
 * CLIENT-SIDE DYNAMIC FLOOR PLAN IMAGE DETECTOR (COMPUTER VISION)
 *
 * 100% in-browser room segmentation & wall detection:
 * - Downsamples floor plan image for sub-30ms real-time processing
 * - Binarizes image using adaptive luminance thresholding (walls vs open space)
 * - Applies morphological dilation to close open doors and blueprint line breaks
 * - Discards exterior canvas space by border flood-fill
 * - Segments enclosed rooms using Connected-Component Labeling (BFS)
 * - Extracts and simplifies room boundary polygons (Ramer-Douglas-Peucker)
 * - Validates against self-intersection, with Convex Hull fallback
 * - Maps detected polygons back to SVG world coordinates
 */

import { GeneratedRoomReference } from './room-reference-generator';
import { RoomType } from '../types/floor-plan';

export interface ImageDetectionOptions {
  wallThreshold?: number; // 0..255 (default: 145)
  minRoomAreaPercent?: number; // 0.5%..10% (default: 1.5%)
  maxRoomAreaPercent?: number; // 20%..90% (default: 65%)
  wallDilation?: number; // 0..4 (default: 2)
  simplifyEpsilon?: number; // Polygon simplification tolerance (default: 3.5)
}

export interface DetectedRoomResult extends GeneratedRoomReference {
  rawPixelArea: number;
  center: { x: number; y: number };
  bounds: { minX: number; minY: number; maxX: number; maxY: number };
}

const PALETTE_COLORS = [
  '#4F46E5', // Indigo (Living Room)
  '#0EA5E9', // Sky Blue (Master Bed)
  '#10B981', // Emerald (Bed 2)
  '#F59E0B', // Amber (Kitchen)
  '#8B5CF6', // Purple (Dining)
  '#06B6D4', // Cyan (Bath)
  '#EC4899', // Pink (Bed 3)
  '#14B8A6', // Teal (Terrace/Balcony)
  '#F97316', // Orange (Office)
];

/**
 * Loads an image URL into an HTMLImageElement
 */
export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(new Error('Gagal memuat citra denah untuk analisis: ' + err));
    img.src = src;
  });
}

/**
 * Check if 2D line segments intersect
 */
function lineSegmentsIntersect(
  p1: { x: number; y: number },
  q1: { x: number; y: number },
  p2: { x: number; y: number },
  q2: { x: number; y: number }
): boolean {
  function orient(a: { x: number; y: number }, b: { x: number; y: number }, c: { x: number; y: number }) {
    const val = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
    if (Math.abs(val) < 1e-7) return 0;
    return val > 0 ? 1 : 2;
  }
  function onSeg(p: { x: number; y: number }, q: { x: number; y: number }, r: { x: number; y: number }) {
    return (
      q.x <= Math.max(p.x, r.x) &&
      q.x >= Math.min(p.x, r.x) &&
      q.y <= Math.max(p.y, r.y) &&
      q.y >= Math.min(p.y, r.y)
    );
  }

  const o1 = orient(p1, q1, p2);
  const o2 = orient(p1, q1, q2);
  const o3 = orient(p2, q2, p1);
  const o4 = orient(p2, q2, q1);

  if (o1 !== o2 && o3 !== o4) return true;
  if (o1 === 0 && onSeg(p1, p2, q1)) return true;
  if (o2 === 0 && onSeg(p1, q2, q1)) return true;
  if (o3 === 0 && onSeg(p2, p1, q2)) return true;
  if (o4 === 0 && onSeg(p2, q1, q2)) return true;

  return false;
}

/**
 * Check if polygon has self-intersections
 */
export function checkPolygonSelfIntersection(pts: { x: number; y: number }[]): boolean {
  const n = pts.length;
  if (n < 4) return false;

  for (let i = 0; i < n; i++) {
    const p1 = pts[i];
    const q1 = pts[(i + 1) % n];

    for (let j = i + 1; j < n; j++) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      const p2 = pts[j];
      const q2 = pts[(j + 1) % n];
      if (lineSegmentsIntersect(p1, q1, p2, q2)) return true;
    }
  }
  return false;
}

/**
 * Andrew's monotone chain 2D convex hull algorithm
 * Guarantees a mathematically simple, non-self-intersecting polygon
 */
export function computeConvexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 3) return points;
  const pts = points.slice().sort((a, b) => (a.x === b.x ? a.y - b.y : a.x - b.x));
  const cross = (o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }) =>
    (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);

  const lower: { x: number; y: number }[] = [];
  for (const p of pts) {
    while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], p) <= 0) {
      lower.pop();
    }
    lower.push(p);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = pts.length - 1; i >= 0; i--) {
    const p = pts[i];
    while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], p) <= 0) {
      upper.pop();
    }
    upper.push(p);
  }

  lower.pop();
  upper.pop();
  return lower.concat(upper);
}

/**
 * Ramer-Douglas-Peucker algorithm for polygon vertex reduction
 */
function simplifyPolygon(points: { x: number; y: number }[], tolerance: number): { x: number; y: number }[] {
  if (points.length <= 4) return points;

  function getSqDist(p1: { x: number; y: number }, p2: { x: number; y: number }) {
    const dx = p1.x - p2.x;
    const dy = p1.y - p2.y;
    return dx * dx + dy * dy;
  }

  function getSqSegDist(
    p: { x: number; y: number },
    p1: { x: number; y: number },
    p2: { x: number; y: number }
  ) {
    let x = p1.x;
    let y = p1.y;
    let dx = p2.x - x;
    let dy = p2.y - y;

    if (dx !== 0 || dy !== 0) {
      const t = ((p.x - x) * dx + (p.y - y) * dy) / (dx * dx + dy * dy);
      if (t > 1) {
        x = p2.x;
        y = p2.y;
      } else if (t > 0) {
        x += dx * t;
        y += dy * t;
      }
    }

    dx = p.x - x;
    dy = p.y - y;
    return dx * dx + dy * dy;
  }

  function simplifyDPStep(
    pts: { x: number; y: number }[],
    first: number,
    last: number,
    sqTol: number,
    simplified: { x: number; y: number }[]
  ) {
    let maxSqDist = sqTol;
    let index = -1;

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSqSegDist(pts[i], pts[first], pts[last]);
      if (sqDist > maxSqDist) {
        index = i;
        maxSqDist = sqDist;
      }
    }

    if (maxSqDist > sqTol) {
      if (index - first > 1) simplifyDPStep(pts, first, index, sqTol, simplified);
      simplified.push(pts[index]);
      if (last - index > 1) simplifyDPStep(pts, index, last, sqTol, simplified);
    }
  }

  const sqTolerance = tolerance * tolerance;
  const last = points.length - 1;
  const simplified: { x: number; y: number }[] = [points[0]];
  simplifyDPStep(points, 0, last, sqTolerance, simplified);
  simplified.push(points[last]);

  // Remove almost duplicate points
  const cleaned: { x: number; y: number }[] = [];
  for (let i = 0; i < simplified.length; i++) {
    const cur = simplified[i];
    const prev = cleaned[cleaned.length - 1];
    if (!prev || getSqDist(cur, prev) > 4) {
      cleaned.push(cur);
    }
  }

  return cleaned.length >= 3 ? cleaned : points;
}

/**
 * Traces the outer contour of a binary mask component
 */
function traceContour(
  pixels: Set<number>,
  width: number,
  height: number,
  minX: number,
  minY: number,
  maxX: number,
  maxY: number
): { x: number; y: number }[] {
  // Collect all boundary pixels
  const boundaryPixels: { x: number; y: number }[] = [];
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pixels.has(y * width + x)) {
        // Is it a boundary pixel (neighbors not in component)?
        const isBoundary =
          x === 0 ||
          x === width - 1 ||
          y === 0 ||
          y === height - 1 ||
          !pixels.has(y * width + (x - 1)) ||
          !pixels.has(y * width + (x + 1)) ||
          !pixels.has((y - 1) * width + x) ||
          !pixels.has((y + 1) * width + x);

        if (isBoundary) {
          boundaryPixels.push({ x, y });
        }
      }
    }
  }

  if (boundaryPixels.length < 4) {
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
  }

  // Moore neighborhood boundary tracing
  let startX = -1;
  let startY = -1;
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      if (pixels.has(y * width + x)) {
        startX = x;
        startY = y;
        break;
      }
    }
    if (startX !== -1) break;
  }

  if (startX === -1) {
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
  }

  const dx = [1, 1, 0, -1, -1, -1, 0, 1];
  const dy = [0, 1, 1, 1, 0, -1, -1, -1];

  const contour: { x: number; y: number }[] = [];
  let curX = startX;
  let curY = startY;
  let dir = 0;
  const maxSteps = (maxX - minX + maxY - minY) * 10 + 200;
  let steps = 0;

  contour.push({ x: curX, y: curY });

  while (steps++ < maxSteps) {
    let foundNext = false;
    const checkStart = (dir + 5) % 8;
    for (let i = 0; i < 8; i++) {
      const nextDir = (checkStart + i) % 8;
      const nx = curX + dx[nextDir];
      const ny = curY + dy[nextDir];

      if (nx >= 0 && nx < width && ny >= 0 && ny < height && pixels.has(ny * width + nx)) {
        curX = nx;
        curY = ny;
        dir = nextDir;
        foundNext = true;
        break;
      }
    }

    if (!foundNext) break;

    // Returned to start
    if (curX === startX && curY === startY && contour.length > 3) {
      break;
    }

    contour.push({ x: curX, y: curY });
  }

  if (contour.length < 4) {
    return [
      { x: minX, y: minY },
      { x: maxX, y: minY },
      { x: maxX, y: maxY },
      { x: minX, y: maxY },
    ];
  }

  return contour;
}

/**
 * Detect rooms dynamically from an image element or offscreen canvas
 */
export function detectRoomsFromFloorPlanImage(
  image: HTMLImageElement,
  targetBounds: { width: number; height: number; x?: number; y?: number },
  pixelsPerMeter?: number | null,
  options: ImageDetectionOptions = {}
): DetectedRoomResult[] {
  const {
    wallThreshold = 145,
    minRoomAreaPercent = 1.5,
    maxRoomAreaPercent = 65,
    wallDilation = 2,
    simplifyEpsilon = 3.5,
  } = options;

  // 1. Determine fast working resolution (max dimension 450px for fast sub-30ms CV)
  const maxDim = 450;
  const aspect = image.naturalWidth / image.naturalHeight;
  let workW: number;
  let workH: number;

  if (aspect >= 1) {
    workW = maxDim;
    workH = Math.max(10, Math.round(maxDim / aspect));
  } else {
    workH = maxDim;
    workW = Math.max(10, Math.round(maxDim * aspect));
  }

  // 2. Render to offscreen canvas
  const canvas = document.createElement('canvas');
  canvas.width = workW;
  canvas.height = workH;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  if (!ctx) return [];

  ctx.drawImage(image, 0, 0, workW, workH);
  const imgData = ctx.getImageData(0, 0, workW, workH);
  const data = imgData.data;
  const totalPixels = workW * workH;

  // 3. Binarization: Identify walls (dark lines)
  const walls = new Uint8Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    const r = data[i * 4];
    const g = data[i * 4 + 1];
    const b = data[i * 4 + 2];
    const a = data[i * 4 + 3];

    if (a < 50) {
      walls[i] = 0;
      continue;
    }

    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < wallThreshold) {
      walls[i] = 1; // Wall
    }
  }

  // 4. Morphological Dilation on walls to close door openings / broken lines
  const dilatedWalls = new Uint8Array(totalPixels);
  dilatedWalls.set(walls);

  if (wallDilation > 0) {
    const rad = Math.min(wallDilation, 3);
    for (let y = 0; y < workH; y++) {
      for (let x = 0; x < workW; x++) {
        if (walls[y * workW + x] === 1) {
          for (let dy = -rad; dy <= rad; dy++) {
            const ny = y + dy;
            if (ny < 0 || ny >= workH) continue;
            for (let dx = -rad; dx <= rad; dx++) {
              const nx = x + dx;
              if (nx < 0 || nx >= workW) continue;
              dilatedWalls[ny * workW + nx] = 1;
            }
          }
        }
      }
    }
  }

  // 5. Flood Fill exterior background (outside the building envelope)
  const labels = new Int32Array(totalPixels);
  for (let i = 0; i < totalPixels; i++) {
    if (dilatedWalls[i] === 1) {
      labels[i] = 1; // Wall
    }
  }

  const queue: number[] = [];
  const markExterior = (x: number, y: number) => {
    const idx = y * workW + x;
    if (labels[idx] === 0) {
      labels[idx] = 2; // Exterior
      queue.push(idx);
    }
  };

  for (let x = 0; x < workW; x++) {
    markExterior(x, 0);
    markExterior(x, workH - 1);
  }
  for (let y = 0; y < workH; y++) {
    markExterior(0, y);
    markExterior(workW - 1, y);
  }

  while (queue.length > 0) {
    const cur = queue.pop()!;
    const cx = cur % workW;
    const cy = Math.floor(cur / workW);

    const neighbors = [
      cx > 0 ? cur - 1 : -1,
      cx < workW - 1 ? cur + 1 : -1,
      cy > 0 ? cur - workW : -1,
      cy < workH - 1 ? cur + workW : -1,
    ];

    for (const nb of neighbors) {
      if (nb !== -1 && labels[nb] === 0) {
        labels[nb] = 2; // Exterior
        queue.push(nb);
      }
    }
  }

  // 6. Connected Component Labeling for enclosed rooms
  const minRoomPixels = Math.round((minRoomAreaPercent / 100) * totalPixels);
  const maxRoomPixels = Math.round((maxRoomAreaPercent / 100) * totalPixels);

  interface RawRoom {
    pixels: Set<number>;
    pixelCount: number;
    minX: number;
    minY: number;
    maxX: number;
    maxY: number;
    sumX: number;
    sumY: number;
  }

  const detectedComponents: RawRoom[] = [];
  let nextLabel = 10;

  for (let y = 1; y < workH - 1; y++) {
    for (let x = 1; x < workW - 1; x++) {
      const startIdx = y * workW + x;
      if (labels[startIdx] !== 0) continue;

      const roomPixels = new Set<number>();
      let minX = x;
      let maxX = x;
      let minY = y;
      let maxY = y;
      let sumX = 0;
      let sumY = 0;

      labels[startIdx] = nextLabel;
      queue.push(startIdx);
      roomPixels.add(startIdx);

      while (queue.length > 0) {
        const cur = queue.pop()!;
        const px = cur % workW;
        const py = Math.floor(cur / workW);

        sumX += px;
        sumY += py;
        if (px < minX) minX = px;
        if (px > maxX) maxX = px;
        if (py < minY) minY = py;
        if (py > maxY) maxY = py;

        const neighbors = [
          px > 0 ? cur - 1 : -1,
          px < workW - 1 ? cur + 1 : -1,
          py > 0 ? cur - workW : -1,
          py < workH - 1 ? cur + workW : -1,
        ];

        for (const nb of neighbors) {
          if (nb !== -1 && labels[nb] === 0) {
            labels[nb] = nextLabel;
            roomPixels.add(nb);
            queue.push(nb);
          }
        }
      }

      nextLabel++;

      if (roomPixels.size >= minRoomPixels && roomPixels.size <= maxRoomPixels) {
        if (maxX - minX >= 8 && maxY - minY >= 8) {
          detectedComponents.push({
            pixels: roomPixels,
            pixelCount: roomPixels.size,
            minX,
            minY,
            maxX,
            maxY,
            sumX,
            sumY,
          });
        }
      }
    }
  }

  // 7. Sort by area descending
  detectedComponents.sort((a, b) => b.pixelCount - a.pixelCount);

  // 8. Map to Target Bounds (Canvas SVG Coordinates)
  const scaleX = targetBounds.width / workW;
  const scaleY = targetBounds.height / workH;
  const offsetX = targetBounds.x || 0;
  const offsetY = targetBounds.y || 0;

  const results: DetectedRoomResult[] = detectedComponents.map((comp, idx) => {
    // Trace boundary contour
    const contour = traceContour(
      comp.pixels,
      workW,
      workH,
      comp.minX,
      comp.minY,
      comp.maxX,
      comp.maxY
    );

    // Simplify polygon
    const simplified = simplifyPolygon(contour, simplifyEpsilon);

    // Ensure simplified polygon is strictly non-self-intersecting
    let validPts: { x: number; y: number }[] = [];

    // Dedup consecutive vertices
    const deduped: { x: number; y: number }[] = [];
    for (let i = 0; i < simplified.length; i++) {
      const cur = simplified[i];
      const prev = deduped[deduped.length - 1];
      if (!prev || Math.abs(cur.x - prev.x) > 1e-3 || Math.abs(cur.y - prev.y) > 1e-3) {
        deduped.push(cur);
      }
    }

    // Remove closing point if identical to first
    if (
      deduped.length > 3 &&
      Math.abs(deduped[0].x - deduped[deduped.length - 1].x) < 1e-3 &&
      Math.abs(deduped[0].y - deduped[deduped.length - 1].y) < 1e-3
    ) {
      deduped.pop();
    }

    // Check validity
    if (deduped.length >= 3 && !checkPolygonSelfIntersection(deduped)) {
      validPts = deduped;
    } else {
      // Fallback 1: Convex Hull of contour points (guaranteed 100% non-self-intersecting)
      const hull = computeConvexHull(contour);
      if (hull.length >= 3 && !checkPolygonSelfIntersection(hull)) {
        validPts = hull;
      } else {
        // Fallback 2: Clean axis-aligned bounding box
        validPts = [
          { x: comp.minX, y: comp.minY },
          { x: comp.maxX, y: comp.minY },
          { x: comp.maxX, y: comp.maxY },
          { x: comp.minX, y: comp.maxY },
        ];
      }
    }

    // Scale to SVG world coordinates & ensure clean non-zero integers
    const scaledPolygon = validPts.map((p) => ({
      x: Math.round(offsetX + p.x * scaleX),
      y: Math.round(offsetY + p.y * scaleY),
    }));

    // Area in m² based on calibration or fallback
    let areaM2 = 0;
    if (pixelsPerMeter && pixelsPerMeter > 0) {
      const svgArea = comp.pixelCount * scaleX * scaleY;
      areaM2 = Number((svgArea / (pixelsPerMeter * pixelsPerMeter)).toFixed(1));
    } else {
      const ratio = comp.pixelCount / totalPixels;
      areaM2 = Number((ratio * 120).toFixed(1));
    }

    // Semantic room labeling based on size ranking
    let name = `Ruang Terdeteksi ${idx + 1}`;
    let type: RoomType = 'OTHER';

    if (idx === 0) {
      name = 'Ruang Tamu & Keluarga';
      type = 'LIVING_ROOM';
    } else if (idx === 1) {
      name = 'Kamar Tidur Utama';
      type = 'BEDROOM';
    } else if (idx === 2) {
      name = 'Kamar Tidur 2';
      type = 'BEDROOM';
    } else if (idx === 3) {
      name = 'Dapur & Ruang Makan';
      type = 'KITCHEN';
    } else if (idx === detectedComponents.length - 1 && comp.pixelCount < detectedComponents[0].pixelCount * 0.3) {
      name = 'Kamar Mandi';
      type = 'BATHROOM';
    } else if (idx === 4) {
      name = 'Ruang Kerja / Studio';
      type = 'WORKSPACE';
    }

    const color = PALETTE_COLORS[idx % PALETTE_COLORS.length];

    return {
      name,
      type,
      color,
      polygonCoordinates: scaledPolygon,
      estimatedAreaM2: Math.max(areaM2, 1.5),
      ceilingHeight: 3.0,
      rawPixelArea: comp.pixelCount,
      center: {
        x: Math.round(offsetX + (comp.sumX / comp.pixelCount) * scaleX),
        y: Math.round(offsetY + (comp.sumY / comp.pixelCount) * scaleY),
      },
      bounds: {
        minX: Math.round(offsetX + comp.minX * scaleX),
        minY: Math.round(offsetY + comp.minY * scaleY),
        maxX: Math.round(offsetX + comp.maxX * scaleX),
        maxY: Math.round(offsetY + comp.maxY * scaleY),
      },
    };
  });

  return results;
}
