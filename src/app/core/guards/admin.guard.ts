import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SupabaseService } from '../services/supabase.service';

export const adminGuard: CanActivateFn = async (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const supabase = inject(SupabaseService).clientInstance;

  // 1. Check if master admin local session is active
  if (auth.hasActiveAdminSession() || auth.isAdmin()) {
    return true;
  }

  // 2. Check Supabase session
  const { data: { session } } = await supabase.auth.getSession();

  if (session) {
    const isAdmin = await auth.checkAdminRole(session.user.id);
    if (isAdmin) return true;
    return router.createUrlTree(['/unauthorized']);
  }

  return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url } });
};
