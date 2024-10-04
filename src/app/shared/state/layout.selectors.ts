import { createFeatureSelector, createSelector, select } from '@ngrx/store';
import { pipe } from 'rxjs';
import { map } from 'rxjs/operators';
import { LayoutState } from '../../core/model/layout.model';

export const selectLayout =
  createFeatureSelector<Readonly<LayoutState>>('layoutState');

export const selectLayoutByKey = <T>(key: keyof LayoutState) =>
  pipe(
    select(selectLayout),
    map((x) => x[key] as T)
  );
