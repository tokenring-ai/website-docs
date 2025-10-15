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
      label: 'Plugins',
      items: [
        'plugins/overview',
        'plugins/agent',
        'plugins/ai-client',
        'plugins/audio',
        'plugins/aws',
        'plugins/blog',
        'plugins/cdn',
        'plugins/checkpoint',
        'plugins/chrome',
        'plugins/cli',
        'plugins/cloudquote',
        'plugins/codebase',
        'plugins/code-watch',
        'plugins/database',
        'plugins/docker',
        'plugins/feedback',
        'plugins/file-index',
        'plugins/filesystem',
        'plugins/ghost-io',
        'plugins/git',
        'plugins/history',
        'plugins/iterables',
        'plugins/javascript',
        'plugins/kubernetes',
        'plugins/linux-audio',
        'plugins/local-filesystem',
        'plugins/mcp',
        'plugins/memory',
        'plugins/mysql',
        'plugins/newsrpm',
        'plugins/queue',
        'plugins/reddit',
        'plugins/research',
        'plugins/s3',
        'plugins/sandbox',
        'plugins/scraperapi',
        'plugins/scripting',
        'plugins/serper',
        'plugins/sqlite-storage',
        'plugins/tasks',
        'plugins/template',
        'plugins/testing',
        'plugins/utility',
        'plugins/vault',
        'plugins/websearch',
        'plugins/wikipedia',
        'plugins/wordpress',
      ],
    },
  ],
};

export default sidebars;
