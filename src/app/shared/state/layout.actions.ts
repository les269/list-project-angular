import { createAction, props } from '@ngrx/store';

export const changeSidenav = createAction('change Menu');
export const updateTitle = createAction(
  'update title',
  props<{ title: string }>()
);
