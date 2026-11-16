import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SupabaseService } from '../../../core/services/supabase.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm text-center max-w-sm w-full space-y-4">
        <div class="w-10 h-10 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto"></div>
        <h2 class="text-base font-bold text-slate-800">Verifying Admin Privileges</h2>
        <p class="text-xs text-slate-500">Exchanging credentials with Supabase Auth & checking permissions...</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit {
  private supabase = inject(SupabaseService).clientInstance;
  private auth = inject(AuthService);
  private router = inject(Router);
  private toast = inject(ToastService);

  async ngOnInit() {
    try {
      const { data: { session }, error } = await this.supabase.auth.getSession();

      if (error || !session) {
        this.router.navigate(['/login'], { queryParams: { error: 'Authentication exchange failed' } });
        return;
      }

      // Check admin status
      const isAdmin = await this.auth.checkAdminRole(session.user.id);

      if (isAdmin) {
        this.toast.success('Admin authentication verified successfully!');
        this.router.navigate(['/dashboard']);
      } else {
        await this.supabase.auth.signOut();
        this.router.navigate(['/login'], { queryParams: { unauthorized: 'true' } });
      }
    } catch (e) {
      this.router.navigate(['/login']);
    }
  }
}

