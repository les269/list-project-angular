import { Signal, Type } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { By } from '@angular/platform-browser';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { firstValueFrom, of } from 'rxjs';
import { FormAlert } from '../../../core/model';
import { GenericTableComponent } from '../../../core/components/generic-table/generic-table.component';
import { MessageBoxService } from '../../../core/services/message-box.service';
import { SelectTableService } from '../../../core/services/select-table.service';
import { SnackbarService } from '../../../core/services/snackbar.service';
import { LayoutStore } from '../../../core/stores/layout.store';
import { ApiRequestConfigService } from '../../api-request-config/service/api-request-config.service';
import { DatasetService } from '../../dataset/service/dataset.service';
import { ScrapyService } from '../../spider/services/scrapy.service';
import { ThemeItem, ThemeItemType } from '../models';
import { ThemeItemMapService, ThemeItemService } from '../services';
import { ShareTagService } from '../services/share-tag.service';
import { ThemeCustomTableComponent } from './theme-custom-table/theme-custom-table.component';
import { ThemeDatasetTableComponent } from './theme-dataset-table/theme-dataset-table.component';
import { ThemeItemManageComponent } from './theme-item-manage/theme-item-manage.component';
import { ThemeImageComponent } from './theme-image/theme-image.component';
import { ThemeOtherSettingComponent } from './theme-other-setting/theme-other-setting.component';
import { ThemeTagTableComponent } from './theme-tag-table/theme-tag-table.component';
import { ThemeTopCustomTableComponent } from './theme-top-custom-table/theme-top-custom-table.component';

interface TableCase {
  componentType: Type<{ readonly formModel: Signal<ThemeItem> }>;
  inputName: string;
  type: ThemeItemType;
  editKey: string;
  defaultKey: string;
  defaultValue: unknown;
}

const cases: TableCase[] = [
  {
    componentType: ThemeDatasetTableComponent,
    inputName: 'datasetItem',
    type: ThemeItemType.DATASET,
    editKey: 'label',
    defaultKey: 'datasetList',
    defaultValue: [],
  },
  {
    componentType: ThemeCustomTableComponent,
    inputName: 'customItem',
    type: ThemeItemType.CUSTOM,
    editKey: 'label',
    defaultKey: 'visibleDatasetNameList',
    defaultValue: [],
  },
  {
    componentType: ThemeTagTableComponent,
    inputName: 'tagItem',
    type: ThemeItemType.TAG,
    editKey: 'shareTagId',
    defaultKey: 'seq',
    defaultValue: 0,
  },
  {
    componentType: ThemeTopCustomTableComponent,
    inputName: 'topCustomItem',
    type: ThemeItemType.TOPCUSTOM,
    editKey: 'label',
    defaultKey: 'openUrl',
    defaultValue: '',
  },
];

