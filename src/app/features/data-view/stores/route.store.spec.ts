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
import { ImageListViewComponent } from '../page/image-list-view/image-list-view.component';
import { ListBaseViewStoreAdapter } from './list-base-view.adapter';
import { API_BASE_URL } from '../../../core/tokens/api-base-url.token';

@Component({
  template: '<app-image-list-view />',
  imports: [ImageListViewComponent],
  providers: [RouteStore, FilterStore],
})
class TestView {
  readonly routeStore = inject(RouteStore);
  readonly filterStore = inject(FilterStore);
}

const query = (page: number, searchValue = '') =>
  `/view?searchValue=${searchValue}&sort=name&asc=true&page=${page}&dataset=0&tag=-1`;

async function setup(url = query(3)) {
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
      provideRouter([{ path: 'view', component: TestView }]),
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
          themeDatasetList: signal([{ seq: 0 }]),
          themeTagList: signal([]),
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
  TestBed.overrideComponent(ImageListViewComponent, {
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
              totalLength: filters.totalLength,
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
  });
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
  return { harness, view, router, location, history, rows, dataLoading };
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
  expect(
    harness.fixture.nativeElement.querySelectorAll(
      'select[aria-label="g.page"]'
    )
  ).toHaveLength(0);
  await history('back');
  expect(view.routeStore.queryParamsSearchValue()).toBe('');
  expect(view.filterStore.currentPage()).toBe(3);
  expect(view.filterStore.viewData()).toEqual(previousData);
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
