import React, {useState, type ReactNode} from 'react';
import OriginalDocItemFooter from '@theme-original/DocItem/Footer';
import {useDoc} from '@docusaurus/plugin-content-docs/client';
import {Check, Copy, FileDown, FileText, MessageSquarePlus} from 'lucide-react';
import styles from './styles.module.css';
import Link from '@docusaurus/Link';
import {relatedLearningPages} from '@site/src/data/learningCatalog';
import {exportPageAsPdf, exportPageAsWord} from '@site/src/utils/pageExport';

export default function DocItemFooter(): ReactNode {
  const {metadata} = useDoc();
  const [copied, setCopied] = useState(false);
  const issueTitle = encodeURIComponent(`Docs feedback: ${metadata.title}`);
  const issueBody = encodeURIComponent(`## Documentation page\n\n${metadata.permalink}\n\n## What should be improved?\n\n`);
  const issueUrl = `https://github.com/taukhir/shopverse/issues/new?title=${issueTitle}&body=${issueBody}&labels=documentation`;
  const related = relatedLearningPages(metadata.permalink.replace(/^\/shopverse/, '') || '/');

  const copyPageLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <>
      <aside className={styles.feedback} aria-label="Documentation feedback">
        <div>
          <strong>Help improve this guide</strong>
          <span>Share the page or tell us what is unclear, outdated, or missing.</span>
        </div>
        <div className={styles.actions}>
          <button type="button" onClick={copyPageLink}>
            {copied ? <Check aria-hidden="true" /> : <Copy aria-hidden="true" />}
            {copied ? 'Copied' : 'Copy link'}
          </button>
          <button type="button" onClick={exportPageAsPdf}><FileDown aria-hidden="true" />Export PDF</button>
          <button type="button" onClick={() => exportPageAsWord(metadata.title)}><FileText aria-hidden="true" />Export Word</button>
          <a href={issueUrl} target="_blank" rel="noreferrer">
            <MessageSquarePlus aria-hidden="true" />Suggest an improvement
          </a>
        </div>
      </aside>
      {related.length > 0 && <aside className={styles.related}><strong>Related learning</strong><div>{related.map(page=><Link key={page.path} to={page.path}><span>{page.stage} · {page.difficulty}</span><strong>{page.title}</strong></Link>)}</div></aside>}
      <OriginalDocItemFooter />
    </>
  );
}
