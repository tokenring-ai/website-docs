# Video Generation

## Overview

The Video Generation plugin provides AI-powered video creation capabilities for the
Token Ring ecosystem. It integrates with the `VideoGenerationModelRegistry` from
`@tokenring-ai/ai-client` to generate videos based on text prompts, and stores
generated videos through the shared `@tokenring-ai/media-library` for unified media
management, indexing, and retrieval.

## Key Features

- **AI Video Generation**: Generate videos using configurable video models
- **Shared Media Storage**: Saves generated videos through `@tokenring-ai/media-library`
- **Automatic Indexing**: Adds generated video metadata to `media_index.json`
- **Local Video Search**: Search generated videos by filename, prompt, or keywords
- **Aspect Ratio Support**: Generate square (1:1), tall (9:16), or wide (16:9) videos
- **Model Flexibility**: Select video models through the model registry
- **RPC Endpoints**: HTTP API for video generation
- **Web Host Integration**: Static file serving is provided by `@tokenring-ai/media-library`

## Installation

```bash
bun add @tokenring-ai/video
```

## Configuration

### Plugin Configuration

Configure the video generation plugin alongside the media library plugin:

```yaml
mediaLibrary:
  agentDefaults:
    outputDirectory: ./.tokenring/media-library

videoGeneration:
  defaultModels:
    - xai:grok-2-video
    - "*"
  agentDefaults:
    model: xai:grok-2-video
```

### Configuration Schema

The plugin uses the following configuration schema:

```typescript
import { VideoGenerationServiceConfigSchema } from "@tokenring-ai/video";

VideoGenerationServiceConfigSchema = z.object({
  defaultModels: z.array(z.string()).default([]),
  agentDefaults: z
    .object({
      model: z.string().exactOptional(),
    })
    .default({}),
});
```

**Configuration Options:**

| Field                 | Type       | Required | Description                                        |
|-----------------------|------------|----------|----------------------------------------------------|
| `defaultModels`       | `string[]` | No       | List of model requirements to try for default selection |
| `agentDefaults.model` | `string`   | No       | Default video generation model for agents          |

## Chat Commands

### /video reindex

Regenerate video entries in the media library index by scanning video files.

**Usage:**

```bash
/video reindex
```

**Behavior:**

1. Delegates to `MediaLibraryService.reindex()` with the `"video"` kind filter
2. Rebuilds video entries in `media_index.json`

**Example Output:**

```text
Video media re-indexed successfully.
```

### /video model get

Show the currently active video generation model.

**Usage:**

```bash
/video model get
```

**Example Output:**

```text
Current video model: xai:grok-2-video
```

### /video model set <model_name>

Set the video generation model to a specific model by name.

**Usage:**

```bash
/video model set xai:grok-2-video
```

**Example Output:**

```text
Video model set to xai:grok-2-video
```

### /video model select

Open an interactive tree-based selector to choose a video generation model.
Models are grouped by provider with availability status.

**Usage:**

```bash
/video model select
```

**Behavior:**

- Displays a tree of available video generation models
- Models are grouped by provider
- Shows online/offline status for each model
- Allows interactive selection via tree navigation

**Example Output:**

```text
Choose a video generation model:
[Interactive tree selector]
Video model set to xai:grok-2-video
```

### /video model reset

Reset the video generation model to the initial configured value.

**Usage:**

```bash
/video model reset
```

**Example Output:**

```text
Video model reset to xai:grok-2-video
```

**Note:** Requires an initial model to be configured in agent defaults.

## Tools

### video_generate

Generate an AI video and save it to the shared media library.

**Tool Definition:**

```typescript
import { TokenRingToolDefinition } from "@tokenring-ai/chat/schema";
import { z } from "zod";

const video_generate: TokenRingToolDefinition = {
  name: "video_generate",
  displayName: "Video Generation/generateVideo",
  description: "Generate an AI video and save it to the shared media library",
  inputSchema: z.object({
    prompt: z.string().describe("Description of the video to generate"),
    aspectRatio: z.enum(["square", "tall", "wide"]).default("wide"),
    resolution: z
      .string()
      .regex(/^\d+x\d+$/)
      .describe("Optional resolution such as 1280x720")
      .exactOptional(),
    duration: z
      .number()
      .positive()
      .describe("Optional video duration in seconds")
      .exactOptional(),
    fps: z.number().int().positive().describe("Optional frames per second").exactOptional(),
    seed: z.number().int().describe("Optional generation seed").exactOptional(),
    keywords: z
      .array(z.string())
      .describe("Keywords to add to media library metadata")
      .exactOptional(),
  }),
  execute: async (input, agent) => {
    // Implementation
  },
};
```

