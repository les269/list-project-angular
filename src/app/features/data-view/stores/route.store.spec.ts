import { Location } from '@angular/common';
import { provideLocationMocks } from '@angular/common/testing';
import { Component, inject, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import {
  NavigationEnd,
  NavigationStart,
  provideRouter,
  Router,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { filter, firstValueFrom, take } from 'rxjs';
import { QueryActionType } from '../../theme/models';
import { DataStore } from './data.store';
import { FilterStore } from './filter.store';
import { HeaderStore } from './header.store';
import { RouteStore } from './route.store';
import { By } from '@angular/platform-browser';
import { MatSort, MatSortHeader } from '@angular/material/sort';
import { MatPaginator } from '@angular/material/paginator';
import { TableViewComponent } from '../page/table-view/table-view.component';
import { ImageListViewComponent } from '../page/image-list-view/image-list-view.component';
import { ListBaseViewStoreAdapter } from './list-base-view.adapter';
import { API_BASE_URL } from '../../../core/tokens/api-base-url.token';

@Component({
  template: '<app-image-list-view /><app-table-view />',
  imports: [ImageListViewComponent, TableViewComponent],
  providers: [RouteStore, FilterStore],
})
class TestView {
  readonly routeStore = inject(RouteStore);
  readonly filterStore = inject(FilterStore);
}

const query = (page: number, searchValue = '') =>
  `/view?searchValue=${searchValue}&sort=name&asc=true&page=${page}&dataset=0&tag=-1`;

async function setup(url = query(3)) {
  const blocked = signal(false);
  const loading = signal(false);
  const dataLoading = signal(false);
  const rows = signal([
    { name: 'target' },
    { name: 'two' },
    { name: 'three' },
    { name: 'four' },
    { name: 'five' },
  ]);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'view',
          component: TestView,
          canActivate: [() => !blocked()],
          runGuardsAndResolvers: 'paramsOrQueryParamsChange',
        },
      ]),
      provideLocationMocks(),
      provideTranslateService(),
      { provide: API_BASE_URL, useValue: '' },
      {
        provide: HeaderStore,
        useValue: {
          themeHeader: { isLoading: loading },
          themeItems: { isLoading: loading },
          visibleLabelList: signal([
            {
              byKey: 'name',
              label: 'Name',
              seq: 0,
              type: 'text',
              isSort: true,
              isSearchValue: true,
            },
          ]),
          themeDatasetList: signal([{ seq: 0 }, { seq: 5 }]),
          themeTagList: signal([{ seq: 7, shareTagId: 'tag' }]),
          defaultSortLabel: signal('name'),
          defaultDataset: signal(0),
          RANDOM_KEY: '__random',
          seqKey: signal(''),
          defaultKey: signal('name'),
          themeOtherSetting: signal({ listPageSize: 2 }),
        },
      },
      {
        provide: DataStore,
        useValue: {
          useData: rows,
          useShareTag: signal({ seq: -1, shareTagId: '' }),
          shareTagValueMap: signal({}),
          datasetDataList: { isLoading: dataLoading },
          shareTagValueList: { isLoading: dataLoading },
        },
      },
    ],
  });
  const viewOverride = {
    set: {
      providers: [
        {
          provide: ListBaseViewStoreAdapter,
          useFactory: () => {
            const route = inject(RouteStore);
            const filters = inject(FilterStore);
            return {
              router: route.router,
              queryParamMap: route.queryParamMap,
              currentPage: route.page,
              pages: filters.pages,
              searchValue: route.searchValue,
              searchMode: route.searchMode,
              onSearch: (text: string) => {
                route.searchValue.set(text);
                route.patchQuery({ type: QueryActionType.search });
              },
              totalLength: filters.totalLength,
              queryParamsSort: route.queryParamsSort,
              queryParamsAsc: route.queryParamsAsc,
              sortKey: route.sortKey,
              ascFlag: route.ascFlag,
              patchQuery: (action: Parameters<RouteStore['patchQuery']>[0]) =>
                route.patchQuery(action),
              rowColor: signal([]),
              filterData: filters.filterData,
              pageSize: filters.pageSize,
              visibleLabelList: inject(HeaderStore).visibleLabelList,
              checkVisibleByDataset: () => true,
              setPage: (page: number) => filters.setPage(page),
              prePage: () => filters.prePage(),
              nextPage: () => filters.nextPage(),
              headerId: signal('test'),
              defaultKey: signal(''),
              themeDatasetList: signal([]),
              themeTagListForSelect: signal([]),
              filterAutoCompleteList: signal([]),
              autoCompleteList: signal([]),
              themeTopCustomList: signal([]),
              sortArray: signal([]),
              viewData: signal([]),
              fixedImagePath: signal(''),
            };
          },
        },
      ],
    },
  };
  TestBed.overrideComponent(ImageListViewComponent, viewOverride);
  TestBed.overrideComponent(TableViewComponent, viewOverride);
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  const harness = await RouterTestingHarness.create();
  const router = TestBed.inject(Router);
  router.setUpLocationChangeListener();
  const view = await harness.navigateByUrl(url, TestView);
  await harness.fixture.whenStable();
  const location = TestBed.inject(Location);
  async function history(direction: 'back' | 'forward') {
    const end = firstValueFrom(
      router.events.pipe(
        filter(event => event instanceof NavigationEnd),
        take(1)
      )
    );
    location[direction]();
    await end;
    await harness.fixture.whenStable();
  }
  return {
    harness,
    view,
    router,
    location,
    history,
    rows,
    dataLoading,
    blocked,
  };
}

