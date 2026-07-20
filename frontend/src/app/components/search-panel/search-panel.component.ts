import { Component, OnInit } from '@angular/core';
import { NgIf } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [FormsModule, NgIf],
  templateUrl: './search-panel.component.html',
})
export class SearchPanelComponent implements OnInit {
  city = '';
  eventType = '';
  performerType = '';
  eventDate = '';
  isLoggedIn = false;

  constructor(private router: Router, private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    this.isLoggedIn = !!session;
  }

  search() {
    const params: Record<string, string> = {};
    if (this.city) params['city'] = this.city;
    if (this.eventType) params['event_type'] = this.eventType;
    if (this.performerType) params['type'] = this.performerType;
    if (this.eventDate && this.isLoggedIn) params['event_date'] = this.eventDate;
    this.router.navigate(['/izvodjaci'], { queryParams: params });
  }
}
