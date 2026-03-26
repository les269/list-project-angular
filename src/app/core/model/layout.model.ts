import {
  ThemeHeader,
  ThemeHeaderType,
  ThemeHiddenTO,
} from '../../features/theme/models';

export interface LayoutState {
  openSidenav: boolean;
  title: string;
  list: Record<ThemeHeaderType, ThemeHeader[]>;
  themeHiddenList: ThemeHiddenTO[];
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
