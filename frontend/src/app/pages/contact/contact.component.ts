import { Component, ChangeDetectorRef } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { firstValueFrom } from 'rxjs';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  form = { name: '', email: '', message: '' };
  sent = false;
  sending = false;
  error = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  /**
   * Previously this only set `sent = true` — the confirmation appeared and the
   * message went nowhere, so anyone writing in believed they had reached
   * someone. It now actually posts, and only claims success when the server
   * says the mail went out.
   */
  async submit() {
    if (!this.form.name || !this.form.email || !this.form.message || this.sending) return;

    this.sending = true;
    this.error = '';
    this.cdr.detectChanges();

    try {
      await firstValueFrom(this.api.post('/contact', this.form));
      this.sent = true;
    } catch (err: any) {
      this.error =
        err?.error?.error || 'Slanje nije uspelo. Piši nam direktno na vvkdigital@muzikanaklik.com';
    }

    this.sending = false;
    this.cdr.detectChanges();
  }
}
