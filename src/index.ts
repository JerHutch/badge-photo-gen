#!/usr/bin/env node

/**
 * Badge Photo Generator CLI
 * Main entry point for the badge-gen command
 */

import dotenv from 'dotenv';
import { Command } from 'commander';
import { generateBatch } from './generators/batch';
import { generateArtTest } from './generators/art-test';
import { loadConfig } from './config/loader';
import { logger } from './utils/logger';

// Load environment variables from .env.local or .env
dotenv.config({ path: '.env.local' });
dotenv.config();

const program = new Command();

program
  .name('badge-gen')
  .description('Generate caricature-style employee badge photos using AI')
  .version('1.0.0');

program
  .option('-c, --count <number>', 'Number of images to generate', '10')
  .option('-s, --style <style>', 'Art style preset', 'bitmoji')
  .option('-o, --output <path>', 'Output directory', './badges')
  .option('-f, --format <format>', 'Output format: png or jpg', 'png')
  .option('--min-size <size>', 'Minimum dimensions (WxH)', '900x800')
  .option('--max-size <size>', 'Maximum dimensions (WxH)', '2100x1500')
  .option('--config <path>', 'Path to config file', 'badge-gen.config.yaml')
  .option('-b, --budget <number>', 'Set budget limit in USD')
  .option('--dry-run', 'Preview without generating', false)
  .option('--api-key <key>', 'Stability AI API key')
  .option('--art-test', 'Generate one sample image for each art style (ignores --count and --style)', false)
  .action(async (options) => {
    try {
      // Load configuration
      const config = await loadConfig(options.config, options);

      // Check if art test mode
      if (options.artTest) {
        logger.info('Running in art test mode\n');
        await generateArtTest(config);
      } else {
        // Normal batch generation
        await generateBatch(config);
      }
    } catch (error) {
      logger.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
