import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { EMPTY, of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { CallApiDialogComponent } from '../../components/call-api-dialog.component';
import { CopyApiRequestConfigDialog } from '../../components/copy-api-request-config.dialog';
import {
  ApiRequestConfig,
  createApiRequestSettings,
  HttpMethodType,
} from '../../model';
import { ApiRequestConfigService } from '../../service/api-request-config.service';
import { ApiRequestConfigListComponent } from './api-request-config-list.component';

const items: ApiRequestConfig[] = [
  {
    apiId: 'first',
    description: '更新項目',
    config: createApiRequestSettings(),
    createdTime: new Date('2026-11-01T10:00:00'),
    updatedTime: new Date('2026-11-10T12:00:00'),
  },
  {
    apiId: 'second',
    description: '通知服務',
    config: createApiRequestSettings(),
  },
];

async function setup() {
  const pending = new Subject<void>();
  const confirmation = new Subject<boolean>();
  const service = {
    getAll: vi.fn(() => of(structuredClone(items))),
    delete: vi.fn((_item: ApiRequestConfig) => pending),
  };
  const dialog = {
    open: vi.fn((_component: unknown, _options: any) => ({
      afterClosed: (): import('rxjs').Observable<boolean> => EMPTY,
    })),
  };
  await TestBed.configureTestingModule({
    imports: [ApiRequestConfigListComponent, TranslateModule.forRoot()],
    providers: [
      { provide: ApiRequestConfigService, useValue: service },
      { provide: MatDialog, useValue: dialog },
      {
        provide: MessageBoxService,
        useValue: { openI18N: () => confirmation },
      },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ApiRequestConfigListComponent);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    service,
    dialog,
    pending,
    confirmation,
  };
}

describe('API 請求設定清單', () => {
  it('在編輯前顯示執行按鈕，點選後開啟該 API 的執行畫面', async () => {
    const { fixture, component, dialog } = await setup();
    const buttons = fixture.nativeElement.querySelectorAll(
      'td.mat-column-actions button'
    );
    expect(buttons[0].querySelector('mat-icon').textContent.trim()).toBe(
      'play_arrow'
    );
    expect(buttons[1].querySelector('mat-icon').textContent.trim()).toBe(
      'edit'
    );
    buttons[0].click();
    expect(dialog.open).toHaveBeenCalledWith(
      CallApiDialogComponent,
      expect.objectContaining({ data: items[0] })
    );
    dialog.open.mockClear();
    component.deletingId.set('first');
    component.onExecute(items[0]);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('複製按鈕開啟 ID 與說明 dialog，儲存成功後重新載入清單', async () => {
    const { fixture, component, dialog, service } = await setup();
    const closed = new Subject<boolean>();
    dialog.open.mockReturnValue({ afterClosed: () => closed });
    const button: HTMLButtonElement = fixture.nativeElement.querySelectorAll(
      'td.mat-column-actions button'
    )[2];
    expect(button.querySelector('mat-icon')?.textContent?.trim()).toBe(
      'content_copy'
    );
    button.click();
    expect(dialog.open).toHaveBeenCalledWith(
      CopyApiRequestConfigDialog,
      expect.objectContaining({
        data: items[0],
      })
    );
    expect(dialog.open.mock.calls[0][1].data).toBe(
      component.dataSource.data[0]
    );
    closed.next(true);
    closed.complete();
    await fixture.whenStable();
    expect(service.getAll).toHaveBeenCalledTimes(2);
    dialog.open.mockClear();
    component.deletingId.set('first');
    component.onCopy(items[0]);
    expect(dialog.open).not.toHaveBeenCalled();
  });

  it('分別顯示後端的建立與更新時間，缺少時間時顯示破折號', async () => {
    const { fixture } = await setup();
    const createdTime = fixture.nativeElement.querySelectorAll(
      'td.mat-column-createdTime'
    );
    const updatedTime = fixture.nativeElement.querySelectorAll(
      'td.mat-column-updatedTime'
    );
    expect(createdTime[0].textContent.trim()).toBe('2026-11-01 10:00:00');
    expect(updatedTime[0].textContent.trim()).toBe('2026-11-10 12:00:00');
    expect(createdTime[1].textContent.trim()).toBe('—');
    expect(updatedTime[1].textContent.trim()).toBe('—');
  });

  it('搜尋使用 ID 或說明，篩選後刪除正確資料並阻擋重複操作', async () => {
    const { fixture, component, service, confirmation, pending } =
      await setup();
    const search: HTMLInputElement =
      fixture.nativeElement.querySelector('#request-search');
    search.value = ' 通知 ';
    search.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.dataSource.filteredData.map(item => item.apiId)).toEqual([
      'second',
    ]);
    component.onDelete(component.dataSource.filteredData[0]);
    component.onDelete(items[0]);
    confirmation.next(true);
    confirmation.complete();
    expect(service.delete).toHaveBeenCalledTimes(1);
    expect(service.delete).toHaveBeenCalledWith(items[1]);
    expect(component.deletingId()).toBe('second');
    pending.next();
    pending.complete();
    expect(component.deletingId()).toBe('');
    component.searchText.set('FIRST');
    await fixture.whenStable();
    expect(component.dataSource.filteredData.map(item => item.apiId)).toEqual([
      'first',
    ]);
  });

  it('點選欄位標題可排序 ID、巢狀設定與後端日期，搜尋後仍保留排序', async () => {
    const { fixture, component, service } = await setup();
    const records: ApiRequestConfig[] = JSON.parse(
      JSON.stringify([
        items[0],
        {
          ...items[1],
          config: createApiRequestSettings({
            enabled: false,
            httpMethod: HttpMethodType.post,
          }),
          createdTime: new Date('2026-11-02T10:00:00'),
          updatedTime: new Date('2026-11-11T12:00:00'),
        },
      ])
    );
    service.getAll.mockReturnValue(of(records));
    component.requests.reload();
    await fixture.whenStable();
    const renderedIds = () =>
      Array.from(
        fixture.nativeElement.querySelectorAll('td.mat-column-apiId'),
        (cell: any) => cell.textContent.trim()
      );
    for (const [column, ascending] of [
      ['apiId', ['first', 'second']],
      ['enabled', ['second', 'first']],
      ['httpMethod', ['first', 'second']],
      ['createdTime', ['first', 'second']],
      ['updatedTime', ['first', 'second']],
    ] as const) {
      const header: HTMLElement = fixture.nativeElement.querySelector(
        `th.mat-column-${column} .mat-sort-header-container`
      );
      header.click();
      await fixture.whenStable();
      expect(renderedIds()).toEqual(ascending);
      header.click();
      await fixture.whenStable();
      expect(renderedIds()).toEqual([...ascending].reverse());
    }
    component.searchText.set('FIRST');
    await fixture.whenStable();
    expect(renderedIds()).toEqual(['first']);
    component.searchText.set('');
    await fixture.whenStable();
    expect(renderedIds()).toEqual(['second', 'first']);
  });

  it('取消刪除不呼叫後端並解除操作鎖定', async () => {
    const { component, service, confirmation } = await setup();
    component.onDelete(items[0]);
    confirmation.next(false);
    confirmation.complete();
    expect(service.delete).not.toHaveBeenCalled();
    expect(component.deletingId()).toBe('');
  });

  it('刪除失敗會解除鎖定，保留清單', async () => {
    const { component, confirmation, pending } = await setup();
    component.onDelete(items[0]);
    confirmation.next(true);
    confirmation.complete();
    pending.error(new Error('Delete failed'));
    expect(component.deletingId()).toBe('');
    expect(component.deleteFailed()).toBe(true);
    expect(component.dataSource.filteredData).toEqual(items);
  });
});
