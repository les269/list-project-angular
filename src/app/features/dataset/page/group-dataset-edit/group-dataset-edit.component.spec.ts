import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of } from 'rxjs';
import { SnackbarService } from '../../../../core/services/snackbar.service';
import { SelectTableService } from '../../../../core/services/select-table.service';
import { ApiConfigService } from '../../../api-config/service/api-config.service';
import { ReplaceValueMapService } from '../../../replace-value-map/service/replace-value-map.service';
import { ScrapyService } from '../../../spider/services/scrapy.service';
import { GroupDatasetService } from '../../service/group-dataset.service';
import { GroupDatasetConfigType, GroupDatasetFieldType } from '../../model';
import { GroupDatasetApiTableComponent } from '../../components/group-dataset-api-table/group-dataset-api-table.component';
import { GroupDatasetScrapyTableComponent } from '../../components/group-dataset-scrapy-table/group-dataset-scrapy-table.component';
import { GroupDatasetEditComponent } from './group-dataset-edit.component';

it('完整載入隱藏清單，切換資料來源保留編輯，儲存包含所有清單', async () => {
  const source = {
    groupName: 'group',
    config: {
      byKey: 'id',
      imageSaveFolder: '',
      type: GroupDatasetConfigType.scrapy,
      groupDatasetFieldList: [
        {
          seq: 1,
          key: 'id',
          label: 'ID',
          type: GroupDatasetFieldType.string,
          replaceValueMapName: '',
        },
      ],
      groupDatasetScrapyList: [
        {
          seq: 1,
          name: 'crawler',
          label: 'Crawler',
          isDefault: true,
          visibleJson: true,
          visibleUrl: false,
        },
      ],
      groupDatasetApiList: [{ seq: 1, apiName: 'api', label: 'API' }],
    },
  };
  const service = {
    getGroupDataset: vi.fn(() => of(source)),
    existGroupDataset: vi.fn(() => of(true)),
    updateGroupDataset: vi.fn(() => of(undefined)),
  };
  await TestBed.configureTestingModule({
    imports: [GroupDatasetEditComponent, TranslateModule.forRoot()],
    providers: [
      provideRouter([]),
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ name: 'group' })) },
      },
      { provide: GroupDatasetService, useValue: service },
      { provide: SnackbarService, useValue: { openI18N: vi.fn() } },
      { provide: SelectTableService, useValue: {} },
      { provide: ApiConfigService, useValue: { getAll: () => of([]) } },
      { provide: ScrapyService, useValue: { getAllConfig: () => of([]) } },
      {
        provide: ReplaceValueMapService,
        useValue: { getNameList: () => of([]) },
      },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(GroupDatasetEditComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  const component = fixture.componentInstance;
  expect(JSON.parse(JSON.stringify(component.form().value()))).toEqual(source);
  expect(component.form().dirty()).toBe(false);
  expect(
    fixture.debugElement.query(By.directive(GroupDatasetApiTableComponent))
  ).toBeNull();
  component.update(false, 'save');
  expect(
    JSON.parse(JSON.stringify(service.updateGroupDataset.mock.calls.at(-1)))
  ).toEqual([source]);
  component.form.config.groupDatasetScrapyList[0]
    .label()
    .value.set('Changed crawler');
  component.form.config.type().value.set(GroupDatasetConfigType.api);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(
    fixture.debugElement.query(By.directive(GroupDatasetScrapyTableComponent))
  ).toBeNull();
  component.form.config.groupDatasetApiList[0].label().value.set('Changed API');
  component.form.config.type().value.set(GroupDatasetConfigType.scrapy);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(component.form.config.groupDatasetScrapyList[0].label().value()).toBe(
    'Changed crawler'
  );
  component.form.config.type().value.set(GroupDatasetConfigType.api);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(component.form.config.groupDatasetApiList[0].label().value()).toBe(
    'Changed API'
  );
  component.update(false, 'save');
  expect(service.updateGroupDataset).toHaveBeenLastCalledWith(
    expect.objectContaining({
      config: expect.objectContaining({
        groupDatasetScrapyList: [
          expect.objectContaining({ label: 'Changed crawler' }),
        ],
        groupDatasetApiList: [
          expect.objectContaining({ label: 'Changed API' }),
        ],
      }),
    })
  );
  expect(source.config.groupDatasetScrapyList[0].label).toBe('Crawler');
});
