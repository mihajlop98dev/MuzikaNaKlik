import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { Performer } from '../../models/performer.model';

@Component({
  selector: 'app-performer-dashboard',
  standalone: true,
  imports: [NgIf, RouterLink],
  templateUrl: './performer-dashboard.component.html',
})
export class PerformerDashboardComponent implements OnInit {
  performer?: Performer;
  loading = true;

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getById(session.user.id).subscribe({
        next: (data) => {
          this.performer = data;
          this.loading = false;
        },
        error: () => (this.loading = false),
      });
    }
  }
}
