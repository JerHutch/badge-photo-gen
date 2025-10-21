/**
 * Art style presets and prompt templates
 * Based on ART_STYLES.md
 */

import { StylePreset } from '../types';

export const STYLE_PRESETS: Record<string, StylePreset> = {
  bitmoji: {
    name: 'bitmoji',
    description: 'Flat colors, simplified features, friendly and approachable style',
    promptTemplate:
      'Professional headshot portrait in Bitmoji style, flat colors, simplified cartoon features, friendly expression, head and shoulders visible, white background, suitable for employee badge',
  },
  pixar: {
    name: 'pixar',
    description: '3D-rendered cartoon with expressive features',
    promptTemplate:
      'Professional headshot portrait in Pixar 3D animation style, expressive features, high-quality 3D rendering, friendly expression, head and shoulders visible, white background, suitable for employee badge',
  },
  corporate: {
    name: 'corporate',
    description: 'Professional caricature, business-appropriate',
    promptTemplate:
      'Professional headshot portrait as business caricature, polished and clean, professional attire, subtle stylization, head and shoulders visible, neutral background, suitable for corporate employee badge',
  },
  'vector-art': {
    name: 'vector-art',
    description: 'Clean vector illustration with geometric shapes',
    promptTemplate:
      'Professional headshot portrait as vector art illustration, clean lines, geometric shapes, modern flat design, professional expression, head and shoulders visible, solid background, suitable for employee badge',
  },
  anime: {
    name: 'anime',
    description: 'Japanese animation style portrait',
    promptTemplate:
      'Professional headshot portrait in anime style, clean anime character design, professional expression, head and shoulders visible, white background, suitable for employee badge',
  },
  'pixel-art': {
    name: 'pixel-art',
    description: 'Retro 8-bit/16-bit video game sprite style',
    promptTemplate:
      'Professional headshot portrait in pixel art style, 16-bit video game character sprite, retro gaming aesthetic, head and shoulders visible, solid background, suitable for employee badge',
  },
};

export function getStylePreset(styleName: string): StylePreset {
  const preset = STYLE_PRESETS[styleName];
  if (!preset) {
    throw new Error(
      `Unknown style: ${styleName}. Available styles: ${Object.keys(STYLE_PRESETS).join(', ')}`
    );
  }
  return preset;
}

export function listStyles(): string[] {
  return Object.keys(STYLE_PRESETS);
}
