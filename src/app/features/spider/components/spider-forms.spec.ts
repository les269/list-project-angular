import { SignalCodeEditorComponent } from '../../../core/components/signal-code-editor/signal-code-editor.component';
import { Component, input, model, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormValueControl } from '@angular/forms/signals';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { ActivatedRoute, convertToParamMap, Router } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, Subject } from 'rxjs';
import { GenericTableComponent } from '../../../core/components/generic-table/generic-table.component';
import { MessageBoxService } from '../../../core/services/message-box.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { ReplaceValueMapService } from '../../replace-value-map/service/replace-value-map.service';
import {
  CookieListMapType,
  CookieListTO,
  HeadersMapType,
  HeadersTO,
  ExtractionRuleMode,
  ExtractionStepCondition,
  SpiderItem,
  SpiderConfig,
  UrlType,
  ValuePipeline,
  ValuePipelineType,
} from '../model';
import { CookieListService } from '../services/cookie-list.service';
import { CookieListMapService } from '../services/cookie-list-map.service';
import { HeadersService } from '../services/headers.service';
import { HeadersMapService } from '../services/headers-map.service';
import { SpiderConfigService } from '../services/spider-config.service';
import { SpiderItemService } from '../services/spider-item.service';
import { SpiderMappingService } from '../services/spider-mapping.service';
import { SpiderService } from '../services/spider.service';
import { SpiderEditComponent } from '../page/spider-edit/spider-edit.component';
import { CookieTableComponent } from './cookie-table/cookie-table.component';
import { HeadersTableComponent } from './headers-table/headers-table.component';
import { PipelineListComponent } from './pipeline-list/pipeline-list.component';
import { SpiderItemComponent } from './spider-item/spider-item.component';

// 只替換第三方編輯器，保留真正的表單與表格互動。
@Component({ selector: 'app-signal-code-editor', template: '' })
class TestCodeEditor implements FormValueControl<string> {
  readonly value = model('');
  readonly disabled = input(false);
  readonly language = input('');
  readonly languages = input<unknown[]>([]);
  readonly indentWithTab = input(false);
}

