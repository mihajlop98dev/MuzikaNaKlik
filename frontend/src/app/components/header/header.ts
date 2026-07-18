import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { NgIf, AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, NgIf, AsyncPipe],
  templateUrl: './header.html',
})
export class HeaderComponent {
  user$;

  constructor(private supabase: SupabaseService) {
    this.user$ = this.supabase.user$;
  }

  async signOut() {
    await this.supabase.signOut();
  }
}
