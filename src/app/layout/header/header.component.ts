import { Component, Input, Output, EventEmitter, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <header class="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-20">
      <div class="flex items-center gap-3">
        <!-- Mobile hamburger toggle -->
        <button
          type="button"
          (click)="toggleMobileSidebar.emit()"
          class="lg:hidden p-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition">
          <app-icon name="menu" [size]="20"></app-icon>
        </button>

        <!-- Current Section / Page Title -->
        <div>
          <h1 class="text-sm sm:text-base font-bold text-slate-900 leading-tight">{{ pageTitle }}</h1>
          <p class="text-[11px] text-slate-400 hidden sm:block">e-MaziShaala Education Operations</p>
        </div>
      </div>

      <!-- Right Action Items -->
      <div class="flex items-center gap-3">
        <!-- Live System Status Badge -->
        <div class="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200/60 text-[11px] font-semibold text-emerald-800">
          <span class="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
          <span>Supabase Connected</span>
        </div>

        <!-- Open User Application Link -->
        <a
          href="http://localhost:4200"
          target="_blank"
          rel="noopener noreferrer"
          title="Open User Portal in new tab"
          class="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 hover:text-emerald-700 transition">
          <span>Student App</span>
          <app-icon name="external-link" [size]="12"></app-icon>
        </a>

        <!-- Admin Profile Menu -->
        <div class="relative">
          <button
            type="button"
            (click)="showDropdown.set(!showDropdown())"
            class="flex items-center gap-2 p-1 pl-2 rounded-xl hover:bg-slate-100 transition">
            @if (auth.adminProfile(); as profile) {
              <img
                [src]="profile.avatarUrl"
                alt="Admin avatar"
                class="w-7 h-7 rounded-full object-cover border border-slate-200" />
              <span class="text-xs font-semibold text-slate-800 hidden md:block">{{ profile.fullName }}</span>
            }
            <app-icon name="chevron-down" [size]="14" color="#64748b"></app-icon>
          </button>

          <!-- Dropdown menu -->
          @if (showDropdown()) {
            <div
              (mouseleave)="showDropdown.set(false)"
              class="absolute right-0 mt-2 w-52 bg-white rounded-2xl border border-slate-200 shadow-xl py-2 z-50 text-xs animate-slide-in">
              <div class="px-4 py-2 border-b border-slate-100">
                <span class="font-bold text-slate-800 block truncate">{{ auth.adminProfile()?.fullName }}</span>
                <span class="text-[10px] text-slate-400 block truncate">{{ auth.adminProfile()?.email }}</span>
                <span class="mt-1 inline-block px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800">Administrator</span>
              </div>

              <div class="py-1">
                <a
                  routerLink="/settings"
                  (click)="showDropdown.set(false)"
                  class="flex items-center gap-2.5 px-4 py-2 text-slate-700 hover:bg-slate-50 hover:text-emerald-700">
                  <app-icon name="settings" [size]="14"></app-icon>
                  <span>Portal Settings</span>
                </a>
              </div>

              <div class="border-t border-slate-100 pt-1">
                <button
                  type="button"
                  (click)="showDropdown.set(false); auth.signOut()"
                  class="w-full text-left flex items-center gap-2.5 px-4 py-2 text-red-600 hover:bg-red-50 transition">
                  <app-icon name="logout" [size]="14" color="#dc2626"></app-icon>
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  @Input() pageTitle = 'Dashboard';
  @Output() toggleMobileSidebar = new EventEmitter<void>();

  auth = inject(AuthService);
  showDropdown = signal(false);
}

