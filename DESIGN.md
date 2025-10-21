# Badge Photo Generator - Design Document

## Overview

A Node.js/TypeScript CLI tool (`badge-gen`) that generates caricature-style employee badge photos using AI image generation for test data purposes.

## Core Requirements

### Purpose
- Generate artificial employee badge photos for test data
- Caricature/avatar style (not real photos)
- Headshot framing (head to just below shoulders)
- Suitable for company employee badges

### Key Features
1. Batch generation of multiple images
2. Automatic diversity with gender-based organization
3. Configurable art styles
4. Random dimension variation within bounds
5. Multiple output formats (PNG or JPG)
6. Budget tracking and cost estimation

## Technical Stack

- **Language**: Node.js with TypeScript
- **AI Provider**: Stability AI (with architecture to support additional providers later)
- **CLI Framework**: Commander.js or Yargs
- **Configuration**: YAML config file support

## Architecture

### Project Structure
```
badge-photo-gen/
├── src/
│   ├── cli/
│   │   ├── commands.ts          # CLI command definitions
│   │   └── options.ts            # CLI option parsing
│   ├── providers/
│   │   ├── base.ts               # Abstract provider interface
│   │   ├── stability-ai.ts       # Stability AI implementation
│   │   └── registry.ts           # Provider registry for future expansion
│   ├── generators/
│   │   ├── batch.ts              # Batch generation logic
│   │   └── image.ts              # Single image generation
│   ├── config/
│   │   ├── loader.ts             # YAML config file loader
│   │   ├── styles.ts             # Art style definitions
│   │   └── budget.ts             # Budget tracking
│   ├── utils/
│   │   ├── dimensions.ts         # Dimension randomization
│   │   ├── uuid.ts               # UUID generation
│   │   ├── manifest.ts           # JSON manifest generation
│   │   └── retry.ts              # Exponential backoff retry logic
│   └── index.ts                  # Main entry point
├── ART_STYLES.md                 # Art style documentation
├── DESIGN.md                     # This file
├── badge-gen.config.yaml         # Example config file
└── package.json
```

### Provider Interface (Extensibility)

```typescript
interface ImageProvider {
  name: string;
  generateImage(params: GenerationParams): Promise<ImageResult>;
  estimateCost(count: number): number;
  getSupportedDimensions(): Dimension[];
}

// Future providers can implement this interface
// - StabilityAIProvider (Phase 1)
// - DALLEProvider (Future)
// - MidjourneyProvider (Future)
```

## CLI Interface

### Command Name
`badge-gen`

### Basic Usage Examples

```bash
# Generate 50 images with default settings
badge-gen --count 50

# Specify style and output directory
badge-gen --count 100 --style pixar --output ./my-badges

# Custom dimensions and format
badge-gen --count 25 --style corporate --min-size 1000x900 --max-size 1800x1600 --format jpg

# Use config file with override
badge-gen --config ./custom-config.yaml --count 200
```

### CLI Options

| Option | Alias | Type | Default | Description |
|--------|-------|------|---------|-------------|
| `--count` | `-c` | number | 10 | Number of images to generate |
| `--style` | `-s` | string | bitmoji | Art style preset (see ART_STYLES.md) |
| `--output` | `-o` | string | ./badges | Output directory |
| `--format` | `-f` | string | png | Output format: `png` or `jpg` |
| `--min-size` | | string | 900x800 | Minimum dimensions (WxH) |
| `--max-size` | | string | 2100x1500 | Maximum dimensions (WxH) |
| `--config` | | string | badge-gen.config.yaml | Path to config file |
| `--budget` | `-b` | number | | Set budget limit (in USD) |
| `--dry-run` | | boolean | false | Preview without generating |
| `--api-key` | | string | | Stability AI API key (or from env/config) |

### Configuration File (YAML)

**Location**: `badge-gen.config.yaml` (auto-loaded if exists)

