import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/theme/pages/home/home.component').then(
        mod => mod.HomeComponent
      ),
  },
  {
    path: 'edit',
    loadComponent: () =>
      import('./features/theme/pages/edit-theme/edit-theme.component').then(
        mod => mod.CreateThemeComponent
      ),
  },
  {
    path: 'api-config-list',
    loadComponent: () =>
      import(
        './features/api-config/page/api-config-list/api-config-list.component'
      ).then(mod => mod.ApiConfigListComponent),
  },
  {
    path: 'imageList/:name/:version',
    loadComponent: () =>
      import(
        './features/theme/pages/image-list-view/image-list-view.component'
      ).then(mod => mod.ImageListViewComponent),
  },
];
