import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
  Router,
} from '@angular/router';
import { RouterTestingHarness } from '@angular/router/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CopySpiderPaginationComponent } from '../../components/copy-spider-pagination/copy-spider-pagination.component';
import { SpiderPaginationDataComponent } from '../../components/spider-pagination-data/spider-pagination-data.component';
import { SpiderPaginationService } from '../../services';
import { SpiderPaginationListComponent } from './spider-pagination-list.component';

async function setup() {
  const closed = new Subject<string | undefined>();
  const dialog = { open: vi.fn(() => ({ afterClosed: () => closed })) };
  const service = { getAll: vi.fn(() => of([])) };
  const snackbar = { openI18N: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [SpiderPaginationListComponent],
    providers: [
      provideTranslateService(),
      { provide: MatDialog, useValue: dialog },
      { provide: Router, useValue: { navigate: vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: { queryParamMap: of(convertToParamMap({})) },
      },
      { provide: SpiderPaginationService, useValue: service },
      { provide: SnackbarService, useValue: snackbar },
      { provide: MessageBoxService, useValue: {} },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SpiderPaginationListComponent);
  await fixture.whenStable();
  return { fixture, closed, dialog, service, snackbar };
}

describe('SpiderPaginationListComponent', () => {
  it('資料入口開啟指定爬蟲的資料 dialog', async () => {
    const { fixture, dialog } = await setup();
    const item = {
      spiderPaginationId: 'anime',
      paginationConfig: {},
    } as Parameters<SpiderPaginationListComponent['onRedirectData']>[0];
    fixture.componentInstance.onRedirectData(item);
    expect(dialog.open).toHaveBeenCalledWith(SpiderPaginationDataComponent, {
      data: { spiderPaginationId: 'anime' },
      width: '1100px',
      maxWidth: '95vw',
    });
  });

  it.each(['ok', undefined])(
    '複製 dialog 回傳 %s 時正確更新清單',
    async result => {
      const { fixture, closed, dialog, service, snackbar } = await setup();
      const source = { spiderPaginationId: 'original', paginationConfig: {} };
      // 列表只需傳遞來源物件，實際設定內容由 dialog 處理。
      const item = source as Parameters<
        SpiderPaginationListComponent['onCopy']
      >[0];
      fixture.componentInstance.onCopy(item);
      expect(dialog.open).toHaveBeenCalledWith(CopySpiderPaginationComponent, {
        data: { source: item },
      });
      expect(service.getAll).toHaveBeenCalledTimes(1);
      expect(snackbar.openI18N).not.toHaveBeenCalled();
      closed.next(result);
      closed.complete();
      await fixture.whenStable();
      if (result === 'ok') {
        expect(service.getAll).toHaveBeenCalledTimes(2);
        expect(snackbar.openI18N).toHaveBeenCalledWith('msg.copySuccess');
      } else {
        expect(service.getAll).toHaveBeenCalledTimes(1);
        expect(snackbar.openI18N).not.toHaveBeenCalled();
      }
    }
  );
});

async function setupFiltering(url = '/spider-pagination-list') {
  const records = ['beta', 'alpha', 'gamma'].map(spiderPaginationId => ({
    spiderPaginationId,
    paginationConfig: {},
  }));
  const service = { getAll: vi.fn(() => of(records)) };
  await TestBed.configureTestingModule({
    providers: [
      provideRouter([
        {
          path: 'spider-pagination-list',
          component: SpiderPaginationListComponent,
        },
      ]),
      provideTranslateService(),
      { provide: SpiderPaginationService, useValue: service },
      { provide: MatDialog, useValue: {} },
      { provide: SnackbarService, useValue: {} },
      { provide: MessageBoxService, useValue: {} },
    ],
  }).compileComponents();
  const harness = await RouterTestingHarness.create(url);
  await harness.fixture.whenStable();
  const component = harness.routeDebugElement!
    .componentInstance as SpiderPaginationListComponent;
  const element = harness.routeNativeElement!;
  const input = element.querySelector<HTMLInputElement>(
    'input[type="search"]'
  )!;
  const clear = element.querySelector<HTMLButtonElement>(
    '.filter-controls button'
  )!;
  const rowIds = () =>
    Array.from(
      element.querySelectorAll('td.mat-column-spiderPaginationId'),
      cell => cell.textContent?.trim()
    );
  const filter = async (value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await harness.fixture.whenStable();
  };
  return {
    harness,
    component,
    element,
    input,
    clear,
    rowIds,
    filter,
    service,
    records,
    router: TestBed.inject(Router),
  };
}

describe('SpiderPaginationListComponent 過濾', () => {
  it('從 URL 還原條件，輸入與清除時同步更新表格及 URL', async () => {
    const { harness, filter, input, clear, rowIds, router, service } =
      await setupFiltering(
        '/spider-pagination-list?searchValue=%20ALPHA%20&context=keep'
      );
    expect(input.value).toBe(' ALPHA ');
    expect(rowIds()).toEqual(['alpha']);

    await filter(' GAMMA ');
    expect(rowIds()).toEqual(['gamma']);
    expect(router.parseUrl(router.url).queryParams).toMatchObject({
      searchValue: ' GAMMA ',
      context: 'keep',
    });

    clear.click();
    await harness.fixture.whenStable();
    expect(rowIds()).toEqual(['beta', 'alpha', 'gamma']);
    expect(input.value).toBe('');
    expect(clear.disabled).toBe(true);
    expect(router.parseUrl(router.url).queryParams).toMatchObject({
      searchValue: '',
      context: 'keep',
    });
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('重新載入後保留過濾及排序，無符合資料時顯示提示', async () => {
    const {
      harness,
      component,
      element,
      filter,
      input,
      clear,
      rowIds,
      service,
      records,
    } = await setupFiltering();
    component.sort()!.sort({
      id: 'spiderPaginationId',
      start: 'asc',
      disableClear: false,
    });
    await harness.fixture.whenStable();
    await filter('beta');
    expect(rowIds()).toEqual(['beta']);

    service.getAll.mockReturnValueOnce(
      of([...records, { spiderPaginationId: 'beta-new', paginationConfig: {} }])
    );
    component.list.reload();
    await harness.fixture.whenStable();
    expect(input.value).toBe('beta');
    expect(rowIds()).toEqual(['beta', 'beta-new']);

    await filter('missing');
    expect(rowIds()).toEqual([]);
    expect(element.querySelector('.empty-state')?.textContent).toContain(
      'g.noData'
    );

    clear.click();
    await harness.fixture.whenStable();
    expect(rowIds()).toEqual(['alpha', 'beta', 'beta-new', 'gamma']);
    expect(service.getAll).toHaveBeenCalledTimes(2);
  });
});
