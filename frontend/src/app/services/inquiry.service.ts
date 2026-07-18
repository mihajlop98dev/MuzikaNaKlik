import { Injectable } from '@angular/core';
import { ApiService } from './api.service';
import { Observable } from 'rxjs';
import { Inquiry } from '../models/performer.model';

@Injectable({ providedIn: 'root' })
export class InquiryService {
  constructor(private api: ApiService) {}

  create(inquiry: Partial<Inquiry>): Observable<Inquiry> {
    return this.api.post<Inquiry>('/inquiries', inquiry);
  }
}
