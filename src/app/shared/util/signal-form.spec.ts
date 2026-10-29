import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { Component, inject, signal, viewChild } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, FormField } from '@angular/forms/signals';
import { TranslateModule } from '@ngx-translate/core';
import { of } from 'rxjs';
import { API_BASE_URL } from '../../core/tokens/api-base-url.token';
import { ChipSelectButtonComponent } from '../../core/components/chip-select-button/chip-select-button.component';
import { ApiConfigService } from '../../features/api-config/service/api-config.service';
import { DatabaseEditComponent } from '../../features/setting/components/database-edit/database-edit.component';
import { DatabaseConfig, DatabaseType } from '../../features/setting/model';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { PipelineListComponent } from '../../features/spider/components/pipeline-list/pipeline-list.component';
import { ValuePipelineFormService } from '../../features/spider/services/value-pipeline-form.service';
import { PositionType, ValuePipelineType } from '../../features/spider/model';
import { ThemeCustomTableComponent } from '../../features/theme/components/theme-custom-table/theme-custom-table.component';
import { ThemeCustomType } from '../../features/theme/models';
import { patchField } from './signal-form';
import { ThemeItemManageComponent } from '../../features/theme/components/theme-item-manage/theme-item-manage.component';
import { ThemeItemType } from '../../features/theme/models';
import { MessageBoxService } from '../../core/services/message-box.service';
import { EditGroupDatasetDataComponent } from '../../features/dataset/components/edit-group-dataset-data/edit-group-dataset-data.component';
import { GroupDatasetService } from '../../features/dataset/service/group-dataset.service';

@Component({
  imports: [PipelineListComponent],
  template: `<app-pipeline-list [fields]="fields" />`,
})
class PipelineHost {
  readonly factory = inject(ValuePipelineFormService);
  readonly model = signal([
    this.factory.createValuePipeline({ type: ValuePipelineType.INSERT }),
  ]);
  readonly fields = form(this.model);
  readonly list = viewChild.required(PipelineListComponent);
}

@Component({
  imports: [ChipSelectButtonComponent, FormField],
  template: `<app-chip-select-button
    [formField]="field"
    valueKey="id"
    labelKey="label"
    [options]="options()"
    [selectTable]="select" />`,
})
class ChipHost {
  readonly model = signal('first');
  readonly field = form(this.model);
  readonly options = signal([
    { id: 'first', label: 'First' },
    { id: 'second', label: 'Second' },
  ]);
  readonly select = () => of({ id: 'third', label: 'Third' });
  readonly chip = viewChild.required(ChipSelectButtonComponent);
}

