import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { SessionService } from '../../core/auth/session.service';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLayoutComponent {
  protected readonly cart = inject(CartService);
  protected readonly session = inject(SessionService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to checkout or view orders.',
      confirmText: 'Sign out',
    });
    if (!confirmed) return;
    this.session.logout();
    this.toast.info('Signed out.');
    this.router.navigateByUrl('/');
  }
}
