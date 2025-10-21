/**
 * Manifest utility functions for badge generation
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import { Manifest, ManifestMetadata, ImageResult } from '../types';

/**
 * Creates a manifest object from metadata and image results
 * @param metadata - The metadata for the generation session
 * @param images - Array of image results
 * @returns A complete manifest object
 */
export function createManifest(
  metadata: ManifestMetadata,
  images: ImageResult[]
): Manifest {
  return {
    metadata,
    images,
  };
}

/**
 * Saves a manifest to the output directory as manifest.json
 * @param outputDir - The directory where the manifest should be saved
 * @param manifest - The manifest object to save
 * @throws Error if the directory doesn't exist or write fails
 */
export async function saveManifest(
  outputDir: string,
  manifest: Manifest
): Promise<void> {
  try {
    // Ensure the output directory exists
    await fs.mkdir(outputDir, { recursive: true });

    // Create the manifest file path
    const manifestPath = path.join(outputDir, 'manifest.json');

    // Write the manifest as formatted JSON
    await fs.writeFile(
      manifestPath,
      JSON.stringify(manifest, null, 2),
      'utf-8'
    );
  } catch (error) {
    throw new Error(
      `Failed to save manifest: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}
