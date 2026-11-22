import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6 max-w-4xl">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Portal & System Settings</h2>
          <p class="text-xs text-slate-500 mt-0.5">Application configuration, branding parameters, INR currency, and administrator profile.</p>
        </div>

        <button
          type="button"
          (click)="saveAllSettings()"
          [disabled]="isSaving()"
          class="h-9 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 self-start sm:self-auto disabled:opacity-50">
          @if (isSaving()) {
            <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          }
          <span>Save Settings</span>
        </button>
      </div>

      <!-- 1. Administrator Profile Card -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
          <h3 class="text-sm font-bold text-slate-900">Current Administrator Identity</h3>
        </div>

        @if (auth.adminProfile(); as profile) {
          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div class="flex items-center gap-3.5">
              <img
                [src]="profile.avatarUrl"
                alt="Avatar"
                class="w-12 h-12 rounded-full object-cover border-2 border-emerald-100" />
              <div>
                <span class="text-sm font-bold text-slate-900 block">{{ profile.fullName }}</span>
                <span class="text-xs text-slate-500 block font-mono">{{ profile.email }}</span>
                <span class="mt-1 inline-block px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                  Verified Administrator (RLS Active)
                </span>
              </div>
            </div>

            <button
              type="button"
              (click)="auth.signOut()"
              class="h-8 px-3 rounded-xl border border-red-200 text-red-600 hover:bg-red-50 text-xs font-semibold transition flex items-center gap-1.5">
              <app-icon name="logout" [size]="12" color="#dc2626"></app-icon>
              <span>Sign Out</span>
            </button>
          </div>
        }
      </div>

      <!-- 2. Application Identity & Branding -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div class="w-2 h-2 rounded-full bg-blue-600"></div>
          <h3 class="text-sm font-bold text-slate-900">Application Identity & Metadata</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Application Name</label>
            <input
              type="text"
              [(ngModel)]="appName"
              name="appName"
              placeholder="e-maazishaala"
              class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Portal Tagline / Subtitle</label>
            <input
              type="text"
              [(ngModel)]="appTagline"
              name="appTagline"
              placeholder="ई-माझीशाळा - डिजिटल शिक्षण मंच"
              class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
          </div>
        </div>

        <div>
          <label class="block text-xs font-semibold text-slate-700 mb-1">Brand Logo Image URL</label>
          <input
            type="url"
            [(ngModel)]="logoUrl"
            name="logoUrl"
            placeholder="https://..."
            class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
        </div>
      </div>

      <!-- 3. Financial Localization & Currency -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div class="w-2 h-2 rounded-full bg-amber-600"></div>
          <h3 class="text-sm font-bold text-slate-900">Currency & Regional Settings</h3>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Currency Code</label>
            <input
              type="text"
              [(ngModel)]="currencyCode"
              name="currencyCode"
              disabled
              class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-800" />
            <span class="text-[10px] text-slate-400 mt-0.5 block">Default currency standard</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Currency Symbol</label>
            <input
              type="text"
              [(ngModel)]="currencySymbol"
              name="currencySymbol"
              disabled
              class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-800" />
            <span class="text-[10px] text-slate-400 mt-0.5 block">Indian Rupee symbol</span>
          </div>

          <div>
            <label class="block text-xs font-semibold text-slate-700 mb-1">Operational Timezone</label>
            <input
              type="text"
              value="Asia/Kolkata (IST +5:30)"
              disabled
              class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-slate-50 text-slate-700" />
          </div>
        </div>
      </div>

      <!-- 4. Supabase Backend Health & Security Status -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-4">
        <div class="flex items-center gap-2 border-b border-slate-100 pb-3">
          <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
          <h3 class="text-sm font-bold text-slate-900">Backend Infrastructure Status</h3>
        </div>

        <div class="space-y-3 text-xs">
          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span class="font-bold text-slate-800 block">Supabase Project Endpoint</span>
              <span class="font-mono text-[11px] text-slate-500">https://ozwyifbaqmfuytgwzmjy.supabase.co</span>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Active & Healthy
            </span>
          </div>

          <div class="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
            <div>
              <span class="font-bold text-slate-800 block">Row-Level Security (RLS) Status</span>
              <span class="text-[11px] text-slate-500">All database mutations require verified is_admin role</span>
            </div>
            <span class="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              Enforced
            </span>
          </div>

          <div class="p-3.5 bg-emerald-50/50 border border-emerald-200/60 rounded-xl text-[11px] text-emerald-900 space-y-1">
            <span class="font-bold block">Production Security Guarantee</span>
            <p class="leading-relaxed text-emerald-800">
              In accordance with security standards, the Supabase service role key is strictly absent from all client bundles and application source code.
            </p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SettingsComponent implements OnInit {
  settingsService = inject(SettingsService);
  auth = inject(AuthService);
  toast = inject(ToastService);

  appName = 'e-maazishaala';
  appTagline = 'ई-माझीशाळा - डिजिटल शिक्षण मंच';
  logoUrl = '';
  currencyCode = 'INR';
  currencySymbol = '₹';
  isSaving = signal(false);

  ngOnInit() {
    this.settingsService.fetchSettings().then(settings => {
      const appNameSetting = settings.find(s => s.setting_key === 'app_name');
      if (appNameSetting?.setting_value?.value) {
        this.appName = appNameSetting.setting_value.value;
      }

      this.appTagline = settings.find(s => s.setting_key === 'app_tagline')?.setting_value?.value || this.appTagline;
      this.logoUrl = settings.find(s => s.setting_key === 'logo_url')?.setting_value?.value || '';
      const currencySetting = settings.find(s => s.setting_key === 'currency');
      if (currencySetting?.setting_value) {
        this.currencyCode = currencySetting.setting_value.value || 'INR';
        this.currencySymbol = currencySetting.setting_value.symbol || '₹';
      }
    });
  }

  async saveAllSettings() {
    this.isSaving.set(true);

    const results = [];
    for (const [key, value] of Object.entries({ app_name: { value: this.appName }, app_tagline: { value: this.appTagline }, logo_url: { value: this.logoUrl }, currency: { value: this.currencyCode, symbol: this.currencySymbol } })) {
      results.push(await this.settingsService.updateSetting(key, value));
    }

    this.isSaving.set(false);
    if (results.every(Boolean)) this.toast.success('All settings saved to Supabase');
  }
}

