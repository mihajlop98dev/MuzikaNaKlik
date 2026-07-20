import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { NotificationService } from '../../services/notification.service';
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
    private notificationService: NotificationService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.user$ = this.supabase.user$;
  }

  ngOnInit() {
    this.sub = this.supabase.user$.subscribe(user => {
      if (user) {
        this.notificationService.getMine().subscribe(data => {
          this.unreadCount = data.filter(n => !n.is_read).length;
          this.cdr.detectChanges();
        });
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/prijava']);
  }
}
