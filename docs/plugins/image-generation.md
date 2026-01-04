# Image Generation Plugin

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
class ImageGenerationService implements TokenRingService &#123;
  name: string = "ImageGenerationService";
  description: string = "Image generation with configurable output directories";
  
  outputDirectory: string;
  model: string;
  
  constructor(config: z.infer&lt;typeof ImageGenerationConfigSchema&gt;);
  
  getOutputDirectory(): string;
  getModel(): string;
  addToIndex(directory: string, filename: string, mimeType: string, width: number, height: number, keywords: string[], agent: Agent): Promise&lt;void&gt;;
  reindex(directory: string, agent: Agent): Promise&lt;void&gt;;
&#125;
```

### Configuration Schema

```typescript
const ImageGenerationConfigSchema = z.object(&#123;
  outputDirectory: z.string(),
  model: z.string(),
&#125;);
```

### Available Tools

#### generateImage

Generate an AI image and save it to a configured output directory:

```typescript
const generateImage: TokenRingToolDefinition = &#123;
  name: "image_generate",
  description: "Generate an AI image and save it to a configured output directory",
  inputSchema: z.object(&#123;
    prompt: z.string().describe("Description of the image to generate"),
    aspectRatio: z.enum(["square", "tall", "wide"]).default("square").optional(),
    outputDirectory: z.string().describe("Output directory (will prompt if not provided)").optional(),
    model: z.string().describe("Image generation model to use").optional(),
    keywords: z.array(z.string()).describe("Keywords to add to image EXIF/IPTC metadata").optional(),
  &#125;);
```

#### searchImages

Search for images in the index based on keyword similarity:

```typescript
const searchImages: TokenRingToolDefinition = &#123;
  name: "image_search",
  description: "Search for images in the index based on keyword similarity",
  inputSchema: z.object(&#123;
    query: z.string().describe("Search query to match against image keywords"),
    limit: z.number().int().positive().default(10).describe("Maximum number of results to return").optional(),
  &#125;);
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
app.waitForService(ChatService, chatService =&gt; 
  chatService.addTools(packageJSON.name, tools)
);
app.waitForService(AgentCommandService, agentCommandService =&gt; 
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
&#123;
  "filename": "generated-image.jpg",
  "mimeType": "image/jpeg", 
  "width": 1024,
  "height": 1024,
  "keywords": ["AI", "generated", "art"]
&#125;
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
await agent.useTool('image_generate', &#123;
  prompt: 'A beautiful sunset over mountains',
  aspectRatio: 'wide',
  keywords: ['nature', 'landscape', 'sunset']
&#125;);
```

#### image_search

**Description**: Search for images in the index based on keyword similarity.

**Parameters**:
- `query` (required): Search query to match against image keywords
- `limit` (optional): Maximum number of results to return (default: 10)

**Example Usage**:
```typescript
const results = await agent.useTool('image_search', &#123;
  query: 'nature landscape',
  limit: 5
&#125;);
```

## Configuration

### Basic Configuration

The plugin requires the following configuration:

```typescript
const config = &#123;
  outputDirectory: './generated-images',
  model: 'dall-e-3'
&#125;;
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
const result = await agent.useTool('image_generate', &#123;
  prompt: 'A futuristic cityscape at night',
  aspectRatio: 'wide'
&#125;);

console.log(result.path); // Path to the generated image
```

### Advanced Configuration

```typescript
// Generate an image with specific metadata
const result = await agent.useTool('image_generate', &#123;
  prompt: 'A beautiful forest with sunlight filtering through trees',
  aspectRatio: 'tall',
  keywords: ['nature', 'forest', 'sunlight', 'peaceful']
&#125;);

console.log(`Image saved to: $&#123;result.path&#125;`);
console.log(`Metadata added: $&#123;result.message&#125;`);
```

### Searching Images

```typescript
// Search for images with specific keywords
const searchResults = await agent.useTool('image_search', &#123;
  query: 'nature landscape',
  limit: 10
&#125;);

searchResults.results.forEach(result =&gt; &#123;
  console.log(`Found: $&#123;result.filename&#125; (score: $&#123;result.score&#125;)`);
&#125;);
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
): Promise&lt;void&gt;;
```

#### reindex(directory, agent)

Regenerates the image index by scanning all images and reading their metadata.

```typescript
reindex(directory: string, agent: Agent): Promise&lt;void&gt;;
```

### Tool Definitions

#### generateImage Tool

```typescript
const generateImage: TokenRingToolDefinition = &#123;
  name: "image_generate",
  description: "Generate an AI image and save it to a configured output directory",
  inputSchema: z.object(&#123;
    prompt: z.string().describe("Description of the image to generate"),
    aspectRatio: z.enum(["square", "tall", "wide"]).default("square").optional(),
    outputDirectory: z.string().describe("Output directory (will prompt if not provided)").optional(),
    model: z.string().describe("Image generation model to use").optional(),
    keywords: z.array(z.string()).describe("Keywords to add to image EXIF/IPTC metadata").optional(),
  &#125;);
```

#### searchImages Tool

```typescript
const searchImages: TokenRingToolDefinition = &#123;
  name: "image_search",
  description: "Search for images in the index based on keyword similarity",
  inputSchema: z.object(&#123;
    query: z.string().describe("Search query to match against image keywords"),
    limit: z.number().int().positive().default(10).describe("Maximum number of results to return").optional(),
  &#125;);
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
import &#123;ImageGenerationService&#125; from "@tokenring-ai/image-generation";
import &#123;generateImage, searchImages&#125; from "@tokenring-ai/image-generation/tools";
import &#123;image&#125; from "@tokenring-ai/image-generation/commands";
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
bun run test
bun run test:watch
bun run test:coverage
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

### Build Instructions

```bash
# Install dependencies
bun install

# Build the package
bun run build

# Run tests
bun run test
bun run test:watch
bun run test:coverage
```

## Related Components

- **Filesystem Service**: Provides file operations for image storage
- **AI Client Service**: Provides AI model integration for image generation
- **Chat Service**: Manages tool and command registration
- **Agent Service**: Orchestrates plugin services and commands

## License

MIT License - Copyright (c) 2025 Mark Dierolf
