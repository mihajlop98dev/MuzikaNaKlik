import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class FavoritesService {
  constructor(private supabase: SupabaseService) {}

  private currentUserId(): Observable<string> {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) =>
        session?.user.id ? [session.user.id] : throwError(() => new Error('Not authenticated'))
      )
    );
  }

  getMine(): Observable<any[]> {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client.from('favorites').select('*, performers(*)').eq('client_id', id)
        ).pipe(map(({ data }) => data || []))
      )
    );
  }

  isFavorited(performerId: string): Observable<boolean> {
    return this.currentUserId().pipe(
      switchMap((clientId) =>
        from(
          this.supabase.client
            .from('favorites')
            .select('id')
            .eq('client_id', clientId)
            .eq('performer_id', performerId)
            .maybeSingle()
        ).pipe(map(({ data }) => !!data))
      )
    );
  }

  toggle(performerId: string): Observable<{ favorited: boolean }> {
    return this.currentUserId().pipe(
      switchMap((clientId) =>
        from(
          this.supabase.client
            .from('favorites')
            .select('id')
            .eq('client_id', clientId)
            .eq('performer_id', performerId)
            .single()
        ).pipe(
          switchMap(({ data: existing }) => {
            if (existing) {
              return from(
                this.supabase.client.from('favorites').delete().eq('id', existing.id)
              ).pipe(map(() => ({ favorited: false })));
            }
            return from(
              this.supabase.client.from('favorites').insert({ client_id: clientId, performer_id: performerId })
            ).pipe(map(() => ({ favorited: true })));
          })
        )
      )
    );
  }
}
