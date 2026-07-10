import { Directive, ElementRef, HostListener, Input, inject } from '@angular/core';

const DEFAULT_FALLBACK =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480"%3E%3Crect width="640" height="480" fill="%23f1f0f7"/%3E%3Crect x="64" y="64" width="512" height="352" fill="%23dedbea"/%3E%3Ccircle cx="236" cy="206" r="46" fill="%237887ff"/%3E%3Cpath d="M120 374 264 250l92 78 66-58 98 104z" fill="%230c1020" opacity=".72"/%3E%3C/svg%3E';

@Directive({
  selector: 'img[appImageFallback]',
  standalone: true,
})
export class ImageFallbackDirective {
  @Input() appImageFallback = DEFAULT_FALLBACK;
  private readonly element = inject<ElementRef<HTMLImageElement>>(ElementRef);
  private failed = false;

  @HostListener('error')
  protected onError(): void {
    if (this.failed) return;
    this.failed = true;
    const image = this.element.nativeElement;
    image.src = this.appImageFallback || DEFAULT_FALLBACK;
    image.classList.add('image-fallback');
  }
}
