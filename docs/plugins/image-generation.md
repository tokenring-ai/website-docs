# Image Generation Plugin

Image generation with configurable output directories and file management.

## Overview

The `@tokenring-ai/image-generation` package provides comprehensive image generation capabilities with automatic file management, EXIF metadata handling, and customizable output directories. It integrates with the AI client for image generation and the filesystem for file storage and management.

## Key Features

- **Multi-provider Support**: Integrates with AI client for various image generation providers
- **Automatic File Management**: Handles file generation, saving, and metadata
- **EXIF Metadata**: Comprehensive EXIF data handling and generation
- **Configurable Output**: Customizable output directories and file naming
- **File Tracking**: Automatic tracking of generated images
- **Error Handling**: Robust error handling and validation
- **Chat Integration**: Tool integration for interactive image generation
- **Command Integration**: Chat commands for user interaction

## Core Components

### ImageGenerationService

The main service that handles image generation and file management:

```typescript
class ImageGenerationService implements TokenRingService {
  name = "ImageGenerationService";
  description = "Service for Image Generation and File Management";
  
  constructor({ outputDir }: ImageGenerationServiceConfig)
  
  async generateImage(request: ImageGenerationRequest, agent: Agent): Promise<[GeneratedFile, ImageGenerationResult]>
  
  // File management methods
  private generateFileName(prompt: string): string
  private async saveImage(imageData: Uint8Array, fileName: string): Promise<GeneratedFile>
  private async generateExifMetadata(prompt: string, model: string): Promise<Record<string, any>>
}
```

### Image Generation Request

```typescript
interface ImageGenerationRequest {
  prompt: string;        // Image generation prompt
  size?: string;        // Image size (e.g., '1024x1024', '1792x1024')
  quality?: string;      // Quality setting ('standard', 'hd')
  style?: string;        // Style preference
  n?: number;           // Number of images to generate
}
```

### GeneratedFile

```typescript
interface GeneratedFile {
  path: string;         // File path relative to output directory
  fullPath: string;      // Full file path
  size: number;         // File size in bytes
  metadata: ImageMetadata; // EXIF and other metadata
}
```

### Image Generation Result

```typescript
interface ImageGenerationResult {
  cost: number;         // Cost of image generation
  model: string;        // Model used for generation
  prompt: string;       // Original prompt used
}
```

### Chat Tool

The `imageGeneration` tool provides programmatic access to image generation:

```typescript
interface ImageGenerationToolArgs {
  prompt: string;
  size?: string;
  quality?: string;
  style?: string;
  n?: number;
}

type ImageGenerationToolResult = GeneratedFile[]; // Array of generated files
```

### Chat Commands

**/image**: Interactive command for users
- Subcommands: `generate <prompt>`, `describe <path>`, `list`
- Supports flags: `--size`, `--quality`, `--style`, `--count`
- Displays generated images or file information in chat

## Usage Examples

### Basic Image Generation

```typescript
import { Agent } from '@tokenring-ai/agent';
import { ImageGenerationService } from '@tokenring-ai/image-generation';
import { ImageGenerationModelRegistry } from '@tokenring-ai/ai-client';

// Initialize agent and services
const agent = new Agent();
const imageRegistry = new ImageGenerationModelRegistry();
agent.registerService(imageRegistry);
const imageGenerationService = new ImageGenerationService({ outputDir: './generated-images' });

// Register services with agent
agent.registerService(imageGenerationService);

// Get image generation client
const imageClient = await imageRegistry.getFirstOnlineClient('dall-e-3');

// Generate image
const [file, result] = await imageGenerationService.generateImage({
  prompt: 'A beautiful sunset over mountains',
  size: '1024x1024',
  quality: 'standard',
  n: 1
}, agent);

console.log('Generated image:', file.path);
console.log('Cost:', result.cost);
```

### Using the Chat Tool

```typescript
// The tool is automatically registered with chat service
const result = await chatService.executeTool("imageGeneration", {
  prompt: "A futuristic cityscape with flying cars",
  size: "1024x1024",
  quality: "hd",
  n: 2
});

// Result contains array of GeneratedFile objects
console.log('Generated images:', result.map(f => f.path));
```

### Chat Command Usage

```bash
# Generate a single image
/image generate "A beautiful sunset over mountains" --size 1024x1024 --quality hd

# Generate multiple images
/image generate "Abstract art painting" --size 1792x1024 --count 3

# Describe an image (show metadata)
/image describe ./generated-images/sunset_2024-01-15_14-30-45.png

# List all generated images
/image list
```

## Configuration Options

### Service Configuration

```typescript
interface ImageGenerationServiceConfig {
  outputDir: string;    // Directory for saving generated images (required)
}

// Example configuration
{
  "imageGeneration": {
    "outputDir": "./generated-images"
  }
}
```

### Image Generation Options

- `prompt`: Required string - Description of the image to generate
- `size`: Optional string - Image dimensions (e.g., '1024x1024', '1792x1024', '1024x1792')
- `quality`: Optional string - Quality setting ('standard' or 'hd')
- `style`: Optional string - Style preference for the image
- `n`: Optional number - Number of images to generate (default: 1)

## Integration with Token Ring Ecosystem

### Plugin Integration

The image generation package automatically integrates with Token Ring applications through its plugin:

```typescript
export default {
  name: "@tokenring-ai/image-generation",
  version: "0.2.0",
  description: "Image generation with configurable output directories",
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
  }
}
```

### Service Dependencies

The image generation package requires these services to be available:

1. **ChatModelRegistry** (via agent): For accessing image generation models
2. **Agent**: For accessing services and system messages
3. **ChatService**: For tool integration
4. **AgentCommandService**: For chat command integration
5. **Filesystem**: For file storage and management

### Filesystem Integration

The service automatically handles:

- File creation and saving
- EXIF metadata generation and embedding
- File path management
- File size tracking
- Error handling for file operations

## Error Handling

The package includes comprehensive error handling:

- **Input Validation**: Zod schemas validate all input parameters
- **File Operations**: Graceful handling of file system errors
- **Model Availability**: Proper error handling when image generation models are unavailable
- **EXIF Processing**: Error handling for EXIF metadata operations
- **Resource Management**: Proper cleanup of resources

## Performance Considerations

- **File Storage**: Efficient file storage with proper metadata
- **Batch Generation**: Support for generating multiple images
- **Metadata Generation**: Efficient EXIF metadata creation
- **Error Recovery**: Robust error handling without data loss
- **Resource Management**: Proper cleanup of generated files

## Dependencies

### Package Dependencies

- `@tokenring-ai/agent`: Core agent framework
- `@tokenring-ai/ai-client`: AI client with image generation capabilities
- `@tokenring-ai/app`: Application framework
- `@tokenring-ai/chat`: Chat service integration
- `@tokenring-ai/filesystem`: File system utilities
- `zod`: Schema validation
- `exiftool-vendored`: EXIF metadata handling
- `uuid`: Unique file naming

### Development Dependencies

- `vitest`: Testing framework
- `typescript`: TypeScript support

## Testing

The package includes Vitest configuration for testing:

```bash
# Run tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

## License

MIT License - See LICENSE file for details.