import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { ProfileUpdate, SessionService, UserProfile } from '../../core/auth/session.service';
import { ConfirmService } from '../../core/feedback/confirm.service';
import { ToastService } from '../../core/feedback/toast.service';
import { LoadingSkeletonComponent } from '../../shared/ui-state/loading-skeleton.component';
import { ServiceNoticeComponent } from '../../shared/ui-state/service-notice.component';
import { AccountApiService, UserAddress, UserAddressRequest } from './account-api.service';

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, LoadingSkeletonComponent, RouterLink, ServiceNoticeComponent],
  templateUrl: './account-page.component.html',
  styleUrl: './account-page.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AccountPageComponent {
  protected readonly session = inject(SessionService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly accountApi = inject(AccountApiService);
  protected readonly loading = signal(false);
  protected readonly saving = signal(false);
  protected readonly addressSaving = signal(false);
  protected readonly addressesLoading = signal(true);
  protected readonly addressDeleting = signal(false);
  protected readonly loadError = signal('');
  protected readonly saveError = signal('');
  protected readonly addressError = signal('');
  protected readonly saveSuccess = signal(false);
  protected readonly returnToCheckout = this.route.snapshot.queryParamMap.get('returnUrl') === '/checkout';
  protected readonly profile = this.session.profile;
  protected readonly addresses = signal<UserAddress[]>([]);
  protected readonly editingAddressId = signal<number | null>(null);
  protected readonly form: ProfileUpdate = { email: '', firstName: '', lastName: '', phoneNumber: '' };
  protected readonly addressForm: UserAddressRequest = {
    label: 'Home',
    recipientName: '',
    phoneNumber: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    postalCode: '',
    country: 'India',
    defaultAddress: true,
  };
  protected readonly completion = computed(() => {
    const profile = this.profile();
    const fields = [profile?.email, profile?.firstName, profile?.lastName, profile?.phoneNumber];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  });
  protected readonly defaultAddress = computed(() => this.addresses().find((address) => address.defaultAddress) ?? this.addresses()[0] ?? null);

  constructor() {
    if (this.session.profile()) {
      this.populate(this.session.profile());
    } else {
      this.loadProfile();
    }
    this.loadAddresses();
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

  protected loadAddresses(force = false): void {
    this.addressesLoading.set(true);
    this.addressError.set('');
    this.accountApi.listAddresses(force).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
        this.addressesLoading.set(false);
        if (!this.editingAddressId()) {
          this.prepareNewAddress();
        }
      },
      error: () => {
        this.addressesLoading.set(false);
        this.addressError.set('Saved addresses could not be loaded. Check your session and try again.');
      },
    });
  }

  protected saveAddress(): void {
    this.addressSaving.set(true);
    this.addressError.set('');
    const payload = this.normalizedAddress();
    const editingId = this.editingAddressId();
    const request = editingId
      ? this.accountApi.updateAddress(editingId, payload)
      : this.accountApi.createAddress(payload);

    request.subscribe({
      next: (savedAddress) => {
        this.addressSaving.set(false);
        const cachedAddresses = this.accountApi.cachedAddresses();
        if (cachedAddresses) this.addresses.set(cachedAddresses);
        else this.addresses.update((addresses) => editingId
          ? addresses.map((address) => address.id === savedAddress.id ? savedAddress : address)
          : [savedAddress, ...addresses]);
        this.toast.success(editingId ? 'Address updated.' : 'Address added.');
        this.editingAddressId.set(null);
        this.prepareNewAddress();
        if (this.returnToCheckout) this.router.navigateByUrl('/checkout');
      },
      error: () => {
        this.addressSaving.set(false);
        this.addressError.set('We could not save this address. Check required fields and phone format.');
        this.toast.error('Address save failed.');
      },
    });
  }

  protected editAddress(address: UserAddress): void {
    this.editingAddressId.set(address.id);
    this.addressForm.label = address.label;
    this.addressForm.recipientName = address.recipientName;
    this.addressForm.phoneNumber = address.phoneNumber ?? '';
    this.addressForm.line1 = address.line1;
    this.addressForm.line2 = address.line2 ?? '';
    this.addressForm.city = address.city;
    this.addressForm.state = address.state;
    this.addressForm.postalCode = address.postalCode;
    this.addressForm.country = address.country;
    this.addressForm.defaultAddress = address.defaultAddress;
  }

  protected cancelAddressEdit(): void {
    this.editingAddressId.set(null);
    this.prepareNewAddress();
  }

  protected makeDefault(address: UserAddress): void {
    this.editAddress(address);
    this.addressForm.defaultAddress = true;
    this.saveAddress();
  }

  protected async deleteAddress(address: UserAddress): Promise<void> {
    const confirmed = await this.confirm.confirm({
      title: 'Delete address?',
      message: `Remove ${address.label} from your address book?`,
      confirmText: 'Delete',
    });
    if (!confirmed) return;

    this.addressDeleting.set(true);
    this.addressError.set('');
    this.accountApi.deleteAddress(address.id).subscribe({
      next: () => {
        this.addressDeleting.set(false);
        this.toast.info('Address deleted.');
        if (this.editingAddressId() === address.id) {
          this.cancelAddressEdit();
        }
        this.loadAddresses();
      },
      error: () => {
        this.addressDeleting.set(false);
        this.addressError.set('We could not delete this address.');
        this.toast.error('Address delete failed.');
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
    this.session.logout(true);
    this.toast.info('Signed out.');
    this.router.navigateByUrl('/');
  }

  private populate(profile: UserProfile | null): void {
    if (!profile) return;
    this.form.email = profile.email ?? '';
    this.form.firstName = profile.firstName ?? '';
    this.form.lastName = profile.lastName ?? '';
    this.form.phoneNumber = profile.phoneNumber ?? '';
    if (!this.addressForm.recipientName) {
      this.addressForm.recipientName = `${profile.firstName ?? ''} ${profile.lastName ?? ''}`.trim();
    }
    if (!this.addressForm.phoneNumber) {
      this.addressForm.phoneNumber = profile.phoneNumber ?? '';
    }
  }

  private prepareNewAddress(): void {
    const profile = this.profile();
    this.addressForm.label = 'Home';
    this.addressForm.recipientName = `${profile?.firstName ?? ''} ${profile?.lastName ?? ''}`.trim();
    this.addressForm.phoneNumber = profile?.phoneNumber ?? '';
    this.addressForm.line1 = '';
    this.addressForm.line2 = '';
    this.addressForm.city = '';
    this.addressForm.state = '';
    this.addressForm.postalCode = '';
    this.addressForm.country = 'India';
    this.addressForm.defaultAddress = this.addresses().length === 0;
  }

  private normalizedAddress(): UserAddressRequest {
    return {
      label: this.addressForm.label.trim(),
      recipientName: this.addressForm.recipientName.trim(),
      phoneNumber: this.addressForm.phoneNumber?.trim() ?? '',
      line1: this.addressForm.line1.trim(),
      line2: this.addressForm.line2?.trim() ?? '',
      city: this.addressForm.city.trim(),
      state: this.addressForm.state.trim(),
      postalCode: this.addressForm.postalCode.trim(),
      country: this.addressForm.country.trim(),
      defaultAddress: this.addressForm.defaultAddress,
    };
  }
}
