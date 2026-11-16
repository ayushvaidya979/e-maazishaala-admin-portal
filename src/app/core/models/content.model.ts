export interface AppContent {
  id: string;
  content_key: string;
  title: string;
  body: string;
  image_url?: string;
  is_published: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface AnnouncementItem {
  id: string;
  title: string;
  message: string;
  is_published: boolean;
  start_date?: string;
  end_date?: string;
  created_at?: string;
}