```yaml
# Stability AI API Configuration
api_key: sk-xxxxxxxxxxxxxxxxxxxxx  # Or use STABILITY_API_KEY env var

# Budget Management
budget:
  total: 100.00      # Total budget in USD
  spent: 0.00        # Tracks spending across runs
  warn_threshold: 0.8  # Warn when 80% of budget is used

# Default Generation Settings
defaults:
  count: 50
  style: corporate
  format: png
  output_dir: ./badges

# Dimension Constraints
dimensions:
  min_width: 900
  min_height: 800
  max_width: 2100
  max_height: 1500
  maintain_portrait: true  # Keep portrait aspect ratio

# Retry Configuration
retry:
  max_attempts: 3
  initial_delay_ms: 1000
  max_delay_ms: 10000
  backoff_multiplier: 2

# Gender Distribution
gender:
  male_ratio: 0.5    # Split evenly by default
  female_ratio: 0.5
```

## Output Structure

### Directory Organization

```
badges/                           # Output directory
├── male/                         # Male-presenting images
│   ├── a7f3c2d1-4e5f-6a7b.png
│   ├── b8e4d3c2-5f6a-7b8c.png
│   └── ...
├── female/                       # Female-presenting images
│   ├── c9f5e4d3-6a7b-8c9d.png
│   ├── d0a6f5e4-7b8c-9d0e.png
│   └── ...
└── manifest.json                 # Generation metadata
```

### File Naming Convention

- **Format**: `{uuid}.{format}` (e.g., `a7f3c2d1-4e5f-6a7b.png`)
- **UUID**: Version 4 UUID for unique identification
- **Realistic**: UUIDs simulate real application data patterns

### Manifest File Structure

**File**: `badges/manifest.json`

```json
{
  "metadata": {
    "generated_at": "2025-10-21T10:30:00Z",
    "tool_version": "1.0.0",
    "style": "corporate",
    "total_count": 50,
    "male_count": 25,
    "female_count": 25,
    "format": "png",
    "cost_usd": 0.50
  },
  "images": [
    {
      "id": "a7f3c2d1-4e5f-6a7b",
      "gender": "male",
      "path": "male/a7f3c2d1-4e5f-6a7b.png",
      "dimensions": {
        "width": 1200,
        "height": 1000,
        "requested_min": "900x800",
        "requested_max": "2100x1500",
        "actual_ai_size": "1024x1024"
      },
      "prompt": "Professional headshot portrait in corporate caricature style...",
      "style": "corporate",
      "generated_at": "2025-10-21T10:30:15Z",
      "provider": "stability-ai",
      "model": "stable-diffusion-xl-1024-v1-0"
    }
  ]
}
```

## Image Generation Logic

### Dimension Randomization

1. **Input**: Min (900x800) and Max (2100x1500) bounds
2. **Process**:
   - Calculate random width between min_width and max_width
   - Calculate random height between min_height and max_height
   - Constrain to portrait aspect ratio (height >= width)
   - Snap to Stability AI supported dimensions (e.g., 1024x1024, 512x512, etc.)
3. **Output**: Valid dimension pair for API request

**Stability AI Supported Dimensions**:
- 1024x1024 (square)
- 768x1344 (portrait)
- 640x1536 (tall portrait)
- 1344x768 (landscape - skip for portrait-only)
- 1536x640 (wide landscape - skip for portrait-only)

**Selection Strategy**:
- Filter to portrait-oriented sizes only
- Choose closest match to randomized dimensions
- Prefer larger sizes when multiple options are similar

### Diversity & Randomization

**Gender Distribution**:
- For count=50: 25 male, 25 female (equal split)
- For count=51: 26 male, 25 female (round up)

**Automatic Diversity Attributes** (randomized per image):
- Age appearance (young adult, middle-aged, senior)
- Ethnicity/skin tone (diverse representation)
- Hair style and color
- Facial features (glasses, facial hair, etc.)
- Clothing style (within professional badge context)

