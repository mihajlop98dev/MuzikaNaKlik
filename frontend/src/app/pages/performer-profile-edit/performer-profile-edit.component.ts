import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { ApiService } from '../../services/api.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performer-profile-edit',
  standalone: true,
  imports: [NgIf, FormsModule],
  templateUrl: './performer-profile-edit.component.html',
})
export class PerformerProfileEditComponent implements OnInit {
  performer?: Performer;
  loading = true;
  saving = false;
  success = false;
  error = '';

  form = {
    stage_name: '',
    type: 'singer' as string,
    city: '',
    genres: '',
    description: '',
    price_from: 0,
  };

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private api: ApiService,
    private router: Router
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getById(session.user.id).subscribe({
        next: (data) => {
          this.performer = data;
          this.form.stage_name = data.stage_name;
          this.form.type = data.type;
          this.form.city = data.city || '';
          this.form.genres = (data.genres || []).join(', ');
          this.form.description = data.description || '';
          this.form.price_from = data.price_from || 0;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.router.navigate(['/moj-nalog/izvodjac']);
        },
      });
    }
  }

  async save() {
    this.saving = true;
    this.error = '';
    this.success = false;

    this.api.put('/performers/me', {
      stage_name: this.form.stage_name,
      type: this.form.type,
      city: this.form.city,
      genres: this.form.genres.split(',').map((g: string) => g.trim()).filter(Boolean),
      description: this.form.description,
      price_from: this.form.price_from,
    }).subscribe({
      next: () => {
        this.success = true;
        this.saving = false;
      },
      error: (err) => {
        this.error = err.error?.error || 'Greška pri čuvanju.';
        this.saving = false;
      },
    });
  }
}
