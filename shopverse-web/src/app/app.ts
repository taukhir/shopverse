import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ConfirmDialogComponent } from './core/feedback/confirm-dialog.component';
import { ToastOutletComponent } from './core/feedback/toast-outlet.component';
import { NetworkStatusBannerComponent } from './core/network/network-status-banner.component';

@Component({
  selector: 'app-root',
  imports: [ConfirmDialogComponent, NetworkStatusBannerComponent, RouterOutlet, ToastOutletComponent],
  template: '<router-outlet /><app-network-status-banner /><app-toast-outlet /><app-confirm-dialog />',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {}
