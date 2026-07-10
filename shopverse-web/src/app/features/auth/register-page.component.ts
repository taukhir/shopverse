import { HttpClient } from '@angular/common/http';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { API_PATHS } from '../../core/api/api-paths';
import { ToastService } from '../../core/feedback/toast.service';

interface RegistrationRequest {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

@Component({
  selector: 'app-register-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './register-page.component.html',
  styleUrl: './register-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegisterPageComponent {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  protected readonly loading = signal(false);
  protected readonly error = signal('');
  protected readonly success = signal('');
  protected readonly form: RegistrationRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phoneNumber: '',
  };

  protected submit(): void {
    if (this.loading()) return;
    this.loading.set(true);
    this.error.set('');
    this.success.set('');
    this.http.post(API_PATHS.users.register, {
      username: this.form.username.trim(),
      email: this.form.email.trim(),
      password: this.form.password,
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
    }).subscribe({
      next: () => {
        this.success.set('Account created. Redirecting to sign in...');
        this.loading.set(false);
        this.toast.success('Account created. Please sign in.');
        setTimeout(() => this.router.navigate(['/login'], { queryParams: { registered: 'true' } }), 700);
      },
      error: () => {
        this.error.set('We could not create this account. Check that the username/email are unique and the password is strong.');
        this.loading.set(false);
        this.toast.error('Registration failed. Check the form and try again.');
      },
    });
  }
}
