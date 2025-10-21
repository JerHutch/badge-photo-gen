# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

`badge-gen` is a CLI tool that generates caricature-style employee badge photos using AI (Stability AI) for test data purposes. It generates batch images with automatic diversity, gender-based organization, budget tracking, and multiple art style presets.

## Core Architecture

### Provider Pattern for Extensibility

The codebase uses an abstract provider pattern to support multiple AI image generation services:

- **`src/providers/base.ts`**: Abstract `BaseImageProvider` class defining the interface
- **`src/providers/stability-ai.ts`**: Stability AI implementation (currently the only provider)
- Future providers (DALL-E, Midjourney, etc.) can be added by extending `BaseImageProvider`

Key provider methods:
- `generateImage()`: Generate a single image
- `estimateCost()`: Calculate cost for batch generation
- `getSupportedDimensions()`: Return AI-specific supported image dimensions

### Configuration Cascade

Configuration sources merge in this priority order (highest priority first):
1. CLI flags (`--api-key`, `--count`, `--style`, etc.)
2. YAML config file (`badge-gen.config.yaml` or custom path via `--config`)
3. Environment variables (`STABILITY_API_KEY`)
4. Hard-coded defaults

The `src/config/loader.ts` handles this merging logic.

### Budget Tracking System

Budget tracking prevents accidental overspending:
- Budget state stored in `badge-gen.config.yaml` (`budget.spent` field)
- Before generation: checks if `spent + estimated <= total`
- After generation: updates `spent` field in YAML file
- Uses `src/config/budget.ts` for budget checks and updates

**Important**: Budget updates write back to the YAML config file after each successful batch.

### Batch Generation Flow

The main generation logic in `src/generators/batch.ts` follows this sequence:

1. **Budget Check**: Load config, estimate cost, verify budget allows generation
2. **Gender Distribution**: Split count evenly (e.g., 50 images → 25 male, 25 female)
3. **Directory Setup**: Create `output/male/` and `output/female/` directories
4. **Image Generation Loop**:
   - For each image:
     - Determine gender based on index
     - Generate random diversity attributes (age, ethnicity, features)
     - Build prompt from style template + diversity attributes
     - Randomize dimensions within constraints
     - Call provider with retry logic
     - Save image as UUID-named file (e.g., `a7f3c2d1-4e5f-6a7b.png`)
     - Add result to manifest
5. **Manifest Creation**: Generate `manifest.json` with metadata and image details
6. **Budget Update**: Write actual cost back to config file

### Diversity Attributes

Images automatically include diverse representation through randomized attributes:
- **Age**: young adult, middle-aged, senior
- **Ethnicity**: Asian, Black, Caucasian, Hispanic, Middle Eastern, South Asian
- **Gender-specific features**:
  - Male: with/without glasses, beard, mustache, clean-shaven
  - Female: with/without glasses, long/short hair

See `generateDiversityAttributes()` in `src/generators/batch.ts`.

### Dimension Handling

The tool randomizes dimensions within constraints while matching AI provider capabilities:

1. Parse min/max sizes from CLI (e.g., `900x800` to `2100x1500`)
2. Generate random width/height within bounds
3. Constrain to portrait aspect ratio (height ≥ width)
4. Snap to provider's supported dimensions (Stability AI supports specific sizes like 1024×1024, 768×1344, etc.)

Implementation in `src/utils/dimensions.ts`.

### Retry Logic with Exponential Backoff

Network failures and rate limits are handled with exponential backoff:
- Configurable via `retry` section in YAML config
- Default: 3 attempts, starting at 1s delay, doubling each retry
- Retries on: rate limits (429), server errors (500-503), network timeouts
- No retry on: invalid API key (401), invalid params (400)

See `src/utils/retry.ts`.

## Common Development Tasks

### Build and Run

```bash
# Build TypeScript to JavaScript
npm run build

# Run in development (uses ts-node, no build needed)
npm run dev -- --count 5 --style pixar

# Run production build
npm start -- --count 10

# Link for global usage
npm link
badge-gen --count 10
```

### Testing

```bash
# Run all tests with Vitest
npm test

# Run specific test file
npm test src/utils/dimensions.test.ts

# Run tests in watch mode
npm test -- --watch
```

