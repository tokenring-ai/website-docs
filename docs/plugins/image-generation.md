# Image Generation

## Overview

The Image Generation plugin provides AI-powered image creation capabilities for the Token Ring ecosystem. It integrates with various AI models to generate images based on text prompts, adds metadata using EXIF data, and enables search through generated images using keyword similarity.

## Key Features

- **AI Image Generation**: Generate images using configurable AI models (DALL-E 3, etc.)
- **EXIF Metadata**: Add keywords and descriptions to image metadata using exiftool-vendored
- **Local Image Search**: Search through generated images by keyword similarity
- **Automatic Indexing**: Maintain an index of generated images with metadata (dimensions, keywords, MIME type)
- **Directory Management**: Configurable output directories for image storage
- **Aspect Ratio Support**: Generate images in square (1024x1024), tall (1024x1536), or wide (1536x1024) formats
- **Model Flexibility**: Support for multiple AI image generation models through the model registry
- **Keyword-Based Similarity Search**: Implements custom similarity algorithm matching keywords from image metadata

## Installation

```bash
bun add @tokenring-ai/image-generation
```

## Core Components

### ImageGenerationService

Main service managing image generation and indexing functionality.

**Service Name:** `ImageGenerationService`

**Description:** Image generation with configurable output directories

**Constructor:**

```typescript
constructor(config: {
  outputDirectory: string,
  model: string
})
```

**Methods:**

#### getOutputDirectory()

Get the configured output directory for generated images.

```typescript
getOutputDirectory(): string
```

**Returns:** The configured output directory path

#### getModel()

Get the configured image generation model.

```typescript
getModel(): string
```

**Returns:** The configured image generation model name

#### addToIndex()

Add an image entry to the index with EXIF metadata.

```typescript
async addToIndex(
  directory: string,
  filename: string,
  mimeType: string,
  width: number,
  height: number,
  keywords: string[],
  agent: Agent
): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `directory` | `string` | Output directory path |
| `filename` | `string` | Image filename |
| `mimeType` | `string` | Image MIME type |
| `width` | `number` | Image width in pixels |
| `height` | `number` | Image height in pixels |
| `keywords` | `string[]` | Array of keywords to add to metadata |
| `agent` | `Agent` | Agent instance for file operations |

#### reindex()

Regenerate the image index from existing files in the output directory by scanning all images and reading their metadata.

```typescript
async reindex(directory: string, agent: Agent): Promise<void>
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `directory` | `string` | Output directory path |
| `agent` | `Agent` | Agent instance for file operations |

**Behavior:**

- Scans directory for image files (jpg, jpeg, png, webp)
- Reads EXIF metadata from each file
- Updates image_index.json with metadata entries
- Logs progress and errors

## Services

The package provides the following service:

### ImageGenerationService

Core service for image generation and indexing functionality.

**Registration:**

```typescript
app.addServices(new ImageGenerationService(config.imageGeneration));
```

**Configuration:**

```typescript
{
  outputDirectory: string;  // Base directory for storing generated images
  model: string;            // Default AI model for image generation
}
```

## Tools

The package provides the following tools:

### image_generate

Generate an AI image with configurable parameters and save it to the output directory with EXIF metadata.

**Tool Definition:**

```typescript
const image_generate = {
  name: "image_generate",
  displayName: "ImageGeneration/generateImage",
  description: "Generate an AI image and save it to a configured output directory",
  inputSchema: {
    prompt: z.string().describe("Description of the image to generate"),
    aspectRatio: z.enum(["square", "tall", "wide"]).default("square").optional(),
    outputDirectory: z.string().describe("Output directory (will prompt if not provided)").optional(),
    model: z.string().describe("Image generation model to use").optional(),
    keywords: z.array(z.string()).describe("Keywords to add to image EXIF/IPTC metadata").optional(),
  }
};
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `prompt` | `string` | Description of the image to generate (required) |
| `aspectRatio` | `"square" \| "tall" \| "wide"` | Image aspect ratio: square (1024x1024), tall (1024x1536), or wide (1536x1024). Default: "square" |
| `outputDirectory` | `string` | Override output directory (optional) |
| `model` | `string` | Override default image generation model (optional) |
| `keywords` | `string[]` | Keywords to add to image EXIF/IPTC metadata (optional) |

**Response:**

```typescript
{
  type: "json",
  data: {path: string}
}
```

**Example:**

```typescript
// Generate a landscape image
const result = await agent.useTool("image_generate", {
  prompt: "A beautiful mountain landscape with a lake at sunset",
  aspectRatio: "wide",
  keywords: ["landscape", "nature", "mountains", "lake", "sunset"]
});

