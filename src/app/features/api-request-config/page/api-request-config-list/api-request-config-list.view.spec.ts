import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { EMPTY, of } from 'rxjs';
import { EditMode } from '../../../../core/model/global.model';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { ApiRequestConfigDialog } from '../../components/api-request-config.dialog';
import { createApiRequestSettings } from '../../model';
import { ApiRequestConfigService } from '../../service/api-request-config.service';
import { ApiRequestConfigListComponent } from './api-request-config-list.component';

async function setup() {
  const records = [
    {
      apiId: 'first',
      description: '通知服務',
      config: createApiRequestSettings(),
    },
    {
      apiId: 'second',
      description: '更新項目',
      config: createApiRequestSettings(),
    },
  ];
  const service = { getAll: vi.fn(() => of(records)) };
  const dialog = { open: vi.fn(() => ({ afterClosed: () => EMPTY })) };
  await TestBed.configureTestingModule({
    imports: [ApiRequestConfigListComponent],
    providers: [
      provideTranslateService(),
      { provide: ApiRequestConfigService, useValue: service },
      { provide: MatDialog, useValue: dialog },
      { provide: MessageBoxService, useValue: {} },
      { provide: SnackbarService, useValue: {} },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(ApiRequestConfigListComponent);
  await fixture.whenStable();
  const element: HTMLElement = fixture.nativeElement;
  return { fixture, element, service, dialog };
}

describe('API 請求清單操作列', () => {
  it('輸入欄位可依 ID 或中文說明搜尋，清除後還原列表', async () => {
    const { fixture, element, service } = await setup();
    const input = element.querySelector<HTMLInputElement>('#request-search')!;
    const clear = element.querySelector<HTMLButtonElement>(
      '.filter-controls button'
    )!;
    const rowIds = () =>
      Array.from(element.querySelectorAll('td.mat-column-apiId'), cell =>
        cell.textContent?.trim()
      );
    expect(clear.disabled).toBe(true);

    input.value = ' FIRST ';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(rowIds()).toEqual(['first']);
    input.value = '更新';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(rowIds()).toEqual(['second']);

    clear.click();
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(rowIds()).toEqual(['first', 'second']);
    expect(clear.disabled).toBe(true);
    expect(service.getAll).toHaveBeenCalledTimes(1);
  });

  it('新增開啟 CREATE 模式，刪除期間停用操作', async () => {
    const { fixture, element, dialog } = await setup();
    const add = element.querySelector<HTMLButtonElement>(
      '.page-button-primary'
    )!;
    add.click();
    expect(dialog.open).toHaveBeenCalledWith(
      ApiRequestConfigDialog,
      expect.objectContaining({
        data: expect.objectContaining({ type: EditMode.CREATE }),
      })
    );
    fixture.componentInstance.deletingId.set('first');
    await fixture.whenStable();
    expect(add.disabled).toBe(true);
    expect(
      Array.from(
        element.querySelectorAll<HTMLButtonElement>('.row-action')
      ).every(button => button.disabled)
    ).toBe(true);
  });
});
