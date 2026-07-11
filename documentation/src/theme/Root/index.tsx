import React, {useEffect, useState, type ReactNode} from 'react';
import {ArrowUp, ListTree, X} from 'lucide-react';
import styles from './styles.module.css';
import ReaderLibrary from '@site/src/components/ReaderLibrary';
import CommandPalette from '@site/src/components/CommandPalette';
import PrivacyAnalytics from '@site/src/components/PrivacyAnalytics';

export default function Root({children}: {children: ReactNode}) {
  const [progress, setProgress] = useState(0);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [showMobileContents, setShowMobileContents] = useState(false);
  const [zoomedImage, setZoomedImage] = useState<{src: string; alt: string} | null>(null);

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
    </>
  );
}
