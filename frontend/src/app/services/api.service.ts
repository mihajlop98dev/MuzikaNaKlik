import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SupabaseService } from './supabase.service';
import { switchMap, from } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ApiService {
  constructor(
    private http: HttpClient,
    private supabase: SupabaseService
  ) {}

  private getHeaders() {
    return from(this.supabase.getSession()).pipe(
      switchMap(({ data: { session } }) => {
        const headers: Record<string, string> = {};
        if (session?.access_token) {
          headers['Authorization'] = `Bearer ${session.access_token}`;
        }
        return [new HttpHeaders(headers)];
      })
    );
  }

  get<T>(path: string) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.get<T>(`${environment.apiUrl}${path}`, { headers })
      )
    );
  }

  post<T>(path: string, body: any) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.post<T>(`${environment.apiUrl}${path}`, body, { headers })
      )
    );
  }

  put<T>(path: string, body: any) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.put<T>(`${environment.apiUrl}${path}`, body, { headers })
      )
    );
  }

  delete<T>(path: string) {
    return this.getHeaders().pipe(
      switchMap((headers) =>
        this.http.delete<T>(`${environment.apiUrl}${path}`, { headers })
      )
    );
  }
}
