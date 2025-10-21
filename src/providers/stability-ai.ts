/**
 * Stability AI provider implementation
 */

import axios from 'axios';
import { BaseImageProvider } from './base';
import { Dimension, ImageGenerationParams, ImageResult } from '../types';
import { logger } from '../utils/logger';

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
    const endpoint = `${this.baseUrl}/${this.engine}/text-to-image`;

    const requestBody = {
      text_prompts: [
        {
          text: params.prompt,
          weight: 1
        }
      ],
      cfg_scale: 7,
      height: params.height,
      width: params.width,
      samples: 1,
      steps: 30
    };

    try {
      const response = await axios.post(endpoint, requestBody, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      // Extract base64 encoded image data
      const base64Image = response.data.artifacts[0].base64;

    // For now, return a placeholder ImageResult
    // File saving will be handled by the batch generator
    const result: ImageResult = {
      id: `stability-${Date.now()}-${Math.random().toString(36).substring(7)}`,
      gender: 'male', // This will be determined by the batch generator
      path: '', // Will be set when file is saved
      dimensions: {
        width: params.width,
        height: params.height,
        requestedMin: `${params.width}x${params.height}`,
        requestedMax: `${params.width}x${params.height}`,
        actualAiSize: `${params.width}x${params.height}`
      },
      prompt: params.prompt,
      style: params.style,
      generatedAt: new Date().toISOString(),
      provider: this.name,
      model: this.engine
    };

      // Attach the base64 data to the result for later processing
      // We'll add this as a custom property that the batch generator can use
      (result as any).base64Data = base64Image;

      return result;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const statusCode = error.response?.status;
        const errorData = error.response?.data;
        throw new Error(
          `Stability AI API error (${statusCode}): ${JSON.stringify(errorData) || error.message}`
        );
      }
      throw error;
    }
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
