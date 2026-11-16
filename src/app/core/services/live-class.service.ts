import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { LiveClass, LiveClassStatus } from '../models/live-class.model';
import { ToastService } from './toast.service';
import { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_KEY = 'emaazi_portal_live_classes_cache';

export const INITIAL_LIVE_CLASSES: LiveClass[] = [
  {
    id: 'live-1',
    title: 'Class 10 Live: Quadratic Equations Masterclass & Super-Tricks',
    subject: 'Mathematics',
    standard: 10,
    teacher_name: 'Prof. Rahul Deshmukh',
    teacher_title: 'Senior Mathematics Educator',
    teacher_avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
    status: 'live',
    scheduled_date: 'Today, Live Now',
    scheduled_time: '06:00 PM - 07:15 PM',
    duration: '75 mins',
    thumbnail: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
    attendees_count: 482,
    has_recording: false,
    meeting_link: 'https://meet.google.com',
    is_published: true
  },
  {
    id: 'live-2',
    title: 'Class 9 Live: Gravitation & Numerical Solving Marathon',
    subject: 'Science',
    standard: 9,
    teacher_name: 'Dr. Snehal Patil',
    teacher_title: 'M.Sc., Ph.D. in Physics',
    teacher_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    status: 'live',
    scheduled_date: 'Today, Live Now',
    scheduled_time: '06:15 PM - 07:30 PM',
    duration: '75 mins',
    thumbnail: 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80',
    attendees_count: 318,
    has_recording: false,
    meeting_link: 'https://meet.google.com',
    is_published: true
  },
  {
    id: 'up-1',
    title: 'Class 10: Chemical Reactions & Balancing Equations in 30 Seconds',
    subject: 'Science',
    standard: 10,
    teacher_name: 'Dr. Snehal Patil',
    teacher_title: 'M.Sc., Ph.D. in Physics',
    teacher_avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=200&q=80',
    status: 'upcoming',
    scheduled_date: 'Tomorrow, Nov 17',
    scheduled_time: '05:00 PM - 06:00 PM',
    duration: '60 mins',
    thumbnail: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?auto=format&fit=crop&w=800&q=80',
    attendees_count: 650,
    has_recording: false,
    meeting_link: 'https://meet.google.com',
    is_published: true
  }
];

@Injectable({
  providedIn: 'root'
})
export class LiveClassService implements OnDestroy {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);

  private classesSignal = signal<LiveClass[]>(this.getInitialClasses());
  private isLoadingSignal = signal<boolean>(false);
  private realtimeChannel: RealtimeChannel | null = null;

  readonly classes = this.classesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    this.fetchClasses();
    this.initRealtimeSubscription();
  }

  ngOnDestroy() {
    this.cleanupRealtime();
  }

  private getInitialClasses(): LiveClass[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return INITIAL_LIVE_CLASSES;
  }

  private saveToCache(classes: LiveClass[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(classes));
    } catch {}
  }

  private initRealtimeSubscription() {
    try {
      this.cleanupRealtime();
      this.realtimeChannel = this.supabase
        .channel('admin-live-classes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'live_classes' }, () => {
          this.fetchClasses();
        })
        .subscribe();
    } catch {}
  }

  private cleanupRealtime() {
    if (this.realtimeChannel) {
      try {
        this.supabase.removeChannel(this.realtimeChannel);
      } catch {}
      this.realtimeChannel = null;
    }
  }

  async fetchClasses(): Promise<LiveClass[]> {
    this.isLoadingSignal.set(true);
    try {
      const { data, error } = await this.supabase
        .from('live_classes')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        const mapped: LiveClass[] = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          subject: d.subject || 'General',
          standard: Number(d.standard) || 10,
          teacher_name: d.teacher_name || 'Educator',
          teacher_avatar: d.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
          teacher_title: d.teacher_title || 'Faculty',
          status: (d.status as LiveClassStatus) || 'upcoming',
          scheduled_date: d.scheduled_date || 'Upcoming',
          scheduled_time: d.scheduled_time || '10:00 AM',
          duration: d.duration || '60 mins',
          thumbnail: d.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
          attendees_count: Number(d.attendees_count) || 0,
          has_recording: d.has_recording ?? false,
          recording_duration: d.recording_duration || '',
          recording_url: d.recording_url || '',
          meeting_link: d.meeting_link || 'https://meet.google.com',
          is_published: d.is_published ?? true,
          is_active: d.is_active !== false,
          created_at: d.created_at,
          updated_at: d.updated_at
        }));

        this.classesSignal.set(mapped);
        this.saveToCache(mapped);
        return mapped;
      } else {
        const fallback = this.getInitialClasses();
        this.classesSignal.set(fallback);
        return fallback;
      }
    } catch (err: any) {
      console.warn('Supabase live classes fetch fallback:', err);
      return this.classesSignal();
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createClass(payload: Partial<LiveClass>): Promise<{ success: boolean; data?: LiveClass; error?: string }> {
    const id = payload.id || 'live-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 6);
    const newClass: LiveClass = {
      id,
      title: payload.title || 'Untitled Live Class',
      subject: payload.subject || 'General',
      standard: Number(payload.standard) || 10,
      teacher_name: payload.teacher_name || 'Prof. Rahul Deshmukh',
      teacher_title: payload.teacher_title || 'Senior Educator',
      teacher_avatar: payload.teacher_avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
      status: (payload.status as LiveClassStatus) || 'upcoming',
      scheduled_date: payload.scheduled_date || 'Today, 6:00 PM',
      scheduled_time: payload.scheduled_time || '06:00 PM - 07:00 PM',
      duration: payload.duration || '60 mins',
      thumbnail: payload.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=80',
      attendees_count: Number(payload.attendees_count) || 0,
      has_recording: Boolean(payload.has_recording),
      recording_duration: payload.recording_duration || '',
      recording_url: payload.recording_url || '',
      meeting_link: payload.meeting_link || 'https://meet.google.com',
      is_published: payload.is_published ?? true,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const updated = [newClass, ...this.classesSignal()];
    this.classesSignal.set(updated);
    this.saveToCache(updated);

    try {
      const supabasePayload: any = {
        id: newClass.id,
        title: newClass.title,
        subject: newClass.subject,
        standard: newClass.standard,
        teacher_name: newClass.teacher_name,
        teacher_title: newClass.teacher_title,
        teacher_avatar: newClass.teacher_avatar,
        status: newClass.status,
        scheduled_date: newClass.scheduled_date,
        scheduled_time: newClass.scheduled_time,
        duration: newClass.duration,
        thumbnail: newClass.thumbnail,
        attendees_count: newClass.attendees_count,
        has_recording: newClass.has_recording,
        recording_duration: newClass.recording_duration,
        recording_url: newClass.recording_url,
        meeting_link: newClass.meeting_link,
        is_published: newClass.is_published,
        is_active: true,
        created_at: newClass.created_at,
        updated_at: newClass.updated_at
      };

      const { error } = await this.supabase.from('live_classes').insert(supabasePayload);
      if (error) {
        console.warn('Supabase live class insert error:', error.message);
      }
    } catch (e) {
      console.warn('Could not sync new live class to Supabase:', e);
    }

    this.toast.success('Live class session scheduled!');
    return { success: true, data: newClass };
  }

  async updateClass(id: string, updates: Partial<LiveClass>): Promise<{ success: boolean; error?: string }> {
    const current = this.classesSignal();
    const updated = current.map(c => c.id === id ? { ...c, ...updates, updated_at: new Date().toISOString() } : c);
    this.classesSignal.set(updated);
    this.saveToCache(updated);

    try {
      const supabasePayload = {
        ...updates,
        updated_at: new Date().toISOString()
      };
      const { error } = await this.supabase.from('live_classes').update(supabasePayload).eq('id', id);
      if (error) {
        console.warn('Supabase update live class error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase live class update failed:', e);
    }

    this.toast.success('Live class updated! Changes live in student application.');
    return { success: true };
  }

  async setClassStatus(id: string, status: LiveClassStatus): Promise<boolean> {
    const updates: Partial<LiveClass> = { status };
    if (status === 'live') {
      updates.scheduled_date = 'Today, Live Now';
    }
    return (await this.updateClass(id, updates)).success;
  }

  async deleteClass(id: string): Promise<boolean> {
    const updated = this.classesSignal().filter(c => c.id !== id);
    this.classesSignal.set(updated);
    this.saveToCache(updated);

    try {
      const { error } = await this.supabase.from('live_classes').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete live class error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase live class delete failed:', e);
    }

    this.toast.success('Live class session deleted');
    return true;
  }
}

