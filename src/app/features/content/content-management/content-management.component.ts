import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ContentService } from '../../../core/services/content.service';
import { AppContent } from '../../../core/models/content.model';
import { HomepageSectionVisibility } from '../../../core/models/settings.model';
import { ToastService } from '../../../core/services/toast.service';
import { IconComponent } from '../../../shared/components/icon/icon.component';

@Component({
  selector: 'app-content-management',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent],
  template: `
    <div class="space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 class="text-lg font-bold text-slate-900 tracking-tight">App Content & Dynamic CMS</h2>
          <p class="text-xs text-slate-500 mt-0.5">Control live headlines, banners, announcements, and module visibility without APK updates.</p>
        </div>

        <button
          type="button"
          (click)="contentService.fetchAllContent()"
          class="h-9 px-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition flex items-center gap-1.5 self-start sm:self-auto">
          <app-icon name="refresh" [size]="14" [customClass]="contentService.isLoading() ? 'animate-spin' : ''"></app-icon>
          <span>Refresh CMS</span>
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="flex items-center gap-2 border-b border-slate-200 text-xs font-semibold pb-1">
        <button
          type="button"
          (click)="activeTab.set('homepage')"
          class="px-4 py-2 rounded-xl transition"
          [ngClass]="activeTab() === 'homepage' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'">
          Homepage & Hero Banners
        </button>
        <button
          type="button"
          (click)="activeTab.set('sections')"
          class="px-4 py-2 rounded-xl transition"
          [ngClass]="activeTab() === 'sections' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'">
          Section Visibility Toggles
        </button>
        <button
          type="button"
          (click)="activeTab.set('announcements')"
          class="px-4 py-2 rounded-xl transition"
          [ngClass]="activeTab() === 'announcements' ? 'bg-emerald-50 text-emerald-800 font-bold' : 'text-slate-500 hover:text-slate-800'">
          Broadcast Announcements ({{ announcements().length }})
        </button>
      </div>

      <!-- TAB 1: HOMEPAGE & HERO -->
      @if (activeTab() === 'homepage') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-sm font-bold text-slate-900">Student App Homepage Content</h3>
            <p class="text-xs text-slate-500 mt-0.5">Customize the hero banner, greeting message, and marquee announcements displayed on mobile.</p>
          </div>

          <form (ngSubmit)="saveHomepageConfig()" class="space-y-5 max-w-2xl">
            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Homepage Heading</label>
              <input
                type="text"
                [(ngModel)]="homepageForm.heading"
                name="heading"
                placeholder="e.g. आपली शाळा, आपले भविष्य!"
                class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Homepage Subtitle / Welcome Message</label>
              <textarea
                [(ngModel)]="homepageForm.subtitle"
                name="subtitle"
                rows="2"
                placeholder="e.g. महाराष्ट्रातील सर्वोत्कृष्ट अभ्यासक्रम, नामांकित प्राध्यापकांचे मार्गदर्शन आणि दर्जेदार पुस्तके."
                class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition"></textarea>
            </div>

            <div>
              <label class="block text-xs font-semibold text-slate-700 mb-1">Promotional Announcement Alert Bar</label>
              <input
                type="text"
                [(ngModel)]="homepageForm.promoAlert"
                name="promoAlert"
                placeholder="e.g. 📢 Standard 10 Board Revision Crash Course starts Monday! Enroll now."
                class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
            </div>

            <div class="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <label class="block text-xs font-semibold text-slate-700">Hero Promotional Banner Image</label>
              <div class="flex items-center gap-3">
                @if (homepageForm.bannerUrl) {
                  <img
                    [src]="homepageForm.bannerUrl"
                    alt="Banner preview"
                    class="w-24 h-14 object-cover rounded-lg border border-slate-300 bg-white shadow-2xs shrink-0" />
                }
                <div class="flex-1">
                  <input
                    type="url"
                    [(ngModel)]="homepageForm.bannerUrl"
                    name="bannerUrl"
                    placeholder="https://images.unsplash.com/..."
                    class="w-full h-8 px-3 rounded-lg border border-slate-200 text-xs bg-white focus:outline-none focus:ring-1 focus:ring-emerald-700" />
                  <span class="text-[10px] text-slate-400 mt-1 block">Recommended size: 1200 x 500 px. Displays in the top sliding carousel.</span>
                </div>
              </div>
            </div>

            <div class="pt-2">
              <button
                type="submit"
                [disabled]="isSaving()"
                class="h-9 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-2">
                @if (isSaving()) {
                  <div class="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                }
                <span>Save & Publish Changes</span>
              </button>
            </div>
          </form>
        </div>
      }

      <!-- TAB 2: SECTION VISIBILITY -->
      @if (activeTab() === 'sections') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div class="border-b border-slate-100 pb-4">
            <h3 class="text-sm font-bold text-slate-900">Student Application Section Toggles</h3>
            <p class="text-xs text-slate-500 mt-0.5">Toggle specific feature sections on or off on the user application in real-time.</p>
          </div>

          <div class="max-w-xl space-y-4">
            <!-- Books Section -->
            <div class="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <span class="text-xs font-bold text-slate-900 block">Books & Publications Catalog</span>
                <span class="text-[11px] text-slate-500">Show official textbooks, workbooks, and study guides on the home page.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="sections.books"
                (ngModelChange)="onSectionToggle()"
                class="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-700" />
            </div>

            <!-- Batches Section -->
            <div class="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <span class="text-xs font-bold text-slate-900 block">Upcoming Academic Batches</span>
                <span class="text-[11px] text-slate-500">Display open registration batches and academic schedules.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="sections.batches"
                (ngModelChange)="onSectionToggle()"
                class="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-700" />
            </div>

            <!-- Announcements Section -->
            <div class="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <span class="text-xs font-bold text-slate-900 block">Broadcast Announcements</span>
                <span class="text-[11px] text-slate-500">Show important notifications and marquee alerts to students.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="sections.announcements"
                (ngModelChange)="onSectionToggle()"
                class="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-700" />
            </div>

            <!-- Featured Content -->
            <div class="p-4 rounded-xl border border-slate-200 flex items-center justify-between hover:bg-slate-50 transition">
              <div>
                <span class="text-xs font-bold text-slate-900 block">Featured Items Carousel</span>
                <span class="text-[11px] text-slate-500">Highlight starred books and bestseller badges.</span>
              </div>
              <input
                type="checkbox"
                [(ngModel)]="sections.featured_books"
                (ngModelChange)="onSectionToggle()"
                class="w-5 h-5 rounded text-emerald-700 focus:ring-emerald-700" />
            </div>
          </div>
        </div>
      }

      <!-- TAB 3: ANNOUNCEMENTS -->
      @if (activeTab() === 'announcements') {
        <div class="bg-white rounded-2xl border border-slate-200 shadow-2xs p-6 space-y-6">
          <div class="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h3 class="text-sm font-bold text-slate-900">Broadcast Announcement Manager</h3>
              <p class="text-xs text-slate-500 mt-0.5">Publish instant alerts, timetable notices, and scholarship announcements.</p>
            </div>

            <button
              type="button"
              (click)="showAnnouncementModal.set(true)"
              class="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition flex items-center gap-1.5">
              <app-icon name="plus" [size]="14"></app-icon>
              <span>New Announcement</span>
            </button>
          </div>

          @if (announcements().length === 0) {
            <div class="py-12 text-center text-xs text-slate-400">
              No active announcements. Click "New Announcement" above to broadcast an update to students.
            </div>
          } @else {
            <div class="divide-y divide-slate-100">
              @for (item of announcements(); track item.id) {
                <div class="py-4 flex items-start justify-between gap-4 first:pt-0 last:pb-0">
                  <div class="space-y-1">
                    <div class="flex items-center gap-2">
                      <span class="text-xs font-bold text-slate-900">{{ item.title }}</span>
                      <span
                        class="text-[9px] font-bold px-2 py-0.5 rounded-full"
                        [ngClass]="item.is_published ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'">
                        {{ item.is_published ? 'Published' : 'Draft' }}
                      </span>
                    </div>
                    <p class="text-xs text-slate-600 leading-relaxed">{{ item.body }}</p>
                    <span class="text-[10px] text-slate-400 block">
                      Posted: {{ item.created_at ? (item.created_at | date:'medium') : 'Recent' }}
                    </span>
                  </div>

                  <div class="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      (click)="toggleAnnouncementPublish(item)"
                      class="px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition"
                      [ngClass]="item.is_published ? 'border-amber-200 text-amber-700 hover:bg-amber-50' : 'border-emerald-200 text-emerald-700 hover:bg-emerald-50'">
                      {{ item.is_published ? 'Unpublish' : 'Publish' }}
                    </button>
                    <button
                      type="button"
                      (click)="deleteAnnouncement(item.id)"
                      class="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition">
                      <app-icon name="trash" [size]="14"></app-icon>
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }

      <!-- New Announcement Modal -->
      @if (showAnnouncementModal()) {
        <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div class="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-md w-full p-6 space-y-4 animate-slide-in">
            <div class="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 class="text-sm font-bold text-slate-900">Broadcast New Announcement</h3>
              <button
                type="button"
                (click)="showAnnouncementModal.set(false)"
                class="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition">
                <app-icon name="x" [size]="16"></app-icon>
              </button>
            </div>

            <form (ngSubmit)="publishNewAnnouncement()" class="space-y-4">
              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Announcement Title *</label>
                <input
                  type="text"
                  [(ngModel)]="newAnnouncement.title"
                  name="title"
                  required
                  placeholder="e.g. Diwalii Holiday Academic Schedule"
                  class="w-full h-9 px-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition" />
              </div>

              <div>
                <label class="block text-xs font-semibold text-slate-700 mb-1">Message Body *</label>
                <textarea
                  [(ngModel)]="newAnnouncement.message"
                  name="message"
                  required
                  rows="3"
                  placeholder="Detail information displayed to students on their dashboard..."
                  class="w-full p-3 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-700/20 focus:border-emerald-700 focus:outline-none transition"></textarea>
              </div>

              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="ann_publish"
                  [(ngModel)]="newAnnouncement.isPublished"
                  name="isPublished"
                  class="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-700" />
                <label for="ann_publish" class="text-xs font-semibold text-slate-700 cursor-pointer">
                  Publish immediately to student application
                </label>
              </div>

              <div class="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  (click)="showAnnouncementModal.set(false)"
                  class="h-9 px-4 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition">
                  Cancel
                </button>
                <button
                  type="submit"
                  [disabled]="!newAnnouncement.title || !newAnnouncement.message"
                  class="h-9 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold transition disabled:opacity-50">
                  Publish Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `
})
export class ContentManagementComponent implements OnInit {
  contentService = inject(ContentService);
  toast = inject(ToastService);
  route = inject(ActivatedRoute);

