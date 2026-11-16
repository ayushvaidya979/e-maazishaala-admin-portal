import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AppSetting } from '../models/settings.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);

  private settingsSignal = signal<AppSetting[]>([]);
  private isLoadingSignal = signal<boolean>(false);

  readonly settings = this.settingsSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  async fetchSettings(): Promise<AppSetting[]> {
    this.isLoadingSignal.set(true);
    try {
      const { data, error } = await this.supabase
        .from('app_settings')
        .select('*');

      if (error) {
        this.toast.error('Failed to load settings: ' + error.message);
        return [];
      }

      const list: AppSetting[] = (data as any[]) || [];
      this.settingsSignal.set(list);
      return list;
    } catch (err: any) {
      this.toast.error('Error fetching settings: ' + err.message);
      return [];
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async updateSetting(key: string, value: any): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('app_settings')
        .update({
          setting_value: value,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', key);

      if (error) throw error;

      this.toast.success(`Setting '${key}' saved successfully`);
      await this.fetchSettings();
      return true;
    } catch (err: any) {
      this.toast.error(`Failed to update setting: ${err.message}`);
      return false;
    }
  }
}

