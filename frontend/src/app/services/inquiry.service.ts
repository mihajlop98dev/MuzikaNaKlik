import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ApiService } from './api.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';
import { Inquiry } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  constructor(
    private supabase: SupabaseService,
    private api: ApiService
  ) {}

  private currentUserId(): Observable<string> {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) =>
        session?.user.id ? [session.user.id] : throwError(() => new Error('Not authenticated'))
      )
    );
  }

  create(inquiry: Partial<Inquiry>): Observable<Inquiry> {
    return from(
      // .select().single() so the new row's id is available — the email
      // notification below is keyed on it.
      this.supabase.client.from('inquiries').insert(inquiry).select().single()
    ).pipe(
      switchMap(({ data, error }) => {
        if (error) return throwError(() => error);

        // Both the in-app notification and the email are written server-side by
        // this call. The notification used to be inserted from here, but the
        // insert policy accepts anyone, so anything the browser can do an
        // anonymous stranger can do too.
        //
        // Fire-and-forget: the inquiry is already saved, so a failure here must
        // not read to the client as a failed submission.
        this.api
          .post('/notify/inquiry', { inquiry_id: data.id, kind: 'inquiry' })
          .subscribe({
            error: (err) => console.error('Obaveštavanje o upitu nije uspelo:', err),
          });

        return [data as Inquiry];
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
