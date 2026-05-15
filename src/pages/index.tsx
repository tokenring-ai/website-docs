import type {ReactNode} from 'react';
import clsx from 'clsx';
import Link from '@docusaurus/Link';
import Layout from '@theme/Layout';
import HomepageFeatures from '@site/src/components/HomepageFeatures';
import Heading from '@theme/Heading';

import styles from './index.module.css';

function HomepageHeader() {
  //const {siteConfig} = useDocusaurusContext();
  return (
    <header className={clsx('hero hero--primary', styles.heroBanner)}>
      <div className="container">
        <Heading as="h1" className="hero__title">
          TokenRing AI
        </Heading>
        <p className="hero__subtitle">A comprehensive AI-powered assistant ecosystem for development, research, and automation</p>
        <div className={styles.buttons}>
          <Link
            className="button button--secondary button--lg"
            to="/docs/intro">
            Get Started 🚀
          </Link>
          <Link
            className="button button--outline button--secondary button--lg"
            to="/docs/plugins/overview"
            style={{marginLeft: '1rem'}}>
            View Plugins
          </Link>
        </div>
      </div>
    </header>
  );
}

export default function Home(): ReactNode {
  //const {siteConfig} = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="TokenRing AI - TokenRing One is a local AI assistant for software development, research, and automation, built on 40+ extensible plugins">
      <HomepageHeader />
      <main>
        <HomepageFeatures />
      </main>
    </Layout>
  );
}
