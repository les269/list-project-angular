import { TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ApiRequestConfig, createApiRequestSettings } from '../model';
import { ApiRequestConfigService } from '../service/api-request-config.service';
import { CopyApiRequestConfigDialog } from './copy-api-request-config.dialog';

const source: ApiRequestConfig = {
  apiId: 'source',
  description: '原始說明',
  config: {
    ...createApiRequestSettings({
      endpointUrl: 'https://example.com/{{$.id}}',
      requestBody: '{"id":"{{$.id}}"}',
      httpParams: [{ seq: 0, name: 'id', value: '{{$.id}}', enabled: false }],
    }),
    ...{ custom: { value: 42 } },
  },
  createdTime: new Date('2026-11-01T10:00:00Z'),
};

async function setup() {
  const pending = new Subject<void>();
  const service = {
    update: vi.fn((_request: ApiRequestConfig) => pending),
    exist: vi.fn((_apiId: string): Observable<boolean> => of(false)),
  };
  const dialog = { close: vi.fn(), disableClose: false };
  const data = structuredClone(source);
  await TestBed.configureTestingModule({
    imports: [CopyApiRequestConfigDialog, TranslateModule.forRoot()],
    providers: [
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialog },
      { provide: ApiRequestConfigService, useValue: service },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(CopyApiRequestConfigDialog);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    service,
    dialog,
    pending,
    data,
  };
}

describe('複製 API 請求設定', () => {
  it('只顯示 ID 與說明，阻擋空白或重複 ID', async () => {
    const { fixture, component, service } = await setup();
    expect(fixture.nativeElement.querySelectorAll('input')).toHaveLength(2);
    expect(component.valueModel()).toEqual({
      apiId: '',
      description: source.description,
    });
    for (const apiId of ['', '   ']) {
      component.valueForm.apiId().value.set(apiId);
      component.onSave();
      expect(component.valueForm.apiId().invalid()).toBe(true);
    }
    expect(service.exist).not.toHaveBeenCalled();
    service.exist.mockReturnValue(of(true));
    component.valueForm.apiId().value.set(' server-only-id ');
    component.onSave();
    expect(service.exist).toHaveBeenCalledWith('server-only-id');
    expect(
      component.valueForm
        .apiId()
        .errors()
        .map(error => error.kind)
    ).toContain('duplicateApiId');
    expect(component.isSaving()).toBe(false);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('以新 ID 與說明儲存完整設定，保留原資料且不複製時間', async () => {
    const { component, service, dialog, pending, data } = await setup();
    component.valueModel.set({ apiId: ' copied ', description: ' 副本 ' });
    component.onSave();
    component.onSave();
    component.onCancel();
    expect(service.update).toHaveBeenCalledTimes(1);
    const request = service.update.mock.calls[0][0];
    expect(request).toEqual({
      apiId: 'copied',
      description: '副本',
      config: source.config,
    });
    expect(request.config).not.toBe(data.config);
    expect(request.config.httpParams).not.toBe(data.config.httpParams);
    expect(data).toEqual(source);
    expect(dialog.disableClose).toBe(true);
    expect(dialog.close).not.toHaveBeenCalled();
    pending.next();
    pending.complete();
    expect(dialog.close).toHaveBeenCalledWith(true);
    expect(dialog.disableClose).toBe(false);
  });

  it('儲存失敗保留輸入並可重試', async () => {
    const { component, service, dialog, pending } = await setup();
    component.valueModel.set({ apiId: 'copied', description: '副本' });
    component.onSave();
    pending.error(new Error('Save failed'));
    expect(component.saveFailed()).toBe(true);
    expect(component.isSaving()).toBe(false);
    expect(component.valueModel()).toEqual({
      apiId: 'copied',
      description: '副本',
    });
    expect(dialog.close).not.toHaveBeenCalled();
    const retry = new Subject<void>();
    service.update.mockReturnValue(retry);
    component.onSave();
    retry.next();
    retry.complete();
    expect(dialog.close).toHaveBeenCalledWith(true);
  });

  it('ID 檢查失敗不送出儲存，保留輸入並可重試', async () => {
    const { component, service, dialog, pending } = await setup();
    service.exist.mockReturnValue(
      throwError(() => new Error('Exist check failed'))
    );
    component.valueModel.set({ apiId: 'copied', description: '副本' });
    component.onSave();
    expect(service.update).not.toHaveBeenCalled();
    expect(component.saveFailed()).toBe(true);
    expect(component.isSaving()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(dialog.close).not.toHaveBeenCalled();
    service.exist.mockReturnValue(of(false));
    component.onSave();
    pending.next();
    pending.complete();
    expect(dialog.close).toHaveBeenCalledWith(true);
  });

  it('重複 ID 改成新 ID 後重新檢查，通過才建立副本', async () => {
    const { component, service } = await setup();
    service.exist.mockReturnValueOnce(of(true)).mockReturnValueOnce(of(false));
    component.valueForm.apiId().value.set('existing');
    component.onSave();
    expect(service.update).not.toHaveBeenCalled();
    component.valueForm.apiId().value.set(' new-id ');
    component.onSave();
    expect(service.exist).toHaveBeenLastCalledWith('new-id');
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({ apiId: 'new-id' })
    );
  });

  it('取消不儲存資料', async () => {
    const { component, service, dialog } = await setup();
    component.onCancel();
    expect(dialog.close).toHaveBeenCalledWith();
    expect(service.update).not.toHaveBeenCalled();
  });
});
