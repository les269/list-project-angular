import { Component, input, model } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormValueControl } from '@angular/forms/signals';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { provideTranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { SignalCodeEditorComponent } from '../../../core/components/signal-code-editor/signal-code-editor.component';
import {
  ApiRequestConfig,
  CallApiRequest,
  CallApiResponse,
  createApiRequestSettings,
} from '../model';
import { ApiRequestConfigService } from '../service/api-request-config.service';
import { CallApiDialogComponent } from './call-api-dialog.component';

@Component({ selector: 'app-signal-code-editor', template: '' })
class TestCodeEditor implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly language = input('');
  readonly indentWithTab = input(false);
}

async function setup(enabled = true) {
  const pending = new Subject<HttpResponse<CallApiResponse>>();
  const service = { callApi: vi.fn((_request: CallApiRequest) => pending) };
  const data: ApiRequestConfig = {
    apiId: 'update-item',
    description: '更新項目',
    config: createApiRequestSettings({ enabled }),
  };
  const dialog = { close: vi.fn(), disableClose: false };
  await TestBed.configureTestingModule({
    imports: [CallApiDialogComponent],
    providers: [
      provideTranslateService(),
      { provide: MAT_DIALOG_DATA, useValue: data },
      { provide: MatDialogRef, useValue: dialog },
      { provide: ApiRequestConfigService, useValue: service },
    ],
  })
    .overrideComponent(CallApiDialogComponent, {
      remove: { imports: [SignalCodeEditorComponent] },
      add: { imports: [TestCodeEditor] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(CallApiDialogComponent);
  await fixture.whenStable();
  return {
    fixture,
    component: fixture.componentInstance,
    dialog,
    pending,
    service,
  };
}

describe('API 執行畫面', () => {
  it('使用 JSON Editor 輸入參數，Headers 與 Body 分別唯讀顯示', async () => {
    const { fixture, component, dialog } = await setup();
    const editors = fixture.debugElement
      .queryAll(By.directive(TestCodeEditor))
      .map(element => element.componentInstance as TestCodeEditor);
    expect(editors).toHaveLength(3);
    expect(editors[0].value()).toBe('{}');
    expect(editors[0].language()).toBe('json');
    const parameters = '{"id":123,"template":"{{$.id}}"}';
    editors[0].value.set(parameters);
    component.result.set({
      status: 200,
      headers: '{"content-type":["text/html"]}',
      body: '<script>window.executed = true</script>',
      bodyLanguage: '',
    });
    await fixture.whenStable();
    expect(component.valueModel().parameters).toBe(parameters);
    expect(component.valueForm().valid()).toBe(true);
    expect(editors[1].readonly()).toBe(true);
    expect(editors[1].value()).toContain('content-type');
    expect(editors[2].readonly()).toBe(true);
    expect(editors[2].value()).toContain('<script>');
    expect(fixture.nativeElement.querySelector('script')).toBeNull();
    const sections = fixture.nativeElement.querySelectorAll(
      '.response-grid section'
    );
    expect(sections[0].getAttribute('aria-labelledby')).toBe(
      'call-api-headers-label'
    );
    expect(sections[1].getAttribute('aria-labelledby')).toBe(
      'call-api-body-label'
    );
    const actions: HTMLElement =
      fixture.nativeElement.querySelector('mat-dialog-actions');
    expect(actions.getAttribute('align')).toBe('start');
    expect(actions.querySelector('button')!.getAttribute('form')).toBe(
      'call-api-form'
    );
    component.onClose();
    expect(dialog.close).toHaveBeenCalledOnce();
  });

  it('拒絕錯誤 JSON 與非物件參數，保留輸入供修正', async () => {
    const { fixture, component, service } = await setup();
    for (const parameters of ['', '{', 'null', '[]', '123', '"text"']) {
      component.valueForm.parameters().value.set(parameters);
      component.onExecute(new Event('submit'));
      await fixture.whenStable();
      expect(component.valueForm().invalid()).toBe(true);
      expect(component.valueModel().parameters).toBe(parameters);
      expect(
        fixture.nativeElement.querySelector('[role="alert"]')
      ).not.toBeNull();
    }
    component.valueForm.parameters().value.set('{}');
    await fixture.whenStable();
    expect(component.valueForm().valid()).toBe(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
    expect(service.callApi).not.toHaveBeenCalled();
  });

  it('執行時傳送 apiId 與 JSON 物件，防止重複提交並顯示完整回應', async () => {
    const { fixture, component, service, pending, dialog } = await setup();
    component.valueForm.parameters().value.set('{"id":123,"path":"{{$.id}}"}');
    const form: HTMLFormElement = fixture.nativeElement.querySelector('form');
    form.dispatchEvent(
      new Event('submit', { bubbles: true, cancelable: true })
    );
    component.onExecute();
    expect(service.callApi).toHaveBeenCalledExactlyOnceWith({
      apiId: 'update-item',
      json: { id: 123, path: '{{$.id}}' },
    });
    expect(component.isRunning()).toBe(true);
    expect(dialog.disableClose).toBe(true);
    expect(component.valueForm.parameters().readonly()).toBe(true);
    component.onClose();
    expect(dialog.close).not.toHaveBeenCalled();
    const body = [{ id: 123, value: 'kept' }];
    pending.next(
      new HttpResponse({
        status: 200,
        headers: new HttpHeaders({ 'X-Test': ['first', 'second'] }),
        body,
      })
    );
    pending.complete();
    await fixture.whenStable();
    expect(component.result()?.status).toBe(200);
    expect(JSON.parse(component.result()!.headers)).toEqual({
      'X-Test': ['first', 'second'],
    });
    expect(component.result()?.body).toBe(JSON.stringify(body, null, 2));
    expect(component.result()?.bodyLanguage).toBe('json');
    expect(component.isRunning()).toBe(false);
    expect(component.valueForm.parameters().readonly()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(fixture.nativeElement.textContent).toContain('HTTP 200');
  });

  it('失敗時顯示錯誤的 Headers 與原始 Body，保留參數並允許重試', async () => {
    const { fixture, component, pending, service, dialog } = await setup();
    const parameters = '{"id":123}';
    component.valueForm.parameters().value.set(parameters);
    component.onExecute();
    const body = '<html>Bad Gateway</html>';
    pending.error(
      new HttpErrorResponse({
        status: 502,
        headers: new HttpHeaders({ 'Content-Type': 'text/html' }),
        error: body,
      })
    );
    await fixture.whenStable();
    expect(component.executionFailed()).toBe(true);
    expect(component.result()?.status).toBe(502);
    expect(component.result()?.body).toBe(body);
    expect(component.result()?.bodyLanguage).toBe('');
    expect(JSON.parse(component.result()!.headers)).toEqual({
      'Content-Type': ['text/html'],
    });
    expect(component.valueModel().parameters).toBe(parameters);
    expect(component.isRunning()).toBe(false);
    expect(dialog.disableClose).toBe(false);
    expect(
      fixture.nativeElement.querySelector('[role="alert"]')
    ).not.toBeNull();
    const retry = new Subject<HttpResponse<CallApiResponse>>();
    service.callApi.mockReturnValue(retry);
    component.onExecute();
    expect(service.callApi).toHaveBeenCalledTimes(2);
    expect(component.executionFailed()).toBe(false);
    expect(component.result()).toBeUndefined();
    retry.next(new HttpResponse<CallApiResponse>({ status: 204 }));
    retry.complete();
    await fixture.whenStable();
    expect(component.result()?.body).toBe('');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeNull();
  });

  it('停用的 API 無法從按鈕或程式呼叫執行', async () => {
    const { fixture, component, service } = await setup(false);
    component.onExecute();
    expect(service.callApi).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('button[form="call-api-form"]')
        .disabled
    ).toBe(true);
  });

  it('畫面銷毀會取消訂閱，並還原原本的關閉設定', async () => {
    const { fixture, component, pending, dialog } = await setup();
    dialog.disableClose = true;
    component.onExecute();
    expect(pending.observed).toBe(true);
    fixture.destroy();
    expect(pending.observed).toBe(false);
    expect(component.isRunning()).toBe(false);
    expect(dialog.disableClose).toBe(true);
  });
});
import {
  HttpErrorResponse,
  HttpHeaders,
  HttpResponse,
} from '@angular/common/http';
