import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AdminGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.supabase.user$.pipe(
      map((user) => {
        if (!user) {
          this.router.navigate(['/prijava']);
          return false;
        }
        const role = user.user_metadata?.['role'];
        if (role !== 'admin') {
          this.router.navigate(['/']);
          return false;
        }
        return true;
      })
    );
  }
}
