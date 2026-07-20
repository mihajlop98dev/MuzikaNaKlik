import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
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

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/prijava']);
  }

  navItems = [
    { path: '/admin/dashboard', label: 'Dashboard', icon: '📊' },
    { path: '/admin/izvodjaci', label: 'Izvođači', icon: '🎤' },
    { path: '/admin/korisnici', label: 'Korisnici', icon: '👥' },
    { path: '/admin/pretplate', label: 'Pretplate', icon: '💳' },
    { path: '/admin/recenzije', label: 'Recenzije', icon: '⭐' },
    { path: '/admin/izvestaji', label: 'Izveštaji', icon: '📈' },
    { path: '/admin/aktivnosti', label: 'Aktivnosti', icon: '📋' },
    { path: '/admin/podesavanja', label: 'Podešavanja', icon: '⚙️' },
  ];
}
