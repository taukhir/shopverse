import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, finalize, of, shareReplay, tap } from 'rxjs';

import { API_PATHS } from '../api/api-paths';
import { STORAGE_KEYS } from '../constants/storage-keys';

export interface UserProfile {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  status: string;
  roles: Array<{ roleName: string }>;
}

export interface ProfileUpdate {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

interface TokenClaims { sub?: string; exp?: number; roles?: string; }

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  private profileRequest: Observable<UserProfile> | null = null;
  private profileRevision = 0;
  readonly sessionVersion = signal(0);
  readonly token = signal<string | null>(this.readToken());
  readonly profile = signal<UserProfile | null>(null);
  readonly username = computed(() => this.claims()?.sub ?? null);
  readonly roles = computed(() => (this.claims()?.roles ?? '').split(' ').filter(Boolean));
  readonly isAuthenticated = computed(() => !!this.username() && !this.isExpired());
  readonly isAdmin = computed(() => this.roles().includes('ROLE_ADMIN'));
  readonly canAccessBackOffice = computed(() => this.isAuthenticated() && this.isAdmin());

  login(username: string, password: string) {
    return this.http.post<{ token: string }>(API_PATHS.auth.login, { username, password }).pipe(
      tap(({ token }) => this.setToken(token)),
    );
  }

  loadProfile(force = false): Observable<UserProfile> {
    const cachedProfile = this.profile();
    if (!force && cachedProfile) return of(cachedProfile);
    if (this.profileRequest) return this.profileRequest;

    const requestVersion = this.sessionVersion();
    const requestRevision = this.profileRevision;
    const request = this.http.get<UserProfile>(API_PATHS.accounts.current).pipe(
      tap((profile) => {
        if (requestVersion === this.sessionVersion() && requestRevision === this.profileRevision) this.profile.set(profile);
      }),
      finalize(() => {
        if (requestVersion === this.sessionVersion() && requestRevision === this.profileRevision) this.profileRequest = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.profileRequest = request;
    return request;
  }

  updateProfile(profile: ProfileUpdate) {
    const requestVersion = this.sessionVersion();
    const requestRevision = ++this.profileRevision;
    this.profileRequest = null;
    return this.http.patch<UserProfile>(API_PATHS.accounts.current, profile).pipe(tap((updated) => {
      if (requestVersion !== this.sessionVersion() || requestRevision !== this.profileRevision) return;
      this.profile.set(updated);
      this.profileRequest = null;
    }));
  }

  logout(revokeToken = false): void {
    if (revokeToken && this.token()) {
      this.http.post<void>(API_PATHS.auth.logout, {}).pipe(
        catchError(() => of(undefined)),
        finalize(() => this.clearLocalSession()),
      ).subscribe();
      return;
    }
    this.clearLocalSession();
  }

  private clearLocalSession(): void {
    sessionStorage.removeItem(STORAGE_KEYS.sessionToken);
    this.token.set(null);
    this.profile.set(null);
    this.profileRequest = null;
    this.profileRevision++;
    this.sessionVersion.update((version) => version + 1);
  }

  private setToken(token: string): void {
    sessionStorage.setItem(STORAGE_KEYS.sessionToken, token);
    this.token.set(token);
    this.profile.set(null);
    this.profileRequest = null;
    this.profileRevision++;
    this.sessionVersion.update((version) => version + 1);
  }

  private readToken(): string | null {
    try { return sessionStorage.getItem(STORAGE_KEYS.sessionToken); } catch { return null; }
  }

  private claims(): TokenClaims | null {
    const token = this.token();
    if (!token) return null;
    try {
      const payload = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
      return JSON.parse(atob(payload)) as TokenClaims;
    } catch { return null; }
  }

  private isExpired(): boolean {
    const exp = this.claims()?.exp;
    return !!exp && exp * 1000 <= Date.now();
  }
}