async function setup(realEditors = false, spiderId?: string) {
  const pending = new Subject<void>();
  const confirmation = new Subject<string>();
  const messages = { openI18N: vi.fn((): Observable<string> => confirmation) };
  const snackbar = { openI18N: vi.fn(), isBlankMessage: vi.fn() };
  // 模擬舊版資料缺少 pipeline 的其他欄位。
  const row = {
    seq: 1,
    name: 'name',
    value: 'value',
    valuePipelines: [
      { type: ValuePipelineType.FIXED_VALUE },
    ] as ValuePipeline[],
  };
  const cookies = {
    getByRefIdAndType: vi.fn(
      (): Observable<CookieListTO | undefined> => of(undefined)
    ),
    getAll: vi.fn(() => of([])),
    getByCookieId: vi.fn(() => of({ cookieId: 'selected', list: [row] })),
    update: vi.fn((): Observable<void> => pending),
    delete: vi.fn((): Observable<void> => pending),
  };
  const headers = {
    getByRefIdAndType: vi.fn(
      (): Observable<HeadersTO | undefined> => of(undefined)
    ),
    getAll: vi.fn(() => of([])),
    getByHeadersId: vi.fn(() => of({ headersId: 'selected', list: [row] })),
    update: vi.fn((): Observable<void> => pending),
    delete: vi.fn((): Observable<void> => pending),
  };
  const maps = {
    update: vi.fn((): Observable<void> => pending),
    delete: vi.fn((): Observable<void> => pending),
    cookieIsInUse: () => of(false),
    headersIsInUse: () => of(false),
  };
  const item: SpiderItem = {
    spiderItemId: 'item',
    description: '',
    itemSetting: {
      url: '',
      urlType: UrlType.BY_PRIME_KEY,
      mode: ExtractionRuleMode.SELECT,
      testData: { html: '', json: '', resultJson: '' },
      extractionRuleList: [],
      skipWhenUsingUrl: false,
    },
  };
  const items = {
    getAll: () => of([]),
    getItemBySpiderId: () => of([]),
    getBySpiderItemId: vi.fn(
      (): Observable<SpiderItem | undefined> => of(item)
    ),
    update: vi.fn((): Observable<void> => pending),
    delete: vi.fn((): Observable<void> => pending),
  };
  const mappings = {
    getBySpiderId: () => of([]),
    inUseBySpiderItemId: () => of(false),
    update: maps.update,
    delete: maps.delete,
    updateList: maps.update,
  };
  const config = {
    getBySpiderId: vi.fn(
      (): Observable<SpiderConfig | undefined> => of(undefined)
    ),
    isInUse: vi.fn(() => of(false)),
    update: vi.fn((): Observable<void> => pending),
  };
  const spider = {
    executeByPrimeKeyList: vi.fn((): Observable<object> => of({ ok: true })),
    executeByUrl: vi.fn(() => of({ ok: true })),
    previewExtraction: vi.fn(() => of({ ok: true })),
    previewExtractionWithFile: vi.fn(() => of({ ok: true })),
  };
  TestBed.configureTestingModule({
    imports: [
      CookieTableComponent,
      HeadersTableComponent,
      SpiderItemComponent,
      SpiderEditComponent,
    ],
    providers: [
      provideTranslateService(),
      { provide: CookieListService, useValue: cookies },
      { provide: CookieListMapService, useValue: maps },
      { provide: HeadersService, useValue: headers },
      { provide: HeadersMapService, useValue: maps },
      { provide: SpiderConfigService, useValue: config },
      { provide: SpiderItemService, useValue: items },
      { provide: SpiderMappingService, useValue: mappings },
      { provide: SpiderService, useValue: spider },
      { provide: MessageBoxService, useValue: messages },
      { provide: SnackbarService, useValue: snackbar },
      {
        provide: ReplaceValueMapService,
        useValue: { getNameList: () => of([]) },
      },
      { provide: MatDialog, useValue: { open: vi.fn() } },
      {
        provide: SelectTableService,
        useValue: {
          selectSingleCookieList: () => of({ cookieId: 'selected' }),
          selectSingleHeadersList: () => of({ headersId: 'selected' }),
          selectSingleSpiderItem: () => of({ spiderItemId: 'item' }),
        },
      },
      { provide: Router, useValue: { navigate: vi.fn() } },
      {
        provide: ActivatedRoute,
        useValue: {
          paramMap: of(convertToParamMap(spiderId ? { spiderId } : {})),
          snapshot: { queryParamMap: convertToParamMap({}) },
        },
      },
    ],
  });
  if (!realEditors) {
    TestBed.overrideComponent(SpiderItemComponent, {
      remove: { imports: [SignalCodeEditorComponent] },
      add: { imports: [TestCodeEditor] },
    })
      .overrideComponent(SpiderEditComponent, {
        remove: { imports: [SignalCodeEditorComponent] },
        add: { imports: [TestCodeEditor] },
      })
      .overrideComponent(PipelineListComponent, {
        remove: { imports: [SignalCodeEditorComponent] },
        add: { imports: [TestCodeEditor] },
      });
  }
  await TestBed.compileComponents();
  return {
    pending,
    confirmation,
    messages,
    snackbar,
    cookies,
    headers,
    maps,
    items,
    config,
    spider,
    item,
  };
}

const tables: {
  component: Type<CookieTableComponent | HeadersTableComponent>;
  kind: string;
}[] = [
  { component: CookieTableComponent, kind: 'cookie' },
  { component: HeadersTableComponent, kind: 'headers' },
];

