import { Component, inject, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DatasetField, DatasetFieldType } from '../../model';
import {
  ReactiveFormsModule,
  FormsModule,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslateModule } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
  ToFormArray,
} from '../../../../core/model/generic-table';
import { toKeyValueArray } from '../../../../shared/util/helper';

@Component({
  selector: 'app-dataset-field-table',
  standalone: true,
  imports: [
    MatTableModule,
    ReactiveFormsModule,
    FormsModule,
    MatButtonModule,
    TranslateModule,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    GenericTableComponent,
  ],
  templateUrl: './dataset-field-table.component.html',
})
export class DatasetFieldTableComponent {
  // inject
  readonly fb = inject(FormBuilder);
  // input
  readonly formArray = input.required<ToFormArray<DatasetField>>();
  readonly initData = input<DatasetField[]>();
  readonly eDatasetFieldType = DatasetFieldType;
  readonly displayedColumns = ['key', 'label', 'type'];
  readonly typeColumn = {
    key: 'type',
    label: 'dataset.type',
    columnType: GenericColumnType.select,
    data: toKeyValueArray(this.eDatasetFieldType),
    dataValue: 'key',
    dataLabel: item => `dataset.${item.key}`,
  } satisfies SelectColumn<{ key: string; value: string }>;
  readonly cols: GenericTableColumn[] = [
    {
      key: 'key',
      label: 'dataset.fieldKey',
      columnType: GenericColumnType.input,
    },
    {
      key: 'label',
      label: 'dataset.fieldLabel',
      columnType: GenericColumnType.input,
    },
    this.typeColumn,
  ];

  readonly createGroup = () => {
    return this.fb.group({
      seq: [0],
      type: [DatasetFieldType.path],
      key: ['', [Validators.required]],
      label: ['', [Validators.required]],
      fixedString: [''],
      replaceRegular: [''],
      replaceRegularTo: [''],
    });
  };
}
