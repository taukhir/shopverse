import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { tap } from 'rxjs';

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

interface TokenClaims { sub?: string; exp?: number; roles?: string; }
const tokenKey = 'shopverse.session.token';

@Injectable({ providedIn: 'root' })
export class SessionService {
  private readonly http = inject(HttpClient);
  readonly token = signal<string | null>(this.readToken());
  readonly profile = signal<UserProfile | null>(null);
  readonly username = computed(() => this.claims()?.sub ?? null);
  readonly roles = computed(() => (this.claims()?.roles ?? '').split(' ').filter(Boolean));
  readonly isAuthenticated = computed(() => !!this.username() && !this.isExpired());
  readonly isAdmin = computed(() => this.roles().includes('ROLE_ADMIN'));

  login(username: string, password: string) {
    return this.http.post<{ token: string }>('/auth/login', { username, password }).pipe(
      tap(({ token }) => this.setToken(token)),
    );
  }

  loadProfile() {
    return this.http.get<UserProfile>('/api/v1/users/me').pipe(tap((profile) => this.profile.set(profile)));
  }

  logout(): void {
    sessionStorage.removeItem(tokenKey);
    this.token.set(null);
    this.profile.set(null);
  }

  private setToken(token: string): void {
    sessionStorage.setItem(tokenKey, token);
    this.token.set(token);
  }

  private readToken(): string | null {
    try { return sessionStorage.getItem(tokenKey); } catch { return null; }
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
