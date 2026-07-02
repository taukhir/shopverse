import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ProfileUpdate, SessionService, UserProfile } from '../../core/auth/session.service';

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, RouterLink],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
})
export class AccountPageComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly saveSuccess = signal(false);
  protected readonly profile = this.session.profile;
  protected readonly form: ProfileUpdate = { email: '', firstName: '', lastName: '', phoneNumber: '' };

  constructor() {
    if (this.session.profile()) {
      this.populate(this.session.profile());
    } else {
      this.loadProfile();
    }
  }

  protected loadProfile(): void {
    this.loading.set(true);
    this.loadError.set('');
    this.session.loadProfile().subscribe({
      next: (profile) => {
        this.populate(profile);
        this.loading.set(false);
      },
      error: () => {
        this.loadError.set('Unable to load profile');
        this.loading.set(false);
      },
    });
  }

  protected saveProfile(): void {
    this.saving.set(true);
    this.saveError.set('');
    this.saveSuccess.set(false);
    this.session.updateProfile({
      email: this.form.email.trim(),
      firstName: this.form.firstName.trim(),
      lastName: this.form.lastName.trim(),
      phoneNumber: this.form.phoneNumber.trim(),
    }).subscribe({
      next: (profile) => {
        this.populate(profile);
        this.saveSuccess.set(true);
        this.saving.set(false);
      },
      error: () => {
        this.saveError.set('We could not update your account details. Check the email/phone format and try again.');
        this.saving.set(false);
      },
    });
  }

  protected logout(): void {
    this.session.logout();
    this.router.navigateByUrl('/');
  }

  private populate(profile: UserProfile | null): void {
    if (!profile) return;
    this.form.email = profile.email ?? '';
    this.form.firstName = profile.firstName ?? '';
    this.form.lastName = profile.lastName ?? '';
    this.form.phoneNumber = profile.phoneNumber ?? '';
  }
}
