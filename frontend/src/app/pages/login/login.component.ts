import { Component, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  email = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async login() {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    const { error } = await this.supabase.signIn(this.email, this.password);

    if (error) {
      this.error = error.message;
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

  async loginWithGoogle() {
    await this.supabase.signInWithGoogle();
  }
}
