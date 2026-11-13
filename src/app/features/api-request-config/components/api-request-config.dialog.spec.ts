import { EditMode } from '../../../core/model/global.model';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MATERIAL_ANIMATIONS } from '@angular/material/core';
import { CdkDragDrop } from '@angular/cdk/drag-drop';
import { MatTabGroupHarness } from '@angular/material/tabs/testing';
import { Component, input, model } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormValueControl } from '@angular/forms/signals';
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogRef,
} from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EMPTY, firstValueFrom, of, Subject } from 'rxjs';
import { GenericTableComponent } from '../../../core/components/generic-table/generic-table.component';
import { GenericTableRowField } from '../../../core/model/generic-table';
import { SignalCodeEditorComponent } from '../../../core/components/signal-code-editor/signal-code-editor.component';
import { SnackbarService } from '../../../core/services/snackbar.service';
import {
  ApiRequestBodyType,
  ApiRequestConfig,
  ApiRequestConfigDialogData,
  ApiRequestSettings,
  createApiRequestSettings,
  HttpMethodType,
} from '../model';
import { ApiRequestConfigService } from '../service/api-request-config.service';
import { ApiRequestConfigDialog } from './api-request-config.dialog';

@Component({ selector: 'app-signal-code-editor', template: '' })
class TestCodeEditor implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly language = input('');
  readonly indentWithTab = input(false);
}

const sourceSettings = {
  httpMethod: HttpMethodType.post,
  endpointUrl: 'https://example.com/items/{{$.id}}',
  requestBody: '{"id":"{{$.id}}","path":"$.id","enabled":true}',
  extraBackendSetting: { value: 42 },
};

const source: ApiRequestConfig = {
  apiId: 'update-item',
  description: '更新項目',
  config: createApiRequestSettings(sourceSettings),
  createdTime: new Date('2026-11-01T10:00:00Z'),
  updatedTime: new Date('2026-11-10T10:00:00Z'),
};

