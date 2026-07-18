export interface Performer {
  id: string;
  stage_name: string;
  type: 'singer' | 'band' | 'dj';
  city: string;
  genres: string[];
  description: string;
  price_from: number;
  rating_avg: number;
  rating_count: number;
  avatar_url?: string;
  status: string;
  subscription_status: string;
}

export interface PerformerMedia {
  id: string;
  performer_id: string;
  type: 'image' | 'video';
  url: string;
  sort_order: number;
}

export interface PerformerAvailability {
  id: string;
  date: string;
  status: 'free' | 'booked';
}

export interface Inquiry {
  id?: string;
  performer_id: string;
  full_name: string;
  email: string;
  phone?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  message?: string;
  status?: 'new' | 'read' | 'responded';
  created_at?: string;
}

export interface Review {
  id: string;
  performer_id: string;
  client_id: string;
  rating: number;
  comment: string;
  status: 'visible' | 'hidden';
  created_at: string;
}

export interface PerformerSearchParams {
  city?: string;
  event_date?: string;
  event_type?: string;
  type?: string;
  price_min?: number;
  price_max?: number;
  sort?: string;
  page?: number;
  limit?: number;
}
