export interface AppSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  is_public: boolean;
  updated_at?: string;
}

export interface HomepageSectionVisibility {
  books: boolean;
  batches: boolean;
  announcements: boolean;
  featured_books: boolean;
  featured_batches: boolean;
}

