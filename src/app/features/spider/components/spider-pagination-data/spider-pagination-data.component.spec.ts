import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { MatPaginatorHarness } from '@angular/material/paginator/testing';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderPaginationData } from '../../model';
import { SpiderPaginationDataService, SpiderService } from '../../services';
import { SpiderPaginationDataJsonComponent } from '../spider-pagination-data-json/spider-pagination-data-json.component';
import { SpiderPaginationDataComponent } from './spider-pagination-data.component';

const records: SpiderPaginationData[] = [
  {
    spiderPaginationId: 'anime',
    groupId: '2025',
    dataId: 'same-id',
    data: { title: 'Previous year' },
  },
  {
    spiderPaginationId: 'anime',
    groupId: '2026',
    dataId: 'same-id',
    data: { title: 'Current year' },
    lastSuccessTime: new Date('2026-11-09T00:00:00Z'),
  },
  {
    spiderPaginationId: 'anime',
    groupId: '2026',
    dataId: 'another-id',
    data: { title: 'Another record' },
  },
];

async function setup(
  options: {
    pending?: Subject<SpiderPaginationData[]>;
    error?: boolean;
    records?: SpiderPaginationData[];
  } = {}
) {
  const refresh = new Subject<SpiderPaginationData[]>();
  const dataService = {
    getBySpiderPaginationId: vi.fn((): Observable<SpiderPaginationData[]> => {
      if (options.pending) return options.pending;
      if (options.error) return throwError(() => new Error('Load failed'));
      return of(structuredClone(options.records ?? records));
    }),
  };
  const spiderService = {
    executePagination: vi.fn((): Observable<SpiderPaginationData[]> => refresh),
  };
  const dialog = { open: vi.fn() };
  const snackbar = { openI18N: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [SpiderPaginationDataComponent, TranslateModule.forRoot()],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: { spiderPaginationId: 'anime' } },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: MatDialog, useValue: dialog },
      { provide: SpiderPaginationDataService, useValue: dataService },
      { provide: SpiderService, useValue: spiderService },
      { provide: SnackbarService, useValue: snackbar },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(SpiderPaginationDataComponent);
  if (options.pending) {
    TestBed.tick();
  } else {
    await fixture.whenStable();
  }
  return {
    fixture,
    component: fixture.componentInstance,
    dataService,
    spiderService,
    refresh,
    dialog,
    snackbar,
  };
}

