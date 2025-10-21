/**
 * Unit tests for art style configuration
 */

import { describe, it, expect } from 'vitest';
import { getStylePreset, listStyles, STYLE_PRESETS } from './styles';
import { StylePreset } from '../types';

describe('getStylePreset()', () => {
  describe('valid style names', () => {
    it('should return correct preset for bitmoji style', () => {
      const preset = getStylePreset('bitmoji');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('bitmoji');
      expect(preset.description).toBe(
        'Flat colors, simplified features, friendly and approachable style'
      );
      expect(preset.promptTemplate).toContain('Bitmoji style');
    });

    it('should return correct preset for pixar style', () => {
      const preset = getStylePreset('pixar');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('pixar');
      expect(preset.description).toBe('3D-rendered cartoon with expressive features');
      expect(preset.promptTemplate).toContain('Pixar 3D animation style');
    });

    it('should return correct preset for corporate style', () => {
      const preset = getStylePreset('corporate');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('corporate');
      expect(preset.description).toBe('Professional caricature, business-appropriate');
      expect(preset.promptTemplate).toContain('business caricature');
    });

    it('should return correct preset for vector-art style', () => {
      const preset = getStylePreset('vector-art');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('vector-art');
      expect(preset.description).toBe('Clean vector illustration with geometric shapes');
      expect(preset.promptTemplate).toContain('vector art illustration');
    });

    it('should return correct preset for anime style', () => {
      const preset = getStylePreset('anime');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('anime');
      expect(preset.description).toBe('Japanese animation style portrait');
      expect(preset.promptTemplate).toContain('anime style');
    });

    it('should return correct preset for pixel-art style', () => {
      const preset = getStylePreset('pixel-art');
      expect(preset).toBeDefined();
      expect(preset.name).toBe('pixel-art');
      expect(preset.description).toBe('Retro 8-bit/16-bit video game sprite style');
      expect(preset.promptTemplate).toContain('pixel art style');
    });
  });

  describe('returned preset structure', () => {
    it('should have all required fields for each style', () => {
      const styleNames = ['bitmoji', 'pixar', 'corporate', 'vector-art', 'anime', 'pixel-art'];

      styleNames.forEach((styleName) => {
        const preset = getStylePreset(styleName);

        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('promptTemplate');

        expect(typeof preset.name).toBe('string');
        expect(typeof preset.description).toBe('string');
        expect(typeof preset.promptTemplate).toBe('string');

        expect(preset.name).toBe(styleName);
      });
    });

    it('should return non-empty prompt templates', () => {
      const styleNames = ['bitmoji', 'pixar', 'corporate', 'vector-art', 'anime', 'pixel-art'];

      styleNames.forEach((styleName) => {
        const preset = getStylePreset(styleName);
        expect(preset.promptTemplate.length).toBeGreaterThan(0);
      });
    });

    it('should return non-empty descriptions', () => {
      const styleNames = ['bitmoji', 'pixar', 'corporate', 'vector-art', 'anime', 'pixel-art'];

      styleNames.forEach((styleName) => {
        const preset = getStylePreset(styleName);
        expect(preset.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown style name', () => {
      expect(() => getStylePreset('unknown-style')).toThrow();
    });

    it('should throw error for empty style name', () => {
      expect(() => getStylePreset('')).toThrow();
    });

    it('should throw error for invalid style name', () => {
      expect(() => getStylePreset('notarealstyle')).toThrow();
    });

    it('should include style name in error message', () => {
      expect(() => getStylePreset('invalid')).toThrow(/invalid/);
    });

    it('should include available styles in error message', () => {
      try {
        getStylePreset('unknown-style');
      } catch (error) {
        expect((error as Error).message).toContain('Available styles:');
        expect((error as Error).message).toContain('bitmoji');
        expect((error as Error).message).toContain('pixar');
        expect((error as Error).message).toContain('corporate');
        expect((error as Error).message).toContain('vector-art');
        expect((error as Error).message).toContain('anime');
        expect((error as Error).message).toContain('pixel-art');
      }
    });
  });
});

describe('listStyles()', () => {
  it('should return an array', () => {
    const styles = listStyles();
    expect(Array.isArray(styles)).toBe(true);
  });

  it('should return array of all style names', () => {
    const styles = listStyles();
    expect(styles).toContain('bitmoji');
    expect(styles).toContain('pixar');
    expect(styles).toContain('corporate');
    expect(styles).toContain('vector-art');
    expect(styles).toContain('anime');
    expect(styles).toContain('pixel-art');
  });

  it('should include all 6 styles from ART_STYLES.md', () => {
    const styles = listStyles();
    const expectedStyles = ['bitmoji', 'pixar', 'corporate', 'vector-art', 'anime', 'pixel-art'];

    expectedStyles.forEach((style) => {
      expect(styles).toContain(style);
    });
  });

  it('should return correct count of 6 styles', () => {
    const styles = listStyles();
    expect(styles.length).toBe(6);
  });

  it('should return only string values', () => {
    const styles = listStyles();
    styles.forEach((style) => {
      expect(typeof style).toBe('string');
    });
  });
});

describe('STYLE_PRESETS', () => {
  describe('preset structure validation', () => {
    it('should have valid structure for each preset', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];

        expect(preset).toBeDefined();
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('promptTemplate');
      });
    });

    it('should have non-empty prompt templates', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        expect(preset.promptTemplate).toBeTruthy();
        expect(preset.promptTemplate.length).toBeGreaterThan(0);
      });
    });

    it('should have non-empty descriptions', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        expect(preset.description).toBeTruthy();
        expect(preset.description.length).toBeGreaterThan(0);
      });
    });

    it('should have matching name field and key', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        expect(preset.name).toBe(styleName);
      });
    });
  });

  describe('badge-related keywords in prompts', () => {
    it('should include "Professional headshot portrait" in all prompts', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        expect(preset.promptTemplate).toContain('Professional headshot portrait');
      });
    });

    it('should include "head and shoulders visible" in all prompts', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        expect(preset.promptTemplate).toContain('head and shoulders visible');
      });
    });

    it('should include "badge" keyword in all prompts', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        expect(preset.promptTemplate.toLowerCase()).toContain('badge');
      });
    });

    it('should include background specification in all prompts', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        const template = preset.promptTemplate.toLowerCase();
        const hasBackground =
          template.includes('white background') ||
          template.includes('neutral background') ||
          template.includes('solid background');
        expect(hasBackground).toBe(true);
      });
    });

    it('should include expression guidance in all prompts', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset = STYLE_PRESETS[styleName];
        const template = preset.promptTemplate.toLowerCase();
        const hasExpression =
          template.includes('expression') ||
          template.includes('friendly') ||
          template.includes('professional');
        expect(hasExpression).toBe(true);
      });
    });
  });

  describe('individual preset characteristics', () => {
    it('bitmoji preset should mention flat colors and simplified features', () => {
      const preset = STYLE_PRESETS.bitmoji;
      expect(preset.promptTemplate).toContain('flat colors');
      expect(preset.promptTemplate).toContain('simplified');
    });

    it('pixar preset should mention 3D rendering', () => {
      const preset = STYLE_PRESETS.pixar;
      expect(preset.promptTemplate).toContain('3D');
    });

    it('corporate preset should mention professional attire', () => {
      const preset = STYLE_PRESETS.corporate;
      expect(preset.promptTemplate).toContain('professional attire');
    });

    it('vector-art preset should mention geometric shapes and clean lines', () => {
      const preset = STYLE_PRESETS['vector-art'];
      expect(preset.promptTemplate).toContain('geometric shapes');
      expect(preset.promptTemplate).toContain('clean lines');
    });

    it('anime preset should mention anime character design', () => {
      const preset = STYLE_PRESETS.anime;
      expect(preset.promptTemplate).toContain('anime');
    });

    it('pixel-art preset should mention retro gaming', () => {
      const preset = STYLE_PRESETS['pixel-art'];
      const template = preset.promptTemplate.toLowerCase();
      expect(template.includes('pixel art') || template.includes('16-bit')).toBe(true);
    });
  });

  describe('TypeScript type compliance', () => {
    it('should match StylePreset interface', () => {
      const styleNames = Object.keys(STYLE_PRESETS);

      styleNames.forEach((styleName) => {
        const preset: StylePreset = STYLE_PRESETS[styleName];

        // TypeScript will catch type mismatches at compile time,
        // but we can do runtime checks too
        expect(typeof preset.name).toBe('string');
        expect(typeof preset.description).toBe('string');
        expect(typeof preset.promptTemplate).toBe('string');
      });
    });
  });
});
