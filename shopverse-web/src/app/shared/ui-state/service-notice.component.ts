import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';

@Component({
  selector: 'app-service-notice',
  templateUrl: './service-notice.component.html',
  styleUrl: './service-notice.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ServiceNoticeComponent {
  readonly eyebrow = input('SERVICE UNAVAILABLE');
  readonly title = input('We could not load this area.');
  readonly message = input('Confirm the related backend service is running, then try again.');
  readonly retryLabel = input('Try again');
  readonly retry = output<void>();
}