async function setup(
  type: EditMode = EditMode.EDIT,
  config: ApiRequestSettings = source.config
) {
  const pending = new Subject<void>();
  const service = {
    update: vi.fn((_request: ApiRequestConfig) => pending),
    exist: vi.fn((_apiId: string) => of(false)),
  };
  const dialog = { close: vi.fn(), disableClose: false };
  const bindings = { open: vi.fn(() => ({ afterClosed: () => EMPTY })) };
  const data: ApiRequestConfigDialogData = {
    value: { ...structuredClone(source), config: structuredClone(config) },
    type,
  };
  await TestBed.configureTestingModule({
    imports: [ApiRequestConfigDialog, TranslateModule.forRoot()],
    providers: [
      { provide: MATERIAL_ANIMATIONS, useValue: { animationsDisabled: true } },
      { provide: ApiRequestConfigService, useValue: service },
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialog },
      { provide: MatDialog, useValue: bindings },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
    ],
  })
    .overrideComponent(ApiRequestConfigDialog, {
      remove: { imports: [SignalCodeEditorComponent] },
      add: { imports: [TestCodeEditor] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(ApiRequestConfigDialog);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    service,
    dialog,
    pending,
    data,
    bindings,
  };
}

describe('API 請求設定編輯', () => {
  it('儲存保留完整 JSON 與 JSONPath，且不改寫來源資料或送出後端時間', async () => {
    const { component, service, pending, dialog, data } = await setup();
    component.valueForm.description().value.set(' 修改說明 ');
    component.onSave();
    component.onSave();
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update).toHaveBeenCalledWith({
      apiId: source.apiId,
      description: '修改說明',
      config: source.config,
    });
    expect(data.value).toEqual(source);
    expect(component.isSaving()).toBe(true);
    expect(dialog.disableClose).toBe(true);
    component.onCancel();
    expect(dialog.close).not.toHaveBeenCalled();
    pending.next();
    pending.complete();
    expect(dialog.close).toHaveBeenCalledWith(true);
    expect(component.isSaving()).toBe(false);
    expect(dialog.disableClose).toBe(false);
  });

  it.each(Object.values(HttpMethodType))(
    '方法 %s 允許空白的 Body，儲存時維持字串',
    async method => {
      const { component, service, pending } = await setup();
      component.valueForm.config.httpMethod().value.set(method);
      component.valueForm.config.requestBody().value.set('');
      component.onSave();
      expect(service.update).toHaveBeenLastCalledWith(
        expect.objectContaining({
          config: expect.objectContaining({
            httpMethod: method,
            requestBody: '',
          }),
        })
      );
      pending.next();
      pending.complete();
    }
  );

  it('URL 不可留白，但不在前端驗證變數或 URL 模板語法', async () => {
    const { component, service } = await setup();
    component.valueForm.config.endpointUrl().value.set('   ');
    component.onSave();
    expect(component.valueForm.config.endpointUrl().invalid()).toBe(true);
    expect(service.update).not.toHaveBeenCalled();
    component.valueForm.config.endpointUrl().value.set('  /items/{{$.id}}  ');
    component.onSave();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ endpointUrl: '/items/{{$.id}}' }),
      })
    );
  });

  it('錯誤 JSON 格式化時保留原文，仍可儲存字串；編輯後移除過時提示', async () => {
    const { component, service } = await setup();
    const body = '  id={{$.id}}\npath=$.id  ';
    component.valueForm.config.requestBody().value.set(body);
    expect(() => component.formatBody()).not.toThrow();
    expect(component.bodyFormatFailed()).toBe(true);
    expect(component.valueModel().config.requestBody).toBe(body);
    expect(component.valueForm().valid()).toBe(true);
    const editedBody = `${body}\ndifferent body`;
    component.valueForm.config.requestBody().value.set(editedBody);
    expect(component.bodyFormatFailed()).toBe(false);
    component.onSave();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({ requestBody: editedBody }),
      })
    );
  });

  it('從畫面編輯 Method、URL 與 Body，儲存到同一份 config 並保留其他設定', async () => {
    const { fixture, component, service } = await setup();
    const method: HTMLSelectElement = fixture.nativeElement.querySelector(
      '#request-method select'
    );
    method.value = HttpMethodType.put;
    method.dispatchEvent(new Event('input'));
    const url: HTMLInputElement =
      fixture.nativeElement.querySelector('#request-url input');
    url.value = 'https://example.com/other/{{$.id}}';
    url.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.valueModel().config.httpMethod).toBe(HttpMethodType.put);
    expect(component.valueModel().config.endpointUrl).toBe(url.value);
    expect(component.valueModel().config.requestBody).toBe(
      source.config.requestBody
    );
    const tabs =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatTabGroupHarness
      );
    await tabs.selectTab({ label: 'Body' });
    const editor: TestCodeEditor = fixture.debugElement.query(
      By.directive(TestCodeEditor)
    ).componentInstance;
    const body = '{"id":"$.id","description":"{{$.description}}"}';
    editor.value.set(body);
    await fixture.whenStable();
    component.onSave();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        config: {
          ...source.config,
          httpMethod: HttpMethodType.put,
          endpointUrl: url.value,
          requestBody: body,
        },
      })
    );
  });

  it.each(['', '   '])(
    'API ID 為空值或純空白時只顯示一行必填提示：%j',
    async apiId => {
      const { fixture, component, service } = await setup(EditMode.CREATE);
      const translate = TestBed.inject(TranslateService);
      translate.setTranslation('zh-tw', {
        apiRequestConfig: { errors: { required: '請填寫 API ID。' } },
      });
      await firstValueFrom(translate.use('zh-tw'));
      component.valueForm.apiId().value.set(apiId);
      component.onSave();
      await fixture.whenStable();

      expect(component.valueForm.apiId().required()).toBe(true);
      expect(
        component.valueForm
          .apiId()
          .errors()
          .map(error => error.kind)
      ).toEqual(['required']);
      const input: HTMLInputElement =
        fixture.nativeElement.querySelector('#apiId input');
      const alerts = input
        .closest('app-signal-field')!
        .querySelectorAll('[role="alert"]');
      expect(alerts).toHaveLength(1);
      expect(alerts[0].textContent?.trim()).toBe('請填寫 API ID。');
      expect(service.update).not.toHaveBeenCalled();
    }
  );

  it('新增時檢查去除空白後的重複 ID，並拒絕純空白', async () => {
    const { component, service } = await setup(EditMode.CREATE);
    service.exist.mockReturnValue(of(true));
    component.valueForm.apiId().value.set(' server-only-id ');
    component.onSave();
    expect(
      component.valueForm
        .apiId()
        .errors()
        .map(error => error.kind)
    ).toContain('duplicateApiId');
    expect(service.exist).toHaveBeenCalledWith('server-only-id');
    expect(component.isSaving()).toBe(false);
    component.valueForm.apiId().value.set('   ');
    component.onSave();
    expect(component.valueForm.apiId().invalid()).toBe(true);
    expect(service.update).not.toHaveBeenCalled();
  });

  it('新增送出前等待後端確認 ID 未使用，檢查期間阻擋重複提交', async () => {
    const { component, service, dialog, pending } = await setup(
      EditMode.CREATE
    );
    const checking = new Subject<boolean>();
    service.exist.mockReturnValue(checking);
    component.valueForm.apiId().value.set(' new-id ');
    component.onSave();
    component.onSave();
    expect(service.exist).toHaveBeenCalledTimes(1);
    expect(service.exist).toHaveBeenCalledWith('new-id');
    expect(service.update).not.toHaveBeenCalled();
    expect(component.isSaving()).toBe(true);
    checking.next(false);
    checking.complete();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({ apiId: 'new-id' })
    );
    pending.next();
    pending.complete();
    expect(dialog.close).toHaveBeenCalledWith(true);
  });

  it('編輯既有 ID 時不呼叫存在檢查', async () => {
    const { component, service } = await setup(EditMode.EDIT);
    component.onSave();
    expect(service.exist).not.toHaveBeenCalled();
    expect(service.update).toHaveBeenCalledTimes(1);
  });

  it('Body 格式化只在明確操作時更新 Signal Forms，不解析 JSONPath', async () => {
    const { component } = await setup();
    component.formatBody();
    expect(component.valueModel().config.requestBody).toBe(
      JSON.stringify(JSON.parse(source.config.requestBody), null, 2)
    );
    expect(component.valueModel().config.requestBody).toContain('{{$.id}}');
    expect(component.valueModel().config['extraBackendSetting']).toEqual({
      value: 42,
    });
    expect(component.valueForm.config.requestBody().dirty()).toBe(true);
  });

  it('儲存失敗保留內容、解除鎖定，允許重試', async () => {
    const { component, service, pending, dialog } = await setup();
    component.valueForm.description().value.set('尚未儲存');
    component.onSave();
    pending.error(new Error('Save failed'));
    expect(component.saveFailed()).toBe(true);
    expect(component.isSaving()).toBe(false);
    expect(component.valueModel().description).toBe('尚未儲存');
    expect(dialog.close).not.toHaveBeenCalled();
    const retry = new Subject<void>();
    service.update.mockReturnValue(retry);
    component.onSave();
    expect(service.update).toHaveBeenCalledTimes(2);
    retry.next();
    retry.complete();
    expect(dialog.close).toHaveBeenCalledWith(true);
  });
  it('使用預設值建立設定時補齊 10 秒與啟用狀態，不覆寫既有 Body', async () => {
    const basic = {
      httpMethod: HttpMethodType.post,
      endpointUrl: '/items?tag=a&tag=b',
      requestBody: '{{$.id}}',
    };
    const { component } = await setup(
      EditMode.EDIT,
      createApiRequestSettings(basic)
    );
    expect(structuredClone(component.valueModel().config)).toEqual(
      expect.objectContaining({
        ...basic,
        timeoutMs: 10000,
        enabled: true,
        successMessage: '',
        httpParams: [
          { seq: 1, name: 'tag', value: 'a', enabled: true },
          { seq: 2, name: 'tag', value: 'b', enabled: true },
        ],
      })
    );
  });

  it('從 URL 讀取 Params，表格編輯與勾選立即同步 URL 並保留變數', async () => {
    const { fixture, component, service } = await setup();
    const url: HTMLInputElement =
      fixture.nativeElement.querySelector('#request-url input');
    const inputHandler = vi.spyOn(component, 'onEndpointUrlInput');
    expect(url.getAttribute('aria-describedby')).toBe('request-config-help');
    url.value = 'https://example.com/items?tag=a&tag=b&id={{$.id}}#detail';
    url.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(inputHandler).toHaveBeenCalledTimes(1);
    expect(component.valueModel().config.httpParams).toHaveLength(3);
    const value: HTMLInputElement = fixture.nativeElement.querySelector(
      'app-generic-table td.mat-column-value input'
    );
    value.focus();
    value.value = 'new & value';
    value.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.valueModel().config.endpointUrl).toContain(
      'tag=new%20%26%20value'
    );
    expect(
      fixture.nativeElement.querySelector(
        'app-generic-table td.mat-column-value input'
      )
    ).toBe(value);
    const checkbox: HTMLInputElement = fixture.nativeElement.querySelector(
      'tbody input[type="checkbox"]'
    );
    const changeHandler = vi.spyOn(component, 'onParamEnabledChange');
    checkbox.click();
    await fixture.whenStable();
    expect(changeHandler).toHaveBeenCalledTimes(1);
    expect(component.valueModel().config.endpointUrl).toBe(
      'https://example.com/items?tag=b&id={{$.id}}#detail'
    );
    expect(component.valueModel().config.httpParams[0]).toEqual(
      expect.objectContaining({ value: 'new & value', enabled: false })
    );
    checkbox.click();
    await fixture.whenStable();
    expect(component.valueModel().config.endpointUrl).toContain(
      'tag=new%20%26%20value'
    );
    component.onSave();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          httpParams: structuredClone(component.valueModel().config.httpParams),
        }),
      })
    );
  });

  it('Params 透過 generic-table 新增、排序與刪除時同步 URL 與 seq', async () => {
    const { fixture, component, service } = await setup(EditMode.EDIT, {
      ...source.config,
      endpointUrl: '/items?tag=a&tag=b#detail',
    });
    const table: GenericTableComponent = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance;
    table.onAdd();
    await fixture.whenStable();
    expect(component.valueModel().config.endpointUrl).toBe(
      '/items?tag=a&tag=b#detail'
    );
    const input: HTMLInputElement = fixture.nativeElement.querySelectorAll(
      'app-generic-table td.mat-column-name input'
    )[2];
    input.value = 'flag';
    input.dispatchEvent(new Event('input'));
    await fixture.whenStable();
    expect(component.valueModel().config.endpointUrl).toBe(
      '/items?tag=a&tag=b&flag=#detail'
    );
    table.drop({ previousIndex: 2, currentIndex: 0 } as CdkDragDrop<
      GenericTableRowField[]
    >);
    await fixture.whenStable();
    expect(component.valueModel().config.endpointUrl).toBe(
      '/items?flag=&tag=a&tag=b#detail'
    );
    table.onDelete(1);
    await fixture.whenStable();
    expect(component.valueModel().config.endpointUrl).toBe(
      '/items?flag=&tag=b#detail'
    );
    expect(
      component.valueModel().config.httpParams.map(row => row.seq)
    ).toEqual([1, 2]);
    component.onSave();
    expect(service.update.mock.calls[0][0].config.httpParams).toEqual([
      { seq: 1, name: 'flag', value: '', enabled: true },
      { seq: 2, name: 'tag', value: 'b', enabled: true },
    ]);
    table.onAdd();
    table.onDelete(0);
    table.drop({ previousIndex: 0, currentIndex: 1 } as CdkDragDrop<
      GenericTableRowField[]
    >);
    expect(component.valueModel().config.endpointUrl).toBe(
      '/items?flag=&tag=b#detail'
    );
    expect(component.valueModel().config.httpParams).toHaveLength(2);
  });

  it('切換 Editor 語言、Form 與 None 不遺失內容，停用列會保存在設定', async () => {
    const { fixture, component, service } = await setup();
    const tabs =
      await TestbedHarnessEnvironment.loader(fixture).getHarness(
        MatTabGroupHarness
      );
    await tabs.selectTab({ label: 'Body' });
    for (const [type, language] of [
      [ApiRequestBodyType.text, ''],
      [ApiRequestBodyType.javascript, 'javascript'],
      [ApiRequestBodyType.html, 'html'],
      [ApiRequestBodyType.xml, 'xml'],
    ] as const) {
      component.valueForm.config.bodyType().value.set(type);
      await fixture.whenStable();
      const editor: TestCodeEditor = fixture.debugElement.query(
        By.directive(TestCodeEditor)
      ).componentInstance;
      expect(editor.language()).toBe(language);
      expect(editor.value()).toBe(source.config.requestBody);
    }
    component.valueForm.config
      .bodyType()
      .value.set(ApiRequestBodyType.formData);
    await fixture.whenStable();
    const bodyTable: GenericTableComponent = fixture.debugElement.queryAll(
      By.directive(GenericTableComponent)
    )[1].componentInstance;
    bodyTable.onAdd();
    await fixture.whenStable();
    const bodyElement: HTMLElement = fixture.debugElement.queryAll(
      By.directive(GenericTableComponent)
    )[1].nativeElement;
    const name = bodyElement.querySelector<HTMLInputElement>(
      '.mat-column-name input'
    )!;
    const bodyValue = bodyElement.querySelector<HTMLInputElement>(
      '.mat-column-value input'
    )!;
    name.value = 'id';
    name.dispatchEvent(new Event('input'));
    bodyValue.value = ' {{$.id}} ';
    bodyValue.dispatchEvent(new Event('input'));
    bodyValue.dispatchEvent(new Event('blur'));
    bodyElement
      .querySelector<HTMLInputElement>('input[type="checkbox"]')!
      .click();
    component.valueForm.config.bodyType().value.set(ApiRequestBodyType.none);
    await tabs.selectTab({ label: 'Params' });
    await tabs.selectTab({ label: 'Body' });
    component.valueForm.config
      .bodyType()
      .value.set(ApiRequestBodyType.formUrlEncoded);
    const enabled: HTMLInputElement = fixture.nativeElement.querySelector(
      '#request-enabled input'
    );
    enabled.click();
    component.valueForm.config.successMessage().value.set('Completed');
    await fixture.whenStable();
    expect(component.valueModel().config.bodyFormFields).toHaveLength(1);
    expect(component.valueModel().config.requestBody).toBe(
      source.config.requestBody
    );
    component.onSave();
    expect(service.update).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          bodyType: ApiRequestBodyType.formUrlEncoded,
          enabled: false,
          successMessage: 'Completed',
          bodyFormFields: [
            { seq: 1, name: 'id', value: ' {{$.id}} ', enabled: false },
          ],
        }),
      })
    );
  });

  it('Authorization 沿用已儲存的 apiId，新設定尚未儲存時不建立綁定', async () => {
    const { component, bindings, data } = await setup();
    component.openCookies();
    expect(bindings.open).toHaveBeenLastCalledWith(
      expect.anything(),
      expect.objectContaining({ data: { refId: source.apiId, mapType: 'API' } })
    );
    component.openHeaders();
    expect(bindings.open).toHaveBeenCalledTimes(2);
    data.type = EditMode.CREATE;
    component.openCookies();
    component.openHeaders();
    expect(bindings.open).toHaveBeenCalledTimes(2);
  });

  it.each([0, -1, 1.5])('拒絕無效 timeoutMs=%s', async timeout => {
    const { component, service } = await setup();
    component.valueForm.config.timeoutMs().value.set(timeout);
    component.onSave();
    expect(component.valueForm.config.timeoutMs().invalid()).toBe(true);
    expect(service.update).not.toHaveBeenCalled();
  });
});
