import { Theme } from '@acrodata/code-editor';
import {
  ThemeDatasetItem,
  ThemeHeader,
  ThemeHeaderType,
  ThemeHiddenTO,
  ThemeItemMap,
  ThemeLabelItem,
} from '../../features/theme/models';

export interface LayoutState {
  openSidenav: boolean;
  title: string;
  list: Record<ThemeHeaderType, ThemeHeader[]>;
  themeHiddenList: ThemeHiddenTO[];
  themeLabelItemList: ThemeLabelItem[];
  themeDatasetItemList: ThemeDatasetItem[];
  themeLabelItemMapList: ThemeItemMap[];
  themeDatasetItemMapList: ThemeItemMap[];
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
