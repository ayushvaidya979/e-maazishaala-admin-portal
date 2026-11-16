export interface Book {
  id: string;
  title: string;
  subtitle?: string;
  standard?: number;
  subject?: string;
  author: string;
  publisher?: string;
  cover_image?: string;
  cover_image_url?: string;
  price: number;
  original_price?: number;
  category: string;
  publication_status?: 'published' | 'coming_soon';
  is_published: boolean;
  is_active?: boolean;
  release_date?: string;
  pages?: number;
  edition?: string;
  isbn?: string;
  description?: string;
  full_description?: string;
  table_of_contents?: string[];
  highlights?: string[];
  is_bestseller?: boolean;
  is_featured: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
}

export type BookFilterStatus = 'all' | 'published' | 'draft';


