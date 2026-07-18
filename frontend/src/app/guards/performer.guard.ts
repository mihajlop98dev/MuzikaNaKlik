import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { from, map, Observable, switchMap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PerformerGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  canActivate(): Observable<boolean> {
    return this.supabase.user$.pipe(
      switchMap((user) => {
        if (!user) {
          this.router.navigate(['/prijava']);
          return from(Promise.resolve(false));
        }
        return from(
          this.supabase.client
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .single()
        ).pipe(
          map(({ data }) => {
            if (data?.role !== 'performer' && data?.role !== 'admin') {
              this.router.navigate(['/']);
              return false;
            }
            return true;
          })
        );
      })
    );
  }
}
