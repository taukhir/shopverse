import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

type NotificationTone = 'info' | 'success' | 'warning';

interface NotificationPreview {
  readonly title: string;
  readonly description: string;
  readonly meta: string;
  readonly tone: NotificationTone;
}

interface PreferencePreview {
  readonly label: string;
  readonly description: string;
  readonly enabled: boolean;
}

@Component({
  selector: 'app-notifications-page',
  imports: [RouterLink],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotificationsPageComponent {
  protected readonly notifications = signal<NotificationPreview[]>([
    {
      title: 'Order status updates',
      description: 'Placed, confirmed, reserved, packed, shipped, delivered, cancelled, and refund events will appear here.',
      meta: 'Order lifecycle',
      tone: 'info',
    },
    {
      title: 'Payment activity',
      description: 'Payment retries, authorization state, settlement status, and failed payment recovery notices will be grouped here.',
      meta: 'Payment visibility',
      tone: 'warning',
    },
    {
      title: 'Account and session safety',
      description: 'New sign-ins, password-sensitive events, and account detail updates will be highlighted for customer trust.',
      meta: 'Security',
      tone: 'success',
    },
  ]);

  protected readonly preferences = signal<PreferencePreview[]>([
    {
      label: 'Email updates',
      description: 'Useful for receipts, payment failures, and delivery milestones.',
      enabled: true,
    },
    {
      label: 'In-app alerts',
      description: 'Fast status updates while customers are browsing ShopVerse.',
      enabled: true,
    },
    {
      label: 'Promotional messages',
      description: 'Optional product drops and restock messages. Disabled by default for a cleaner experience.',
      enabled: false,
    },
  ]);
}
