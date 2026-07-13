import React, {type ReactNode} from 'react';
import Tabs from '@theme/Tabs';
import TabItem from '@theme/TabItem';
import Link from '@docusaurus/Link';
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  BrainCircuit,
  CheckCircle2,
  Code2,
  FlaskConical,
  Gauge,
  Layers3,
  Lightbulb,
  Network,
  Route,
  ServerCog,
  ShieldCheck,
  type LucideIcon,
} from 'lucide-react';
import styles from './styles.module.css';

export function DependencyTabs({maven, gradle}: {maven: ReactNode; gradle: ReactNode}) {
  return <Tabs groupId="build-tool" queryString="build-tool"><TabItem value="maven" label="Maven" default>{maven}</TabItem><TabItem value="gradle" label="Gradle">{gradle}</TabItem></Tabs>;
}

export function CommandTabs({powershell, bash}: {powershell: ReactNode; bash: ReactNode}) {
  return <Tabs groupId="shell" queryString="shell"><TabItem value="powershell" label="PowerShell" default>{powershell}</TabItem><TabItem value="bash" label="Linux / macOS">{bash}</TabItem></Tabs>;
}

export function VersionTabs({items}: {items: Array<{label: string; value: string; content: ReactNode}>}) {
  return <Tabs groupId="version">{items.map((item, index) => <TabItem key={item.value} value={item.value} label={item.label} default={index === 0}>{item.content}</TabItem>)}</Tabs>;
}

export function ExpandableAnswer({title = 'Show answer', children}: {title?: string; children: ReactNode}) {
  return <details className={styles.answer}><summary>{title}</summary><div>{children}</div></details>;
}

export function BeforeAfter({before, after, beforeLabel = 'Before', afterLabel = 'After'}: {before: ReactNode; after: ReactNode; beforeLabel?: string; afterLabel?: string}) {
  return <div className={styles.comparison}><section><span>{beforeLabel}</span>{before}</section><section><span>{afterLabel}</span>{after}</section></div>;
}

export function ApiPanel({method, path, title, children}: {method: string; path: string; title?: string; children: ReactNode}) {
  return <section className={styles.apiPanel}><header><strong data-method={method.toUpperCase()}>{method.toUpperCase()}</strong><code>{path}</code>{title && <span>{title}</span>}</header><div>{children}</div></section>;
}

const calloutConfig = {
  mistake: {label: 'Common mistake', icon: AlertTriangle},
  production: {label: 'Production note', icon: ServerCog},
  shopverse: {label: 'Shopverse implementation', icon: CheckCircle2},
  tip: {label: 'Practical tip', icon: Lightbulb},
  code: {label: 'Implementation detail', icon: Code2},
} as const;

export function DocCallout({type = 'tip', title, children}: {type?: keyof typeof calloutConfig; title?: string; children: ReactNode}) {
  const config = calloutConfig[type];
  const Icon = config.icon;
  return <aside className={`${styles.callout} ${styles[type]}`}><Icon aria-hidden="true" /><div><strong>{title ?? config.label}</strong><div>{children}</div></div></aside>;
}

const topicIcons = {
  book: BookOpen,
  boxes: Boxes,
  brain: BrainCircuit,
  code: Code2,
  experiment: FlaskConical,
  gauge: Gauge,
  layers: Layers3,
  network: Network,
  route: Route,
  security: ShieldCheck,
} satisfies Record<string, LucideIcon>;

type TopicIcon = keyof typeof topicIcons;
type LabelTone = 'foundation' | 'intermediate' | 'advanced' | 'production' | 'shopverse' | 'preview';

export function DocLabels({items}: {items: Array<{label: string; tone?: LabelTone}>}) {
  return <div className={styles.labels} aria-label="Page labels">{items.map((item) => (
    <span className={styles[item.tone ?? 'foundation']} key={`${item.tone}-${item.label}`}>{item.label}</span>
  ))}</div>;
}

export function TopicCards({items}: {items: Array<{
  title: string;
  href: string;
  description: string;
  icon?: TopicIcon;
  tags?: string[];
}>}) {
  return <div className={styles.topicCards}>{items.map((item) => {
    const Icon = topicIcons[item.icon ?? 'book'];
    return <Link className={styles.topicCard} to={item.href} key={item.href}>
      <span className={styles.topicIcon}><Icon aria-hidden="true" /></span>
      <span className={styles.topicBody}>
        <strong>{item.title}</strong>
        <span>{item.description}</span>
        {item.tags?.length ? <span className={styles.topicTags}>{item.tags.map((tag) => <small key={tag}>{tag}</small>)}</span> : null}
      </span>
    </Link>;
  })}</div>;
}