  activeTab = signal<'homepage' | 'sections' | 'announcements'>('homepage');
  isSaving = signal(false);
  showAnnouncementModal = signal(false);

  homepageForm = {
    heading: 'ई-माझीशाळा (e-MaziShaala)',
    subtitle: 'इयत्ता १ ली ते १० वी साठी महाराष्ट्रातील अग्रगण्य डिजिटल शिक्षण मंच.',
    promoAlert: 'नवीन शैक्षणिक बॅचेस सुरू झाल्या आहेत! त्वरित प्रवेश घ्या.',
    bannerUrl: 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&w=1200&q=80'
  };

  sections: HomepageSectionVisibility = {
    books: true,
    batches: true,
    announcements: true,
    featured_books: true,
    featured_batches: true
  };

  newAnnouncement = {
    title: '',
    message: '',
    isPublished: true
  };

  ngOnInit() {
    this.contentService.fetchAllContent().then(() => {
      this.syncExistingConfig();
    });

    this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'announcements') {
        this.activeTab.set('announcements');
        if (params['action'] === 'new') {
          this.showAnnouncementModal.set(true);
        }
      }
    });
  }

  syncExistingConfig() {
    const items = this.contentService.contentItems();
    const headingItem = items.find(i => i.content_key === 'homepage_heading');
    if (headingItem) this.homepageForm.heading = headingItem.title;

    const subtitleItem = items.find(i => i.content_key === 'homepage_subtitle');
    if (subtitleItem) this.homepageForm.subtitle = subtitleItem.body;

    const bannerItem = items.find(i => i.content_key === 'homepage_hero_banner');
    if (bannerItem && bannerItem.image_url) this.homepageForm.bannerUrl = bannerItem.image_url;

    const promoItem = items.find(i => i.content_key === 'promo_alert');
    if (promoItem) this.homepageForm.promoAlert = promoItem.title;

    this.sections = { ...this.contentService.sectionVisibility() };
  }

  announcements = computed(() => {
    return this.contentService.contentItems().filter(i => i.content_key.startsWith('announcement'));
  });

  async saveHomepageConfig() {
    this.isSaving.set(true);

    await this.contentService.saveContentKey('homepage_heading', this.homepageForm.heading, '');
    await this.contentService.saveContentKey('homepage_subtitle', '', this.homepageForm.subtitle);
    await this.contentService.saveContentKey('homepage_hero_banner', 'Hero Banner', '', this.homepageForm.bannerUrl);
    await this.contentService.saveContentKey('promo_alert', this.homepageForm.promoAlert, '');

    this.isSaving.set(false);
  }

  async onSectionToggle() {
    await this.contentService.updateSectionVisibility(this.sections);
  }

  async publishNewAnnouncement() {
    if (!this.newAnnouncement.title || !this.newAnnouncement.message) return;

    const saved = await this.contentService.createAnnouncement(
      this.newAnnouncement.title,
      this.newAnnouncement.message,
      this.newAnnouncement.isPublished
    );

    if (saved) this.newAnnouncement = { title: '', message: '', isPublished: true };
    this.showAnnouncementModal.set(false);
  }

  async toggleAnnouncementPublish(item: AppContent) {
    await this.contentService.toggleContentPublication(item.id, !item.is_published);
  }

  async deleteAnnouncement(id: string) {
    await this.contentService.deleteContent(id);
  }
}

