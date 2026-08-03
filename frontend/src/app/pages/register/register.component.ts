import { Component, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

  /** Swaps the form for the "check your inbox" screen once the account exists. */
  registered = false;

  constructor(
    private api: ApiService,
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
      // Deliberately no redirect to /prijava: login is gated on a confirmed
      // email, so sending them straight to a form they cannot use yet reads as
      // a broken registration. The inbox prompt is the actual next step.
      next: () => {
        this.registered = true;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });
  }
}
