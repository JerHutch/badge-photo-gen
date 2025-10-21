/**
 * Base provider interface
 * Allows for multiple AI image generation providers
 */

import { ImageProvider, Dimension, ImageGenerationParams, ImageResult } from '../types';

export abstract class BaseImageProvider implements ImageProvider {
  abstract name: string;

  abstract generateImage(params: ImageGenerationParams): Promise<ImageResult>;

  abstract estimateCost(count: number): number;

  abstract getSupportedDimensions(): Dimension[];
}
