import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  constructor(private api: ApiService) {}

  getClientInquiries(): Observable<any[]> {
    return this.api.get<any[]>('/inquiries/mine');
  }

  submitReview(performerId: string, inquiryId: string, rating: number, comment: string): Observable<any> {
    return this.api.post<any>('/reviews', { performer_id: performerId, inquiry_id: inquiryId, rating, comment });
  }
}
