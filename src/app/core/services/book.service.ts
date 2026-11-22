import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContentSyncService } from './content-sync.service';
import { ToastService } from './toast.service';
import { Book } from '../models/book.model';

@Injectable({ providedIn: 'root' })
export class BookService {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);
  private items = signal<Book[]>([]);
  readonly books = this.items.asReadonly();
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  constructor() {
    inject(ContentSyncService).watch(['books'], () => this.fetchBooks(), inject(DestroyRef));
  }
  async fetchBooks(): Promise<Book[]> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.from('books').select('*').order('display_order').order('created_at', { ascending: false });
      if (error) throw error;
      this.error.set(null);
      this.items.set(data || []);
    } catch (error: any) { this.error.set(error.message); }
    finally { this.isLoading.set(false); }
    return this.items();
  }
  private payload(input: Partial<Book>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    delete payload['id']; delete payload['created_at'];
    if (payload['cover_image_url'] !== undefined) payload['cover_image'] = payload['cover_image_url'];
    if (payload['subject'] !== undefined) payload['category'] = payload['subject'];
    return payload;
  }
  async createBook(input: Partial<Book>): Promise<{ success: boolean; data?: Book; error?: string }> {
    try {
      const { data, error } = await this.supabase.from('books').insert(this.payload({ title: 'Untitled Book', author: '', category: 'General', price: 0, is_published: false, is_active: true, is_featured: false, display_order: 0, ...input })).select().single();
      if (error) throw error;
      await this.fetchBooks();
      this.toast.success('Book saved to Supabase');
      return { success: true, data };
    } catch (error: any) { this.toast.error(error.message); return { success: false, error: error.message }; }
  }
  async updateBook(id: string, input: Partial<Book>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.from('books').update(this.payload(input)).eq('id', id).select('id').single();
      if (error) throw error;
      await this.fetchBooks();
      this.toast.success('Book updated');
      return { success: true };
    } catch (error: any) { this.toast.error(error.message); return { success: false, error: error.message }; }
  }
  async deleteBook(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('books').delete().eq('id', id).select('id').single();
      if (error) throw error;
      this.items.update(items => items.filter(item => item.id !== id));
      this.toast.success('Book deleted');
      return true;
    } catch (error: any) { this.toast.error(error.message); return false; }
  }
  readonly hasSyncPermissionIssue = signal(false);
  async togglePublication(id: string, isPublished: boolean): Promise<boolean> {
    return (await this.updateBook(id, { is_published: isPublished })).success;
  }

  async uploadCoverImage(file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `covers/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('book-covers')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('book-covers')
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl };
    } catch (err: any) {
      return { error: err.message || 'Image upload failed' };
    }
  }
}
