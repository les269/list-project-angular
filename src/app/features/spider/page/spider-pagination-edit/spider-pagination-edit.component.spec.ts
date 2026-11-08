import { ChipInputComponent } from '../../../../core/components/chip-input/chip-input.component';
import { By } from '@angular/platform-browser';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import {
  LastUpdateMode,
  ParamType,
  SpiderPagination,
  EndTimeType,
  ExtractionRuleMode,
} from '../../model';
import { SpiderPaginationService } from '../../services';
import { SpiderPaginationEditComponent } from './spider-pagination-edit.component';

async function setup() {
  const pending = new Subject<void>();
  const service = {
    getById: vi.fn(),
    isInUse: vi.fn(() => of(false)),
    update: vi.fn((_request: SpiderPagination) => pending),
  };
  const router = { navigate: vi.fn() };
  await TestBed.configureTestingModule({
    imports: [SpiderPaginationEditComponent, TranslateModule.forRoot()],
    providers: [
      provideHttpClient(),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({})) },
      },
      { provide: Router, useValue: router },
      { provide: SpiderPaginationService, useValue: service },
      { provide: MatDialog, useValue: { open: vi.fn() } },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
    ],
  }).compileComponents();
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
  return { fixture, component, service, router, pending };
}

describe('SpiderPaginationEditComponent', () => {
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
      'select[aria-label="spiderPagination.lastUpdateMode"]'
    ) as HTMLSelectElement;
    mode.value = LastUpdateMode.USE_PARAM;
    mode.dispatchEvent(new Event('input', { bubbles: true }));
    mode.dispatchEvent(new Event('change'));
    expect(c.form.paginationConfig.updateControl.lastUpdateMode().value()).toBe(
      LastUpdateMode.USE_PARAM
    );
    await fixture.whenStable();
    const reference = fixture.nativeElement.querySelector(
      'select[aria-label="spiderPagination.paramReference"]'
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
        'input[aria-label="spiderPagination.dataIdKey"].is-invalid'
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
