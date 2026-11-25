import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AdminHeaderComponent } from '../../layouts/admin-header/admin-header.component';
import { Router } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';
import { ToastService } from '../../core/feedback/toast.service';
import { PaymentApiService, SimulationMode } from './payment-api.service';

@Component({
  selector: 'app-admin-settings',
  imports: [AdminHeaderComponent, FormsModule],
  templateUrl: './admin-settings.component.html',
  styleUrl: './admin-settings.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AdminSettingsComponent {
  private readonly paymentApi = inject(PaymentApiService);
  private readonly toast = inject(ToastService);
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);

  protected readonly simulationMode = signal<SimulationMode>('SUCCESS');
  protected readonly simulationSaving = signal(false);
  protected readonly modes: SimulationMode[] = ['SUCCESS', 'DECLINE', 'TIMEOUT'];

  protected setSimulationMode(): void {
    this.simulationSaving.set(true);
    this.paymentApi.setSimulationMode(this.simulationMode()).subscribe({
      next: (mode) => {
        this.simulationMode.set(mode);
        this.simulationSaving.set(false);
        this.toast.success(`Payment simulation set to ${mode}.`);
      },
      error: () => {
        this.simulationSaving.set(false);
        this.toast.error('Could not update payment simulation mode.');
      },
    });
  }

  protected logout(): void {
    this.session.logout(true);
    this.router.navigateByUrl('/');
  }
}
