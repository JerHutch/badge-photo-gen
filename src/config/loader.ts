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

  // Merge config file with CLI options using explicit precedence
  // Priority: CLI args > Config file > Environment variables > Hard-coded defaults

  // Helper function to check if value is valid (not undefined, not empty string, not NaN)
  const isValidValue = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim() === '') return false;
    if (typeof value === 'number' && isNaN(value)) return false;
    return true;
  };

  // Count: CLI > Config file > Hard-coded default (10)
  let count: number;
  const cliCount = cliOptions.count !== undefined ? parseInt(cliOptions.count, 10) : undefined;
  if (isValidValue(cliCount)) {
    count = cliCount as number;
  } else if (isValidValue(fileConfig.defaults?.count)) {
    count = fileConfig.defaults!.count!;
  } else {
    count = 10;
  }

  // Style: CLI > Config file > Hard-coded default ('bitmoji')
  let style: string;
  if (isValidValue(cliOptions.style)) {
    style = cliOptions.style;
  } else if (isValidValue(fileConfig.defaults?.style)) {
    style = fileConfig.defaults!.style!;
  } else {
    style = 'bitmoji';
  }

  // Format: CLI > Config file > Hard-coded default ('png')
  let format: 'png' | 'jpg';
  if (isValidValue(cliOptions.format)) {
    format = cliOptions.format;
  } else if (isValidValue(fileConfig.defaults?.format)) {
    format = fileConfig.defaults!.format!;
  } else {
    format = 'png';
  }

  // Output directory: CLI > Config file > Hard-coded default ('./badges')
  let outputDir: string;
  if (isValidValue(cliOptions.output)) {
    outputDir = cliOptions.output;
  } else if (isValidValue(fileConfig.defaults?.outputDir)) {
    outputDir = fileConfig.defaults!.outputDir!;
  } else {
    outputDir = './badges';
  }

  // Min size: CLI > Config file > Hard-coded default ('900x800')
  let minSize: string;
  if (isValidValue(cliOptions.minSize)) {
    minSize = cliOptions.minSize;
  } else if (isValidValue(fileConfig.defaults?.minSize)) {
    minSize = fileConfig.defaults!.minSize!;
  } else {
    minSize = '900x800';
  }

  // Max size: CLI > Config file > Hard-coded default ('2100x1500')
  let maxSize: string;
  if (isValidValue(cliOptions.maxSize)) {
    maxSize = cliOptions.maxSize;
  } else if (isValidValue(fileConfig.defaults?.maxSize)) {
    maxSize = fileConfig.defaults!.maxSize!;
  } else {
    maxSize = '2100x1500';
  }

  // API Key: CLI > Config file > Environment variable > Empty string
  let apiKey: string;
  if (isValidValue(cliOptions.apiKey)) {
    apiKey = cliOptions.apiKey;
  } else if (isValidValue(fileConfig.apiKey)) {
    apiKey = fileConfig.apiKey!;
  } else if (isValidValue(process.env.STABILITY_API_KEY)) {
    apiKey = process.env.STABILITY_API_KEY!;
  } else {
    apiKey = '';
  }

  // Budget: CLI > Config file > undefined
  let budget: number | undefined;
  const cliBudget = cliOptions.budget !== undefined ? parseFloat(cliOptions.budget) : undefined;
  if (isValidValue(cliBudget)) {
    budget = cliBudget;
  } else if (isValidValue(fileConfig.budget?.total)) {
    budget = fileConfig.budget!.total;
  } else {
    budget = undefined;
  }

  // Dry run: CLI explicit value (handle boolean properly)
  // Commander.js sets this to true if flag is present, false if not
  const dryRun: boolean = cliOptions.dryRun === true;

  const config: GenerationParams = {
    count,
    style,
    format,
    outputDir,
    minSize,
    maxSize,
    apiKey,
    budget,
    dryRun,
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
