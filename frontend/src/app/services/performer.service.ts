import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';
import { Performer, PerformerSearchParams } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class PerformerService {
  constructor(private supabase: SupabaseService) {}

  private currentUserId(): Observable<string> {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) =>
        session?.user.id ? [session.user.id] : throwError(() => new Error('Not authenticated'))
      )
    );
  }

  getFeatured(): Observable<Performer[]> {
    return from(
      this.supabase.client
        .from('performers')
        .select('*')
        .eq('status', 'approved')
        .eq('subscription_status', 'active')
        .order('search_priority', { ascending: false })
        .order('rating_count', { ascending: false })
        .limit(6)
    ).pipe(map(({ data }) => data || []));
  }

  search(params: PerformerSearchParams): Observable<{ data: Performer[]; count: number }> {
    const page = params.page || 1;
    const limit = params.limit || 12;
    const offset = (page - 1) * limit;

    let query = this.supabase.client
      .from('performers')
      .select('*', { count: 'exact' })
      .eq('status', 'approved')
      .eq('subscription_status', 'active');

    if (params.city) query = query.ilike('city', `%${params.city}%`);
    if (params.type) query = query.eq('type', params.type);
    if (params.price_min && params.price_min > 0) query = query.gte('price_from', params.price_min);
    if (params.price_max && params.price_max < 99999) query = query.lte('price_from', params.price_max);

    query = query.order('search_priority', { ascending: false });

    switch (params.sort) {
      case 'price_asc':
        query = query.order('price_from', { ascending: true });
        break;
      case 'price_desc':
        query = query.order('price_from', { ascending: false });
        break;
      case 'rating':
        query = query.order('rating_avg', { ascending: false });
        break;
      default:
        query = query.order('rating_count', { ascending: false });
    }

    query = query.range(offset, offset + limit - 1);

    return from(query).pipe(
      switchMap(({ data, count, error }) => {
        if (error) return throwError(() => error);
        const performers = data || [];
        if (!params.event_date || performers.length === 0) {
          return [{ data: performers, count: count || 0 }];
        }
        return from(
          this.supabase.client
            .from('performer_availability')
            .select('performer_id')
            .in('performer_id', performers.map((p) => p.id))
            .eq('date', params.event_date)
            .eq('status', 'booked')
        ).pipe(
          map(({ data: busyRows }) => {
            const busyIds = new Set((busyRows || []).map((r) => r.performer_id));
            return {
              data: performers.map((p) => ({ ...p, busy: busyIds.has(p.id) })),
              count: count || 0,
            };
          })
        );
      })
    );
  }

  getById(id: string): Observable<Performer> {
    return from(
      this.supabase.client.from('performers').select('*').eq('id', id).single()
    ).pipe(
      switchMap(({ data, error }) =>
        error || !data ? throwError(() => error || new Error('Performer not found')) : [data]
      )
    );
  }

  getMyProfile(): Observable<Performer> {
    return this.currentUserId().pipe(switchMap((id) => this.getById(id)));
  }

  updateMyProfile(fields: Partial<Performer>): Observable<Performer> {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client.from('performers').update(fields).eq('id', id).select().single()
        ).pipe(
          switchMap(({ data, error }) => (error ? throwError(() => error) : [data]))
        )
      )
    );
  }

  getMedia(performerId: string) {
    return from(
      this.supabase.client
        .from('performer_media')
        .select('*')
        .eq('performer_id', performerId)
        .order('sort_order')
    ).pipe(map(({ data }) => data || []));
  }

  addMedia(type: 'image' | 'video', url: string) {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client
            .from('performer_media')
            .insert({ performer_id: id, type, url, sort_order: 0 })
            .select()
            .single()
        ).pipe(switchMap(({ data, error }) => (error ? throwError(() => error) : [data])))
      )
    );
  }

  deleteMedia(mediaId: string) {
    return from(
      this.supabase.client.from('performer_media').delete().eq('id', mediaId)
    ).pipe(switchMap(({ error }) => (error ? throwError(() => error) : [undefined])));
  }

  getAvailability(performerId: string) {
    return from(
      this.supabase.client.from('performer_availability').select('*').eq('performer_id', performerId)
    ).pipe(map(({ data }) => data || []));
  }

  getReviews(performerId: string) {
    return from(
      this.supabase.client
        .from('reviews')
        .select('*')
        .eq('performer_id', performerId)
        .eq('status', 'visible')
        .order('created_at', { ascending: false })
    ).pipe(map(({ data }) => data || []));
  }

  getPerformerPhone(performerId: string): Observable<string | null> {
    return from(
      this.supabase.client.from('profiles').select('phone').eq('id', performerId).single()
    ).pipe(map(({ data }) => data?.phone || null));
  }

  getSubscriptions() {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client
            .from('subscriptions')
            .select('*, subscription_plans(name)')
            .eq('performer_id', id)
            .order('created_at', { ascending: false })
        ).pipe(map(({ data }) => data || []))
      )
    );
  }
}
