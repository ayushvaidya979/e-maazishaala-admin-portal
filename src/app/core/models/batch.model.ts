export type BatchStatus =
  | 'Upcoming'
  | 'Registration Open'
  | 'Full'
  | 'Ongoing'
  | 'Completed'
  | 'Cancelled';

export interface Batch {
  id: string;
  course_id?: string;
  name: string;
  course_name: string;
  standard?: number;
  subject?: string;
  description?: string;
  start_date: string;
  end_date: string;
  registration_start: string;
  registration_end: string;
  price: number;
  total_seats: number;
  available_seats: number;
  status: BatchStatus;
  is_published: boolean;
  is_featured: boolean;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
}

