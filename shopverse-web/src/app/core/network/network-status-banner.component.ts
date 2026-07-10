import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { NetworkStatusService } from './network-status.service';

@Component({
  selector: 'app-network-status-banner',
  templateUrl: './network-status-banner.component.html',
  styleUrl: './network-status-banner.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NetworkStatusBannerComponent {
  protected readonly network = inject(NetworkStatusService);
}
