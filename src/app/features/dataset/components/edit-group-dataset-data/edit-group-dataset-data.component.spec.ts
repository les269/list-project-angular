import { TestBed } from '@angular/core/testing';
import { Component, input, model } from '@angular/core';
import { FormValueControl } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideTranslateService } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { MessageBoxService } from '../../../../core/services/message-box.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SpiderConfigService } from '../../../spider/services/spider-config.service';
import { SpiderService } from '../../../spider/services/spider.service';
import { GroupDatasetDataService } from '../../service/group-dataset-data.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { EditGroupDatasetDataComponent } from './edit-group-dataset-data.component';
import { JsonDataFieldComponent } from '../json-data-field/json-data-field.component';
import { SignalCodeEditorComponent } from '../../../../core/components/signal-code-editor/signal-code-editor.component';

// 整合測試保留 JSON 欄位互動，僅替換需要瀏覽器排版 API 的第三方編輯器。
@Component({ selector: 'app-signal-code-editor', template: '' })
class TestJsonCodeEditor implements FormValueControl<string> {
  readonly value = model('');
  readonly language = input('');
  readonly indentWithTab = input(false);
}

async function setup(
  deferredConfig = false,
  primeValue = '',
  deferredSources = false,
  primeKeySize = 1
) {
  const group = {
    config: {
      byKey: 'id',
      imageSaveFolder: '',
      groupDatasetFieldList: [
        { key: 'id', label: 'ID', type: 'string' },
        { key: 'title', label: 'Title', type: 'string' },
        { key: 'tags', label: 'Tags', type: 'stringArray' },
      ],
      groupDatasetSpiderList: [
        {
          spiderId: 'crawler',
          label: 'Crawler',
          visibleJson: true,
          visibleUrl: true,
        },
      ],
    },
  };
  const configResponse = new Subject<typeof group>();
  const sources = [
    { spiderId: 'crawler', primeKeySize },
    { spiderId: 'unrelated', primeKeySize: 3 },
  ];
  const sourceResponse = new Subject<typeof sources>();
  const record = {
    groupName: 'group',
    primeValue: 'record-1',
    json: { id: 'record-1', title: 'Loaded', tags: ['first'] },
  };
  const records = {
    existGroupDatasetData: vi.fn(() => of(true)),
    getGroupDatasetData: vi.fn(() => of(record)),
    updateGroupDatasetData: vi.fn(() => of(undefined)),
  };
  const spider = {
    getAll: () => (deferredSources ? sourceResponse : of(sources)),
    executeByPrimeKeyList: vi.fn(() => of({ title: 'From params' })),
    executeByUrl: vi.fn(() => of({ title: 'From URL' })),
  };
  await TestBed.configureTestingModule({
    imports: [EditGroupDatasetDataComponent],
    providers: [
      provideTranslateService(),
      {
        provide: MAT_DIALOG_DATA,
        useValue: { groupName: 'group', primeValue },
      },
      { provide: MatDialogRef, useValue: { close: vi.fn() } },
      { provide: GroupDatasetDataService, useValue: records },
      { provide: SpiderService, useValue: spider },
      { provide: SpiderConfigService, useValue: spider },
      { provide: SelectTableService, useValue: {} },
      { provide: MessageBoxService, useValue: { openI18N: () => of(true) } },
      {
        provide: SnackbarService,
        useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
      },
      {
        provide: GroupDatasetService,
        useValue: {
          getGroupDataset: () => (deferredConfig ? configResponse : of(group)),
        },
      },
    ],
  })
    .overrideComponent(JsonDataFieldComponent, {
      remove: { imports: [SignalCodeEditorComponent] },
      add: { imports: [TestJsonCodeEditor] },
    })
    .compileComponents();
  const fixture = TestBed.createComponent(EditGroupDatasetDataComponent);
  await fixture.whenStable();
  const page: HTMLElement = fixture.nativeElement;
  const enter = (input: HTMLInputElement, value: string) => {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('blur'));
    input.dispatchEvent(
      new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        bubbles: true,
      })
    );
  };
  return {
    fixture,
    page,
    component: fixture.componentInstance,
    records,
    spider,
    enter,
    initializeConfig: () => configResponse.next(group),
    initializeSources: () => sourceResponse.next(sources),
    group,
  };
}

