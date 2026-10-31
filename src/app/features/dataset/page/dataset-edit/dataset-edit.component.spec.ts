import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  ActivatedRoute,
  convertToParamMap,
  provideRouter,
} from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { API_BASE_URL } from '../../../../core/tokens/api-base-url.token';
import { DatasetConfigType } from '../../model';
import { DatasetFieldTableComponent } from '../../components/dataset-field-table/dataset-field-table.component';
import { DatasetEditComponent } from './dataset-edit.component';
import { DatasetService } from '../../service/dataset.service';
import { of } from 'rxjs';

describe('Dataset signal form validation', () => {
  it('reacts to configuration changes and includes nested table validation without subscriptions', async () => {
    await TestBed.configureTestingModule({
      imports: [DatasetEditComponent, TranslateModule.forRoot()],
      providers: [
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
    fixture.detectChanges();
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
    fields.config.autoImageDownload().value.set(true);
    expect(fields.config.imageByKey().invalid()).toBe(true);
    fields.config.imageByKey().value.set('image');
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
    imports: [DatasetEditComponent, TranslateModule.forRoot()],
    providers: [
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
      fieldList: [{ seq: 1, key: 'key', label: 'Label' }],
    },
  };
  vi.spyOn(service, 'findDataset').mockReturnValue(of(source as any));
  const fixture = TestBed.createComponent(DatasetEditComponent);
  fixture.detectChanges();
  await fixture.whenStable();
  const component = fixture.componentInstance;
  expect(component.form.config.fieldList[0].fixedString().value()).toBe('');
  expect(component.form().dirty()).toBe(false);
  expect(
    fixture.nativeElement.querySelectorAll('app-generic-table tbody tr').length
  ).toBeGreaterThan(0);
  component.form.config.fieldList[0].label().value.set('Edited');
  fixture.detectChanges();
  await fixture.whenStable();
  expect(component.form.config.fieldList[0].label().value()).toBe('Edited');
  expect(source.config.fieldList[0].label).toBe('Label');
  component.form.config.filePath().value.set('old');
  component.dataset.set({
    ...source,
    config: { ...source.config, fieldList: [] },
  } as any);
  fixture.detectChanges();
  await fixture.whenStable();
  expect(component.form.config.filePath().value()).toBe('');
  expect(component.form.config.fieldList().value()).toEqual([]);
});
