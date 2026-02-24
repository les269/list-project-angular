import { ThemeHeader, ThemeHeaderType } from '../../features/theme/models';

export interface LayoutState {
  openSidenav: boolean;
  title: string;
  list: Record<ThemeHeaderType, ThemeHeader[]>;
}

export const myRoutes: { path: string; title: string }[] = [
  {
    path: '',
    title: 'title.home',
  },
  {
    path: 'api-config-list',
    title: 'title.apiConfigList',
  },
];
