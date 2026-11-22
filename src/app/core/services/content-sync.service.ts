import { Injectable, inject, DestroyRef, NgZone } from '@angular/core';
import { SupabaseService } from './supabase.service';

@Injectable({ providedIn: 'root' })
export class ContentSyncService {
  private client = inject(SupabaseService).clientInstance;
  private zone = inject(NgZone);
  private listeners = new Map<string, Set<() => void>>();

  constructor() {
    const notify = (table?: string) => this.zone.run(() => {
      for (const [key, callbacks] of this.listeners) {
        if (!table || table === key) callbacks.forEach(callback => callback());
      }
    });
    const channel = this.client.channel('catalog-revisions')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'content_revisions' },
        event => notify(event.new['table_name']))
      .subscribe(status => { if (status === 'SUBSCRIBED') notify(); });
    const resume = () => { if (document.visibilityState === 'visible') notify(); };
    window.addEventListener('online', resume);
    document.addEventListener('visibilitychange', resume);
    // Recovery for missed events and scheduled content. Do not poll background tabs.
    const timer = setInterval(resume, 30000);
    const { data: { subscription } } = this.client.auth.onAuthStateChange(() => {
      setTimeout(() => notify(), 0);
    });
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      window.removeEventListener('online', resume);
      document.removeEventListener('visibilitychange', resume);
      subscription.unsubscribe();
      void this.client.removeChannel(channel);
    });
  }

  watch(tables: string[], reload: () => Promise<unknown>, owner: DestroyRef): void {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let running = false, pending = false, disposed = false;
    const run = async () => {
      if (disposed) return;
      if (running) { pending = true; return; }
      running = true;
      try { await reload(); } catch (error) { console.warn('Content refresh failed', error); }
      finally {
        running = false;
        if (pending && !disposed) { pending = false; schedule(); }
      }
    };
    const schedule = () => {
      clearTimeout(timer);
      timer = setTimeout(() => void run(), 150);
    };
    for (const table of tables) {
      if (!this.listeners.has(table)) this.listeners.set(table, new Set());
      this.listeners.get(table)!.add(schedule);
    }
    void run();
    owner.onDestroy(() => {
      disposed = true;
      clearTimeout(timer);
      tables.forEach(table => this.listeners.get(table)?.delete(schedule));
    });
  }
}