it('非同步載入設定後，直接顯示初始化欄位與來源輸入框', async () => {
  const { fixture, page, initializeConfig } = await setup(true);
  expect(page.querySelector('.record-fields input')).toBeNull();
  initializeConfig();
  await fixture.whenStable();
  const inputs = page.querySelectorAll<HTMLInputElement>(
    '.record-fields .data-field input'
  );
  expect(inputs).toHaveLength(2);
  expect(inputs[0].value).toBe('');
  expect(inputs[1].value).toBe('');
  expect(page.querySelector('.array-field')).not.toBeNull();
  expect(page.querySelector('.parameter-fields input')).not.toBeNull();
  expect(page.querySelector('.crawler-panel .data-field input')).not.toBeNull();
});

it('帶入主鍵時，非同步初始化後顯示查詢回填資料', async () => {
  const { fixture, page, initializeConfig } = await setup(true, 'record-1');
  initializeConfig();
  await fixture.whenStable();
  expect(
    page.querySelectorAll<HTMLInputElement>(
      '.record-fields .data-field input'
    )[1]?.value
  ).toBe('Loaded');
  expect(page.querySelector('mat-chip-row')?.textContent).toContain('first');
});

it('只有參數的來源較晚載入時，也會直接顯示輸入框', async () => {
  const { fixture, page, group, initializeConfig, initializeSources } =
    await setup(true, '', true);
  group.config.groupDatasetSpiderList[0].visibleUrl = false;
  initializeConfig();
  await fixture.whenStable();
  expect(page.querySelector('.parameter-fields input')).toBeNull();
  initializeSources();
  await fixture.whenStable();
  expect(page.querySelector('.parameter-fields input')).not.toBeNull();
  expect(page.querySelector('.crawler-panel .data-field input')).toBeNull();
});

it('Enter 查詢後回填動態欄位，編輯與更新使用現有資料契約', async () => {
  const { fixture, page, records, component, enter } = await setup();
  expect(
    page.querySelector<HTMLInputElement>(
      'app-signal-field[label="dataset.groupName"] input'
    )!.disabled
  ).toBe(true);
  const prime = page.querySelector<HTMLInputElement>(
    'app-signal-field[label="dataset.primeValue"] input'
  )!;
  enter(prime, '  record-1  ');
  await fixture.whenStable();
  expect(records.getGroupDatasetData).toHaveBeenCalledWith('group', 'record-1');
  const title = page.querySelectorAll<HTMLInputElement>(
    '.record-fields .data-field input'
  )[1];
  expect(title.value).toBe('Loaded');
  title.value = 'Edited';
  title.dispatchEvent(new Event('input'));
  await fixture.whenStable();
  expect(component.json['title']).toBe('Edited');
  page
    .querySelector<HTMLButtonElement>('.dialog-actions .dialog-button-primary')!
    .click();
  expect(records.updateGroupDatasetData).toHaveBeenCalledWith({
    groupName: 'group',
    primeValue: 'record-1',
    json: { id: 'record-1', title: 'Edited', tags: ['first'] },
  });
});

it('陣列標籤保留排序、去重、移除與清除操作', async () => {
  const { fixture, page, component, enter } = await setup();
  const input = page.querySelector<HTMLInputElement>(
    '.array-field input.form-control'
  )!;
  enter(input, 'zeta');
  await fixture.whenStable();
  enter(input, 'alpha');
  await fixture.whenStable();
  enter(input, 'zeta');
  await fixture.whenStable();
  expect(component.json['tags']).toEqual(['alpha', 'zeta']);
  page
    .querySelector<HTMLButtonElement>('.array-field mat-chip-row button')!
    .click();
  await fixture.whenStable();
  expect(component.json['tags']).toEqual(['zeta']);
  page.querySelectorAll<HTMLButtonElement>('.dialog-actions button')[1].click();
  await fixture.whenStable();
  expect(component.json['tags']).toEqual([]);
  expect(component.json['title']).toBe('');
});

it('來源參數與網址保留 Enter 搜尋及結果回填', async () => {
  const { fixture, page, component, spider, enter } = await setup();
  enter(
    page.querySelector<HTMLInputElement>('.parameter-fields input')!,
    '  param  '
  );
  await fixture.whenStable();
  expect(spider.executeByPrimeKeyList).toHaveBeenCalledWith({
    spiderId: 'crawler',
    primeKeyList: ['param'],
  });
  expect(component.json['title']).toBe('From params');
  enter(
    page.querySelector<HTMLInputElement>('.crawler-panel .data-field input')!,
    '  https://example.com/item  '
  );
  await fixture.whenStable();
  expect(spider.executeByUrl).toHaveBeenCalledWith({
    spiderId: 'crawler',
    url: 'https://example.com/item',
  });
  expect(component.json['title']).toBe('From URL');
});

