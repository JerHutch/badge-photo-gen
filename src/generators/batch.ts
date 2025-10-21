/**
 * Batch generation logic
 * Handles generating multiple images with gender distribution
 */

import { GenerationParams, ImageResult, Config, ManifestMetadata } from '../types';
import { StabilityAIProvider } from '../providers/stability-ai';
import { getStylePreset } from '../config/styles';
import { randomizeDimensions } from '../utils/dimensions';
import { generateUUID } from '../utils/uuid';
import { createManifest, saveManifest } from '../utils/manifest';
import { checkBudget, updateBudgetSpent, formatBudgetCheck } from '../config/budget';
import { retryWithBackoff } from '../utils/retry';
import { logger } from '../utils/logger';
import * as fs from 'fs/promises';
import * as path from 'path';
import sharp from 'sharp';
import YAML from 'yaml';

/**
 * Helper function to get random diversity attribute from array
 */
function randomChoice<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Diversity attribute generators
 */
const AGE_OPTIONS = ['young adult', 'middle-aged', 'senior'];
const ETHNICITY_OPTIONS = [
  'Asian',
  'Black',
  'Caucasian',
  'Hispanic',
  'Middle Eastern',
  'South Asian',
];
const MALE_FEATURES = [
  'with glasses',
  'without glasses',
  'with beard',
  'clean-shaven',
  'with mustache',
];
const FEMALE_FEATURES = [
  'with glasses',
  'without glasses',
  'with long hair',
  'with short hair',
];

/**
 * Generate random diversity attributes for a person
 */
function generateDiversityAttributes(gender: 'male' | 'female'): string {
  const age = randomChoice(AGE_OPTIONS);
  const ethnicity = randomChoice(ETHNICITY_OPTIONS);
  const features = randomChoice(gender === 'male' ? MALE_FEATURES : FEMALE_FEATURES);

  return `${age} ${ethnicity} ${gender} ${features}`;
}

/**
 * Load configuration file
 */
async function loadFullConfig(configPath: string): Promise<Config> {
  const configContent = await fs.readFile(configPath, 'utf-8');
  return YAML.parse(configContent);
}

/**
 * Main batch generation function
 */