**Parameters:**

| Parameter     | Type                            | Required | Description                            |
|---------------|---------------------------------|----------|----------------------------------------|
| `prompt`      | `string`                        | Yes      | Description of the video to generate   |
| `aspectRatio` | `"square" \| "tall" \| "wide"` | No       | Aspect ratio. Default: `wide`          |
| `resolution`  | `string`                        | No       | Resolution such as `1280x720`          |
| `duration`    | `number`                        | No       | Video duration in seconds              |
| `fps`         | `number`                        | No       | Frames per second                      |
| `seed`        | `number`                        | No       | Optional generation seed               |
| `keywords`    | `string[]`                      | No       | Keywords stored in media metadata      |

**Aspect Ratios:**

- `square`: 1:1
- `tall`: 9:16
- `wide`: 16:9

**Usage Example:**

```typescript
const result = await agent.useTool("video_generate", {
  prompt: "A product demo shot on a clean studio background",
  aspectRatio: "wide",
  duration: 6,
  keywords: ["product", "demo", "studio"],
});

console.log(result);
// {
//   path: ".tokenring/media-library/bright-river.mp4",
//   fileName: "bright-river.mp4",
//   mediaType: "video/mp4",
//   duration: 6,
//   width: 1280,
//   height: 720
// }
```

### video_search

Search generated videos in the media library.

**Tool Definition:**

```typescript
import { TokenRingToolDefinition } from "@tokenring-ai/chat/schema";
import { z } from "zod";

const video_search: TokenRingToolDefinition = {
  name: "video_search",
  displayName: "Video Generation/searchVideos",
  description: "Search for videos in the media library based on filename, prompt, or keywords",
  inputSchema: z.object({
    query: z.string().describe("Search query to match against video metadata"),
    limit: z
      .number()
      .int()
      .positive()
      .default(10)
      .describe("Maximum number of results to return"),
  }),
  execute: async (input, agent) => {
    // Implementation
  },
};
```

**Parameters:**

| Parameter | Type     | Required | Description                                     |
|-----------|----------|----------|-------------------------------------------------|
| `query`   | `string` | Yes      | Search query to match against video metadata    |
| `limit`   | `number` | No       | Maximum number of results to return. Default: 10 |

**Usage Example:**

```typescript
const searchResults = await agent.useTool("video_search", {
  query: "product demo",
  limit: 3,
});

console.log(searchResults);
// {
//   results: [...],
//   message: "Found 3 videos matching \"product demo\""
// }
```

## Integration

### Service Registration

The package registers the following services and integrations:

1. **VideoGenerationService**: Core video generation functionality
2. **ChatService**: Registers tools for video generation and search
3. **AgentCommandService**: Registers `/video` commands
4. **RpcService**: Registers `/rpc/video-generation` endpoint

### Tool Registration

The following tools are automatically registered:

- `video_generate`: Generate AI videos
- `video_search`: Search generated videos in the media library

### Media Library Integration

The video generation package depends on `@tokenring-ai/media-library` for:

- Storing generated video files
- Indexing video metadata in `media_index.json`
- Searching videos by filename, prompt, or keywords
- Static file serving (handled by the media library package)

## Best Practices

1. **Use Descriptive Prompts**: Write detailed, descriptive prompts for better video results
2. **Add Keywords**: Include relevant keywords for better searchability in the media library
3. **Choose Appropriate Aspect Ratios**: Select the aspect ratio that best fits your use case
4. **Set a Default Model**: Configure `defaultModels` in the plugin config to avoid manual model selection
5. **Reindex After Manual Changes**: Run `/video reindex` if you manually add or modify video files

## Error Handling

The package includes comprehensive error handling:

| Error                                                | Description                       | Solution                                   |
|------------------------------------------------------|-----------------------------------|--------------------------------------------|
| `No video generation model is currently selected`    | No model configured for the agent | Use `/video model set` or configure in plugin |
| `No default video generation model was configured`   | No models available at startup    | Configure `defaultModels` in plugin config |
| `No initial video model configured`                  | Cannot reset without initial model | Configure `agentDefaults.model` in plugin  |