console.log(result.data.path); // ./images/generated/abc123.png
```

### image_search

Search for generated images based on keyword similarity using a custom similarity algorithm that matches query terms against image keywords from the index.

**Similarity Algorithm:**

- Exact matches receive a score of 1.0
- Partial matches (one contains the other) receive a score of 0.8
- Word-based matching for partial matches with proportional scoring
- Results sorted by similarity score in descending order

**Tool Definition:**

```typescript
const image_search = {
  name: "image_search",
  displayName: "ImageGeneration/searchImages",
  description: "Search for images in the index based on keyword similarity",
  inputSchema: {
    query: z.string().describe("Search query to match against image keywords"),
    limit: z.number().int().positive().default(10).describe("Maximum number of results to return").optional(),
  }
};
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `query` | `string` | Search query to match against image keywords (required) |
| `limit` | `number` | Maximum number of results to return. Default: 10 (optional) |

**Response:**

```typescript
{
  type: "json",
  data: {
    results: Array<{
      filename: string,
      path: string,
      score: number,
      mimeType: string,
      width: number,
      height: number,
      keywords: string[]
    }>,
    message: string
  }
}
```

**Example:**

```typescript
// Search for sunset-related images
const searchResults = await agent.useTool("image_search", {
  query: "sunset landscape",
  limit: 3
});

for (const image of searchResults.data.results) {
  console.log(`${image.filename} (score: ${image.score})`);
  console.log(`  Keywords: ${image.keywords.join(", ")}`);
  console.log(`  Dimensions: ${image.width}x${image.height}`);
}
```

## Chat Commands

### /image

Manage image generation and indexing.

**Usage:**

```bash
/image reindex
```

**Subcommands:**

#### reindex

Regenerate the image index by scanning all images and reading their metadata.

```bash
/image reindex
```

This command:
1. Scans the output directory for image files (jpg, jpeg, png, webp)
2. Reads EXIF metadata from each file
3. Rebuilds the index with metadata (filename, MIME type, dimensions, keywords)

**Example:**

```bash
/image reindex
```

**Output:**

```
Reindexing images in ./images/generated...
Reindexed 15 images
```

## Configuration

### Plugin Configuration

Configure the image generation plugin in your application config:

```typescript
import {z} from "zod";

const config = {
  imageGeneration: {
    outputDirectory: "./images/generated",
    model: "dall-e-3"
  }
};
```

### Configuration Schema

The plugin uses the following configuration schema:

```typescript
import {ImageGenerationConfigSchema} from "@tokenring-ai/image-generation";

// Schema structure
ImageGenerationConfigSchema = z.object({
  outputDirectory: z.string(),
  model: z.string(),
});

const packageConfigSchema = z.object({
  imageGeneration: ImageGenerationConfigSchema.optional(),
});
```

**Schema Properties:**

| Property | Type | Description |
|----------|------|-------------|
| `outputDirectory` | `string` | Base directory for storing generated images |
| `model` | `string` | Default AI model for image generation |

### Agent Configuration

The image generation service provides configuration options for agents:

```typescript
// ImageGenerationService configuration options
{
  outputDirectory: string;  // Base directory for storing generated images
  model: string;            // Default AI model for image generation
}
```

## Integration

### Service Registration

The ImageGenerationService is automatically registered by the plugin when configured:

```typescript
app.addServices(new ImageGenerationService(config.imageGeneration));
```

### Tool Registration

The image generation and search tools are registered via the ChatService:

```typescript
app.waitForService(ChatService, chatService =>
  chatService.addTools({
    generateImage,
    searchImages
  })
);
```

### Command Registration

The `/image` command is registered via the AgentCommandService:

```typescript
app.waitForService(AgentCommandService, agentCommandService =>
  agentCommandService.addAgentCommands({
    image
  })
);
```

### Model Registry Integration

The package uses the AI client's model registry for image generation:

```typescript
const imageClient = await imageModelRegistry.getClient(imageService.getModel());
const [imageResult] = await imageClient.generateImage({prompt, size, n: 1}, agent);
```

## Usage Examples

### Basic Image Generation

```typescript
// Generate a landscape image
const result = await agent.useTool("image_generate", {
  prompt: "A beautiful mountain landscape with a lake at sunset",
  aspectRatio: "wide",
  keywords: ["landscape", "nature", "mountains", "lake", "sunset"]
});

console.log(result.data.path); // ./images/generated/abc123.png
```

### Searching Generated Images

```typescript
// Search for sunset-related images
const searchResults = await agent.useTool("image_search", {
  query: "sunset landscape",
  limit: 3
});

for (const image of searchResults.data.results) {
  console.log(`${image.filename} (score: ${image.score})`);
  console.log(`  Keywords: ${image.keywords.join(", ")}`);
  console.log(`  Dimensions: ${image.width}x${image.height}`);
}
```

