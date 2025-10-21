/**
 * Type definitions for badge-gen
 */

export interface Config {
  apiKey: string;
  budget: BudgetConfig;
  defaults: DefaultSettings;
  dimensions: DimensionConstraints;
  retry: RetryConfig;
  gender: GenderDistribution;
}

export interface BudgetConfig {
  total: number;
  spent: number;
  warnThreshold: number;
}

export interface DefaultSettings {
  count: number;
  style: string;
  format: 'png' | 'jpg';
  outputDir: string;
}

export interface DimensionConstraints {
  minWidth: number;
  minHeight: number;
  maxWidth: number;
  maxHeight: number;
  maintainPortrait: boolean;
}

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
}

export interface GenderDistribution {
  maleRatio: number;
  femaleRatio: number;
}

export interface GenerationParams {
  count: number;
  style: string;
  format: 'png' | 'jpg';
  outputDir: string;
  minSize: string;
  maxSize: string;
  apiKey: string;
  budget?: number;
  dryRun?: boolean;
}

export interface Dimension {
  width: number;
  height: number;
}

export interface ImageResult {
  id: string;
  gender: 'male' | 'female';
  path: string;
  dimensions: {
    width: number;
    height: number;
    requestedMin: string;
    requestedMax: string;
    actualAiSize: string;
  };
  prompt: string;
  style: string;
  generatedAt: string;
  provider: string;
  model: string;
}

export interface ManifestMetadata {
  generatedAt: string;
  toolVersion: string;
  style: string;
  totalCount: number;
  maleCount: number;
  femaleCount: number;
  format: string;
  costUsd: number;
}

export interface Manifest {
  metadata: ManifestMetadata;
  images: ImageResult[];
}

export interface ImageProvider {
  name: string;
  generateImage(params: ImageGenerationParams): Promise<ImageResult>;
  estimateCost(count: number): number;
  getSupportedDimensions(): Dimension[];
}

export interface ImageGenerationParams {
  prompt: string;
  width: number;
  height: number;
  style: string;
}

export interface StylePreset {
  name: string;
  description: string;
  promptTemplate: string;
}
