import { describe, expect, it } from 'vitest';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';

import { ImageFallbackDirective } from './image-fallback.directive';

function createDirective(): { directive: ImageFallbackDirective; image: HTMLImageElement } {
  const image = document.createElement('img');
  TestBed.configureTestingModule({ providers: [{ provide: ElementRef, useValue: new ElementRef(image) }] });
  const directive = TestBed.runInInjectionContext(() => new ImageFallbackDirective());
  return { directive, image };
}

describe('ImageFallbackDirective', () => {
  it('swaps the image src to the default fallback on error', () => {
    const { directive, image } = createDirective();
    image.src = 'https://example.test/missing.png';

    (directive as unknown as { onError(): void })['onError']();

    expect(image.src.startsWith('data:image/svg+xml')).toBe(true);
    expect(image.classList.contains('image-fallback')).toBe(true);
  });

  it('uses a custom fallback when provided', () => {
    const { directive, image } = createDirective();
    directive.appImageFallback = '/assets/custom-fallback.png';

    (directive as unknown as { onError(): void })['onError']();

    expect(image.src).toContain('/assets/custom-fallback.png');
  });

  it('only swaps the src once even if error fires again', () => {
    const { directive, image } = createDirective();
    const onError = (directive as unknown as { onError(): void })['onError'].bind(directive);

    onError();
    const fallbackSrc = image.src;
    image.src = 'https://example.test/another-missing.png';
    onError();

    expect(image.src).toBe('https://example.test/another-missing.png');
    expect(image.src).not.toBe(fallbackSrc);
  });
});
