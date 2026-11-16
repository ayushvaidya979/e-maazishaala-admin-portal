import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="fixed top-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border shadow-lg transition-all duration-300 animate-slide-in"
          [ngClass]="{
            'bg-emerald-50 border-emerald-200 text-emerald-900': toast.type === 'success',
            'bg-red-50 border-red-200 text-red-900': toast.type === 'error',
            'bg-amber-50 border-amber-200 text-amber-900': toast.type === 'warning',
            'bg-slate-900 border-slate-800 text-white': toast.type === 'info'
          }">
          <div class="mt-0.5 shrink-0">
            @if (toast.type === 'success') {
              <app-icon name="check" [size]="16" color="#059669"></app-icon>
            } @else if (toast.type === 'error') {
              <app-icon name="x" [size]="16" color="#dc2626"></app-icon>
            } @else {
              <app-icon name="bell" [size]="16" [color]="toast.type === 'info' ? '#94a3b8' : '#d97706'"></app-icon>
            }
          </div>
          <p class="text-xs font-medium leading-relaxed flex-1">{{ toast.message }}</p>
          <button
            (click)="toastService.remove(toast.id)"
            class="shrink-0 p-0.5 rounded-md hover:bg-black/5 transition-colors">
            <app-icon name="x" [size]="12"></app-icon>
          </button>
        </div>
      }
    </div>
  `
})
export class ToastContainerComponent {
  toastService = inject(ToastService);
}

