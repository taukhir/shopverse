import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './login-page.component.html',
  styleUrl: './login-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoginPageComponent {
  private readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  protected username = '';
  protected password = '';
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly notice = signal(this.route.snapshot.queryParamMap.get('expired') === 'true'
    ? 'Your session expired. Please sign in again.'
    : '');

  protected submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.notice.set('');
    this.session.login(this.username, this.password).subscribe({
      next: () => {
        this.session.loadProfile().subscribe();
        const returnUrl = this.route.snapshot.queryParamMap.get('returnUrl');
        this.router.navigateByUrl(returnUrl || (this.session.isAdmin() ? '/admin' : '/account'));
      },
      error: () => {
        this.error.set('Invalid username or password.');
        this.loading.set(false);
      },
    });
  }
}
