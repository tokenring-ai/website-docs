# Image Generation Plugin

Image generation with configurable output directories and AI model integration.

## Overview

The `@tokenring-ai/image-generation` package provides image generation capabilities with support for various AI models and configurable output directories. It integrates with the Token Ring ecosystem to generate images from text prompts, manage the resulting files in a structured manner, and includes comprehensive search and indexing functionality.

## Key Features

- **AI Model Integration**: Support for multiple image generation models through model registry
- **Configurable Output**: Customizable image output directories with automatic file organization
- **File Management**: Automatic file organization, metadata handling with exiftool-vendored
- **Tool Integration**: Chat tools for interactive image generation and searching
- **Command Interface**: Chat commands for image generation workflows and reindexing
- **Metadata Extraction**: EXIF metadata handling with exiftool-vendored
- **Indexing System**: Automatic image indexing for organization and searching
- **Search Functionality**: Keyword-based image search with similarity scoring

## Core Components

### ImageGenerationService

Central service for image generation operations.

**Key Methods:**
- `getOutputDirectory()`: Returns the configured output directory
- `getModel()`: Returns the configured default model
- `addToIndex(directory: string, filename: string, mimeType: string, width: number, height: number, keywords: string[], agent: Agent)`: Adds image metadata to index file
- `reindex(directory: string, agent: Agent)`: Reindexes existing images with metadata extraction

### Tools

#### generateImage

Generates AI images from text prompts and saves them to the configured output directory.

**Input Schema:**
```typescript
z.object({
  prompt: z.string().describe("Description of the image to generate"),
  aspectRatio: z.enum(["square", "tall", "wide"]).default("square").optional(),
  outputDirectory: z.string().describe("Output directory (will prompt if not provided)").optional(),
  model: z.string().describe("Image generation model to use").optional(),
  keywords: z.array(z.string()).describe("Keywords to add to image EXIF/IPTC metadata").optional(),
});
```

**Description:** Generate an AI image and save it to a configured output directory with EXIF metadata.

**Usage:**
```typescript
import { generateImage } from '@tokenring-ai/image-generation';

const imageResult = await generateImage.execute(
  {
    prompt: 'A futuristic cityscape with flying cars and neon lights',
    aspectRatio: 'wide',
    keywords: ['futuristic', 'cityscape', 'sci-fi']
  },
  agent
);

console.log(`Image generated: ${imageResult.path}`);
```

#### searchImages

Search for images in the index based on keyword similarity.

**Input Schema:**
```typescript
z.object({
  query: z.string().describe("Search query to match against image keywords"),
  limit: z.number().int().positive().default(10).describe("Maximum number of results to return").optional(),
});
```

**Description:** Search for images in the index based on keyword similarity.

**Usage:**
```typescript
import { searchImages } from '@tokenring-ai/image-generation';

const searchResult = await searchImages.execute(
  {
    query: 'futuristic city',
    limit: 5
  },
  agent
);

console.log(`Found ${searchResult.results.length} matching images`);
```

### Chat Commands

#### /image

Interactive command for image generation management.

**Subcommands:**
- `/image reindex` - Regenerate the image_index.json file in the image directory by scanning all images and reading their metadata

**Usage:**
```bash
/image reindex
```

**Description:** Reindex images to update the image index with current metadata.

## Usage Examples

### Programmatic Usage

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ImageGenerationService } from '@tokenring-ai/image-generation';

const agent = new Agent();
const imageService = new ImageGenerationService({
  outputDirectory: './generated-images',
  model: 'gemini-1.5-flash-image'
});

// Generate an image
const imageResult = await agent.chat.executeTool('image_generate', {
  prompt: 'A serene mountain landscape with a lake at sunset',
  aspectRatio: 'tall',
  keywords: ['nature', 'landscape', 'mountain']
});

console.log(`Image generated: ${imageResult.path}`);
```

### Chat Tool Usage

```typescript
import { generateImage } from '@tokenring-ai/image-generation/tools/generateImage';

const agent = new Agent();
const imageService = agent.requireServiceByType(ImageGenerationService);

const imageResult = await generateImage.execute(
  {
    prompt: 'A cute robot playing guitar in a forest',
    aspectRatio: 'square',
    keywords: ['robot', 'music', 'forest']
  },
  agent
);

