# Badge Photo Generator

A CLI tool to generate caricature-style employee badge photos using AI for test data.

## Features

- Generate batch employee badge photos using AI
- Multiple art styles (bitmoji, pixar, corporate, vector-art, anime, pixel-art)
- Automatic diversity with gender-based organization
- Budget tracking to control costs
- Configurable dimensions and output formats
- UUID-based file naming for realistic test data

## Prerequisites

- Node.js >= 18.0.0
- npm or yarn
- Stability AI API key ([Get one here](https://platform.stability.ai/account/keys))

## Installation

```bash
# Clone the repository
git clone <repository-url>
cd badge-photo-gen

# Install dependencies
npm install

# Build the project
npm run build

# (Optional) Link for global usage
npm link
```

## Configuration

### Option 1: Config File (Recommended)

Copy the example config file and add your API key:

```bash
cp badge-gen.config.yaml badge-gen.config.local.yaml
```

Edit `badge-gen.config.local.yaml` and set your API key:

```yaml
api_key: sk-YOUR_STABILITY_AI_API_KEY_HERE
```

### Option 2: Environment Variable

```bash
export STABILITY_API_KEY=sk-YOUR_STABILITY_AI_API_KEY_HERE
```

### Option 3: CLI Flag

```bash
badge-gen --api-key sk-YOUR_STABILITY_AI_API_KEY_HERE --count 10
```

## Usage

### Basic Usage

```bash
# Generate 10 images with default settings
badge-gen

# Generate 50 images in pixar style
badge-gen --count 50 --style pixar

# Generate 100 images with custom dimensions
badge-gen --count 100 --min-size 1000x900 --max-size 1800x1600
```

### Advanced Usage

```bash
# Use custom config file
badge-gen --config ./my-config.yaml --count 25

# Generate JPG images instead of PNG
badge-gen --count 50 --format jpg

# Preview without generating (dry run)
badge-gen --count 100 --dry-run

# Set budget limit
badge-gen --budget 50 --count 500
```

## CLI Options

| Option | Alias | Description | Default |
|--------|-------|-------------|---------|
| `--count` | `-c` | Number of images to generate | `5` |
| `--style` | `-s` | Art style preset | `bitmoji` |
| `--output` | `-o` | Output directory | `./badges` |
| `--format` | `-f` | Output format (png or jpg) | `png` |
| `--min-size` | | Minimum dimensions (WxH) | `900x800` |
| `--max-size` | | Maximum dimensions (WxH) | `2100x1500` |
| `--config` | | Path to config file | `badge-gen.config.yaml` |
| `--budget` | `-b` | Budget limit in USD | (from config) |
| `--dry-run` | | Preview without generating | `false` |
| `--api-key` | | Stability AI API key | (from config/env) |

## Art Styles

Available styles (see [ART_STYLES.md](./ART_STYLES.md) for details):

- **bitmoji**: Flat colors, simplified features (like Snapchat)
- **pixar**: 3D-rendered cartoon with expressive features
- **corporate**: Professional caricature, business-appropriate
- **vector-art**: Clean geometric illustration
- **anime**: Japanese animation style
- **pixel-art**: Retro 8-bit/16-bit style

## Output Structure

Generated images are organized by gender:

```
badges/
├── male/
│   ├── a7f3c2d1-4e5f-6a7b.png
│   ├── b8e4d3c2-5f6a-7b8c.png
│   └── ...
├── female/
│   ├── c9f5e4d3-6a7b-8c9d.png
│   ├── d0a6f5e4-7b8c-9d0e.png
│   └── ...
└── manifest.json
```

The `manifest.json` file contains metadata about all generated images:

```json
{
  "metadata": {
    "generated_at": "2025-10-21T10:30:00Z",
    "style": "corporate",
    "total_count": 50,
    "male_count": 25,
    "female_count": 25,
    "format": "png",
    "cost_usd": 0.50
  },
  "images": [...]
}
```

## Budget Management

The tool tracks spending to prevent accidental overspending:

- Set budget in config file or with `--budget` flag
- Spending is tracked in the config file
- Shows estimated cost before generation
- Prevents generation if budget would be exceeded
- Budget can be reloaded by editing the config file

Example budget check:

```
Budget Check:
  Total Budget:     $100.00
  Already Spent:    $25.50
  Remaining:        $74.50
  Estimated Cost:   $1.00 (100 images × $0.01)
  After Generation: $73.50

Proceed? [Y/n]
```

## Development

### Project Structure

```
badge-photo-gen/
├── src/
│   ├── providers/        # AI provider implementations
│   ├── generators/       # Image generation logic
│   ├── config/           # Configuration and styles
│   ├── utils/            # Utility functions
│   ├── types/            # TypeScript type definitions
│   └── index.ts          # CLI entry point
├── ART_STYLES.md         # Art style documentation
├── DESIGN.md             # Design document
└── README.md             # This file
```

### Scripts

```bash
# Build TypeScript to JavaScript
npm run build

# Run in development mode (with ts-node)
npm run dev

# Run tests
npm test

# Lint code
npm run lint

# Format code
npm run format
```

### Adding New AI Providers

The tool is designed to support multiple AI providers. To add a new provider:

1. Create a new class in `src/providers/` extending `BaseImageProvider`
2. Implement the required methods: `generateImage()`, `estimateCost()`, `getSupportedDimensions()`
3. Update `src/generators/batch.ts` to import and use the new provider

See `src/providers/stability-ai.ts` for reference implementation.

## Cost Estimates

Stability AI pricing (approximate):
- ~$0.002 - $0.01 per image depending on model and size
- Conservative estimate: **$0.01 per image**
- 100 images ≈ $1.00
- 1,000 images ≈ $10.00

Always check current [Stability AI pricing](https://platform.stability.ai/pricing) for accurate costs.

## Troubleshooting

### API Key Issues

```
Error: API key is required
```

**Solution**: Set your API key via config file, environment variable, or `--api-key` flag.

### Budget Exceeded

```
Error: Budget exceeded!
```

**Solution**: Increase budget in config file or use `--budget` flag to set a higher limit.

### Invalid Style

```
Error: Unknown style: xyz
```

**Solution**: Use one of the available styles: `bitmoji`, `pixar`, `corporate`, `vector-art`, `anime`, `pixel-art`

## License

MIT

## Contributing

Contributions welcome! Please read the design document ([DESIGN.md](./DESIGN.md)) before contributing.

## Support

For issues or questions, please open an issue on the repository.