describe.each(cases)('$type table loading', config => {
  // 模擬舊資料只有部分列欄位，驗證載入時仍能建立完整的 Signal Form。
  const storedItem = (itemId: string) =>
    ({
      type: config.type,
      itemId,
      description: itemId,
      json: [{ [config.editKey]: itemId }],
    }) as unknown as ThemeItem;

  async function setup(item?: ThemeItem) {
    const service = {
      getAllItems: () => of([]),
      getThemeItem: vi.fn(() => of(storedItem('selected'))),
    };
    await TestBed.configureTestingModule({
      imports: [config.componentType, TranslateModule.forRoot()],
      providers: [
        { provide: ThemeItemService, useValue: service },
        { provide: ThemeItemMapService, useValue: {} },
        { provide: MessageBoxService, useValue: { openI18N: () => of(true) } },
        {
          provide: SelectTableService,
          useValue: {
            selectSingleThemeItemSummary: () => of({ itemId: 'selected' }),
          },
        },
        {
          provide: SnackbarService,
          useValue: { openI18N: vi.fn(), isBlankMessage: vi.fn() },
        },
        { provide: MatDialog, useValue: {} },
        { provide: LayoutStore, useValue: {} },
        { provide: DatasetService, useValue: { getAllDataset: () => of([]) } },
        {
          provide: ApiRequestConfigService,
          useValue: { getAll: () => of([]) },
        },
        { provide: ShareTagService, useValue: { getAllTag: () => of([]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(config.componentType);
    if (item) fixture.componentRef.setInput(config.inputName, item);
    await fixture.whenStable();
    const manager: ThemeItemManageComponent = fixture.debugElement.query(
      By.directive(ThemeItemManageComponent)
    ).componentInstance;
    const table: GenericTableComponent = fixture.debugElement.query(
      By.directive(GenericTableComponent)
    ).componentInstance;
    return { fixture, manager, table, service };
  }

  it('補齊載入欄位，編輯與新增不會覆寫原始資料', async () => {
    const item = storedItem('bound');
    const original = structuredClone(item);
    const { fixture, table } = await setup(item);
    expect(table.rows()[0][config.defaultKey]().value()).toEqual(
      config.defaultValue
    );
    table.rows()[0][config.editKey]().value.set('Edited');
    table.onAdd();
    await fixture.whenStable();
    expect(table.rows()).toHaveLength(2);
    expect(table.rows()[0][config.editKey]().value()).toBe('Edited');
    expect(item).toEqual(original);
  });

  it('讀取、清除後可再次讀取，且不殘留先前的互動狀態', async () => {
    const { fixture, manager, table, service } = await setup();
    manager.openItemSelector();
    await fixture.whenStable();
    const field = table.rows()[0][config.editKey]();
    field.value.set('Edited');
    field.markAsTouched();
    field.markAsDirty();

    manager.onClear();
    await fixture.whenStable();
    expect(table.rows()).toHaveLength(0);
    expect(fixture.componentInstance.formModel().itemId).toBe('');

    service.getThemeItem.mockReturnValue(of(storedItem('next')));
    manager.openItemSelector();
    await fixture.whenStable();
    expect(fixture.componentInstance.formModel().itemId).toBe('next');
    expect(table.rows()).toHaveLength(1);
    expect(table.rows()[0][config.editKey]().value()).toBe('next');
    expect(table.rows()[0][config.defaultKey]().value()).toEqual(
      config.defaultValue
    );
    expect(table.rows()[0][config.editKey]().touched()).toBe(false);
    expect(table.rows()[0][config.editKey]().dirty()).toBe(false);
  });

  it('切換語言後更新全部錯誤提示', async () => {
    const { fixture } = await setup();
    await expectTranslatedAlerts(fixture.componentInstance);
  });

  if (config.type === ThemeItemType.DATASET) {
    it('切換預設資料來源只更新 boolean，保留資料來源陣列', async () => {
      const { fixture } = await setup();
      const component = fixture.componentInstance as ThemeDatasetTableComponent;
      component
        .fields()
        .reset([
          component.createRow({ datasetList: ['first'], isDefault: true }),
          component.createRow({ datasetList: ['second'], isDefault: true }),
          component.createRow(),
        ]);
      const list = component.fields[0].datasetList().value();
      component.changeDefaultKey(1);
      await fixture.whenStable();
      expect(
        component
          .fields()
          .value()
          .map(row => row.isDefault)
      ).toEqual([false, true, false]);
      expect(component.fields[0].isDefault().dirty()).toBe(true);
      expect(component.fields[2].isDefault().dirty()).toBe(false);
      expect(component.fields[0].datasetList().value()).toBe(list);
    });
  }
});

async function expectTranslatedAlerts(component: unknown) {
  const alerts = component as {
    formAlerts?: Signal<FormAlert[]>;
    formAlertsObj?: Signal<Record<string, FormAlert[]>>;
  };
  const keys = [
    'msg.duplicateColumn',
    'msg.blank',
    'msg.required',
    'themeDataset.tableEmpty',
    'themeDataset.datasetEmpty',
    'themeDataset.duplicateByLabel',
    'themeTag.shareTag',
    'themeTag.shareTagIdEmpty',
    'themeImage.imageKey',
    'themeImage.imageUrl',
    'themeCustom.byKey',
    'themeCustom.buttonIconFalse',
    'themeCustom.buttonIconTrue',
    'themeCustom.buttonIconFill',
    'themeCustom.openUrl',
    'themeCustom.copyValue',
    'themeCustom.deleteFile',
    'themeCustom.moveToDir',
    'themeCustom.filePathForMoveTo',
    'themeCustom.openFolder',
  ];
  const translate = TestBed.inject(TranslateService);
  for (const lang of ['zh-test', 'en-test']) {
    translate.setTranslation(
      lang,
      Object.fromEntries(keys.map(key => [key, `${lang}:${key}`]))
    );
    await firstValueFrom(translate.use(lang));
    const messages = [
      ...(alerts.formAlerts?.() ?? []),
      ...Object.values(alerts.formAlertsObj?.() ?? {}).flat(),
    ];
    expect(messages.length).toBeGreaterThan(0);
    expect(messages.every(alert => alert.msg.startsWith(`${lang}:`))).toBe(
      true
    );
  }
}

interface ObjectCase {
  componentType: Type<{ readonly formModel: Signal<ThemeItem> }>;
  inputName: string;
  type: ThemeItemType;
  previousJson: object;
  expectedJson: object;
}

const objectCases: ObjectCase[] = [
  {
    componentType: ThemeImageComponent,
    inputName: 'imageItem',
    type: ThemeItemType.IMAGE,
    previousJson: { imageKey: 'oldKey', imageUrl: 'oldUrl' },
    expectedJson: { imageKey: '', imageUrl: '', type: 'key' },
  },
  {
    componentType: ThemeOtherSettingComponent,
    inputName: 'otherSettingItem',
    type: ThemeItemType.OTHERSETTING,
    previousJson: {
      listPageSize: 99,
      checkFileExist: 'oldPath',
      rowColor: ['#ffffff'],
    },
    expectedJson: { listPageSize: 30, checkFileExist: '', rowColor: [] },
  },
];

describe.each(objectCases)('$type object loading', config => {
  const storedItem = (itemId: string, json: object) =>
    ({ type: config.type, itemId, description: itemId, json }) as ThemeItem;

  it('切換輸入與讀取舊資料時使用預設值，清除只重設一次表單', async () => {
    await TestBed.configureTestingModule({
      imports: [config.componentType, TranslateModule.forRoot()],
      providers: [
        {
          provide: ThemeItemService,
          useValue: {
            getAllItems: () => of([]),
            getThemeItem: () => of(storedItem('selected', {})),
          },
        },
        { provide: ThemeItemMapService, useValue: {} },
        { provide: MessageBoxService, useValue: { openI18N: () => of(true) } },
        {
          provide: SelectTableService,
          useValue: {
            selectSingleThemeItemSummary: () => of({ itemId: 'selected' }),
          },
        },
        { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
        { provide: MatDialog, useValue: {} },
        { provide: ScrapyService, useValue: { getAllConfig: () => of([]) } },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(config.componentType);
    fixture.componentRef.setInput(
      config.inputName,
      storedItem('first', config.previousJson)
    );
    await fixture.whenStable();
    fixture.componentRef.setInput(config.inputName, storedItem('second', {}));
    await fixture.whenStable();
    expect(fixture.componentInstance.formModel().json).toMatchObject(
      config.expectedJson
    );

    const manager: ThemeItemManageComponent = fixture.debugElement.query(
      By.directive(ThemeItemManageComponent)
    ).componentInstance;
    const reset = vi.spyOn(manager.form()(), 'reset');
    manager.form().description().value.set('Edited');
    manager.form().description().markAsTouched();
    manager.form().description().markAsDirty();
    manager.openItemSelector();
    await fixture.whenStable();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.formModel()).toMatchObject({
      itemId: 'selected',
      json: config.expectedJson,
    });
    expect(manager.form().description().touched()).toBe(false);
    expect(manager.form().description().dirty()).toBe(false);

    reset.mockClear();
    manager.onClear();
    await fixture.whenStable();
    expect(reset).toHaveBeenCalledTimes(1);
    expect(fixture.componentInstance.formModel()).toMatchObject({
      itemId: '',
      description: '',
      json: config.expectedJson,
    });
    if (config.type === ThemeItemType.IMAGE) {
      await expectTranslatedAlerts(fixture.componentInstance);
    }
  });
});
