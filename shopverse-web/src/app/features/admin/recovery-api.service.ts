import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, map, of } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';

export type RecoveryService = 'Orders' | 'Inventory' | 'Payments';
export type RecoveryServiceState = 'loading' | 'loaded' | 'error';

export interface FailedEvent {
  id: number;
  sourceTopic: string;
  payload: string;
  failureReason: string;
  retryCount: number;
  replayed: boolean;
  replayCount: number;
  lastReplayedBy: string | null;
  failedAt: string;
  replayedAt: string | null;
  service: RecoveryService;
}

const endpoints: Record<RecoveryService, string> = {
  Orders: API_PATHS.orders.deadLetters,
  Inventory: API_PATHS.inventory.deadLetters,
  Payments: API_PATHS.payments.deadLetters,
};

export interface RecoveryServiceResult {
  service: RecoveryService;
  events: FailedEvent[];
  state: Exclude<RecoveryServiceState, 'loading'>;
}

@Injectable({ providedIn: 'root' })
export class RecoveryApiService {
  private readonly http = inject(HttpClient);

  listEvents() {
    return forkJoin({
      Orders: this.loadServiceEvents('Orders'),
      Inventory: this.loadServiceEvents('Inventory'),
      Payments: this.loadServiceEvents('Payments'),
    }).pipe(map((result) => Object.values(result)));
  }

  loadServiceEvents(service: RecoveryService) {
    return this.http.get<Omit<FailedEvent, 'service'>[]>(endpoints[service]).pipe(
      map((events): RecoveryServiceResult => ({
        service,
        events: events.map((event) => ({ ...event, service })),
        state: 'loaded',
      })),
      catchError(() => of({ service, events: [], state: 'error' as const })),
    );
  }

  replay(event: FailedEvent) {
    return this.http.post<Omit<FailedEvent, 'service'>>(`${endpoints[event.service]}/${event.id}/replay`, {}).pipe(
      map((updated) => ({ ...updated, service: event.service })),
    );
  }
}
