import { createFeatureSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { LayoutState } from '../../core/model/layout.model';

export const selectLayout =
  createFeatureSelector<Readonly<LayoutState>>('layoutState');

export const selectLayoutOpen = () =>
  pipe(
    select(selectLayout),
    map(x => x.openSidenav)
  );

export const selectLayoutList = () =>
  pipe(
    select(selectLayout),
    map(x => x.list)
  );
export const selectLayoutTitle = () =>
  pipe(
    select(selectLayout),
    map(x => x.title)
  );
