import { Component, OnInit, inject, signal, computed, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { BookService } from '../../../core/services/book.service';
import { Book, BookFilterStatus } from '../../../core/models/book.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-book-list',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Top Action & Search Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">Book Catalog Management</h2>
          <p class="text-xs text-slate-500 mt-0.5">Manage textbooks, workbooks, publications and live availability.</p>
        </div>

        <div class="flex items-center gap-2 shrink-0">
          <button
            type="button"
            (click)="showSqlModal.set(true)"
            class="h-9 px-3.5 rounded-xl border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition flex items-center gap-1.5 shrink-0">
            <app-icon name="database" [size]="14"></app-icon>
            <span>Supabase Sync Guide</span>
          </button>

          <button
            type="button"
            (click)="openAddModal()"
            class="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:bg-emerald-900 text-white text-xs font-semibold shadow-2xs transition flex items-center justify-center gap-2 shrink-0">
            <app-icon name="plus" [size]="14"></app-icon>
            <span>Add New Book</span>
          </button>
        </div>
      </div>

      <!-- Supabase Sync Notice if permission issue occurred -->
      @if (bookService.hasSyncPermissionIssue()) {
        <div class="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs animate-slide-in">
          <div class="flex items-start gap-2.5">
            <div class="w-6 h-6 rounded-lg bg-amber-200 text-amber-900 flex items-center justify-center shrink-0 font-bold mt-0.5">!</div>
            <div>
              <span class="font-bold text-amber-900 block">Supabase Permission Notice</span>
              <span class="text-amber-800 text-[11px]">Your books are safely preserved in this Admin Portal. To broadcast them live to Supabase and your Vercel deployed student portal, execute the 1-click SQL in your Supabase SQL Editor.</span>
            </div>
          </div>
          <button
            type="button"
            (click)="showSqlModal.set(true)"
            class="px-3.5 py-1.5 rounded-xl bg-amber-800 hover:bg-amber-900 text-white font-semibold text-[11px] shrink-0 transition flex items-center gap-1.5 self-start sm:self-center">
            <app-icon name="file-text" [size]="13"></app-icon>
            <span>View SQL Fix</span>
          </button>
        </div>
      }

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
            placeholder="Search books by title, author, or ISBN..."
            class="w-full h-9 pl-9 pr-4 rounded-xl border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 transition" />
        </div>

        <!-- Filter Buttons & Controls -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Status Filter -->
          <div class="inline-flex p-1 rounded-xl bg-slate-100 text-xs font-semibold text-slate-600">
            <button
              (click)="statusFilter.set('all')"
              class="px-3 py-1 rounded-lg transition"
              [ngClass]="statusFilter() === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'hover:text-slate-900'">
              All ({{ bookService.books().length }})
            </button>
            <button
              (click)="statusFilter.set('published')"
              class="px-3 py-1 rounded-lg transition"
              [ngClass]="statusFilter() === 'published' ? 'bg-white text-emerald-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Published
            </button>
            <button
              (click)="statusFilter.set('draft')"
              class="px-3 py-1 rounded-lg transition"
              [ngClass]="statusFilter() === 'draft' ? 'bg-white text-slate-800 shadow-2xs font-bold' : 'hover:text-slate-900'">
              Draft
            </button>
          </div>

          <!-- Refresh -->
          <button
            type="button"
            (click)="bookService.fetchBooks()"
            class="h-9 px-3 rounded-xl border border-slate-200 text-xs text-slate-600 hover:bg-slate-50 transition flex items-center gap-1.5">
            <app-icon name="refresh" [size]="13" [customClass]="bookService.isLoading() ? 'animate-spin' : ''"></app-icon>
            <span class="hidden sm:inline">Refresh</span>
          </button>
        </div>
      </div>

      <!-- Books Data Table -->
      <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        @if (bookService.isLoading() && bookService.books().length === 0) {
          <div class="py-16 text-center space-y-3">
            <div class="w-8 h-8 border-3 border-emerald-700/20 border-t-emerald-700 rounded-full animate-spin mx-auto"></div>
            <p class="text-xs text-slate-500 font-medium">Fetching books from Supabase...</p>
          </div>
        } @else if (paginatedBooks().length === 0) {
          <div class="py-16 text-center space-y-3 max-w-sm mx-auto px-4">
            <div class="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <app-icon name="book" [size]="22"></app-icon>
            </div>
            <h3 class="text-sm font-bold text-slate-800">No books found</h3>
            <p class="text-xs text-slate-500">
              {{ searchQuery ? 'Try adjusting your search query or filter.' : 'Start building your library by clicking "Add New Book".' }}
            </p>
            @if (!searchQuery) {
              <button
                type="button"
                (click)="openAddModal()"
                class="mt-2 h-9 px-4 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition">
                Add First Book
              </button>
            }
          </div>
        } @else {
          <div class="overflow-x-auto">
            <table class="w-full text-left border-collapse text-xs">
              <thead>
                <tr class="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-semibold uppercase tracking-wider text-[10px]">
                  <th class="py-3 px-4 w-12">Cover</th>
                  <th class="py-3 px-4 min-w-[200px]">Book Details</th>
                  <th class="py-3 px-4">Category</th>
                  <th class="py-3 px-4">Price (INR)</th>
                  <th class="py-3 px-4">Status</th>
                  <th class="py-3 px-4">Featured</th>
                  <th class="py-3 px-4">Order</th>
                  <th class="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-slate-100">
                @for (book of paginatedBooks(); track book.id) {
                  <tr class="hover:bg-slate-50/60 transition group">
                    <!-- Cover -->
                    <td class="py-3 px-4">
                      <img
                        [src]="book.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=120&q=80'"
                        alt="Book cover"
                        class="w-10 h-14 object-cover rounded-md border border-slate-200 bg-slate-100 shadow-2xs" />
                    </td>

                    <!-- Title & Author -->
                    <td class="py-3 px-4">
                      <div class="font-bold text-slate-900 group-hover:text-emerald-800 transition">{{ book.title }}</div>
                      <div class="text-[11px] text-slate-500 mt-0.5">By {{ book.author }}</div>
                      @if (book.isbn) {
                        <div class="text-[10px] text-slate-400 font-mono mt-0.5">ISBN: {{ book.isbn }}</div>
                      }
                    </td>

                    <!-- Category -->
                    <td class="py-3 px-4">
                      <span class="inline-block px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 font-medium text-[11px]">
                        {{ book.category || 'General' }}
                      </span>
                    </td>

                    <!-- Price -->
                    <td class="py-3 px-4 font-semibold text-slate-900">
                      <div>₹{{ book.price }}</div>
                      @if (book.original_price && book.original_price > book.price) {
                        <div class="text-[10px] text-slate-400 line-through">₹{{ book.original_price }}</div>
                      }
                    </td>

                    <!-- Status toggle -->
                    <td class="py-3 px-4">
                      <button
                        type="button"
                        (click)="togglePublish(book)"
                        [title]="book.is_published ? 'Click to unpublish (draft)' : 'Click to publish'"
                        class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold transition"
                        [ngClass]="book.is_published ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'">
                        <span class="w-1.5 h-1.5 rounded-full" [ngClass]="book.is_published ? 'bg-emerald-600' : 'bg-slate-400'"></span>
                        <span>{{ book.is_published ? 'Published' : 'Draft' }}</span>
                      </button>
                    </td>

                    <!-- Featured -->
                    <td class="py-3 px-4">
                      <button
                        type="button"
                        (click)="toggleFeatured(book)"
                        class="p-1 rounded-lg transition"
                        [title]="book.is_featured ? 'Featured book on homepage' : 'Not featured'">
                        <app-icon
                          name="star"
                          [size]="16"
                          [color]="book.is_featured ? '#eab308' : '#cbd5e1'">
                        </app-icon>
                      </button>
                    </td>

                    <!-- Display Order -->
                    <td class="py-3 px-4 font-mono text-[11px] text-slate-500">
                      {{ book.display_order }}
                    </td>

                    <!-- Actions -->
                    <td class="py-3 px-4 text-right">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          (click)="openEditModal(book)"
                          title="Edit Book"
                          class="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition">
                          <app-icon name="edit" [size]="14"></app-icon>
                        </button>
                        <button
                          type="button"
                          (click)="confirmDelete(book)"
                          title="Delete Book"
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

          <!-- Pagination Footer -->
          @if (totalPages() > 1) {
            <div class="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div>
                Showing page {{ currentPage() }} of {{ totalPages() }} ({{ filteredBooks().length }} total books)
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

      <!-- Add / Edit Book Modal Dialog -->
      @if (showFormModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-2xl w-full my-8 overflow-hidden animate-slide-in">
            <!-- Modal Header -->
            <div class="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">
                  {{ editingBookId ? 'Edit Book Details' : 'Add New Book' }}
                </h3>
                <p class="text-[11px] text-slate-500">All changes synchronize with the e-MaziShaala student app.</p>
              </div>
              <button
                type="button"
                (click)="closeModal()"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <!-- Form Body -->
            <form (ngSubmit)="saveBook()" class="p-6 space-y-4">
              <!-- Title & Author -->
              <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Book Title *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.title"
                    name="title"
                    required
                    placeholder="e.g. गणित प्रकाश: Standard 10"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Author Name *</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.author"
                    name="author"
                    required
                    placeholder="e.g. Prof. Rahul Deshmukh"
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
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Subject / Category *</label>
                  <select
                    [(ngModel)]="formData.subject"
                    name="subject"
                    (ngModelChange)="formData.category = $event"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none bg-white transition">
                    <option value="Mathematics">Mathematics (गणित)</option>
                    <option value="Science">Science (विज्ञान)</option>
                    <option value="Marathi">Marathi (मराठी)</option>
                    <option value="English">English (इंग्रजी)</option>
                    <option value="Social Science">Social Science (इतिहास व भूगोल)</option>
                    <option value="General">General / Activity</option>
                  </select>
                </div>
              </div>

              <!-- Pricing & Display Order -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Price (INR) *</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.price"
                    name="price"
                    required
                    min="0"
                    placeholder="299"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Original / MRP Price (INR)</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.original_price"
                    name="original_price"
                    min="0"
                    placeholder="399"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.display_order"
                    name="display_order"
                    min="1"
                    placeholder="1"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
                </div>
              </div>
              <!-- Cover Image Upload & URL -->
              <div class="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <label class="block text-xs font-semibold text-slate-700">Book Cover Image</label>
                <div class="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                  @if (formData.cover_image_url) {
                    <img
                      [src]="formData.cover_image_url"
                      alt="Preview"
                      class="w-12 h-16 object-cover rounded-md border border-slate-300 shadow-2xs shrink-0 bg-white" />
                  }
                  <div class="flex-1 w-full space-y-1.5">
                    <!-- File upload button -->
                    <label class="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 cursor-pointer text-xs font-semibold text-slate-700 shadow-2xs transition">
                      <app-icon name="upload" [size]="14"></app-icon>
                      <span>{{ isUploading() ? 'Uploading...' : 'Upload & Crop Cover Image' }}</span>
                      <input
                        type="file"
                        accept="image/*"
                        (change)="onFileSelected($event)"
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

              <!-- Descriptions -->
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Short Description</label>
                <input
                  type="text"
                  [(ngModel)]="formData.description"
                  name="description"
                  placeholder="Concise summary for catalog cards"
                  class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Full Detailed Description</label>
                <textarea
                  [(ngModel)]="formData.full_description"
                  name="full_description"
                  rows="3"
                  placeholder="In-depth syllabus alignment, features, table of contents..."
                  class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition"></textarea>
              </div>

              <!-- ISBN, Order, and Toggles -->
              <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">ISBN Number</label>
                  <input
                    type="text"
                    [(ngModel)]="formData.isbn"
                    name="isbn"
                    placeholder="978-93-..."
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div>
                  <label class="block text-xs font-semibold text-slate-700 mb-1">Display Order</label>
                  <input
                    type="number"
                    [(ngModel)]="formData.display_order"
                    name="display_order"
                    min="1"
                    class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:outline-none transition" />
                </div>
                <div class="flex items-center gap-2 pt-4">
                  <input
                    type="checkbox"
                    id="is_featured"
                    [(ngModel)]="formData.is_featured"
                    name="is_featured"
                    class="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700" />
                  <label for="is_featured" class="text-xs font-semibold text-slate-700 cursor-pointer">
                    Feature on Homepage
                  </label>
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

                <div class="flex items-center gap-2">
                  <button
                    type="button"
                    (click)="saveBookWithStatus(false)"
                    [disabled]="isSaving()"
                    class="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition">
                    Save as Draft
                  </button>
                  <button
                    type="button"
                    (click)="saveBookWithStatus(true)"
                    [disabled]="isSaving() || !formData.title || !formData.author"
                    class="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5 disabled:opacity-50">
                    @if (isSaving()) {
                      <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    }
                    <span>{{ editingBookId ? 'Update & Publish' : 'Publish Book' }}</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      }

      <!-- Delete Confirmation Modal Dialog -->
      @if (bookToDelete()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-sm w-full p-6 space-y-4 animate-slide-in">
            <div class="w-12 h-12 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto">
              <app-icon name="trash" [size]="22" color="#dc2626"></app-icon>
            </div>

            <div class="text-center">
              <h3 class="text-sm font-bold text-slate-900">Delete Book?</h3>
              <p class="text-xs text-slate-500 mt-1">
                Are you sure you want to delete <span class="font-semibold text-slate-800">"{{ bookToDelete()?.title }}"</span>? This will permanently remove it from the catalog.
              </p>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <button
                type="button"
                (click)="bookToDelete.set(null)"
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

      <!-- Image Crop Modal -->
      @if (showCropModal()) {
        <div class="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-2xl max-w-lg w-full overflow-hidden animate-slide-in">
            <div class="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 class="text-sm font-bold text-slate-900">Crop Cover Image</h3>
                <p class="text-[11px] text-slate-500">Drag to reposition · Scroll to zoom</p>
              </div>
              <button type="button" (click)="cancelCrop()" class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <div class="relative bg-slate-900 flex items-center justify-center overflow-hidden select-none" style="height:320px"
              (mousedown)="cropDragStart($event)"
              (mousemove)="cropDragMove($event)"
              (mouseup)="cropDragEnd()"
              (mouseleave)="cropDragEnd()"
              (wheel)="cropWheel($event)">
              <canvas id="bookCropCanvas"
                [style.left.px]="cropOffsetX"
                [style.top.px]="cropOffsetY"
                [style.width.px]="cropCanvasDisplayW * cropScale"
                [style.height.px]="cropCanvasDisplayH * cropScale"
                [style.cursor]="cropDragging ? 'grabbing' : 'grab'"
                style="position:absolute; transform-origin: top left;">
              </canvas>
              <div class="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div class="border-2 border-white/90 rounded-md" style="width:160px;height:220px;box-shadow:0 0 0 9999px rgba(0,0,0,0.55)"></div>
              </div>
            </div>

            <div class="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
              <div class="flex items-center gap-2 text-slate-500">
                <button type="button" (click)="cropZoom(-0.1)" class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-base leading-none flex items-center justify-center">−</button>
                <span class="text-xs font-mono">{{ (cropScale * 100).toFixed(0) }}%</span>
                <button type="button" (click)="cropZoom(0.1)" class="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 font-bold text-base leading-none flex items-center justify-center">+</button>
                <button type="button" (click)="cropReset()" class="h-7 px-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-xs text-slate-600">Reset</button>
              </div>
              <div class="flex items-center gap-2">
                <button type="button" (click)="cancelCrop()" class="h-8 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-100 transition">Cancel</button>
                <button type="button" (click)="applyCrop()" class="h-8 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition flex items-center gap-1.5">
                  <app-icon name="check" [size]="13"></app-icon>
                  Apply & Upload
                </button>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Supabase SQL Instructions Modal -->
      @if (showSqlModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <div class="flex items-center gap-2">
                <div class="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                  <app-icon name="database" [size]="16"></app-icon>
                </div>
                <div>
                  <h3 class="text-sm font-bold text-slate-900">Supabase Live Sync Setup</h3>
                  <p class="text-[11px] text-slate-500">Connect Admin Portal bidirectionally with student portal</p>
                </div>
              </div>
              <button
                type="button"
                (click)="showSqlModal.set(false)"
                class="w-7 h-7 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 flex items-center justify-center transition">
                <app-icon name="x" [size]="14"></app-icon>
              </button>
            </div>

            <div class="text-xs text-slate-600 space-y-2">
              <p>To enable real-time synchronization so that any books or batches added here immediately appear on the deployed student portal on Vercel, run the following SQL script once in your <strong>Supabase Dashboard &rarr; SQL Editor</strong>:</p>
            </div>

            <div class="relative">
              <pre class="bg-slate-900 text-slate-100 font-mono text-[11px] p-3.5 rounded-xl overflow-x-auto max-h-56 leading-relaxed selection:bg-emerald-700 selection:text-white">{{ syncSql }}</pre>
              <button
                type="button"
                (click)="copySqlToClipboard()"
                class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white text-[10px] font-semibold transition flex items-center gap-1 shadow-xs">
                <app-icon name="copy" [size]="11"></app-icon>
                <span>{{ hasCopiedSql() ? 'Copied!' : 'Copy SQL' }}</span>
              </button>
            </div>

            <div class="p-3 bg-emerald-50 rounded-xl border border-emerald-100 text-[11px] text-emerald-800 space-y-1">
              <span class="font-bold block">How to run in 30 seconds:</span>
              <ol class="list-decimal list-inside space-y-0.5 text-emerald-900">
                <li>Click <strong>Copy SQL</strong> above.</li>
                <li>Open your Supabase project: <a href="https://supabase.com/dashboard/project/ozwyifbaqmfuytgwzmjy/sql" target="_blank" class="underline font-semibold text-emerald-950">Supabase SQL Editor</a>.</li>
                <li>Paste the SQL and click <strong>Run</strong> (Ctrl+Enter / Cmd+Enter).</li>
              </ol>
            </div>

            <div class="pt-2 flex justify-end">
              <button
                type="button"
                (click)="showSqlModal.set(false)"
                class="h-9 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition">
                Done
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class BookListComponent implements OnInit {
  bookService = inject(BookService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  searchQuery = '';
  statusFilter = signal<BookFilterStatus>('all');
  currentPage = signal(1);
  pageSize = 10;

  showFormModal = signal(false);
  showSqlModal = signal(false);
  hasCopiedSql = signal(false);
  isUploading = signal(false);
  isSaving = signal(false);
  editingBookId: string | null = null;
  bookToDelete = signal<Book | null>(null);

  readonly syncSql = `-- 1. Grant Schema & Table Privileges
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.books TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.batches TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Ensure ID column accepts both UUID and text
DO $$ 
BEGIN
  ALTER TABLE public.books ALTER COLUMN id SET DATA TYPE text USING id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

DO $$ 
BEGIN
  ALTER TABLE public.batches ALTER COLUMN id SET DATA TYPE text USING id::text;
EXCEPTION WHEN OTHERS THEN NULL;
END $$;

-- 3. Open Access Policies
ALTER TABLE public.books ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public full access books" ON public.books;
CREATE POLICY "Public full access books" ON public.books 
  FOR ALL TO authenticated, anon, service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Public full access batches" ON public.batches;
CREATE POLICY "Public full access batches" ON public.batches 
  FOR ALL TO authenticated, anon, service_role USING (true) WITH CHECK (true);`;

  copySqlToClipboard() {
    try {
      navigator.clipboard.writeText(this.syncSql);
      this.hasCopiedSql.set(true);
      this.toast.success('SQL script copied to clipboard!');
      setTimeout(() => this.hasCopiedSql.set(false), 3000);
    } catch {
      this.toast.info('Please select and copy the SQL from the box.');
    }
  }

  formData: Partial<Book> = {
    title: '',
    author: '',
    price: 0,
    original_price: 0,
    category: 'General',
    description: '',
    full_description: '',
    isbn: '',
    cover_image_url: '',
    is_published: true,
    is_featured: false,
    display_order: 1
  };

  ngOnInit() {
    this.bookService.fetchBooks();

    this.route.queryParams.subscribe(params => {
      if (params['action'] === 'new') {
        this.openAddModal();
      }
    });
  }

  filteredBooks = computed(() => {
    let list = this.bookService.books();
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(b =>
        b.title?.toLowerCase().includes(query) ||
        b.author?.toLowerCase().includes(query) ||
        b.isbn?.toLowerCase().includes(query) ||
        b.category?.toLowerCase().includes(query)
      );
    }

    const filter = this.statusFilter();
    if (filter === 'published') {
      list = list.filter(b => b.is_published);
    } else if (filter === 'draft') {
      list = list.filter(b => !b.is_published);
    }

    return list;
  });

  totalPages = computed(() => Math.ceil(this.filteredBooks().length / this.pageSize) || 1);

  paginatedBooks = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize;
    return this.filteredBooks().slice(start, start + this.pageSize);
  });

  pageNumbers = computed(() => {
    return Array.from({ length: this.totalPages() }, (_, i) => i + 1);
  });

  openAddModal() {
    this.editingBookId = null;
    this.formData = {
      title: '',
      subtitle: '',
      author: '',
      standard: 10,
      subject: 'Mathematics',
      price: 299,
      original_price: 399,
      category: 'Mathematics',
      publication_status: 'published',
      description: '',
      full_description: '',
      isbn: '',
      cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
      is_published: true,
      is_active: true,
      is_featured: false,
      display_order: (this.bookService.books().length || 0) + 1
    };
    this.showFormModal.set(true);
  }

  openEditModal(book: Book) {
    this.editingBookId = book.id;
    this.formData = {
      ...book,
      standard: book.standard || 10,
      subject: book.subject || book.category || 'General',
      publication_status: book.publication_status || (book.is_published ? 'published' : 'coming_soon')
    };
    this.showFormModal.set(true);
  }

  closeModal() {
    this.showFormModal.set(false);
    this.editingBookId = null;
  }

  async saveBookWithStatus(isPublished: boolean) {
    this.formData.is_published = isPublished;
    await this.saveBook();
  }

  async saveBook() {
    if (!this.formData.title || !this.formData.author) {
      this.toast.error('Title and Author are required.');
      return;
    }

    this.isSaving.set(true);

    if (this.editingBookId) {
      const res = await this.bookService.updateBook(this.editingBookId, this.formData);
      if (res.success) {
        this.closeModal();
      } else {
        this.toast.error(res.error || 'Failed to update book');
      }
    } else {
      const res = await this.bookService.createBook(this.formData);
      if (res.success) {
        this.closeModal();
      } else {
        this.toast.error(res.error || 'Failed to create book');
      }
    }

    this.isSaving.set(false);
  }

  async togglePublish(book: Book) {
    await this.bookService.togglePublication(book.id, !book.is_published);
  }

  async toggleFeatured(book: Book) {
    await this.bookService.updateBook(book.id, { is_featured: !book.is_featured });
  }

  confirmDelete(book: Book) {
    this.bookToDelete.set(book);
  }

  async executeDelete() {
    const book = this.bookToDelete();
    if (!book) return;

    await this.bookService.deleteBook(book.id);
    this.bookToDelete.set(null);
  }

  // ─── Image Crop Logic ──────────────────────────────────────────────────────
  showCropModal = signal(false);
  cropScale = 1;
  cropOffsetX = 0;
  cropOffsetY = 0;
  cropCanvasDisplayW = 0;
  cropCanvasDisplayH = 0;
  cropDragging = false;
  private cropDragStartX = 0;
  private cropDragStartY = 0;
  private cropDragStartOffX = 0;
  private cropDragStartOffY = 0;
  private cropOriginalFile: File | null = null;
  private cropImage: HTMLImageElement | null = null;
  private readonly CROP_W = 160;
  private readonly CROP_H = 220;
  private readonly PREVIEW_AREA_W = 480;
  private readonly PREVIEW_AREA_H = 320;

  /** Called when user picks a file */
  async onFileSelected(event: any) {
    const file: File = event.target.files?.[0];
    if (!file) return;
    this.cropOriginalFile = file;
    // Reset input so same file can be re-selected
    (event.target as HTMLInputElement).value = '';

    const img = new Image();
    img.onload = () => {
      this.cropImage = img;
      this.cropScale = 1;
      this.cropCanvasDisplayW = img.naturalWidth;
      this.cropCanvasDisplayH = img.naturalHeight;
      // Centre the image in preview area
      this.cropOffsetX = (this.PREVIEW_AREA_W - this.cropCanvasDisplayW) / 2;
      this.cropOffsetY = (this.PREVIEW_AREA_H - this.cropCanvasDisplayH) / 2;
      this.showCropModal.set(true);
      // Draw to canvas after modal renders
      setTimeout(() => this.drawCropCanvas(), 50);
    };
    img.src = URL.createObjectURL(file);
  }

  private drawCropCanvas() {
    const canvas = document.getElementById('bookCropCanvas') as HTMLCanvasElement | null;
    if (!canvas || !this.cropImage) return;
    canvas.width = this.cropImage.naturalWidth;
    canvas.height = this.cropImage.naturalHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(this.cropImage, 0, 0);
  }

  cropDragStart(e: MouseEvent) {
    this.cropDragging = true;
    this.cropDragStartX = e.clientX;
    this.cropDragStartY = e.clientY;
    this.cropDragStartOffX = this.cropOffsetX;
    this.cropDragStartOffY = this.cropOffsetY;
  }

  cropDragMove(e: MouseEvent) {
    if (!this.cropDragging) return;
    this.cropOffsetX = this.cropDragStartOffX + (e.clientX - this.cropDragStartX);
    this.cropOffsetY = this.cropDragStartOffY + (e.clientY - this.cropDragStartY);
  }

  cropDragEnd() { this.cropDragging = false; }

  cropWheel(e: WheelEvent) {
    e.preventDefault();
    this.cropZoom(e.deltaY < 0 ? 0.08 : -0.08);
  }

  cropZoom(delta: number) {
    this.cropScale = Math.min(5, Math.max(0.2, this.cropScale + delta));
  }

  cropReset() {
    this.cropScale = 1;
    if (this.cropImage) {
      this.cropOffsetX = (this.PREVIEW_AREA_W - this.cropImage.naturalWidth) / 2;
      this.cropOffsetY = (this.PREVIEW_AREA_H - this.cropImage.naturalHeight) / 2;
    }
  }

  cancelCrop() {
    this.showCropModal.set(false);
    this.cropImage = null;
    this.cropOriginalFile = null;
  }

  async applyCrop() {
    if (!this.cropImage) return;

    // Work out which part of the image is behind the crop frame
    const containerCentreX = this.PREVIEW_AREA_W / 2;
    const containerCentreY = this.PREVIEW_AREA_H / 2;
    const scaledW = this.cropCanvasDisplayW * this.cropScale;
    const scaledH = this.cropCanvasDisplayH * this.cropScale;
    const imageLeft = this.cropOffsetX;
    const imageTop = this.cropOffsetY;

    const frameCentreX = containerCentreX;
    const frameCentreY = containerCentreY;

    // Frame extents in screen space
    const frameLeft = frameCentreX - this.CROP_W / 2;
    const frameTop = frameCentreY - this.CROP_H / 2;

    // Convert frame top-left to image pixel coords
    const sx = ((frameLeft - imageLeft) / this.cropScale);
    const sy = ((frameTop - imageTop) / this.cropScale);
    const sw = this.CROP_W / this.cropScale;
    const sh = this.CROP_H / this.cropScale;

    // Draw cropped region onto output canvas
    const out = document.createElement('canvas');
    out.width = 600;
    out.height = Math.round(600 * (this.CROP_H / this.CROP_W));
    const ctx = out.getContext('2d')!;
    ctx.drawImage(this.cropImage, sx, sy, sw, sh, 0, 0, out.width, out.height);

    out.toBlob(async (blob) => {
      if (!blob) { this.toast.error('Crop failed'); return; }
      const croppedFile = new File([blob], this.cropOriginalFile?.name || 'cover.jpg', { type: 'image/jpeg' });
      this.showCropModal.set(false);
      this.isUploading.set(true);
      const { url, error } = await this.bookService.uploadCoverImage(croppedFile);
      this.isUploading.set(false);
      if (url) {
        this.formData.cover_image_url = url;
        this.toast.success('Cover cropped & uploaded!');
      } else if (error) {
        this.toast.warning(error);
      }
    }, 'image/jpeg', 0.92);
  }
}

