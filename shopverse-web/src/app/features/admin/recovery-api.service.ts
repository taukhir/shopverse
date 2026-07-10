import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, forkJoin, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { API_PATHS } from '../../core/api/api-paths';

export type RecoveryService = 'Orders' | 'Inventory' | 'Payments';

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

@Injectable({ providedIn: 'root' })
export class RecoveryApiService {
  private readonly http = inject(HttpClient);

  listEvents() {
    return forkJoin({
      Orders: this.loadServiceEvents('Orders'),
      Inventory: this.loadServiceEvents('Inventory'),
      Payments: this.loadServiceEvents('Payments'),
    }).pipe(map((result) => [...result.Orders, ...result.Inventory, ...result.Payments]));
  }

  replay(event: FailedEvent) {
    return this.http.post<Omit<FailedEvent, 'service'>>(`${endpoints[event.service]}/${event.id}/replay`, {}).pipe(
      map((updated) => ({ ...updated, service: event.service })),
    );
  }

  private loadServiceEvents(service: RecoveryService) {
    return this.http.get<Omit<FailedEvent, 'service'>[]>(endpoints[service]).pipe(
      catchError(() => of([])),
      map((events) => events.map((event) => ({ ...event, service }))),
    );
  }
}
