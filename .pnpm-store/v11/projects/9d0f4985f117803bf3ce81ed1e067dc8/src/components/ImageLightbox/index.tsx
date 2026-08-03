import React from 'react';
import {X} from 'lucide-react';
import styles from '../../theme/Root/styles.module.css';

export default function ImageLightbox({image, onClose}: {image: {src: string; alt: string}; onClose: () => void}) {
  return (
    <div className={styles.lightbox} role="dialog" aria-modal="true" aria-label={image.alt || 'Image preview'} onClick={onClose}>
      <button type="button" aria-label="Close image preview" onClick={onClose}><X aria-hidden="true" /></button>
      <img src={image.src} alt={image.alt} onClick={(event) => event.stopPropagation()} />
    </div>
  );
}
