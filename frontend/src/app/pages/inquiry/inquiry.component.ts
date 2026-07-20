import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { InquiryService } from '../../services/inquiry.service';
import { PerformerService } from '../../services/performer.service';
import { SupabaseService } from '../../services/supabase.service';
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
    private performerService: PerformerService,
    private supabase: SupabaseService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (!session) {
      this.router.navigate(['/prijava']);
      return;
    }

    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/']);
      return;
    }

    this.performerService.getById(id).subscribe({
      next: (data) => {
        this.performer = data;
        this.performerLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.performerLoading = false;
        this.cdr.detectChanges();
        this.router.navigate(['/']);
      },
    });
  }

  async submit() {
    if (!this.form.full_name || !this.form.email) return;

    const { data: { session } } = await this.supabase.getSession();

    this.inquiryService
      .create({
        ...this.form,
        event_date: this.form.event_date || undefined,
        performer_id: this.performer!.id,
        client_id: session?.user.id,
      })
      .subscribe({
        next: () => {
          this.submitted = true;
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.error = err.error?.error || 'Došlo je do greške. Pokušajte ponovo.';
          this.cdr.detectChanges();
        },
      });
  }
}
