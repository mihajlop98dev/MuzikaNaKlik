import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, map, switchMap, throwError } from 'rxjs';
import { Inquiry, Message } from '../models/performer.model';
import { RealtimeChannel } from '@supabase/supabase-js';

@Injectable({ providedIn: 'root' })
export class MessageService {
  constructor(private supabase: SupabaseService) {}

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

            const recipientId = senderRole === 'performer' ? inquiry.client_id : inquiry.performer_id;
            if (recipientId) {
              const preview = body.length > 80 ? body.slice(0, 80) + '…' : body;
              this.supabase.client
                .from('notifications')
                .insert({
                  user_id: recipientId,
                  type: senderRole === 'performer' ? 'inquiry_reply' : 'new_inquiry',
                  title: senderRole === 'performer' ? 'Nova poruka od izvođača' : 'Nova poruka od klijenta',
                  message: preview,
                  link: senderRole === 'performer' ? '/moji-upiti' : '/moj-nalog/izvodjac/upiti',
                })
                .then(({ error: notifError }) => {
                  if (notifError) console.error('Slanje notifikacije nije uspelo:', notifError);
                });
            }

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
