import { createAction, props } from '@ngrx/store';
import { ThemeHeader, ThemeHeaderType } from '../../features/theme/models';

export const changeSidenav = createAction('change Menu');
export const updateTitle = createAction(
  'update title',
  props<{ title: string }>()
);
export const updateList = createAction(
  'update list',
  props<Record<ThemeHeaderType, ThemeHeader[]>>()
);
