import { createDatasetField } from '../../util/dataset-field';
import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';
import { FieldTree, FormField } from '@angular/forms/signals';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { TranslatePipe } from '@ngx-translate/core';
import { GenericTableComponent } from '../../../../core/components/generic-table/generic-table.component';
import {
  GenericColumnType,
  GenericTableColumn,
  SelectColumn,
} from '../../../../core/model/generic-table';
import { toKeyValueArray } from '../../../../shared/util/helper';
import { DatasetField, DatasetFieldType } from '../../model';

@Component({
  selector: 'app-dataset-field-table',

  imports: [
    MatTableModule,
    FormField,
    MatButtonModule,
    TranslatePipe,
    CommonModule,
    MatIconModule,
    MatCheckboxModule,
    GenericTableComponent,
  ],
  templateUrl: './dataset-field-table.component.html',
})
export class DatasetFieldTableComponent {
  // inject
  // input
  readonly fields = input.required<FieldTree<DatasetField[]>>();
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

  readonly createRow = createDatasetField;
}