it('依 Spider 的 primeKeySize 顯示參數，並排除群組未使用的 Spider', async () => {
  const { fixture, page, component, spider, enter } = await setup(
    false,
    '',
    false,
    2
  );
  expect(Object.keys(component.spiderInput)).toEqual(['crawler']);
  const inputs = page.querySelectorAll<HTMLInputElement>(
    '.parameter-fields input'
  );
  expect(inputs).toHaveLength(2);
  inputs[0].value = 'first';
  inputs[0].dispatchEvent(new Event('input', { bubbles: true }));
  enter(inputs[1], 'second');
  await fixture.whenStable();
  expect(spider.executeByPrimeKeyList).toHaveBeenCalledWith({
    spiderId: 'crawler',
    primeKeyList: ['first', 'second'],
  });
});

async function setupJsonFields() {
  const state = await setup(true);
  state.group.config.groupDatasetFieldList.push(
    { key: 'metadata', label: 'Metadata', type: 'jsonObject' },
    { key: 'entries', label: 'Entries', type: 'jsonArray' }
  );
  state.initializeConfig();
  await state.fixture.whenStable();
  const editors = state.fixture.debugElement.queryAll(
    By.directive(JsonDataFieldComponent)
  );
  return {
    ...state,
    fields: editors.map(
      editor => editor.componentInstance as JsonDataFieldComponent
    ),
    editors: editors.map(
      editor =>
        editor.query(By.directive(TestJsonCodeEditor))
          .componentInstance as TestJsonCodeEditor
    ),
  };
}

it('各種欄位依必填旗標顯示星號提示，空白資料仍可儲存', async () => {
  const { fixture, page, component, records, group, initializeConfig } =
    await setup(true);
  for (const field of group.config.groupDatasetFieldList)
    Object.assign(field, { required: true });
  group.config.groupDatasetFieldList.push(
    Object.assign(
      { key: 'score', label: 'Score', type: 'number' },
      { required: true }
    ),
    Object.assign(
      { key: 'released', label: 'Released', type: 'date' },
      { required: true }
    ),
    Object.assign(
      { key: 'metadata', label: 'Metadata', type: 'jsonObject' },
      { required: true }
    ),
    Object.assign(
      { key: 'entries', label: 'Entries', type: 'jsonArray' },
      { required: true }
    )
  );
  initializeConfig();
  await fixture.whenStable();
  expect(page.querySelectorAll('.record-fields .require')).toHaveLength(7);
  expect(component.jsonForm().valid()).toBe(true);
  component.onUpdate();
  expect(records.updateGroupDatasetData).toHaveBeenCalledTimes(1);
  component.groupDatasetConfig.update(
    config =>
      config && {
        ...config,
        groupDatasetFieldList: config.groupDatasetFieldList.map(field => ({
          ...field,
          required: false,
        })),
      }
  );
  await fixture.whenStable();
  expect(page.querySelectorAll('.record-fields .require')).toHaveLength(0);
});

it('日期保留來源與貼上原文，舊 formatDate 不再影響儲存', async () => {
  const { fixture, page, component, records, group, initializeConfig } =
    await setup(true);
  const dateField = {
    key: 'released',
    label: 'Released',
    type: 'date',
    formatDate: 'yyyy-MM-dd',
  };
  group.config.groupDatasetFieldList.push(dateField);
  initializeConfig();
  await fixture.whenStable();
  expect(component.json['released']).toBe('');
  component.json = { ...component.json, released: '2026/11/27 08:30' };
  await fixture.whenStable();
  const input = page.querySelector<HTMLInputElement>(
    '.record-fields app-signal-field input[type="text"]'
  )!;
  expect(input.value).toBe('2026/11/27 08:30');
  for (const value of ['2026/11/27 08:30', ' 原始日期文字 ', '']) {
    input.value = value;
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    component.onUpdate();
    expect(
      JSON.parse(
        JSON.stringify(records.updateGroupDatasetData.mock.calls.at(-1))
      )
    ).toEqual([
      expect.objectContaining({
        json: expect.objectContaining({ released: value }),
      }),
    ]);
  }
  component.clearField();
  await fixture.whenStable();
  expect(component.json['released']).toBe('');
});

