# Web Frontend Plugin

React-based web interface with CLI-style chat for TokenRing agents.

## Overview

The `@tokenring-ai/web-frontend` package provides a default React-based web UI for interacting with TokenRing agents. It features a dark CLI-style interface with real-time event display, agent management, and human interaction support.

## Key Features

- **CLI-Style Interface**: Dark theme with colored output mimicking terminal
- **Agent Management**: Select existing or create new agents
- **Real-time Chat**: WebSocket-based communication via AgentClient
- **Event Display**: All agent events shown in real-time with color coding
- **Human Interaction**: Prompts for user input when agents request it
- **Responsive Design**: Works on desktop and mobile browsers
- **Built with Vite**: Fast development and optimized production builds

## Core Components

### DefaultFrontendResource

Web resource that serves the built React application.

**Features:**
- Serves static files from `frontend/dist/`
- SPA routing support (serves index.html for all routes)
- Automatic registration with WebHostService

### React Application

Single-page application with:
- Agent selector screen
- Chat interface with message history
- Input form with send button
- Real-time event streaming
- Busy/idle state indicators

## UI Features

### Agent Selector

- Lists running agents with ID and name
- Create new agent button (currently supports interactiveCodeAgent)
- Clean, minimal interface

### Chat Interface

**Header:**
- TokenRing Coder branding
- Current agent name
- Switch button to return to agent selector

**Message Display:**
- Color-coded messages by type:
  - Chat output (teal)
  - Reasoning output (yellow)
  - System messages (blue/yellow/red based on level)
  - User input (cyan with prompt symbol)
- Auto-scroll to latest message
- Busy indicator with animated spinner

**Input Form:**
- Text input field
- Send button
- Disabled during busy state
- Auto-focus on idle

## Usage Examples

### Basic Setup

```typescript
import { AgentTeam } from "@tokenring-ai/agent";
import { packageInfo as webHostPackage } from "@tokenring-ai/web-host";
import { packageInfo as agentApiPackage } from "@tokenring-ai/agent-api";
import { packageInfo as webFrontendPackage } from "@tokenring-ai/web-frontend";

const team = new AgentTeam({
  webHost: { enabled: true, port: 3000 }
});

await team.addPackages([
  webHostPackage,
  agentApiPackage,
  webFrontendPackage
]);

// Access at http://localhost:3000
```

### Custom Port

```typescript
const team = new AgentTeam({
  webHost: { enabled: true, port: 8080 }
});

await team.addPackages([
  webHostPackage,
  agentApiPackage,
  webFrontendPackage
]);

// Access at http://localhost:8080
```

### With Additional Packages

```typescript
import { packageInfo as gitPackage } from "@tokenring-ai/git";
import { packageInfo as filesystemPackage } from "@tokenring-ai/filesystem";

const team = new AgentTeam({
  webHost: { enabled: true, port: 3000 }
});

await team.addPackages([
  webHostPackage,
  agentApiPackage,
  webFrontendPackage,
  gitPackage,
  filesystemPackage
]);

// Agents will have access to git and filesystem tools
```

## Development

### Building the Frontend

```bash
cd pkg/web-frontend/frontend
npm install
npm run build
```

Built files are placed in `frontend/dist/` and automatically served by DefaultFrontendResource.

### Development Mode

```bash
cd pkg/web-frontend/frontend
npm run dev
```

Runs Vite development server with hot reload at `http://localhost:5173`.

**Note:** In dev mode, configure the AgentClient to connect to your backend:

```typescript
// In frontend/src/client.ts or App.tsx
const client = new AgentClient("ws://localhost:3000/ws");
```

### Preview Production Build

```bash
cd pkg/web-frontend/frontend
npm run build
npm run preview
```

## Customization

### Custom Styling

Edit `frontend/src/App.css` to customize colors, fonts, and layout:

```css
/* Change theme colors */
body {
  background: #1e1e1e;  /* Background */
  color: #d4d4d4;       /* Text */
}

.message.chat {
  color: #4ec9b0;       /* Chat output */
}

.message.reasoning {
  color: #dcdcaa;       /* Reasoning */
}
```

### Custom Agent Types

Modify `frontend/src/App.tsx` to add more agent creation options:

```typescript
<div className="agent-list">
  <h3>Create New Agent</h3>
  <button onClick={() => createAgent('interactiveCodeAgent')} className="agent-btn">
    Interactive Code Agent
  </button>
  <button onClick={() => createAgent('teamLeader')} className="agent-btn">
    Team Leader
  </button>
  <button onClick={() => createAgent('testEngineer')} className="agent-btn">
    Test Engineer
  </button>
</div>
```

### Custom Event Handling

Extend event handling in `frontend/src/App.tsx`:

```typescript
// Add custom event listener
client.on('event:custom.event', (data: any) => {
  setMessages(m => [...m, { 
    type: 'system', 
    content: `Custom: ${data.message}`,
    level: 'info'
  }]);
});
```

### Custom Human Interaction

Replace the default `prompt()` with custom UI:

```typescript
client.on('event:human.request', async (data: any) => {
  // Custom modal/dialog instead of prompt()
  const response = await showCustomDialog({
    title: "Agent Request",
    message: data.request.message,
    type: data.request.type
  });
  client.sendHumanResponse(data.sequence, response);
});
```

## File Structure

```
pkg/web-frontend/
├── frontend/                    # React application
│   ├── public/
│   │   └── index.html          # HTML template
│   ├── src/
│   │   ├── App.tsx             # Main React component
│   │   ├── App.css             # Styles
│   │   ├── client.ts           # AgentClient re-export
│   │   └── main.tsx            # React entry point
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── DefaultFrontendResource.ts   # Fastify resource
├── index.ts                     # Package entry
└── package.json
```

## Integration

The web-frontend package requires:
- `@tokenring-ai/web-host` - Provides the web server
- `@tokenring-ai/agent-api` - Provides the WebSocket API and AgentClient

The frontend uses:
- `AgentClient` from `@tokenring-ai/agent-api/client`
- WebSocket connection to `/ws` endpoint
- React 18 with TypeScript
- Vite for building

## Browser Compatibility

- Modern browsers with WebSocket support
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+

## Deployment

### Production Build

```bash
cd pkg/web-frontend/frontend
npm run build
```

The built files in `dist/` are automatically served when the package is loaded.

### Docker

The frontend is included in the TokenRing Coder Docker image:

```bash
docker run -ti --rm \
  -v ./your-project:/repo:rw \
  -e OPENAI_API_KEY \
  -p 3000:3000 \
  ghcr.io/tokenring-ai/tokenring-coder:latest \
  --source /repo --web
```

Access at `http://localhost:3000`

## Dependencies

**Package Dependencies:**
- `@tokenring-ai/agent` (^0.1.0): Agent system
- `@tokenring-ai/web-host` (^0.1.0): Web server

**Frontend Dependencies:**
- `react` (^18.3.1): UI framework
- `react-dom` (^18.3.1): React DOM rendering
- `@vitejs/plugin-react` (^4.3.4): Vite React plugin
- `typescript` (^5.7.2): TypeScript support
- `vite` (^6.0.3): Build tool

## License

MIT License - Copyright (c) 2025 Mark Dierolf
