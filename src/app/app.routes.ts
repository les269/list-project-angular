import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/theme/pages/home/home.component').then(
        mod => mod.HomeComponent
      ),
    data: { title: 'title.home', sidenav: true },
  },
  {
    path: 'theme-edit',
    loadComponent: () =>
      import('./features/theme/pages/edit-theme/edit-theme.component').then(
        mod => mod.CreateThemeComponent
      ),
    data: { title: 'title.editTheme' },
  },
  {
    path: 'api-config-list',
    loadComponent: () =>
      import(
        './features/api-config/page/api-config-list/api-config-list.component'
      ).then(mod => mod.ApiConfigListComponent),
    data: { title: 'title.apiConfigList', sidenav: true },
  },
  {
    path: 'scrapy-list',
    loadComponent: () =>
      import('./features/scrapy/page/scrapy-list/scrapy-list.component').then(
        mod => mod.ScrapyListComponent
      ),
    data: { title: 'title.scrapyList', sidenav: true },
  },
  {
    path: 'scrapy-edit',
    loadComponent: () =>
      import('./features/scrapy/page/scrapy-edit/scrapy-edit.component').then(
        mod => mod.ScrapyEditComponent
      ),
    data: { title: 'title.scrapyEdit' },
  },
  {
    path: 'scrapy-edit/:name',
    loadComponent: () =>
      import('./features/scrapy/page/scrapy-edit/scrapy-edit.component').then(
        mod => mod.ScrapyEditComponent
      ),
    data: { title: 'title.scrapyEdit' },
  },
  {
    path: 'imageList/:name/:version',
    loadComponent: () =>
      import(
        './features/theme/pages/image-list-view/image-list-view.component'
      ).then(mod => mod.ImageListViewComponent),
  },
];
