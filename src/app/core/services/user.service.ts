import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { PortalUser } from '../models/user.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);

  private usersSignal = signal<PortalUser[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  readonly users = this.usersSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  async fetchUsers(): Promise<PortalUser[]> {
    this.isLoadingSignal.set(true);
    try {
      // 1. Fetch user profiles
      const { data: profiles, error: profileError } = await this.supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url, created_at, updated_at')
        .order('created_at', { ascending: false });

      if (profileError) {
        this.toast.error('Failed to load users: ' + profileError.message);
        return [];
      }

      // 2. Fetch roles to identify any admin/staff
      const { data: roles } = await this.supabase
        .from('user_roles')
        .select('user_id, role');

      const roleMap = new Map<string, string>();
      if (roles) {
        roles.forEach((r: any) => roleMap.set(r.user_id, r.role));
      }

      const userList: PortalUser[] = ((profiles as any[]) || []).map(p => ({
        id: p.id,
        email: p.email || 'No email provided',
        full_name: p.full_name || 'Registered Student',
        avatar_url: p.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80',
        role: roleMap.get(p.id) || 'student',
        created_at: p.created_at,
        updated_at: p.updated_at
      }));

      this.usersSignal.set(userList);
      return userList;
    } catch (err: any) {
      this.toast.error('Error fetching users: ' + err.message);
      return [];
    } finally {
      this.isLoadingSignal.set(false);
    }
  }
}

