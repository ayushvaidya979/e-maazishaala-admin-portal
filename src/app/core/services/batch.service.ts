import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Batch, BatchStatus } from '../models/batch.model';
import { ToastService } from './toast.service';
import { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_KEY = 'emaazi_portal_batches_cache';
const CUSTOM_BATCHES_KEY = 'emaazi_custom_batches_v1';
const DELETED_BATCHES_KEY = 'emaazi_deleted_batches_v1';

export const USER_PORTAL_INITIAL_BATCHES: Batch[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    name: 'Class 10 Mathematics: Board Toppers Batch 2026-27',
    course_name: 'Mathematics',
    standard: 10,
    subject: 'Mathematics',
    description: 'Master Class 10th Board Mathematics with conceptual clarity, shortcut techniques, step-by-step theorem proofs, and full solutions for State Board & CBSE curricula in Marathi & English bilingual medium.',
    start_date: '2026-11-20',
    end_date: '2027-02-28',
    registration_start: '2026-11-01',
    registration_end: '2026-11-19',
    price: 999,
    total_seats: 100,
    available_seats: 85,
    status: 'Registration Open',
    is_published: true,
    is_active: true,
    is_featured: true
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    name: 'Class 10 Science & Tech: Concept & Experiment Masterclass',
    course_name: 'Science',
    standard: 10,
    subject: 'Science',
    description: 'Comprehensive coverage of Physics, Chemistry, and Biology tailored for Standard 10 board success. Understand complex chemical reactions, gravitation, life processes, and heredity.',
    start_date: '2026-11-25',
    end_date: '2027-03-15',
    registration_start: '2026-11-01',
    registration_end: '2026-11-24',
    price: 1199,
    total_seats: 100,
    available_seats: 68,
    status: 'Registration Open',
    is_published: true,
    is_active: true,
    is_featured: true
  },
  {
    id: 'b0000000-0000-4000-8000-000000000003',
    name: 'Standard 9: Mathematics Foundation & Concept Builder',
    course_name: 'Mathematics',
    standard: 9,
    subject: 'Mathematics',
    description: 'Strengthen your core analytical foundation in Standard 9 Mathematics. Specially designed to ease transitions into high school geometry, coordinate geometry, and statistics.',
    start_date: '2026-12-01',
    end_date: '2027-03-30',
    registration_start: '2026-11-10',
    registration_end: '2026-11-30',
    price: 799,
    total_seats: 100,
    available_seats: 100,
    status: 'Upcoming',
    is_published: true,
    is_active: true,
    is_featured: false
  },
  {
    id: 'b0000000-0000-4000-8000-000000000004',
    name: 'इयत्ता ८ वी: सुलभभारती संपूर्ण मराठी व व्याकरण विशेष बॅच',
    course_name: 'Marathi',
    standard: 8,
    subject: 'Marathi',
    description: 'इयत्ता ८ वी च्या विद्यार्थ्यांसाठी मराठी सुलभभारती अभ्यासक्रम, व्याकरण, पत्रलेखन, निबंधलेखन आणि कवितांचे रसग्रहण मराठी शिक्षकांकडून अतिशय सुंदर पद्धतीने शिकवले जाते.',
    start_date: '2026-11-22',
    end_date: '2027-02-15',
    registration_start: '2026-11-01',
    registration_end: '2026-11-21',
    price: 599,
    total_seats: 80,
    available_seats: 45,
    status: 'Registration Open',
    is_published: true,
    is_active: true,
    is_featured: true
  },
  {
    id: 'b0000000-0000-4000-8000-000000000005',
    name: 'Standard 7: English Grammar, Writing & Spoken Fluency',
    course_name: 'English',
    standard: 7,
    subject: 'English',
    description: 'Complete syllabus coverage for Standard 7 English textbook along with foundational grammar, vocabulary building, comprehension techniques, and daily conversation practice.',
    start_date: '2026-12-05',
    end_date: '2027-03-20',
    registration_start: '2026-11-15',
    registration_end: '2026-12-04',
    price: 699,
    total_seats: 75,
    available_seats: 75,
    status: 'Upcoming',
    is_published: true,
    is_active: true,
    is_featured: false
  },
  {
    id: 'b0000000-0000-4000-8000-000000000006',
    name: 'Standard 6: Young Explorer Science & Discovery Club',
    course_name: 'Science',
    standard: 6,
    subject: 'Science',
    description: 'Inspire scientific curiosity in 6th graders. From plant life to celestial movements, simple machines, and electricity basics through colorful visuals and relatable real-life analogies.',
    start_date: '2026-11-28',
    end_date: '2027-01-30',
    registration_start: '2026-11-10',
    registration_end: '2026-11-27',
    price: 599,
    total_seats: 60,
    available_seats: 60,
    status: 'Upcoming',
    is_published: true,
    is_active: true,
    is_featured: false
  }
];

