/**
 * Art style test generator
 * Generates one sample image for each configured art style
 */

import { GenerationParams, ImageResult, Config } from '../types';
import { StabilityAIProvider } from '../providers/stability-ai';
import { listStyles, getStylePreset } from '../config/styles';
import { randomizeDimensions } from '../utils/dimensions';
import { retryWithBackoff } from '../utils/retry';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import YAML from 'yaml';

/**
 * Load configuration file
 */
async function loadFullConfig(configPath: string): Promise<Config> {
  const configContent = await fs.readFile(configPath, 'utf-8');
  return YAML.parse(configContent);
}

/**
 * Generate art style test samples
 * Creates one image for each art style with filename prefix indicating the style
 */
export async function generateArtTest(params: GenerationParams): Promise<void> {
  logger.info('Starting art style test generation...');

  const styles = listStyles();
  logger.info(`Will generate ${styles.length} test images (one per style)`);
  logger.info(`Available styles: ${styles.join(', ')}\n`);

  // Load config for retry settings
  const configPath = 'badge-gen.config.yaml';
  let config: Config;

  try {
    config = await loadFullConfig(configPath);
  } catch (error) {
    // Use default retry config if file doesn't exist
    config = {
      retry: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
    } as Config;
    logger.warn('Config file not found, using default retry settings');
  }

  // Create provider instance
  const provider = new StabilityAIProvider(params.apiKey);

  // Create output directory
  await fs.mkdir(params.outputDir, { recursive: true });
  logger.info(`Output directory: ${params.outputDir}\n`);

  // Get supported dimensions
  const supportedDimensions = provider.getSupportedDimensions();

  // Generate one image for each style
  const results: ImageResult[] = [];
  const totalStyles = styles.length;

  for (let i = 0; i < styles.length; i++) {
    const styleName = styles[i];

    try {
      logger.info(`[${i + 1}/${totalStyles}] Generating ${styleName} sample...`);

      // Get style preset
      const stylePreset = getStylePreset(styleName);

      // Use a consistent test prompt for all styles
      const testPrompt = `${stylePreset.promptTemplate}, middle-aged Caucasian professional with glasses`;

      // Get random dimensions
      const dimensions = randomizeDimensions(
        params.minSize,
        params.maxSize,
        supportedDimensions
      );

      logger.info(`  Dimensions: ${dimensions.width}x${dimensions.height}`);

      // Generate image with retry logic
      const result = await retryWithBackoff(
        () => provider.generateImage({
          prompt: testPrompt,
          width: dimensions.width,
          height: dimensions.height,
          style: styleName,
        }),
        config.retry
      );

      // Extract base64 data
      const base64Data = (result as any).base64Data;
      if (!base64Data) {
        throw new Error('No base64 data returned from provider');
      }

      // Create filename with style prefix
      const filename = `${styleName}.${params.format}`;
      const filepath = path.join(params.outputDir, filename);

      // Convert base64 to buffer and save using sharp
      const imageBuffer = Buffer.from(base64Data, 'base64');

      if (params.format === 'png') {
        await sharp(imageBuffer).png().toFile(filepath);
      } else {
        await sharp(imageBuffer).jpeg({ quality: 95 }).toFile(filepath);
      }

      // Update result
      result.id = styleName;
      result.path = filepath;
      result.gender = 'male'; // Test uses male for consistency

      // Remove base64Data
      delete (result as any).base64Data;

      results.push(result);

      logger.info(`  ✓ Saved: ${filepath}\n`);

    } catch (error) {
      logger.error(`  ✗ Failed to generate ${styleName}: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }

  // Summary
  logger.info('=== Art Test Summary ===');
  logger.info(`Total styles: ${totalStyles}`);
  logger.info(`Successfully generated: ${results.length}`);
  logger.info(`Failed: ${totalStyles - results.length}`);
  logger.info(`Output directory: ${params.outputDir}`);
  logger.info('========================\n');

  if (results.length > 0) {
    logger.info('Generated files:');
    results.forEach(r => {
      logger.info(`  - ${path.basename(r.path)}`);
    });
    logger.info('');
  }
}
