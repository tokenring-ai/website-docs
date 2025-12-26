# Image Generation Plugin

## Overview

The Image Generation plugin provides AI-powered image generation capabilities with configurable output directories, EXIF metadata management, and image indexing functionality. It integrates seamlessly with the Token Ring ecosystem to enable agents to generate, manage, and search AI-generated images.

## Key Features

- **AI Image Generation**: Generate images using various aspect ratios (square, tall, wide)
- **Configurable Output**: Save images to specified directories with automatic indexing
- **EXIF Metadata**: Add keywords and descriptions to image metadata
- **Image Indexing**: Automatically create and maintain image metadata index
- **Image Search**: Search generated images by keyword similarity
- **Metadata Management**: Read and write EXIF/IPTC metadata using exiftool
- **Service Integration**: Seamless integration with Filesystem and AI client services

## Core Components

### ImageGenerationService

The main service class that handles image generation operations:

```typescript
class ImageGenerationService implements TokenRingService {
  name: string = "ImageGenerationService";
  description: string = "Image generation with configurable output directories";
  
  outputDirectory: string;
  model: string;
  
  constructor(config: z.infer<typeof ImageGenerationConfigSchema>);
  
  getOutputDirectory(): string;
  getModel(): string;
  addToIndex(directory: string, filename: string, mimeType: string, width: number, height: number, keywords: string[], agent: Agent): Promise<void>;
  reindex(directory: string, agent: Agent): Promise<void>;
}
```

### Configuration Schema

```typescript
const ImageGenerationConfigSchema = z.object({
  outputDirectory: z.string(),
  model: z.string(),
});
```

### Available Tools

#### generateImage

Generate an AI image and save it to a configured output directory:

```typescript
const generateImage: TokenRingToolDefinition = {
  name: "image_generate",
  description: "Generate an AI image and save it to a configured output directory",
  inputSchema: z.object({
    prompt: z.string().describe("Description of the image to generate"),
    aspectRatio: z.enum(["square", "tall", "wide"]).default("square").optional(),
    outputDirectory: z.string().describe("Output directory (will prompt if not provided)").optional(),
    model: z.string().describe("Image generation model to use").optional(),
    keywords: z.array(z.string()).describe("Keywords to add to image EXIF/IPTC metadata").optional(),
  });
};
```

#### searchImages

Search for images in the index based on keyword similarity:

```typescript
const searchImages: TokenRingToolDefinition = {
  name: "image_search",
  description: "Search for images in the index based on keyword similarity",
  inputSchema: z.object({
    query: z.string().describe("Search query to match against image keywords"),
    limit: z.number().int().positive().default(10).describe("Maximum number of results to return").optional(),
  });
};
```

### Chat Commands

#### /image reindex

Regenerate the image_index.json file in the image directory by scanning all images and reading their metadata:

```bash
/image reindex
```

## Services and APIs

### Service Registration

The plugin registers the following services when installed:

```typescript
app.addServices(new ImageGenerationService(config));
app.waitForService(ChatService, chatService => 
  chatService.addTools(packageJSON.name, tools)
);
app.waitForService(AgentCommandService, agentCommandService => 
  agentCommandService.addAgentCommands(chatCommands)
);
```

### Configuration

The plugin uses a configuration schema with the following properties:

- `outputDirectory`: The directory where generated images will be saved
- `model`: The image generation model to use

### Image Indexing

The service automatically maintains an index of generated images in `image_index.json` format:

```json
{
  "filename": "generated-image.jpg",
  "mimeType": "image/jpeg", 
  "width": 1024,
  "height": 1024,
  "keywords": ["AI", "generated", "art"]
}
```

## Commands and Tools

### Chat Commands

#### /image reindex

**Description**: Regenerate the image index by scanning all images and reading their metadata.

**Usage**: `/image reindex`

**Examples**:
```bash
/image reindex
```

### Available Tools

#### image_generate

**Description**: Generate an AI image with specified parameters.

**Parameters**:
- `prompt` (required): Description of the image to generate
- `aspectRatio` (optional): "square" | "tall" | "wide" (default: "square")
- `outputDirectory` (optional): Output directory for saving images
- `model` (optional): Image generation model to use
- `keywords` (optional): Keywords to add to image metadata

**Example Usage**:
```typescript
await agent.useTool('image_generate', {
  prompt: 'A beautiful sunset over mountains',
  aspectRatio: 'wide',
  keywords: ['nature', 'landscape', 'sunset']
});
```

#### image_search

**Description**: Search for images in the index based on keyword similarity.

**Parameters**:
- `query` (required): Search query to match against image keywords
- `limit` (optional): Maximum number of results to return (default: 10)

**Example Usage**:
```typescript
const results = await agent.useTool('image_search', {
  query: 'nature landscape',
  limit: 5
});
```

## Configuration

### Basic Configuration

The plugin requires the following configuration:

```typescript
const config = {
  outputDirectory: './generated-images',
  model: 'dall-e-3'
};
```

### Environment Variables

No specific environment variables are required, but the plugin depends on:

- `@tokenring-ai/filesystem`: For file system operations
- `@tokenring-ai/ai-client`: For AI model integration
- `@tokenring-ai/chat`: For tool and command registration

## Usage Examples

### Basic Image Generation

