import { Injectable, inject, signal, DestroyRef } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ContentSyncService } from './content-sync.service';
import { LiveClass, LiveClassStatus } from '../models/live-class.model';
import { ToastService } from './toast.service';

@Injectable({ providedIn: 'root' })
export class LiveClassService {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);
  private items = signal<LiveClass[]>([]);
  readonly classes = this.items.asReadonly();
  readonly isLoading = signal(false);
  readonly error = signal<string | null>(null);
  constructor() {
    inject(ContentSyncService).watch(['live_classes'], () => this.fetchClasses(), inject(DestroyRef));
  }
  async fetchClasses(): Promise<LiveClass[]> {
    this.isLoading.set(true);
    try {
      const { data, error } = await this.supabase.from('live_classes').select('*').order('scheduled_start');
      if (error) throw error;
      this.error.set(null);
      this.items.set((data || []).map(d => {
        const start = new Date(d.scheduled_start);
        const local = new Date(start.getTime() - start.getTimezoneOffset() * 60000).toISOString();
        return {
          id: d.id, title: d.title, subject: d.subject || 'General', standard: d.standard,
          teacher_name: d.instructor_name || '', teacher_title: d.teacher_title || '', teacher_avatar: d.teacher_avatar || '',
          status: d.status === 'scheduled' ? 'upcoming' : d.status === 'ended' ? 'completed' : d.status,
          scheduled_date: local.slice(0, 10), scheduled_time: local.slice(11, 16),
          duration: `${Math.round((Date.parse(d.scheduled_end) - start.getTime()) / 60000)} mins`,
          thumbnail: d.thumbnail || '', attendees_count: d.attendees_count, has_recording: !!d.recording_url,
          recording_url: d.recording_url || '', recording_duration: d.recording_duration || '',
          meeting_link: d.meeting_url || '', is_published: d.is_published, is_active: d.is_active,
          is_public: d.is_public, batch_id: d.batch_id
        };
      }));
    } catch (error: any) { this.error.set(error.message); }
    finally { this.isLoading.set(false); }
    return this.items();
  }
  private payload(c: Partial<LiveClass>) {
    const start = new Date(`${c.scheduled_date}T${c.scheduled_time}`);
    const minutes = Number.parseInt(c.duration || '60', 10);
    if (!Number.isFinite(start.getTime()) || !Number.isFinite(minutes) || minutes <= 0) {
      throw new Error('Choose a valid date, start time, and duration in minutes.');
    }
    return {
      title: c.title, subject: c.subject, standard: c.standard, instructor_name: c.teacher_name,
      teacher_title: c.teacher_title, teacher_avatar: c.teacher_avatar,
      status: c.status === 'upcoming' ? 'scheduled' : c.status === 'completed' ? 'ended' : c.status,
      scheduled_start: start.toISOString(), scheduled_end: new Date(start.getTime() + minutes * 60000).toISOString(),
      thumbnail: c.thumbnail, attendees_count: c.attendees_count ?? 0,
      recording_url: c.has_recording ? c.recording_url || null : null, recording_duration: c.recording_duration,
      meeting_url: c.meeting_link, is_published: c.is_published ?? false, is_active: c.is_active ?? true,
      is_public: c.is_public ?? true, batch_id: c.batch_id || null
    };
  }
  async createClass(input: Partial<LiveClass>): Promise<{ success: boolean; data?: LiveClass; error?: string }> {
    try {
      const { data, error } = await this.supabase.from('live_classes').insert(this.payload(input)).select('id').single();
      if (error) throw error;
      await this.fetchClasses();
      this.toast.success('Lecture saved');
      return { success: true, data: this.items().find(c => c.id === data.id) };
    } catch (error: any) { this.toast.error(error.message); return { success: false, error: error.message }; }
  }
  async updateClass(id: string, updates: Partial<LiveClass>): Promise<{ success: boolean; error?: string }> {
    try {
      const current = this.items().find(c => c.id === id);
      if (!current) throw new Error('Lecture no longer exists. Refresh and try again.');
      const { error } = await this.supabase.from('live_classes').update(this.payload({ ...current, ...updates })).eq('id', id).select('id').single();
      if (error) throw error;
      await this.fetchClasses();
      this.toast.success('Lecture updated');
      return { success: true };
    } catch (error: any) { this.toast.error(error.message); return { success: false, error: error.message }; }
  }
  async setClassStatus(id: string, status: LiveClassStatus): Promise<boolean> {
    return (await this.updateClass(id, { status })).success;
  }
  async deleteClass(id: string): Promise<boolean> {
    try {
      const { error } = await this.supabase.from('live_classes').delete().eq('id', id).select('id').single();
      if (error) throw error;
      this.items.update(items => items.filter(c => c.id !== id));
      this.toast.success('Lecture deleted');
      return true;
    } catch (error: any) { this.toast.error(error.message); return false; }
  }
}
