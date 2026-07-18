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
  role: 'client' | 'performer' = 'client';
  stageName = '';
  performerType = '';
  error = '';
  loading = false;

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async register() {
    if (!this.email || !this.password) return;

    this.loading = true;
    this.error = '';

    const metadata: Record<string, any> = { role: this.role };

    if (this.role === 'performer') {
      if (!this.stageName) {
        this.error = 'Umetničko ime je obavezno.';
        this.loading = false;
        return;
      }
      metadata['stage_name'] = this.stageName;
      metadata['type'] = this.performerType || 'singer';
    }

    const { error } = await this.supabase.signUp(this.email, this.password, metadata);

    if (error) {
      this.error = error.message;
      this.loading = false;
      return;
    }

    this.router.navigate(['/prijava']);
  }
}
