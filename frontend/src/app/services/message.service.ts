import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { ApiService } from './api.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';
import { Inquiry, Message } from '../models/performer.model';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class MessageService {
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

  getForInquiry(inquiryId: string): Observable<Message[]> {
    return from(
      this.supabase.client
        .from('messages')
        .select('*')
        .eq('inquiry_id', inquiryId)
        .order('created_at', { ascending: true })
    ).pipe(map(({ data }) => data || []));
  }

  send(inquiry: Inquiry, senderRole: 'client' | 'performer', body: string): Observable<Message> {
    return this.currentUserId().pipe(
      switchMap((senderId) =>
        from(
          this.supabase.client
            .from('messages')
            .insert({ inquiry_id: inquiry.id, sender_id: senderId, sender_role: senderRole, body })
            .select()
            .single()
        ).pipe(
          switchMap(({ data, error }) => {
            if (error) return throwError(() => error);

            this.supabase.client
              .from('inquiries')
              .update({ status: senderRole === 'performer' ? 'responded' : 'new' })
              .eq('id', inquiry.id!)
              .then(({ error: statusError }) => {
                if (statusError) console.error('Ažuriranje statusa upita nije uspelo:', statusError);
              });

            // Notification and email are both written server-side by this call.
            // The notification used to be inserted straight from here, but the
            // insert policy accepts anyone, so anything the browser could do an
            // anonymous stranger could do too.
            //
            // Fire-and-forget — the message is already stored, so a failure
            // here must not surface as a failed send.
            this.api
              .post('/notify/inquiry', { inquiry_id: inquiry.id, kind: 'message', preview: body })
              .subscribe({
                error: (err) => console.error('Obaveštavanje o poruci nije uspelo:', err),
              });

            return [data];
          })
        )
      )
    );
  }

  subscribeToInquiry(inquiryId: string, onInsert: (message: Message) => void): RealtimeChannel {
    return this.supabase.client
      .channel(`messages:${inquiryId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `inquiry_id=eq.${inquiryId}` },
        (payload) => onInsert(payload.new as Message)
      )
      .subscribe();
  }
}
