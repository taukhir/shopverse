import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';

import { ProfileUpdate, SessionService, UserProfile } from '../../core/auth/session.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPageComponent {
  protected readonly session = inject(SessionService);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly saveSuccess = signal(false);
  protected readonly profile = this.session.profile;
  protected readonly form: ProfileUpdate = { email: '', firstName: '', lastName: '', phoneNumber: '' };
  protected readonly completion = computed(() => {
    const profile = this.profile();
    const fields = [profile?.email, profile?.firstName, profile?.lastName, profile?.phoneNumber];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  });

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
        this.toast.success('Account details updated.');
      },
      error: () => {
        this.saveError.set('We could not update your account details. Check the email/phone format and try again.');
        this.saving.set(false);
        this.toast.error('Account update failed.');
      },
    });
  }

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

  private populate(profile: UserProfile | null): void {
    if (!profile) return;
    this.form.email = profile.email ?? '';
    this.form.firstName = profile.firstName ?? '';
    this.form.lastName = profile.lastName ?? '';
    this.form.phoneNumber = profile.phoneNumber ?? '';
  }
}
