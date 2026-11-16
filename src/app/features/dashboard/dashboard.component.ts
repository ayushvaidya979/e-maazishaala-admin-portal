import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../core/services/supabase.service';
import { Book } from '../../core/models/book.model';
import { Batch } from '../../core/models/batch.model';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface DashboardStats {
  totalUsers: number;
  publishedBooks: number;
  totalBooks: number;
  upcomingBatches: number;
  activeBatches: number;
  totalAnnouncements: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Welcome & Quick Actions Bar -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Overview & Metrics</h2>
          <p class="text-xs text-slate-500 mt-0.5">Live content metrics and operational state synchronized with Supabase.</p>
        </div>

        <div class="flex flex-wrap items-center gap-2">
          <button
            type="button"
            (click)="loadStats()"
            [disabled]="isLoading()"
            class="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-2">
            <app-icon name="refresh" [size]="14" [customClass]="isLoading() ? 'animate-spin' : ''"></app-icon>
            <span>Refresh</span>
          </button>

          <a
            routerLink="/books"
            [queryParams]="{ action: 'new' }"
            class="h-9 px-3.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-2">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Add Book</span>
          </a>

          <a
            routerLink="/batches"
            [queryParams]="{ action: 'new' }"
            class="h-9 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-2">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Create Batch</span>
          </a>

          <a
            routerLink="/live-classes"
            [queryParams]="{ action: 'new' }"
            class="h-9 px-3.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-2">
            <app-icon name="video" [size]="14" color="#ffffff"></app-icon>
            <span>Live Class</span>
          </a>
        </div>
      </div>

      <!-- Overview Cards Grid -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- 1. Total Registered Users -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Registered Students</span>
            <div class="w-8 h-8 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center">
              <app-icon name="users" [size]="16" color="#1d4ed8"></app-icon>
            </div>
          </div>
          <div class="mt-4 flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 tracking-tight">{{ stats().totalUsers }}</span>
            <span class="text-[11px] font-medium text-slate-400">profiles</span>
          </div>
          <div class="mt-2 text-[11px] text-slate-500 flex items-center gap-1">
            <app-icon name="shield" [size]="11" color="#10b981"></app-icon>
            <span>Verified student accounts</span>
          </div>
        </div>

        <!-- 2. Published Books -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Published Books</span>
            <div class="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <app-icon name="book" [size]="16" color="#047857"></app-icon>
            </div>
          </div>
          <div class="mt-4 flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 tracking-tight">{{ stats().publishedBooks }}</span>
            <span class="text-[11px] font-medium text-slate-400">of {{ stats().totalBooks }} total</span>
          </div>
          <div class="mt-2 text-[11px] text-emerald-700 font-semibold flex items-center gap-1">
            <app-icon name="check" [size]="12"></app-icon>
            <span>Live in student store</span>
          </div>
        </div>

        <!-- 3. Active Batches -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Active Batches</span>
            <div class="w-8 h-8 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <app-icon name="layers" [size]="16" color="#d97706"></app-icon>
            </div>
          </div>
          <div class="mt-4 flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 tracking-tight">{{ stats().activeBatches }}</span>
            <span class="text-[11px] font-medium text-slate-400">open / ongoing</span>
          </div>
          <div class="mt-2 text-[11px] text-amber-700 font-medium">
            Enrollments currently accepting
          </div>
        </div>

        <!-- 4. Upcoming Batches -->
        <div class="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-sm transition">
          <div class="flex items-center justify-between">
            <span class="text-xs font-semibold text-slate-500">Upcoming Batches</span>
            <div class="w-8 h-8 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
              <app-icon name="layers" [size]="16" color="#7e22ce"></app-icon>
            </div>
          </div>
          <div class="mt-4 flex items-baseline gap-2">
            <span class="text-2xl font-black text-slate-900 tracking-tight">{{ stats().upcomingBatches }}</span>
            <span class="text-[11px] font-medium text-slate-400">scheduled</span>
          </div>
          <div class="mt-2 text-[11px] text-purple-700 font-medium">
            Starting soon on student app
          </div>
        </div>
      </div>

      <!-- Quick Action Buttons Row -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          routerLink="/books"
          [queryParams]="{ action: 'new' }"
          class="p-4 bg-white rounded-2xl border border-slate-200 hover:border-emerald-600/50 hover:bg-emerald-50/30 transition flex flex-col items-start gap-2 shadow-2xs group">
          <div class="p-2 rounded-xl bg-emerald-50 text-emerald-700 group-hover:scale-105 transition-transform">
            <app-icon name="book" [size]="16" color="#047857"></app-icon>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-800 block">Add New Book</span>
            <span class="text-[11px] text-slate-400">Publish or draft study textbook</span>
          </div>
        </a>

        <a
          routerLink="/batches"
          [queryParams]="{ action: 'new' }"
          class="p-4 bg-white rounded-2xl border border-slate-200 hover:border-slate-800/40 hover:bg-slate-50 transition flex flex-col items-start gap-2 shadow-2xs group">
          <div class="p-2 rounded-xl bg-slate-100 text-slate-800 group-hover:scale-105 transition-transform">
            <app-icon name="layers" [size]="16"></app-icon>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-800 block">Create Batch</span>
            <span class="text-[11px] text-slate-400">Schedule program & seat limits</span>
          </div>
        </a>

        <a
          routerLink="/content"
          [queryParams]="{ tab: 'announcements', action: 'new' }"
          class="p-4 bg-white rounded-2xl border border-slate-200 hover:border-blue-500/40 hover:bg-blue-50/30 transition flex flex-col items-start gap-2 shadow-2xs group">
          <div class="p-2 rounded-xl bg-blue-50 text-blue-700 group-hover:scale-105 transition-transform">
            <app-icon name="bell" [size]="16" color="#2563eb"></app-icon>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-800 block">Publish Announcement</span>
            <span class="text-[11px] text-slate-400">Broadcast notice to student app</span>
          </div>
        </a>

        <a
          routerLink="/content"
          class="p-4 bg-white rounded-2xl border border-slate-200 hover:border-purple-500/40 hover:bg-purple-50/30 transition flex flex-col items-start gap-2 shadow-2xs group">
          <div class="p-2 rounded-xl bg-purple-50 text-purple-700 group-hover:scale-105 transition-transform">
            <app-icon name="content" [size]="16" color="#9333ea"></app-icon>
          </div>
          <div>
            <span class="text-xs font-bold text-slate-800 block">Edit Homepage</span>
            <span class="text-[11px] text-slate-400">Customize banners & sections</span>
          </div>
        </a>
      </div>

      <!-- Two-Column Layout: Recently Added Books & Recent Batches -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recently Added Books -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-emerald-600"></div>
              <h3 class="text-sm font-bold text-slate-900">Recently Added Books</h3>
            </div>
            <a routerLink="/books" class="text-xs font-semibold text-emerald-700 hover:underline">View All</a>
          </div>

          @if (recentBooks().length === 0) {
            <div class="py-8 text-center text-xs text-slate-400">
              No books published yet. Click "Add Book" above to populate your catalog.
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (book of recentBooks(); track book.id) {
                <div class="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div class="flex items-center gap-3 min-w-0">
                    <img
                      [src]="book.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=120&q=80'"
                      alt="Cover"
                      class="w-9 h-12 object-cover rounded-md border border-slate-200 shrink-0 bg-slate-100" />
                    <div class="min-w-0">
                      <span class="text-xs font-bold text-slate-800 block truncate">{{ book.title }}</span>
                      <span class="text-[11px] text-slate-500 block truncate">{{ book.author }} • {{ book.category || 'General' }}</span>
                    </div>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <span class="text-xs font-bold text-slate-800">₹{{ book.price }}</span>
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [ngClass]="book.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'">
                      {{ book.is_published ? 'Published' : 'Draft' }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Upcoming & Active Batches -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 space-y-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <div class="w-2 h-2 rounded-full bg-blue-600"></div>
              <h3 class="text-sm font-bold text-slate-900">Academic Batches</h3>
            </div>
            <a routerLink="/batches" class="text-xs font-semibold text-emerald-700 hover:underline">View All</a>
          </div>

          @if (recentBatches().length === 0) {
            <div class="py-8 text-center text-xs text-slate-400">
              No batches scheduled yet. Click "Create Batch" above to schedule an academic session.
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (batch of recentBatches(); track batch.id) {
                <div class="py-3 flex items-center justify-between gap-3 first:pt-0 last:pb-0">
                  <div class="min-w-0">
                    <span class="text-xs font-bold text-slate-800 block truncate">{{ batch.name }}</span>
                    <span class="text-[11px] text-slate-500 block truncate">{{ batch.course_name }} • Starts {{ batch.start_date }}</span>
                  </div>

                  <div class="flex items-center gap-3 shrink-0">
                    <div class="text-right">
                      <span class="text-xs font-bold text-slate-800 block">{{ batch.available_seats }}/{{ batch.total_seats }}</span>
                      <span class="text-[10px] text-slate-400 block">seats left</span>
                    </div>
                    <span
                      class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                      [ngClass]="{
                        'bg-blue-50 text-blue-700': batch.status === 'Upcoming',
                        'bg-emerald-50 text-emerald-700': batch.status === 'Registration Open',
                        'bg-red-50 text-red-700': batch.status === 'Full',
                        'bg-amber-50 text-amber-700': batch.status === 'Ongoing',
                        'bg-slate-100 text-slate-600': batch.status === 'Completed' || batch.status === 'Cancelled'
                      }">
                      {{ batch.status }}
                    </span>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class DashboardComponent implements OnInit {
  private supabase = inject(SupabaseService).clientInstance;

  isLoading = signal(false);
  stats = signal<DashboardStats>({
    totalUsers: 0,
    publishedBooks: 0,
    totalBooks: 0,
    upcomingBatches: 0,
    activeBatches: 0,
    totalAnnouncements: 0
  });

  recentBooks = signal<Book[]>([]);
  recentBatches = signal<Batch[]>([]);

  ngOnInit() {
    this.loadStats();
  }

  async loadStats() {
    this.isLoading.set(true);

    try {
      // 1. Fetch Users count from profiles
      const { count: usersCount } = await this.supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      // 2. Fetch Books stats
      const { data: booksData } = await this.supabase
        .from('books')
        .select('*')
        .order('created_at', { ascending: false });

      const allBooks: Book[] = (booksData as any[]) || [];
      const publishedBooks = allBooks.filter(b => b.is_published).length;
      this.recentBooks.set(allBooks.slice(0, 5));

      // 3. Fetch Batches stats
      const { data: batchesData } = await this.supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      const allBatches: Batch[] = (batchesData as any[]) || [];
      const upcoming = allBatches.filter(b => b.status === 'Upcoming').length;
      const active = allBatches.filter(b => b.status === 'Registration Open' || b.status === 'Ongoing').length;
      this.recentBatches.set(allBatches.slice(0, 5));

      // 4. Fetch Announcements count
      const { count: announcementsCount } = await this.supabase
        .from('app_content')
        .select('*', { count: 'exact', head: true });

      this.stats.set({
        totalUsers: usersCount || 0,
        publishedBooks,
        totalBooks: allBooks.length,
        upcomingBatches: upcoming,
        activeBatches: active,
        totalAnnouncements: announcementsCount || 0
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics from Supabase:', err);
    } finally {
      this.isLoading.set(false);
    }
  }
}

