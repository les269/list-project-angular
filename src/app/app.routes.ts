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
    path: 'dataset-list',
    loadComponent: () =>
      import(
        './features/dataset/page/dataset-list/dataset-list.component'
      ).then(mod => mod.DatasetListComponent),
    data: { title: 'title.datasetList', sidenav: true },
  },
  {
    path: 'dataset-edit',
    loadComponent: () =>
      import(
        './features/dataset/page/dataset-edit/dataset-edit.component'
      ).then(mod => mod.DatasetEditComponent),
    data: { title: 'title.datasetEdit' },
  },
  {
    path: 'dataset-edit/:name',
    loadComponent: () =>
      import(
        './features/dataset/page/dataset-edit/dataset-edit.component'
      ).then(mod => mod.DatasetEditComponent),
    data: { title: 'title.datasetEdit' },
  },
  {
    path: 'group-dataset-list',
    loadComponent: () =>
      import(
        './features/dataset/page/group-dataset-list/group-dataset-list.component'
      ).then(mod => mod.GroupDatasetListComponent),
    data: { title: 'title.groupDataset', sidenav: true },
  },
  {
    path: 'group-dataset-edit',
    loadComponent: () =>
      import(
        './features/dataset/page/group-dataset-edit/group-dataset-edit.component'
      ).then(mod => mod.GroupDatasetEditComponent),
    data: { title: 'title.groupDatasetEdit' },
  },
  {
    path: 'group-dataset-edit/:name',
    loadComponent: () =>
      import(
        './features/dataset/page/group-dataset-edit/group-dataset-edit.component'
      ).then(mod => mod.GroupDatasetEditComponent),
    data: { title: 'title.groupDatasetEdit' },
  },
  {
    path: 'imageList/:name/:version',
    loadComponent: () =>
      import(
        './features/theme/pages/image-list-view/image-list-view.component'
      ).then(mod => mod.ImageListViewComponent),
  },
];
