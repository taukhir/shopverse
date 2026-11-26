import { HttpClient } from '@angular/common/http';
import { Injectable, effect, inject } from '@angular/core';
import { Observable, finalize, of, shareReplay, tap } from 'rxjs';

import { API_PATHS } from '../../core/api/api-paths';
import { SessionService } from '../../core/auth/session.service';

export interface UserAddress {
  id: number;
  label: string;
  recipientName: string;
  phoneNumber?: string | null;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  defaultAddress: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type UserAddressRequest = Omit<UserAddress, 'id' | 'createdAt' | 'updatedAt'>;

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly http = inject(HttpClient);
  private readonly session = inject(SessionService);
  private addressesCache: UserAddress[] | null = null;
  private addressesRequest: Observable<UserAddress[]> | null = null;
  private addressRevision = 0;
  private observedSessionVersion = this.session.sessionVersion();

  constructor() {
    effect(() => {
      const version = this.session.sessionVersion();
      if (version !== this.observedSessionVersion) {
        this.clearAddressCache();
        this.observedSessionVersion = version;
      }
    });
  }

  listAddresses(force = false): Observable<UserAddress[]> {
    this.syncSessionVersion();
    if (!force && this.addressesCache !== null) return of(this.addressesCache);
    if (this.addressesRequest) return this.addressesRequest;

    const sessionVersion = this.session.sessionVersion();
    const addressRevision = this.addressRevision;
    const request = this.http.get<UserAddress[]>(API_PATHS.accounts.addresses).pipe(
      tap((addresses) => {
        if (sessionVersion === this.session.sessionVersion() && addressRevision === this.addressRevision) {
          this.addressesCache = addresses;
        }
      }),
      finalize(() => {
        if (sessionVersion === this.session.sessionVersion() && addressRevision === this.addressRevision) {
          this.addressesRequest = null;
        }
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.addressesRequest = request;
    return request;
  }

  cachedAddresses(): UserAddress[] | null {
    this.syncSessionVersion();
    return this.addressesCache;
  }

  createAddress(address: UserAddressRequest) {
    this.syncSessionVersion();
    const sessionVersion = this.session.sessionVersion();
    return this.http.post<UserAddress>(API_PATHS.accounts.addresses, address).pipe(tap((saved) => {
      if (sessionVersion === this.session.sessionVersion()) this.upsertAddress(saved);
    }));
  }

  updateAddress(id: number, address: UserAddressRequest) {
    this.syncSessionVersion();
    const sessionVersion = this.session.sessionVersion();
    return this.http.put<UserAddress>(API_PATHS.accounts.addressById(id), address).pipe(tap((saved) => {
      if (sessionVersion === this.session.sessionVersion()) this.upsertAddress(saved);
    }));
  }

  /** Drops the session-scoped address snapshot so the next read uses the server response. */
  invalidateAddresses(): void {
    this.addressRevision++;
    this.addressesCache = null;
    this.addressesRequest = null;
  }

  deleteAddress(id: number) {
    this.syncSessionVersion();
    const sessionVersion = this.session.sessionVersion();
    return this.http.delete<void>(API_PATHS.accounts.addressById(id)).pipe(tap(() => {
      if (sessionVersion === this.session.sessionVersion()) this.removeAddress(id);
    }));
  }

  private upsertAddress(saved: UserAddress): void {
    this.syncSessionVersion();
    this.addressRevision++;
    this.addressesRequest = null;
    if (this.addressesCache === null) return;
    const current = this.addressesCache
      .filter((address) => address.id !== saved.id)
      .map((address) => saved.defaultAddress ? { ...address, defaultAddress: false } : address);
    this.addressesCache = [saved, ...current].sort((left, right) =>
      Number(right.defaultAddress) - Number(left.defaultAddress)
      || (right.updatedAt ?? '').localeCompare(left.updatedAt ?? '')
      || right.id - left.id,
    );
  }

  private removeAddress(id: number): void {
    this.syncSessionVersion();
    this.addressRevision++;
    this.addressesRequest = null;
    if (this.addressesCache === null) return;
    const removedDefault = this.addressesCache.find((address) => address.id === id)?.defaultAddress ?? false;
    const remaining = this.addressesCache.filter((address) => address.id !== id);
    if (removedDefault && remaining.length && !remaining.some((address) => address.defaultAddress)) {
      remaining[0] = { ...remaining[0], defaultAddress: true };
    }
    this.addressesCache = remaining;
  }

  private syncSessionVersion(): void {
    const version = this.session.sessionVersion();
    if (version === this.observedSessionVersion) return;
    this.clearAddressCache();
    this.observedSessionVersion = version;
  }

  private clearAddressCache(): void {
    this.addressRevision++;
    this.addressesCache = null;
    this.addressesRequest = null;
  }
}
