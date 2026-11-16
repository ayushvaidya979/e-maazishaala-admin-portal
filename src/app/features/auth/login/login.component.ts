import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4 selection:bg-emerald-100">
      <div class="w-full max-w-md">
        <!-- Logo / Brand Header -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-700 text-white shadow-md shadow-emerald-700/20 mb-4 ring-4 ring-emerald-50">
            <app-icon name="shield" [size]="28" color="#ffffff"></app-icon>
          </div>
          <h1 class="text-2xl font-bold tracking-tight text-slate-900">e-MaziShaala</h1>
          <p class="text-xs uppercase tracking-widest font-semibold text-emerald-700 mt-1">Admin Operations Portal</p>
          <p class="text-xs text-slate-500 mt-2">Authorized educational administration and operations management.</p>
        </div>

        <!-- Auth Card -->
        <div class="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 sm:p-8 space-y-6">
          <!-- Error alert -->
          @if (errorMessage()) {
            <div class="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
              <div class="mt-0.5 shrink-0">
                <app-icon name="x" [size]="14" color="#dc2626"></app-icon>
              </div>
              <div class="leading-relaxed font-medium">{{ errorMessage() }}</div>
            </div>
          }

          <!-- Admin Credentials Form -->
          <form (ngSubmit)="login()" class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1.5">Admin Username</label>
              <input
                type="text"
                [(ngModel)]="username"
                name="username"
                required
                autocomplete="username"
                placeholder="adminemaazi shaala"
                class="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition" />
            </div>

            <div>
              <div class="flex items-center justify-between mb-1.5">
                <label class="block text-xs font-semibold text-slate-700">Password</label>
              </div>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                autocomplete="current-password"
                placeholder="••••••••••••"
                class="w-full h-10 px-3.5 rounded-xl border border-slate-200 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition" />
            </div>

            <button
              type="submit"
              [disabled]="isSubmitting() || !username || !password"
              class="w-full h-10 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed">
              @if (isSubmitting()) {
                <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                <span>Signing in...</span>
              } @else {
                <span>Sign In as Admin</span>
                <app-icon name="arrow-right" [size]="14"></app-icon>
              }
            </button>
          </form>

          <!-- Security notice -->
          <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 text-[11px] text-slate-500 space-y-1">
            <div class="flex items-center gap-1.5 font-semibold text-slate-700">
              <app-icon name="shield" [size]="13" color="#047857"></app-icon>
              <span>Protected Administrator Access</span>
            </div>
            <p class="leading-relaxed">
              This portal manages student enrollments, course schedules, textbook publications, and dynamic mobile application content.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class LoginComponent {
  auth = inject(AuthService);
  toast = inject(ToastService);
  router = inject(Router);
  route = inject(ActivatedRoute);

  username = '';
  password = '';
  isSubmitting = signal(false);
  errorMessage = signal<string | null>(null);

  constructor() {
    this.route.queryParams.subscribe(params => {
      if (params['unauthorized']) {
        this.errorMessage.set('Your account does not have administrator privileges.');
      }
    });

    if (this.auth.isAdmin() || this.auth.hasActiveAdminSession()) {
      this.router.navigate(['/dashboard']);
    }
  }

  async login() {
    if (!this.username || !this.password) return;

    this.isSubmitting.set(true);
    this.errorMessage.set(null);

    const { error } = await this.auth.signInWithCredentials(this.username, this.password);

    if (error) {
      this.errorMessage.set(error);
      this.isSubmitting.set(false);
    } else {
      this.toast.success('Welcome back, Administrator!');
      this.router.navigate(['/dashboard']);
    }
  }
}
