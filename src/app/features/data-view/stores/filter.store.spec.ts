import { ApplicationRef, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { DataStore } from './data.store';
import { FilterStore } from './filter.store';
import { HeaderStore } from './header.store';
import { RouteStore } from './route.store';

async function setup() {
  const rows = signal<Record<string, unknown>[]>([
    { name: 'e', __random: 5 },
    { name: 'c', __random: 3 },
    { name: 'a', __random: 1 },
    { name: 'd', __random: 4 },
    { name: 'b', __random: 2 },
  ]);
  const query = signal('');
  const draft = signal('');
  const page = signal(1);
  const sortKey = signal('name');
  const ascFlag = signal(true);
  const tag = signal({ seq: -1, shareTagId: '' });
  const tagValues = signal<Record<string, string[]>>({ tag: ['a', 'c', 'e'] });
  const settings = signal({ listPageSize: 2 });
  const seqKey = signal('');
  const setPage = vi.fn((target: number, _options?: { replaceUrl?: boolean }) =>
    page.set(target)
  );
  const labels = signal([
    {
      byKey: 'name',
      seq: 0,
      label: 'Name',
      isSort: true,
      isSearchValue: true,
      type: 'string',
    },
  ]);
  TestBed.configureTestingModule({
    providers: [
      FilterStore,
      provideTranslateService(),
      {
        provide: DataStore,
        useValue: {
          useData: rows,
          useShareTag: tag,
          shareTagValueMap: tagValues,
          datasetDataList: { isLoading: signal(false) },
          shareTagValueList: { isLoading: signal(false) },
        },
      },
      {
        provide: HeaderStore,
        useValue: {
          themeHeader: { isLoading: signal(false) },
          themeItems: { isLoading: signal(false) },
          visibleLabelList: labels,
          defaultKey: signal('name'),
          seqKey,
          themeOtherSetting: settings,
          RANDOM_KEY: '__random',
        },
      },
      {
        provide: RouteStore,
        useValue: {
          queryParamsSearchValue: query,
          searchValue: draft,
          page,
          sortKey,
          ascFlag,
          setPage,
        },
      },
    ],
  });
  const store = TestBed.inject(FilterStore);
  const stable = () => TestBed.inject(ApplicationRef).whenStable();
  await stable();
  return {
    store,
    rows,
    query,
    draft,
    page,
    sortKey,
    ascFlag,
    tag,
    tagValues,
    settings,
    seqKey,
    setPage,
    labels,
    stable,
  };
}

it('資料總數與總頁數使用完整篩選結果，最後一頁只包含剩餘資料', async () => {
  const { store } = await setup();
  expect(store.totalLength()).toBe(5);
  expect(store.totalPages()).toBe(3);
  expect(store.pages()).toEqual([1, 2, 3]);
  store.setPage(3);
  expect(store.currentPage()).toBe(3);
  expect(store.viewData().map(row => row['name'])).toEqual(['e']);
  expect(store.totalLength()).toBe(5);
  expect(store.totalPages()).toBe(3);
});

it('切換排序與頁碼不重跑搜尋，且不改動上游資料', async () => {
  const { store, query, ascFlag, rows, labels } = await setup();
  const originalRows = structuredClone(rows());
  const originalLabels = structuredClone(labels());
  const matches = vi.spyOn(store, 'matchValue');
  query.set('a,c,e');
  expect(store.filterData().map(row => row['name'])).toEqual(['a', 'c', 'e']);
  const searchCalls = matches.mock.calls.length;
  expect(searchCalls).toBeGreaterThan(0);
  ascFlag.set(false);
  expect(store.filterData().map(row => row['name'])).toEqual(['e', 'c', 'a']);
  expect(store.totalLength()).toBe(3);
  expect(store.totalPages()).toBe(2);
  store.setPage(2);
  expect(store.viewData().map(row => row['name'])).toEqual(['a']);
  expect(matches).toHaveBeenCalledTimes(searchCalls);
  expect(rows()).toEqual(originalRows);
  expect(labels()).toEqual(originalLabels);
});

it('搜尋與標籤共同決定筆數，輸入草稿不影響正式結果，序號在排序後跨頁連續', async () => {
  const { store, query, draft, tag, seqKey } = await setup();
  draft.set('missing');
  expect(store.totalLength()).toBe(5);
  query.set(' A , c , E ');
  tag.set({ seq: 7, shareTagId: 'tag' });
  seqKey.set('order');
  expect(store.totalLength()).toBe(3);
  expect(store.pages()).toEqual([1, 2]);
  store.setPage(2);
  expect(store.viewData()).toEqual([{ name: 'e', __random: 5, order: 3 }]);
});

it('標籤更新或頁面大小變更使原頁碼超出範圍時，取代目前歷史並回第一頁', async () => {
  const { store, tag, tagValues, settings, setPage, stable } = await setup();
  store.setPage(3);
  tag.set({ seq: 7, shareTagId: 'tag' });
  await stable();
  expect(store.totalLength()).toBe(3);
  expect(store.totalPages()).toBe(2);
  expect(store.currentPage()).toBe(1);
  expect(setPage).toHaveBeenLastCalledWith(1, { replaceUrl: true });
  store.setPage(2);
  settings.set({ listPageSize: 10 });
  await stable();
  expect(store.totalLength()).toBe(3);
  expect(store.totalPages()).toBe(1);
  expect(store.currentPage()).toBe(1);
  tagValues.set({ tag: [] });
  await stable();
  expect(store.totalLength()).toBe(0);
  expect(store.totalPages()).toBe(0);
  expect(store.pages()).toEqual([]);
  expect(store.viewData()).toEqual([]);
});

it('隨機排序沿用資料中的 random key，並保留筆數與分頁', async () => {
  const { store, sortKey, ascFlag } = await setup();
  sortKey.set('__random');
  expect(store.filterData().map(row => row['name'])).toEqual([
    'a',
    'b',
    'c',
    'd',
    'e',
  ]);
  ascFlag.set(false);
  expect(store.filterData().map(row => row['name'])).toEqual([
    'a',
    'b',
    'c',
    'd',
    'e',
  ]);
  expect(store.totalLength()).toBe(5);
  store.setPage(2);
  expect(store.viewData().map(row => row['name'])).toEqual(['c', 'd']);
});
