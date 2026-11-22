import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContentSyncService } from './content-sync.service';
import { ToastService } from './toast.service';
import { Batch, BatchStatus } from '../models/batch.model';

@Injectable({ providedIn: 'root' })
export class BatchService {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);
  private items = signal<Batch[]>([]);
  readonly batches = this.items.asReadonly();
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  constructor() {
    inject(ContentSyncService).watch(['batches'], () => this.fetchBatches(), inject(DestroyRef));
  }
  async fetchBatches(): Promise<Batch[]> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.from('batches').select('*').order('display_order').order('created_at', { ascending: false });
      if (error) throw error;
      this.error.set(null);
      this.items.set((data || []).map(b => ({ ...b, status: ({ upcoming: 'Upcoming', registration_open: 'Registration Open', full: 'Full', ongoing: 'Ongoing', completed: 'Completed', cancelled: 'Cancelled' } as Record<string, BatchStatus>)[b.status] || 'Upcoming', start_date: b.start_date?.split('T')[0] || '', end_date: b.end_date?.split('T')[0] || '', registration_start: b.registration_start?.split('T')[0] || '', registration_end: b.registration_end?.split('T')[0] || '' })));
    } catch (error: any) { this.error.set(error.message); }
    finally { this.isLoading.set(false); }
    return this.items();
  }
  private payload(input: Partial<Batch>): Record<string, unknown> {
    const payload: Record<string, unknown> = { ...input, updated_at: new Date().toISOString() };
    delete payload['id']; delete payload['created_at']; delete payload['course_id'];
    if (payload['status']) payload['status'] = String(payload['status']).toLowerCase().replaceAll(' ', '_');
    for (const key of ['start_date', 'end_date', 'registration_start', 'registration_end']) {
      if (payload[key] === '') payload[key] = null;
    }
    return payload;
  }
  async createBatch(input: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> {
    try {
      const { data, error } = await this.supabase.from('batches').insert(this.payload({ name: 'Untitled Batch', course_name: 'General', price: 0, total_seats: 50, available_seats: 50, status: 'Upcoming', is_published: false, is_active: true, is_featured: false, ...input })).select().single();
      if (error) throw error;
      await this.fetchBatches();
      this.toast.success('Batch saved to Supabase');
      return { success: true, data };
    } catch (error: any) { this.toast.error(error.message); return { success: false, error: error.message }; }
  }
  async updateBatch(id: string, input: Partial<Batch>): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await this.supabase.from('batches').update(this.payload(input)).eq('id', id).select('id').single();
      if (error) throw error;
      await this.fetchBatches();
      this.toast.success('Batch updated');
      return { success: true };
    } catch (error: any) { this.toast.error(error.message); return { success: false, error: error.message }; }
  }
  async deleteBatch(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('batches').delete().eq('id', id).select('id').single();
      if (error) throw error;
      this.items.update(items => items.filter(item => item.id !== id));
      this.toast.success('Batch deleted');
      return true;
    } catch (error: any) { this.toast.error(error.message); return false; }
  }
  async updateStatus(id: string, status: BatchStatus): Promise<boolean> {
    return (await this.updateBatch(id, { status })).success;
  }
  async toggleFeatured(id: string): Promise<boolean> {
    const batch = this.batches().find(b => b.id === id);
    return batch ? (await this.updateBatch(id, { is_featured: !batch.is_featured })).success : false;
  }

  async uploadCoverImage(file: File): Promise<{ url?: string; error?: string }> {
    try {
      const fileExt = file.name.split('.').pop() || 'jpg';
      const fileName = `batch_cover_${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const filePath = `batch-covers/${fileName}`;

      const { error: uploadError } = await this.supabase.storage
        .from('app-media')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        return { error: uploadError.message };
      }

      const { data: publicUrlData } = this.supabase.storage
        .from('app-media')
        .getPublicUrl(filePath);

      return { url: publicUrlData.publicUrl };
    } catch (err: any) {
      return { error: err.message || 'Image upload failed' };
    }
  }

}
