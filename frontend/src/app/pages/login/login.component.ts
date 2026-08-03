import { Component, ChangeDetectorRef, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router, ActivatedRoute } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { SupabaseService } from '../../services/supabase.service';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent implements OnInit {
  email = '';
  password = '';
  error = '';
  notice = '';
  loading = false;

  /** Set when login failed specifically because the email is unconfirmed. */
  needsConfirmation = false;
  resending = false;
  resendDone = false;

  constructor(
    private supabase: SupabaseService,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    const params = this.route.snapshot.queryParams;

    if (params['potvrda'] === 'uspesna') {
      this.notice = 'Email adresa je potvrđena. Sada se možeš prijaviti.';
    } else if (params['registracija'] === 'uspesna') {
      this.notice =
        'Uplata je primljena i nalog je napravljen. Poslali smo ti email — potvrdi adresu pa se prijavi.';
    } else if (params['registracija'] === 'placanje-otkazano') {
      this.notice =
        'Plaćanje je otkazano, ali nalog je napravljen. Potvrdi email iz poruke koju smo ti poslali, pa možeš izabrati paket kasnije.';
    }
  }

  async login() {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';
    this.notice = '';
    this.needsConfirmation = false;
    this.resendDone = false;
    this.cdr.detectChanges();

    const { error } = await this.supabase.signIn(this.email, this.password);

    if (error) {
      // Supabase returns these in English; the account gate is now a normal
      // thing for users to hit, so it needs a real message and a way out.
      const raw = error.message.toLowerCase();

      if (raw.includes('email not confirmed')) {
        this.needsConfirmation = true;
        this.error = 'Email adresa još nije potvrđena. Proveri poruku koju smo ti poslali.';
      } else if (raw.includes('invalid login credentials')) {
        this.error = 'Pogrešan email ili lozinka.';
      } else {
        this.error = error.message;
      }

      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      const { data: profile } = await this.supabase.client
        .from('profiles')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (profile?.role === 'admin') {
        this.router.navigate(['/admin']);
        return;
      }
      if (profile?.role === 'performer') {
        this.router.navigate(['/moj-nalog/izvodjac/dashboard']);
        return;
      }
    }

    this.router.navigate(['/']);
  }

  async resendConfirmation() {
    if (!this.email || this.resending) return;

    this.resending = true;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(
        this.api.post('/auth/resend-confirmation', { email: this.email })
      );
    } catch {
      // The endpoint answers the same way whether or not the address exists,
      // so there is nothing useful to tell the user on failure either.
    }

    this.resending = false;
    this.resendDone = true;
    this.cdr.detectChanges();
  }

  async loginWithGoogle() {
    await this.supabase.signInWithGoogle();
  }
}
