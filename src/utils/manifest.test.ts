/**
 * Unit tests for manifest utility functions
 */

import { describe, test, expect, vi, beforeEach } from 'vitest';
import { createManifest, saveManifest } from './manifest';
import { Manifest, ManifestMetadata, ImageResult } from '../types';

// Mock the fs/promises module
vi.mock('fs/promises', () => ({
  mkdir: vi.fn(),
  writeFile: vi.fn(),
}));

describe('createManifest', () => {
  test('creates proper Manifest structure', () => {
    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 2,
      maleCount: 1,
      femaleCount: 1,
      format: 'png',
      costUsd: 0.5,
    };

    const images: ImageResult[] = [
      {
        id: 'test-uuid-1',
        gender: 'male',
        path: '/output/image1.png',
        dimensions: {
          width: 900,
          height: 800,
          requestedMin: '800x700',
          requestedMax: '1000x900',
          actualAiSize: '900x800',
        },
        prompt: 'A professional headshot',
        style: 'cartoon',
        generatedAt: '2025-10-21T12:00:00Z',
        provider: 'stability-ai',
        model: 'sd3-large',
      },
      {
        id: 'test-uuid-2',
        gender: 'female',
        path: '/output/image2.png',
        dimensions: {
          width: 900,
          height: 800,
          requestedMin: '800x700',
          requestedMax: '1000x900',
          actualAiSize: '900x800',
        },
        prompt: 'A professional headshot',
        style: 'cartoon',
        generatedAt: '2025-10-21T12:00:01Z',
        provider: 'stability-ai',
        model: 'sd3-large',
      },
    ];

    const manifest = createManifest(metadata, images);

    expect(manifest).toEqual({
      metadata,
      images,
    });
    expect(manifest.metadata).toBe(metadata);
    expect(manifest.images).toBe(images);
    expect(manifest.images).toHaveLength(2);
  });

  test('creates manifest with empty images array', () => {
    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 0,
      maleCount: 0,
      femaleCount: 0,
      format: 'png',
      costUsd: 0,
    };

    const manifest = createManifest(metadata, []);

    expect(manifest.metadata).toBe(metadata);
    expect(manifest.images).toEqual([]);
  });
});

describe('saveManifest', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('writes JSON file correctly', async () => {
    const fs = await import('fs/promises');
    const path = await import('path');

    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 1,
      maleCount: 1,
      femaleCount: 0,
      format: 'png',
      costUsd: 0.25,
    };

    const images: ImageResult[] = [
      {
        id: 'test-uuid-1',
        gender: 'male',
        path: '/output/image1.png',
        dimensions: {
          width: 900,
          height: 800,
          requestedMin: '800x700',
          requestedMax: '1000x900',
          actualAiSize: '900x800',
        },
        prompt: 'A professional headshot',
        style: 'cartoon',
        generatedAt: '2025-10-21T12:00:00Z',
        provider: 'stability-ai',
        model: 'sd3-large',
      },
    ];

    const manifest: Manifest = { metadata, images };
    const outputDir = '/test/output';

    await saveManifest(outputDir, manifest);

    // Verify mkdir was called with recursive option
    expect(fs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });

    // Verify writeFile was called with correct path and content
    expect(fs.writeFile).toHaveBeenCalledWith(
      path.join(outputDir, 'manifest.json'),
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  });

  test('JSON is properly formatted with 2-space indentation', async () => {
    const fs = await import('fs/promises');

    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 1,
      maleCount: 1,
      femaleCount: 0,
      format: 'png',
      costUsd: 0.25,
    };

    const manifest: Manifest = { metadata, images: [] };
    const outputDir = '/test/output';

    await saveManifest(outputDir, manifest);

    const writeFileCall = vi.mocked(fs.writeFile).mock.calls[0];
    const jsonContent = writeFileCall[1] as string;

    // Verify JSON has 2-space indentation
    expect(jsonContent).toContain('  "metadata"');
    expect(jsonContent).toContain('    "generatedAt"');

    // Verify it's valid JSON
    const parsed = JSON.parse(jsonContent);
    expect(parsed).toEqual(manifest);
  });

  test('creates directory if it does not exist', async () => {
    const fs = await import('fs/promises');

    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 0,
      maleCount: 0,
      femaleCount: 0,
      format: 'png',
      costUsd: 0,
    };

    const manifest: Manifest = { metadata, images: [] };
    const outputDir = '/new/directory';

    await saveManifest(outputDir, manifest);

    expect(fs.mkdir).toHaveBeenCalledWith(outputDir, { recursive: true });
  });

  test('throws error if writeFile fails', async () => {
    const fs = await import('fs/promises');

    vi.mocked(fs.writeFile).mockRejectedValueOnce(new Error('Write failed'));

    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 0,
      maleCount: 0,
      femaleCount: 0,
      format: 'png',
      costUsd: 0,
    };

    const manifest: Manifest = { metadata, images: [] };

    await expect(saveManifest('/test/output', manifest)).rejects.toThrow(
      'Failed to save manifest: Write failed'
    );
  });

  test('throws error if mkdir fails', async () => {
    const fs = await import('fs/promises');

    vi.mocked(fs.mkdir).mockRejectedValueOnce(new Error('Permission denied'));

    const metadata: ManifestMetadata = {
      generatedAt: '2025-10-21T12:00:00Z',
      toolVersion: '1.0.0',
      style: 'cartoon',
      totalCount: 0,
      maleCount: 0,
      femaleCount: 0,
      format: 'png',
      costUsd: 0,
    };

    const manifest: Manifest = { metadata, images: [] };

    await expect(saveManifest('/test/output', manifest)).rejects.toThrow(
      'Failed to save manifest: Permission denied'
    );
  });
});
