import { Injectable, signal } from '@angular/core';

interface ConfirmState {
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  tone: 'normal' | 'danger';
  resolve: (confirmed: boolean) => void;
}

@Injectable({ providedIn: 'root' })
export class ConfirmService {
  readonly state = signal<ConfirmState | null>(null);

  confirm(options: { title: string; message: string; confirmText?: string; cancelText?: string; tone?: 'normal' | 'danger' }): Promise<boolean> {
    return new Promise((resolve) => {
      this.state.set({
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? 'Confirm',
        cancelText: options.cancelText ?? 'Cancel',
        tone: options.tone ?? 'normal',
        resolve,
      });
    });
  }

  answer(confirmed: boolean): void {
    const state = this.state();
    if (!state) return;
    state.resolve(confirmed);
    this.state.set(null);
  }
}