describe('Signal form migration regressions', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TranslateModule.forRoot(),
        PipelineHost,
        ChipHost,
        ThemeCustomTableComponent,
        DatabaseEditComponent,
        ThemeItemManageComponent,
        EditGroupDatasetDataComponent,
      ],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: 'http://localhost' },
        { provide: ApiConfigService, useValue: { getAll: () => of([]) } },
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            isAdd: true,
            databaseConfig: {},
            databaseConfigList: [],
            groupName: 'group',
            primeValue: '',
          },
        },
        { provide: MatDialogRef, useValue: { close: vi.fn() } },
        { provide: MessageBoxService, useValue: { openI18N: () => of(true) } },
        {
          provide: GroupDatasetService,
          useValue: {
            getGroupDataset: () =>
              of({
                config: {
                  byKey: 'title',
                  groupDatasetFieldList: [
                    { key: 'title', label: 'Title', type: 'string' },
                  ],
                  groupDatasetScrapyList: [],
                },
              }),
          },
        },
      ],
    })
      .overrideComponent(ThemeCustomTableComponent, { set: { template: '' } })
      .overrideComponent(DatabaseEditComponent, { set: { template: '' } })
      .compileComponents();
  });

  it('binds nested pipeline fields and keeps their values when changing operation type', async () => {
    const fixture = TestBed.createComponent(PipelineHost);
    const host = fixture.componentInstance;
    host.fields[0].insertConfig.position().value.set(PositionType.NTH);
    await fixture.whenStable();
    const input: HTMLInputElement =
      fixture.nativeElement.querySelector('input[type=number]');
    input.value = '4';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.model()[0].insertConfig.index).toBe(4);
    host.fields[0].type().value.set(ValuePipelineType.FIXED_VALUE);
    await fixture.whenStable();
    const text: HTMLInputElement =
      fixture.nativeElement.querySelector('input.form-control');
    text.value = 'result';
    text.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(host.model()[0].fixedValue).toBe('result');
    expect(host.model()[0].insertConfig.index).toBe(4);
    host.list().onAdd();
    host.list().onDelete(0);
    await fixture.whenStable();
    expect(host.model()).toHaveLength(1);
    expect(host.model()[0].seq).toBe(0);
  });

  it('updates chip labels after external changes, selection and reset', async () => {
    const fixture = TestBed.createComponent(ChipHost);
    const host = fixture.componentInstance;
    await fixture.whenStable();
    expect(host.chip().displayLabel()).toBe('First');
    host.model.set('second');
    await fixture.whenStable();
    expect(host.chip().displayLabel()).toBe('Second');
    host.chip().openSelectTable();
    await fixture.whenStable();
    expect(host.model()).toBe('third');
    expect(host.chip().displayLabel()).toBe('Third');
    expect(host.field().touched()).toBe(true);
    host.field().reset('');
    await fixture.whenStable();
    expect(host.chip().displayLabel()).toBe('');
  });

  it('recomputes conditional theme validation and duplicate errors directly from the model', () => {
    const component = TestBed.createComponent(
      ThemeCustomTableComponent
    ).componentInstance;
    component.form.itemId().value.set('custom');
    component
      .fields()
      .value.set([component.createRow({ byKey: 'key', label: 'Label' })]);
    expect(component.fields[0].openUrl().invalid()).toBe(true);
    component.fields[0].type().value.set(ThemeCustomType.copyValue);
    expect(component.fields[0].openUrl().valid()).toBe(true);
    expect(component.fields[0].copyValue().invalid()).toBe(true);
    component.fields[0].copyValue().value.set('text');
    expect(component.form().valid()).toBe(true);
    component
      .fields()
      .value.update(rows => [
        ...rows,
        component.createRow({ byKey: 'key', label: 'Other' }),
      ]);
    expect(
      component
        .fields()
        .errors()
        .map(error => error.kind)
    ).toContain('duplicateByKey');
    component.fields().value.update(rows => rows.slice(0, 1));
    expect(component.form().valid()).toBe(true);
  });

  it('validates the database enum and preserves defaults while loading partial API data', () => {
    const component = TestBed.createComponent(
      DatabaseEditComponent
    ).componentInstance;
    const fields = component.form;
    const initial = structuredClone(component.formModel());
    patchField(fields, {
      configId: 'test',
      configName: 'Test',
      sqliteFilePath: '/db.sqlite',
    });
    expect(fields().valid()).toBe(true);
    expect(component.generateJdbcUrl()).toBe('jdbc:sqlite:/db.sqlite');
    fields.databaseType().value.set(DatabaseType.POSTGRESQL);
    expect(fields.host().invalid()).toBe(true);
    expect(fields.sqliteFilePath().valid()).toBe(true);
    patchField(fields, {
      host: 'localhost',
      port: 5432,
      databaseName: 'db',
      username: 'user',
      password: 'pass',
    });
    expect(fields().valid()).toBe(true);
    expect(component.generateJdbcUrl()).toBe(
      'jdbc:postgresql://localhost:5432/db'
    );
    expect(fields().value().description).toBe('');
    expect(fields().value().enabled).toBe(1);
    fields().reset(initial);
    expect(fields().value().databaseType).toBe(DatabaseType.SQLITE);
    expect(fields().invalid()).toBe(true);
  });

  it('clears a managed theme form to explicit defaults instead of retaining its loaded values', async () => {
    const model = signal({
      itemId: 'loaded',
      description: 'Description',
      json: [{ key: 'loaded' }],
    });
    const fields = TestBed.runInInjectionContext(() => form(model));
    const fixture = TestBed.createComponent(ThemeItemManageComponent);
    fixture.componentRef.setInput('form', fields);
    fixture.componentRef.setInput('type', ThemeItemType.CUSTOM);
    fixture.componentRef.setInput('resetValue', {
      itemId: '',
      description: '',
      json: [],
    });
    await fixture.whenStable();
    fixture.componentInstance.onClear();
    await fixture.whenStable();
    expect(model()).toEqual({ itemId: '', description: '', json: [] });
    expect(fields().dirty()).toBe(false);
  });

  it('renders API-defined fields and keeps edits and clearing in the signal model', async () => {
    const fixture = TestBed.createComponent(EditGroupDatasetDataComponent);
    await fixture.whenStable();
    // Locate the dynamic field through its generated Signal Forms name.
    const dynamic = Array.from(
      fixture.nativeElement.querySelectorAll('input')
    ).find((element: any) =>
      element.name.endsWith('title')
    ) as HTMLInputElement;
    expect(dynamic).toBeTruthy();
    dynamic.value = 'edited';
    dynamic.dispatchEvent(new Event('input', { bubbles: true }));
    await fixture.whenStable();
    expect(fixture.componentInstance.jsonModel()['title']).toBe('edited');
    fixture.componentInstance.clearField();
    await fixture.whenStable();
    expect(dynamic.value).toBe('');
  });
});
