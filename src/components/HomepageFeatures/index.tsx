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
    title: 'Code Operations',
    emoji: '🛠️',
    description: (
      <>
        Edit, refactor, test, and commit code changes with AI assistance.
        Integrated git operations and automated testing.
      </>
    ),
  },
  {
    title: 'Local & Secure',
    emoji: '🔒',
    description: (
      <>
        Your code stays on your machine. Run locally with full control
        over your data and development environment.
      </>
    ),
  },
  {
    title: 'Extensible Plugins',
    emoji: '🧩',
    description: (
      <>
        37+ plugins for filesystem, databases, cloud services, web search,
        Docker, Kubernetes, and more.
      </>
    ),
  },
  {
    title: 'Specialized Agents',
    emoji: '🎯',
    description: (
      <>
        Different AI agents for specific tasks: frontend, backend, testing,
        security review, and team leadership.
      </>
    ),
  },
  {
    title: 'Cloud Integration',
    emoji: '☁️',
    description: (
      <>
        Built-in support for AWS, S3, Docker, Kubernetes, and other
        cloud services for modern development workflows.
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
