import { Component, inject } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';

@Component({
  selector: 'app-placeholder-page',
  imports: [RouterLink],
  template: `
    <section class="page">
      <p>{{ eyebrow }}</p><h1>{{ title }}</h1><div></div><span>{{ description }}</span>
      <a routerLink="/">Return to storefront →</a>
    </section>
  `,
  styles: `
    .page { min-height: calc(100dvh - 188px); max-width: var(--max-width); margin: 0 auto; padding: 120px 24px; }
    p { margin: 0 0 18px; color: var(--muted); font-size: 11px; font-weight: 800; letter-spacing: .12em; text-transform: uppercase; }
    h1 { max-width: 760px; margin: 0; font-size: clamp(48px, 7vw, 92px); letter-spacing: -.07em; line-height: .94; }
    div { width: 100%; max-width: 720px; margin: 45px 0 22px; border-top: 1px solid var(--line-strong); }
    span { display: block; max-width: 540px; color: var(--muted); font-size: 17px; }
    a { display: inline-block; margin-top: 42px; border-bottom: 1px solid var(--ink); font-size: 13px; font-weight: 800; }
  `,
})
export class PlaceholderPageComponent {
  private readonly route = inject(ActivatedRoute);
  protected readonly eyebrow = this.route.snapshot.data['eyebrow'] as string;
  protected readonly title = this.route.snapshot.data['title'] as string;
  protected readonly description = this.route.snapshot.data['description'] as string;
}
