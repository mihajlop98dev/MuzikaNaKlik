import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { NgFor, NgClass } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor, NgClass],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss'],
})
export class AdminLayoutComponent {
  sidebarOpen = false;

  constructor(private supabase: SupabaseService) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  signOut() {
    this.supabase.signOut();
  }

  navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/korisnici', label: 'Korisnici', icon: '👥' },
    { path: '/admin/pretplate', label: 'Pretplate', icon: '💳' },
    { path: '/admin/recenzije', label: 'Recenzije', icon: '⭐' },
    { path: '/admin/izvestaji', label: 'Izveštaji', icon: '📈' },
    { path: '/admin/aktivnosti', label: 'Aktivnosti', icon: '📋' },
    { path: '/admin/podesavanja', label: 'Podešavanja', icon: '⚙️' },
  ];
}
