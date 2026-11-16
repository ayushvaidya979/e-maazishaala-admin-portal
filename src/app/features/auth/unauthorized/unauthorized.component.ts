import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, IconComponent],
  template: `
    <div class="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div class="max-w-md w-full bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-5">
        <div class="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <app-icon name="shield" [size]="28" color="#dc2626"></app-icon>
        </div>

        <div>
          <h1 class="text-xl font-bold text-slate-900">Access Restricted</h1>
          <p class="text-xs text-slate-500 mt-1">This application is restricted to e-MaziShaala administrative personnel.</p>
        </div>

        <div class="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-left text-xs text-slate-600 space-y-1">
          <p class="font-semibold text-slate-800">Why am I seeing this?</p>
          <p class="leading-relaxed text-[11px]">
            Your Supabase user ID has not been granted the <span class="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded">admin</span> role in the <code class="font-mono text-slate-800">public.user_roles</code> table.
          </p>
        </div>

        <div class="pt-2 flex flex-col gap-2">
          <button
            (click)="auth.signOut()"
            class="w-full h-10 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition flex items-center justify-center gap-2">
            <app-icon name="logout" [size]="14"></app-icon>
            <span>Sign Out & Try Another Account</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class UnauthorizedComponent {
  auth = inject(AuthService);
  router = inject(Router);
}

