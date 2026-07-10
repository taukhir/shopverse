import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';

import { API_PATHS } from '../../core/api/api-paths';

export type SimulationMode = 'SUCCESS' | 'DECLINE' | 'TIMEOUT';
export type PaymentAction = 'reconcile' | 'refund';

export interface Payment {
  id: number;
  orderNumber: string;
  correlationId: string;
  amount: number;
  status: string;
  paymentReference: string | null;
  failureReason: string | null;
  createdAt: string;
  updatedAt: string;
}

@Injectable({ providedIn: 'root' })
export class PaymentApiService {
  private readonly http = inject(HttpClient);

  listPayments() {
    return this.http.get<Payment[]>(API_PATHS.payments.admin);
  }

  setSimulationMode(mode: SimulationMode) {
    return this.http.post<SimulationMode>(API_PATHS.payments.simulation(mode), {});
  }

  runOrderAction(orderNumber: string, action: PaymentAction) {
    return this.http.post<Payment>(API_PATHS.payments.orderAction(orderNumber, action), {});
  }
}
