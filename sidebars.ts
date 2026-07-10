import type {SidebarsConfig} from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Apps',
      items: [
        'apps/one',
      ],
    },
    {
      type: 'category',
      label: 'Agents',
      items: [
        'agents/overview',
        {
          type: 'category',
          label: 'Coding',
          items: [
            'agents/code',
            'agents/leader',
            'agents/plan',
            'agents/swarm',
          ],
        },
        {
          type: 'category',
          label: 'Research',
          items: [
            'agents/search',
            'agents/deep-research',
          ],
        },
        {
          type: 'category',
          label: 'Coding - Specialized',
          items: [
            'agents/accessibility-engineer',
            'agents/api-designer',
            'agents/auth-design',
            'agents/backend-design',
            'agents/business-logic-engineer',
            'agents/code-explorer',
            'agents/code-quality-engineer',
            'agents/data-engineer',
            'agents/database-design',
            'agents/devops-engineer',
            'agents/documentation-engineer',
            'agents/frontend-design',
            'agents/full-stack-developer',
            'agents/integration-engineer',
            'agents/performance-engineer',
            'agents/product-design-engineer',
            'agents/product-manager',
            'agents/security-review',
            'agents/seo-engineer',
            'agents/system-architect',
            'agents/test-engineer',
            'agents/ui-ux-designer',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Plugins',
      items: [
        'plugins/acp',
        'plugins/agent',
        'plugins/ai-client',
        'plugins/app',
        'plugins/audio',
        'plugins/aws',
        'plugins/blog',
        'plugins/bun-storage',
        'plugins/calendar',
        'plugins/cdn',
        'plugins/chat',
        'plugins/checkpoint',
        'plugins/chrome',
        'plugins/cli',
        'plugins/cloudquote',
        'plugins/code-watch',
        'plugins/codebase',
        'plugins/database',
        'plugins/discord',
        'plugins/docker',
        'plugins/drizzle-storage',
        'plugins/escalation',
        'plugins/feedback',
        'plugins/file-index',
        'plugins/filesystem',
        'plugins/ghost-io',
        'plugins/git',
        'plugins/github',
        'plugins/google',
        'plugins/javascript',
        'plugins/kalshi',
        'plugins/kubernetes',
        'plugins/linux-audio',
        'plugins/lifecycle',
        'plugins/markdown',
        'plugins/mcp',
        'plugins/media-library',
        'plugins/memory',
        'plugins/metrics',
        'plugins/mysql',
        'plugins/newsrpm',
        'plugins/overview',
        'plugins/polymarket',
        'plugins/posix-system',
        'plugins/queue',
        'plugins/reddit',
        'plugins/research',
        'plugins/rpc',
        'plugins/s3',
        'plugins/sandbox',
        'plugins/scheduler',
        'plugins/scraperapi',
        'plugins/scripting',
        'plugins/serper',
        'plugins/skills',
        'plugins/slack',
        'plugins/social',
        'plugins/telegram',
        'plugins/terminal',
        'plugins/testing',
        'plugins/typescript',
        'plugins/utility',
        'plugins/vault',
        'plugins/video',
        'plugins/web-host',
        'plugins/websearch',
        'plugins/wikipedia',
        'plugins/wordpress',
        'plugins/workflow',
        'plugins/x',
      ],
    },
  ],
};

export default sidebars;
