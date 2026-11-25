import { TestBed } from '@angular/core/testing';
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
  }).compileComponents();
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
