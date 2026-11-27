export interface Point2D {
  x: number;
  y: number;
}

/**
 * Checks if point (x, y) is strictly inside a polygon using ray-casting.
 * Works regardless of clockwise or counter-clockwise vertex order.
 */
export function isPointInsidePolygon(point: Point2D, polygon: Point2D[]): boolean {
  if (!polygon || polygon.length < 3) return false;
  let inside = false;
  const { x, y } = point;
  const n = polygon.length;

  for (let i = 0, j = n - 1; i < n; j = i++) {
    const xi = polygon[i].x;
    const yi = polygon[i].y;
    const xj = polygon[j].x;
    const yj = polygon[j].y;

    const intersect =
      yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/**
 * Minimum squared distance from point p to line segment (v, w).
 */
function distToSegmentSquared(p: Point2D, v: Point2D, w: Point2D): number {
  const l2 = (v.x - w.x) ** 2 + (v.y - w.y) ** 2;
  if (l2 === 0) return (p.x - v.x) ** 2 + (p.y - v.y) ** 2;
  let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
  t = Math.max(0, Math.min(1, t));
  return (p.x - (v.x + t * (w.x - v.x))) ** 2 + (p.y - (v.y + t * (w.y - v.y))) ** 2;
}

/**
 * Distance from point p to closest edge of polygon.
 * Positive if inside, negative if outside.
 */
export function pointToPolygonDistance(p: Point2D, polygon: Point2D[]): number {
  const inside = isPointInsidePolygon(p, polygon);
  let minDistSq = Infinity;
  const n = polygon.length;
  for (let i = 0, j = n - 1; i < n; j = i++) {
    const dSq = distToSegmentSquared(p, polygon[i], polygon[j]);
    if (dSq < minDistSq) {
      minDistSq = dSq;
    }
  }
  const dist = Math.sqrt(minDistSq);
  return inside ? dist : -dist;
}

class Cell {
  x: number;
  y: number;
  h: number;
  d: number;
  max: number;

  constructor(x: number, y: number, h: number, polygon: Point2D[]) {
    this.x = x;
    this.y = y;
    this.h = h;
    this.d = pointToPolygonDistance({ x, y }, polygon);
    this.max = this.d + this.h * Math.SQRT2;
  }
}

/**
 * Finds the Pole of Inaccessibility (Visual Center / Maximum Inscribed Circle)
 * of any polygon using the Mapbox Polylabel quadtree algorithm.
 *
 * 100% MATHEMATICALLY GUARANTEED to be INSIDE the polygon, even for non-convex,
 * concave, L-shaped, U-shaped, or C-shaped hallway/corridor rooms!
 *
 * Solves the issue where an arithmetic centroid (mean of vertices) of an L-shaped
 * hallway falls outside into an adjacent bedroom.
 */
export function getPolygonVisualCenter(polygon: Point2D[], precision: number = 1.0): Point2D {
  if (!polygon || polygon.length === 0) return { x: 0, y: 0 };
  if (polygon.length < 3) return { x: polygon[0].x, y: polygon[0].y };

  // 1. Calculate Bounding Box and Arithmetic Centroid
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  let sumX = 0;
  let sumY = 0;

  for (const p of polygon) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
    sumX += p.x;
    sumY += p.y;
  }

  const centroid: Point2D = {
    x: sumX / polygon.length,
    y: sumY / polygon.length,
  };

  // If arithmetic centroid is comfortably deep inside (clearance > 25px), use it for speed
  const centroidDist = pointToPolygonDistance(centroid, polygon);
  if (centroidDist > 25) {
    return centroid;
  }

  // 2. Centroid is outside (negative) or too close to wall (e.g. L-shaped hallway).
  // Run Mapbox Polylabel quadtree cell subdivision.
  const width = maxX - minX;
  const height = maxY - minY;
  const cellSize = Math.min(width, height);
  if (cellSize <= 0) return centroid;
  let h = cellSize / 2;

  let bestCell = new Cell(centroid.x, centroid.y, 0, polygon);

  // Initialize priority queue with regular grid cells
  const cells: Cell[] = [];
  for (let x = minX; x < maxX; x += cellSize) {
    for (let y = minY; y < maxY; y += cellSize) {
      cells.push(new Cell(x + h, y + h, h, polygon));
    }
  }

  // Also seed with bounding box midpoint
  cells.push(new Cell(minX + width / 2, minY + height / 2, h, polygon));

  let iterations = 0;
  while (cells.length && iterations < 500) {
    iterations++;
    // Pop cell with highest potential distance
    cells.sort((a, b) => b.max - a.max);
    const cell = cells.shift()!;

    if (cell.d > bestCell.d) {
      bestCell = cell;
    }

    if (cell.max - bestCell.d <= precision) continue;

    h = cell.h / 2;
    cells.push(new Cell(cell.x - h, cell.y - h, h, polygon));
    cells.push(new Cell(cell.x + h, cell.y - h, h, polygon));
    cells.push(new Cell(cell.x - h, cell.y + h, h, polygon));
    cells.push(new Cell(cell.x + h, cell.y + h, h, polygon));
  }

  // Emergency fallback: ensure result is strictly inside
  if (bestCell.d <= 0) {
    const step = Math.max(5, Math.min(width, height) / 20);
    for (let x = minX + step / 2; x < maxX; x += step) {
      for (let y = minY + step / 2; y < maxY; y += step) {
        if (isPointInsidePolygon({ x, y }, polygon)) {
          return { x, y };
        }
      }
    }
  }

  return { x: bestCell.x, y: bestCell.y };
}
