import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { API_BASE_URL } from '../../../../core/tokens/api-base-url.token';
import { DatasetConfigType } from '../../model';
import { DatasetFieldTableComponent } from '../../components/dataset-field-table/dataset-field-table.component';
import { DatasetEditComponent } from './dataset-edit.component';
import { DatasetService } from '../../service/dataset.service';
import { of } from 'rxjs';

describe('Dataset signal form validation', () => {
  it('reacts to configuration changes and includes nested table validation without subscriptions', async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetEditComponent],
      providers: [
        provideTranslateService(),
        provideRouter([]),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost' },
      ],
    }).compileComponents();
    const fixture = TestBed.createComponent(DatasetEditComponent);
    const component = fixture.componentInstance;
    const fields = component.form;
    fields.name().value.set('dataset');
    fields.config.groupName().value.set('group');
    fields.config.type().value.set(DatasetConfigType.text);
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('app-signal-code-editor code-editor')
    ).not.toBeNull();
    expect(fields().valid()).toBe(true);
    fields.config.type().value.set(DatasetConfigType.file);
    expect(fields.config.filePath().invalid()).toBe(true);
    fields.config.filePath().value.set('/data/file.json');
    fields.config.filing().value.set(true);
    expect(fields.config.filingRegular().invalid()).toBe(true);
    fields.config.type().value.set(DatasetConfigType.all);
    expect(fields.config.filingRegular().valid()).toBe(true);
    const table = TestBed.createComponent(
      DatasetFieldTableComponent
    ).componentInstance;
    fields.config.fieldList().value.set([table.createRow()]);
    expect(fields().invalid()).toBe(true);
    fields.config.fieldList[0].key().value.set('key');
    fields.config.fieldList[0].label().value.set('label');
    expect(fields().valid()).toBe(true);
    const service = TestBed.inject(DatasetService);
    vi.spyOn(service, 'existDataset').mockReturnValue(of(false));
    const save = vi
      .spyOn(service, 'updateDataset')
      .mockReturnValue(of(undefined));
    component.update(false, 'save');
    expect(save).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'dataset',
        config: expect.objectContaining({
          fieldList: [expect.objectContaining({ key: 'key', label: 'label' })],
        }),
      })
    );
  });
});

it('載入資料時一次初始化欄位，編輯不被覆寫，重新載入清除缺少的舊值', async () => {
  await TestBed.configureTestingModule({
    imports: [DatasetEditComponent],
    providers: [
      provideTranslateService(),
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: 'http://localhost' },
      {
        provide: ActivatedRoute,
        useValue: { paramMap: of(convertToParamMap({ name: 'dataset' })) },
      },
    ],
  }).compileComponents();
  const service = TestBed.inject(DatasetService);
  const source = {
    name: 'dataset',
    config: {
      type: DatasetConfigType.text,
      groupName: 'group',
      scrapyText: 'loaded',
      autoImageDownload: true,
      imageByKey: 'legacy-image',
      fieldList: [{ seq: 1, key: 'key', label: 'Label' }],
    },
  };
  vi.spyOn(service, 'findDataset').mockReturnValue(of(source as any));
  const fixture = TestBed.createComponent(DatasetEditComponent);
  await fixture.whenStable();
  const component = fixture.componentInstance;
  expect(component.isEditMode).toBe(true);
  expect(
    fixture.nativeElement.querySelector(
      'app-signal-field[label="dataset.name"] input'
    ).disabled
  ).toBe(true);
  expect(
    fixture.nativeElement.querySelectorAll('.form-actions button')
  ).toHaveLength(2);
  expect(component.form.config.fieldList[0].fixedString().value()).toBe('');
  expect(component.form().value().config).not.toHaveProperty(
    'autoImageDownload'
  );
  expect(component.form().value().config).not.toHaveProperty('imageByKey');
  expect(source.config.autoImageDownload).toBe(true);
  vi.spyOn(service, 'existDataset').mockReturnValue(of(true));
  const save = vi
    .spyOn(service, 'updateDataset')
    .mockReturnValue(of(undefined));
  component.update(false, 'save');
  expect(save).toHaveBeenCalledTimes(1);
  expect(save.mock.calls[0][0].config).not.toHaveProperty('autoImageDownload');
  expect(save.mock.calls[0][0].config).not.toHaveProperty('imageByKey');

  expect(component.form().dirty()).toBe(false);
  expect(
    fixture.nativeElement.querySelectorAll('app-generic-table tbody tr').length
  ).toBeGreaterThan(0);
  component.form.config.fieldList[0].label().value.set('Edited');
  await fixture.whenStable();
  expect(component.form.config.fieldList[0].label().value()).toBe('Edited');
  expect(source.config.fieldList[0].label).toBe('Label');
  component.form.config.filePath().value.set('old');
  component.dataset.set({
    ...source,
    config: { ...source.config, fieldList: [] },
  } as any);
  await fixture.whenStable();
  expect(component.form.config.filePath().value()).toBe('');
  expect(component.form.config.fieldList().value()).toEqual([]);
});

it('透過共用選單切換來源時保留條件欄位與歸檔清除行為', async () => {
  await TestBed.configureTestingModule({
    imports: [DatasetEditComponent],
    providers: [
      provideTranslateService(),
      provideRouter([]),
      provideHttpClient(),
      provideHttpClientTesting(),
      { provide: API_BASE_URL, useValue: 'http://localhost' },
    ],
  }).compileComponents();
  const fixture = TestBed.createComponent(DatasetEditComponent);
  const component = fixture.componentInstance;
  component.form.config.type().value.set(DatasetConfigType.file);
  component.form.config.filing().value.set(true);
  component.form.config.filingRegular().value.set('old-pattern');
  await fixture.whenStable();
  const page: HTMLElement = fixture.nativeElement;
  const select = page.querySelector<HTMLSelectElement>(
    'app-signal-field[label="dataset.filterType"] select'
  )!;
  expect(
    page.querySelector('app-signal-field[label="dataset.filePath"]')
  ).not.toBeNull();
  select.value = DatasetConfigType.all;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change'));
  await fixture.whenStable();
  expect(component.configType).toBe(DatasetConfigType.all);
  expect(component.filingControl().value()).toBe(false);
  expect(component.filingRegularControl().value()).toBe('');
  expect(
    page.querySelector('app-signal-field[label="dataset.filePath"]')
  ).toBeNull();

  expect(
    page.querySelector('app-signal-field[label="dataset.imageByKey"]')
  ).toBeNull();
  expect(component.form().value().config).not.toHaveProperty(
    'autoImageDownload'
  );
  expect(component.form().value().config).not.toHaveProperty('imageByKey');

  select.value = DatasetConfigType.pagination;
  select.dispatchEvent(new Event('input', { bubbles: true }));
  select.dispatchEvent(new Event('change'));
  await fixture.whenStable();
  expect(component.scrapyPaginationControl().invalid()).toBe(true);
  expect(
    page.querySelector('[aria-labelledby="dataset-pagination-label"]')
  ).not.toBeNull();
});
