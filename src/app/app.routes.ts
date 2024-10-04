import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/theme/pages/home/home.component').then(
        (mod) => mod.HomeComponent
      ),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./features/theme/pages/edit-theme/edit-theme.component').then(
        (mod) => mod.CreateThemeComponent
      ),
  },
];
