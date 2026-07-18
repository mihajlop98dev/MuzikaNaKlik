import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-search-panel',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './search-panel.component.html',
})
export class SearchPanelComponent {
  city = '';
  eventType = '';
  performerType = '';

  constructor(private router: Router) {}

  search() {
    const params: Record<string, string> = {};
    if (this.city) params['city'] = this.city;
    if (this.eventType) params['event_type'] = this.eventType;
    if (this.performerType) params['type'] = this.performerType;
    this.router.navigate(['/izvodjaci'], { queryParams: params });
  }
}
