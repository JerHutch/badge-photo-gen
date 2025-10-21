/**
 * Unit tests for dimension utilities
 */

import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest';
import { parseDimension, randomizeDimensions } from './dimensions';
import { Dimension } from '../types';

describe('parseDimension', () => {
  test('correctly parses "WxH" format', () => {
    const result = parseDimension('900x800');

    expect(result).toEqual({
      width: 900,
      height: 800,
    });
  });

  test('parses different dimension values', () => {
    expect(parseDimension('1024x1024')).toEqual({ width: 1024, height: 1024 });
    expect(parseDimension('512x768')).toEqual({ width: 512, height: 768 });
    expect(parseDimension('1920x1080')).toEqual({ width: 1920, height: 1080 });
    expect(parseDimension('100x200')).toEqual({ width: 100, height: 200 });
  });

  test('throws on invalid format - missing height', () => {
    expect(() => parseDimension('900x')).toThrow(
      'Invalid dimension format: 900x. Expected format: WxH (e.g., 900x800)'
    );
  });

  test('throws on invalid format - missing width', () => {
    expect(() => parseDimension('x800')).toThrow(
      'Invalid dimension format: x800. Expected format: WxH (e.g., 900x800)'
    );
  });

  test('throws on invalid format - no separator', () => {
    expect(() => parseDimension('900800')).toThrow(
      'Invalid dimension format: 900800. Expected format: WxH (e.g., 900x800)'
    );
  });

  test('throws on invalid format - non-numeric values', () => {
    expect(() => parseDimension('abcxdef')).toThrow(
      'Invalid dimension format: abcxdef. Expected format: WxH (e.g., 900x800)'
    );
  });

  test('throws on empty string', () => {
    expect(() => parseDimension('')).toThrow(
      'Invalid dimension format: . Expected format: WxH (e.g., 900x800)'
    );
  });
});

describe('randomizeDimensions', () => {
  beforeEach(() => {
    vi.spyOn(Math, 'random');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('returns dimensions within bounds', () => {
    const supportedDimensions: Dimension[] = [
      { width: 512, height: 768 },
      { width: 768, height: 768 },
      { width: 1024, height: 1024 },
    ];

    // Test multiple times to ensure consistency
    for (let i = 0; i < 10; i++) {
      const result = randomizeDimensions('500x500', '1100x1100', supportedDimensions);

      // Result should be one of the supported dimensions
      const isSupported = supportedDimensions.some(
        (dim) => dim.width === result.width && dim.height === result.height
      );
      expect(isSupported).toBe(true);
    }
  });

  test('selects from supported dimensions', () => {
    const supportedDimensions: Dimension[] = [
      { width: 512, height: 768 },
      { width: 768, height: 1024 },
      { width: 1024, height: 1536 },
    ];

    const result = randomizeDimensions('600x700', '1000x1200', supportedDimensions);

    // Result must be one of the supported dimensions
    const isSupported = supportedDimensions.some(
      (dim) => dim.width === result.width && dim.height === result.height
    );
    expect(isSupported).toBe(true);
  });

  test('portrait orientation preference', () => {
    const supportedDimensions: Dimension[] = [
      { width: 1024, height: 768 }, // landscape
      { width: 768, height: 1024 }, // portrait
      { width: 512, height: 768 }, // portrait
      { width: 1024, height: 1024 }, // square
    ];

    // Test multiple times
    for (let i = 0; i < 10; i++) {
      const result = randomizeDimensions('500x500', '1100x1100', supportedDimensions);

      // Result should be portrait (height >= width)
      expect(result.height).toBeGreaterThanOrEqual(result.width);

      // Result should not be the landscape option
      expect(result).not.toEqual({ width: 1024, height: 768 });
    }
  });

  test('finds closest match by area', () => {
    vi.mocked(Math.random).mockReturnValue(0.5); // Middle of range

    const supportedDimensions: Dimension[] = [
      { width: 512, height: 768 }, // area: 393,216
      { width: 768, height: 1024 }, // area: 786,432
      { width: 1024, height: 1536 }, // area: 1,572,864
    ];

    // Min: 600x800 (480,000), Max: 1000x1200 (1,200,000)
    // Random (0.5): 800x1000 (800,000)
    // Closest: 768x1024 (786,432)
    const result = randomizeDimensions('600x800', '1000x1200', supportedDimensions);

    expect(result).toEqual({ width: 768, height: 1024 });
  });

  test('handles single portrait dimension', () => {
    const supportedDimensions: Dimension[] = [{ width: 512, height: 768 }];

    const result = randomizeDimensions('400x600', '800x1000', supportedDimensions);

    expect(result).toEqual({ width: 512, height: 768 });
  });

  test('fallback to first dimension if no portrait options', () => {
    const supportedDimensions: Dimension[] = [
      { width: 1024, height: 768 }, // landscape
      { width: 1920, height: 1080 }, // landscape
    ];

    const result = randomizeDimensions('500x500', '1100x1100', supportedDimensions);

    // Should fallback to first dimension
    expect(result).toEqual({ width: 1024, height: 768 });
  });

  test('handles square dimensions', () => {
    const supportedDimensions: Dimension[] = [
      { width: 512, height: 512 }, // square (counts as portrait: height >= width)
      { width: 1024, height: 1024 }, // square (counts as portrait: height >= width)
    ];

    const result = randomizeDimensions('500x500', '1100x1100', supportedDimensions);

    // Result should be one of the squares
    const isSupported = supportedDimensions.some(
      (dim) => dim.width === result.width && dim.height === result.height
    );
    expect(isSupported).toBe(true);

    // Squares count as portrait
    expect(result.height).toBeGreaterThanOrEqual(result.width);
  });

  test('empty supported dimensions fallback', () => {
    const supportedDimensions: Dimension[] = [];

    const result = randomizeDimensions('500x500', '1100x1100', supportedDimensions);

    // Should fallback to default 1024x1024
    expect(result).toEqual({ width: 1024, height: 1024 });
  });

  test('random value at minimum boundary', () => {
    vi.mocked(Math.random).mockReturnValue(0); // Minimum

    const supportedDimensions: Dimension[] = [
      { width: 512, height: 768 },
      { width: 768, height: 1024 },
      { width: 1024, height: 1536 },
    ];

    const result = randomizeDimensions('600x800', '1000x1200', supportedDimensions);

    // Should pick the smallest portrait dimension
    expect(result).toEqual({ width: 512, height: 768 });
  });

  test('random value at maximum boundary', () => {
    vi.mocked(Math.random).mockReturnValue(0.999); // Nearly maximum

    const supportedDimensions: Dimension[] = [
      { width: 512, height: 768 },
      { width: 768, height: 1024 },
      { width: 1024, height: 1536 },
    ];

    const result = randomizeDimensions('600x800', '1000x1200', supportedDimensions);

    // Should pick the largest portrait dimension
    expect(result).toEqual({ width: 1024, height: 1536 });
  });
});
