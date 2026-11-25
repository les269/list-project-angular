import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiRequestConfigService } from '../../../api-request-config/service/api-request-config.service';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { SpiderConfigService } from '../../../spider/services/spider-config.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { GroupDatasetConfigType, GroupDatasetFieldType } from '../../model';
import { GroupDatasetApiTableComponent } from '../../components/group-dataset-api-table/group-dataset-api-table.component';
import { GroupDatasetSpiderTableComponent } from '../../components/group-dataset-spider-table/group-dataset-spider-table.component';
import { GroupDatasetEditComponent } from './group-dataset-edit.component';

it('完整載入隱藏清單，切換資料來源保留編輯，儲存包含所有清單', async () => {
  const source = {
    groupName: 'group',
    config: {
      byKey: 'id',
      imageSaveFolder: '',
      type: GroupDatasetConfigType.spider,
      groupDatasetFieldList: [
        {
          seq: 1,
          key: 'id',
          label: 'ID',
          type: GroupDatasetFieldType.string,
          replaceValueMapName: '',
        },
      ],
      groupDatasetSpiderList: [
        {
          seq: 1,
          spiderId: 'crawler',
          label: 'Crawler',
          isDefault: true,
          visibleJson: true,
          visibleUrl: false,
        },
      ],
      groupDatasetApiList: [{ seq: 1, apiId: 'api', label: 'API' }],
    },
  };
  const service = {
    getGroupDataset: vi.fn(() => of(source)),
    existGroupDataset: vi.fn(() => of(true)),
    updateGroupDataset: vi.fn(() => of(undefined)),
  };
  const spiderConfigs = [{ spiderId: 'new-spider', description: 'New spider' }];
  const selectSingleSpider = vi.fn(() => of(spiderConfigs[0]));
  await TestBed.configureTestingModule({
    imports: [GroupDatasetEditComponent],
    providers: [
      provideTranslateService(),
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ name: 'group' })) },
      },
      { provide: GroupDatasetService, useValue: service },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
      { provide: SelectTableService, useValue: { selectSingleSpider } },
      { provide: ApiRequestConfigService, useValue: { getAll: () => of([]) } },
      {
        provide: SpiderConfigService,
        useValue: { getAll: () => of(spiderConfigs) },
      },
      {
        provide: ReplaceValueMapService,
        useValue: { getNameList: () => of([]) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(GroupDatasetEditComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  const page: HTMLElement = fixture.nativeElement;
  expect(component.isEditMode).toBe(true);
  expect(
    page.querySelector<HTMLInputElement>(
      'app-signal-field[label="dataset.groupName"] input'
    )!.disabled
  ).toBe(true);
  expect(page.querySelectorAll('.form-grid label.require')).toHaveLength(2);
  expect(page.querySelectorAll('.form-actions button')).toHaveLength(2);
  const sourceType = page.querySelector<HTMLSelectElement>(
    'app-signal-field[label="dataset.getDataType"] select'
  )!;
  const changeSource = (value: GroupDatasetConfigType) => {
    sourceType.value = value;
    sourceType.dispatchEvent(new Event('input', { bubbles: true }));
    sourceType.dispatchEvent(new Event('change'));
  };
  expect(JSON.parse(JSON.stringify(component.form().value()))).toEqual(source);
  expect(component.form().dirty()).toBe(false);
  expect(
    fixture.debugElement.query(By.directive(GroupDatasetApiTableComponent))
  ).toBeNull();
  component.update(false, 'save');
  expect(
    JSON.parse(JSON.stringify(service.updateGroupDataset.mock.calls.at(-1)))
  ).toEqual([source]);
  component.form.config.groupDatasetSpiderList[0]
    .label()
    .value.set('Changed crawler');
  changeSource(GroupDatasetConfigType.api);
  await fixture.whenStable();
  expect(
    fixture.debugElement.query(By.directive(GroupDatasetSpiderTableComponent))
  ).toBeNull();
  component.form.config.groupDatasetApiList[0].label().value.set('Changed API');
  changeSource(GroupDatasetConfigType.spider);
  await fixture.whenStable();
  expect(component.form.config.groupDatasetSpiderList[0].label().value()).toBe(
    'Changed crawler'
  );
  changeSource(GroupDatasetConfigType.api);
  await fixture.whenStable();
  expect(component.form.config.groupDatasetApiList[0].label().value()).toBe(
    'Changed API'
  );
  component.update(false, 'save');
  expect(service.updateGroupDataset).toHaveBeenLastCalledWith(
    expect.objectContaining({
      config: expect.objectContaining({
        groupDatasetSpiderList: [
          expect.objectContaining({ label: 'Changed crawler' }),
        ],
        groupDatasetApiList: [
          expect.objectContaining({ label: 'Changed API' }),
        ],
      }),
    })
  );
  expect(source.config.groupDatasetSpiderList[0].label).toBe('Crawler');
  changeSource(GroupDatasetConfigType.spider);
  await fixture.whenStable();
  page
    .querySelector<HTMLButtonElement>(
      'app-group-dataset-spider-table app-chip-select-button .selection-button'
    )!
    .click();
  await fixture.whenStable();
  expect(selectSingleSpider).toHaveBeenCalledWith(spiderConfigs);
  expect(
    component.form.config.groupDatasetSpiderList[0].spiderId().value()
  ).toBe('new-spider');
  component.update(false, 'save');
  expect(service.updateGroupDataset).toHaveBeenLastCalledWith(
    expect.objectContaining({
      config: expect.objectContaining({
        type: 'spider',
        groupDatasetSpiderList: [
          expect.objectContaining({ spiderId: 'new-spider', isDefault: true }),
        ],
      }),
    })
  );
});

it.each([null, undefined])(
  '舊 API 列的識別值與標籤為 %s 時，切換 API 可重新選取並儲存',
  async emptyValue => {
    const legacyApi = {
      seq: 1,
      name: 'legacy-api',
      apiId: emptyValue,
      label: emptyValue,
    };
    const source = {
      groupName: 'group',
      config: {
        byKey: 'id',
        imageSaveFolder: '',
        type: GroupDatasetConfigType.spider,
        groupDatasetFieldList: [],
        groupDatasetSpiderList: [],
        groupDatasetApiList: [legacyApi],
      },
    };
    const updateGroupDataset = vi.fn(() => of(undefined));
    const selectedApi = { apiId: 'selected-api', description: 'API' };
    await TestBed.configureTestingModule({
      imports: [GroupDatasetEditComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        {
          provide: ActivatedRoute,
          useValue: { paramMap: of(convertToParamMap({ name: 'group' })) },
        },
        {
          provide: GroupDatasetService,
          useValue: {
            getGroupDataset: () => of(source),
            existGroupDataset: () => of(true),
            updateGroupDataset,
          },
        },
        { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
        {
          provide: SelectTableService,
          useValue: { selectSingleApi: () => of(selectedApi) },
        },
        {
          provide: ApiRequestConfigService,
          useValue: { getAll: () => of([selectedApi]) },
        },
        { provide: SpiderConfigService, useValue: { getAll: () => of([]) } },
        {
          provide: ReplaceValueMapService,
          useValue: { getNameList: () => of([]) },
        },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(GroupDatasetEditComponent);
    await fixture.whenStable();
    const component = fixture.componentInstance;
    component.form.config.type().value.set(GroupDatasetConfigType.api);
    await fixture.whenStable();

    const row = component.form.config.groupDatasetApiList[0];
    expect(row.apiId().value()).toBe('');
    expect(row.label().value()).toBe('');
    expect(row.apiId().invalid()).toBe(true);
    component.update(false, 'save');
    expect(updateGroupDataset).not.toHaveBeenCalled();
    fixture.nativeElement
      .querySelector(
        'app-group-dataset-api-table app-chip-select-button .selection-button'
      )
      .click();
    row.label().value.set('Selected API');
    await fixture.whenStable();
    component.update(false, 'save');
    expect(updateGroupDataset).toHaveBeenCalledWith(
      expect.objectContaining({
        config: expect.objectContaining({
          groupDatasetApiList: [
            expect.objectContaining({
              seq: 1,
              apiId: 'selected-api',
              label: 'Selected API',
            }),
          ],
        }),
      })
    );
    expect(legacyApi.apiId).toBe(emptyValue);
    expect(legacyApi.label).toBe(emptyValue);
  }
);
