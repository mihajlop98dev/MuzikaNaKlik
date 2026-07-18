import { Component, OnInit } from '@angular/core';
import { NgFor, NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';
import { PerformerAvailability } from '../../models/performer.model';

@Component({
  selector: 'app-performer-availability',
  standalone: true,
  imports: [NgFor, NgIf, FormsModule],
  templateUrl: './performer-availability.component.html',
})
export class PerformerAvailabilityComponent implements OnInit {
  dates: PerformerAvailability[] = [];
  loading = true;
  newDate = '';
  newStatus: 'free' | 'booked' = 'free';

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (session?.user.id) {
      this.performerService.getAvailability(session.user.id).subscribe((data) => {
        this.dates = data;
        this.loading = false;
      });
    }
  }

  async addDate() {
    if (!this.newDate) return;
    const { data: { session } } = await this.supabase.getSession();
    if (!session?.user.id) return;

    const { data } = await this.supabase.client
      .from('performer_availability')
      .insert({ performer_id: session.user.id, date: this.newDate, status: this.newStatus })
      .select()
      .single();

    if (data) {
      this.dates.push(data);
    }
    this.newDate = '';
  }

  async toggleStatus(item: PerformerAvailability) {
    const newStatus = item.status === 'free' ? 'booked' : 'free';
    await this.supabase.client
      .from('performer_availability')
      .update({ status: newStatus })
      .eq('id', item.id);

    item.status = newStatus;
  }

  async removeDate(id: string) {
    await this.supabase.client
      .from('performer_availability')
      .delete()
      .eq('id', id);

    this.dates = this.dates.filter((d) => d.id !== id);
  }
}
