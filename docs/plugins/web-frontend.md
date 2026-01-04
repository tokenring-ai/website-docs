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
import &#123; AgentTeam &#125; from "@tokenring-ai/agent";
import &#123; packageInfo as webHostPackage &#125; from "@tokenring-ai/web-host";
import &#123; packageInfo as agentApiPackage &#125; from "@tokenring-ai/agent-api";
import &#123; packageInfo as webFrontendPackage &#125; from "@tokenring-ai/web-frontend";

const team = new AgentTeam(&#123;
  webHost: &#123; enabled: true, port: 3000 &#125;
&#125;);

await team.addPackages([
  webHostPackage,
  agentApiPackage,
  webFrontendPackage
]);

// Access at http://localhost:3000
```

### Custom Port

```typescript
const team = new AgentTeam(&#123;
  webHost: &#123; enabled: true, port: 8080 &#125;
&#125;);

await team.addPackages([
  webHostPackage,
  agentApiPackage,
  webFrontendPackage
]);

// Access at http://localhost:8080
```

### With Additional Packages

```typescript
import &#123; packageInfo as gitPackage &#125; from "@tokenring-ai/git";
import &#123; packageInfo as filesystemPackage &#125; from "@tokenring-ai/filesystem";

const team = new AgentTeam(&#123;
  webHost: &#123; enabled: true, port: 3000 &#125;
&#125;);

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
body &#123;
  background: #1e1e1e;  /* Background */
  color: #d4d4d4;       /* Text */
&#125;

.message.chat &#123;
  color: #4ec9b0;       /* Chat output */
&#125;

.message.reasoning &#123;
  color: #dcdcaa;       /* Reasoning */
&#125;
```

### Custom Agent Types

Modify `frontend/src/App.tsx` to add more agent creation options:

```typescript
&lt;div className="agent-list"&gt;
  &lt;h3&gt;Create New Agent&lt;/h3&gt;
  &lt;button onClick=&#123;() =&gt; createAgent('interactiveCodeAgent')&#125; className="agent-btn"&gt;
    Interactive Code Agent
  &lt;/button&gt;
  &lt;button onClick=&#123;() =&gt; createAgent('teamLeader')&#125; className="agent-btn"&gt;
    Team Leader
  &lt;/button&gt;
  &lt;button onClick=&#123;() =&gt; createAgent('testEngineer')&#125; className="agent-btn"&gt;
    Test Engineer
  &lt;/button&gt;
&lt;/div&gt;
```

### Custom Event Handling

Extend event handling in `frontend/src/App.tsx`:

```typescript
// Add custom event listener
client.on('event:custom.event', (data: any) =&gt; &#123;
  setMessages(m =&gt; [...m, &#123; 
    type: 'system', 
    content: `Custom: $&#123;data.message&#125;`,
    level: 'info'
  &#125;]);
&#125;);
```

### Custom Human Interaction

Replace the default `prompt()` with custom UI:

```typescript
client.on('event:human.request', async (data: any) =&gt; &#123;
  // Custom modal/dialog instead of prompt()
  const response = await showCustomDialog(&#123;
    title: "Agent Request",
    message: data.request.message,
    type: data.request.type
  &#125;);
  client.sendHumanResponse(data.sequence, response);
&#125;);
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

## License

MIT License - Copyright (c) 2025 Mark Dierolf
