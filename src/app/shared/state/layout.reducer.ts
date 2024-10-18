import { createReducer, on } from '@ngrx/store';
import { changeSidenav, updateList, updateTitle } from './layout.actions';
import { LayoutState } from '../../core/model/layout.model';
import { ThemeHeaderType } from '../../features/theme/models';

export const initialState: Readonly<LayoutState> = {
  openSidenav: false,
  title: 'test',
  list: {
    [ThemeHeaderType.imageList]: [],
    [ThemeHeaderType.table]: [],
  },
};

export const LayoutReducer = createReducer(
  initialState,
  on(changeSidenav, state => ({ ...state, openSidenav: !state.openSidenav })),
  on(updateTitle, (state, props) => ({ ...state, title: props.title })),
  on(updateList, (state, props) => ({ ...state, list: props }))
);
