# Configuration

TokenRing AI applications are configured through `.tokenring/coder-config.mjs` or `.tokenring/writer-config.mjs` files.

## Configuration File Location

Create your configuration file in the `.tokenring` directory:

```
your-project/
└── .tokenring/
    ├── coder-config.mjs
    └── writer-config.mjs
```

## Basic Configuration

```javascript
export default {
  defaults: {
    agent: "teamLeader",
    model: "gpt-4o"
  },
  models: {
    openai: {
      displayName: "OpenAI",
      apiKey: process.env.OPENAI_API_KEY
    },
    anthropic: {
      displayName: "Anthropic",
      apiKey: process.env.ANTHROPIC_API_KEY
    }
  }
};
```

## AI Provider Configuration

### OpenAI

```javascript
models: {
  openai: {
    displayName: "OpenAI",
    apiKey: process.env.OPENAI_API_KEY,
    defaultModel: "gpt-4o"
  }
}
```

### Anthropic

```javascript
models: {
  anthropic: {
    displayName: "Anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY,
    defaultModel: "claude-3-5-sonnet-20241022"
  }
}
```

### Google

```javascript
models: {
  google: {
    displayName: "Google",
    apiKey: process.env.GOOGLE_API_KEY,
    defaultModel: "gemini-2.0-flash-exp"
  }
}
```

## Agent Configuration

Configure specialized agents for different tasks:

```javascript
agents: {
  teamLeader: {
    name: "Team Leader",
    model: "gpt-4o",
    systemPrompt: "You are a team leader coordinating development tasks."
  },
  frontend: {
    name: "Frontend Developer",
    model: "claude-3-5-sonnet-20241022",
    systemPrompt: "You are a frontend specialist."
  }
}
```

## Plugin Configuration

Enable and configure plugins:

```javascript
plugins: {
  git: {
    enabled: true,
    autoCommit: true
  },
  testing: {
    enabled: true,
    autoRepair: true
  }
}
```

## Environment Variables

Set API keys and configuration via environment variables:

```bash
export OPENAI_API_KEY="your-key-here"
export ANTHROPIC_API_KEY="your-key-here"
export GOOGLE_API_KEY="your-key-here"
export AWS_ACCESS_KEY_ID="your-key-here"
export AWS_SECRET_ACCESS_KEY="your-key-here"
```

## Advanced Configuration

See individual [plugin documentation](./plugins/overview.md) for plugin-specific configuration options.
