import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap } from 'rxjs';
import { Performer, PerformerSearchParams } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class PerformerService {
  constructor(
    private api: ApiService,
    private supabase: SupabaseService
  ) {}

  getFeatured(): Observable<Performer[]> {
    return this.api.get<Performer[]>('/performers/featured');
  }

  search(params: PerformerSearchParams): Observable<{ data: Performer[]; count: number }> {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== '' && value !== null) {
        query.set(key, String(value));
      }
    });
    return this.api.get<{ data: Performer[]; count: number }>(`/performers?${query.toString()}`);
  }

  getById(id: string): Observable<Performer> {
    return this.api.get<Performer>(`/performers/${id}`);
  }

  getMyProfile(): Observable<Performer> {
    return this.api.get<Performer>('/performers/me');
  }

  getMedia(performerId: string) {
    return from(this.supabase.client
      .from('performer_media')
      .select('*')
      .eq('performer_id', performerId)
      .order('sort_order')
    ).pipe(map(({ data }) => data || []));
  }

  getAvailability(performerId: string) {
    return from(this.supabase.client
      .from('performer_availability')
      .select('*')
      .eq('performer_id', performerId)
    ).pipe(map(({ data }) => data || []));
  }

  getReviews(performerId: string) {
    return from(this.supabase.client
      .from('reviews')
      .select('*')
      .eq('performer_id', performerId)
      .eq('status', 'visible')
      .order('created_at', { ascending: false })
    ).pipe(map(({ data }) => data || []));
  }
}