it('數字欄位可輸入小數與負數，儲存為 number，清空時阻擋儲存', async () => {
  const { fixture, page, component, records, group, initializeConfig } =
    await setup(true);
  group.config.groupDatasetFieldList.push({
    key: 'score',
    label: 'Score',
    type: 'number',
  });
  initializeConfig();
  await fixture.whenStable();
  expect(component.json['score']).toBe(0);
  const input = page.querySelector<HTMLInputElement>(
    '.record-fields input[type="number"]'
  )!;
  expect(input.type).toBe('number');
  input.value = '-12.5';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  await fixture.whenStable();
  component.onUpdate();
  expect(
    JSON.parse(JSON.stringify(records.updateGroupDatasetData.mock.calls[0]))
  ).toEqual([
    expect.objectContaining({
      json: expect.objectContaining({ score: -12.5 }),
    }),
  ]);
  records.updateGroupDatasetData.mockClear();
  input.value = '';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('blur'));
  await fixture.whenStable();
  expect(component.jsonForm().invalid()).toBe(true);
  component.onUpdate();
  expect(records.updateGroupDatasetData).not.toHaveBeenCalled();
  component.clearField();
  await fixture.whenStable();
  expect(component.json['score']).toBe(0);
  expect(component.jsonForm().valid()).toBe(true);
});

it('JSON 欄位初始化並以真正物件與陣列儲存，清除後恢復各自預設值', async () => {
  const { fixture, component, records, editors, fields } =
    await setupJsonFields();
  expect(component.json['metadata']).toEqual({});
  expect(component.json['entries']).toEqual([]);
  editors[0].value.set('{"nested":{"values":[1,true,null]}}');
  editors[1].value.set('[{"id":1},"text",null]');
  await fixture.whenStable();
  component.onUpdate();
  expect(
    JSON.parse(JSON.stringify(records.updateGroupDatasetData.mock.calls[0]))
  ).toEqual([
    expect.objectContaining({
      json: expect.objectContaining({
        metadata: { nested: { values: [1, true, null] } },
        entries: [{ id: 1 }, 'text', null],
      }),
    }),
  ]);
  component.clearField();
  await fixture.whenStable();
  expect(component.json['metadata']).toEqual({});
  expect(component.json['entries']).toEqual([]);
  expect(fields.map(field => field.draft())).toEqual(['{}', '[]']);
});

it('JSON 無效或根型別錯誤時阻擋儲存，其他欄位變更保留草稿，清除可解除錯誤', async () => {
  const { fixture, component, records, editors, fields, page } =
    await setupJsonFields();
  editors[0].value.set('{');
  await fixture.whenStable();
  component.json = { ...component.json, title: 'Changed' };
  await fixture.whenStable();
  expect(fields[0].draft()).toBe('{');
  expect(
    page.querySelector<HTMLButtonElement>(
      '.dialog-actions .dialog-button-primary'
    )!.disabled
  ).toBe(true);
  component.onUpdate();
  expect(records.updateGroupDatasetData).not.toHaveBeenCalled();
  editors[0].value.set('[]');
  await fixture.whenStable();
  component.onUpdate();
  expect(records.updateGroupDatasetData).not.toHaveBeenCalled();
  component.clearField();
  await fixture.whenStable();
  expect(component.hasInvalidJson()).toBe(false);
  component.onUpdate();
  expect(records.updateGroupDatasetData).toHaveBeenCalledTimes(1);
});

it('外部資料與查詢回填更新 JSON Editor，舊資料缺少新欄位時補預設值', async () => {
  const { fixture, component, fields } = await setupJsonFields();
  component.json = {
    ...component.json,
    id: 'loaded',
    metadata: { loaded: [1] },
    entries: [{ id: 2 }],
  };
  await fixture.whenStable();
  expect(JSON.parse(fields[0].draft())).toEqual({ loaded: [1] });
  expect(JSON.parse(fields[1].draft())).toEqual([{ id: 2 }]);
  component.primeValue = 'record-1';
  component.searchByPrimeValue();
  await fixture.whenStable();
  expect(JSON.parse(fields[0].draft())).toEqual({ loaded: [1] });
  component.json = { id: 'old-record', title: 'Old', tags: [] };
  await fixture.whenStable();
  expect(component.json['metadata']).toEqual({});
  expect(component.json['entries']).toEqual([]);
});
