import { TestBed } from '@angular/core/testing';
import { BookService } from './book.service';
import { BatchService } from './batch.service';
import { LiveClassService } from './live-class.service';
import { ContentSyncService } from './content-sync.service';
import { SupabaseService } from './supabase.service';
import { ToastService } from './toast.service';

describe('Admin catalog persistence', () => {
  let failure: boolean;
  let stored: any[];
  let successCount: number;
  beforeEach(() => {
    failure = false; stored = []; successCount = 0;
    const client = { from: () => {
      let operation = 'read'; let payload: any;
      const query: any = {
        select: () => query, order: () => query, eq: () => query, single: () => query,
        insert: (value: any) => { operation = 'insert'; payload = value; return query; },
        update: (value: any) => { operation = 'update'; payload = value; return query; },
        delete: () => { operation = 'delete'; return query; },
        then: (resolve: any) => {
          if (failure && operation !== 'read') return Promise.resolve({ data: null, error: { message: 'Write denied' } }).then(resolve);
          if (operation === 'insert') stored = [{ ...payload, id: 'saved' }];
          if (operation === 'update') stored = stored.map(row => ({ ...row, ...payload }));
          if (operation === 'delete') stored = [];
          return Promise.resolve({ data: operation === 'read' ? stored : { ...payload, id: 'saved' }, error: null }).then(resolve);
        }
      }; return query;
    } };
    TestBed.configureTestingModule({ providers: [
      { provide: SupabaseService, useValue: { clientInstance: client } },
      { provide: ContentSyncService, useValue: { watch: () => {} } },
      { provide: ToastService, useValue: { success: () => successCount++, error: () => {} } }
    ] });
  });
  it('does not report failed book writes as successful or add local ghost records', async () => {
    const service = TestBed.inject(BookService); failure = true;
    expect((await service.createBook({ title: 'Denied' })).success).toBe(false);
    expect(service.books()).toEqual([]);
    expect(successCount).toBe(0);
  });
  it('does not remove a book when its database deletion fails', async () => {
    const service = TestBed.inject(BookService);
    await service.createBook({ title: 'Keep' }); failure = true;
    expect(await service.deleteBook('saved')).toBe(false);
    expect(service.books()[0].title).toBe('Keep');
  });
  it('preserves zero prices, seat counts and exact batch statuses', async () => {
    const service = TestBed.inject(BatchService);
    expect((await service.createBatch({ name: 'Free', price: 0, available_seats: 0, status: 'Full' })).success).toBe(true);
    expect(stored[0].status).toBe('full');
    expect(service.batches()[0].available_seats).toBe(0);
  });
  it('rejects invalid lecture schedules before saving', async () => {
    const service = TestBed.inject(LiveClassService);
    expect((await service.createClass({ title: 'Invalid', scheduled_date: 'Today', scheduled_time: 'later' })).success).toBe(false);
    expect(stored).toEqual([]);
  });
});
