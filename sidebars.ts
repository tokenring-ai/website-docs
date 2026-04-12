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
        'apps/coder',
        'apps/writer',
      ],
    },
    {
      type: 'category',
      label: 'Agents',
      items: [
        'agents/overview',
        {
          type: 'category',
          label: 'Writing',
          items: [
            'agents/manager',
            'agents/writer',
          ],
        },
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
            'agents/research',
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
        'plugins/agent',
        'plugins/ai-client',
        'plugins/app',
        'plugins/audio',
        'plugins/aws',
        'plugins/blog',
        'plugins/browser-agent-storage',
        'plugins/browser-file-system',
        'plugins/cdn',
        'plugins/chat',
        'plugins/checkpoint',
        'plugins/chrome',
        'plugins/cli',
        'plugins/cli-overview',
        'plugins/cloudquote',
        'plugins/codebase',
        'plugins/code-watch',
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
        'plugins/history',
        'plugins/image-generation',
        'plugins/iterables',
        'plugins/javascript',
        'plugins/kalshi',
        'plugins/kubernetes',
        'plugins/linux-audio',
        'plugins/local-filesystem',
        'plugins/mcp',
        'plugins/memory',
        'plugins/mysql',
        'plugins/newsrpm',
        'plugins/overview',
        'plugins/polymarket',
        'plugins/queue',
        'plugins/rpc',
        'plugins/reddit',
        'plugins/research',
        'plugins/s3',
        'plugins/sandbox',
        'plugins/scheduler',
        'plugins/scraperapi',
        'plugins/scripting',
        'plugins/serper',
        'plugins/slack',
        'plugins/sqlite-storage',
        'plugins/tasks',
        'plugins/telegram',
        'plugins/template',
        'plugins/testing',
        'plugins/thinking',
        'plugins/utility',
        'plugins/vault',
        'plugins/web-frontend',
        'plugins/web-host',
        'plugins/websearch',
        'plugins/wikipedia',
        'plugins/wordpress',
        'plugins/workflow',
      ],
    },
  ],
};

export default sidebars;
