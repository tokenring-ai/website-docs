# Agent Persistence Plan: Save & Restore Running Agents

## Current State Analysis

### What Already Exists ✅
1. **Agent Checkpoint System** - `pkg/checkpoint/` provides:
   - `AgentCheckpointService` for storing/retrieving agent checkpoints
   - `AgentCheckpointProvider` interface for pluggable storage backends
   - Auto-checkpoint hook (`autoCheckpoint.ts`) that saves after input
   - Manual checkpoint commands (`/checkpoint create`, `restore`, `list`, `history`)
   - Browser-based storage (`BrowserAgentStateStorage`) and Drizzle-based storage options

2. **Agent Architecture** - `pkg/agent/` provides:
   - `Agent.generateCheckpoint()` method that captures full state
   - `Agent.restoreState()` method for state recovery
   - `AgentManager` for managing multiple agents
   - `Agent.createAgentFromCheckpoint()` static method for recovery

3. **Lifecycle Hooks** - Auto-checkpoint already fires on:
   - `afterAgentInputComplete`
   - `beforeChatCompletion`

### Gaps Identified ❌
1. **No automatic checkpoint on app shutdown**
2. **No automatic restore on app startup**
3. **No centralized "save all agents" mechanism**
4. **No agent state serialization for transport**
5. **No graceful shutdown handling**

---

## Implementation Plan

### Phase 1: Core Infrastructure (2-3 hours)

#### 1.1 Add App Shutdown Hook (`pkg/app/TokenRingApp.ts`)
**Purpose**: Capture all running agents before app exits

```typescript
// In TokenRingApp.shutdown()
async shutdown(reason: string) {
  // Save all agent checkpoints first
  await this.saveAllAgents();
  
  // Then proceed with normal shutdown
  this.abortController.abort(reason);
}
```

#### 1.2 Create AgentManager.saveAllAgents() (`pkg/agent/services/AgentManager.ts`)
**Purpose**: Iterate all agents and checkpoint them

```typescript
async saveAllAgents() {
  const checkpointService = this.app.getServiceByType(AgentCheckpointService);
  if (!checkpointService) {
    console.warn('No checkpoint service available, skipping agent saves');
    return;
  }

  for (const agent of this.agents.values()) {
    try {
      const checkpointName = `shutdown-${agent.config.name}-${Date.now()}`;
      await checkpointService.saveAgentCheckpoint(checkpointName, agent);
      this.app.serviceOutput(`Saved checkpoint for ${agent.name}`);
    } catch (err) {
      this.app.serviceError(`Failed to save checkpoint for ${agent.name}:`, err);
    }
  }
}
```

#### 1.3 Create AgentManager.restoreAllAgents() (`pkg/agent/services/AgentManager.ts`)
**Purpose**: Restore agents from checkpoints on startup

```typescript
async restoreAllAgents() {
  const checkpointService = this.app.getServiceByType(AgentCheckpointService);
  if (!checkpointService) return;

  const checkpoints = await checkpointService.listCheckpoints();
  
  // Group checkpoints by agent type, get most recent for each
  const latestCheckpoints = this.groupByLatest(checkpoints);

  for (const checkpoint of latestCheckpoints) {
    try {
      const agent = await this.spawnAgentFromCheckpoint(checkpoint, {
        headless: true, // Start in headless mode for background processing
        createMessage: `Recovered from checkpoint: ${checkpoint.name}`
      });
      this.app.serviceOutput(`Restored agent: ${agent.config.name}`);
    } catch (err) {
      this.app.serviceError(`Failed to restore checkpoint:`, err);
    }
  }
}
```

---

### Phase 2: App Startup Integration (1-2 hours)

#### 2.1 Modify TokenRingApp.run() to restore agents
**Purpose**: Restore agents after services start but before main run loop

```typescript
async run() {
  const signal = this.abortController.signal;
  
  // Start all services
  await Promise.all([
    ...this.services.getItems().map(async (service) => {
      await service.start?.(signal);
    })
  ]);

  // Restore agents from checkpoints (after AgentCheckpointService starts)
  await this.restoreAgentsFromCheckpoints();

  // Continue with normal run loop...
}
```

#### 2.2 Add restoreAgentsFromCheckpoints() method
**Purpose**: Trigger agent restoration at the right time

```typescript
private async restoreAgentsFromCheckpoints() {
  const agentManager = this.getService(AgentManager);
  if (agentManager) {
    await agentManager.restoreAllAgents();
  }
}
```

---

### Phase 3: User Configurable Options (2 hours)

#### 3.1 Add Configuration Schema (`pkg/agent/schema.ts`)
```typescript
export const AgentConfigSchema = z.object({
  // ... existing fields ...
  persistent: z.boolean().default(false), // Should this agent be persisted?
  recoverOnStartup: z.boolean().default(true), // Should this agent recover from checkpoint?
});
```