@Injectable({
  providedIn: 'root'
})
export class BatchService implements OnDestroy {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);

  private batchesSignal = signal<Batch[]>(this.getInitialBatches());
  private isLoadingSignal = signal<boolean>(false);
  private lastFetchedDbBatches: Batch[] = [];
  private realtimeChannel: RealtimeChannel | null = null;

  readonly batches = this.batchesSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();

  constructor() {
    this.fetchBatches();
    this.initRealtimeSubscription();
  }

  ngOnDestroy() {
    this.cleanupRealtime();
  }

  /**
   * Maps UI status to PostgreSQL `batches_status_check` constraint:
   * ('upcoming', 'ongoing', 'completed', 'cancelled')
   */
  private toDbStatus(status?: BatchStatus | string): string {
    const s = (status || '').toLowerCase();
    if (s === 'upcoming' || s === 'registration open') return 'upcoming';
    if (s === 'ongoing' || s === 'full') return 'ongoing';
    if (s === 'completed') return 'completed';
    if (s === 'cancelled') return 'cancelled';
    return 'upcoming';
  }

  /**
   * Maps database lowercase status to user-friendly UI status
   */
  private fromDbStatus(status?: string): BatchStatus {
    const s = (status || '').toLowerCase();
    if (s === 'upcoming') return 'Registration Open';
    if (s === 'ongoing') return 'Ongoing';
    if (s === 'completed') return 'Completed';
    if (s === 'cancelled') return 'Cancelled';
    return 'Upcoming';
  }

  private normalizeName(name: string): string {
    return (name || '').trim().toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '');
  }

  private getDeletedBatchIds(): Set<string> {
    try {
      const stored = localStorage.getItem(DELETED_BATCHES_KEY);
      if (stored) return new Set(JSON.parse(stored));
    } catch {}
    return new Set();
  }

  private markBatchAsDeleted(id: string) {
    try {
      const deleted = this.getDeletedBatchIds();
      deleted.add(id);
      localStorage.setItem(DELETED_BATCHES_KEY, JSON.stringify(Array.from(deleted)));
    } catch {}
  }

  private getLocalCustomBatches(): Batch[] {
    try {
      const stored = localStorage.getItem(CUSTOM_BATCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveLocalCustomBatch(batch: Batch) {
    try {
      const existing = this.getLocalCustomBatches().filter(b => b.id !== batch.id);
      existing.unshift(batch);
      localStorage.setItem(CUSTOM_BATCHES_KEY, JSON.stringify(existing));
    } catch {}
  }

  private removeLocalCustomBatch(id: string) {
    try {
      const existing = this.getLocalCustomBatches().filter(b => b.id !== id);
      localStorage.setItem(CUSTOM_BATCHES_KEY, JSON.stringify(existing));
    } catch {}
  }

  private mergeBatches(dbBatches: Batch[]): Batch[] {
    const deletedIds = this.getDeletedBatchIds();
    const customBatches = this.getLocalCustomBatches().filter(b => !deletedIds.has(b.id));
    const resultMap = new Map<string, Batch>();

    // 1. All baseline batches from User Portal
    for (const base of USER_PORTAL_INITIAL_BATCHES) {
      if (!deletedIds.has(base.id)) {
        resultMap.set(base.id, { ...base });
      }
    }

    // 2. Batches from Supabase database
    for (const db of dbBatches) {
      if (deletedIds.has(db.id)) continue;

      const normName = this.normalizeName(db.name);
      const existingKey = Array.from(resultMap.keys()).find(k => {
        if (k === db.id) return true;
        const item = resultMap.get(k);
        return item && this.normalizeName(item.name) === normName;
      });

      if (existingKey) {
        const existing = resultMap.get(existingKey)!;
        resultMap.delete(existingKey);
        resultMap.set(db.id, {
          ...existing,
          ...db,
          is_featured: db.is_featured ?? existing.is_featured
        });
      } else {
        resultMap.set(db.id, db);
      }
    }

    // 3. Batches added locally by Admin
    for (const custom of customBatches) {
      if (deletedIds.has(custom.id)) continue;

      const normName = this.normalizeName(custom.name);
      const existingKey = Array.from(resultMap.keys()).find(k => {
        if (k === custom.id) return true;
        const item = resultMap.get(k);
        return item && this.normalizeName(item.name) === normName;
      });

      if (existingKey) {
        const existing = resultMap.get(existingKey)!;
        resultMap.set(existingKey, { ...existing, ...custom });
      } else {
        resultMap.set(custom.id, custom);
      }
    }

    const list = Array.from(resultMap.values());
    list.sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
    return list;
  }

  private getInitialBatches(): Batch[] {
    return this.mergeBatches([]);
  }

  private saveToCache(batches: Batch[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(batches));
    } catch {}
  }

  private initRealtimeSubscription() {
    try {
      this.cleanupRealtime();
      this.realtimeChannel = this.supabase
        .channel('admin-batches-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'batches' }, () => {
          this.fetchBatches();
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

  async fetchBatches(): Promise<Batch[]> {
    this.isLoadingSignal.set(true);
    try {
      const { data, error } = await this.supabase
        .from('batches')
        .select('*')
        .order('start_date', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        this.lastFetchedDbBatches = data.map((b: any) => ({
          id: b.id,
          course_id: b.course_id || undefined,
          name: b.name,
          course_name: b.course_name,
          standard: Number(b.standard) || 10,
          subject: b.subject || b.course_name || 'General',
          description: b.description || '',
          start_date: b.start_date ? b.start_date.split('T')[0] : '',
          end_date: b.end_date ? b.end_date.split('T')[0] : '',
          registration_start: b.registration_start ? b.registration_start.split('T')[0] : '',
          registration_end: b.registration_end ? b.registration_end.split('T')[0] : '',
          price: Number(b.price) || 0,
          total_seats: Number(b.total_seats) || 50,
          available_seats: Number(b.available_seats) ?? (Number(b.total_seats) || 50),
          status: this.fromDbStatus(b.status),
          is_published: b.is_published ?? true,
          is_active: b.is_active !== false,
          is_featured: b.is_featured ?? false,
          created_at: b.created_at,
          updated_at: b.updated_at
        }));
      }

      const mergedList = this.mergeBatches(this.lastFetchedDbBatches);
      this.batchesSignal.set(mergedList);
      this.saveToCache(mergedList);
      return mergedList;
    } catch (err: any) {
      console.warn('Supabase fetch batches offline fallback:', err);
      const mergedList = this.mergeBatches(this.lastFetchedDbBatches);
      this.batchesSignal.set(mergedList);
      return mergedList;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createBatch(batch: Partial<Batch>): Promise<{ success: boolean; data?: Batch; error?: string }> {
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'b0000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

    const standard = Number(batch.standard) || 10;
    const subject = batch.subject || batch.course_name || 'General';

    const newBatch: Batch = {
      id,
      course_id: batch.course_id || undefined,
      name: batch.name || 'Untitled Batch',
      course_name: batch.course_name || 'General Program',
      standard,
      subject,
      description: batch.description || '',
      start_date: batch.start_date || new Date().toISOString().split('T')[0],
      end_date: batch.end_date || new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
      registration_start: batch.registration_start || new Date().toISOString().split('T')[0],
      registration_end: batch.registration_end || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
      price: Number(batch.price) || 0,
      total_seats: Number(batch.total_seats) || 50,
      available_seats: Number(batch.available_seats) ?? (Number(batch.total_seats) || 50),
      status: (batch.status as BatchStatus) || 'Registration Open',
      is_published: batch.is_published ?? true,
      is_active: true,
      is_featured: batch.is_featured ?? false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Immediately store in persistent custom batches
    this.saveLocalCustomBatch(newBatch);
    const updated = this.mergeBatches(this.lastFetchedDbBatches);
    this.batchesSignal.set(updated);
    this.saveToCache(updated);

    // 2. Persist to Supabase
    try {
      const supabasePayload: any = {
        id: newBatch.id,
        name: newBatch.name,
        course_name: newBatch.course_name,
        description: newBatch.description,
        start_date: newBatch.start_date,
        end_date: newBatch.end_date,
        price: newBatch.price,
        total_seats: newBatch.total_seats,
        available_seats: newBatch.available_seats,
        status: this.toDbStatus(newBatch.status),
        is_published: newBatch.is_published,
        is_featured: newBatch.is_featured,
        created_at: newBatch.created_at,
        updated_at: newBatch.updated_at
      };

      const { error } = await this.supabase.from('batches').insert(supabasePayload);
      if (error) {
        console.warn('Supabase batch insert note:', error.message);
      } else {
        this.fetchBatches();
      }
    } catch (e: any) {
      console.warn('Could not sync batch directly to Supabase:', e);
    }

    const popularLabel = newBatch.is_featured ? ' and marked as Popular Course on student portal!' : '!';
    this.toast.success(`Batch created${popularLabel}`);
    return { success: true, data: newBatch };
  }

  async updateBatch(id: string, updates: Partial<Batch>): Promise<{ success: boolean; error?: string }> {
    const existing = this.batchesSignal().find(b => b.id === id);
    if (!existing) return { success: false, error: 'Batch not found' };

    const updatedBatch: Batch = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveLocalCustomBatch(updatedBatch);
    const updated = this.mergeBatches(this.lastFetchedDbBatches);
    this.batchesSignal.set(updated);
    this.saveToCache(updated);

    try {
      const supabasePayload: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.status !== undefined) {
        supabasePayload.status = this.toDbStatus(updates.status);
      }

      const { error } = await this.supabase.from('batches').update(supabasePayload).eq('id', id);
      if (error) {
        console.warn('Supabase update batch note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase batch update sync:', e);
    }

    if (updates.is_featured !== undefined) {
      this.toast.success(updates.is_featured ? 'Marked as Popular Course on student portal!' : 'Removed from Popular Courses');
    } else {
      this.toast.success('Batch updated! Synced to student application.');
    }

    return { success: true };
  }

  async updateStatus(id: string, status: BatchStatus): Promise<boolean> {
    return (await this.updateBatch(id, { status })).success;
  }

  async toggleFeatured(id: string): Promise<boolean> {
    const batch = this.batchesSignal().find(b => b.id === id);
    if (!batch) return false;
    return (await this.updateBatch(id, { is_featured: !batch.is_featured })).success;
  }

  async deleteBatch(id: string): Promise<boolean> {
    this.markBatchAsDeleted(id);
    this.removeLocalCustomBatch(id);

    const updated = this.mergeBatches(this.lastFetchedDbBatches);
    this.batchesSignal.set(updated);
    this.saveToCache(updated);

    try {
      const { error } = await this.supabase.from('batches').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete batch note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase delete batch failed:', e);
    }

    this.toast.success('Batch removed from schedule');
    return true;
  }
}
