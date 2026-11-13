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
