import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastsSignal = signal<Toast[]>([]);
  readonly toasts = this.toastsSignal.asReadonly();

  show(message: string, type: 'success' | 'error' | 'warning' | 'info' = 'info', durationMs: number = 4000) {
    const id = Math.random().toString(36).substring(2, 9);
    const toast: Toast = { id, type, message };

    this.toastsSignal.update(toasts => [...toasts, toast]);

    setTimeout(() => {
      this.remove(id);
    }, durationMs);
  }

  success(message: string, durationMs?: number) {
    this.show(message, 'success', durationMs);
  }

  error(message: string, durationMs?: number) {
    this.show(message, 'error', durationMs || 5000);
  }

  warning(message: string, durationMs?: number) {
    this.show(message, 'warning', durationMs);
  }

  info(message: string, durationMs?: number) {
    this.show(message, 'info', durationMs);
  }

  remove(id: string) {
    this.toastsSignal.update(toasts => toasts.filter(t => t.id !== id));
  }
}

