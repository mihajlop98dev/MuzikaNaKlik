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
  profile_image_url?: string;
  audio_url?: string;
  member_count?: number;
  travel_radius?: string;
  equipment?: string[];
  languages?: string[];
  status: string;
  subscription_status: string;
  search_priority?: number;
  plan_max_images?: number;
  plan_max_videos?: number;
  has_repertoire?: boolean;
  has_availability?: boolean;
  has_review_reply?: boolean;
  has_featured_badge?: boolean;
  has_top_pick_badge?: boolean;
  has_verified_badge?: boolean;
  busy?: boolean;
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
  client_id?: string;
  full_name: string;
  email: string;
  phone?: string;
  event_type?: string;
  event_date?: string;
  location?: string;
  message?: string;
  status?: 'new' | 'read' | 'responded';
  reply?: string;
  replied_at?: string;
  created_at?: string;
  performers?: { stage_name: string };
}

export interface Message {
  id?: string;
  inquiry_id: string;
  sender_id?: string;
  sender_role: 'client' | 'performer';
  body: string;
  created_at?: string;
}

export interface Review {
  id: string;
  performer_id: string;
  client_id: string;
  rating: number;
  comment: string;
  reply?: string;
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
