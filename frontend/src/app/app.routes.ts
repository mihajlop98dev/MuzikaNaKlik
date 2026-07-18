import { Routes } from '@angular/router';
import { PerformerGuard } from './guards/performer.guard';
import { AdminGuard } from './guards/admin.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/home/home.component').then((m) => m.HomeComponent),
  },
  {
    path: 'izvodjaci',
    loadComponent: () =>
      import('./pages/performers/performers.component').then(
        (m) => m.PerformersComponent
      ),
  },
  {
    path: 'izvodjac/:id',
    loadComponent: () =>
      import('./pages/performer-profile/performer-profile.component').then(
        (m) => m.PerformerProfileComponent
      ),
  },
  {
    path: 'upit/:id',
    loadComponent: () =>
      import('./pages/inquiry/inquiry.component').then((m) => m.InquiryComponent),
  },
  {
    path: 'prijava',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registracija',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'admin',
    canActivate: [AdminGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/admin-dashboard/admin-dashboard.component').then(
            (m) => m.AdminDashboardComponent
          ),
      },
      {
        path: 'izvodjaci',
        loadComponent: () =>
          import('./pages/admin-performers/admin-performers.component').then(
            (m) => m.AdminPerformersComponent
          ),
      },
      {
        path: 'korisnici',
        loadComponent: () =>
          import('./pages/admin-users/admin-users.component').then(
            (m) => m.AdminUsersComponent
          ),
      },
      {
        path: 'pretplate',
        loadComponent: () =>
          import(
            './pages/admin-subscriptions/admin-subscriptions.component'
          ).then((m) => m.AdminSubscriptionsComponent),
      },
      {
        path: 'recenzije',
        loadComponent: () =>
          import('./pages/admin-reviews/admin-reviews.component').then(
            (m) => m.AdminReviewsComponent
          ),
      },
      {
        path: 'statistika',
        loadComponent: () =>
          import('./pages/admin-stats/admin-stats.component').then(
            (m) => m.AdminStatsComponent
          ),
      },
    ],
  },
  {
    path: 'kontakt',
    loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent),
  },
  {
    path: 'moji-upiti',
    loadComponent: () => import('./pages/client-inquiries/client-inquiries.component').then(m => m.ClientInquiriesComponent),
  },
  {
    path: 'recenzija/:performerId/:inquiryId',
    loadComponent: () => import('./pages/client-review/client-review.component').then(m => m.ClientReviewComponent),
  },
  {
    path: 'moj-nalog/izvodjac',
    canActivate: [PerformerGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/performer-dashboard/performer-dashboard.component').then(
            (m) => m.PerformerDashboardComponent
          ),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/performer-profile-edit/performer-profile-edit.component').then(
            (m) => m.PerformerProfileEditComponent
          ),
      },
      {
        path: 'galerija',
        loadComponent: () =>
          import('./pages/performer-gallery/performer-gallery.component').then(
            (m) => m.PerformerGalleryComponent
          ),
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/performer-profile-edit/performer-profile-edit.component').then(
            (m) => m.PerformerProfileEditComponent
          ),
      },
      {
        path: 'repertoar',
        loadComponent: () => import('./pages/performer-repertoire/performer-repertoire.component').then(m => m.PerformerRepertoireComponent),
      },
      {
        path: 'termini',
        loadComponent: () => import('./pages/performer-availability/performer-availability.component').then(m => m.PerformerAvailabilityComponent),
      },
      {
        path: 'upiti',
        loadComponent: () => import('./pages/performer-inbox/performer-inbox.component').then(m => m.PerformerInboxComponent),
      },
      {
        path: 'pretplata',
        loadComponent: () => import('./pages/performer-subscription/performer-subscription.component').then(m => m.PerformerSubscriptionComponent),
      },
    ],
  },
];
