/**
 * Unit tests for batch generation helper functions
 * Tests diversity attribute generation, config loading, and utility functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import {
  randomChoice,
  generateDiversityAttributes,
  loadFullConfig,
  AGE_OPTIONS,
  ETHNICITY_OPTIONS,
  MALE_FEATURES,
  FEMALE_FEATURES,
} from './batch';
import * as fs from 'fs/promises';
import YAML from 'yaml';
import type { Config } from '../types';

// Mock fs/promises module
vi.mock('fs/promises');

// Mock YAML module
vi.mock('yaml');

describe('randomChoice', () => {
  describe('Basic functionality', () => {
    it('should return a value from the array', () => {
      const arr = ['a', 'b', 'c'];
      const result = randomChoice(arr);
      expect(arr).toContain(result);
    });

    it('should return the only element in a single-element array', () => {
      const arr = ['only'];
      const result = randomChoice(arr);
      expect(result).toBe('only');
    });

    it('should work with different types (numbers)', () => {
      const arr = [1, 2, 3, 4, 5];
      const result = randomChoice(arr);
      expect(arr).toContain(result);
    });

    it('should work with different types (objects)', () => {
      const arr = [{ id: 1 }, { id: 2 }, { id: 3 }];
      const result = randomChoice(arr);
      expect(arr).toContain(result);
    });
  });

  describe('Randomness distribution', () => {
    it('should eventually return all elements with enough calls', () => {
      const arr = ['a', 'b', 'c'];
      const results = new Set<string>();

      // With 100 calls, we should get all 3 elements (probability ~100%)
      for (let i = 0; i < 100; i++) {
        results.add(randomChoice(arr));
      }

      expect(results.size).toBe(3);
      expect(results.has('a')).toBe(true);
      expect(results.has('b')).toBe(true);
      expect(results.has('c')).toBe(true);
    });

    it('should return different values across multiple calls (randomness check)', () => {
      const arr = ['a', 'b', 'c', 'd', 'e'];
      const results = new Set<string>();

      // With 20 calls from 5 elements, we should get at least 2 different values
      for (let i = 0; i < 20; i++) {
        results.add(randomChoice(arr));
      }

      expect(results.size).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Edge cases', () => {
    it('should handle array with duplicate values', () => {
      const arr = ['a', 'a', 'b'];
      const result = randomChoice(arr);
      expect(['a', 'b']).toContain(result);
    });
  });
});

describe('generateDiversityAttributes', () => {
  describe('Male attributes', () => {
    it('should generate valid male attributes', () => {
      const result = generateDiversityAttributes('male');

      // Should contain 'male'
      expect(result).toContain('male');

      // Should match pattern: "age ethnicity male feature"
      // Note: Some ethnicities like "Middle Eastern" and features are multi-word
      const parts = result.split(' ');
      expect(parts.length).toBeGreaterThanOrEqual(4); // At least 4 parts
    });

    it('should include one age option', () => {
      const result = generateDiversityAttributes('male');
      const hasAge = AGE_OPTIONS.some(age => result.includes(age));
      expect(hasAge).toBe(true);
    });

    it('should include one ethnicity option', () => {
      const result = generateDiversityAttributes('male');
      const hasEthnicity = ETHNICITY_OPTIONS.some(ethnicity => result.includes(ethnicity));
      expect(hasEthnicity).toBe(true);
    });

    it('should include one male feature', () => {
      const result = generateDiversityAttributes('male');
      const hasMaleFeature = MALE_FEATURES.some(feature => result.includes(feature));
      expect(hasMaleFeature).toBe(true);
    });

    it('should not include female features', () => {
      const result = generateDiversityAttributes('male');
      // Male result should not contain "long hair" or "short hair" (female-specific)
      const hasFemaleOnlyFeature = result.includes('long hair') || result.includes('short hair');
      expect(hasFemaleOnlyFeature).toBe(false);
    });

    it('should generate diverse results across multiple calls', () => {
      const results = new Set<string>();

      // Generate 50 male attributes, should get multiple unique combinations
      for (let i = 0; i < 50; i++) {
        results.add(generateDiversityAttributes('male'));
      }

      // With 3 ages * 6 ethnicities * 5 features = 90 combinations
      // We should get at least 10 unique combinations in 50 tries
      expect(results.size).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Female attributes', () => {
    it('should generate valid female attributes', () => {
      const result = generateDiversityAttributes('female');

      // Should contain 'female'
      expect(result).toContain('female');

      // Should match pattern: "age ethnicity female feature"
      const parts = result.split(' ');
      expect(parts.length).toBeGreaterThanOrEqual(4);
    });

    it('should include one age option', () => {
      const result = generateDiversityAttributes('female');
      const hasAge = AGE_OPTIONS.some(age => result.includes(age));
      expect(hasAge).toBe(true);
    });

    it('should include one ethnicity option', () => {
      const result = generateDiversityAttributes('female');
      const hasEthnicity = ETHNICITY_OPTIONS.some(ethnicity => result.includes(ethnicity));
      expect(hasEthnicity).toBe(true);
    });

    it('should include one female feature', () => {
      const result = generateDiversityAttributes('female');
      const hasFemaleFeature = FEMALE_FEATURES.some(feature => result.includes(feature));
      expect(hasFemaleFeature).toBe(true);
    });

    it('should not include male-only features', () => {
      const result = generateDiversityAttributes('female');
      // Female result should not contain "beard" or "mustache" (male-specific)
      const hasMaleOnlyFeature = result.includes('beard') || result.includes('mustache');
      expect(hasMaleOnlyFeature).toBe(false);
    });

    it('should generate diverse results across multiple calls', () => {
      const results = new Set<string>();

      // Generate 50 female attributes, should get multiple unique combinations
      for (let i = 0; i < 50; i++) {
        results.add(generateDiversityAttributes('female'));
      }

      // With 3 ages * 6 ethnicities * 4 features = 72 combinations
      // We should get at least 10 unique combinations in 50 tries
      expect(results.size).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Attribute format consistency', () => {
    it('should always follow format: age ethnicity gender feature', () => {
      const maleResult = generateDiversityAttributes('male');
      const femaleResult = generateDiversityAttributes('female');

      // Both should have gender in the string
      expect(maleResult).toContain('male');
      expect(femaleResult).toContain('female');

      // Both should have components from each category
      expect(maleResult.split(' ').length).toBeGreaterThanOrEqual(4);
      expect(femaleResult.split(' ').length).toBeGreaterThanOrEqual(4);
    });
  });
});

describe('Diversity option constants', () => {
  it('should have valid AGE_OPTIONS', () => {
    expect(AGE_OPTIONS).toHaveLength(3);
    expect(AGE_OPTIONS).toContain('young adult');
    expect(AGE_OPTIONS).toContain('middle-aged');
    expect(AGE_OPTIONS).toContain('senior');
  });

  it('should have valid ETHNICITY_OPTIONS', () => {
    expect(ETHNICITY_OPTIONS).toHaveLength(6);
    expect(ETHNICITY_OPTIONS).toContain('Asian');
    expect(ETHNICITY_OPTIONS).toContain('Black');
    expect(ETHNICITY_OPTIONS).toContain('Caucasian');
    expect(ETHNICITY_OPTIONS).toContain('Hispanic');
    expect(ETHNICITY_OPTIONS).toContain('Middle Eastern');
    expect(ETHNICITY_OPTIONS).toContain('South Asian');
  });

  it('should have valid MALE_FEATURES', () => {
    expect(MALE_FEATURES).toHaveLength(5);
    expect(MALE_FEATURES).toContain('with glasses');
    expect(MALE_FEATURES).toContain('without glasses');
    expect(MALE_FEATURES).toContain('with beard');
    expect(MALE_FEATURES).toContain('clean-shaven');
    expect(MALE_FEATURES).toContain('with mustache');
  });

  it('should have valid FEMALE_FEATURES', () => {
    expect(FEMALE_FEATURES).toHaveLength(4);
    expect(FEMALE_FEATURES).toContain('with glasses');
    expect(FEMALE_FEATURES).toContain('without glasses');
    expect(FEMALE_FEATURES).toContain('with long hair');
    expect(FEMALE_FEATURES).toContain('with short hair');
  });

  it('should have some shared features between male and female', () => {
    const sharedFeatures = MALE_FEATURES.filter(f => FEMALE_FEATURES.includes(f));
    expect(sharedFeatures).toContain('with glasses');
    expect(sharedFeatures).toContain('without glasses');
  });

  it('should have male-specific features', () => {
    const maleOnlyFeatures = MALE_FEATURES.filter(f => !FEMALE_FEATURES.includes(f));
    expect(maleOnlyFeatures).toContain('with beard');
    expect(maleOnlyFeatures).toContain('clean-shaven');
    expect(maleOnlyFeatures).toContain('with mustache');
  });

  it('should have female-specific features', () => {
    const femaleOnlyFeatures = FEMALE_FEATURES.filter(f => !MALE_FEATURES.includes(f));
    expect(femaleOnlyFeatures).toContain('with long hair');
    expect(femaleOnlyFeatures).toContain('with short hair');
  });
});

describe('loadFullConfig', () => {
  const mockConfigPath = 'badge-gen.config.yaml';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should load and parse YAML config file', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);

    const mockConfig: Config = {
      apiKey: 'test-api-key',
      budget: {
        total: 100.0,
        spent: 0.0,
        warnThreshold: 0.8,
      },
      defaults: {
        count: 10,
        style: 'bitmoji',
        format: 'png',
        outputDir: './badges',
      },
      dimensions: {
        minWidth: 768,
        minHeight: 1024,
        maxWidth: 1536,
        maxHeight: 2048,
        maintainPortrait: true,
      },
      retry: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 10000,
        backoffMultiplier: 2,
      },
      gender: {
        maleRatio: 0.5,
        femaleRatio: 0.5,
      },
    };

    mockReadFile.mockResolvedValueOnce('yaml-content');
    mockParseYAML.mockReturnValueOnce(mockConfig);

    const result = await loadFullConfig(mockConfigPath);

    expect(mockReadFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    expect(mockParseYAML).toHaveBeenCalledWith('yaml-content');
    expect(result).toEqual(mockConfig);
  });

  it('should propagate file read errors', async () => {
    const mockReadFile = vi.mocked(fs.readFile);

    mockReadFile.mockRejectedValueOnce(new Error('ENOENT: no such file'));

    await expect(loadFullConfig(mockConfigPath)).rejects.toThrow('ENOENT: no such file');
  });

  it('should propagate YAML parse errors', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);

    mockReadFile.mockResolvedValueOnce('invalid yaml content');
    mockParseYAML.mockImplementationOnce(() => {
      throw new Error('Invalid YAML syntax');
    });

    await expect(loadFullConfig(mockConfigPath)).rejects.toThrow('Invalid YAML syntax');
  });

  it('should handle empty file', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);

    mockReadFile.mockResolvedValueOnce('');
    mockParseYAML.mockReturnValueOnce({} as Config);

    const result = await loadFullConfig(mockConfigPath);

    expect(result).toEqual({});
  });

  it('should handle different config file paths', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);

    const customPath = '/custom/path/config.yaml';
    const mockConfig: Partial<Config> = {
      apiKey: 'custom-key',
    };

    mockReadFile.mockResolvedValueOnce('yaml-content');
    mockParseYAML.mockReturnValueOnce(mockConfig as Config);

    await loadFullConfig(customPath);

    expect(mockReadFile).toHaveBeenCalledWith(customPath, 'utf-8');
  });

  it('should return properly typed Config object', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);

    const mockConfig: Config = {
      apiKey: 'test-api-key',
      budget: {
        total: 50.0,
        spent: 10.0,
        warnThreshold: 0.8,
      },
      defaults: {
        count: 25,
        style: 'pixar',
        format: 'jpg',
        outputDir: './output',
      },
      dimensions: {
        minWidth: 900,
        minHeight: 800,
        maxWidth: 2100,
        maxHeight: 1500,
        maintainPortrait: true,
      },
      retry: {
        maxAttempts: 3,
        initialDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      gender: {
        maleRatio: 0.5,
        femaleRatio: 0.5,
      },
    };

    mockReadFile.mockResolvedValueOnce('yaml-content');
    mockParseYAML.mockReturnValueOnce(mockConfig);

    const result = await loadFullConfig(mockConfigPath);

    // Verify all required properties exist
    expect(result.apiKey).toBeDefined();
    expect(result.budget).toBeDefined();
    expect(result.defaults).toBeDefined();
    expect(result.dimensions).toBeDefined();
    expect(result.retry).toBeDefined();
    expect(result.gender).toBeDefined();
  });
});
