import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { NgFor, NgIf, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-admin-users',
  standalone: true,
  imports: [NgFor, NgIf, DatePipe, FormsModule],
  templateUrl: './admin-users.component.html',
})
export class AdminUsersComponent implements OnInit {
  users: any[] = [];
  filtered: any[] = [];
  loading = true;
  searchTerm = '';
  roleFilter = '';

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchUsers();
  }

  fetchUsers() {
    this.loading = true;
    const params = new URLSearchParams();
    if (this.searchTerm) params.set('search', this.searchTerm);
    if (this.roleFilter) params.set('role', this.roleFilter);

    this.api.get<any[]>(`/admin/users?${params.toString()}`).subscribe({
      next: (data) => { this.users = data; this.filtered = data; this.loading = false; this.cdr.detectChanges(); },
      error: () => { this.loading = false; this.cdr.detectChanges(); },
    });
  }

  search() {
    this.fetchUsers();
  }

  setRole(role: string) {
    this.roleFilter = role;
    this.fetchUsers();
  }
}