it('從第三頁搜尋到一頁結果只導覽一次，上一頁與下一頁可還原查詢及頁碼', async () => {
  const { harness, view, router, history } = await setup();
  const previousData = view.filterStore.viewData();
  const starts: NavigationStart[] = [];
  const subscription = router.events
    .pipe(
      filter(
        (event): event is NavigationStart => event instanceof NavigationStart
      )
    )
    .subscribe(event => starts.push(event));
  view.routeStore.searchValue.set('target');
  view.routeStore.patchQuery({ type: QueryActionType.search });
  await harness.fixture.whenStable();
  expect(starts).toHaveLength(1);
  expect(view.filterStore.currentPage()).toBe(1);
  expect(view.filterStore.totalLength()).toBe(1);
  const paginator = harness.fixture.debugElement.query(
    By.directive(MatPaginator)
  ).componentInstance as MatPaginator;
  expect(paginator.length).toBe(1);
  expect(paginator.pageIndex).toBe(0);
  expect(
    harness.fixture.nativeElement.querySelectorAll(
      'select[aria-label="g.page"]'
    )
  ).toHaveLength(0);
  await history('back');
  expect(view.routeStore.queryParamsSearchValue()).toBe('');
  expect(view.filterStore.currentPage()).toBe(3);
  expect(view.filterStore.viewData()).toEqual(previousData);
  expect(paginator.length).toBe(5);
  expect(paginator.pageIndex).toBe(2);
  const selectors = harness.fixture.nativeElement.querySelectorAll(
    'select[aria-label="g.page"]'
  ) as NodeListOf<HTMLSelectElement>;
  expect(selectors).toHaveLength(2);
  expect(Array.from(selectors, select => select.value)).toEqual(['3', '3']);
  await history('forward');
  expect(view.routeStore.queryParamsSearchValue()).toBe('target');
  expect(view.filterStore.currentPage()).toBe(1);
  subscription.unsubscribe();
});

it('自動修正無效頁碼使用取代歷史，不會在上一頁重複跳回錯誤頁碼', async () => {
  const { harness, view, router, history } = await setup(query(2));
  await harness.navigateByUrl(query(3, 'target'));
  await harness.fixture.whenStable();
  expect(view.filterStore.currentPage()).toBe(1);
  expect(router.parseUrl(router.url).queryParams['searchValue']).toBe('target');
  await history('back');
  expect(view.routeStore.queryParamsSearchValue()).toBe('');
  expect(view.filterStore.currentPage()).toBe(2);
});

it('URL 缺少預設參數時取代目前紀錄，不阻擋上一頁', async () => {
  const { harness, view, history } = await setup(query(2));
  await harness.navigateByUrl('/view?searchValue=target&page=1');
  await harness.fixture.whenStable();
  expect(view.routeStore.queryParamsSort()).toBe('name');
  await history('back');
  expect(view.filterStore.currentPage()).toBe(2);
  expect(view.routeStore.queryParamsSearchValue()).toBe('');
});

it('空搜尋結果也回第一頁，清除搜尋後可返回原本的查詢', async () => {
  const { harness, view, history } = await setup();
  view.routeStore.searchValue.set('missing');
  view.routeStore.patchQuery({ type: QueryActionType.search });
  await harness.fixture.whenStable();
  expect(view.filterStore.currentPage()).toBe(1);
  expect(view.filterStore.viewData()).toEqual([]);
  view.routeStore.searchValue.set('');
  view.routeStore.patchQuery({ type: QueryActionType.search });
  await harness.fixture.whenStable();
  await history('back');
  expect(view.routeStore.queryParamsSearchValue()).toBe('missing');
  expect(view.filterStore.currentPage()).toBe(1);
});

