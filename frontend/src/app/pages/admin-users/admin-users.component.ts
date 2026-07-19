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
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

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

  hoverRow(event: MouseEvent, enter: boolean) {
    const el = event.currentTarget as HTMLElement;
    if (el) el.style.background = enter ? '#f8f9fa' : '';
  }

  setRole(role: string) {
    this.roleFilter = role;
    this.fetchUsers();
  }

  openUser(user: any) {
    this.selectedUser = { ...user };
    this.subPlanId = '';
    this.subBillingPeriod = 'monthly';
    this.cdr.detectChanges();
  }

  showToast(message: string, type: 'success' | 'error' = 'success') {
    this.toastMessage = message;
    this.toastType = type;
    this.cdr.detectChanges();
    setTimeout(() => { this.toastMessage = ''; this.cdr.detectChanges(); }, 3000);
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
        this.showToast('Korisnik uspešno ažuriran.');
        this.fetchUsers();
        this.closeModal();
      },
      error: () => {
        this.showToast('Greška pri ažuriranju korisnika.', 'error');
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
      next: (res: any) => {
        this.assigningSub = false;
        this.selectedUser.subscription_status = 'active';
        this.showToast(res.updated ? 'Pretplata uspešno ažurirana.' : 'Pretplata uspešno dodeljena.');
        this.cdr.detectChanges();
      },
      error: () => {
        this.assigningSub = false;
        this.showToast('Greška pri dodeli pretplate.', 'error');
      },
    });
  }
}