**Prompt Construction**:
```
[Base style prompt from ART_STYLES.md]
+ [Gender: male/female presenting]
+ [Random age: young adult/middle-aged/senior]
+ [Random ethnicity: Asian/Black/Caucasian/Hispanic/Middle Eastern/etc.]
+ [Random attributes: glasses/no glasses, beard/clean-shaven, etc.]
+ Common: "professional attire, headshot, shoulders visible, neutral background"
```

## Budget Management

### Budget Tracking

**Storage**: YAML config file (`budget.spent` field)

**Workflow**:
1. Read current budget state from config
2. Calculate estimated cost for requested batch
3. Check if `spent + estimated <= total`
4. If yes: proceed with generation
5. If no: show error and current budget status
6. After each successful generation: update `spent` in config
7. Save config file after each batch

**Cost Calculation**:
- Stability AI pricing: ~$0.002-0.01 per image (varies by model)
- Estimate conservatively: $0.01 per image
- Formula: `estimated_cost = count * cost_per_image`

### Pre-Generation Budget Check

```bash
$ badge-gen --count 100 --style pixar

Budget Check:
  Total Budget:     $100.00
  Already Spent:    $25.50
  Remaining:        $74.50
  Estimated Cost:   $1.00 (100 images × $0.01)
  After Generation: $73.50

Proceed? [Y/n]
```

### Budget Exceeded Example

```bash
$ badge-gen --count 10000

Error: Budget exceeded!
  Total Budget:     $100.00
  Already Spent:    $98.00
  Remaining:        $2.00
  Estimated Cost:   $100.00 (10000 images × $0.01)

You can:
  1. Reduce --count to 200 or less
  2. Increase budget with --budget 200
  3. Reset budget by editing badge-gen.config.yaml
```

### Budget Reload Option

Users can manually edit the config file to reload budget:

```yaml
budget:
  total: 200.00     # Increased from 100
  spent: 98.00      # Preserved
  warn_threshold: 0.8
```

## Error Handling & Retry Logic

### Exponential Backoff Retry

**Retryable Errors**:
- Rate limiting (429 Too Many Requests)
- Temporary API errors (500, 502, 503)
- Network timeouts
- Transient failures

**Non-Retryable Errors**:
- Invalid API key (401)
- Budget exceeded (custom check)
- Invalid parameters (400)
- Permanent API errors

**Retry Strategy**:
```typescript
interface RetryConfig {
  maxAttempts: 3;
  initialDelayMs: 1000;    // 1 second
  maxDelayMs: 10000;       // 10 seconds
  backoffMultiplier: 2;
}

// Attempt 1: immediate
// Attempt 2: wait 1000ms
// Attempt 3: wait 2000ms
// Fail after 3 attempts
```

**Budget-Aware Retry**:
- Before retry: check if budget still available
- If budget exceeded during batch: stop gracefully
- Save progress (manifest with partial results)
- Report which images succeeded/failed

### Progress Reporting

For large batches, show progress:

```bash
$ badge-gen --count 100 --style anime

Generating 100 badge photos...
Budget: $99.00 remaining of $100.00

Progress: [████████████░░░░░░░░] 60/100 (60%)
  Male:   30/50 ✓
  Female: 30/50 ✓
  Failed: 0
  Elapsed: 2m 15s
  Est. remaining: 1m 30s
```

## Art Styles

See `ART_STYLES.md` for complete documentation.

**Phase 1 Styles**:
1. `bitmoji` - Snapchat-style flat cartoon
2. `pixar` - 3D animation quality
3. `corporate` - Professional caricature
4. `vector-art` - Modern geometric illustration
5. `anime` - Japanese animation style
6. `pixel-art` - 8-bit/16-bit retro

## API Integration (Stability AI)

### Authentication

**Priority Order**:
1. CLI flag: `--api-key sk-xxxxx`
2. Environment variable: `STABILITY_API_KEY`
3. Config file: `api_key` field