Test files use the pattern `*.test.ts` and are colocated with source files (e.g., `dimensions.ts` has `dimensions.test.ts`).

### Code Quality

```bash
# Lint TypeScript code
npm run lint

# Format code with Prettier
npm run format
```

### Configuration for Development

For local development, create `badge-gen.config.local.yaml` (gitignored):

```yaml
api_key: sk-YOUR_DEV_API_KEY
budget:
  total: 5.00
  spent: 0
defaults:
  count: 3  # Small batches for testing
  style: corporate
```

Alternatively, use `.env.local`:
```
STABILITY_API_KEY=sk-YOUR_DEV_API_KEY
```

## Type Definitions

All TypeScript types are centralized in `src/types/index.ts`. Key types:

- **`Config`**: Full YAML configuration structure
- **`GenerationParams`**: Parameters for batch generation (merged from config + CLI)
- **`ImageProvider`**: Interface for AI providers
- **`ImageResult`**: Metadata for a generated image
- **`Manifest`**: Output manifest structure

## Art Styles

Six preset styles defined in `src/config/styles.ts`:
1. **bitmoji**: Flat cartoon style (Snapchat-like)
2. **pixar**: 3D-rendered animation
3. **corporate**: Professional caricature
4. **vector-art**: Clean geometric illustration
5. **anime**: Japanese animation style
6. **pixel-art**: Retro 8-bit/16-bit

Each style has a `promptTemplate` that gets combined with diversity attributes during generation.

See `ART_STYLES.md` for detailed style documentation.

## Output Structure

Generated images are organized by gender:

```
badges/
├── male/
│   ├── a7f3c2d1-4e5f-6a7b.png
│   └── ...
├── female/
│   ├── c9f5e4d3-6a7b-8c9d.png
│   └── ...
└── manifest.json
```

The `manifest.json` contains:
- **metadata**: generation timestamp, style, counts, cost
- **images**: array of image details (prompt, dimensions, path, etc.)

## Logging

Winston logger configured in `src/utils/logger.ts`:
- Development: colorized console output with timestamps
- Production: JSON structured logs
- Log level determined by `NODE_ENV`

Use `logger.info()`, `logger.error()`, etc. throughout codebase.

## API Integration Notes

**Stability AI specifics**:
- Endpoint: `https://api.stability.ai/v1/generation/{engine}/text-to-image`
- Default engine: `stable-diffusion-xl-1024-v1-0`
- Authentication: Bearer token in `Authorization` header
- Returns: Base64-encoded PNG image
- Cost: ~$0.002-0.01 per image (conservative estimate: $0.01)

Images are received as base64, converted to Buffer, then processed with Sharp for format conversion (PNG or JPG).

## Important Implementation Details

1. **UUID Generation**: Uses `uuid` package v4 for realistic test data filenames
2. **Image Processing**: Sharp library handles format conversion and dimension handling
3. **Config Updates**: Budget tracking writes back to YAML, so config file must be writable
4. **Gender Distribution**: Always rounds males up (e.g., 51 images → 26 male, 25 female)
5. **Error Handling**: Individual image failures don't stop batch; tool continues and reports partial success
6. **Manifest Cleanup**: Base64 data removed from results before saving manifest (only metadata retained)

## Adding a New AI Provider

To add a new provider (e.g., DALL-E):

1. Create `src/providers/dalle.ts` extending `BaseImageProvider`
2. Implement required methods:
   - `generateImage()`: Call DALL-E API
   - `estimateCost()`: Calculate DALL-E pricing
   - `getSupportedDimensions()`: Return DALL-E dimension options
3. Update imports in `src/generators/batch.ts` to support provider selection
4. (Optional) Add provider selection to CLI options

See `src/providers/stability-ai.ts` as reference implementation.

## Files to Modify for Common Changes

- **Add new art style**: `src/config/styles.ts` + `ART_STYLES.md`
- **Change diversity attributes**: `src/generators/batch.ts` (modify attribute arrays)
- **Adjust budget calculations**: `src/config/budget.ts`
- **Add CLI option**: `src/index.ts` (Commander.js definitions)
- **Change default config**: `badge-gen.config.yaml` example file
- **Modify retry behavior**: `src/utils/retry.ts`
- **Update image dimensions**: `src/utils/dimensions.ts`
