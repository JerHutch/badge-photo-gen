/**
 * Unit tests for configuration loader
 * Tests CLI precedence, config file fallback, environment variables, and defaults
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { loadConfig } from './loader';
import * as fs from 'fs/promises';
import YAML from 'yaml';
import type { Config } from '../types';

// Mock fs/promises module
vi.mock('fs/promises');

// Mock YAML module
vi.mock('yaml');

// Mock logger to avoid console output during tests
vi.mock('../utils/logger', () => ({
  logger: {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
  },
}));

describe('loadConfig', () => {
  const mockConfigPath = 'badge-gen.config.yaml';

  const createMockFileConfig = (overrides?: Partial<Config>): Partial<Config> => ({
    apiKey: 'file-api-key',
    budget: {
      total: 50.0,
      spent: 10.0,
      warnThreshold: 0.8,
    },
    defaults: {
      count: 25,
      style: 'pixar',
      format: 'jpg',
      outputDir: './file-output',
      minSize: '1024x768',
      maxSize: '2048x1536',
    },
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset environment variables
    delete process.env.STABILITY_API_KEY;
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('CLI precedence tests', () => {
    it('should use CLI count over config file count', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        count: '15',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(15); // CLI value
      expect(fileConfig.defaults?.count).toBe(25); // File value (not used)
    });

    it('should use CLI style over config file style', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        style: 'anime',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.style).toBe('anime'); // CLI value
      expect(fileConfig.defaults?.style).toBe('pixar'); // File value (not used)
    });

    it('should use CLI format over config file format', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        format: 'png',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.format).toBe('png'); // CLI value
      expect(fileConfig.defaults?.format).toBe('jpg'); // File value (not used)
    });

    it('should use CLI outputDir over config file outputDir', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        output: './cli-output',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.outputDir).toBe('./cli-output'); // CLI value
      expect(fileConfig.defaults?.outputDir).toBe('./file-output'); // File value (not used)
    });

    it('should use CLI minSize over config file minSize', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        minSize: '1024x768',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.minSize).toBe('1024x768'); // CLI value
    });

    it('should use CLI maxSize over config file maxSize', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        maxSize: '2048x2048',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.maxSize).toBe('2048x2048'); // CLI value
      expect(fileConfig.defaults?.maxSize).toBe('2048x1536'); // File value (not used)
    });

    it('should use CLI apiKey over config file apiKey', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-api-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('cli-api-key'); // CLI value
      expect(fileConfig.apiKey).toBe('file-api-key'); // File value (not used)
    });

    it('should use CLI budget over config file budget', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        budget: '100.50',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.budget).toBe(100.50); // CLI value
    });

    it('should use CLI dryRun over config file dryRun', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        dryRun: true,
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.dryRun).toBe(true); // CLI value
    });

    it('should override all config file values when all CLI options are provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        count: '50',
        style: 'corporate',
        format: 'png',
        output: './new-output',
        minSize: '800x600',
        maxSize: '3000x2500',
        apiKey: 'complete-override',
        budget: '200.00',
        dryRun: true,
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(50);
      expect(result.style).toBe('corporate');
      expect(result.format).toBe('png');
      expect(result.outputDir).toBe('./new-output');
      expect(result.minSize).toBe('800x600');
      expect(result.maxSize).toBe('3000x2500');
      expect(result.apiKey).toBe('complete-override');
      expect(result.budget).toBe(200.00);
      expect(result.dryRun).toBe(true);
    });
  });

  describe('Config file fallback tests', () => {
    it('should use config file count when CLI count is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(25); // File value
    });

    it('should use config file style when CLI style is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.style).toBe('pixar'); // File value
    });

    it('should use config file format when CLI format is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.format).toBe('jpg'); // File value
    });

    it('should use config file outputDir when CLI output is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.outputDir).toBe('./file-output'); // File value
    });

    it('should use config file apiKey when CLI apiKey is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {};

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('file-api-key'); // File value
    });

    it('should use config file minSize when CLI minSize is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.minSize).toBe('1024x768'); // File value
    });

    it('should use config file maxSize when CLI maxSize is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.maxSize).toBe('2048x1536'); // File value
    });

    it('should use config file budget when CLI budget is not provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.budget).toBe(50.0); // File value from budget.total
    });

    it('should use all config file values when no CLI options are provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {};

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(25);
      expect(result.style).toBe('pixar');
      expect(result.format).toBe('jpg');
      expect(result.outputDir).toBe('./file-output');
      expect(result.minSize).toBe('1024x768');
      expect(result.maxSize).toBe('2048x1536');
      expect(result.apiKey).toBe('file-api-key');
      expect(result.budget).toBe(50.0);
      expect(result.dryRun).toBe(false);
    });
  });

  describe('Environment variable tests', () => {
    it('should use STABILITY_API_KEY env var when neither CLI nor config provide apiKey', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      process.env.STABILITY_API_KEY = 'env-api-key';

      const cliOptions = {};

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('env-api-key');
    });

    it('should prefer CLI apiKey over env var', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      process.env.STABILITY_API_KEY = 'env-api-key';

      const cliOptions = {
        apiKey: 'cli-api-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('cli-api-key'); // CLI takes precedence
    });

    it('should prefer config file apiKey over env var', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: 'file-api-key' });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      process.env.STABILITY_API_KEY = 'env-api-key';

      const cliOptions = {};

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('file-api-key'); // Config file takes precedence
    });

    it('should handle missing STABILITY_API_KEY env var gracefully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      delete process.env.STABILITY_API_KEY;

      const cliOptions = {};

      await expect(loadConfig(mockConfigPath, cliOptions)).rejects.toThrow(
        'API key is required'
      );
    });
  });

  describe('Default values tests', () => {
    it('should use default count when neither CLI nor config provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: undefined as any,
          style: 'pixar',
          format: 'jpg',
          outputDir: './output',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(10); // Default value
    });

    it('should use default style when neither CLI nor config provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: 25,
          style: undefined as any,
          format: 'jpg',
          outputDir: './output',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.style).toBe('bitmoji'); // Default value
    });

    it('should use default format when neither CLI nor config provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: 25,
          style: 'pixar',
          format: undefined as any,
          outputDir: './output',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.format).toBe('png'); // Default value
    });

    it('should use default outputDir when neither CLI nor config provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: 25,
          style: 'pixar',
          format: 'jpg',
          outputDir: undefined as any,
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.outputDir).toBe('./badges'); // Default value
    });

    it('should use default minSize when CLI and config do not provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: 25,
          style: 'pixar',
          format: 'jpg',
          outputDir: './output',
          minSize: undefined,
          maxSize: '2048x1536',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.minSize).toBe('900x800'); // Default value
    });

    it('should use default maxSize when CLI and config do not provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: 25,
          style: 'pixar',
          format: 'jpg',
          outputDir: './output',
          minSize: '1024x768',
          maxSize: undefined,
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.maxSize).toBe('2100x1500'); // Default value
    });

    it('should use default dryRun (false) when CLI does not provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.dryRun).toBe(false); // Default value
    });

    it('should use budget as undefined when neither CLI nor config provide it', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        budget: undefined,
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'test-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.budget).toBeUndefined(); // No default for budget
    });
  });

  describe('Priority cascade tests', () => {
    it('should follow complete priority cascade for apiKey: CLI > Config > Env > Error', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test 1: CLI wins over everything
      const fileConfig1 = createMockFileConfig({ apiKey: 'file-key' });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);
      process.env.STABILITY_API_KEY = 'env-key';

      const result1 = await loadConfig(mockConfigPath, { apiKey: 'cli-key' });
      expect(result1.apiKey).toBe('cli-key');

      // Test 2: Config wins over Env
      const fileConfig2 = createMockFileConfig({ apiKey: 'file-key' });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);
      process.env.STABILITY_API_KEY = 'env-key';

      const result2 = await loadConfig(mockConfigPath, {});
      expect(result2.apiKey).toBe('file-key');

      // Test 3: Env is used when Config is missing
      const fileConfig3 = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);
      process.env.STABILITY_API_KEY = 'env-key';

      const result3 = await loadConfig(mockConfigPath, {});
      expect(result3.apiKey).toBe('env-key');
    });

    it('should follow complete priority cascade for count: CLI > Config > Default', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test 1: CLI wins
      const fileConfig1 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);

      const result1 = await loadConfig(mockConfigPath, { count: '100', apiKey: 'key' });
      expect(result1.count).toBe(100);

      // Test 2: Config is used when CLI is missing
      const fileConfig2 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);

      const result2 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result2.count).toBe(25);

      // Test 3: Default is used when both are missing
      const fileConfig3 = createMockFileConfig({
        defaults: {
          count: undefined as any,
          style: 'pixar',
          format: 'jpg',
          outputDir: './output',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);

      const result3 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result3.count).toBe(10);
    });

    it('should follow complete priority cascade for style: CLI > Config > Default', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test 1: CLI wins
      const fileConfig1 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);

      const result1 = await loadConfig(mockConfigPath, { style: 'anime', apiKey: 'key' });
      expect(result1.style).toBe('anime');

      // Test 2: Config is used when CLI is missing
      const fileConfig2 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);

      const result2 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result2.style).toBe('pixar');

      // Test 3: Default is used when both are missing
      const fileConfig3 = createMockFileConfig({
        defaults: {
          count: 25,
          style: undefined as any,
          format: 'jpg',
          outputDir: './output',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);

      const result3 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result3.style).toBe('bitmoji');
    });

    it('should follow complete priority cascade for minSize: CLI > Config > Default', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test 1: CLI wins
      const fileConfig1 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);

      const result1 = await loadConfig(mockConfigPath, { minSize: '512x512', apiKey: 'key' });
      expect(result1.minSize).toBe('512x512');

      // Test 2: Config is used when CLI is missing
      const fileConfig2 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);

      const result2 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result2.minSize).toBe('1024x768');

      // Test 3: Default is used when both are missing
      const fileConfig3 = createMockFileConfig({
        defaults: {
          count: 25,
          style: 'pixar',
          format: 'jpg',
          outputDir: './output',
          minSize: undefined,
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);

      const result3 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result3.minSize).toBe('900x800');
    });

    it('should follow complete priority cascade for maxSize: CLI > Config > Default', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test 1: CLI wins
      const fileConfig1 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);

      const result1 = await loadConfig(mockConfigPath, { maxSize: '4096x4096', apiKey: 'key' });
      expect(result1.maxSize).toBe('4096x4096');

      // Test 2: Config is used when CLI is missing
      const fileConfig2 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);

      const result2 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result2.maxSize).toBe('2048x1536');

      // Test 3: Default is used when both are missing
      const fileConfig3 = createMockFileConfig({
        defaults: {
          count: 25,
          style: 'pixar',
          format: 'jpg',
          outputDir: './output',
          maxSize: undefined,
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);

      const result3 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result3.maxSize).toBe('2100x1500');
    });

    it('should follow complete priority cascade for budget: CLI > Config > Undefined', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test 1: CLI wins
      const fileConfig1 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);

      const result1 = await loadConfig(mockConfigPath, { budget: '100', apiKey: 'key' });
      expect(result1.budget).toBe(100);

      // Test 2: Config is used when CLI is missing
      const fileConfig2 = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);

      const result2 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result2.budget).toBe(50.0);

      // Test 3: Undefined is used when both are missing
      const fileConfig3 = createMockFileConfig({
        budget: undefined,
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);

      const result3 = await loadConfig(mockConfigPath, { apiKey: 'key' });
      expect(result3.budget).toBeUndefined();
    });
  });

  describe('Edge cases', () => {
    it('should handle empty config file', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      mockReadFile.mockResolvedValueOnce('');
      mockParseYAML.mockReturnValueOnce({});

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      // Should use defaults for everything except apiKey
      expect(result.count).toBe(10);
      expect(result.style).toBe('bitmoji');
      expect(result.format).toBe('png');
      expect(result.outputDir).toBe('./badges');
      expect(result.minSize).toBe('900x800');
      expect(result.maxSize).toBe('2100x1500');
      expect(result.apiKey).toBe('cli-key');
      expect(result.dryRun).toBe(false);
    });

    it('should handle missing config file gracefully', async () => {
      const mockReadFile = vi.mocked(fs.readFile);

      mockReadFile.mockRejectedValueOnce(new Error('ENOENT: no such file'));

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      // Should use defaults and CLI options
      expect(result.count).toBe(10);
      expect(result.style).toBe('bitmoji');
      expect(result.apiKey).toBe('cli-key');
    });

    it('should respect falsy value count: 0 from CLI', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        count: '0',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(0); // Should respect 0, not use default
    });

    it('should handle invalid config file path', async () => {
      const mockReadFile = vi.mocked(fs.readFile);

      mockReadFile.mockRejectedValueOnce(new Error('Invalid path'));

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig('/invalid/path/config.yaml', cliOptions);

      // Should continue with defaults
      expect(result.count).toBe(10);
      expect(result.apiKey).toBe('cli-key');
    });

    it('should handle config file with partial defaults', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        defaults: {
          count: 50,
          // Missing style, format, outputDir
        } as any,
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(50); // From config
      expect(result.style).toBe('bitmoji'); // Default
      expect(result.format).toBe('png'); // Default
      expect(result.outputDir).toBe('./badges'); // Default
    });

    it('should handle config file with no defaults section', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = {
        apiKey: 'file-key',
        // No defaults section
      };
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {};

      const result = await loadConfig(mockConfigPath, cliOptions);

      // Should use all defaults except apiKey from file
      expect(result.count).toBe(10);
      expect(result.style).toBe('bitmoji');
      expect(result.format).toBe('png');
      expect(result.outputDir).toBe('./badges');
      expect(result.apiKey).toBe('file-key');
    });

    it('should fall back when empty string values are provided', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        apiKey: 'valid-key', // Need valid key to avoid validation error
        defaults: {
          count: 25,
          style: 'pixar',
          format: 'jpg',
          outputDir: './file-output',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        style: '',
        output: '',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      // Empty strings from CLI should fall through to config file
      expect(result.style).toBe('pixar'); // Config file
      expect(result.outputDir).toBe('./file-output'); // Config file
      expect(result.apiKey).toBe('valid-key'); // From config
    });

    it('should fall back to defaults when empty strings are in config file too', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({
        apiKey: 'valid-key', // Need valid key to avoid validation error
        defaults: {
          count: 25,
          style: '',
          format: 'jpg',
          outputDir: '',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {};

      const result = await loadConfig(mockConfigPath, cliOptions);

      // Empty strings in config should fall through to defaults
      expect(result.style).toBe('bitmoji'); // Default
      expect(result.outputDir).toBe('./badges'); // Default
      expect(result.apiKey).toBe('valid-key'); // From config
    });

    it('should parse string count from CLI correctly', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        count: '123',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(123);
      expect(typeof result.count).toBe('number');
    });

    it('should parse string budget from CLI correctly', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        budget: '99.95',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.budget).toBe(99.95);
      expect(typeof result.budget).toBe('number');
    });

    it('should fall back to config when count string is invalid (NaN)', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        count: 'not-a-number',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      // parseInt('not-a-number') returns NaN
      // With isValidValue check, NaN should fall through to config file
      expect(result.count).toBe(25); // Falls back to config file
    });

    it('should fall back to config when budget string is invalid (NaN)', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig();
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        budget: 'invalid',
        apiKey: 'cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      // parseFloat('invalid') returns NaN, should fall back to config file budget
      expect(result.budget).toBe(50.0); // Falls back to config file budget.total
    });
  });

  describe('Validation tests', () => {
    it('should throw error when API key is missing and dryRun is false', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      delete process.env.STABILITY_API_KEY;

      const cliOptions = {};

      await expect(loadConfig(mockConfigPath, cliOptions)).rejects.toThrow(
        'API key is required. Set via --api-key, config file, or STABILITY_API_KEY env var'
      );
    });

    it('should throw error with correct message when all API key sources are missing', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: '' });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      delete process.env.STABILITY_API_KEY;

      const cliOptions = {
        apiKey: '',
      };

      await expect(loadConfig(mockConfigPath, cliOptions)).rejects.toThrow(
        'API key is required. Set via --api-key, config file, or STABILITY_API_KEY env var'
      );
    });

    it('should not require API key when dryRun is true', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      delete process.env.STABILITY_API_KEY;

      const cliOptions = {
        dryRun: true,
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('');
      expect(result.dryRun).toBe(true);
    });

    it('should allow empty API key when dryRun is true', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: '' });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      const cliOptions = {
        apiKey: '',
        dryRun: true,
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.apiKey).toBe('');
      expect(result.dryRun).toBe(true);
    });

    it('should validate API key before other operations', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      const fileConfig = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      delete process.env.STABILITY_API_KEY;

      const cliOptions = {
        count: '50',
        style: 'anime',
        // No apiKey and no dryRun
      };

      await expect(loadConfig(mockConfigPath, cliOptions)).rejects.toThrow(
        'API key is required'
      );
    });

    it('should not throw when API key is provided via any valid source', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Test with CLI
      const fileConfig1 = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig1);

      await expect(
        loadConfig(mockConfigPath, { apiKey: 'cli-key' })
      ).resolves.not.toThrow();

      // Test with config file
      const fileConfig2 = createMockFileConfig({ apiKey: 'file-key' });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig2);

      await expect(loadConfig(mockConfigPath, {})).resolves.not.toThrow();

      // Test with env var
      const fileConfig3 = createMockFileConfig({ apiKey: undefined });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig3);
      process.env.STABILITY_API_KEY = 'env-key';

      await expect(loadConfig(mockConfigPath, {})).resolves.not.toThrow();
    });
  });

  describe('Integration tests', () => {
    it('should handle complex real-world scenario with mixed sources', async () => {
      const mockReadFile = vi.mocked(fs.readFile);
      const mockParseYAML = vi.mocked(YAML.parse);

      // Config file has some values (including minSize/maxSize)
      const fileConfig = createMockFileConfig({
        apiKey: 'file-api-key',
        defaults: {
          count: 30,
          style: 'corporate',
          format: 'png',
          outputDir: './company-badges',
          minSize: '1024x768',
          maxSize: '2048x1536',
        },
      });
      mockReadFile.mockResolvedValueOnce('yaml-content');
      mockParseYAML.mockReturnValueOnce(fileConfig);

      // Env var is also set
      process.env.STABILITY_API_KEY = 'env-api-key';

      // CLI overrides some values
      const cliOptions = {
        count: '100',
        style: 'pixar',
        // format not provided, should use config
        // output not provided, should use config
        // minSize not provided, should use config
        // maxSize not provided, should use config
        // apiKey not provided, should use config (not env)
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(100); // CLI
      expect(result.style).toBe('pixar'); // CLI
      expect(result.format).toBe('png'); // Config
      expect(result.outputDir).toBe('./company-badges'); // Config
      expect(result.apiKey).toBe('file-api-key'); // Config (not env)
      expect(result.minSize).toBe('1024x768'); // Config
      expect(result.maxSize).toBe('2048x1536'); // Config
      expect(result.budget).toBe(50.0); // Config
      expect(result.dryRun).toBe(false); // Default
    });

    it('should handle scenario with only defaults', async () => {
      const mockReadFile = vi.mocked(fs.readFile);

      // Config file doesn't exist
      mockReadFile.mockRejectedValueOnce(new Error('ENOENT'));

      // No env var
      delete process.env.STABILITY_API_KEY;

      // Only API key from CLI
      const cliOptions = {
        apiKey: 'only-cli-key',
      };

      const result = await loadConfig(mockConfigPath, cliOptions);

      expect(result.count).toBe(10); // Default
      expect(result.style).toBe('bitmoji'); // Default
      expect(result.format).toBe('png'); // Default
      expect(result.outputDir).toBe('./badges'); // Default
      expect(result.apiKey).toBe('only-cli-key'); // CLI
      expect(result.minSize).toBe('900x800'); // Default
      expect(result.maxSize).toBe('2100x1500'); // Default
      expect(result.dryRun).toBe(false); // Default
    });
  });
});
