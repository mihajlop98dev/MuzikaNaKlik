import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';
import { Inquiry } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  constructor(private supabase: SupabaseService) {}

  private currentUserId(): Observable<string> {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) =>
        session?.user.id ? [session.user.id] : throwError(() => new Error('Not authenticated'))
      )
    );
  }

  create(inquiry: Partial<Inquiry>): Observable<Inquiry> {
    // No .select() here on purpose: a guest submitter has no SELECT policy
    // that makes their own just-created inquiry visible (no client_id to
    // match), so requesting the row back via RETURNING fails RLS even
    // though the INSERT itself is fully permitted. The caller only needs
    // to know it succeeded.
    return from(
      this.supabase.client.from('inquiries').insert(inquiry)
    ).pipe(
      switchMap(({ error }) => {
        if (error) return throwError(() => error);
        this.supabase.client
          .from('notifications')
          .insert({
            user_id: inquiry.performer_id,
            type: 'new_inquiry',
            title: 'Novi upit',
            message: `Imate novi upit od ${inquiry.full_name} za ${inquiry.event_type || 'događaj'}.`,
            link: '/moj-nalog/izvodjac/upiti',
          })
          .then(({ error: notifError }) => {
            if (notifError) console.error('Slanje notifikacije o novom upitu nije uspelo:', notifError);
          });
        return [inquiry as Inquiry];
      })
    );
  }

  getMine(): Observable<Inquiry[]> {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client
            .from('inquiries')
            .select('*, performers(stage_name)')
            .eq('client_id', id)
            .order('created_at', { ascending: false })
        ).pipe(map(({ data }) => data || []))
      )
    );
  }

  getMyInquiries(): Observable<Inquiry[]> {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client
            .from('inquiries')
            .select('*')
            .eq('performer_id', id)
            .order('created_at', { ascending: false })
        ).pipe(map(({ data }) => data || []))
      )
    );
  }

  updateStatus(inquiryId: string, status: string): Observable<Inquiry> {
    return this.currentUserId().pipe(
      switchMap((id) =>
        from(
          this.supabase.client
            .from('inquiries')
            .update({ status })
            .eq('id', inquiryId)
            .eq('performer_id', id)
            .select()
            .single()
        ).pipe(switchMap(({ data, error }) => (error ? throwError(() => error) : [data])))
      )
    );
  }

  getById(inquiryId: string): Observable<Inquiry> {
    return from(
      this.supabase.client
        .from('inquiries')
        .select('*, performers(stage_name)')
        .eq('id', inquiryId)
        .single()
    ).pipe(switchMap(({ data, error }) => (error ? throwError(() => error) : [data])));
  }
}
