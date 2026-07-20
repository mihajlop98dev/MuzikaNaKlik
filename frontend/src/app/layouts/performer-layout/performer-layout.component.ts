import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart } from '@angular/router';
import { NgFor } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { PerformerService } from '../../services/performer.service';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

const BASE_NAV_ITEMS: NavItem[] = [
  { path: '/moj-nalog/izvodjac/dashboard', label: 'Dashboard', icon: '📊' },
  { path: '/moj-nalog/izvodjac/profil', label: 'Uredi profil', icon: '✏️' },
  { path: '/moj-nalog/izvodjac/galerija', label: 'Galerija', icon: '🖼️' },
  { path: '/moj-nalog/izvodjac/video', label: 'Video', icon: '🎥' },
];

const REPERTOIRE_ITEM: NavItem = { path: '/moj-nalog/izvodjac/repertoar', label: 'Repertoar', icon: '🎵' };

const TAIL_NAV_ITEMS: NavItem[] = [
  { path: '/moj-nalog/izvodjac/termini', label: 'Slobodni termini', icon: '📅' },
  { path: '/moj-nalog/izvodjac/upiti', label: 'Primljeni upiti', icon: '📨' },
  { path: '/moj-nalog/izvodjac/pretplata', label: 'Pretplata', icon: '💳' },
];

@Component({
  selector: 'app-performer-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgFor],
  templateUrl: './performer-layout.component.html',
  styleUrls: ['./performer-layout.component.scss'],
})
export class PerformerLayoutComponent implements OnInit {
  sidebarOpen = false;
  navItems: NavItem[] = [...BASE_NAV_ITEMS, ...TAIL_NAV_ITEMS];

  constructor(
    private supabase: SupabaseService,
    private performerService: PerformerService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    const { data: { session } } = await this.supabase.getSession();
    if (!session?.user.id) return;
    this.performerService.getById(session.user.id).subscribe((performer) => {
      if (performer.has_repertoire) {
        this.navItems = [...BASE_NAV_ITEMS, REPERTOIRE_ITEM, ...TAIL_NAV_ITEMS];
        this.cdr.detectChanges();
      }
    });

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart && this.sidebarOpen) {
        this.sidebarOpen = false;
        this.cdr.detectChanges();
      }
    });
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
    this.cdr.detectChanges();
  }

  async signOut() {
    await this.supabase.signOut();
    this.router.navigate(['/prijava']);
  }
}
