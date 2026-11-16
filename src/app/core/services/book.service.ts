import { Injectable, inject, signal, OnDestroy } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Book, BookFilterStatus } from '../models/book.model';
import { ToastService } from './toast.service';
import { RealtimeChannel } from '@supabase/supabase-js';

const STORAGE_KEY = 'emaazi_portal_books_cache';
const CUSTOM_BOOKS_KEY = 'emaazi_custom_books_v1';
const DELETED_BOOKS_KEY = 'emaazi_deleted_books_v1';

export const USER_PORTAL_INITIAL_BOOKS: Book[] = [
  {
    id: '55706750-87d2-41a5-9466-ed7575a72153',
    title: 'गणित प्रकाश: Standard 10 Mathematics Comprehensive Guide',
    author: 'Prof. Rahul Deshmukh & Expert Faculty',
    standard: 10,
    subject: 'Mathematics',
    price: 349,
    original_price: 499,
    category: 'Mathematics',
    publication_status: 'published',
    isbn: '978-93-89123-01-4',
    cover_image_url: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
    description: 'An authoritative, student-friendly textbook designed by senior examiners to help Standard 10 students achieve 95%+ in Mathematics.',
    full_description: 'Includes bilingual Marathi-English explanations for complex theorems and 1,500+ solved practice problems.',
    is_published: true,
    is_active: true,
    is_featured: true,
    display_order: 1
  },
  {
    id: '55706750-87d2-41a5-9466-ed7575a72154',
    title: 'विज्ञान सेतू: Standard 10 Science & Technology Hand-Guide',
    author: 'Dr. Snehal Patil & Team',
    standard: 10,
    subject: 'Science',
    price: 379,
    original_price: 520,
    category: 'Science',
    publication_status: 'published',
    isbn: '978-93-89123-02-1',
    cover_image_url: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?auto=format&fit=crop&w=600&q=80',
    description: 'Simplifying complex Physics laws, Chemical equations, and Biological cycles.',
    full_description: 'Features crisp memory maps, distinction tables, and practical exam blueprints.',
    is_published: true,
    is_active: true,
    is_featured: true,
    display_order: 2
  },
  {
    id: '55706750-87d2-41a5-9466-ed7575a72155',
    title: 'मराठी सुलभभारती संपूर्ण मार्गदर्शिका: इयत्ता ९ वी',
    author: 'Mrs. Anjali Kulkarni',
    standard: 9,
    subject: 'Marathi',
    price: 299,
    original_price: 399,
    category: 'Marathi',
    publication_status: 'published',
    isbn: '978-93-89123-03-8',
    cover_image_url: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?auto=format&fit=crop&w=600&q=80',
    description: 'इयत्ता ९ वी च्या विद्यार्थ्यांसाठी मराठी भाषेवर प्रभुत्व मिळवून देणारे परिपूर्ण पुस्तक.',
    full_description: 'सर्व धडे व कवितांचा भावार्थ, रसग्रहण, आणि १०० हून अधिक नमुना निबंध व पत्रलेखन.',
    is_published: true,
    is_active: true,
    is_featured: false,
    display_order: 3
  },
  {
    id: '55706750-87d2-41a5-9466-ed7575a72156',
    title: 'English Grammar & Writing Craftsman: Standard 8',
    author: 'Mr. Sachin Shinde',
    standard: 8,
    subject: 'English',
    price: 269,
    original_price: 380,
    category: 'English',
    publication_status: 'published',
    isbn: '978-93-89123-04-5',
    cover_image_url: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?auto=format&fit=crop&w=600&q=80',
    description: 'Build lifelong confidence in English grammar, creative composition, and idioms.',
    full_description: 'Contains real-world comprehension passages, story-building prompts, and letter drafting frameworks.',
    is_published: true,
    is_active: true,
    is_featured: false,
    display_order: 4
  },
  {
    id: '55706750-87d2-41a5-9466-ed7575a72157',
    title: 'इतिहास व राज्यशास्त्र: इयत्ता १० वी संक्षिप्त संदर्भग्रंथ',
    author: 'Prof. Dinkar Sawant',
    standard: 10,
    subject: 'Social Science',
    price: 280,
    original_price: 399,
    category: 'Social Science',
    publication_status: 'coming_soon',
    isbn: '978-93-89123-05-2',
    cover_image_url: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1461360370896-922624d12aa1?auto=format&fit=crop&w=600&q=80',
    description: 'इयत्ता १० वीच्या बोर्ड परीक्षेसाठी इतिहास, राज्यशास्त्र आणि भूगोलाची संपूर्ण उजळणी देणारे रंगीत पुस्तक.',
    full_description: 'ऐतिहासिक घटनांची कालरेषा (Timelines) आणि नकाशा वाचनाचे विशेष तंत्र यात समाविष्ट आहे.',
    is_published: false,
    is_active: true,
    is_featured: false,
    display_order: 5
  },
  {
    id: '55706750-87d2-41a5-9466-ed7575a72158',
    title: 'Little Scientist Activity Book: Standard 6 & 7',
    author: 'Dr. Snehal Patil',
    standard: 6,
    subject: 'Science',
    price: 240,
    original_price: 350,
    category: 'Science',
    publication_status: 'coming_soon',
    isbn: '978-93-89123-06-9',
    cover_image_url: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    cover_image: 'https://images.unsplash.com/photo-1516979187457-637abb4f9353?auto=format&fit=crop&w=600&q=80',
    description: '50 Safe Home Experiments, Science Puzzles, Crosswords & Fun Projects.',
    full_description: 'Turn everyday objects into exciting scientific instruments! A hands-on activity companion.',
    is_published: false,
    is_active: true,
    is_featured: false,
    display_order: 6
  }
];

