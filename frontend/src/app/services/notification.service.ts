import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class NotificationService {
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
          this.supabase.client
            .from('notifications')
            .select('*')
            .eq('user_id', id)
            .order('created_at', { ascending: false })
            .limit(20)
        ).pipe(map(({ data }) => data || []))
      )
    );
  }

  markRead(id: string): Observable<void> {
    return this.currentUserId().pipe(
      switchMap((userId) =>
        from(
          this.supabase.client
            .from('notifications')
            .update({ is_read: true })
            .eq('id', id)
            .eq('user_id', userId)
        ).pipe(map(() => undefined))
      )
    );
  }
}
