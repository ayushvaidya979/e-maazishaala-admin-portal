export type LiveClassStatus = 'live' | 'upcoming' | 'completed';

export interface LiveClass {
  id: string;
  title: string;
  subject: string;
  standard: number;
  teacher_name: string;
  teacher_avatar?: string;
  teacher_title?: string;
  status: LiveClassStatus;
  scheduled_date: string;
  scheduled_time: string;
  duration?: string;
  thumbnail?: string;
  attendees_count?: number;
  has_recording?: boolean;
  recording_duration?: string;
  recording_url?: string;
  meeting_link?: string;
  is_published?: boolean;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

