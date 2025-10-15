import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

type FeatureItem = {
  title: string;
  emoji: string;
  description: ReactNode;
};

const FeatureList: FeatureItem[] = [
  {
    title: 'TokenRing Coder',
    emoji: '💻',
    description: (
      <>
        AI-powered coding assistant for software development. Edit, refactor, test,
        and commit code with integrated git operations and automated testing.
      </>
    ),
  },
  {
    title: 'TokenRing Writer',
    emoji: '✍️',
    description: (
      <>
        Unified platform for content creation and publishing. Research, write, and
        publish articles with WordPress, Ghost.io, and NewsRPM integration.
      </>
    ),
  },
  {
    title: 'Multiple AI Providers',
    emoji: '🤖',
    description: (
      <>
        Support for OpenAI, Anthropic, Google, Groq, Cerebras, DeepSeek, and more.
        Switch between models seamlessly with unified API.
      </>
    ),
  },
  {
    title: '40+ Extensible Plugins',
    emoji: '🧩',
    description: (
      <>
        Shared plugin ecosystem for filesystem, databases, cloud services, web search,
        Docker, Kubernetes, content publishing, and more.
      </>
    ),
  },
  {
    title: 'Local & Secure',
    emoji: '🔒',
    description: (
      <>
        Your data stays on your machine. Run locally with full control
        over your code, content, and development environment.
      </>
    ),
  },
  {
    title: 'Specialized Agents',
    emoji: '🎯',
    description: (
      <>
        Different AI agents for specific tasks: coding, writing, editing, research,
        testing, security review, and publishing.
      </>
    ),
  },
];

function Feature({title, emoji, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center" style={{fontSize: '4rem', marginBottom: '1rem'}}>
        {emoji}
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