### API Endpoints

**Primary**: Stability AI REST API
- Endpoint: `https://api.stability.ai/v1/generation/{engine}/text-to-image`
- Engine: `stable-diffusion-xl-1024-v1-0` (default for quality)
- Authentication: `Authorization: Bearer {api_key}`

### Request Example

```typescript
POST https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image

Headers:
  Authorization: Bearer sk-xxxxx
  Content-Type: application/json

Body:
{
  "text_prompts": [
    {
      "text": "Professional headshot portrait in Pixar 3D animation style, middle-aged Asian male, glasses, professional attire, friendly expression, head and shoulders visible, white background, suitable for employee badge",
      "weight": 1
    }
  ],
  "cfg_scale": 7,
  "height": 1024,
  "width": 1024,
  "samples": 1,
  "steps": 30
}
```

## Implementation Phases

### Phase 1: MVP (Core Functionality)
- [x] Design and architecture
- [ ] Project setup (TypeScript, dependencies)
- [ ] Stability AI integration
- [ ] Basic CLI with core options
- [ ] YAML config file support
- [ ] Batch generation with gender distribution
- [ ] UUID-based file naming
- [ ] Directory organization (male/female)
- [ ] Manifest generation
- [ ] 6 art style presets
- [ ] Dimension randomization with portrait constraint
- [ ] Basic error handling

### Phase 2: Polish & Reliability
- [ ] Exponential backoff retry logic
- [ ] Budget tracking and estimation
- [ ] Progress bar for large batches
- [ ] Dry-run mode
- [ ] Comprehensive error messages
- [ ] Input validation
- [ ] Unit tests

### Phase 3: Enhancement
- [ ] Additional art styles
- [ ] Additional AI providers (DALL-E, etc.)
- [ ] More diversity attributes configuration
- [ ] Batch resume capability
- [ ] Performance optimizations (parallel generation)
- [ ] Interactive mode

## Testing Strategy

### Unit Tests
- Dimension randomization logic
- Budget calculation
- UUID generation
- Manifest creation
- Config file parsing
- Retry backoff calculation

### Integration Tests
- Stability AI API integration (mocked)
- File system operations
- End-to-end batch generation

### Manual Testing
- Small batch (10 images) across all styles
- Large batch (100+ images) for performance
- Budget limit scenarios
- Retry scenarios (simulate rate limits)
- Config file variations

## Dependencies (Estimated)

```json
{
  "dependencies": {
    "commander": "^11.0.0",           // CLI framework
    "yaml": "^2.3.0",                 // YAML parsing
    "axios": "^1.6.0",                // HTTP client
    "uuid": "^9.0.0",                 // UUID generation
    "sharp": "^0.33.0",               // Image processing
    "cli-progress": "^3.12.0",        // Progress bars
    "chalk": "^5.3.0"                 // Terminal colors
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.0",
    "ts-node": "^10.9.0",
    "vitest": "^1.0.0"                // Testing framework
  }
}
```

## Open Questions / Future Considerations

1. **Caching**: Should we cache generated images to avoid regenerating identical prompts?
2. **Metadata in Images**: Should we embed metadata in EXIF data?
3. **Batch Parallelization**: Generate multiple images concurrently for speed?
4. **Custom Prompts**: Allow users to provide custom prompt templates?
5. **Web UI**: Future web interface for non-CLI users?
6. **Image Validation**: Check generated images meet quality standards?
7. **Diversity Configuration**: Allow users to specify diversity distribution?

## Success Criteria

The tool is successful when:
- ✓ Generates badge-appropriate caricature photos
- ✓ Supports batch generation of 50+ images reliably
- ✓ Stays within budget constraints
- ✓ Organizes output clearly by gender
- ✓ Provides clear progress and error feedback
- ✓ Easy to configure and use
- ✓ Extensible for future AI providers