it('資料載入中的空值不會將原本第三頁改為第一頁', async () => {
  const { harness, view, rows, dataLoading } = await setup();
  const original = rows();
  dataLoading.set(true);
  rows.set([]);
  await harness.fixture.whenStable();
  expect(view.filterStore.currentPage()).toBe(3);
  rows.set(original);
  dataLoading.set(false);
  await harness.fixture.whenStable();
  expect(view.filterStore.currentPage()).toBe(3);
});

it('直接開啟第二頁、手動換頁及返回歷史時，上下頁碼選單皆與 URL 同步', async () => {
  const { harness, view, router, history } = await setup(query(2));
  const selectors = () =>
    Array.from(
      harness.fixture.nativeElement.querySelectorAll(
        'select[aria-label="g.page"]'
      )
    ) as HTMLSelectElement[];
  expect(selectors().map(select => select.value)).toEqual(['2', '2']);
  const select = selectors()[0];
  select.value = '3';
  select.dispatchEvent(new Event('change', { bubbles: true }));
  await harness.fixture.whenStable();
  expect(router.parseUrl(router.url).queryParams['page']).toBe('3');
  expect(selectors().map(select => select.value)).toEqual(['3', '3']);
  await history('back');
  expect(router.parseUrl(router.url).queryParams['page']).toBe('2');
  expect(view.filterStore.currentPage()).toBe(2);
  expect(selectors().map(select => select.value)).toEqual(['2', '2']);
});

it('Table 排序狀態與圖示在切換方向及歷史返回時跟隨 URL', async () => {
  const { harness, view, history } = await setup(query(1));
  const sort = harness.fixture.debugElement
    .query(By.directive(MatSort))
    .injector.get(MatSort);
  const header = () =>
    harness.fixture.debugElement.query(By.directive(MatSortHeader))
      .nativeElement as HTMLElement;
  expect(sort.active).toBe('name');
  expect(sort.direction).toBe('asc');
  expect(header().getAttribute('aria-sort')).toBe('ascending');
  view.routeStore.patchQuery({
    type: QueryActionType.sort,
    key: 'name',
    asc: false,
  });
  await harness.fixture.whenStable();
  expect(sort.direction).toBe('desc');
  expect(header().getAttribute('aria-sort')).toBe('descending');
  await history('back');
  expect(sort.active).toBe('name');
  expect(sort.direction).toBe('asc');
  expect(header().getAttribute('aria-sort')).toBe('ascending');
});

it.each([0, 42, -12, [0, 42]])('數值 %j 可以由搜尋匹配', async value => {
  const { harness, view, rows } = await setup(query(1));
  rows.set([{ name: value as unknown as string }]);
  view.routeStore.searchValue.set(Array.isArray(value) ? '42' : String(value));
  view.routeStore.patchQuery({ type: QueryActionType.search });
  await harness.fixture.whenStable();
  expect(view.filterStore.totalLength()).toBe(1);
});

it('排序導覽被取消時保留原狀態，成功導覽與返回時才同步 URL', async () => {
  const { harness, view, router, blocked, history } = await setup(query(2));
  const image = harness.fixture.debugElement.query(
    By.directive(ImageListViewComponent)
  ).componentInstance as ImageListViewComponent;
  blocked.set(true);
  image.changeAsc();
  await harness.fixture.whenStable();
  expect(view.routeStore.ascFlag()).toBe(true);
  expect(router.parseUrl(router.url).queryParams['asc']).toBe('true');
  image.changeSort({ key: '__random', label: 'Random' });
  await harness.fixture.whenStable();
  expect(view.routeStore.sortKey()).toBe('name');
  blocked.set(false);
  image.changeAsc();
  await harness.fixture.whenStable();
  expect(view.routeStore.ascFlag()).toBe(false);
  expect(view.routeStore.page()).toBe(2);
  await history('back');
  expect(view.routeStore.ascFlag()).toBe(true);
  expect(view.routeStore.page()).toBe(2);
});

