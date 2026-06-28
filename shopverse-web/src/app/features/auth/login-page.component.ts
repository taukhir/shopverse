import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { SessionService } from '../../core/auth/session.service';

@Component({
  selector: 'app-login-page',
  imports: [FormsModule, RouterLink],
  template: `<main class="auth-page"><a class="brand" routerLink="/"><img src="/shopverse-mark.svg" alt="" />shop<span>verse</span></a><section><p>MEMBER ACCESS</p><h1>Welcome back.</h1><span>Sign in to view your orders, continue checkout, and manage your account.</span><form (ngSubmit)="submit()"><label>Username<input name="username" [(ngModel)]="username" autocomplete="username" required /></label><label>Password<input name="password" [(ngModel)]="password" type="password" autocomplete="current-password" required /></label>@if (error()) { <div class="error">{{ error() }}</div> }<button [disabled]="loading()">{{ loading() ? 'Signing in...' : 'Sign in' }} <b>→</b></button></form><small>Administrator accounts use the same sign-in form and open the operations workspace automatically.</small></section></main>`,
  styles: `.auth-page{display:grid;min-height:100dvh;place-items:center;padding:26px;background:linear-gradient(135deg,#e8e8f8,var(--paper))}.brand{position:fixed;top:25px;left:28px;display:flex;align-items:center;gap:8px;font-weight:800;letter-spacing:-.06em}.brand img{width:28px}.brand span{color:var(--accent)}section{width:min(100%,440px);padding:42px;background:var(--white);border:1px solid var(--line);box-shadow:10px 11px 0 rgba(120,135,255,.18)}p{margin:0;color:var(--accent);font-size:10px;font-weight:800;letter-spacing:.13em}h1{margin:16px 0 12px;font-size:54px;letter-spacing:-.08em;line-height:.9}section>span,small{display:block;color:var(--muted);font-size:13px;line-height:1.6}form{display:grid;gap:18px;margin-top:32px}label{display:grid;gap:7px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase}input{width:100%;padding:13px;border:1px solid var(--line);background:#fff;font-size:15px;text-transform:none}button{display:flex;justify-content:space-between;margin-top:6px;padding:14px 16px;color:var(--white);border:0;background:var(--ink);font-weight:800}button:disabled{opacity:.6}.error{padding:10px;color:#a2332b;background:#ffe9e7;font-size:12px}small{margin-top:22px}`,
})
export class LoginPageComponent {
  private readonly session = inject(SessionService); private readonly router = inject(Router); private readonly route = inject(ActivatedRoute);
  protected username = ''; protected password = ''; protected readonly loading = signal(false); protected readonly error = signal('');
  protected submit(): void { this.loading.set(true); this.error.set(''); this.session.login(this.username, this.password).subscribe({ next: () => this.session.loadProfile().subscribe({ next: () => this.navigate(), error: () => this.navigate() }), error: () => { this.loading.set(false); this.error.set('Sign-in failed. Check your credentials and try again.'); } }); }
  private navigate(): void { const target = this.route.snapshot.queryParamMap.get('returnUrl'); this.router.navigateByUrl(target?.startsWith('/') && !target.startsWith('//') ? target : this.session.isAdmin() ? '/admin' : '/account'); }
}
