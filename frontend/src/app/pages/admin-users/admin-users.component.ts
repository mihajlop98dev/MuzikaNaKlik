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
  selectedUser: any = null;
  roleOptions = ['client', 'performer', 'admin'];
  performerStatusOptions = ['approved', 'pending', 'rejected'];

  subscriptionPlans: any[] = [];
  subPlanId = '';
  subBillingPeriod: 'monthly' | 'yearly' = 'monthly';
  assigningSub = false;

  constructor(
    private api: ApiService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.fetchUsers();
    this.api.get<any[]>('/subscription-plans').subscribe(data => {
      this.subscriptionPlans = data;
    });
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

  openUser(user: any) {
    this.selectedUser = { ...user };
    this.subPlanId = '';
    this.subBillingPeriod = 'monthly';
  }

  closeModal() {
    this.selectedUser = null;
  }

  saveUser() {
    if (!this.selectedUser) return;
    this.api.put(`/admin/users/${this.selectedUser.id}`, {
      role: this.selectedUser.role,
      performer_status: this.selectedUser.performer_status,
    }).subscribe({
      next: () => {
        this.fetchUsers();
        this.closeModal();
      },
      error: () => {
        this.closeModal();
      },
    });
  }

  assignSubscription() {
    if (!this.selectedUser || !this.subPlanId) return;
    this.assigningSub = true;
    this.api.post('/admin/subscriptions', {
      performer_id: this.selectedUser.id,
      plan_id: this.subPlanId,
      billing_period: this.subBillingPeriod,
    }).subscribe({
      next: () => {
        this.assigningSub = false;
        this.selectedUser.subscription_status = 'active';
        this.cdr.detectChanges();
      },
      error: () => {
        this.assigningSub = false;
      },
    });
  }
}
