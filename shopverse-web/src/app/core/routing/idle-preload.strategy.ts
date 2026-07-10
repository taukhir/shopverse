import { Injectable } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class IdlePreloadStrategy implements PreloadingStrategy {
  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (route.data?.['preload'] !== true) return of(null);

    return new Observable((observer) => {
      let innerSubscription: { unsubscribe(): void } | null = null;
      let timeoutId: ReturnType<typeof setTimeout> | null = null;
      let idleId: number | null = null;
      const browser = globalThis as typeof globalThis & {
        requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
        cancelIdleCallback?: (handle: number) => void;
      };

      const start = () => {
        innerSubscription = load().subscribe(observer);
      };

      if (typeof browser.requestIdleCallback === 'function') {
        idleId = browser.requestIdleCallback(start, { timeout: 2_500 });
      } else {
        timeoutId = setTimeout(start, 1_200);
      }

      return () => {
        if (idleId !== null && typeof browser.cancelIdleCallback === 'function') {
          browser.cancelIdleCallback(idleId);
        }
        if (timeoutId !== null) clearTimeout(timeoutId);
        innerSubscription?.unsubscribe();
      };
    });
  }
}
