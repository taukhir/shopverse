import React from 'react';
import {Keyboard, X} from 'lucide-react';
import styles from '../../theme/Root/styles.module.css';

export default function KeyboardShortcuts({onClose}: {onClose: () => void}) {
  return (
    <div className={styles.shortcutBackdrop} role="presentation" onClick={onClose}>
      <section className={styles.shortcutDialog} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(event) => event.stopPropagation()}>
        <header><div><Keyboard /><strong>Keyboard shortcuts</strong></div><button type="button" onClick={onClose} aria-label="Close keyboard shortcuts"><X /></button></header>
        <dl>
          <div><dt><kbd>/</kbd></dt><dd>Quick find</dd></div>
          <div><dt><kbd>Shift</kbd> <kbd>F</kbd></dt><dd>Toggle focus mode</dd></div>
          <div><dt><kbd>Alt</kbd> <kbd>←</kbd></dt><dd>Previous guide</dd></div>
          <div><dt><kbd>Alt</kbd> <kbd>→</kbd></dt><dd>Next guide</dd></div>
          <div><dt><kbd>?</kbd></dt><dd>Show this help</dd></div>
          <div><dt><kbd>Esc</kbd></dt><dd>Close dialogs</dd></div>
        </dl>
      </section>
    </div>
  );
}
