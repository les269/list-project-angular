import {
  signalStore,
  withState,
  withMethods,
  patchState,
  withComputed,
  withHooks,
  withProps,
} from '@ngrx/signals';
import { ThemeHeaderType } from '../../features/theme/models';
import { LayoutState } from '../model';
import { computed, inject } from '@angular/core';
import { getHeaderIdByHeader } from '../../shared/util/helper';
import {
  ThemeHiddenService,
  ThemeService,
} from '../../features/theme/services';

const initialState: Readonly<LayoutState> = {
  openSidenav: false,
  title: '',
  list: {
    [ThemeHeaderType.imageList]: [],
    [ThemeHeaderType.table]: [],
  },
  themeHiddenList: [],
};

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({
    themeHiddenService: inject(ThemeHiddenService),
    themeService: inject(ThemeService),
  })),
  withMethods(({ themeHiddenService, themeService, ...store }) => ({
    toggleSidenav() {
      patchState(store, state => ({ openSidenav: !state.openSidenav }));
    },
    updateTitle(title: string) {
      patchState(store, { title });
    },
    updateList(list: LayoutState['list']) {
      patchState(store, { list });
    },
    updateHiddenList(themeHiddenList: LayoutState['themeHiddenList']) {
      patchState(store, { themeHiddenList });
    },
    loadHiddenList() {
      themeHiddenService.getAll().subscribe(list => {
        this.updateHiddenList(list);
      });
    },
    loadList() {
      themeService.getAllThemeMapType().subscribe(list => {
        this.updateList(list);
      });
    },
    hasHidden(headerId: string): boolean {
      const themeHiddenList = store.themeHiddenList();
      return themeHiddenList.some(item => item.headerId === headerId);
    },
    changeHidden(headerId: string) {
      const flag = this.hasHidden(headerId);
      if (flag) {
        themeHiddenService.delete(headerId).subscribe(() => {
          this.loadHiddenList();
        });
      } else {
        themeHiddenService.save({ headerId }).subscribe(() => {
          this.loadHiddenList();
        });
      }
    },
  })),
  withComputed(({ list, themeHiddenList }) => ({
    visibleList: computed(() => {
      const _list = list();
      const hiddenSet = new Set(themeHiddenList().map(h => h.headerId));
      const isVisible = (item: Parameters<typeof getHeaderIdByHeader>[0]) =>
        !hiddenSet.has(getHeaderIdByHeader(item));
      return {
        [ThemeHeaderType.imageList]:
          _list[ThemeHeaderType.imageList].filter(isVisible),
        [ThemeHeaderType.table]: _list[ThemeHeaderType.table].filter(isVisible),
      } as LayoutState['list'];
    }),
  })),
  withHooks({
    onInit(store) {
      // Store 初始化時自動執行
      store.loadList();
      store.loadHiddenList();
    },
  })
);
