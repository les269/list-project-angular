import {
  signalStore,
  withState,
  withMethods,
  patchState,
  withComputed,
  withHooks,
  withProps,
} from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import {
  ThemeHeader,
  ThemeHeaderType,
  ThemeItemType,
} from '../../features/theme/models';
import { LayoutState } from '../model';
import { computed, inject } from '@angular/core';
import { getHeaderId, getHeaderIdByHeader } from '../../shared/util/helper';
import {
  ThemeHiddenService,
  ThemeItemMapService,
  ThemeItemService,
  ThemeService,
} from '../../features/theme/services';
import { pipe, switchMap, tap } from 'rxjs';
import { Params } from '@angular/router';

const initialState: Readonly<LayoutState> = {
  openSidenav: false,
  title: '',
  list: {
    [ThemeHeaderType.imageList]: [],
    [ThemeHeaderType.table]: [],
  },
  themeHiddenList: [],
  themeLabelItemList: [],
  themeDatasetItemList: [],
  themeLabelItemMapList: [],
  themeDatasetItemMapList: [],
};

export const LayoutStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withProps(() => ({
    themeHiddenService: inject(ThemeHiddenService),
    themeService: inject(ThemeService),
    themeItemService: inject(ThemeItemService),
    themeItemMapService: inject(ThemeItemMapService),
  })),
  withComputed(
    ({
      list,
      themeHiddenList,
      themeLabelItemList,
      themeDatasetItemList,
      themeLabelItemMapList,
      themeDatasetItemMapList,
    }) => ({
      visibleList: computed(() => {
        const rawList = list();
        const hiddenSet = new Set(themeHiddenList().map(h => h.headerId));
        const isVisible = (item: Parameters<typeof getHeaderIdByHeader>[0]) =>
          !hiddenSet.has(getHeaderIdByHeader(item));
        return {
          [ThemeHeaderType.imageList]:
            rawList[ThemeHeaderType.imageList].filter(isVisible),
          [ThemeHeaderType.table]:
            rawList[ThemeHeaderType.table].filter(isVisible),
        } as LayoutState['list'];
      }),
      sortQueryParams: computed(() => {
        const result: Record<string, string> = {};
        const sortMap: Record<string, string> = {};
        for (const label of themeLabelItemList()) {
          const sort = label.json.find(x => x.isSort);
          sortMap[label.itemId] = sort?.byKey ?? '';
        }
        for (const map of themeLabelItemMapList()) {
          result[map.headerId] = sortMap[map.itemId] ?? '';
        }
        return result;
      }),
      datasetQueryParams: computed(() => {
        const result: Record<string, number> = {};
        const datasetMap: Record<string, number> = {};
        for (const item of themeDatasetItemList()) {
          const defaultDataset = item.json.find(x => x.isDefault);
          datasetMap[item.itemId] = defaultDataset ? defaultDataset.seq : 1;
        }
        for (const map of themeDatasetItemMapList()) {
          result[map.headerId] = datasetMap[map.itemId] ?? 1;
        }
        return result;
      }),
    })
  ),
  withMethods(
    ({
      themeHiddenService,
      themeService,
      themeItemService,
      themeItemMapService,
      ...store
    }) => {
      const loadHiddenList = rxMethod<void>(
        pipe(
          switchMap(() => themeHiddenService.getAll()),
          tap(themeHiddenList => patchState(store, { themeHiddenList }))
        )
      );
      return {
        loadHiddenList: loadHiddenList,
        loadThemeList: rxMethod<void>(
          pipe(
            switchMap(() => themeService.getAllThemeMapType()),
            tap(list => patchState(store, { list }))
          )
        ),
        loadThemeLabelItemList: rxMethod<void>(
          pipe(
            switchMap(() =>
              themeItemService.getThemeItemByType(ThemeItemType.LABEL)
            ),
            tap(list => patchState(store, { themeLabelItemList: list }))
          )
        ),
        loadThemeDatasetItemList: rxMethod<void>(
          pipe(
            switchMap(() =>
              themeItemService.getThemeItemByType(ThemeItemType.DATASET)
            ),
            tap(list => patchState(store, { themeDatasetItemList: list }))
          )
        ),
        loadThemeLabelItemMapList: rxMethod<void>(
          pipe(
            switchMap(() =>
              themeItemMapService.getThemeItemMapByType(ThemeItemType.LABEL)
            ),
            tap(list => patchState(store, { themeLabelItemMapList: list }))
          )
        ),
        loadThemeDatasetItemMapList: rxMethod<void>(
          pipe(
            switchMap(() =>
              themeItemMapService.getThemeItemMapByType(ThemeItemType.DATASET)
            ),
            tap(list => patchState(store, { themeDatasetItemMapList: list }))
          )
        ),
        toggleSidenav() {
          patchState(store, state => ({ openSidenav: !state.openSidenav }));
        },
        updateTitle(title: string) {
          patchState(store, { title });
        },
        hasHidden(headerId: string): boolean {
          const themeHiddenList = store.themeHiddenList();
          return themeHiddenList.some(item => item.headerId === headerId);
        },
        changeHidden: rxMethod<string>(
          pipe(
            switchMap(headerId => {
              const exists = store
                .themeHiddenList()
                .some(i => i.headerId === headerId);
              return exists
                ? themeHiddenService.delete(headerId)
                : themeHiddenService.save({ headerId });
            }),
            tap(() => loadHiddenList())
          )
        ),
        getQueryParamsByHeader: (header: ThemeHeader): Params => {
          const headerId = getHeaderIdByHeader(header);
          const sort = store.sortQueryParams()[headerId];
          const dataset = store.datasetQueryParams()[headerId];
          return {
            searchValue: '',
            sort: sort,
            asc: true,
            page: 1,
            dataset: dataset,
            tag: -1,
          };
        },
      };
    }
  ),
  withHooks({
    onInit(store) {
      // Store 初始化時自動執行
      store.loadThemeList();
      store.loadHiddenList();
      store.loadThemeLabelItemList();
      store.loadThemeDatasetItemList();
      store.loadThemeLabelItemMapList();
      store.loadThemeDatasetItemMapList();
    },
  })
);