```typescript
// Generate an image using the default configuration
const result = await agent.useTool('image_generate', {
  prompt: 'A futuristic cityscape at night',
  aspectRatio: 'wide'
});

console.log(result.path); // Path to the generated image
```

### Advanced Configuration

```typescript
// Generate an image with specific metadata
const result = await agent.useTool('image_generate', {
  prompt: 'A beautiful forest with sunlight filtering through trees',
  aspectRatio: 'tall',
  keywords: ['nature', 'forest', 'sunlight', 'peaceful']
});

console.log(`Image saved to: ${result.path}`);
console.log(`Metadata added: ${result.message}`);
```

### Searching Images

```typescript
// Search for images with specific keywords
const searchResults = await agent.useTool('image_search', {
  query: 'nature landscape',
  limit: 10
});

searchResults.results.forEach(result => {
  console.log(`Found: ${result.filename} (score: ${result.score})`);
});
```

### Reindexing Images

```typescript
// Reindex all images in the output directory
await agent.executeCommand('/image reindex');
```

## API Reference

### ImageGenerationService Methods

#### getOutputDirectory()

Returns the configured output directory.

```typescript
getOutputDirectory(): string;
```

#### getModel()

Returns the configured image generation model.

```typescript
getModel(): string;
```

#### addToIndex(directory, filename, mimeType, width, height, keywords, agent)

Adds an image entry to the index.

```typescript
addToIndex(
  directory: string,
  filename: string, 
  mimeType: string,
  width: number,
  height: number,
  keywords: string[],
  agent: Agent
): Promise<void>;
```

#### reindex(directory, agent)

Regenerates the image index by scanning all images and reading their metadata.

```typescript
reindex(directory: string, agent: Agent): Promise<void>;
```

### Tool Definitions

#### generateImage Tool

```typescript
const generateImage: TokenRingToolDefinition = {
  name: "image_generate",
  description: "Generate an AI image and save it to a configured output directory",
  inputSchema: z.object({
    prompt: z.string().describe("Description of the image to generate"),
    aspectRatio: z.enum(["square", "tall", "none"]).default("square").optional(),
    outputDirectory: z.string().describe("Output directory (will prompt if not provided)").optional(),
    model: z.string().describe("Image generation model to use").optional(),
    keywords: z.array(z.string()).describe("Keywords to add to image EXIF/IPTC metadata").optional(),
  });
};
```

#### searchImages Tool

```typescript
const searchImages: TokenRingToolDefinition = {
  name: "image_search",
  description: "Search for images in the index based on keyword similarity",
  inputSchema: z.object({
    query: z.string().describe("Search query to match against image keywords"),
    limit: z.number().int().positive().default(10).describe("Maximum number of results to return").optional(),
  });
};
```

## Integration

### Service Registration

The plugin integrates with the Token Ring ecosystem through:

1. **Service Registration**: Registers `ImageGenerationService` with the application
2. **Tool Registration**: Adds image generation and search tools to the chat service
3. **Command Registration**: Adds the `/image` command to the agent command service

### Dependency Relationships

The plugin depends on:

- `@tokenring-ai/filesystem`: For file operations and metadata reading/writing
- `@tokenring-ai/ai-client`: For AI model integration and image generation
- `@tokenring-ai/chat`: For tool and command registration
- `@tokenring-ai/agent`: For agent service integration

### Import Patterns

```typescript
import {ImageGenerationService} from "@tokenring-ai/image-generation";
import {generateImage, searchImages} from "@tokenring-ai/image-generation/tools";
import {image} from "@tokenring-ai/image-generation/commands";
```

## Monitoring and Debugging

### Logging

The service provides detailed logging for:

- Image generation progress
- Metadata writing operations
- Indexing operations
- Search results

### Error Handling

Common error scenarios:

- Missing prompt in image generation
- Failed metadata writing
- Missing index file during search
- Configuration validation errors

### Performance Considerations

- Image generation may take several seconds depending on the model
- Indexing large image directories can be time-consuming
- Search operations are optimized for fast keyword matching

## Development

### Testing

The plugin includes unit tests using vitest:

```bash
npm test
npm test:watch
npm test:coverage
```

### Package Structure

```
pkg/image-generation/
├── index.ts              # Configuration schema and exports
├── ImageGenerationService.ts  # Main service implementation
├── plugin.ts             # Plugin definition and installation
├── chatCommands.ts       # Chat command definitions
├── tools.ts              # Tool definitions
├── commands/
│   └── image.ts          # Image command implementation
└── tools/
    ├── generateImage.ts  # Image generation tool
    └── searchImages.ts   # Image search tool
```

### Dependencies

Key dependencies:
- `@tokenring-ai/agent`: Agent orchestration
- `@tokenring-ai/ai-client`: AI model integration
- `@tokenring-ai/filesystem`: File system operations
- `exiftool-vendored`: Metadata handling
- `uuid`: Unique filename generation

### Build Instructions

```bash
# Install dependencies
npm install

# Build the package
npm run build

# Run tests
npm test
```

## Related Components

- **Filesystem Service**: Provides file operations for image storage
- **AI Client Service**: Provides AI model integration for image generation
- **Chat Service**: Manages tool and command registration
- **Agent Service**: Orchestrates plugin services and commands

## License

MIT License - Copyright (c) Token Ring AI