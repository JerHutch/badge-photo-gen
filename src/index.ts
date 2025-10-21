#!/usr/bin/env node

/**
 * Badge Photo Generator CLI
 * Main entry point for the badge-gen command
 */

import { Command } from 'commander';
import { generateBatch } from './generators/batch';
import { loadConfig } from './config/loader';

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
  .action(async (options) => {
    try {
      // Load configuration
      const config = await loadConfig(options.config, options);

      // TODO: Implement batch generation
      console.log('Badge generation starting...');
      console.log('Options:', options);
      console.log('Config loaded successfully');

      // await generateBatch(config);
    } catch (error) {
      console.error('Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
  });

program.parse();
