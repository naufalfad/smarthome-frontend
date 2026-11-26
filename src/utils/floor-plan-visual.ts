/**
 * Floor Plan Visual Transformation Utilities
 * Computes SVG image transforms for 0, 90, 180, and 270 degree orientations
 */

export interface FloorPlanImageTransform {
  transform: string;
  renderWidth: number;
  renderHeight: number;
}

export function getFloorPlanImageTransform(
  rotation: number = 0,
  currentW: number = 1600,
  currentH: number = 1000
): FloorPlanImageTransform {
  const rot = ((rotation % 360) + 360) % 360;

  if (rot === 90) {
    // When rotated 90° clockwise:
    // Canvas dimensions are currentW (origH) x currentH (origW)
    // Raw image has width = currentH, height = currentW
    return {
      transform: `translate(${currentW}, 0) rotate(90)`,
      renderWidth: currentH,
      renderHeight: currentW,
    };
  }

  if (rot === 180) {
    // When rotated 180°:
    // Canvas dimensions are currentW x currentH
    return {
      transform: `translate(${currentW}, ${currentH}) rotate(180)`,
      renderWidth: currentW,
      renderHeight: currentH,
    };
  }

  if (rot === 270) {
    // When rotated 270° (or -90°):
    // Canvas dimensions are currentW (origH) x currentH (origW)
    return {
      transform: `translate(0, ${currentH}) rotate(270)`,
      renderWidth: currentH,
      renderHeight: currentW,
    };
  }

  // Default: 0 degrees
  return {
    transform: '',
    renderWidth: currentW,
    renderHeight: currentH,
  };
}
