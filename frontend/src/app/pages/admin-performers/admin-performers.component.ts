import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin-performers',
  standalone: true,
  imports: [NgFor, NgIf],
  templateUrl: './admin-performers.component.html',
})
export class AdminPerformersComponent implements OnInit {
  performers: any[] = [];
  loading = true;

  constructor(
    private http: HttpClient,
    private supabase: SupabaseService
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    const token = session?.access_token;
    this.http.get<any[]>(`${environment.apiUrl}/admin/performers/pending`, {
      headers: { Authorization: `Bearer ${token}` }
    }).subscribe({
      next: (data) => { this.performers = data; this.loading = false; },
      error: (err) => { console.error(err); this.loading = false; },
    });
  }

  async approve(id: string) {
    const { data: { session } } = await this.supabase.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    this.http.put(`${environment.apiUrl}/admin/performers/${id}`, { status: 'approved' }, { headers }).subscribe({
      next: () => { this.performers = this.performers.filter((p) => p.id !== id); },
    });
  }

  async reject(id: string) {
    const { data: { session } } = await this.supabase.getSession();
    const headers: Record<string, string> = {};
    if (session?.access_token) headers['Authorization'] = `Bearer ${session.access_token}`;
    this.http.put(`${environment.apiUrl}/admin/performers/${id}`, { status: 'rejected' }, { headers }).subscribe({
      next: () => { this.performers = this.performers.filter((p) => p.id !== id); },
    });
  }
}
