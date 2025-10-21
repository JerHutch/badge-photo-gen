/**
 * Stability AI provider implementation
 */

import axios from 'axios';
import { BaseImageProvider } from './base';
import { Dimension, ImageGenerationParams, ImageResult } from '../types';

export class StabilityAIProvider extends BaseImageProvider {
  name = 'stability-ai';
  private apiKey: string;
  private baseUrl = 'https://api.stability.ai/v1/generation';
  private engine = 'stable-diffusion-xl-1024-v1-0';

  constructor(apiKey: string) {
    super();
    this.apiKey = apiKey;
  }

  async generateImage(params: ImageGenerationParams): Promise<ImageResult> {
    // TODO: Implement Stability AI API call
    throw new Error('Not implemented yet');
  }

  estimateCost(count: number): number {
    // Conservative estimate: $0.01 per image
    return count * 0.01;
  }

  getSupportedDimensions(): Dimension[] {
    // Stability AI supported dimensions (portrait-oriented only)
    return [
      { width: 768, height: 1344 },
      { width: 640, height: 1536 },
      { width: 1024, height: 1024 }, // Square, but acceptable
    ];
  }
}
