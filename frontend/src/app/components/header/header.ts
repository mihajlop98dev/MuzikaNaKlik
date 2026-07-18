import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { ApiService } from '../../services/api.service';
import { NgIf, AsyncPipe } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './header.html',
})
export class HeaderComponent implements OnInit, OnDestroy {
  user$;
  unreadCount = 0;
  private sub?: Subscription;

  constructor(
    private supabase: SupabaseService,
    private api: ApiService,
  ) {
    this.user$ = this.supabase.user$;
  }

  ngOnInit() {
    this.sub = this.supabase.user$.subscribe(user => {
      if (user) {
        this.api.get<any[]>('/notifications').subscribe(data => {
          this.unreadCount = data.filter(n => !n.is_read).length;
        });
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async signOut() {
    await this.supabase.signOut();
  }
}