## Developer Reference

### Core Components

#### VideoGenerationService

Main service managing video generation functionality backed by the shared media library.

**Service Name:** `VideoGenerationService`

**Description:** Video generation backed by the shared media library

**Constructor:**

```typescript
constructor(
  app: TokenRingApp,
  options: ParsedVideoGenerationConfig
)
```

**Methods:**

##### getDefaultModel()

Return the application default video model.

```typescript
getDefaultModel(): string | null
```

**Returns:** The default model name or null if not configured

##### getModel(agent)

Return the active video model for an agent.

```typescript
getModel(agent: Agent): string | null
```

**Parameters:**

- `agent`: Agent instance

**Returns:** The agent's model or the default model, or null if neither is set

##### setModel(model, agent)

Set or clear the active video model for an agent.

```typescript
setModel(model: string | null, agent: Agent): void
```

**Parameters:**

- `model`: Model name to set, or null to clear
- `agent`: Agent instance

##### requireModel(agent)

Return the active model or throw if none is selected.

```typescript
requireModel(agent: Agent): string
```

**Parameters:**

- `agent`: Agent instance

**Returns:** The model name

**Throws:** `ConfigurationError` if no model is selected

##### generateVideo(options, agent)

Generate a video and save it to the media library.

```typescript
async generateVideo(
  options: GenerateVideoOptions,
  agent: Agent
): Promise<{
  mediaType: string;
  fileName: string;
  filePath: string;
  duration?: number;
  width?: number;
  height?: number;
  buffer: Buffer;
}>
```

**Parameters:**

- `options.prompt`: Description of the video to generate
- `options.aspectRatio`: "square", "tall", or "wide" (default: "wide")
- `options.resolution`: Optional resolution string (e.g., "1280x720")
- `options.duration`: Optional video duration in seconds
- `options.fps`: Optional frames per second
- `options.seed`: Optional generation seed
- `options.n`: Optional number of videos to generate (only first is returned)
- `options.keywords`: Optional array of keywords for media metadata
- `agent`: Agent instance

**Returns:** Object with mediaType, fileName, filePath, buffer, and optional dimensions

**Throws:** `ConfigurationError` if no model is selected

##### reindex(agent)

Reindex video files in the media library.

```typescript
async reindex(agent: Agent): Promise<void>
```

**Parameters:**

- `agent`: Agent instance for media library operations

**Implementation:** Delegates to `MediaLibraryService.reindex(agent, ["video"])`

#### GenerateVideoOptions

Type definition for video generation options:

```typescript
export type GenerateVideoOptions = {
  prompt: string;
  aspectRatio?: VideoAspectRatio | undefined;
  resolution?: string | undefined;
  duration?: number | undefined;
  fps?: number | undefined;
  seed?: number | undefined;
  n?: number | undefined;
  keywords?: string[] | undefined;
};
```

#### VideoAspectRatio

Type definition for supported aspect ratios:

```typescript
export type VideoAspectRatio = "square" | "tall" | "wide";
```

### Services

#### VideoGenerationService (Service)

Core service for video generation backed by the shared media library.

**Registration:**

```typescript
app.addServices(new VideoGenerationService(app, config.videoGeneration));
```

**Service Name:** `VideoGenerationService`

**Description:** Video generation backed by the shared media library

### State Management

The package uses `VideoGenerationState` to maintain per-agent configuration:

**State Fields:**

| Field   | Type             | Description                                    |
|---------|------------------|------------------------------------------------|
| `model` | `string \| null` | Currently selected video generation model      |

**State Usage:**

```typescript
import { VideoGenerationState } from "@tokenring-ai/video";

// Get current state
const state = agent.getState(VideoGenerationState);
console.log(state.model);

// Show state
console.log(state.show());
// Output: Video Model: xai:grok-2-video
```

### RPC Endpoints (API Reference)

The package registers the following RPC endpoint:

**Path:** `/rpc/video-generation`

**Methods:**

- `generateVideo`: Generate a video via RPC and save it to the media library

#### generateVideo

Generate a video for an agent.

**Input:**

```typescript
{
  agentId: string;
  prompt: string;
  model?: string;
  aspectRatio?: "square" | "tall" | "wide";
  resolution?: string;
  duration?: number;
  fps?: number;
  seed?: number;
  keywords?: string[];
}
```

