/**
 * Dimension utilities
 * Handles randomization and snapping to supported sizes
 */

import { Dimension } from '../types';

export function parseDimension(sizeStr: string): Dimension {
  const [width, height] = sizeStr.split('x').map(Number);
  if (!width || !height) {
    throw new Error(`Invalid dimension format: ${sizeStr}. Expected format: WxH (e.g., 900x800)`);
  }
  return { width, height };
}

export function randomizeDimensions(
  minSize: string,
  maxSize: string,
  supportedDimensions: Dimension[]
): Dimension {
  const min = parseDimension(minSize);
  const max = parseDimension(maxSize);

  // Generate random dimensions within bounds
  const randomWidth = Math.floor(Math.random() * (max.width - min.width + 1)) + min.width;
  const randomHeight = Math.floor(Math.random() * (max.height - min.height + 1)) + min.height;

  // Find closest supported dimension (portrait-oriented)
  const portraitDimensions = supportedDimensions.filter(d => d.height >= d.width);

  if (portraitDimensions.length === 0) {
    // Fallback to square if no portrait options
    return supportedDimensions[0] || { width: 1024, height: 1024 };
  }

  // Find closest match by area
  const targetArea = randomWidth * randomHeight;
  const closest = portraitDimensions.reduce((prev, curr) => {
    const prevDiff = Math.abs(prev.width * prev.height - targetArea);
    const currDiff = Math.abs(curr.width * curr.height - targetArea);
    return currDiff < prevDiff ? curr : prev;
  });

  return closest;
}
