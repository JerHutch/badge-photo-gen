/**
 * Unit tests for budget tracking functions
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { checkBudget, formatBudgetCheck, updateBudgetSpent } from './budget';
import type { Config } from '../types';
import * as fs from 'fs/promises';
import YAML from 'yaml';

// Mock fs/promises module
vi.mock('fs/promises');

// Mock YAML module
vi.mock('yaml');

describe('checkBudget', () => {
  const createMockConfig = (total: number, spent: number, warnThreshold = 0.8): Config => ({
    apiKey: 'test-key',
    budget: {
      total,
      spent,
      warnThreshold,
    },
    defaults: {
      count: 10,
      style: 'caricature',
      format: 'png',
      outputDir: './output',
    },
    dimensions: {
      minWidth: 512,
      minHeight: 512,
      maxWidth: 1024,
      maxHeight: 1024,
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
  });

  it('should return allowed: true when budget is sufficient', () => {
    const config = createMockConfig(10.0, 2.0);
    const estimatedCost = 5.0;

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    expect(result.message).toContain('Budget check passed');
    expect(result.message).toContain('$5.0000');
    expect(result.message).toContain('$3.0000'); // remaining after
  });

  it('should return allowed: false when budget is exceeded', () => {
    const config = createMockConfig(10.0, 8.0);
    const estimatedCost = 5.0;

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Budget exceeded!');
    expect(result.message).toContain('$5.0000'); // estimated cost
    expect(result.message).toContain('$2.0000'); // remaining budget
    expect(result.message).toContain('Total budget: $10.0000');
    expect(result.message).toContain('Spent: $8.0000');
    expect(result.message).toContain('Remaining: $2.0000');
  });

  it('should show warning message when within warn threshold (80%)', () => {
    const config = createMockConfig(10.0, 5.0, 0.8); // 80% threshold
    const estimatedCost = 4.0; // Will bring total to 90%

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    expect(result.message).toContain('Warning');
    expect(result.message).toContain('90.0%'); // 9.0 out of 10.0 = 90%
    expect(result.message).toContain('Total budget: $10.0000');
    expect(result.message).toContain('Spent: $5.0000');
    expect(result.message).toContain('Remaining: $5.0000');
    expect(result.message).toContain('Estimated cost: $4.0000');
    expect(result.message).toContain('After generation: $9.0000');
  });

  it('should calculate budget utilization percentages correctly', () => {
    const config = createMockConfig(100.0, 25.0);
    const estimatedCost = 15.0; // Will bring to 40%

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    // Should not show warning since 40% < 80%
    expect(result.message).not.toContain('Warning');
    expect(result.message).toContain('Budget check passed');
  });

  it('should handle edge case: exactly at budget limit', () => {
    const config = createMockConfig(10.0, 5.0);
    const estimatedCost = 5.0; // Exactly uses remaining budget

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    expect(result.message).toContain('Warning'); // 100% should trigger warning
    expect(result.message).toContain('100.0%');
    expect(result.message).toContain('After generation: $10.0000');
  });

  it('should handle edge case: zero budget remaining', () => {
    const config = createMockConfig(10.0, 10.0);
    const estimatedCost = 0.01;

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(false);
    expect(result.message).toContain('Budget exceeded!');
    expect(result.message).toContain('Remaining: $0.0000');
  });

  it('should handle small decimal amounts correctly', () => {
    const config = createMockConfig(1.0, 0.5);
    const estimatedCost = 0.25;

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    expect(result.message).toContain('$0.2500');
    expect(result.message).toContain('$0.2500'); // remaining after (0.5 - 0.25)
  });

  it('should trigger warning at exactly the warn threshold', () => {
    const config = createMockConfig(10.0, 3.0, 0.8);
    const estimatedCost = 5.0; // Will bring to exactly 80%

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    expect(result.message).toContain('Warning');
    expect(result.message).toContain('80.0%');
  });

  it('should not trigger warning just below the warn threshold', () => {
    const config = createMockConfig(100.0, 10.0, 0.8);
    const estimatedCost = 69.0; // Will bring to 79%, just below 80%

    const result = checkBudget(config, estimatedCost);

    expect(result.allowed).toBe(true);
    expect(result.message).not.toContain('Warning');
    expect(result.message).toContain('Budget check passed');
  });
});

describe('formatBudgetCheck', () => {
  it('should return formatted string with all sections', () => {
    const result = formatBudgetCheck(10.0, 3.0, 2.0);

    expect(result).toContain('=== Budget Overview ===');
    expect(result).toContain('Total Budget:');
    expect(result).toContain('Already Spent:');
    expect(result).toContain('Remaining:');
    expect(result).toContain('Estimated Cost:');
    expect(result).toContain('After Generation:');
    expect(result).toContain('Remaining After:');
    expect(result).toContain('======================');
  });

  it('should calculate percentages correctly', () => {
    const result = formatBudgetCheck(100.0, 25.0, 15.0);

    // Already spent: 25 out of 100 = 25%
    expect(result).toContain('Already Spent:      $25.0000 (25.0%)');

    // Remaining: 75 out of 100 = 75%
    expect(result).toContain('Remaining:          $75.0000 (75.0%)');

    // After generation: 40 out of 100 = 40%
    expect(result).toContain('After Generation:   $40.0000 (40.0%)');

    // Remaining after: 60 out of 100 = 60%
    expect(result).toContain('Remaining After:    $60.0000 (60.0%)');
  });

  it('should format monetary values to 4 decimal places', () => {
    const result = formatBudgetCheck(10.5, 3.25, 2.125);

    expect(result).toContain('$10.5000');
    expect(result).toContain('$3.2500');
    expect(result).toContain('$2.1250');
    expect(result).toContain('$7.2500'); // remaining: 10.5 - 3.25
    expect(result).toContain('$5.3750'); // after generation: 3.25 + 2.125
    expect(result).toContain('$5.1250'); // remaining after: 7.25 - 2.125
  });

  it('should include all required fields', () => {
    const result = formatBudgetCheck(10.0, 2.0, 1.0);

    // Check that all fields are present
    expect(result).toMatch(/Total Budget:\s+\$10\.0000/);
    expect(result).toMatch(/Already Spent:\s+\$2\.0000/);
    expect(result).toMatch(/Remaining:\s+\$8\.0000/);
    expect(result).toMatch(/Estimated Cost:\s+\$1\.0000/);
    expect(result).toMatch(/After Generation:\s+\$3\.0000/);
    expect(result).toMatch(/Remaining After:\s+\$7\.0000/);
  });

  it('should handle zero values', () => {
    const result = formatBudgetCheck(10.0, 0.0, 0.0);

    expect(result).toContain('Already Spent:      $0.0000 (0.0%)');
    expect(result).toContain('Remaining:          $10.0000 (100.0%)');
    expect(result).toContain('Estimated Cost:     $0.0000');
    expect(result).toContain('After Generation:   $0.0000 (0.0%)');
    expect(result).toContain('Remaining After:    $10.0000 (100.0%)');
  });

  it('should handle budget fully spent', () => {
    const result = formatBudgetCheck(10.0, 10.0, 0.0);

    expect(result).toContain('Already Spent:      $10.0000 (100.0%)');
    expect(result).toContain('Remaining:          $0.0000 (0.0%)');
    expect(result).toContain('After Generation:   $10.0000 (100.0%)');
    expect(result).toContain('Remaining After:    $0.0000 (0.0%)');
  });

  it('should calculate negative remaining after if estimate exceeds budget', () => {
    const result = formatBudgetCheck(10.0, 8.0, 5.0);

    expect(result).toContain('Remaining:          $2.0000 (20.0%)');
    expect(result).toContain('After Generation:   $13.0000 (130.0%)');
    expect(result).toContain('Remaining After:    $-3.0000 (-30.0%)');
  });
});

describe('updateBudgetSpent', () => {
  const mockConfigPath = '/test/config.yaml';
  const mockConfigContent = `apiKey: test-key
budget:
  total: 10.0
  spent: 2.5
  warnThreshold: 0.8
defaults:
  count: 10
  style: caricature
  format: png
  outputDir: ./output
`;

  const mockParsedConfig: Config = {
    apiKey: 'test-key',
    budget: {
      total: 10.0,
      spent: 2.5,
      warnThreshold: 0.8,
    },
    defaults: {
      count: 10,
      style: 'caricature',
      format: 'png',
      outputDir: './output',
    },
    dimensions: {
      minWidth: 512,
      minHeight: 512,
      maxWidth: 1024,
      maxHeight: 1024,
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('should read config file correctly', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce(mockConfigContent);
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 1.5);

    expect(mockReadFile).toHaveBeenCalledWith(mockConfigPath, 'utf-8');
    expect(mockReadFile).toHaveBeenCalledTimes(1);
  });

  it('should parse YAML correctly', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce(mockConfigContent);
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 1.5);

    expect(mockParseYAML).toHaveBeenCalledWith(mockConfigContent);
    expect(mockParseYAML).toHaveBeenCalledTimes(1);
  });

  it('should update budget.spent by adding amount', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    // Create a fresh config for this test
    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce('updated-yaml');
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 1.5);

    // Check that spent was updated correctly
    expect(freshConfig.budget.spent).toBe(4.0); // 2.5 + 1.5

    // Check that stringify was called with updated config
    expect(mockStringifyYAML).toHaveBeenCalledWith(freshConfig);
  });

  it('should write updated config back to file', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    const updatedYAML = 'updated-yaml-content';
    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce(updatedYAML);
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 1.5);

    expect(mockWriteFile).toHaveBeenCalledWith(
      mockConfigPath,
      updatedYAML,
      'utf-8'
    );
    expect(mockWriteFile).toHaveBeenCalledTimes(1);
  });

  it('should preserve other config values', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    // Create a fresh config for this test
    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce('updated-yaml');
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 1.5);

    // Verify only budget.spent was changed
    expect(freshConfig.apiKey).toBe('test-key');
    expect(freshConfig.budget.total).toBe(10.0);
    expect(freshConfig.budget.warnThreshold).toBe(0.8);
    expect(freshConfig.defaults.count).toBe(10);
    expect(freshConfig.defaults.style).toBe('caricature');
    expect(freshConfig.budget.spent).toBe(4.0); // Only this changed
  });

  it('should handle file read errors gracefully', async () => {
    const mockReadFile = vi.mocked(fs.readFile);

    mockReadFile.mockRejectedValueOnce(new Error('File not found'));

    await expect(updateBudgetSpent(mockConfigPath, 1.5)).rejects.toThrow('File not found');
  });

  it('should handle YAML parse errors gracefully', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);

    mockReadFile.mockResolvedValueOnce('invalid-yaml');
    mockParseYAML.mockImplementationOnce(() => {
      throw new Error('Invalid YAML syntax');
    });

    await expect(updateBudgetSpent(mockConfigPath, 1.5)).rejects.toThrow('Invalid YAML syntax');
  });

  it('should handle file write errors gracefully', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce('updated-yaml');
    mockWriteFile.mockRejectedValueOnce(new Error('Permission denied'));

    await expect(updateBudgetSpent(mockConfigPath, 1.5)).rejects.toThrow('Permission denied');
  });

  it('should handle zero amount correctly', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    // Create a fresh config for this test
    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce('updated-yaml');
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 0.0);

    expect(freshConfig.budget.spent).toBe(2.5); // No change (2.5 + 0.0)
  });

  it('should handle negative amounts (refunds)', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    // Create a fresh config for this test
    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce('updated-yaml');
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, -1.0);

    expect(freshConfig.budget.spent).toBe(1.5); // 2.5 - 1.0
  });

  it('should handle decimal precision correctly', async () => {
    const mockReadFile = vi.mocked(fs.readFile);
    const mockParseYAML = vi.mocked(YAML.parse);
    const mockStringifyYAML = vi.mocked(YAML.stringify);
    const mockWriteFile = vi.mocked(fs.writeFile);

    const freshConfig = JSON.parse(JSON.stringify(mockParsedConfig));
    freshConfig.budget.spent = 0.1;

    mockReadFile.mockResolvedValueOnce(mockConfigContent);
    mockParseYAML.mockReturnValueOnce(freshConfig);
    mockStringifyYAML.mockReturnValueOnce('updated-yaml');
    mockWriteFile.mockResolvedValueOnce(undefined);

    await updateBudgetSpent(mockConfigPath, 0.2);

    // JavaScript floating point: 0.1 + 0.2 = 0.30000000000000004
    expect(freshConfig.budget.spent).toBeCloseTo(0.3, 10);
  });
});
