import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { LiveClassService } from '../../../core/services/live-class.service';
import { LiveClass, LiveClassStatus } from '../../../core/models/live-class.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-live-class-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Top Action & Search Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div class="flex items-center gap-2 mb-0.5">
            <span class="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            <h2 class="text-lg font-bold text-slate-900 tracking-tight">Live Classroom Operations</h2>
          </div>
          <p class="text-xs text-slate-500">Schedule interactive sessions, start live classes, and manage Google Meet URLs.</p>
        </div>

        <button
          type="button"
          (click)="openAddModal()"
          class="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 shrink-0">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Schedule Live Class</span>
        </button>
      </div>

      <!-- Search, Filter & Summary Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <app-icon name="search" [size]="14"></app-icon>
          </div>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search classes by title, teacher, or subject..."
            class="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition" />
        </div>

        <!-- Filter Statuses -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
            <button
              (click)="selectedStatusFilter.set('all')"
              class="px-3 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'">
              All ({{ liveClassService.classes().length }})
            </button>
            <button
              (click)="selectedStatusFilter.set('live')"
              class="px-3 py-1 rounded-lg transition flex items-center gap-1.5"
              [ngClass]="selectedStatusFilter() === 'live' ? 'bg-white text-red-700 shadow-2xs font-bold' : 'hover:text-slate-900'">
              <span class="w-1.5 h-1.5 rounded-full bg-red-600"></span>
              Live Now
            </button>
            <button
              (click)="selectedStatusFilter.set('upcoming')"
              class="px-3 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'upcoming' ? 'bg-white text-sky-700 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Upcoming
            </button>
            <button
              (click)="selectedStatusFilter.set('completed')"
              class="px-3 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'completed' ? 'bg-white text-slate-700 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Completed
            </button>
          </div>

          <!-- Refresh -->
          <button
            type="button"
            (click)="liveClassService.fetchClasses()"
            class="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <app-icon name="refresh" [size]="13" [customClass]="liveClassService.isLoading() ? 'animate-spin' : ''"></app-icon>
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Live Classes Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        @if (liveClassService.isLoading() && liveClassService.classes().length === 0) {
          <div class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-slate-500 font-medium">Fetching live sessions from Supabase...</p>
          </div>
        } @else if (filteredClasses().length === 0) {
          <div class="py-16 text-center space-y-3 max-w-sm mx-auto px-4">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <app-icon name="video" [size]="22"></app-icon>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No live classes found</h3>
            <p class="text-xs text-slate-500">
              {{ searchQuery ? 'Try adjusting your search query or filter.' : 'Click "Schedule Live Class" to organize your first session.' }}
            </p>
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4 min-w-[240px]">Live Session</th>
                  <th class="py-3 px-4 min-w-[160px]">Educator</th>
                  <th class="py-3 px-4 min-w-[150px]">Schedule & Timing</th>
                  <th class="py-3 px-4 min-w-[120px]">Live Status</th>
                  <th class="py-3 px-4 min-w-[140px]">Meeting Link</th>
                  <th class="py-3 px-4 text-right min-w-[120px]">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (c of filteredClasses(); track c.id) {
                  <tr class="hover:bg-slate-50/70 transition">
                    <!-- Session Title & Standard -->
                    <td class="py-3.5 px-4">
                      <div class="font-bold text-slate-900 leading-snug">{{ c.title }}</div>
                      <div class="flex items-center gap-2 mt-1">
                        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-100">
                          Std {{ c.standard }}
                        </span>
                        <span class="text-slate-400">•</span>
                        <span class="text-[11px] text-slate-600 font-medium">{{ c.subject }}</span>
                        @if (c.has_recording) {
                          <span class="text-slate-400">•</span>
                          <span class="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded">Recorded ({{ c.recording_duration || 'HD' }})</span>
                        }
                      </div>
                    </td>

                    <!-- Teacher / Faculty -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-2.5">
                        <img
                          [src]="c.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80'"
                          alt=""
                          class="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200" />
                        <div class="truncate">
                          <div class="font-semibold text-slate-800 truncate">{{ c.teacher_name }}</div>
                          <div class="text-[10px] text-slate-400 truncate">{{ c.teacher_title || 'Faculty' }}</div>
                        </div>
                      </div>
                    </td>

                    <!-- Schedule & Duration -->
                    <td class="py-3.5 px-4">
                      <div class="font-medium text-slate-800">{{ c.scheduled_date }}</div>
                      <div class="text-[10px] text-slate-500 mt-0.5">{{ c.scheduled_time }} ({{ c.duration }})</div>
                    </td>

                    <!-- Status with Quick Toggle -->
                    <td class="py-3.5 px-4">
                      <div class="flex items-center gap-1.5">
                        <span
                          class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider"
                          [ngClass]="{
                            'bg-red-50 text-red-700 border border-red-200': c.status === 'live',
                            'bg-sky-50 text-sky-700 border border-sky-200': c.status === 'upcoming',
                            'bg-slate-100 text-slate-700': c.status === 'completed'
                          }">
                          @if (c.status === 'live') {
                            <span class="w-1.5 h-1.5 rounded-full bg-red-600 animate-pulse"></span>
                          }
                          {{ c.status }}
                        </span>

                        <!-- Quick Go Live / End button -->
                        @if (c.status === 'upcoming') {
                          <button
                            type="button"
                            (click)="quickSetStatus(c, 'live')"
                            title="Start Live Class Now"
                            class="px-2 py-0.5 rounded text-[10px] font-bold bg-red-600 hover:bg-red-700 text-white transition">
                            Go Live
                          </button>
                        } @else if (c.status === 'live') {
                          <button
                            type="button"
                            (click)="quickSetStatus(c, 'completed')"
                            title="End and complete session"
                            class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-700 hover:bg-slate-800 text-white transition">
                            End Class
                          </button>
                        }
                      </div>
                    </td>

                    <!-- Meeting Link -->
                    <td class="py-3.5 px-4">
                      <a
                        [href]="c.meeting_link || 'https://meet.google.com'"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="inline-flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold text-[11px] hover:underline">
                        <span>Launch Meet</span>
                        <app-icon name="external-link" [size]="11"></app-icon>
                      </a>
                    </td>

                    <!-- Actions -->
                    <td class="py-3.5 px-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          (click)="openEditModal(c)"
                          class="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                          title="Edit Class">
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="classToDelete.set(c)"
                          class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
                          title="Delete Class">
                          <app-icon name="trash" [size]="14"></app-icon>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      <!-- Add / Edit Modal -->
      @if (showFormModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full my-8 overflow-hidden animate-slide-in">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  {{ editingClassId ? 'Edit Live Class' : 'Schedule New Live Class' }}
                </h3>
                <p class="text-[11px] text-slate-500">Configured classes appear in real-time on student apps.</p>
              </div>
              <button
                type="button"
                (click)="closeModal()"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Form Body -->
            <form (ngSubmit)="saveClass()" class="p-6 space-y-4">
              <!-- Title -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Class Title *</label>
                <input
                  type="text"
                  [(ngModel)]="formData.title"
                  name="title"
                  required
                  placeholder="e.g. Class 10 Live: Quadratic Equations Masterclass"
                  class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
              </div>

              <!-- Standard & Subject -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Standard / Class *</label>
                  <select
                    [(ngModel)]="formData.standard"
                    name="standard"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none bg-white transition">
                    <option [ngValue]="1">Standard 1</option>
                    <option [ngValue]="2">Standard 2</option>
                    <option [ngValue]="3">Standard 3</option>
                    <option [ngValue]="4">Standard 4</option>
                    <option [ngValue]="5">Standard 5</option>
                    <option [ngValue]="6">Standard 6</option>
                    <option [ngValue]="7">Standard 7</option>
                    <option [ngValue]="8">Standard 8</option>
                    <option [ngValue]="9">Standard 9</option>
                    <option [ngValue]="10">Standard 10</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Subject *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.subject"
                    name="subject"
                    required
                    placeholder="Mathematics, Science, etc."
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
              </div>

              <!-- Teacher Info -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Educator / Teacher Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.teacher_name"
                    name="teacher_name"
                    required
                    placeholder="Prof. Rahul Deshmukh"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Teacher Title</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.teacher_title"
                    name="teacher_title"
                    placeholder="Senior Mathematics Educator"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
              </div>

              <!-- Schedule & Duration -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Scheduled Date *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.scheduled_date"
                    name="scheduled_date"
                    required
                    placeholder="e.g. Today, Nov 16"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Timing *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.scheduled_time"
                    name="scheduled_time"
                    required
                    placeholder="06:00 PM - 07:15 PM"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Duration</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.duration"
                    name="duration"
                    placeholder="75 mins"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
              </div>

              <!-- Meeting Link & Status -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Google Meet / Live Link *</label>
                  <input
                    type="url"
                    [(ngModel)]="formData.meeting_link"
                    name="meeting_link"
                    required
                    placeholder="https://meet.google.com/..."
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Session Status *</label>
                  <select
                    [(ngModel)]="formData.status"
                    name="status"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none bg-white transition">
                    <option value="upcoming">Upcoming</option>
                    <option value="live">Live Now (Red Badge)</option>
                    <option value="completed">Completed (Archived)</option>
                  </select>
                </div>
              </div>

              <!-- Recording options -->
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div class="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="has_rec"
                    [(ngModel)]="formData.has_recording"
                    name="has_recording"
                    class="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700" />
                  <label for="has_rec" class="text-xs font-semibold text-slate-700 cursor-pointer">
                    Enable Recording for Replay
                  </label>
                </div>
                @if (formData.has_recording) {
                  <div class="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Recording Video URL</label>
                      <input
                        type="url"
                        [(ngModel)]="formData.recording_url"
                        name="recording_url"
                        placeholder="https://...mp4 or YouTube embed"
                        class="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none" />
                    </div>
                    <div>
                      <label class="block text-[11px] font-semibold text-slate-600 mb-1">Recording Duration</label>
                      <input
                        type="text"
                        [(ngModel)]="formData.recording_duration"
                        name="recording_duration"
                        placeholder="1h 15m"
                        class="w-full h-8 px-2.5 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none" />
                    </div>
                  </div>
                }
              </div>

              <!-- Actions -->
              <div class="pt-4 border-t border-slate-100 flex items-center justify-between">
                <button
                  type="button"
                  (click)="closeModal()"
                  class="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>

                <button
                  type="submit"
                  [disabled]="isSaving() || !formData.title || !formData.teacher_name"
                  class="h-9 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50">
                  @if (isSaving()) {
                    <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  }
                  <span>{{ editingClassId ? 'Update Live Session' : 'Schedule Session' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Dialog -->
      @if (classToDelete(); as toDelete) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 animate-slide-in">
            <div class="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <app-icon name="trash" [size]="20" color="#dc2626"></app-icon>
            </div>
            <div class="text-center space-y-1">
              <h3 class="text-sm font-bold text-slate-900">Delete Live Session?</h3>
              <p class="text-xs text-slate-500">
                Are you sure you want to delete <span class="font-semibold text-slate-700">"{{ toDelete.title }}"</span>? This removes it from the student schedule immediately.
              </p>
            </div>
            <div class="flex items-center gap-3 pt-2">
              <button
                type="button"
                (click)="classToDelete.set(null)"
                class="flex-1 h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                Cancel
              </button>
              <button
                type="button"
                (click)="executeDelete()"
                class="flex-1 h-9 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-semibold transition">
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class LiveClassListComponent implements OnInit {
  liveClassService = inject(LiveClassService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  searchQuery = '';
  selectedStatusFilter = signal<'all' | 'live' | 'upcoming' | 'completed'>('all');

  showFormModal = signal(false);
  isSaving = signal(false);
  editingClassId: string | null = null;
  classToDelete = signal<LiveClass | null>(null);

  formData: Partial<LiveClass> = {
    title: '',
    subject: 'Mathematics',
    standard: 10,
    teacher_name: 'Prof. Rahul Deshmukh',
    teacher_title: 'Senior Mathematics Educator',
    teacher_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'upcoming',
    scheduled_date: 'Today, 06:00 PM',
    scheduled_time: '06:00 PM - 07:15 PM',
    duration: '75 mins',
    meeting_link: 'https://meet.google.com',
    has_recording: false,
    recording_url: '',
    recording_duration: '',
    is_published: true
  };

  ngOnInit() {
    this.liveClassService.fetchClasses();
    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openAddModal();
      }
    });
  }

  filteredClasses = computed(() => {
    let list = this.liveClassService.classes();
    const q = this.searchQuery.toLowerCase().trim();

    if (q) {
      list = list.filter(c =>
        c.title?.toLowerCase().includes(q) ||
        c.teacher_name?.toLowerCase().includes(q) ||
        c.subject?.toLowerCase().includes(q)
      );
    }

    const st = this.selectedStatusFilter();
    if (st !== 'all') {
      list = list.filter(c => c.status === st);
    }

    return list;
  });

  openAddModal() {
    this.editingClassId = null;
    this.formData = {
      title: '',
      subject: 'Mathematics',
      standard: 10,
      teacher_name: 'Prof. Rahul Deshmukh',
      teacher_title: 'Senior Mathematics Educator',
      teacher_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      status: 'upcoming',
      scheduled_date: 'Today, 06:00 PM',
      scheduled_time: '06:00 PM - 07:15 PM',
      duration: '75 mins',
      meeting_link: 'https://meet.google.com',
      has_recording: false,
      recording_url: '',
      recording_duration: '',
      is_published: true
    };
    this.showFormModal.set(true);
  }

  openEditModal(c: LiveClass) {
    this.editingClassId = c.id;
    this.formData = { ...c };
    this.showFormModal.set(true);
  }

  closeModal() {
    this.showFormModal.set(false);
    this.editingClassId = null;
  }

  async quickSetStatus(c: LiveClass, nextStatus: LiveClassStatus) {
    await this.liveClassService.setClassStatus(c.id, nextStatus);
  }

  async saveClass() {
    if (!this.formData.title || !this.formData.teacher_name) {
      this.toast.error('Title and Teacher name are required.');
      return;
    }

    this.isSaving.set(true);

    if (this.editingClassId) {
      const res = await this.liveClassService.updateClass(this.editingClassId, this.formData);
      if (res.success) this.closeModal();
    } else {
      const res = await this.liveClassService.createClass(this.formData);
      if (res.success) this.closeModal();
    }

    this.isSaving.set(false);
  }

  async executeDelete() {
    const item = this.classToDelete();
    if (!item) return;

    await this.liveClassService.deleteClass(item.id);
    this.classToDelete.set(null);
  }
}

