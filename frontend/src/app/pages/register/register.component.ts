import { Component, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './register.component.html',
})
export class RegisterComponent {
  email = '';
  password = '';
  fullName = '';
  error = '';
  loading = false;
  submitted = false;

  constructor(
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async register() {
    if (!this.email || !this.password || !this.fullName) return;
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const { error } = await this.supabase.client.auth.signUp({
      email: this.email,
      password: this.password,
      options: {
        data: { role: 'client', full_name: this.fullName },
        emailRedirectTo: `${window.location.origin}/potvrda-naloga`,
      },
    });

    if (error) {
      this.error = this.translateError(error.message);
      this.loading = false;
      this.cdr.detectChanges();
      return;
    }

    this.submitted = true;
    this.loading = false;
    this.cdr.detectChanges();
  }

  private translateError(message: string): string {
    if (/already registered|already exists/i.test(message)) {
      return 'Nalog sa ovim emailom već postoji. Pokušajte da se prijavite.';
    }
    if (/rate limit/i.test(message)) {
      return 'Previše pokušaja u kratkom roku. Sačekajte malo pa pokušajte ponovo.';
    }
    if (/invalid/i.test(message) && /email/i.test(message)) {
      return 'Email adresa nije validna. Proverite da li je ispravno uneta.';
    }
    if (/password/i.test(message) && /(short|weak|6 char)/i.test(message)) {
      return 'Lozinka je previše kratka (minimalno 6 karaktera).';
    }
    return message;
  }
}
