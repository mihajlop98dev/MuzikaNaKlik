import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-new-password',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './new-password.component.html',
})
export class NewPasswordComponent implements OnInit {
  password = '';
  confirm = '';
  error = '';
  saving = false;
  done = false;

  /** False until the recovery link's session is confirmed to exist. */
  ready = false;
  checking = true;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    // The recovery link lands here with tokens in the URL fragment, which
    // supabase-js consumes on start-up to create a session. That can land a
    // moment after this component does, so a missing session is retried once
    // via the auth state change before giving up.
    const { data: { session } } = await this.supabase.getSession();

    if (session) {
      this.ready = true;
      this.checking = false;
      this.cdr.detectChanges();
      return;
    }

    const { data: sub } = this.supabase.client.auth.onAuthStateChange((_event, s) => {
      if (s) {
        this.ready = true;
        this.checking = false;
        sub.subscription.unsubscribe();
        this.cdr.detectChanges();
      }
    });

    setTimeout(() => {
      if (!this.ready) {
        this.checking = false;
        this.error = 'Link je istekao ili je već iskorišćen. Zatraži novi.';
        this.cdr.detectChanges();
      }
    }, 3000);
  }

  async save() {
    if (this.saving) return;

    if (this.password.length < 6) {
      this.error = 'Lozinka mora imati najmanje 6 karaktera.';
      this.cdr.detectChanges();
      return;
    }

    if (this.password !== this.confirm) {
      this.error = 'Lozinke se ne poklapaju.';
      this.cdr.detectChanges();
      return;
    }

    this.saving = true;
    this.error = '';
    this.cdr.detectChanges();

    const { error } = await this.supabase.updatePassword(this.password);

    if (error) {
      this.error = error.message;
      this.saving = false;
      this.cdr.detectChanges();
      return;
    }

    // Signed out on purpose: the recovery link left an active session, and
    // finishing at the login form proves the new password actually works.
    await this.supabase.signOut();

    this.saving = false;
    this.done = true;
    this.cdr.detectChanges();
  }

  goToLogin() {
    this.router.navigate(['/prijava']);
  }
}
