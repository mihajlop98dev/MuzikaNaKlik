import { Routes } from '@angular/router';

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
    path: 'prijava',
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'registracija',
    loadComponent: () =>
      import('./pages/register/register.component').then((m) => m.RegisterComponent),
  },
];