describe.each(tables)('$kind Signal Form', ({ component: type, kind }) => {
  it('實際載入綁定資料後顯示已綁定，解除綁定期間阻擋重複請求', async () => {
    const state = await setup();
    if (kind === 'cookie')
      state.cookies.getByRefIdAndType.mockReturnValue(
        of({ cookieId: 'bound', list: [] })
      );
    else
      state.headers.getByRefIdAndType.mockReturnValue(
        of({ headersId: 'bound', list: [] })
      );
    const fixture = TestBed.createComponent(type);
    fixture.componentRef.setInput('refId', 'ref');
    fixture.componentRef.setInput(
      'mapType',
      kind === 'cookie' ? CookieListMapType.SPIDER : HeadersMapType.SPIDER
    );
    await fixture.whenStable();
    const component = fixture.componentInstance;
    expect(component.isBinding()).toBe(true);
    expect(component.isEditMode()).toBe(true);
    component.toggleBind();
    component.toggleBind();
    expect(state.maps.delete).toHaveBeenCalledTimes(1);
    expect(component.isProcessing()).toBe(true);
    state.pending.next();
    state.pending.complete();
    await fixture.whenStable();
    expect(component.isProcessing()).toBe(false);
    expect(component.isBinding()).toBe(false);
  });

  it('未載入資料時不視為已綁定；讀取與清除直接更新表格並補齊 pipeline', async () => {
    const state = await setup();
    const fixture = TestBed.createComponent(type);
    fixture.componentRef.setInput('refId', 'ref');
    fixture.componentRef.setInput(
      'mapType',
      kind === 'cookie' ? CookieListMapType.SPIDER : HeadersMapType.SPIDER
    );
    await fixture.whenStable();
    const component = fixture.componentInstance;
    expect(component.isBinding()).toBe(false);
    component.openItemSelector();
    await fixture.whenStable();
    const table: GenericTableComponent = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance;
    expect(table.rows()).toHaveLength(1);
    expect(component.form.list[0].valuePipelines[0].enabled().value()).toBe(
      true
    );
    component.form.list[0].name().value.set('Edited');
    await fixture.whenStable();
    expect(component.form.list[0].name().value()).toBe('Edited');
    component.onClear();
    state.confirmation.next('yes');
    await fixture.whenStable();
    expect(table.rows()).toHaveLength(0);
    component.openItemSelector();
    await fixture.whenStable();
    expect(table.rows()).toHaveLength(1);
    expect(component.form.list[0].name().value()).toBe('name');
  });

  it('新增、儲存、刪除共用操作鎖，失敗後可重試', async () => {
    const state = await setup();
    const fixture = TestBed.createComponent(type);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    if (component instanceof CookieTableComponent)
      component.form.cookieId().value.set('new');
    else component.form.headersId().value.set('new');
    component.addItem();
    component.addItem();
    component.saveItem();
    component.deleteItem();
    const service = kind === 'cookie' ? state.cookies : state.headers;
    expect(service.update).toHaveBeenCalledTimes(1);
    expect(state.messages.openI18N).not.toHaveBeenCalled();
    expect(component.isProcessing()).toBe(true);
    state.pending.error(new Error('Save failed'));
    expect(component.isProcessing()).toBe(false);
    service.update.mockReturnValue(of(undefined));
    component.saveItem();
    expect(service.update).toHaveBeenCalledTimes(2);
    component.deleteItem();
    component.deleteItem();
    expect(state.messages.openI18N).toHaveBeenCalledTimes(1);
    state.confirmation.next('');
    expect(component.isProcessing()).toBe(false);
  });
});

