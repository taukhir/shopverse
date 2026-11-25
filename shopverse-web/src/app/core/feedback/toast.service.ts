import { Injectable, signal } from '@angular/core';

export type ToastTone = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: number;
  tone: ToastTone;
  message: string;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private nextId = 1;
  private readonly timers = new Map<number, ReturnType<typeof setTimeout>>();
  readonly messages = signal<ToastMessage[]>([]);

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    const timer = this.timers.get(id);
    if (timer) clearTimeout(timer);
    this.timers.delete(id);
    this.messages.update((messages) => messages.filter((message) => message.id !== id));
  }

  private show(tone: ToastTone, message: string): void {
    const id = this.nextId++;
    this.messages.update((messages) => [...messages, { id, tone, message }].slice(-4));
    this.timers.set(id, setTimeout(() => this.dismiss(id), 4200));
  }
}
