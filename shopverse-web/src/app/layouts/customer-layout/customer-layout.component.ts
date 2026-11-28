import { ChangeDetectionStrategy, Component, HostListener, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Router } from '@angular/router';

import { CartService } from '../../core/cart/cart.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { WishlistService } from '../../core/wishlist/wishlist.service';
import { ComparisonService } from '../../core/comparison/comparison.service';
import { SessionService } from '../../core/auth/session.service';

@Component({
  selector: 'app-customer-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  templateUrl: './customer-layout.component.html',
  styleUrl: './customer-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CustomerLayoutComponent {
  protected readonly menuOpen = signal(false);
  protected readonly cart = inject(CartService);
  protected readonly session = inject(SessionService);
  protected readonly wishlist = inject(WishlistService);
  protected readonly comparison = inject(ComparisonService);
  private readonly confirm = inject(ConfirmService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  constructor() {
    this.session.restoreSession().subscribe((identity) => {
      if (identity) this.cart.loadPersistedCart();
    });
  }

  protected toggleMenu(): void {
    this.menuOpen.update((open) => !open);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  @HostListener('document:keydown.escape')
  protected closeMenuOnEscape(): void {
    this.closeMenu();
  }

  protected async logout(): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Sign out?',
      message: 'You will need to sign in again to checkout or view orders.',
      confirmText: 'Sign out',
    });
    if (!confirmed) return;
    this.session.logoutFromServer().subscribe({
      next: () => {
        this.toast.info('Signed out.');
        this.router.navigateByUrl('/');
      },
      error: () => this.toast.error('Sign out failed. Please check your connection and try again.'),
    });
  }
}