#### 3.2 Filter Agents During Restore
Only restore agents marked for recovery:

```typescript
async restoreAllAgents() {
  // ... checkpoint retrieval ...
  
  for (const checkpoint of latestCheckpoints) {
    // Skip agents that shouldn't be recovered
    if (!checkpoint.config.recoverOnStartup) continue;
    
    // ... restore logic ...
  }
}
```

---

### Phase 4: User Interface (3-4 hours)

#### 4.1 CLI Command: `/agents save`
**Purpose**: Manual save of all agents

```typescript
// In pkg/agent/commands/agent.ts
const saveCommand: TokenRingAgentCommand = {
  name: 'save',
  description: 'Save all currently running agents',
  execute: async (_, agent) => {
    const manager = agent.getServiceByType(AgentManager);
    if (manager) {
      await manager.saveAllAgents();
      agent.chatOutput('✅ Saved checkpoints for all agents');
    } else {
      agent.errorMessage('AgentManager not available');
    }
  },
  help: '/agents save - Save all currently running agents'
};
```

#### 4.2 CLI Command: `/agents restore`
**Purpose**: Manual restore of agents

```typescript
const restoreCommand: TokenRingAgentCommand = {
  name: 'restore',
  description: 'Restore agents from checkpoints',
  execute: async (_, agent) => {
    const manager = agent.getServiceByType(AgentManager);
    const checkpointService = agent.getServiceByType(AgentCheckpointService);
    
    if (!manager || !checkpointService) {
      agent.errorMessage('Required services not available');
      return;
    }

    const checkpoints = await checkpointService.listCheckpoints();
    // Show interactive selection...
    // Restore selected checkpoint
  },
  help: '/agents restore - Restore agents from checkpoints'
};
```

#### 4.3 Web UI: Agents Dashboard
**Purpose**: Visual overview of persistent agents

```typescript
// In frontend/chat/src/components/AgentsDashboard.tsx
export default function AgentsDashboard() {
  const [agents, setAgents] = useState([]);
  const [checkpoints, setCheckpoints] = useState([]);
  
  useEffect(() => {
    // Fetch agents and checkpoints via RPC
  }, []);

  return (
    <div>
      <h2>Running Agents</h2>
      <ul>{agents.map(agent => (
        <li key={agent.id}>
          {agent.name} - {agent.config.persistent ? 'Persistent' : 'Temporary'}
        </li>
      ))}</ul>

      <h2>Agent Checkpoints</h2>
      <ul>{checkpoints.map(cp => (
        <li key={cp.id}>
          {cp.name} - {cp.createdAt} 
          <button onClick={() => restoreCheckpoint(cp.id)}>Restore</button>
        </li>
      ))}</ul>
    </div>
  );
}
```

---

### Phase 5: Advanced Features (4-6 hours)

#### 5.1 Smart Checkpoint Management
- **Auto-cleanup old checkpoints** (keep last N per agent)
- **Checkpoints with tags** for better organization
- **Incremental checkpoints** to reduce storage

#### 5.2 State Pruning
**Problem**: Checkpoints can be huge (full state history)
**Solution**: Create lightweight "resume" checkpoints

```typescript
async createResumeCheckpoint(agent: Agent): Promise<AgentCheckpointData> {
  const fullCheckpoint = agent.generateCheckpoint();
  
  // Prune large state slices
  const prunedState = { ...fullCheckpoint.state };
  
  // Remove chat history from state (can be rebuilt)
  delete prunedState.AgentEventState?.events?.slice(0, -10); // Keep last 10
  delete prunedState.CommandHistoryState?.commands?.slice(0, -50);
  
  return {
    ...fullCheckpoint,
    state: prunedState,
    isResumeCheckpoint: true
  };
}
```

#### 5.3 Conflict Resolution
**Scenario**: Multiple checkpoints for same agent
**Solution**: Implement conflict resolution strategies

```typescript
type RestoreStrategy = 'latest' | 'earliest' | 'manual' | 'size';

async restoreAllAgents(strategy: RestoreStrategy = 'latest') {
  const checkpoints = await checkpointService.listCheckpoints();
  
  // Group by agent ID
  const grouped = checkpoints.reduce((acc, cp) => {
    acc[cp.agentId] = acc[cp.agentId] || [];
    acc[cp.agentId].push(cp);
    return acc;
  }, {} as Record<string, StoredAgentCheckpoint[]>);

  // Apply strategy
  const toRestore = Object.entries(grouped).map(([_, cps]) => {
    switch(strategy) {
      case 'latest': return cps.sort((a, b) => b.createdAt - a.createdAt)[0];
      case 'earliest': return cps.sort((a, b) => a.createdAt - b.createdAt)[0];
      case 'size': return cps.sort((a, b) => JSON.stringify(a.state).length - JSON.stringify(b.state).length)[0];
      default: return cps[0];
    }
  });
}
```