it('SpiderItem 條件值可編輯，初次載入與再次讀取都補齊巢狀欄位', async () => {
  const state = await setup();
  const fixture = TestBed.createComponent(SpiderItemComponent);
  const component = fixture.componentInstance;
  const item = structuredClone(state.item);
  item.itemSetting.extractionRuleList = [
    component.createExtractionRule({
      conditionValue: {
        conditionType: ExtractionStepCondition.EQUALS,
        key: 'key',
        value: 'before',
        ignoreCase: false,
      },
    }),
  ];
  fixture.componentRef.setInput('initData', item);
  await fixture.whenStable();
  const input: HTMLInputElement = fixture.nativeElement.querySelector(
    'input[placeholder="spider.conditionValuePH"]'
  );
  expect(input.value).toBe('before');
  input.value = 'after';
  input.dispatchEvent(new Event('input'));
  await fixture.whenStable();
  expect(component.extractionRuleList[0].conditionValue.value().value()).toBe(
    'after'
  );
  expect(item.itemSetting.extractionRuleList[0].conditionValue.value).toBe(
    'before'
  );
  component.form.itemSetting.testData.html().value.set('old');
  component.onReadItems();
  await fixture.whenStable();
  expect(component.form.itemSetting.testData.html().value()).toBe('');
});

