import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <aside
      class="h-full bg-white border-r border-slate-200 flex flex-col justify-between transition-all duration-300 z-30 select-none"
      [ngClass]="{ 'w-64': !isCollapsed, 'w-20': isCollapsed }">
      <!-- Top Section -->
      <div>
        <!-- Portal Brand Header -->
        <div class="h-16 px-5 flex items-center justify-between border-b border-slate-100">
          <div class="flex items-center gap-3 overflow-hidden">
            <div class="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-700/20">
              <app-icon name="shield" [size]="18" color="#ffffff"></app-icon>
            </div>
            @if (!isCollapsed) {
              <div class="truncate">
                <span class="text-sm font-bold tracking-tight text-slate-900 block leading-tight">e-MaziShaala</span>
                <span class="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">Admin Portal</span>
              </div>
            }
          </div>

          <!-- Collapse toggle on desktop -->
          <button
            type="button"
            (click)="toggleCollapse.emit()"
            class="hidden lg:flex w-7 h-7 rounded-lg items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
            <app-icon [name]="isCollapsed ? 'arrow-right' : 'chevron-down'" [size]="14"></app-icon>
          </button>
        </div>

        <!-- Navigation Links -->
        <nav class="p-3 space-y-1">
          @for (item of navItems; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="bg-emerald-50 text-emerald-800 font-semibold shadow-2xs"
              [routerLinkActiveOptions]="{ exact: item.exact }"
              class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition group">
              <div
                class="shrink-0 transition-colors text-slate-400 group-hover:text-emerald-700"
                [ngClass]="{ 'text-emerald-700': isRouteActive(item.path) }">
                <app-icon [name]="item.icon" [size]="18"></app-icon>
              </div>
              @if (!isCollapsed) {
                <span class="truncate">{{ item.label }}</span>
                @if (item.badge) {
                  <span class="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    {{ item.badge }}
                  </span>
                }
              }
            </a>
          }
        </nav>
      </div>

      <!-- Bottom Section / Admin Info & Logout -->
      <div class="p-3 border-t border-slate-100 space-y-1">
        <!-- Logged In Admin Info -->
        @if (auth.adminProfile(); as profile) {
          <div class="px-3 py-2 rounded-xl bg-slate-50 border border-slate-100 flex items-center gap-3 mb-2">
            <img
              [src]="profile.avatarUrl"
              alt="Admin Avatar"
              class="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
            @if (!isCollapsed) {
              <div class="truncate">
                <span class="text-xs font-semibold text-slate-800 block truncate">{{ profile.fullName }}</span>
                <span class="text-[10px] text-slate-400 block truncate">{{ profile.email }}</span>
              </div>
            }
          </div>
        }

        <!-- Logout Button -->
        <button
          (click)="auth.signOut()"
          class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 hover:text-red-700 transition">
          <div class="shrink-0">
            <app-icon name="logout" [size]="18" color="#dc2626"></app-icon>
          </div>
          @if (!isCollapsed) {
            <span>Sign Out</span>
          }
        </button>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  @Input() isCollapsed = false;
  @Output() toggleCollapse = new EventEmitter<void>();

  auth = inject(AuthService);

  readonly navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: 'dashboard', exact: true },
    { label: 'Books', path: '/books', icon: 'book', exact: false },
    { label: 'Batches', path: '/batches', icon: 'layers', exact: false },
    { label: 'Live Classes', path: '/live-classes', icon: 'video', exact: false },
    { label: 'Users', path: '/users', icon: 'users', exact: false },
    { label: 'App Content', path: '/content', icon: 'content', exact: false },
    { label: 'Settings', path: '/settings', icon: 'settings', exact: false, badge: 'INR' }
  ];

  isRouteActive(path: string): boolean {
    return window.location.pathname.startsWith(path);
  }
}