#### 5.4 Graceful Shutdown with Timeout
**Scenario**: App shutdown while agents are processing
**Solution**: Wait for active work to complete with timeout

```typescript
async gracefulShutdown(timeoutMs: number = 30000) {
  const agentManager = this.getService(AgentManager);
  
  if (agentManager) {
    // Signal all agents to stop accepting new work
    for (const agent of agentManager.getAgents()) {
      agent.setBusyWith('Shutting down - finishing current work');
    }

    // Wait for active work to complete
    await Promise.race([
      this.waitForAgentsIdle(agentManager),
      setTimeout(timeoutMs)
    ]);

    // Save checkpoints
    await agentManager.saveAllAgents();
  }

  // Force shutdown
  this.shutdown('Graceful shutdown completed');
}

private async waitForAgentsIdle(agentManager: AgentManager, timeoutMs: number) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const allIdle = agentManager.getAgents().every(
      agent => !agent.getState(AgentExecutionState).currentlyExecuting
    );
    
    if (allIdle) return;
    await setTimeout(500);
  }
  throw new Error('Timeout waiting for agents to become idle');
}
```

---

### Phase 6: Testing & Documentation (4-5 hours)

#### 6.1 Integration Tests
```typescript
// pkg/agent/test/integration/persistence.test.ts
describe('Agent Persistence', () => {
  it('should save and restore all agents', async () => {
    // 1. Create app with agents
    // 2. Add some work to queue
    // 3. Trigger saveAllAgents
    // 4. Verify checkpoints stored
    // 5. Restart app
    // 6. Verify agents restored with correct state
  });

  it('should handle checkpoint conflicts', async () => {
    // Test multiple checkpoints for same agent
  });

  it('should respect persistent flag', async () => {
    // Test agents with persistent: false aren't saved
  });
});
```

#### 6.2 Documentation
- Update `docs/docs/agents/persistence.md`
- Add examples in `pkg/agent/README.md`
- Create migration guide from non-persistent to persistent

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    TokenRingApp                             │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  App Lifecycle                                       │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │  App Start   │  │  Running     │  │  App Exit   │ │  │
│  │  │              │  │  Loop        │  │             │ │  │
│  │  │  restoreAll  │→ │              │→ │  saveAll    │ │  │
│  │  │  agents      │  │  ┌─────────┐ │  │  agents     │ │  │
│  │  └──────┬───────┘  │  │ agents  │ │  └─────┬───────┘ │  │
│  │         │          │  │ running │ │        │          │  │
│  │         │          │  └─────┬───┘ │        │          │  │
│  │         │          │        │     │        │          │  │
│  │  ┌──────▼───────┐  │  ┌─────▼─────┐ │  ┌────▼────────┐ │  │
│  │  │AgentManager  │  │  │ Execute   │ │  │Checkpoint  │ │  │
│  │  │              │  │  │ Commands  │ │  │ Service    │ │  │
│  │  │ - saveAll    │  │  │           │ │  │            │ │  │
│  │  │ - restoreAll │  │  └───────────┘ │  │ - store    │ │  │
│  │  └──────────────┘  │        │     │  │ - retrieve │ │  │
│  │                    └────────────────┘  └─────┬──────┘ │  │
│  └──────────────────────────────────────────────┘        │  │
│                                                            │  │
│  ┌──────────────────────────────────────────────────────┐ │  │
│  │  Storage Providers                                   │ │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐│ │  │
│  │  │  Browser     │  │  Drizzle     │  │  Custom     ││ │  │
│  │  │  Storage     │  │  Storage     │  │  Provider   ││ │  │
│  │  │  (localStorage│  │  (SQL/MySQL)│  │  (S3, etc.) ││ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────┘│ │  │
│  └──────────────────────────────────────────────────────┘ │  │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Order (Recommended)

1. **Phase 1.1-1.2** (App shutdown hook + save all agents) - *Highest priority*
2. **Phase 1.3** (Restore all agents) - *Enable recovery*
3. **Phase 2.1-2.2** (App startup integration) - *Complete cycle*
4. **Phase 4** (User interface) - *Enable manual control*
5. **Phase 3** (Configuration) - *Make it configurable*
6. **Phase 5** (Advanced features) - *Polish and optimization*
7. **Phase 6** (Testing & docs) - *Production ready*

---

## Benefits of This Design

✅ **Minimal code changes** - Leverages existing checkpoint system  
✅ **Non-breaking** - Existing behavior unchanged unless enabled  
✅ **Flexible** - Multiple storage backends supported  
✅ **User-friendly** - Manual controls and visual dashboards  
✅ **Production-ready** - Comprehensive error handling and testing  