describe('SpiderPaginationDataComponent', () => {
  it('使用 mat-table 與 Material 分頁，可換頁及調整每頁筆數', async () => {
    const manyRecords = Array.from({ length: 55 }, (_, index) => ({
      ...records[0],
      dataId: `item-${index}`,
    }));
    const { fixture, dataService } = await setup({ records: manyRecords });
    const paginator =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatPaginatorHarness
      );
    const rows = () => fixture.nativeElement.querySelectorAll('tbody tr');
    const firstId = () =>
      fixture.nativeElement.querySelector('tbody button').textContent.trim();
    expect(
      fixture.nativeElement.querySelector('table[mat-table]')
    ).not.toBeNull();
    expect(await paginator.getPageSize()).toBe(25);
    expect(rows()).toHaveLength(25);
    expect(firstId()).toBe('item-0');
    await paginator.goToNextPage();
    expect(rows()).toHaveLength(25);
    expect(firstId()).toBe('item-25');
    await paginator.goToLastPage();
    expect(rows()).toHaveLength(5);
    expect(firstId()).toBe('item-50');
    expect(await paginator.isNextPageDisabled()).toBe(true);
    await paginator.goToFirstPage();
    await paginator.setPageSize(10);
    expect(rows()).toHaveLength(10);
    expect(firstId()).toBe('item-0');
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledTimes(1);
  });

  it('分頁後切換 groupId，分頁筆數更新並回到第一頁', async () => {
    const manyRecords = Array.from({ length: 55 }, (_, index) => ({
      ...records[0],
      groupId: index < 30 ? '2025' : '2026',
      dataId: `item-${index}`,
    }));
    const { fixture, component } = await setup({ records: manyRecords });
    const paginator =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatPaginatorHarness
      );
    await paginator.goToLastPage();
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');
    select.value = '2026';
    select.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.pageIndex()).toBe(0);
    expect(component.filteredRows()).toHaveLength(25);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(25);
    expect(
      fixture.nativeElement.querySelector('tbody button').textContent.trim()
    ).toBe('item-30');
    expect(await paginator.isPreviousPageDisabled()).toBe(true);
    expect(await paginator.isNextPageDisabled()).toBe(true);
  });

  it('刷新後資料縮減時回到第一頁，顯示完整剩餘資料', async () => {
    const manyRecords = Array.from({ length: 55 }, (_, index) => ({
      ...records[0],
      dataId: `item-${index}`,
    }));
    const { fixture, component, dataService, refresh } = await setup({
      records: manyRecords,
    });
    const paginator =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatPaginatorHarness
      );
    await paginator.goToLastPage();
    dataService.getBySpiderPaginationId.mockReturnValue(of(records));
    component.onForceRefresh();
    refresh.next([]);
    refresh.complete();
    await fixture.whenStable();
    expect(component.pageIndex()).toBe(0);
    expect(fixture.nativeElement.querySelectorAll('tbody tr')).toHaveLength(3);
    const reloadedPaginator =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatPaginatorHarness
      );
    expect(await reloadedPaginator.isNextPageDisabled()).toBe(true);
  });

  it('預設顯示所選爬蟲的全部資料，依 groupId 篩選並可恢復全部', async () => {
    const { fixture, component, dataService } = await setup();
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledExactlyOnceWith(
      'anime'
    );
    const rows = () => fixture.nativeElement.querySelectorAll('tbody tr');
    const select: HTMLSelectElement =
      fixture.nativeElement.querySelector('select');
    expect(Array.from(select.options).map(option => option.value)).toEqual([
      '',
      '2025',
      '2026',
    ]);
    expect(rows()).toHaveLength(3);
    select.value = '2026';
    select.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(rows()).toHaveLength(2);
    expect(component.filteredRows().every(row => row.groupId === '2026')).toBe(
      true
    );
    select.value = '';
    select.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(rows()).toHaveLength(3);
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledTimes(1);
  });

  it('相同 dataId 在不同分組時，點擊後開啟正確資料的 JSON dialog', async () => {
    const { fixture, component, dialog } = await setup();
    component.filterModel.set({ groupId: '2026' });
    await fixture.whenStable();
    const dataId: HTMLButtonElement =
      fixture.nativeElement.querySelector('tbody button');
    dataId.click();
    expect(dialog.open).toHaveBeenCalledWith(
      SpiderPaginationDataJsonComponent,
      {
        data: records[1],
        width: '900px',
        maxWidth: '95vw',
      }
    );
  });

  it('強制刷新傳送 force=true，防止重複請求並重新取得全部資料', async () => {
    const {
      fixture,
      component,
      dataService,
      spiderService,
      refresh,
      snackbar,
    } = await setup();
    component.filterModel.set({ groupId: '2026' });
    const pending = new Subject<SpiderPaginationData[]>();
    dataService.getBySpiderPaginationId.mockReturnValue(pending);
    const button: HTMLButtonElement =
      fixture.nativeElement.querySelector('button');
    button.click();
    await fixture.whenStable();
    expect(spiderService.executePagination).toHaveBeenCalledExactlyOnceWith(
      'anime',
      true
    );
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.querySelector('select').disabled).toBe(true);
    component.onForceRefresh();
    expect(spiderService.executePagination).toHaveBeenCalledTimes(1);
    refresh.next([records[1]]);
    refresh.complete();
    TestBed.tick();
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledTimes(2);
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.refreshSuccess');
    expect(button.disabled).toBe(true);
    const nextRecords = [...records, { ...records[2], dataId: 'new-id' }];
    pending.next(nextRecords);
    pending.complete();
    await fixture.whenStable();
    expect(component.rows()).toEqual(nextRecords);
    expect(component.filterModel().groupId).toBe('2026');
    expect(component.filteredRows()).toHaveLength(3);
    expect(button.disabled).toBe(false);
  });

  it('刷新後選取的分組已不存在時恢復全部資料', async () => {
    const { fixture, component, dataService, refresh } = await setup();
    component.filterModel.set({ groupId: '2025' });
    dataService.getBySpiderPaginationId.mockReturnValue(of(records.slice(1)));
    component.onForceRefresh();
    refresh.next([]);
    refresh.complete();
    await fixture.whenStable();
    expect(component.filterModel().groupId).toBe('');
    expect(component.filteredRows()).toHaveLength(2);
    expect(fixture.nativeElement.querySelector('select').value).toBe('');
  });

  it('強制刷新失敗保留清單與篩選，解除鎖定並允許重試', async () => {
    const {
      fixture,
      component,
      dataService,
      spiderService,
      refresh,
      snackbar,
    } = await setup();
    component.filterModel.set({ groupId: '2026' });
    component.onForceRefresh();
    refresh.error(new Error('Execution failed'));
    await fixture.whenStable();
    expect(component.refreshing()).toBe(false);
    expect(component.filteredRows()).toHaveLength(2);
    expect(component.filterModel().groupId).toBe('2026');
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(false);
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledTimes(1);
    expect(snackbar.openI18N).not.toHaveBeenCalled();
    spiderService.executePagination.mockReturnValue(of([]));
    component.onForceRefresh();
    await fixture.whenStable();
    expect(spiderService.executePagination).toHaveBeenCalledTimes(2);
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledTimes(2);
  });

  it('載入期間顯示狀態並禁止強制刷新', async () => {
    const pending = new Subject<SpiderPaginationData[]>();
    const { fixture, component, spiderService } = await setup({ pending });
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent
    ).toContain('spiderPagination.loading');
    component.onForceRefresh();
    expect(spiderService.executePagination).not.toHaveBeenCalled();
    pending.next([]);
    pending.complete();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('tbody').textContent).toContain(
      'g.noData'
    );
  });

  it('載入失敗顯示重試入口，重試成功後顯示資料', async () => {
    const { fixture, component, dataService } = await setup({ error: true });
    const alert: HTMLElement =
      fixture.nativeElement.querySelector('[role="alert"]');
    expect(alert.textContent).toContain('spiderPagination.loadFailed');
    dataService.getBySpiderPaginationId.mockReturnValue(of(records));
    alert.querySelector('button')!.click();
    await fixture.whenStable();
    expect(component.rows()).toEqual(records);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('關閉 dialog 後停止訂閱，不顯示刷新成功訊息', async () => {
    const { fixture, component, refresh, snackbar, dataService } =
      await setup();
    component.onForceRefresh();
    fixture.destroy();
    refresh.next(records);
    refresh.complete();
    expect(snackbar.openI18N).not.toHaveBeenCalled();
    expect(dataService.getBySpiderPaginationId).toHaveBeenCalledTimes(1);
  });
});
