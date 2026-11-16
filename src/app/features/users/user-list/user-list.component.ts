import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserService } from '../../../core/services/user.service';
import { PortalUser } from '../../../core/models/user.model';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Registered User Directory</h2>
          <p class="text-xs text-slate-500 mt-0.5">Audit student and administrative accounts registered via Supabase Auth.</p>
        </div>

        <button
          type="button"
          (click)="userService.fetchUsers()"
          class="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 self-start sm:self-auto">
          <app-icon name="refresh" [size]="14" [customClass]="userService.isLoading() ? 'animate-spin' : ''"></app-icon>
          <span>Refresh Directory</span>
        </button>
      </div>

      <!-- Security Notice Banner -->
      <div class="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-start gap-3 text-xs text-slate-600">
        <div class="p-1 rounded-lg bg-emerald-100 text-emerald-800 shrink-0 mt-0.5">
          <app-icon name="shield" [size]="14" color="#047857"></app-icon>
        </div>
        <div class="leading-relaxed space-y-1">
          <span class="font-bold text-slate-900 block">Read-Only Directory & Security Enforcement</span>
          <p class="text-[11px] text-slate-500">
            In compliance with Supabase security principles, password hashes and sensitive authentication credentials are never exposed to the client. Administrative roles cannot be granted via public forms and must be assigned strictly through the Supabase SQL Editor.
          </p>
        </div>
      </div>

      <!-- Search & Filter Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <app-icon name="search" [size]="14"></app-icon>
          </div>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search users by name, email, or account ID..."
            class="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition" />
        </div>

        <div class="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
          <button
            (click)="roleFilter.set('all')"
            class="px-3 py-1 rounded-lg transition"
            [ngClass]="roleFilter() === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'">
            All Users ({{ userService.users().length }})
          </button>
          <button
            (click)="roleFilter.set('admin')"
            class="px-3 py-1 rounded-lg transition"
            [ngClass]="roleFilter() === 'admin' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
            Admins
          </button>
          <button
            (click)="roleFilter.set('student')"
            class="px-3 py-1 rounded-lg transition"
            [ngClass]="roleFilter() === 'student' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
            Students
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        @if (userService.isLoading() && userService.users().length === 0) {
          <div class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-slate-500 font-medium">Loading user accounts from Supabase...</p>
          </div>
        } @else if (paginatedUsers().length === 0) {
          <div class="py-16 text-center space-y-2 max-w-sm mx-auto px-4">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <app-icon name="users" [size]="22"></app-icon>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No users found</h3>
            <p class="text-xs text-slate-500">
              {{ searchQuery ? 'No account matches your search query.' : 'No student profiles registered in Supabase yet.' }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4 min-w-[200px]">User Name</th>
                  <th class="py-3 px-4">Email Address</th>
                  <th class="py-3 px-4">Account ID</th>
                  <th class="py-3 px-4">Role</th>
                  <th class="py-3 px-4">Registration Date</th>
                  <th class="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (user of paginatedUsers(); track user.id) {
                  <tr class="hover:bg-slate-50/60 transition group">
                    <!-- Profile avatar & Name -->
                    <td class="py-3 px-4">
                      <div class="flex items-center gap-3">
                        <img
                          [src]="user.avatar_url"
                          alt="Avatar"
                          class="w-8 h-8 rounded-full object-cover border border-slate-200 bg-slate-100 shrink-0" />
                        <div>
                          <div class="font-bold text-slate-900 group-hover:text-emerald-800 transition">{{ user.full_name }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Email -->
                    <td class="py-3 px-4 text-slate-700 font-mono text-[11px]">
                      {{ user.email }}
                    </td>

                    <!-- Account ID -->
                    <td class="py-3 px-4 font-mono text-[10px] text-slate-400">
                      {{ user.id.substring(0, 13) }}...
                    </td>

                    <!-- Role -->
                    <td class="py-3 px-4">
                      <span
                        class="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                        [ngClass]="user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'">
                        {{ user.role }}
                      </span>
                    </td>

                    <!-- Registered Date -->
                    <td class="py-3 px-4 text-slate-500 text-[11px]">
                      {{ user.created_at ? (user.created_at | date:'mediumDate') : 'Recent' }}
                    </td>

                    <!-- Details -->
                    <td class="py-3 px-4 text-right">
                      <button
                        type="button"
                        (click)="selectedUser.set(user)"
                        class="px-2.5 py-1 rounded-lg text-emerald-700 bg-emerald-50 hover:bg-emerald-100 text-[11px] font-semibold transition">
                        Inspect
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page {{ currentPage() }} of {{ totalPages() }} ({{ filteredUsers().length }} users)
              </div>
              <div class="flex items-center gap-1">
                <button
                  type="button"
                  [disabled]="currentPage() === 1"
                  (click)="currentPage.set(currentPage() - 1)"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
                  Prev
                </button>
                @for (p of pageNumbers(); track p) {
                  <button
                    type="button"
                    (click)="currentPage.set(p)"
                    class="w-7 h-7 rounded-lg text-xs font-semibold transition"
                    [ngClass]="currentPage() === p ? 'bg-emerald-700 text-white' : 'hover:bg-slate-100 text-slate-700'">
                    {{ p }}
                  </button>
                }
                <button
                  type="button"
                  [disabled]="currentPage() === totalPages()"
                  (click)="currentPage.set(currentPage() + 1)"
                  class="px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 disabled:opacity-40 transition">
                  Next
                </button>
              </div>
            </div>
          }
        }
      </div>

      <!-- User Inspection Modal -->
      @if (selectedUser(); as user) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-slide-in">
            <div class="flex items-start justify-between">
              <div class="flex items-center gap-3">
                <img
                  [src]="user.avatar_url"
                  alt="Avatar"
                  class="w-12 h-12 rounded-full object-cover border border-slate-200" />
                <div>
                  <h3 class="text-sm font-bold text-slate-900">{{ user.full_name }}</h3>
                  <span class="inline-block mt-0.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider"
                    [ngClass]="user.role === 'admin' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'">
                    {{ user.role }}
                  </span>
                </div>
              </div>
              <button
                type="button"
                (click)="selectedUser.set(null)"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="space-y-3 pt-2 text-xs">
              <div class="p-3 bg-slate-50 rounded-xl space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Email Address</span>
                <p class="font-mono text-slate-800">{{ user.email }}</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account UUID</span>
                <p class="font-mono text-slate-800 text-[11px] break-all">{{ user.id }}</p>
              </div>

              <div class="p-3 bg-slate-50 rounded-xl space-y-1">
                <span class="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Account Creation Date</span>
                <p class="text-slate-800">{{ user.created_at ? (user.created_at | date:'fullDate') : 'Recent' }}</p>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="button"
                (click)="selectedUser.set(null)"
                class="w-full h-9 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition">
                Close
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class UserListComponent implements OnInit {
  userService = inject(UserService);

  searchQuery = '';
  roleFilter = signal<string>('all');
  currentPage = signal(1);
  pageSize = 10;
  selectedUser = signal<PortalUser | null>(null);

  ngOnInit() {
    this.userService.fetchUsers();
  }

  filteredUsers = computed(() => {
    let list = this.userService.users();
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(u =>
        u.full_name?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query) ||
        u.id?.toLowerCase().includes(query)
      );
    }

    const role = this.roleFilter();
    if (role !== 'all') {
      list = list.filter(u => u.role === role);
    }

    return list;
  });

  totalPages = computed(() => Math.ceil(this.filteredUsers().length / this.pageSize) || 1);

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredUsers().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });
}