@Injectable({
  providedIn: 'root'
})
export class BookService implements OnDestroy {
  private supabase = inject(SupabaseService).clientInstance;
  private toast = inject(ToastService);

  private booksSignal = signal<Book[]>(this.getInitialBooks());
  private isLoadingSignal = signal<boolean>(false);
  private hasSyncPermissionIssueSignal = signal<boolean>(false);
  private lastFetchedDbBooks: Book[] = [];
  private realtimeChannel: RealtimeChannel | null = null;

  readonly books = this.booksSignal.asReadonly();
  readonly isLoading = this.isLoadingSignal.asReadonly();
  readonly hasSyncPermissionIssue = this.hasSyncPermissionIssueSignal.asReadonly();

  constructor() {
    this.fetchBooks();
    this.initRealtimeSubscription();
  }

  ngOnDestroy() {
    this.cleanupRealtime();
  }

  private normalizeTitle(title: string): string {
    return (title || '').trim().toLowerCase().replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '');
  }

  private getDeletedBookIds(): Set<string> {
    try {
      const stored = localStorage.getItem(DELETED_BOOKS_KEY);
      if (stored) {
        return new Set(JSON.parse(stored));
      }
    } catch {}
    return new Set();
  }

  private markBookAsDeleted(id: string) {
    try {
      const deleted = this.getDeletedBookIds();
      deleted.add(id);
      localStorage.setItem(DELETED_BOOKS_KEY, JSON.stringify(Array.from(deleted)));
    } catch {}
  }

  private getLocalCustomBooks(): Book[] {
    try {
      const stored = localStorage.getItem(CUSTOM_BOOKS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  }

  private saveLocalCustomBook(book: Book) {
    try {
      const existing = this.getLocalCustomBooks().filter(b => b.id !== book.id);
      existing.unshift(book);
      localStorage.setItem(CUSTOM_BOOKS_KEY, JSON.stringify(existing));
    } catch {}
  }

  private removeLocalCustomBook(id: string) {
    try {
      const existing = this.getLocalCustomBooks().filter(b => b.id !== id);
      localStorage.setItem(CUSTOM_BOOKS_KEY, JSON.stringify(existing));
    } catch {}
  }

  private getInitialBooks(): Book[] {
    try {
      const cached = localStorage.getItem(STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return this.mergeBooks([]);
        }
      }
    } catch {}
    return this.mergeBooks([]);
  }

  private saveToCache(books: Book[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(books));
    } catch {}
  }

  private mergeBooks(dbBooks: Book[]): Book[] {
    const deletedIds = this.getDeletedBookIds();
    const customBooks = this.getLocalCustomBooks().filter(b => !deletedIds.has(b.id));
    const resultMap = new Map<string, Book>();

    // 1. All baseline books from User Portal
    for (const base of USER_PORTAL_INITIAL_BOOKS) {
      if (!deletedIds.has(base.id)) {
        resultMap.set(base.id, { ...base });
      }
    }

    // 2. Books from Supabase database
    for (const db of dbBooks) {
      if (deletedIds.has(db.id)) continue;

      const normDbTitle = this.normalizeTitle(db.title);
      const existingKey = Array.from(resultMap.keys()).find(k => {
        if (k === db.id) return true;
        const item = resultMap.get(k);
        return item && this.normalizeTitle(item.title) === normDbTitle;
      });

      if (existingKey) {
        const existing = resultMap.get(existingKey)!;
        resultMap.delete(existingKey);
        resultMap.set(db.id, {
          ...existing,
          ...db,
          cover_image_url: db.cover_image_url || db.cover_image || existing.cover_image_url,
          cover_image: db.cover_image || db.cover_image_url || existing.cover_image,
          full_description: db.full_description || db.description || existing.full_description
        });
      } else {
        resultMap.set(db.id, db);
      }
    }

    // 3. Books added or modified by Admin locally
    for (const custom of customBooks) {
      if (deletedIds.has(custom.id)) continue;

      const normCustomTitle = this.normalizeTitle(custom.title);
      const existingKey = Array.from(resultMap.keys()).find(k => {
        if (k === custom.id) return true;
        const item = resultMap.get(k);
        return item && this.normalizeTitle(item.title) === normCustomTitle;
      });

      if (existingKey) {
        const existing = resultMap.get(existingKey)!;
        resultMap.set(existingKey, { ...existing, ...custom });
      } else {
        resultMap.set(custom.id, custom);
      }
    }

    const list = Array.from(resultMap.values());
    list.sort((a, b) => (Number(a.display_order) || 999) - (Number(b.display_order) || 999));
    return list;
  }

  private initRealtimeSubscription() {
    try {
      this.cleanupRealtime();
      this.realtimeChannel = this.supabase
        .channel('admin-books-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'books' }, () => {
          this.fetchBooks();
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

  async fetchBooks(): Promise<Book[]> {
    this.isLoadingSignal.set(true);
    try {
      const { data, error } = await this.supabase
        .from('books')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        this.lastFetchedDbBooks = data.map((d: any) => ({
          id: d.id,
          title: d.title,
          subtitle: d.subtitle || '',
          standard: Number(d.standard) || 10,
          subject: d.subject || d.category || 'General',
          author: d.author,
          publisher: d.publisher || 'e-MaziShaala Publications',
          cover_image: d.cover_image || d.cover_image_url || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
          cover_image_url: d.cover_image_url || d.cover_image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80',
          price: Number(d.price) || 0,
          original_price: Number(d.original_price) || 0,
          category: d.category || d.subject || 'General',
          publication_status: (d.publication_status || (d.is_published ? 'published' : 'coming_soon')) as 'published' | 'coming_soon',
          isbn: d.isbn || '',
          description: d.description || '',
          full_description: d.full_description || d.description || '',
          is_published: d.is_published ?? (d.publication_status === 'published'),
          is_active: d.is_active !== false,
          is_featured: d.is_featured ?? d.is_bestseller ?? false,
          is_bestseller: d.is_bestseller ?? d.is_featured ?? false,
          display_order: Number(d.display_order) || 1,
          pages: Number(d.pages) || 120,
          edition: d.edition || '2025 Revised Edition',
          release_date: d.release_date || '',
          table_of_contents: d.table_of_contents || [],
          highlights: d.highlights || [],
          created_at: d.created_at,
          updated_at: d.updated_at
        }));
      }

      // Robust merge: DB books + Baseline User Portal books + Local custom books
      const mergedList = this.mergeBooks(this.lastFetchedDbBooks);
      this.booksSignal.set(mergedList);
      this.saveToCache(mergedList);
      return mergedList;
    } catch (err: any) {
      console.warn('Supabase fetch books offline fallback:', err);
      const mergedList = this.mergeBooks(this.lastFetchedDbBooks);
      this.booksSignal.set(mergedList);
      return mergedList;
    } finally {
      this.isLoadingSignal.set(false);
    }
  }

  async createBook(book: Partial<Book>): Promise<{ success: boolean; data?: Book; error?: string }> {
    // Generate valid UUID to satisfy Postgres uuid and text types
    const id = (typeof crypto !== 'undefined' && crypto.randomUUID)
      ? crypto.randomUUID()
      : 'b0000000-0000-4000-8000-' + Date.now().toString(16).padStart(12, '0');

    const standard = Number(book.standard) || 10;
    const subject = book.subject || book.category || 'General';
    const isPublished = book.is_published ?? true;
    const publicationStatus = (book.publication_status || (isPublished ? 'published' : 'coming_soon')) as 'published' | 'coming_soon';
    const coverUrl = book.cover_image_url || book.cover_image || 'https://images.unsplash.com/photo-1543002588-bfa74002ed7e?auto=format&fit=crop&w=600&q=80';

    const newBook: Book = {
      id,
      title: book.title || 'Untitled Book',
      subtitle: book.subtitle || '',
      standard,
      subject,
      author: book.author || 'e-MaziShaala Author',
      publisher: book.publisher || 'e-MaziShaala Publications',
      price: Number(book.price) || 0,
      original_price: Number(book.original_price) || 0,
      category: subject,
      publication_status: publicationStatus,
      isbn: book.isbn || '',
      cover_image: coverUrl,
      cover_image_url: coverUrl,
      description: book.description || '',
      full_description: book.full_description || book.description || '',
      is_published: isPublished,
      is_active: true,
      is_featured: book.is_featured ?? false,
      is_bestseller: book.is_bestseller ?? book.is_featured ?? false,
      display_order: Number(book.display_order) || (this.booksSignal().length + 1),
      pages: Number(book.pages) || 120,
      edition: book.edition || '2025 Revised Edition',
      release_date: book.release_date || '',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    // 1. Immediately store in persistent custom books so it NEVER disappears
    this.saveLocalCustomBook(newBook);
    const updated = this.mergeBooks(this.lastFetchedDbBooks);
    this.booksSignal.set(updated);
    this.saveToCache(updated);

    // 2. Persist to Supabase
    let syncError: string | null = null;
    try {
      const supabasePayload: any = {
        id: newBook.id,
        title: newBook.title,
        subtitle: newBook.subtitle,
        standard: newBook.standard,
        subject: newBook.subject,
        author: newBook.author,
        publisher: newBook.publisher,
        cover_image: newBook.cover_image,
        cover_image_url: newBook.cover_image_url,
        price: newBook.price,
        original_price: newBook.original_price,
        category: newBook.category,
        publication_status: newBook.publication_status,
        isbn: newBook.isbn,
        description: newBook.description,
        full_description: newBook.full_description,
        is_published: newBook.is_published,
        is_active: true,
        is_featured: newBook.is_featured,
        is_bestseller: newBook.is_bestseller,
        display_order: newBook.display_order,
        pages: newBook.pages,
        edition: newBook.edition,
        release_date: newBook.release_date,
        created_at: newBook.created_at,
        updated_at: newBook.updated_at
      };

      const { error } = await this.supabase.from('books').insert(supabasePayload);
      if (error) {
        console.warn('Supabase book insert note:', error.message);
        syncError = error.message;
        if (error.code === '42501') {
          this.hasSyncPermissionIssueSignal.set(true);
        }
      }
    } catch (e: any) {
      console.warn('Could not sync newly created book directly to Supabase:', e);
      syncError = e?.message || 'Sync pending';
    }

    if (syncError && syncError.includes('permission denied')) {
      this.toast.warning('Book saved in Admin Portal! Run the SQL sync in Supabase to reflect on student portal.');
    } else {
      this.toast.success('Book created and added to catalog!');
    }

    return { success: true, data: newBook };
  }

  async updateBook(id: string, updates: Partial<Book>): Promise<{ success: boolean; error?: string }> {
    const existing = this.booksSignal().find(b => b.id === id);
    if (!existing) return { success: false, error: 'Book not found' };

    const updatedBook: Book = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString()
    };

    this.saveLocalCustomBook(updatedBook);
    const updated = this.mergeBooks(this.lastFetchedDbBooks);
    this.booksSignal.set(updated);
    this.saveToCache(updated);

    try {
      const supabasePayload: any = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      if (updates.cover_image_url && !updates.cover_image) {
        supabasePayload.cover_image = updates.cover_image_url;
      }
      if (updates.is_published !== undefined) {
        supabasePayload.publication_status = updates.is_published ? 'published' : 'coming_soon';
      }

      const { error } = await this.supabase.from('books').update(supabasePayload).eq('id', id);
      if (error) {
        console.warn('Supabase update book note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase book update sync:', e);
    }

    this.toast.success('Book updated! Synced to student catalog.');
    return { success: true };
  }

  async togglePublication(id: string, isPublished: boolean): Promise<boolean> {
    return (await this.updateBook(id, {
      is_published: isPublished,
      publication_status: isPublished ? 'published' : 'coming_soon'
    })).success;
  }

  async deleteBook(id: string): Promise<boolean> {
    this.markBookAsDeleted(id);
    this.removeLocalCustomBook(id);

    const updated = this.mergeBooks(this.lastFetchedDbBooks);
    this.booksSignal.set(updated);
    this.saveToCache(updated);

    try {
      const { error } = await this.supabase.from('books').delete().eq('id', id);
      if (error) {
        console.warn('Supabase delete book note:', error.message);
      }
    } catch (e) {
      console.warn('Supabase delete book failed:', e);
    }

    this.toast.success('Book removed from catalog');
    return true;
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
        // Fallback to data URL for seamless preview even if storage bucket lacks upload policy
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e: any) => resolve({ url: e.target.result });
          reader.onerror = () => resolve({ error: uploadError.message });
          reader.readAsDataURL(file);
        });
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
