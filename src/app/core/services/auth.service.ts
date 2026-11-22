import { Injectable, inject, signal, computed } from '@angular/core';
import { Router } from '@angular/router';
import { Session, User } from '@supabase/supabase-js';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

export interface AdminProfile {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string;
  role: string;
}

const LOCAL_STORAGE_KEY = 'emaazishaala_admin_session';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private supabase = inject(SupabaseService).clientInstance;
  private router = inject(Router);
  private toast = inject(ToastService);

  private sessionSignal = signal<Session | null>(null);
  private userSignal = signal<User | null>(null);
  private adminProfileSignal = signal<AdminProfile | null>(null);
  private isAdminSignal = signal<boolean>(false);
  private isLoadingSignal = signal<boolean>(true);

  readonly session = this.sessionSignal.asReadonly();
  readonly user = this.userSignal.asReadonly();
  readonly adminProfile = this.adminProfileSignal.asReadonly();
  readonly isAdmin = this.isAdminSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  readonly isAuthenticated = computed(() => this.isAdminSignal() && !!this.sessionSignal());

  constructor() {
    this.initAuth();
  }

  private async initAuth() {
    this.isLoadingSignal.set(true);

    localStorage.removeItem(LOCAL_STORAGE_KEY);

    // 2. Check Supabase session
    try {
      const { data: { session } } = await this.supabase.auth.getSession();
      if (session) {
        await this.handleSessionUpdate(session);
      } else {
        this.clearState();
      }
    } catch (err) {
      console.error('Session retrieval error:', err);
      this.clearState();
    } finally {
      this.isLoadingSignal.set(false);
    }

    this.supabase.auth.onAuthStateChange((event, session) => {
      setTimeout(async () => {
      if (session) {
        await this.handleSessionUpdate(session);
      } else {
        this.clearState();
      }
      this.isLoadingSignal.set(false);
      }, 0);
    });
  }

  private setAdminProfileState(profile: AdminProfile) {
    this.isAdminSignal.set(true);
    this.adminProfileSignal.set(profile);
  }

  private async handleSessionUpdate(session: Session) {
    this.sessionSignal.set(session);
    this.userSignal.set(session.user);

    const isAdmin = await this.checkAdminRole(session.user.id);
    this.isAdminSignal.set(isAdmin);

    if (isAdmin) {
      const metadata = session.user.user_metadata || {};
      const profile: AdminProfile = {
        id: session.user.id,
        email: session.user.email || 'admin@emaazishaala.com',
        fullName: metadata['full_name'] || metadata['name'] || session.user.email?.split('@')[0] || 'Admin e-MaziShaala',
        avatarUrl: metadata['avatar_url'] || metadata['picture'] || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        role: 'admin'
      };
      this.setAdminProfileState(profile);
    } else {
      this.adminProfileSignal.set(null);
    }
  }

  async checkAdminRole(userId: string): Promise<boolean> {

    try {
      const { data: rpcResult, error: rpcError } = await this.supabase.rpc('is_admin');
      if (!rpcError && typeof rpcResult === 'boolean' && rpcResult === true) {
        return true;
      }

      const { data: roleRow, error: roleError } = await this.supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      if (!roleError && roleRow && roleRow.role === 'admin') {
        return true;
      }
    } catch (err) {
      console.error('Admin role verification failed:', err);
    }

    return false;
  }

  hasActiveAdminSession(): boolean {
    return !!this.sessionSignal() && this.isAdminSignal();
  }

  async signInWithCredentials(usernameInput: string, passwordInput: string): Promise<{ error?: string }> {
    const username = usernameInput.trim().toLowerCase();
    const password = passwordInput;
    // Secondary fallback: email sign-in with Supabase
    if (username.includes('@')) {
      try {
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: username,
          password
        });

        if (error) return { error: error.message };

        if (data.session) {
          await this.handleSessionUpdate(data.session);
          if (!this.isAdminSignal()) {
            await this.signOut();
            return { error: 'Access Denied: This account does not possess administrator privileges.' };
          }
          return {};
        }
      } catch (err: any) {
        return { error: err.message || 'Authentication error' };
      }
    }

    return { error: 'Invalid admin username or password. Please check your credentials.' };
  }

  async signInWithGoogle(): Promise<{ error?: string }> {
    const { error } = await this.supabase.auth.signInWithOAuth({ provider: 'google', options: {
      redirectTo: new URL('/auth/callback', window.location.origin).toString(),
      queryParams: { prompt: 'select_account' }
    } });
    return error ? { error: error.message } : {};
  }

  async signOut() {
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      await this.supabase.auth.signOut();
    } catch (e) {
      // Ignored
    } finally {
      this.clearState();
      this.router.navigate(['/login']);
      this.toast.info('Signed out of Admin Portal');
    }
  }

  private clearState() {
    this.sessionSignal.set(null);
    this.userSignal.set(null);
    this.adminProfileSignal.set(null);
    this.isAdminSignal.set(false);
  }
}
