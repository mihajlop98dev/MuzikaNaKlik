import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-confirm-account',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './confirm-account.component.html',
})
export class ConfirmAccountComponent implements OnInit, OnDestroy {
  loading = true;
  confirmed = false;

  private unsubscribe?: () => void;
  private timeoutId?: ReturnType<typeof setTimeout>;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data } = this.supabase.client.auth.onAuthStateChange((_event, session) => {
      if (session) this.onConfirmed();
    });
    this.unsubscribe = () => data.subscription.unsubscribe();

    const { data: { session } } = await this.supabase.getSession();
    if (session) {
      this.onConfirmed();
      return;
    }

    // Supabase's client can take a moment to exchange the confirmation
    // link's token for a session after the page loads.
    this.timeoutId = setTimeout(() => {
      if (!this.confirmed) {
        this.loading = false;
        this.cdr.detectChanges();
      }
    }, 4000);
  }

  ngOnDestroy() {
    this.unsubscribe?.();
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }

  private onConfirmed() {
    if (this.confirmed) return;
    this.confirmed = true;
    this.loading = false;
    this.cdr.detectChanges();
    setTimeout(() => this.router.navigate(['/']), 1500);
  }
}