export async function generateBatch(params: GenerationParams): Promise<void> {
  logger.info('Starting batch generation...');
  logger.info(`Generating ${params.count} images in ${params.style} style`);

  // === STEP A: BUDGET CHECK ===
  const configPath = 'badge-gen.config.yaml';
  let config: Config;

  try {
    config = await loadFullConfig(configPath);
  } catch (error) {
    throw new Error(
      `Failed to load config file at ${configPath}: ${error instanceof Error ? error.message : String(error)}`
    );
  }

  // Create provider instance
  const provider = new StabilityAIProvider(params.apiKey);

  // Estimate cost
  const estimatedCost = provider.estimateCost(params.count);

  // Check budget
  const budgetCheck = checkBudget(config, estimatedCost);

  if (!budgetCheck.allowed) {
    throw new Error(budgetCheck.message);
  }

  // Display budget information to user
  logger.info('\n' + formatBudgetCheck(
    config.budget.total,
    config.budget.spent,
    estimatedCost
  ));
  logger.info('');

  // === STEP B: CALCULATE GENDER DISTRIBUTION ===
  const maleCount = Math.ceil(params.count / 2);
  const femaleCount = Math.floor(params.count / 2);

  logger.info(`Gender distribution: ${maleCount} male, ${femaleCount} female\n`);

  // === STEP C: CREATE OUTPUT DIRECTORIES ===
  const maleDir = path.join(params.outputDir, 'male');
  const femaleDir = path.join(params.outputDir, 'female');

  await fs.mkdir(params.outputDir, { recursive: true });
  await fs.mkdir(maleDir, { recursive: true });
  await fs.mkdir(femaleDir, { recursive: true });

  logger.info(`Output directories created at ${params.outputDir}\n`);

  // === STEP D: GENERATE IMAGES ===
  const results: ImageResult[] = [];
  const stylePreset = getStylePreset(params.style);
  const supportedDimensions = provider.getSupportedDimensions();

  for (let i = 0; i < params.count; i++) {
    try {
      // Determine gender based on index
      const gender: 'male' | 'female' = i < maleCount ? 'male' : 'female';
      const genderDir = gender === 'male' ? maleDir : femaleDir;

      // Generate diversity attributes
      const diversityAttributes = generateDiversityAttributes(gender);

      // Build prompt
      const prompt = `${stylePreset.promptTemplate}, ${diversityAttributes}`;

      // Get random dimensions
      const dimensions = randomizeDimensions(
        params.minSize,
        params.maxSize,
        supportedDimensions
      );

      logger.info(`Generating image ${i + 1}/${params.count} (${gender}, ${dimensions.width}x${dimensions.height})...`);

      // Generate image with retry logic
      const result = await retryWithBackoff(
        () => provider.generateImage({
          prompt,
          width: dimensions.width,
          height: dimensions.height,
          style: params.style,
        }),
        config.retry
      );

      // Extract base64 data
      const base64Data = (result as any).base64Data;
      if (!base64Data) {
        throw new Error('No base64 data returned from provider');
      }

      // Generate UUID for filename
      const uuid = generateUUID();
      const filename = `${uuid}.${params.format}`;
      const filepath = path.join(genderDir, filename);

      // Convert base64 to buffer and save using sharp
      const imageBuffer = Buffer.from(base64Data, 'base64');

      if (params.format === 'png') {
        await sharp(imageBuffer).png().toFile(filepath);
      } else {
        await sharp(imageBuffer).jpeg({ quality: 95 }).toFile(filepath);
      }

      // Update result with correct information
      result.id = uuid;
      result.gender = gender;
      result.path = filepath;

      // Remove base64Data before adding to manifest (it's already saved to file)
      delete (result as any).base64Data;

      // Add to results
      results.push(result);

      logger.info(`  Saved: ${filepath}`);

    } catch (error) {
      logger.error(`Error generating image ${i + 1}/${params.count}: ${error instanceof Error ? error.message : String(error)}`);

      // Check if budget was exceeded during generation
      const currentSpent = config.budget.spent + (results.length * (estimatedCost / params.count));
      if (currentSpent >= config.budget.total) {
        logger.error('\nBudget exceeded during batch generation. Stopping...');
        break;
      }

      // Otherwise, continue with next image
      logger.info('Continuing with next image...\n');
    }
  }

  logger.info(`\nGeneration complete: ${results.length}/${params.count} images generated`);

  // === STEP E: CREATE MANIFEST ===
  const metadata: ManifestMetadata = {
    generatedAt: new Date().toISOString(),
    toolVersion: '1.0.0', // From package.json
    style: params.style,
    totalCount: results.length,
    maleCount: results.filter(r => r.gender === 'male').length,
    femaleCount: results.filter(r => r.gender === 'female').length,
    format: params.format,
    costUsd: (results.length * (estimatedCost / params.count)),
  };

  const manifest = createManifest(metadata, results);
  await saveManifest(params.outputDir, manifest);

  logger.info(`Manifest saved to ${path.join(params.outputDir, 'manifest.json')}\n`);

  // === STEP F: UPDATE BUDGET ===
  const actualCost = results.length * (estimatedCost / params.count);
  await updateBudgetSpent(configPath, actualCost);

  logger.info('=== Generation Summary ===');
  logger.info(`Total images: ${results.length}`);
  logger.info(`Male: ${metadata.maleCount}`);
  logger.info(`Female: ${metadata.femaleCount}`);
  logger.info(`Cost: $${actualCost.toFixed(4)}`);
  logger.info(`Output: ${params.outputDir}`);
  logger.info('==========================\n');
}
