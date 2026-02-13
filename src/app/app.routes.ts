import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/theme/pages/theme-list/theme-list.component').then(
        mod => mod.ThemeListComponent
      ),
    data: { title: 'title.home', sidenav: true },
  },
  {
    path: 'theme-edit',
    loadComponent: () =>
      import('./features/theme/pages/theme-edit/theme-edit.component').then(
        mod => mod.ThemeEditComponent
      ),
    data: { title: 'title.editTheme' },
  },
  {
    path: 'api-config-list',
    loadComponent: () =>
      import('./features/api-config/page/api-config-list/api-config-list.component').then(
        mod => mod.ApiConfigListComponent
      ),
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
    path: 'scrapy-pagination-list',
    loadComponent: () =>
      import('./features/scrapy/page/scrapy-pagination-list/scrapy-pagination-list.component').then(
        mod => mod.ScrapyPaginationListComponent
      ),
    data: { title: 'title.scrapyPaginationList', sidenav: true },
  },
  {
    path: 'scrapy-pagination-edit',
    loadComponent: () =>
      import('./features/scrapy/page/scrapy-pagination-edit/scrapy-pagination-edit.component').then(
        mod => mod.ScrapyPaginationEditComponent
      ),
    data: { title: 'title.scrapyPaginationEdit' },
  },
  {
    path: 'scrapy-pagination-edit/:name',
    loadComponent: () =>
      import('./features/scrapy/page/scrapy-pagination-edit/scrapy-pagination-edit.component').then(
        mod => mod.ScrapyPaginationEditComponent
      ),
    data: { title: 'title.scrapyPaginationEdit' },
  },
  {
    path: 'dataset-list',
    loadComponent: () =>
      import('./features/dataset/page/dataset-list/dataset-list.component').then(
        mod => mod.DatasetListComponent
      ),
    data: { title: 'title.datasetList', sidenav: true },
  },
  {
    path: 'dataset-edit',
    loadComponent: () =>
      import('./features/dataset/page/dataset-edit/dataset-edit.component').then(
        mod => mod.DatasetEditComponent
      ),
    data: { title: 'title.datasetEdit' },
  },
  {
    path: 'dataset-edit/:name',
    loadComponent: () =>
      import('./features/dataset/page/dataset-edit/dataset-edit.component').then(
        mod => mod.DatasetEditComponent
      ),
    data: { title: 'title.datasetEdit' },
  },
  {
    path: 'group-dataset-list',
    loadComponent: () =>
      import('./features/dataset/page/group-dataset-list/group-dataset-list.component').then(
        mod => mod.GroupDatasetListComponent
      ),
    data: { title: 'title.groupDataset', sidenav: true },
  },
  {
    path: 'group-dataset-edit',
    loadComponent: () =>
      import('./features/dataset/page/group-dataset-edit/group-dataset-edit.component').then(
        mod => mod.GroupDatasetEditComponent
      ),
    data: { title: 'title.groupDatasetEdit' },
  },
  {
    path: 'group-dataset-edit/:name',
    loadComponent: () =>
      import('./features/dataset/page/group-dataset-edit/group-dataset-edit.component').then(
        mod => mod.GroupDatasetEditComponent
      ),
    data: { title: 'title.groupDatasetEdit' },
  },
  {
    path: 'imageList/:name/:version',
    loadComponent: () =>
      import('./features/theme/pages/image-list-view/image-list-view.component').then(
        mod => mod.ImageListViewComponent
      ),
  },
  {
    path: 'table/:name/:version',
    loadComponent: () =>
      import('./features/theme/pages/table-view/table-view.component').then(
        mod => mod.TableViewComponent
      ),
  },
  {
    path: 'replace-value-map',
    loadComponent: () =>
      import('./features/replace-value-map/page/replace-value-map/replace-value-map.component').then(
        mod => mod.ReplaceValueMapComponent
      ),
    data: { title: 'title.replaceValueMap', sidenav: true },
  },
  {
    path: 'setting',
    loadComponent: () =>
      import('./features/setting/page/setting/setting.component').then(
        mod => mod.SettingComponent
      ),
    data: { title: 'title.setting', sidenav: true },
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./features/setting/page/setting-database/setting-database.component').then(
            mod => mod.SettingDatabaseComponent
          ),
        data: { subtitle: 'title.database' },
      },
      {
        path: 'disk',
        loadComponent: () =>
          import('./features/setting/page/disk-management/disk-management.component').then(
            mod => mod.DiskManagementComponent
          ),
        data: { title: 'title.setting', subtitle: 'title.disk' },
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
