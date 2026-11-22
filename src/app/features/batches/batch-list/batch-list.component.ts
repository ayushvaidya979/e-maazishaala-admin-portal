import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { BatchService } from '../../../core/services/batch.service';
import { Batch, BatchStatus } from '../../../core/models/batch.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-batch-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
      @if (batchService.error(); as error) { <p role="alert" class="p-3 text-sm text-red-700 bg-red-50">Unable to refresh content: {{ error }}. Please check your connection.</p> }
    <div class="space-y-6">
      <!-- Top Action & Search Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Academic Batch Operations</h2>
          <p class="text-xs text-slate-500 mt-0.5">Manage live academic batches, seat capacity, enrollment windows & schedules.</p>
        </div>

        <button
          type="button"
          (click)="openAddModal()"
          class="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 shrink-0">
          <app-icon name="plus" [size]="14"></app-icon>
          <span>Create New Batch</span>
        </button>
      </div>

      <!-- Search, Filter & Actions Bar -->
      <div class="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <!-- Search Input -->
        <div class="relative flex-1 max-w-md">
          <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <app-icon name="search" [size]="14"></app-icon>
          </div>
          <input
            type="text"
            [(ngModel)]="searchQuery"
            placeholder="Search batches by name or course..."
            class="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition" />
        </div>

        <!-- Filter Statuses -->
        <div class="flex flex-wrap items-center gap-2">
          <div class="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600 overflow-x-auto max-w-full">
            <button
              (click)="selectedStatusFilter.set('all')"
              class="px-2.5 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'">
              All ({{ batchService.batches().length }})
            </button>
            <button
              (click)="selectedStatusFilter.set('Upcoming')"
              class="px-2.5 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'Upcoming' ? 'bg-white text-blue-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Upcoming
            </button>
            <button
              (click)="selectedStatusFilter.set('Registration Open')"
              class="px-2.5 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'Registration Open' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Reg. Open
            </button>
            <button
              (click)="selectedStatusFilter.set('Full')"
              class="px-2.5 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'Full' ? 'bg-white text-red-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Full
            </button>
            <button
              (click)="selectedStatusFilter.set('Ongoing')"
              class="px-2.5 py-1 rounded-lg transition"
              [ngClass]="selectedStatusFilter() === 'Ongoing' ? 'bg-white text-amber-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Ongoing
            </button>
          </div>

          <!-- Refresh -->
          <button
            type="button"
            (click)="batchService.fetchBatches()"
            class="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <app-icon name="refresh" [size]="13" [customClass]="batchService.isLoading() ? 'animate-spin' : ''"></app-icon>
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Batches Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        @if (batchService.isLoading() && batchService.batches().length === 0) {
          <div class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-slate-500 font-medium">Fetching academic batches from Supabase...</p>
          </div>
        } @else if (filteredBatches().length === 0) {
          <div class="py-16 text-center space-y-3 max-w-sm mx-auto px-4">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <app-icon name="layers" [size]="22"></app-icon>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No batches found</h3>
            <p class="text-xs text-slate-500">
              {{ searchQuery ? 'Try adjusting your search query or status filter.' : 'Click "Create New Batch" to schedule your first academic course batch.' }}
            </p>
            @if (!searchQuery) {
              <button
                type="button"
                (click)="openAddModal()"
                class="mt-2 h-9 px-4 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition">
                Create First Batch
              </button>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4 min-w-[220px]">Batch & Course</th>
                  <th class="py-3 px-4">Schedule Dates</th>
                  <th class="py-3 px-4">Registration Window</th>
                  <th class="py-3 px-4">Fee (INR)</th>
                  <th class="py-3 px-4 min-w-[140px]">Seat Capacity</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4 text-center">Popular Course</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (batch of filteredBatches(); track batch.id) {
                  <tr class="hover:bg-slate-50/60 transition group">
                    <!-- Batch & Course Name -->
                    <td class="py-3 px-4">
                      <div class="font-bold text-slate-900 group-hover:text-emerald-800 transition">{{ batch.name }}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">{{ batch.course_name }}</div>
                    </td>

                    <!-- Schedule Dates -->
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-600">
                      <div>{{ batch.start_date }}</div>
                      <div class="text-[10px] text-slate-400">to {{ batch.end_date }}</div>
                    </td>

                    <!-- Registration Window -->
                    <td class="py-3 px-4 text-[11px] text-slate-600">
                      <div>{{ batch.registration_start }}</div>
                      <div class="text-[10px] text-slate-400">Closes {{ batch.registration_end }}</div>
                    </td>

                    <!-- Fee -->
                    <td class="py-3 px-4 font-semibold text-slate-900">
                      ₹{{ batch.price }}
                    </td>

                    <!-- Seat Capacity & Progress Bar -->
                    <td class="py-3 px-4">
                      <div class="flex items-center justify-between text-[11px] font-semibold text-slate-700 mb-1">
                        <span>{{ batch.available_seats }} left</span>
                        <span class="text-slate-400 font-normal">/ {{ batch.total_seats }}</span>
                      </div>
                      <div class="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                        <div
                          class="h-full rounded-full transition-all duration-300"
                          [style.width.%]="getSeatPercentage(batch)"
                          [ngClass]="{
                            'bg-emerald-600': batch.available_seats > 10,
                            'bg-amber-500': batch.available_seats <= 10 && batch.available_seats > 0,
                            'bg-red-500': batch.available_seats === 0
                          }"></div>
                      </div>
                    </td>

                    <!-- Status Pill with quick status change -->
                    <td class="py-3 px-4">
                      <span
                        class="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold"
                        [ngClass]="{
                          'bg-blue-50 text-blue-700': batch.status === 'Upcoming',
                          'bg-emerald-50 text-emerald-700': batch.status === 'Registration Open',
                          'bg-red-50 text-red-700': batch.status === 'Full',
                          'bg-amber-50 text-amber-700': batch.status === 'Ongoing',
                          'bg-slate-100 text-slate-600': batch.status === 'Completed' || batch.status === 'Cancelled'
                        }">
                        {{ batch.status }}
                      </span>
                    </td>

                    <!-- Featured / Popular Course -->
                    <td class="py-3 px-4 text-center">
                      <button
                        type="button"
                        (click)="toggleFeatured(batch)"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition"
                        [ngClass]="batch.is_featured ? 'bg-amber-50 text-amber-800 border border-amber-200' : 'bg-slate-50 text-slate-400 border border-slate-200 hover:text-slate-600'"
                        [title]="batch.is_featured ? 'Marked as Popular Course on student portal' : 'Click to feature as Popular Course on student portal'">
                        <app-icon
                          name="star"
                          [size]="13"
                          [color]="batch.is_featured ? '#d97706' : '#94a3b8'">
                        </app-icon>
                        <span class="text-[11px]">{{ batch.is_featured ? 'Popular' : 'Standard' }}</span>
                      </button>
                    </td>

                    <!-- Actions -->
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <!-- Quick status toggle: Open/Close registration -->
                        @if (batch.status === 'Upcoming' || batch.status === 'Full') {
                          <button
                            type="button"
                            (click)="quickStatusChange(batch, 'Registration Open')"
                            title="Open Registration"
                            class="p-1.5 rounded-lg text-emerald-700 hover:bg-emerald-50 transition">
                            <app-icon name="check" [size]="14"></app-icon>
                          </button>
                        } @else if (batch.status === 'Registration Open') {
                          <button
                            type="button"
                            (click)="quickStatusChange(batch, 'Full')"
                            title="Close Registration (Mark Full)"
                            class="p-1.5 rounded-lg text-amber-700 hover:bg-amber-50 transition">
                            <app-icon name="x" [size]="14"></app-icon>
                          </button>
                        }

                        <button
                          type="button"
                          (click)="openEditModal(batch)"
                          title="Edit Batch"
                          class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition">
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="confirmDelete(batch)"
                          title="Delete Batch"
                          class="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition">
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

      <!-- Create / Edit Batch Modal -->
      @if (showFormModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-slide-in">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  {{ editingBatchId ? 'Edit Academic Batch' : 'Create New Academic Batch' }}
                </h3>
                <p class="text-[11px] text-slate-500">Configure schedule, program curriculum, fee and student capacity.</p>
              </div>
              <button
                type="button"
                (click)="closeModal()"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Form Body -->
            <form (ngSubmit)="saveBatch()" class="p-6 space-y-4">
              <!-- Batch & Course Name -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Batch Title *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.name"
                    name="name"
                    required
                    placeholder="e.g. Std 10 Board Toppers Batch 2026-27"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Course / Program *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.course_name"
                    name="course_name"
                    required
                    placeholder="e.g. Mathematics Comprehensive Mastery"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
                </div>
              </div>

              <!-- Standard & Subject -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Standard / Class *</label>
                  <select
                    [(ngModel)]="formData.standard"
                    name="standard"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none bg-white transition">
                    <option [ngValue]="1">Standard 1 (इयत्ता १ ली)</option>
                    <option [ngValue]="2">Standard 2 (इयत्ता २ री)</option>
                    <option [ngValue]="3">Standard 3 (इयत्ता ३ री)</option>
                    <option [ngValue]="4">Standard 4 (इयत्ता ४ थी)</option>
                    <option [ngValue]="5">Standard 5 (इयत्ता ५ वी)</option>
                    <option [ngValue]="6">Standard 6 (इयत्ता ६ वी)</option>
                    <option [ngValue]="7">Standard 7 (इयत्ता ७ वी)</option>
                    <option [ngValue]="8">Standard 8 (इयत्ता ८ वी)</option>
                    <option [ngValue]="9">Standard 9 (इयत्ता ९ वी)</option>
                    <option [ngValue]="10">Standard 10 (इयत्ता १० वी)</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Subject</label>
                  <select
                    [(ngModel)]="formData.subject"
                    name="subject"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none bg-white transition">
                    <option value="Mathematics">Mathematics (गणित)</option>
                    <option value="Science">Science (विज्ञान)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="English">English (इंग्रजी)</option>
                    <option value="Social Science">Social Science (इतिहास व भूगोल)</option>
                    <option value="General">General / All Subjects</option>
                  </select>
                </div>
              </div>

              <!-- Schedule Dates -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Batch Start Date *</label>
                  <input
                    type="date"
                    [(ngModel)]="formData.start_date"
                    name="start_date"
                    required
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Batch End Date *</label>
                  <input
                    type="date"
                    [(ngModel)]="formData.end_date"
                    name="end_date"
                    required
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700" />
                </div>
              </div>

              <!-- Registration Window -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Registration Opens</label>
                  <input
                    type="date"
                    [(ngModel)]="formData.registration_start"
                    name="registration_start"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Registration Closes</label>
                  <input
                    type="date"
                    [(ngModel)]="formData.registration_end"
                    name="registration_end"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
              </div>

              <!-- Price & Seats -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Batch Price (INR) *</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.price"
                    name="price"
                    required
                    min="0"
                    placeholder="999"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Total Seats *</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.total_seats"
                    name="total_seats"
                    required
                    min="1"
                    (ngModelChange)="onTotalSeatsChange($event)"
                    placeholder="100"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Available Seats *</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.available_seats"
                    name="available_seats"
                    required
                    min="0"
                    placeholder="100"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
              </div>

              <!-- Status & Toggles -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Batch Status</label>
                  <select
                    [(ngModel)]="formData.status"
                    name="status"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none bg-white">
                    <option value="Upcoming">Upcoming</option>
                    <option value="Registration Open">Registration Open</option>
                    <option value="Full">Full</option>
                    <option value="Ongoing">Ongoing</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <div class="flex items-center gap-4 pt-4">
                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="batch_published"
                      [(ngModel)]="formData.is_published"
                      name="is_published"
                      class="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700" />
                    <label for="batch_published" class="text-xs font-semibold text-slate-700 cursor-pointer">
                      Published
                    </label>
                  </div>

                  <div class="flex items-center gap-2">
                    <input
                      type="checkbox"
                      id="batch_featured"
                      [(ngModel)]="formData.is_featured"
                      name="is_featured"
                      class="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700" />
                    <label for="batch_featured" class="text-xs font-semibold text-slate-700 cursor-pointer">
                      Feature as Popular Course on Student Portal
                    </label>
                  </div>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Batch Description</label>
                <textarea
                  [(ngModel)]="formData.description"
                  name="description"
                  rows="3"
                  placeholder="Details regarding faculty, lecture schedule, weekly test series, and revision materials..."
                  class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition"></textarea>
              </div>

              <!-- Cover Image Upload -->
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label class="block text-xs font-semibold text-slate-700">Batch Cover Image</label>
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  @if (formData.cover_image_url) {
                    <img
                      [src]="formData.cover_image_url"
                      alt="Batch cover preview"
                      class="w-14 h-14 object-cover rounded-md border border-slate-300 shadow-2xs shrink-0 bg-white" />
                  } @else {
                    <div class="w-14 h-14 rounded-md border border-slate-200 bg-slate-100 flex items-center justify-center shrink-0">
                      <app-icon name="image" [size]="20" color="#94a3b8"></app-icon>
                    </div>
                  }
                  <div class="flex-1 w-full space-y-1.5">
                    <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 shadow-2xs transition">
                      <app-icon name="upload" [size]="14"></app-icon>
                      <span>{{ isBatchUploading() ? 'Uploading...' : 'Upload & Crop Cover Image' }}</span>
                      <input
                        type="file"
                        accept="image/*"
                        (change)="onBatchFileSelected($event)"
                        class="hidden" />
                    </label>
                    <div class="text-[10px] text-slate-400">Or paste an existing image URL below:</div>
                    <input
                      type="url"
                      [(ngModel)]="formData.cover_image_url"
                      name="cover_image_url"
                      placeholder="https://..."
                      class="w-full h-8 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700" />
                  </div>
                </div>
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
                  [disabled]="isSaving() || !formData.name || !formData.course_name"
                  class="h-9 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50">
                  @if (isSaving()) {
                    <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  }
                  <span>{{ editingBatchId ? 'Update Batch' : 'Create Batch' }}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Batch Image Crop Modal -->
      @if (showBatchCropModal()) {
        <div class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slide-in">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Crop Batch Cover Image</h3>
                <p class="text-[11px] text-slate-500">Drag to reposition · Scroll to zoom</p>
              </div>
              <button type="button" (click)="cancelBatchCrop()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="relative bg-slate-900 flex items-center justify-center overflow-hidden select-none" style="height:300px"
              (mousedown)="batchCropDragStart($event)"
              (mousemove)="batchCropDragMove($event)"
              (mouseup)="batchCropDragEnd()"
              (mouseleave)="batchCropDragEnd()"
              (wheel)="batchCropWheel($event)">
              <canvas id="batchCropCanvas"
                [style.left.px]="batchCropOffsetX"
                [style.top.px]="batchCropOffsetY"
                [style.width.px]="batchCropCanvasDisplayW * batchCropScale"
                [style.height.px]="batchCropCanvasDisplayH * batchCropScale"
                [style.cursor]="batchCropDragging ? 'grabbing' : 'grab'"
                style="position:absolute; transform-origin: top left;">
              </canvas>
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="border-2 border-white/90 rounded-md" style="width:200px;height:150px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55)"></div>
              </div>
            </div>

            <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-slate-500">
                <button type="button" (click)="batchCropZoom(-0.1)" class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-base leading-none flex items-center justify-center">−</button>
                <span class="text-xs font-mono">{{ (batchCropScale * 100).toFixed(0) }}%</span>
                <button type="button" (click)="batchCropZoom(0.1)" class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-base leading-none flex items-center justify-center">+</button>
                <button type="button" (click)="batchCropReset()" class="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-600">Reset</button>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" (click)="cancelBatchCrop()" class="h-8 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button type="button" (click)="applyBatchCrop()" class="h-8 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-1.5">
                  <app-icon name="check" [size]="13"></app-icon>
                  Apply & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal Dialog -->
      @if (batchToDelete()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 animate-slide-in">
            <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <app-icon name="trash" [size]="22" color="#dc2626"></app-icon>
            </div>

            <div class="text-center">
              <h3 class="text-sm font-bold text-slate-900">Delete Batch?</h3>
              <p class="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span class="font-semibold text-slate-800">"{{ batchToDelete()?.name }}"</span>?
              </p>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button
                type="button"
                (click)="batchToDelete.set(null)"
                class="flex-1 h-9 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
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
export class BatchListComponent implements OnInit {
  batchService = inject(BatchService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  searchQuery = '';
  selectedStatusFilter = signal<string>('all');

  showFormModal = signal(false);
  isSaving = signal(false);
  editingBatchId: string | null = null;
  batchToDelete = signal<Batch | null>(null);

  formData: Partial<Batch> = {
    name: '',
    course_name: '',
    description: '',
    cover_image_url: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
    registration_start: new Date().toISOString().split('T')[0],
    registration_end: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    price: 999,
    total_seats: 100,
    available_seats: 100,
    status: 'Upcoming',
    is_published: true,
    is_featured: false
  };

  ngOnInit() {
    this.batchService.fetchBatches();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openAddModal();
      }
    });
  }

  filteredBatches = computed(() => {
    let list = this.batchService.batches();
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(b =>
        b.name?.toLowerCase().includes(query) ||
        b.course_name?.toLowerCase().includes(query)
      );
    }

    const status = this.selectedStatusFilter();
    if (status !== 'all') {
      list = list.filter(b => b.status === status);
    }

    return list;
  });

  getSeatPercentage(batch: Batch): number {
    if (!batch.total_seats || batch.total_seats <= 0) return 0;
    const filled = batch.total_seats - (batch.available_seats || 0);
    return Math.min(100, Math.max(0, Math.round((filled / batch.total_seats) * 100)));
  }

  onTotalSeatsChange(total: number) {
    if (!this.editingBatchId) {
      this.formData.available_seats = total;
    }
  }

  openAddModal() {
    this.editingBatchId = null;
    this.formData = {
      name: '',
      course_name: '',
      standard: 10,
      subject: 'Mathematics',
      description: '',
      cover_image_url: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      registration_start: new Date().toISOString().split('T')[0],
      registration_end: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      price: 999,
      total_seats: 100,
      available_seats: 100,
      status: 'Upcoming',
      is_published: true,
      is_featured: false
    };
    this.showFormModal.set(true);
  }

  openEditModal(batch: Batch) {
    this.editingBatchId = batch.id;
    this.formData = {
      ...batch,
      standard: batch.standard || 10,
      subject: batch.subject || batch.course_name || 'General'
    };
    this.showFormModal.set(true);
  }

  closeModal() {
    this.showFormModal.set(false);
    this.editingBatchId = null;
  }

  async saveBatch() {
    if (!this.formData.name || !this.formData.course_name) {
      this.toast.error('Batch title and course name are required.');
      return;
    }

    this.isSaving.set(true);

    if (this.editingBatchId) {
      const res = await this.batchService.updateBatch(this.editingBatchId, this.formData);
      if (res.success) this.closeModal();
    } else {
      const res = await this.batchService.createBatch(this.formData);
      if (res.success) this.closeModal();
    }

    this.isSaving.set(false);
  }

  async quickStatusChange(batch: Batch, newStatus: BatchStatus) {
    await this.batchService.updateStatus(batch.id, newStatus);
  }

  async toggleFeatured(batch: Batch) {
    await this.batchService.updateBatch(batch.id, { is_featured: !batch.is_featured });
  }

  confirmDelete(batch: Batch) {
    this.batchToDelete.set(batch);
  }

  async executeDelete() {
    const batch = this.batchToDelete();
    if (!batch) return;

    await this.batchService.deleteBatch(batch.id);
    this.batchToDelete.set(null);
  }

  // ─── Batch Image Upload & Crop Logic ──────────────────────────────────────
  isBatchUploading = signal(false);
  showBatchCropModal = signal(false);
  batchCropScale = 1;
  batchCropOffsetX = 0;
  batchCropOffsetY = 0;
  batchCropCanvasDisplayW = 0;
  batchCropCanvasDisplayH = 0;
  batchCropDragging = false;
  private batchCropDragStartX = 0;
  private batchCropDragStartY = 0;
  private batchCropDragStartOffX = 0;
  private batchCropDragStartOffY = 0;
  private batchCropOriginalFile: File | null = null;
  private batchCropImage: HTMLImageElement | null = null;
  private readonly BATCH_CROP_W = 200;
  private readonly BATCH_CROP_H = 150;
  private readonly BATCH_PREVIEW_W = 480;
  private readonly BATCH_PREVIEW_H = 300;

  async onBatchFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;
    this.batchCropOriginalFile = file;
    (event.target as HTMLInputElement).value = '';

    const img = new Image();
    img.onload = () => {
      this.batchCropImage = img;
      this.batchCropScale = 1;
      this.batchCropCanvasDisplayW = img.naturalWidth;
      this.batchCropCanvasDisplayH = img.naturalHeight;
      this.batchCropOffsetX = (this.BATCH_PREVIEW_W - img.naturalWidth) / 2;
      this.batchCropOffsetY = (this.BATCH_PREVIEW_H - img.naturalHeight) / 2;
      this.showBatchCropModal.set(true);
      setTimeout(() => this.drawBatchCropCanvas(), 50);
    };
    img.src = URL.createObjectURL(file);
  }

  private drawBatchCropCanvas() {
    const canvas = document.getElementById('batchCropCanvas') as HTMLCanvasElement | null;
    if (!canvas || !this.batchCropImage) return;
    canvas.width = this.batchCropImage.naturalWidth;
    canvas.height = this.batchCropImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.batchCropImage, 0, 0);
  }

  batchCropDragStart(e: MouseEvent) {
    this.batchCropDragging = true;
    this.batchCropDragStartX = e.clientX;
    this.batchCropDragStartY = e.clientY;
    this.batchCropDragStartOffX = this.batchCropOffsetX;
    this.batchCropDragStartOffY = this.batchCropOffsetY;
  }

  batchCropDragMove(e: MouseEvent) {
    if (!this.batchCropDragging) return;
    this.batchCropOffsetX = this.batchCropDragStartOffX + (e.clientX - this.batchCropDragStartX);
    this.batchCropOffsetY = this.batchCropDragStartOffY + (e.clientY - this.batchCropDragStartY);
  }

  batchCropDragEnd() { this.batchCropDragging = false; }

  batchCropWheel(e: WheelEvent) {
    e.preventDefault();
    this.batchCropZoom(e.deltaY < 0 ? 0.08 : -0.08);
  }

  batchCropZoom(delta: number) {
    this.batchCropScale = Math.min(5, Math.max(0.2, this.batchCropScale + delta));
  }

  batchCropReset() {
    this.batchCropScale = 1;
    if (this.batchCropImage) {
      this.batchCropOffsetX = (this.BATCH_PREVIEW_W - this.batchCropImage.naturalWidth) / 2;
      this.batchCropOffsetY = (this.BATCH_PREVIEW_H - this.batchCropImage.naturalHeight) / 2;
    }
  }

  cancelBatchCrop() {
    this.showBatchCropModal.set(false);
    this.batchCropImage = null;
    this.batchCropOriginalFile = null;
  }

  async applyBatchCrop() {
    if (!this.batchCropImage) return;

    const containerCentreX = this.BATCH_PREVIEW_W / 2;
    const containerCentreY = this.BATCH_PREVIEW_H / 2;

    const frameLeft = containerCentreX - this.BATCH_CROP_W / 2;
    const frameTop = containerCentreY - this.BATCH_CROP_H / 2;

    const sx = (frameLeft - this.batchCropOffsetX) / this.batchCropScale;
    const sy = (frameTop - this.batchCropOffsetY) / this.batchCropScale;
    const sw = this.BATCH_CROP_W / this.batchCropScale;
    const sh = this.BATCH_CROP_H / this.batchCropScale;

    const out = document.createElement('canvas');
    out.width = 800;
    out.height = Math.round(800 * (this.BATCH_CROP_H / this.BATCH_CROP_W));
    const ctx = out.getContext('2d')!;
    ctx.drawImage(this.batchCropImage, sx, sy, sw, sh, 0, 0, out.width, out.height);

    out.toBlob(async (blob) => {
      if (!blob) { this.toast.error('Crop failed'); return; }
      const croppedFile = new File([blob], this.batchCropOriginalFile?.name || 'batch-cover.jpg', { type: 'image/jpeg' });
      this.showBatchCropModal.set(false);
      this.isBatchUploading.set(true);
      const { url, error } = await this.batchService.uploadCoverImage(croppedFile);
      this.isBatchUploading.set(false);
      if (url) {
        this.formData.cover_image_url = url;
        this.toast.success('Batch cover cropped & uploaded!');
      } else if (error) {
        this.toast.warning(error);
      }
    }, 'image/jpeg', 0.92);
  }
}

