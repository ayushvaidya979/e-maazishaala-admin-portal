import { Injectable, inject, signal } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AppContent, AnnouncementItem } from '../models/content.model';
import { HomepageSectionVisibility } from '../models/settings.model';
import { ToastService } from './toast.service';

@Injectable({
  providedIn: 'root'
})
export class ContentService {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);

  private contentItemsSignal = signal<AppContent[]>([]);
  private sectionVisibilitySignal = signal<HomepageSectionVisibility>({
    books: true,
    batches: true,
    announcements: true,
    featured_books: true,
    featured_batches: true
  });
  private isLoadingSignal = signal<boolean>(false);

  readonly contentItems = this.contentItemsSignal.asReadonly();
  readonly sectionVisibility = this.sectionVisibilitySignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  async fetchAllContent(): Promise<void> {
    this.isLoadingSignal.set(true);
    try {
      // 1. Fetch content items
      const { data: contentData, error: contentError } = await this.supabase
        .from('app_content')
        .select('*')
        .order('created_at', { ascending: false });

      if (contentError) {
        this.toast.error('Failed to load app content: ' + contentError.message);
      } else {
        this.contentItemsSignal.set((contentData as AppContent[]) || []);
      }

      // 2. Fetch section visibility from app_settings
      const { data: settingsData, error: settingsError } = await this.supabase
        .from('app_settings')
        .select('*')
        .eq('setting_key', 'homepage_sections')
        .maybeSingle();

      if (!settingsError && settingsData && settingsData.setting_value) {
        this.sectionVisibilitySignal.set({
          books: settingsData.setting_value.books ?? true,
          batches: settingsData.setting_value.batches ?? true,
          announcements: settingsData.setting_value.announcements ?? true,
          featured_books: settingsData.setting_value.featured_books ?? true,
          featured_batches: settingsData.setting_value.featured_batches ?? true
        });
      }
    } catch (err: any) {
      this.toast.error('Error fetching content CMS: ' + err.message);
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async saveContentKey(key: string, title: string, body: string, imageUrl?: string, isPublished: boolean = true): Promise<boolean> {
    try {
      const existing = this.contentItemsSignal().find(c => c.content_key === key);

      const payload = {
        content_key: key,
        title,
        body,
        image_url: imageUrl || '',
        is_published: isPublished,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        const { error } = await this.supabase
          .from('app_content')
          .update(payload)
          .eq('id', existing.id).select('id').single();

        if (error) throw error;
      } else {
        const { error } = await this.supabase
          .from('app_content')
          .insert({
            ...payload,
            created_at: new Date().toISOString()
          });

        if (error) throw error;
      }

      this.toast.success('App content updated! Changes live on student application.');
      await this.fetchAllContent();
      return true;
    } catch (err: any) {
      this.toast.error('Failed to save content: ' + err.message);
      return false;
    }
  }

  async createAnnouncement(title: string, message: string, isPublished: boolean = true): Promise<boolean> {
    try {
      const key = `announcement_${Date.now()}`;
      const { error } = await this.supabase
        .from('app_content')
        .insert({
          content_key: key,
          title,
          body: message,
          is_published: isPublished,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) throw error;

      this.toast.success('Announcement broadcast published to student application!');
      await this.fetchAllContent();
      return true;
    } catch (err: any) {
      this.toast.error('Failed to create announcement: ' + err.message);
      return false;
    }
  }

  async deleteContent(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('app_content')
        .delete()
        .eq('id', id).select('id').single();

      if (error) throw error;

      this.toast.success('Item deleted');
      await this.fetchAllContent();
      return true;
    } catch (err: any) {
      this.toast.error('Failed to delete item: ' + err.message);
      return false;
    }
  }

  async toggleContentPublication(id: string, isPublished: boolean): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('app_content')
        .update({ is_published: isPublished, updated_at: new Date().toISOString() })
        .eq('id', id).select('id').single();

      if (error) throw error;

      this.toast.success(isPublished ? 'Published to user app' : 'Unpublished from user app');
      await this.fetchAllContent();
      return true;
    } catch (err: any) {
      this.toast.error('Error updating status: ' + err.message);
      return false;
    }
  }

  async updateSectionVisibility(visibility: HomepageSectionVisibility): Promise<boolean> {
    try {
      const { error } = await this.supabase
        .from('app_settings')
        .update({
          setting_value: visibility,
          updated_at: new Date().toISOString()
        })
        .eq('setting_key', 'homepage_sections').select('id').single();

      if (error) throw error;

      this.sectionVisibilitySignal.set(visibility);
      this.toast.success('Section visibility updated in user application!');
      return true;
    } catch (err: any) {
      this.toast.error('Failed to update section visibility: ' + err.message);
      return false;
    }
  }
}

