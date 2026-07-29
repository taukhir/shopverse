import React, {useEffect, useState, type ReactNode} from 'react';
import {ArrowLeft, ArrowRight, ArrowUp, Focus, Keyboard, ListTree, Search, X} from 'lucide-react';
import styles from './styles.module.css';
import ReaderLibrary from '@site/src/components/ReaderLibrary';
import CommandPalette from '@site/src/components/CommandPalette';
import PrivacyAnalytics from '@site/src/components/PrivacyAnalytics';
import {readReaderState, writeReaderState} from '@site/src/utils/readerLibrary';

export default function Root({children}: {children: ReactNode}) {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMobileContents, setShowMobileContents] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{src: string; alt: string} | null>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  useEffect(() => {
    const updateReadingPosition = () => {
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? Math.min((window.scrollY / scrollable) * 100, 100) : 0);
      setShowBackToTop(window.scrollY > 600);
      setShowMobileContents(Boolean(document.querySelector('.theme-doc-toc-mobile')) && window.scrollY > 320);
    };

    const openImage = (event: MouseEvent) => {
      const image = (event.target as HTMLElement).closest<HTMLImageElement>('.theme-doc-markdown img');
      if (!image || image.closest('a')) return;
      setZoomedImage({src: image.currentSrc || image.src, alt: image.alt});
    };

    updateReadingPosition();
    window.addEventListener('scroll', updateReadingPosition, {passive: true});
    document.addEventListener('click', openImage);
    return () => {
      window.removeEventListener('scroll', updateReadingPosition);
      document.removeEventListener('click', openImage);
    };
  }, []);

  useEffect(() => {
    if (!zoomedImage) return undefined;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setZoomedImage(null);
    };
    document.addEventListener('keydown', closeOnEscape);
    document.body.classList.add(styles.noScroll);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      document.body.classList.remove(styles.noScroll);
    };
  }, [zoomedImage]);

  useEffect(() => {
    const onShortcut = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.matches('input, textarea, select') || target.isContentEditable) return;
      if (event.key === 'Escape') { setShowShortcuts(false); return; }
      if (event.key === '?') { event.preventDefault(); setShowShortcuts(true); return; }
      if (event.key === '/') { event.preventDefault(); document.querySelector<HTMLButtonElement>('button[aria-label="Open command palette"]')?.click(); return; }
      if (event.shiftKey && event.key.toLowerCase() === 'f') { const state = readReaderState(); writeReaderState({...state, focusMode: !state.focusMode}); return; }
      if (event.altKey && event.key === 'ArrowLeft') document.querySelector<HTMLAnchorElement>('.pagination-nav__link--prev')?.click();
      if (event.altKey && event.key === 'ArrowRight') document.querySelector<HTMLAnchorElement>('.pagination-nav__link--next')?.click();
    };
    window.addEventListener('keydown', onShortcut);
    return () => window.removeEventListener('keydown', onShortcut);
  }, []);

  return (
    <>
      <div className={styles.progressTrack} aria-hidden="true">
        <div className={styles.progressBar} style={{width: `${progress}%`}} />
      </div>
      {children}
      <ReaderLibrary />
      <CommandPalette />
      <PrivacyAnalytics />
      <button
        className={`${styles.mobileContents} ${showMobileContents ? styles.visible : ''}`}
        type="button"
        aria-label="Jump to the table of contents"
        onClick={() => document.querySelector('.theme-doc-toc-mobile')?.scrollIntoView({behavior: 'smooth', block: 'center'})}
      >
        <ListTree aria-hidden="true" />
        On this page
      </button>
      <button className={styles.shortcutTrigger} type="button" aria-label="Show keyboard shortcuts" title="Keyboard shortcuts (?)" onClick={() => setShowShortcuts(true)}><Keyboard aria-hidden="true" /></button>
      <button
        className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
        type="button"
        aria-label="Back to top"
        title="Back to top"
        onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
      >
        <ArrowUp aria-hidden="true" />
      </button>
      {zoomedImage && (
        <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={zoomedImage.alt || 'Image preview'} onClick={() => setZoomedImage(null)}>
          <button type="button" aria-label="Close image preview" onClick={() => setZoomedImage(null)}>
            <X aria-hidden="true" />
          </button>
          <img src={zoomedImage.src} alt={zoomedImage.alt} onClick={(event) => event.stopPropagation()} />
        </div>
      )}
      {showShortcuts && <div className={styles.shortcutBackdrop} role="presentation" onClick={() => setShowShortcuts(false)}><section className={styles.shortcutDialog} role="dialog" aria-modal="true" aria-label="Keyboard shortcuts" onClick={(event) => event.stopPropagation()}><header><div><Keyboard /><strong>Keyboard shortcuts</strong></div><button type="button" onClick={() => setShowShortcuts(false)} aria-label="Close keyboard shortcuts"><X /></button></header><dl><div><dt><kbd>/</kbd></dt><dd><Search />Quick find</dd></div><div><dt><kbd>Shift</kbd> <kbd>F</kbd></dt><dd><Focus />Toggle focus mode</dd></div><div><dt><kbd>Alt</kbd> <kbd>←</kbd></dt><dd><ArrowLeft />Previous guide</dd></div><div><dt><kbd>Alt</kbd> <kbd>→</kbd></dt><dd><ArrowRight />Next guide</dd></div><div><dt><kbd>?</kbd></dt><dd><Keyboard />Show this help</dd></div><div><dt><kbd>Esc</kbd></dt><dd><X />Close dialogs</dd></div></dl></section></div>}
    </>
  );
}
