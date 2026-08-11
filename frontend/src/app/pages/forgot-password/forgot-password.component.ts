import { Component, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
})
export class ForgotPasswordComponent {
  email = '';
  loading = false;
  sent = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  async submit() {
    if (!this.email || this.loading) return;

    this.loading = true;
    this.cdr.detectChanges();

    try {
      await firstValueFrom(this.api.post('/auth/forgot-password', { email: this.email }));
    } catch {
      // The endpoint answers identically whether or not the address exists, so
      // a failure here has nothing useful to add either.
    }

    this.loading = false;
    this.sent = true;
    this.cdr.detectChanges();
  }
}
