import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { environment } from '../../../environments/environment';
import { SupabaseService } from '../../services/supabase.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-performers',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './admin-performers.component.html',
})
export class AdminPerformersComponent implements OnInit {
  performers: any[] = [];
  loading = true;
  private token: string | null = null;

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (!session?.access_token) {
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }
    this.token = session.access_token;
    this.fetchPending();
  }

  private fetchPending() {
    this.http.get<any[]>(`${environment.apiUrl}/admin/performers/pending`, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: (data) => { this.performers = data; this.loading = false; this.cdr.detectChanges(); },
      error: (err) => { console.error(err); this.loading = false; this.cdr.detectChanges(); },
    });
  }

  approve(id: string) {
    this.http.put(`${environment.apiUrl}/admin/performers/${id}`, { status: 'approved' }, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: () => { this.performers = this.performers.filter((p) => p.id !== id); this.cdr.detectChanges(); },
    });
  }

  reject(id: string) {
    this.http.put(`${environment.apiUrl}/admin/performers/${id}`, { status: 'rejected' }, {
      headers: { Authorization: `Bearer ${this.token}` }
    }).subscribe({
      next: () => { this.performers = this.performers.filter((p) => p.id !== id); this.cdr.detectChanges(); },
    });
  }
}