it('SpiderItem 逐列驗證 key，並隨 mode 切換 selector 與 jsonPath 的必填規則', async () => {
  const state = await setup();
  const fixture = TestBed.createComponent(SpiderItemComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  component.form.spiderItemId().value.set('new');
  component.extractionRuleList().reset([component.createExtractionRule()]);
  await fixture.whenStable();
  component.onAddItem();
  component.onSaveItem();
  await fixture.whenStable();
  const row = component.extractionRuleList[0];
  expect(row.key().invalid()).toBe(true);
  expect(row.selector().invalid()).toBe(true);
  expect(row.jsonPath().invalid()).toBe(false);
  expect(row.key().touched()).toBe(true);
  expect(state.snackbar.openI18N).toHaveBeenCalledWith('msg.formInvalid');
  expect(document.activeElement?.getAttribute('aria-label')).toContain(
    'spider.key'
  );
  expect(state.items.getBySpiderItemId).not.toHaveBeenCalled();
  expect(state.items.update).not.toHaveBeenCalled();

  row.key().value.set('key');
  row.selector().value.set('.item');
  expect(component.form().valid()).toBe(true);
  component.extractionRuleMode().value.set(ExtractionRuleMode.JSON_PATH);
  await fixture.whenStable();
  expect(row.selector().invalid()).toBe(false);
  expect(row.jsonPath().invalid()).toBe(true);
  component.onSaveItem();
  expect(state.items.update).not.toHaveBeenCalled();
  expect(document.activeElement?.getAttribute('aria-label')).toContain(
    'spider.jsonPath'
  );

  row.jsonPath().value.set('$.items');
  row.selector().value.set('');
  expect(component.form().valid()).toBe(true);
  component.onSaveItem();
  expect(state.items.update).toHaveBeenCalledTimes(1);
  state.pending.next();
  state.pending.complete();
  component
    .extractionRuleList()
    .value.update(rows => [...rows, component.createExtractionRule()]);
  await fixture.whenStable();
  expect(component.extractionRuleList[1].key().invalid()).toBe(true);
  expect(component.extractionRuleList[1].jsonPath().invalid()).toBe(true);
  component.onSaveItem();
  expect(state.items.update).toHaveBeenCalledTimes(1);
});

it.each([ExtractionRuleMode.SELECT, ExtractionRuleMode.JSON_PATH])(
  '擷取模式 %s 的 textarea 失焦後清除前後空白並重新驗證',
  async mode => {
    const state = await setup();
    const fixture = TestBed.createComponent(SpiderItemComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.form.spiderItemId().value.set('item');
    component.extractionRuleMode().value.set(mode);
    component
      .extractionRuleList()
      .reset([component.createExtractionRule({ key: 'key' })]);
    await fixture.whenStable();
    const textarea: HTMLTextAreaElement =
      fixture.nativeElement.querySelector('textarea');
    textarea.value = '  value  ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(textarea.value).toBe('value');
    expect(component.form().valid()).toBe(true);
    textarea.value = '   ';
    textarea.dispatchEvent(new Event('input', { bubbles: true }));
    textarea.dispatchEvent(new Event('blur'));
    await fixture.whenStable();
    expect(textarea.value).toBe('');
    expect(component.form().invalid()).toBe(true);
    component.onSaveItem();
    expect(state.items.update).not.toHaveBeenCalled();
  }
);

it('SpiderItem 儲存與綁定不會重複送出，失敗後會解鎖', async () => {
  const state = await setup();
  const fixture = TestBed.createComponent(SpiderItemComponent);
  fixture.componentRef.setInput('spiderId', 'spider');
  fixture.componentRef.setInput('index', 0);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  component.form.spiderItemId().value.set('item');
  component.onSaveItem();
  component.onSaveItem();
  component.toggleBind();
  expect(state.items.update).toHaveBeenCalledTimes(1);
  expect(state.maps.update).not.toHaveBeenCalled();
  state.pending.error(new Error('Save failed'));
  expect(component.isProcessing()).toBe(false);
  state.maps.update.mockReturnValue(of(undefined));
  component.toggleBind();
  expect(state.maps.update).toHaveBeenCalledTimes(1);
});

it.each(['{', '{}', '[1]', 'null'])(
  '預覽拒絕無效 JSON 或非字串陣列：%s',
  async json => {
    const state = await setup();
    const fixture = TestBed.createComponent(SpiderEditComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.form.spiderId().value.set('spider');
    component.form.testData.primeKeyListJson().value.set(json);
    component.form.testData.resultJson().value.set('kept');
    expect(() => component.onPreviewByPrimeKeyList()).not.toThrow();
    component.update();
    expect(state.config.isInUse).not.toHaveBeenCalled();
    expect(state.spider.executeByPrimeKeyList).not.toHaveBeenCalled();
    expect(state.snackbar.openI18N).toHaveBeenCalledWith(
      'msg.spiderPrimeKeyListError'
    );
    expect(component.form.testData.resultJson().value()).toBe('kept');
  }
);

it('SpiderEdit 儲存與預覽共用解析規則和操作鎖', async () => {
  const state = await setup();
  const fixture = TestBed.createComponent(SpiderEditComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  component.form.spiderId().value.set('spider');
  component.form.testData.primeKeyListJson().value.set('["key"]');
  component.update();
  component.update();
  component.onPreviewByPrimeKeyList();
  expect(state.config.update).toHaveBeenCalledTimes(1);
  expect(state.spider.executeByPrimeKeyList).not.toHaveBeenCalled();
  state.pending.error(new Error('Save failed'));
  component.onPreviewByPrimeKeyList();
  expect(state.spider.executeByPrimeKeyList).toHaveBeenCalledWith({
    spiderId: 'spider',
    primeKeyList: ['key'],
  });
  expect(component.isProcessing()).toBe(false);
});

it('Spider resource 載入資料後可使用真正編輯器，儲存鎖能切換 readonly', async () => {
  const state = await setup(true, 'spider');
  state.config.getBySpiderId.mockReturnValue(
    of({
      spiderId: 'spider',
      description: '',
      primeKeySize: 1,
      isUrlBased: false,
      requestIntervalMs: 0,
      testData: {
        primeKeyList: ['loaded'],
        url: '',
        resultJson: '{"loaded":true}',
      },
    })
  );
  state.config.isInUse.mockReturnValue(of(true));
  const fixture = TestBed.createComponent(SpiderEditComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  expect(component.spider.value()?.spiderId).toBe('spider');
  const editors = fixture.debugElement.queryAll(
    By.directive(SignalCodeEditorComponent)
  );
  expect(editors.length).toBeGreaterThan(0);
  expect(editors[0].componentInstance.value()).toContain('loaded');
  component.update();
  await fixture.whenStable();
  expect(editors[0].componentInstance.readonly()).toBe(true);
  state.pending.error(new Error('Save failed'));
  await fixture.whenStable();
  expect(editors[0].componentInstance.readonly()).toBe(false);
});