agent.chat.infoLine(`Generated image: ${imageResult.path}`);
```

### Interactive Chat Command

```bash
/image reindex
```

**Output:**
```
Reindexing images in /path/to/generated-images...
Reindexed 42 images
```

### Image Search Usage

```typescript
import { searchImages } from '@tokenring-ai/image-generation/tools/searchImages';

const searchResult = await searchImages.execute(
  {
    query: 'futuristic city',
    limit: 10
  },
  agent
);

agent.chat.infoLine(`Found ${searchResult.results.length} matching images`);
searchResult.results.forEach(result => {
  agent.chat.infoLine(`- ${result.filename} (score: ${result.score.toFixed(2)})`);
});
```

## Configuration Options

### Image Generation Settings

```typescript
export const ImageGenerationConfigSchema = z.object({
  outputDirectory: z.string(),
  model: z.string(),
});
```

**Required Configuration:**
- `outputDirectory`: String path for image output (e.g., "./generated-images")
- `model`: String identifier of the default AI model to use

## Integration

The image generation package integrates with the Token Ring ecosystem through its plugin system:

```typescript
export default {
  name: "@tokenring-ai/image-generation",
  version: "0.2.0",
  install(app: TokenRingApp) {
    const config = app.getConfigSlice('imageGeneration', ImageGenerationConfigSchema.optional());
    if (config) {
      app.addServices(new ImageGenerationService(config));
      app.waitForService(ChatService, chatService => 
        chatService.addTools(packageJSON.name, tools)
      );
      app.waitForService(AgentCommandService, agentCommandService => 
        agentCommandService.addAgentCommands(chatCommands)
      );
    }
  },
}
```

## Dependencies

- `@tokenring-ai/agent@0.2.0`: Core agent framework and types
- `@tokenring-ai/ai-client@0.2.0`: AI client and model registry integration
- `@tokenring-ai/app@0.2.0`: Application framework
- `@tokenring-ai/chat@0.2.0`: Chat service integration
- `@tokenring-ai/filesystem@0.2.0`: File system integration
- `exiftool-vendored@^28.8.0`: Image metadata extraction
- `uuid@^13.0.0`: Unique identifier generation
- `zod@^4.0.17`: Schema validation

## Error Handling

The package provides comprehensive error handling:

1. **File System Errors**: Proper error handling for file operations
2. **Metadata Extraction**: Graceful handling when EXIF metadata is unavailable
3. **API Errors**: Proper error handling for AI model API calls
4. **Configuration Validation**: Zod schema validation for all parameters
5. **Index File Issues**: Graceful handling when index files are missing or corrupted

## Performance Considerations

- **Batch Generation**: Consider batching multiple image requests
- **Metadata Processing**: Efficient metadata extraction and indexing
- **Storage Management**: Monitor storage usage for generated images
- **Search Performance**: Optimized similarity scoring for image search
- **Memory Usage**: Proper resource management during image processing

## Development

### Package Structure

```
pkg/image-generation/
├── index.ts                           # Package exports and configuration schema
├── ImageGenerationService.ts          # Core service implementation
├── plugin.ts                          # Token Ring plugin integration
├── tools.ts                           # Tool exports
├── tools/generateImage.ts            # Generate image tool implementation
├── tools/searchImages.ts             # Image search tool implementation
├── chatCommands.ts                   # Chat command definitions
└── package.json                       # Package configuration
```

### Dependencies

```json
{
  "dependencies": {
    "@tokenring-ai/agent": "0.2.0",
    "@tokenring-ai/ai-client": "0.2.0", 
    "@tokenring-ai/app": "0.2.0",
    "@tokenring-ai/chat": "0.2.0",
    "@tokenring-ai/filesystem": "0.2.0",
    "exiftool-vendored": "^28.8.0",
    "uuid": "^13.0.0",
    "zod": "catalog:"
  },
  "devDependencies": {
    "vitest": "catalog:",
    "typescript": "catalog:"
  }
}
```

### Testing

The package uses Vitest for testing with proper configuration:

```typescript
// vitest.config.ts
import {defineConfig} from "vitest/config";

export default defineConfig({
  test: {
    include: ["**/*.test.ts"],
    environment: "node",
    globals: true,
    isolate: true,
  },
});
```