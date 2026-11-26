import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, concatMap, finalize, map, of, shareReplay, switchMap, tap, throwError } from 'rxjs';

import { API_PATHS } from '../api/api-paths';

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

export interface BrowserSession {
  authenticated: boolean;
  username: string | null;
  roles: string[];
  expiresAt: string | null;
}

@Injectable({ providedIn: 'root' })
export class SessionService {
  private static readonly LEGACY_TOKEN_KEY = 'shopverse.session.token';
  private readonly http = inject(HttpClient);
  private profileRequest: Observable<UserProfile> | null = null;
  private profileRevision = 0;
  private sessionRequest: Observable<BrowserSession | null> | null = null;
  readonly sessionVersion = signal(0);
  readonly identity = signal<BrowserSession | null>(null);
  readonly sessionReady = signal(false);
  readonly profile = signal<UserProfile | null>(null);
  readonly username = computed(() => this.identity()?.username ?? null);
  readonly roles = computed(() => this.identity()?.roles ?? []);
  readonly isAuthenticated = computed(() => this.identity()?.authenticated ?? false);
  readonly isAdmin = computed(() => this.roles().includes('ROLE_ADMIN'));
  readonly canAccessBackOffice = computed(() => this.isAuthenticated() && this.isAdmin());

  constructor() {
    try { sessionStorage.removeItem(SessionService.LEGACY_TOKEN_KEY); } catch { /* Storage can be disabled by the browser. */ }
  }

  login(username: string, password: string) {
    return this.http.get<void>(API_PATHS.auth.csrf).pipe(
      concatMap(() => this.http.post<{ authenticated: boolean }>(API_PATHS.auth.login, { username, password })),
      switchMap(() => this.fetchSession().pipe(
        switchMap((session) => session ? of(session) : throwError(() => new Error('The authenticated session could not be restored.'))),
      )),
      tap((session) => this.setSession(session)),
    );
  }

  restoreSession(): Observable<BrowserSession | null> {
    if (this.sessionReady()) return of(this.identity());
    if (this.sessionRequest) return this.sessionRequest;
    const request = this.fetchSession().pipe(
      catchError(() => of(null)),
      tap((session) => this.setSession(session)),
      finalize(() => { this.sessionRequest = null; }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );
    this.sessionRequest = request;
    return request;
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

  logout(): void {
    this.clearSession();
  }

  logoutFromServer(): Observable<void> {
    if (!this.isAuthenticated()) {
      this.clearSession();
      return of(undefined);
    }
    return this.http.post<void>(API_PATHS.auth.logout, {}).pipe(
      tap(() => this.clearSession()),
    );
  }

  private fetchSession(): Observable<BrowserSession | null> {
    return this.http.get<BrowserSession>(API_PATHS.auth.session).pipe(
      map((session) => session.authenticated ? session : null),
    );
  }

  private setSession(session: BrowserSession | null): void {
    this.identity.set(session);
    this.sessionReady.set(true);
    this.profile.set(null);
    this.profileRequest = null;
    this.profileRevision++;
    this.sessionVersion.update((version) => version + 1);
  }

  private clearSession(): void {
    this.setSession(null);
  }
}
