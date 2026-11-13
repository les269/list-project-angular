import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { By } from '@angular/platform-browser';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  LastUpdateMode,
  ParamType,
  SpiderPagination,
  EndTimeType,
  ExtractionRuleMode,
  SpiderItem,
  UrlType,
} from '../../model';
import { SpiderPaginationService, SpiderService } from '../../services';
import { SpiderPaginationEditComponent } from './spider-pagination-edit.component';

// 保留表單綁定，隔離第三方編輯器對瀏覽器排版 API 的依賴。
@Component({ selector: 'app-signal-code-editor', template: '' })
class TestCodeEditor implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly readonly = input(false);
  readonly language = input('');
  readonly indentWithTab = input(false);
}

async function setup() {
  const pending = new Subject<void>();
  const previewPending = new Subject<unknown>();
  const spiderService = {
    previewExtraction: vi.fn((_request: SpiderItem) => previewPending),
  };
  const snackbar = { openI18N: vi.fn() };
  const service = {
    getById: vi.fn(),
    isInUse: vi.fn(() => of(false)),
    update: vi.fn((_request: SpiderPagination) => pending),
  };
  const router = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [SpiderPaginationEditComponent],
    providers: [
      provideTranslateService(),
      provideHttpClient(),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({})) },
      },
      { provide: Router, useValue: router },
      { provide: SpiderPaginationService, useValue: service },
      { provide: SpiderService, useValue: spiderService },
      { provide: MatDialog, useValue: { open: vi.fn() } },
      { provide: SnackbarService, useValue: snackbar },
    ],
  })
    .overrideComponent(SpiderPaginationEditComponent, {
      remove: { imports: [SignalCodeEditorComponent] },
      add: { imports: [TestCodeEditor] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(SpiderPaginationEditComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  component.model.update(v => ({
    ...v,
    spiderPaginationId: 'anidb',
    paginationConfig: {
      ...v.paginationConfig,
      startUrl: 'https://example.com/{year}',
      groupIdTemplate: 'anidb-{year}',
      dataIdKey: 'id',
    },
  }));
  return {
    fixture,
    component,
    service,
    router,
    pending,
    spiderService,
    previewPending,
    snackbar,
  };
}

describe('SpiderPaginationEditComponent', () => {
  it('切換擷取模式時切換 code 區並保留各自輸入，結果區唯讀', async () => {
    const { component: c, fixture } = await setup();
    const editors = () =>
      fixture.debugElement
        .queryAll(By.directive(TestCodeEditor))
        .map(element => element.componentInstance as TestCodeEditor);
    expect(editors()[0].language()).toBe('html');
    editors()[0].value.set('<p>sample</p>');
    await fixture.whenStable();
    expect(c.testModel().html).toBe('<p>sample</p>');
    c.form.paginationConfig
      .extractionRuleMode()
      .value.set(ExtractionRuleMode.JSON_PATH);
    await fixture.whenStable();
    expect(editors()[0].language()).toBe('json');
    editors()[0].value.set('{"id":1}');
    await fixture.whenStable();
    c.onFormatJson();
    expect(c.testModel().json).toBe('{\n  "id": 1\n}');
    c.form.paginationConfig
      .extractionRuleMode()
      .value.set(ExtractionRuleMode.SELECT);
    await fixture.whenStable();
    expect(editors()[0].value()).toBe('<p>sample</p>');
    expect(editors()[1].readonly()).toBe(true);
  });

  it.each([ExtractionRuleMode.SELECT, ExtractionRuleMode.JSON_PATH])(
    '以 %s 模式及未儲存規則預覽，阻止重複送出並顯示結果',
    async mode => {
      const {
        component: c,
        fixture,
        spiderService,
        previewPending,
        service,
      } = await setup();
      fixture.debugElement
        .queryAll(By.directive(GenericTableComponent))[1]
        .componentInstance.onAdd();
      const config = c.form.paginationConfig;
      const rule = config.extractionRuleList[0];
      rule.key().value.set('id');
      rule.selector().value.set('p');
      rule.jsonPath().value.set('$.id');
      config.extractionRuleMode().value.set(mode);
      c.testForm.html().value.set('<p>sample</p>');
      c.testForm.json().value.set('{"id":"sample"}');
      // 預覽擷取不需完成其他儲存用的必填欄位。
      c.form.paginationConfig.groupIdTemplate().value.set('');
      await fixture.whenStable();
      (
        fixture.nativeElement.querySelector(
          'button[aria-busy]'
        ) as HTMLButtonElement
      ).click();
      c.onTestParse();
      c.update();
      expect(spiderService.previewExtraction).toHaveBeenCalledTimes(1);
      expect(service.update).not.toHaveBeenCalled();
      expect(spiderService.previewExtraction.mock.calls[0][0]).toMatchObject({
        spiderItemId: 'anidb',
        itemSetting: {
          mode,
          urlType: UrlType.BY_PARAMS,
          extractionRuleList: [{ key: 'id', selector: 'p', jsonPath: '$.id' }],
          testData: {
            html: '<p>sample</p>',
            json: '{"id":"sample"}',
            resultJson: '',
          },
        },
      });
      expect(c.testing()).toBe(true);
      expect(c.testForm.html().disabled()).toBe(true);
      previewPending.next({ id: 'sample' });
      expect(c.testing()).toBe(false);
      expect(c.testModel().resultJson).toBe('{\n  "id": "sample"\n}');
    }
  );

  it('無效規則或 JSON 不送出預覽，JSON 格式化失敗保留原始資料', async () => {
    const { component: c, fixture, spiderService, snackbar } = await setup();
    fixture.debugElement
      .queryAll(By.directive(GenericTableComponent))[1]
      .componentInstance.onAdd();
    c.onTestParse();
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.formInvalid');
    expect(c.form.paginationConfig.extractionRuleList().touched()).toBe(true);
    const config = c.form.paginationConfig;
    config.extractionRuleMode().value.set(ExtractionRuleMode.JSON_PATH);
    config.extractionRuleList[0].key().value.set('id');
    config.extractionRuleList[0].jsonPath().value.set('$.id');
    c.testForm.json().value.set('invalid');
    c.onFormatJson();
    c.onTestParse();
    expect(c.testModel().json).toBe('invalid');
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.invalidJson');
    expect(spiderService.previewExtraction).not.toHaveBeenCalled();
  });

  it('預覽失敗清除舊結果並恢復操作，測試資料不寫入儲存契約', async () => {
    const { component: c, previewPending, service, snackbar } = await setup();
    c.testForm.html().value.set('<p>sample</p>');
    c.testForm.resultJson().value.set('old');
    c.onTestParse();
    expect(c.testModel().resultJson).toBe('');
    previewPending.error(new Error('Preview failed'));
    expect(c.testing()).toBe(false);
    expect(c.testForm.html().disabled()).toBe(false);
    expect(snackbar.openI18N).toHaveBeenCalledWith('msg.extractFailed', {
      message: 'Preview failed',
    });
    c.update();
    expect(service.update.mock.calls[0][0]).not.toHaveProperty('testData');
    expect(service.update.mock.calls[0][0].paginationConfig).not.toHaveProperty(
      'testData'
    );
  });

  it('預設保留歷史資料，取消勾選後儲存 false', async () => {
    const { component: c, fixture, service } = await setup();
    const checkbox = fixture.nativeElement.querySelector(
      'input[type="checkbox"]'
    ) as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
    checkbox.click();
    await fixture.whenStable();
    c.update();
    expect(service.update.mock.calls[0][0].paginationConfig.retainHistory).toBe(
      false
    );
  });

  it('依參數模式驗證作用中的欄位，並顯示對應輸入', async () => {
    const { component: c, fixture } = await setup();
    fixture.debugElement
      .query(By.directive(GenericTableComponent))
      .componentInstance.onAdd();
    const p = c.form.paginationConfig.paramSettings[0];
    p.paramKey().value.set('{year}');
    expect(c.form().invalid()).toBe(true);
    p.type().value.set(ParamType.NUMBER_RANGE);
    p.startNumStr().value.set('1980');
    p.endNumStr().value.set('2026');
    await fixture.whenStable();
    expect(c.form().valid()).toBe(true);
    expect(
      fixture.nativeElement.querySelector('input[type=checkbox]')
    ).toBeTruthy();
    p.endNumStr().value.set('1979');
    expect(c.form().invalid()).toBe(true);
  });

  it('刪除被更新控制引用的參數時阻止儲存', async () => {
    const { component: c, service, fixture } = await setup();
    fixture.debugElement
      .query(By.directive(GenericTableComponent))
      .componentInstance.onAdd();
    const p = c.form.paginationConfig.paramSettings[0];
    p.paramKey().value.set('{year}');
    p.staticList().value.set(['2026']);
    const control = c.form.paginationConfig.updateControl;
    control.lastUpdateMode().value.set(LastUpdateMode.USE_PARAM);
    control.lastUpdateParamKey().value.set('{year}');
    expect(c.form().valid()).toBe(true);
    fixture.debugElement
      .query(By.directive(GenericTableComponent))
      .componentInstance.onDelete(0);
    c.update();
    expect(c.form().invalid()).toBe(true);
    expect(service.update).not.toHaveBeenCalled();
    control.lastUpdateMode().value.set(LastUpdateMode.NONE);
    expect(c.form().valid()).toBe(true);
  });

  it('時間參數預設目前時間，picker 更新資料並禁止鍵盤輸入', async () => {
    const { component: c, fixture } = await setup();
    const table = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance as GenericTableComponent;
    table.onAdd();
    const p = c.form.paginationConfig.paramSettings[0];
    p.type().value.set(ParamType.TIME_RANGE);
    await fixture.whenStable();
    expect(Math.abs(p.startTime().value().getTime() - Date.now())).toBeLessThan(
      5000
    );
    expect(p.timeFormat().value()).toBe('yyyy-MM-dd');
    const input = fixture.nativeElement.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    const key = new KeyboardEvent('keydown', {
      key: '1',
      bubbles: true,
      cancelable: true,
    });
    input.dispatchEvent(key);
    expect(key.defaultPrevented).toBe(true);
    input.value = '2026-11-02T12:34:56';
    input.dispatchEvent(new Event('change'));
    expect(p.startTime().value()).toEqual(new Date('2026-11-02T12:34:56'));
    input.value = '';
    input.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(input.classList.contains('is-invalid')).toBe(true);
    expect(
      input.closest('app-signal-field')?.querySelector('.invalid-feedback')
    ).toBeTruthy();
  });

  it('時間參數只驗證目前終止模式的欄位，擷取規則依模式驗證', async () => {
    const { component: c, fixture } = await setup();
    fixture.debugElement
      .query(By.directive(GenericTableComponent))
      .componentInstance.onAdd();
    const p = c.form.paginationConfig.paramSettings[0];
    p.paramKey().value.set('{year}');
    p.type().value.set(ParamType.TIME_RANGE);
    p.startTime().value.set(new Date('1980-01-01T00:00:00'));
    expect(c.form().valid()).toBe(true);
    p.endTimeConfig.endTime().value.set(new Date(NaN));
    p.endTimeConfig.endTimeType().value.set(EndTimeType.FIXED);
    expect(c.form().invalid()).toBe(true);
    p.endTimeConfig.endTime().value.set(new Date('2026-12-31T00:00:00'));
    await fixture.whenStable();
    const endInput = fixture.nativeElement.querySelectorAll(
      'input[type="datetime-local"]'
    )[1] as HTMLInputElement;
    endInput.value = '2026-12-30T12:00:00';
    endInput.dispatchEvent(new Event('change'));
    expect(p.endTimeConfig.endTime().value()).toEqual(
      new Date('2026-12-30T12:00:00')
    );
    expect(c.form().valid()).toBe(true);
    fixture.debugElement
      .queryAll(By.directive(GenericTableComponent))[1]
      .componentInstance.onAdd();
    const r = c.form.paginationConfig.extractionRuleList[0];
    r.key().value.set('nextUrl');
    r.selector().value.set('a.next');
    await fixture.whenStable();
    expect(c.form().valid()).toBe(true);
    c.form.paginationConfig
      .extractionRuleMode()
      .value.set(ExtractionRuleMode.JSON_PATH);
    expect(c.form().invalid()).toBe(true);
    r.jsonPath().value.set('$.next');
    expect(c.form().valid()).toBe(true);
  });

  it('表格排序後詳細列仍操作對應參數，儲存時保留參數排序', async () => {
    const { component: c, fixture, service } = await setup();
    const table = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance as GenericTableComponent;
    table.onAdd();
    table.onAdd();
    const fields = c.form.paginationConfig.paramSettings;
    fields[0].paramKey().value.set('{year}');
    fields[0].staticList().value.set(['2026']);
    fields[1].paramKey().value.set('{code}');
    fields[1].staticList().value.set(['2330']);
    table.drop({ previousIndex: 0, currentIndex: 1 } as Parameters<
      GenericTableComponent['drop']
    >[0]);
    await fixture.whenStable();
    expect(fields[0].paramKey().value()).toBe('{code}');
    const chipInput = fixture.debugElement.query(
      By.directive(ChipInputComponent)
    ).componentInstance as ChipInputComponent;
    chipInput.editChip(0, '2317');
    await fixture.whenStable();
    expect(fields[0].staticList().value()).toEqual(['2317']);
    expect(fields[1].staticList().value()).toEqual(['2026']);
    c.update();
    const params =
      service.update.mock.calls[0][0].paginationConfig.paramSettings;
    expect(params.map(p => p.paramKey)).toEqual(['{code}', '{year}']);
    expect(params.map(p => p.seq)).toEqual([1, 2]);
  });

  it('欄位操作後顯示紅框與下方錯誤，修正後清除', async () => {
    const { component: c, fixture } = await setup();
    c.form.spiderPaginationId().value.set('');
    await fixture.whenStable();
    const input = fixture.nativeElement.querySelector(
      'input'
    ) as HTMLInputElement;
    expect(input.classList.contains('is-invalid')).toBe(false);
    input.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(input.classList.contains('is-invalid')).toBe(true);
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(
      input.closest('app-signal-field')?.querySelector('.invalid-feedback')
        ?.textContent
    ).toContain('formField.validation.required');
    c.form.spiderPaginationId().value.set('anidb');
    await fixture.whenStable();
    expect(input.classList.contains('is-invalid')).toBe(false);
    expect(
      input.closest('app-signal-field')?.querySelector('.invalid-feedback')
    ).toBeNull();
  });

  it('按下儲存後標示尚未操作的必填欄位', async () => {
    const { component: c, fixture, service } = await setup();
    c.form.spiderPaginationId().value.set('');
    c.update();
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('input.is-invalid')
    ).toBeTruthy();
    expect(
      fixture.nativeElement.querySelector('.invalid-feedback')
    ).toBeTruthy();
    expect(service.update).not.toHaveBeenCalled();
  });

  it('更新控制子元件直接編輯主表單，儲存中所有子欄位維持停用', async () => {
    const { component: c, fixture, service } = await setup();
    const table = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance as GenericTableComponent;
    table.onAdd();
    const param = c.form.paginationConfig.paramSettings[0];
    param.paramKey().value.set('{year}');
    param.type().value.set(ParamType.TIME_RANGE);
    await fixture.whenStable();
    const mode = fixture.nativeElement.querySelector(
      'app-signal-field[label="spiderPagination.lastUpdateMode"] select'
    ) as HTMLSelectElement;
    mode.value = LastUpdateMode.USE_PARAM;
    mode.dispatchEvent(new Event('input', { bubbles: true }));
    mode.dispatchEvent(new Event('change'));
    expect(c.form.paginationConfig.updateControl.lastUpdateMode().value()).toBe(
      LastUpdateMode.USE_PARAM
    );
    await fixture.whenStable();
    const reference = fixture.nativeElement.querySelector(
      'app-signal-field[label="spiderPagination.paramReference"] select'
    ) as HTMLSelectElement;
    reference.value = '{year}';
    reference.dispatchEvent(new Event('input', { bubbles: true }));
    reference.dispatchEvent(new Event('change'));
    expect(
      c.form.paginationConfig.updateControl.lastUpdateParamKey().value()
    ).toBe('{year}');
    c.update();
    await fixture.whenStable();
    expect(
      service.update.mock.calls[0][0].paginationConfig.updateControl
        .lastUpdateParamKey
    ).toBe('{year}');
    const controls = Array.from(
      fixture.nativeElement.querySelectorAll('input, select')
    ) as (HTMLInputElement | HTMLSelectElement)[];
    expect(controls.length).toBeGreaterThan(0);
    expect(controls.every(control => control.disabled)).toBe(true);
    table.onAdd();
    expect(c.form.paginationConfig.paramSettings().value()).toHaveLength(1);
  });

  it('載入 service 回傳的 Date 資料後仍能呈現與驗證', async () => {
    const { component: c, fixture } = await setup();
    const table = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance as GenericTableComponent;
    table.onAdd();
    const param = c.form.paginationConfig.paramSettings[0];
    param.paramKey().value.set('{year}');
    param.type().value.set(ParamType.TIME_RANGE);
    c.spiderPagination.set(structuredClone(c.model()));
    await fixture.whenStable();
    const loaded = c.form.paginationConfig.paramSettings[0];
    expect(loaded.startTime().value()).toBeInstanceOf(Date);
    expect(loaded.endTimeConfig.endTime().value()).toBeInstanceOf(Date);
    expect(
      c.form.paginationConfig.updateControl.lastUpdateDate().value()
    ).toBeInstanceOf(Date);
    expect(c.form().valid()).toBe(true);
    const date = fixture.nativeElement.querySelector(
      'input[type="datetime-local"]'
    ) as HTMLInputElement;
    expect(date.value).not.toBe('');
  });

  it('分組範本與單筆 ID 來源各自驗證必填，儲存時送出兩個欄位', async () => {
    const { component: c, fixture, service } = await setup();
    const config = c.form.paginationConfig;
    config.dataIdKey().value.set('');
    c.update();
    await fixture.whenStable();
    expect(service.update).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector(
        'app-signal-field[label="spiderPagination.dataIdKey"] input.is-invalid'
      )
    ).toBeTruthy();
    config.dataIdKey().value.set('id');
    config.groupIdTemplate().value.set('');
    expect(c.form().invalid()).toBe(true);
    config.groupIdTemplate().value.set('anime-{{$.year}}');
    c.update();
    const saved = service.update.mock.calls[0][0].paginationConfig;
    expect(saved.groupIdTemplate).toBe('anime-{{$.year}}');
    expect(saved.dataIdKey).toBe('id');
    expect(saved).not.toHaveProperty('dataIdTemplate');
  });

  it('儲存完整設定並阻止重複送出，成功後導向編輯頁', async () => {
    const { component: c, service, router, pending } = await setup();
    c.form.paginationConfig.requestIntervalMs().value.set(1500);
    c.update();
    c.update();
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(service.update.mock.calls[0][0]).toMatchObject({
      spiderPaginationId: 'anidb',
      paginationConfig: {
        groupIdTemplate: 'anidb-{year}',
        dataIdKey: 'id',
        requestIntervalMs: 1500,
        updateControl: { lastUpdateMode: LastUpdateMode.NONE },
      },
    });
    expect(c.saving()).toBe(true);
    pending.next();
    pending.complete();
    expect(c.saving()).toBe(false);
    expect(router.navigate).toHaveBeenCalledWith(
      ['spider-pagination-edit', 'anidb'],
      { replaceUrl: true }
    );
  });
});
