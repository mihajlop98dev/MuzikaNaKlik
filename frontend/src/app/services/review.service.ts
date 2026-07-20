import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Observable, from, switchMap, throwError } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private supabase: SupabaseService) {}

  submitReview(performerId: string, inquiryId: string, rating: number, comment: string): Observable<any> {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) => {
        if (!session?.user.id) return throwError(() => new Error('Not authenticated'));
        return from(
          this.supabase.client
            .from('reviews')
            .insert({
              performer_id: performerId,
              client_id: session.user.id,
              inquiry_id: inquiryId,
              rating,
              comment,
            })
            .select()
            .single()
        );
      }),
      switchMap(({ data, error }: any) => (error ? throwError(() => error) : [data]))
    );
  }
}