it('Dataset 與標籤選取跟隨 URL，上一頁與下一頁可還原選取狀態', async () => {
  const { harness, view, history } = await setup(query(2));
  view.routeStore.patchQuery({ type: QueryActionType.dataset, seq: 5 });
  await harness.fixture.whenStable();
  expect(view.routeStore.datasetSeq()).toBe(5);
  view.routeStore.patchQuery({ type: QueryActionType.tag, seq: 7 });
  await harness.fixture.whenStable();
  expect(view.routeStore.shareTagSeq()).toBe(7);
  await history('back');
  expect(view.routeStore.datasetSeq()).toBe(5);
  expect(view.routeStore.shareTagSeq()).toBe(-1);
  await history('back');
  expect(view.routeStore.datasetSeq()).toBe(0);
  await history('forward');
  expect(view.routeStore.datasetSeq()).toBe(5);
  expect(view.routeStore.page()).toBe(2);
});

it.each([
  ['target,two', 'target,two', 'or'],
  ['and:target,two', 'target,two', 'and'],
  ['or:target,two', 'target,two', 'or'],
  ['or:and:test', 'and:test', 'or'],
  ['and:or:test', 'or:test', 'and'],
])('開啟搜尋連結 %s 時只解析第一層前綴', async (encoded, value, mode) => {
  const { view, harness } = await setup(query(1, encoded));
  expect(view.routeStore.searchValue()).toBe(value);
  expect(view.routeStore.searchMode()).toBe(mode);
  const inputs = harness.fixture.nativeElement.querySelectorAll(
    'app-search-input input'
  ) as NodeListOf<HTMLInputElement>;
  expect(Array.from(inputs, input => input.value)).toEqual([value, value]);
});

it.each([
  { value: 'target,two', mode: 'or' as const, encoded: 'target,two' },
  { value: 'target,two', mode: 'and' as const, encoded: 'and:target,two' },
  { value: 'and:test', mode: 'or' as const, encoded: 'or:and:test' },
  { value: 'or:test', mode: 'or' as const, encoded: 'or:or:test' },
  { value: 'and:test', mode: 'and' as const, encoded: 'and:and:test' },
  { value: '', mode: 'and' as const, encoded: 'and:' },
])(
  '送出搜尋 $encoded 保留原文與模式且不增加 URL 參數',
  async ({ value, mode, encoded }) => {
    const { view, harness, router } = await setup(query(1));
    const keys = Object.keys(router.parseUrl(router.url).queryParams).sort();
    view.routeStore.searchValue.set(value);
    view.routeStore.searchMode.set(mode);
    view.routeStore.patchQuery({ type: QueryActionType.search });
    await harness.fixture.whenStable();
    const params = router.parseUrl(router.url).queryParams;
    expect(params['searchValue']).toBe(encoded);
    expect(Object.keys(params).sort()).toEqual(keys);
    expect(view.routeStore.searchValue()).toBe(value);
    expect(view.routeStore.searchMode()).toBe(mode);
  }
);

it('切換模式只修改草稿，Enter 才套用 AND，歷史導覽還原兩種檢視的模式', async () => {
  const { view, harness, router, history } = await setup(
    query(1, 'target,two')
  );
  const modeButtons = () =>
    Array.from(
      harness.fixture.nativeElement.querySelectorAll(
        'button[aria-label="g.toggleSearchMode"]'
      )
    ) as HTMLButtonElement[];
  expect(view.filterStore.totalLength()).toBe(2);
  modeButtons()[0].click();
  await harness.fixture.whenStable();
  expect(
    modeButtons().map(button => button.getAttribute('aria-pressed'))
  ).toEqual(['true', 'true']);
  expect(view.filterStore.totalLength()).toBe(2);
  expect(router.parseUrl(router.url).queryParams['searchValue']).toBe(
    'target,two'
  );
  const input = harness.fixture.nativeElement.querySelector(
    'app-search-input input'
  ) as HTMLInputElement;
  input.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Enter', bubbles: true })
  );
  await harness.fixture.whenStable();
  expect(router.parseUrl(router.url).queryParams['searchValue']).toBe(
    'and:target,two'
  );
  expect(view.filterStore.totalLength()).toBe(0);
  await history('back');
  expect(view.routeStore.searchMode()).toBe('or');
  expect(
    modeButtons().map(button => button.getAttribute('aria-pressed'))
  ).toEqual(['false', 'false']);
  expect(view.filterStore.totalLength()).toBe(2);
  await history('forward');
  expect(view.routeStore.searchMode()).toBe('and');
  expect(view.filterStore.totalLength()).toBe(0);
});
