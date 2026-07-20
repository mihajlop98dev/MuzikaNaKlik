import { Component, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, Router } from '@angular/router';
import { ApiService } from '../../services/api.service';

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
    private api: ApiService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  register() {
    if (!this.email || !this.password || !this.fullName) return;
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();

    this.api.post('/auth/register/client', {
      email: this.email,
      password: this.password,
      full_name: this.fullName,
    }).subscribe({
      next: () => {
        this.router.navigate(['/prijava']);
      },
      error: (err) => {
        this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
