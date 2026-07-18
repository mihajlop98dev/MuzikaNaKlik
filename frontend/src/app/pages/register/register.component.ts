import { Component } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
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

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async register() {
    if (!this.email || !this.password || !this.fullName) return;
    this.loading = true;
    this.error = '';

    const { error } = await this.supabase.signUp(this.email, this.password, {
      role: 'client',
      full_name: this.fullName,
    });

    if (error) {
      this.error = error.message;
      this.loading = false;
      return;
    }

    this.router.navigate(['/prijava']);
  }
}
