import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './contact.component.html',
})
export class ContactComponent {
  form = { name: '', email: '', message: '' };
  sent = false;

  submit() {
    if (this.form.name && this.form.email && this.form.message) {
      this.sent = true;
    }
  }
}
