/**
 * Configuration file loader
 * Handles loading and merging YAML config with CLI options
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import YAML from 'yaml';
import { Config, GenerationParams } from '../types';
import { logger } from '../utils/logger';

export async function loadConfig(
  configPath: string,
  cliOptions: any
): Promise<GenerationParams> {
  let fileConfig: Partial<Config> = {};

  // Try to load config file if it exists
  try {
    const configContent = await fs.readFile(configPath, 'utf-8');
    fileConfig = YAML.parse(configContent);
  } catch (error) {
    // Config file is optional, continue with defaults
    logger.info(`No config file found at ${configPath}, using defaults`);
  }

  // Merge config file with CLI options (CLI takes precedence)
  const config: GenerationParams = {
    count: parseInt(cliOptions.count) || fileConfig.defaults?.count || 10,
    style: cliOptions.style || fileConfig.defaults?.style || 'bitmoji',
    format: cliOptions.format || fileConfig.defaults?.format || 'png',
    outputDir: cliOptions.output || fileConfig.defaults?.outputDir || './badges',
    minSize: cliOptions.minSize || '900x800',
    maxSize: cliOptions.maxSize || '2100x1500',
    apiKey:
      cliOptions.apiKey ||
      fileConfig.apiKey ||
      process.env.STABILITY_API_KEY ||
      '',
    budget: cliOptions.budget ? parseFloat(cliOptions.budget) : undefined,
    dryRun: cliOptions.dryRun || false,
  };

  // Validate required fields
  if (!config.apiKey && !config.dryRun) {
    throw new Error(
      'API key is required. Set via --api-key, config file, or STABILITY_API_KEY env var'
    );
  }

  return config;
}

export async function saveConfig(configPath: string, config: Config): Promise<void> {
  const yamlContent = YAML.stringify(config);
  await fs.writeFile(configPath, yamlContent, 'utf-8');
}
