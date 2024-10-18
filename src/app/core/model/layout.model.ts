import { ThemeHeader, ThemeHeaderType } from '../../features/theme/models';

export interface LayoutState {
  openSidenav: boolean;
  title: string;
  list: {
    [key in ThemeHeaderType]: ThemeHeader[];
  };
}