### Rebuilding the Image Index

```typescript
// Manually rebuild the image index
await agent.runCommand("/image reindex");
```

### Complete Workflow

```typescript
// Generate an image
const generateResult = await agent.useTool("image_generate", {
  prompt: "A cozy coffee shop interior",
  aspectRatio: "tall",
  keywords: ["coffee", "interior", "cozy", "cafe"]
});

// Search for it later
const searchResult = await agent.useTool("image_search", {
  query: "coffee cafe interior",
  limit: 5
});

console.log(searchResult.data.message);
// Found 2 images matching "coffee cafe interior"
```

## Best Practices

1. **Use Descriptive Prompts**: Write detailed, descriptive prompts for better image results
2. **Add Keywords**: Include relevant keywords in the keywords parameter for better searchability
3. **Choose Appropriate Aspect Ratios**: Select the aspect ratio that best fits your use case
4. **Monitor Index Size**: Regularly check and rebuild the image index for optimal performance
5. **Handle Errors Gracefully**: The package includes comprehensive error handling for common scenarios

## Error Handling

The package includes comprehensive error handling:

- **Prompt Validation**: Ensures prompt is provided for image generation
- **File Operations**: Proper error handling for file read/write operations
- **Metadata Handling**: Graceful handling of EXIF metadata errors
- **Index Management**: Error handling for index file operations
- **Model Availability**: Proper error handling when AI models are unavailable
- **Search Errors**: Fallback for failed index parsing with warnings

### Common Errors

| Error | Description | Solution |
|-------|-------------|----------|
| `Prompt is required` | Missing prompt parameter | Provide a prompt string |
| `No index found at {path}` | Index file doesn't exist | Run `/image reindex` first |
| `Failed to read metadata for {file}` | EXIF read error (non-fatal) | Continues processing other files |

## Performance Considerations

- **Efficient Indexing**: Optimized metadata reading and index building
- **Similarity Search**: Simple keyword-based scoring with early termination
- **Memory Management**: Proper resource cleanup for file operations
- **Index Format**: Line-delimited JSON for efficient appending
- **Batch Processing**: Index rebuilding processes files in batches
- **Metadata Caching**: EXIF metadata read once per file during indexing

## State Management

The package does not require any state slices. All state is managed through file system operations:

- **Image Index**: Maintained as `image_index.json` in the output directory
- **Index Format**: Line-delimited JSON with entries for each image
- **Metadata Storage**: EXIF data stored in image files themselves
- **No Agent State**: No agent-specific state management required

## Package Structure

```
pkg/image-generation/
├── index.ts                     # Package exports (ImageGenerationConfigSchema, ImageGenerationService)
├── plugin.ts                    # Plugin integration logic and configuration schema
├── ImageGenerationService.ts    # Core service implementation
├── tools.ts                     # Tool exports
├── commands.ts                  # Chat command exports
├── commands/
│   └── image.ts                 # /image command implementation
├── tools/
│   ├── generateImage.ts         # image_generate tool implementation
│   └── searchImages.ts          # image_search tool implementation
├── package.json                 # Package metadata
├── vitest.config.ts             # Test configuration
└── README.md                    # Package documentation
```

## Dependencies

### Production Dependencies

- `@tokenring-ai/agent` (0.2.0) - Agent orchestration system
- `@tokenring-ai/app` (0.2.0) - Application framework
- `@tokenring-ai/chat` (0.2.0) - Chat service integration
- `@tokenring-ai/filesystem` (0.2.0) - File system operations
- `@tokenring-ai/ai-client` (0.2.0) - AI client and model registry
- `exiftool-vendored` (^35.15.1) - EXIF metadata processing
- `uuid` (^13.0.0) - Unique ID generation
- `zod` (^4.3.6) - Schema validation

### Development Dependencies

- `vitest` (^4.1.1) - Testing framework
- `typescript` (^6.0.2) - TypeScript compiler

## Testing

Run tests with Vitest:

```bash
# Run all tests
bun test

# Run tests in watch mode
bun test --watch

# Run tests with coverage
bun test --coverage
```

### Test Coverage

- **Unit Tests**: Tool execution, similarity algorithm, and service methods
- **Integration Tests**: End-to-end workflows including image generation and search
- **Mock Testing**: File system operations and EXIF metadata handling

## Related Components

- `@tokenring-ai/agent` - Agent system for tool and command integration
- `@tokenring-ai/app` - Application framework for service registration
- `@tokenring-ai/chat` - Chat service for tool execution
- `@tokenring-ai/filesystem` - File system service for image storage
- `@tokenring-ai/ai-client` - AI model registry for image generation

## License

MIT License - see `LICENSE` file for details.
