import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InquiryService } from '../../services/inquiry.service';
import { PerformerService } from '../../services/performer.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-inquiry',
  standalone: true,
  imports: [NgIf, FormsModule, RouterLink],
  templateUrl: './inquiry.component.html',
})
export class InquiryComponent implements OnInit {
  performer?: Performer;
  performerLoading = true;
  submitted = false;
  error = '';

  form = {
    full_name: '',
    email: '',
    phone: '',
    event_type: '',
    event_date: '',
    location: '',
    message: '',
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private inquiryService: InquiryService,
    private performerService: PerformerService
  ) {}

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.performerService.getById(id).subscribe({
      next: (data) => {
        this.performer = data;
        this.performerLoading = false;
      },
      error: () => {
        this.performerLoading = false;
        this.router.navigate(['/']);
      },
    });
  }

  submit() {
    if (!this.form.full_name || !this.form.email) return;

    this.inquiryService
      .create({ ...this.form, performer_id: this.performer!.id })
      .subscribe({
        next: () => {
          this.submitted = true;
        },
        error: (err) => {
          this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
        },
      });
  }
}
