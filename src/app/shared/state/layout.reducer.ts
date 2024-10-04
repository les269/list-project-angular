import { createReducer, on } from '@ngrx/store';
import { changeSidenav, updateTitle } from './layout.actions';
import { LayoutState } from '../../core/model/layout.model';

export const initialState: Readonly<LayoutState> = {
  openSidenav: false,
  title: 'test',
};

export const LayoutReducer = createReducer(
  initialState,
  on(changeSidenav, (state) => ({ ...state, openSidenav: !state.openSidenav })),
  on(updateTitle, (state, props) => ({ ...state, title: props.title }))
);