**Success Result:**

```typescript
{
  status: "success";
  filename: string;
  mimeType: string;
  message: string;
}
```

**Error Result:**

```typescript
{
  status: "agentNotFound";
}
```

**Notes:**

- If `model` is provided, it is temporarily set for the duration of the request
- The previous model is restored after generation completes

### Usage Examples

#### Basic Video Generation

```typescript
// Generate a product demo video
const result = await agent.useTool("video_generate", {
  prompt: "A product demo shot on a clean studio background",
  aspectRatio: "wide",
  duration: 6,
  keywords: ["product", "demo", "studio"],
});

console.log(result.filePath); // .tokenring/media-library/bright-river.mp4
```

#### Searching Generated Videos

```typescript
// Search for product-related videos
const searchResults = await agent.useTool("video_search", {
  query: "product demo",
  limit: 5,
});

console.log(searchResults.message);
// "Found 3 videos matching \"product demo\""
```

#### Changing Video Model

```typescript
// Set a specific model for video generation
await agent.runCommand("/video model set xai:grok-2-video");

// Or use interactive selection
await agent.runCommand("/video model select");
```

#### Complete Workflow

```typescript
// Set the video model
await agent.runCommand("/video model set xai:grok-2-video");

// Generate a video
const generateResult = await agent.useTool("video_generate", {
  prompt: "A timelapse of a city skyline at dusk",
  aspectRatio: "wide",
  duration: 5,
  keywords: ["timelapse", "city", "skyline", "dusk"],
});

// Search for it later
const searchResult = await agent.useTool("video_search", {
  query: "city skyline",
  limit: 5,
});

// Reindex if needed
await agent.runCommand("/video reindex");
```

### Testing

Run tests with Vitest:

```bash
# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Dependencies

The package has the following dependencies:

**Production Dependencies:**

| Package                         | Description                            |
|---------------------------------|----------------------------------------|
| `@tokenring-ai/agent`           | Agent orchestration system             |
| `@tokenring-ai/ai-client`       | AI client and model registry           |
| `@tokenring-ai/app`             | Application framework                  |
| `@tokenring-ai/chat`            | Chat service integration               |
| `@tokenring-ai/media-library`   | Shared media storage and indexing      |
| `@tokenring-ai/rpc`             | RPC service integration                |
| `@tokenring-ai/utility`         | Utility functions                      |
| `zod`                           | Schema validation                      |

**Development Dependencies:**

| Package        | Description            |
|----------------|------------------------|
| `vitest`       | Testing framework      |
| `typescript`   | TypeScript compiler    |

### Related Components

- `@tokenring-ai/media-library` - Shared media storage, indexing, search, and static serving
- `@tokenring-ai/image` - Image generation and editing package
- `@tokenring-ai/audio` - Audio recording, playback, speech, and transcription package
- `@tokenring-ai/agent` - Agent system for tool and command integration
- `@tokenring-ai/ai-client` - AI model registry for video generation
- `@tokenring-ai/app` - Application framework for service registration
- `@tokenring-ai/chat` - Chat service for tool execution
- `@tokenring-ai/rpc` - RPC service for HTTP API

## Package Structure

```text
pkg/video/
├── index.ts                         # Package exports
├── plugin.ts                        # Plugin integration and configuration
├── VideoGenerationService.ts        # Core service implementation
├── schema.ts                        # Configuration and state schemas
├── tools.ts                         # Tool exports
├── tools/
│   ├── generateVideo.ts             # video_generate tool implementation
│   └── searchVideos.ts              # video_search tool implementation
├── commands.ts                      # Chat command exports
├── commands/
│   ├── video.ts                     # /video reindex command
│   └── model/
│       ├── get.ts                   # /video model get command
│       ├── set.ts                   # /video model set command
│       ├── select.ts                # /video model select command
│       └── reset.ts                 # /video model reset command
├── rpc/
│   ├── videoGeneration.ts           # RPC endpoint implementation
│   └── schema.ts                    # RPC schema definitions
├── state/
│   └── VideoGenerationState.ts      # Agent state slice for video settings
├── package.json                     # Package metadata
└── vitest.config.ts                 # Test configuration
```

## License

MIT License - see `LICENSE` file for details.
